using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;

namespace Atlas.Api.Tests;

// Each test builds its own host so a setting cannot leak into the next.
public sealed class HostTests : IDisposable
{
    private readonly string _folder = Path.Combine(Path.GetTempPath(), "atlas-host-tests", Guid.NewGuid().ToString("N"));
    private readonly List<WebApplicationFactory<Program>> _factories = [];

    public void Dispose()
    {
        foreach (var factory in _factories)
            factory.Dispose();
        if (Directory.Exists(_folder))
            Directory.Delete(_folder, recursive: true);
    }

    private HttpClient Client(params (string Key, string Value)[] settings) =>
        Client(Environments.Development, settings);

    // The environment decides which appsettings.*.json is layered on top.
    private HttpClient Client(string environment, params (string Key, string Value)[] settings)
    {
        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(host =>
        {
            host.UseEnvironment(environment);
            foreach (var (key, value) in settings)
                host.UseSetting(key, value);
        });
        _factories.Add(factory);
        return factory.CreateClient();
    }

    private static async Task<(HttpStatusCode Status, string? AllowedOrigin)> Get(HttpClient client, string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/healthz");
        request.Headers.Add("Origin", origin);
        var response = await client.SendAsync(request);
        var allowed = response.Headers.TryGetValues("Access-Control-Allow-Origin", out var values) ? values.Single() : null;
        return (response.StatusCode, allowed);
    }

    private static async Task<string?> AllowedOrigin(HttpClient client, string origin) =>
        (await Get(client, origin)).AllowedOrigin;

    [Fact]
    public async Task Healthz_is_200_with_a_json_status()
    {
        var response = await Client().GetAsync("/healthz");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.Equal("ok", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task The_I18n_folder_setting_is_honoured_and_seeded_from_the_bundled_catalogs()
    {
        var client = Client(("I18n:Folder", _folder));

        var locales = JsonDocument.Parse(await client.GetStringAsync("/api/i18n/locales")).RootElement;

        Assert.Equal(["en", "de", "fr"], locales.EnumerateArray().Select(locale => locale.GetProperty("code").GetString()));
        Assert.True(File.Exists(Path.Combine(_folder, "_config.json")));
    }

    [Fact]
    public async Task Cors_allows_the_configured_origins_and_no_other()
    {
        var client = Client(Environments.Production, ("Cors:Origins:0", "https://app.example.test"));

        Assert.Equal("https://app.example.test", await AllowedOrigin(client, "https://app.example.test"));
        Assert.Null(await AllowedOrigin(client, "https://elsewhere.example.test"));
        // Array settings merge by index: a localhost default would survive the override.
        Assert.Null(await AllowedOrigin(client, "http://localhost:4173"));
    }

    [Fact]
    public async Task Cors_in_Development_allows_the_local_web_servers()
    {
        var client = Client(Environments.Development);

        Assert.Equal("http://localhost:5173", await AllowedOrigin(client, "http://localhost:5173"));
        Assert.Equal("http://localhost:4173", await AllowedOrigin(client, "http://localhost:4173"));
    }

    [Fact]
    public async Task Cors_without_origins_sends_no_headers_and_still_serves()
    {
        var client = Client(Environments.Production);

        var (status, allowed) = await Get(client, "http://localhost:5173");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Null(allowed);
    }
}
