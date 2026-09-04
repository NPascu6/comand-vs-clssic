using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace Atlas.Api.Tests;

// The store is swapped for one on a throw-away folder seeded with en/de, so every test starts from the same disk.
public sealed class I18nEndpointsTests : IDisposable
{
    private const string AnyBody = """{ "value": "X", "toVersion": 1, "actor": "pm.alice" }""";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private readonly string _folder = Path.Combine(Path.GetTempPath(), "atlas-i18n-tests", Guid.NewGuid().ToString("N"));
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public I18nEndpointsTests()
    {
        Directory.CreateDirectory(_folder);
        File.WriteAllText(Path.Combine(_folder, "en.json"), """{ "name": "English", "version": 1, "entries": { "hier.back": "Back", "hier.cap": "Cap" } }""");
        File.WriteAllText(Path.Combine(_folder, "de.json"), """{ "name": "Deutsch", "version": 1, "entries": { "hier.back": "Zurück" } }""");

        // Registered after Program's own store, so this one wins when the endpoints resolve it.
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(host =>
            host.ConfigureServices(services => services.AddSingleton(new I18nStore(_folder))));
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
        Directory.Delete(_folder, recursive: true);
    }

    private bool AuditExists => File.Exists(Path.Combine(_folder, "_audit.jsonl"));

    private Task<HttpResponseMessage> Send(string method, string url, string json = AnyBody, string? ifMatch = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Parse(method), url);
        if (method != "GET")
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        if (ifMatch is not null)
            request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
        return _client.SendAsync(request);
    }

    private Task<HttpResponseMessage> PutEntry(string code, string key, string value, string? ifMatch = null) =>
        Send("PUT", $"/api/i18n/{code}/entries/{key}", $$"""{ "value": "{{value}}", "actor": "pm.alice" }""", ifMatch);

    private static async Task<JsonElement> Body(HttpResponseMessage response) =>
        JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

    private static async Task<JsonElement> Body(Task<HttpResponseMessage> response) => await Body(await response);

    private static async Task AssertError(HttpResponseMessage response, HttpStatusCode status, string? contains = null)
    {
        Assert.Equal(status, response.StatusCode);
        var error = (await Body(response)).GetProperty("error").GetString();
        Assert.False(string.IsNullOrEmpty(error));
        if (contains is not null)
            Assert.Contains(contains, error);
    }

    private static IEnumerable<string> Names(JsonElement element) => element.EnumerateObject().Select(property => property.Name);

    [Fact]
    public async Task Literal_routes_are_not_captured_by_the_code_route()
    {
        var locales = await Body(_client.GetAsync("/api/i18n/locales"));
        var config = await Body(_client.GetAsync("/api/i18n/config"));
        var audit = await Body(_client.GetAsync("/api/i18n/audit"));

        Assert.Equal(["en", "de"], locales.EnumerateArray().Select(locale => locale.GetProperty("code").GetString()));
        Assert.Equal("en", config.GetProperty("defaultCode").GetString());
        Assert.Equal(JsonValueKind.Array, audit.ValueKind);
    }

    [Theory]
    [InlineData("GET", "/api/i18n/EN")]
    [InlineData("GET", "/api/i18n/eng/versions")]
    [InlineData("GET", "/api/i18n/pt-br/versions/1")]
    [InlineData("PUT", "/api/i18n/EN/entries/hier.back")]
    [InlineData("DELETE", "/api/i18n/e/entries/hier.back")]
    [InlineData("POST", "/api/i18n/_config/rollback")]
    public async Task A_malformed_code_is_400_on_every_code_route(string method, string url)
    {
        await AssertError(await Send(method, url), HttpStatusCode.BadRequest, "Locale code");
        Assert.False(AuditExists);
    }

    [Theory]
    [InlineData("PUT", "/api/i18n/de/entries/Bad.Key")]
    [InlineData("DELETE", "/api/i18n/de/entries/a..b")]
    public async Task A_malformed_key_is_400(string method, string url)
    {
        await AssertError(await Send(method, url), HttpStatusCode.BadRequest, "Key");
        Assert.False(AuditExists);
    }

    [Fact]
    public async Task Unknown_locale_key_and_version_are_404_with_an_error()
    {
        await AssertError(await Send("GET", "/api/i18n/es"), HttpStatusCode.NotFound);
        await AssertError(await Send("GET", "/api/i18n/de?version=9"), HttpStatusCode.NotFound);
        await AssertError(await Send("GET", "/api/i18n/es/versions"), HttpStatusCode.NotFound);
        await AssertError(await Send("GET", "/api/i18n/de/versions/9"), HttpStatusCode.NotFound);
        await AssertError(await Send("PUT", "/api/i18n/es/entries/hier.back"), HttpStatusCode.NotFound);
        await AssertError(await Send("DELETE", "/api/i18n/de/entries/hier.cap"), HttpStatusCode.NotFound);
        await AssertError(await Send("POST", "/api/i18n/de/rollback", """{ "toVersion": 9, "actor": "pm.alice" }"""), HttpStatusCode.NotFound);
        Assert.False(AuditExists);
    }

    [Fact]
    public async Task A_body_that_is_not_json_is_415_and_no_body_is_400()
    {
        var request = new HttpRequestMessage(HttpMethod.Put, "/api/i18n/de/entries/hier.back")
        {
            Content = new StringContent("value=X&actor=pm.alice", Encoding.UTF8, "text/plain"),
        };

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, (await _client.SendAsync(request)).StatusCode);
        await AssertError(await _client.PutAsync("/api/i18n/de/entries/hier.back", null), HttpStatusCode.BadRequest, "Body must be");
        Assert.False(AuditExists);
    }

    [Theory]
    [InlineData("1", HttpStatusCode.OK)]
    [InlineData("\"1\"", HttpStatusCode.OK)]
    [InlineData("W/\"1\"", HttpStatusCode.OK)]
    [InlineData("*", HttpStatusCode.OK)]
    [InlineData("3", HttpStatusCode.Conflict)]
    [InlineData("\"3\"", HttpStatusCode.Conflict)]
    [InlineData("abc", HttpStatusCode.BadRequest)]
    [InlineData("\"\"", HttpStatusCode.BadRequest)]
    [InlineData("0", HttpStatusCode.BadRequest)]
    public async Task IfMatch_is_read_bare_quoted_weak_or_star(string ifMatch, HttpStatusCode expected)
    {
        var response = await PutEntry("de", "hier.back", "X", ifMatch);

        Assert.Equal(expected, response.StatusCode);
        Assert.Equal(expected == HttpStatusCode.OK, AuditExists);
    }

    [Fact]
    public async Task A_stale_IfMatch_is_409_with_the_current_version_and_writes_nothing()
    {
        var response = await PutEntry("de", "hier.back", "X", ifMatch: "\"3\"");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await Body(response);
        Assert.Equal(["error", "currentVersion"], Names(body));
        Assert.Equal(1, body.GetProperty("currentVersion").GetInt32());

        Assert.False(AuditExists);
        var catalog = await _client.GetFromJsonAsync<Catalog>("/api/i18n/de", Json);
        Assert.Equal(1, catalog!.Version);
        Assert.Equal("Zurück", catalog.Entries["hier.back"]);
    }

    [Fact]
    public async Task Two_concurrent_writes_with_the_same_IfMatch_yield_one_200_and_one_409()
    {
        var responses = await Task.WhenAll(
            PutEntry("de", "hier.back", "A", ifMatch: "\"1\""),
            PutEntry("de", "hier.back", "B", ifMatch: "\"1\""));

        Assert.Equal([HttpStatusCode.OK, HttpStatusCode.Conflict], responses.Select(response => response.StatusCode).Order());

        var catalog = await _client.GetFromJsonAsync<Catalog>("/api/i18n/de", Json);
        Assert.Equal(2, catalog!.Version);
        Assert.Equal(2, File.ReadAllLines(Path.Combine(_folder, "_audit.jsonl")).Length); // seed + the one write
    }

    [Fact]
    public async Task Set_then_rollback_mints_versions_and_the_audit_names_both()
    {
        Assert.Equal(HttpStatusCode.OK, (await PutEntry("de", "hier.back", "A", "\"1\"")).StatusCode);   // v2
        Assert.Equal(HttpStatusCode.OK, (await PutEntry("de", "hier.back", "B", "\"2\"")).StatusCode);   // v3

        var rollback = await Send("POST", "/api/i18n/de/rollback", """{ "toVersion": 2, "actor": "pm.bob", "reason": "revert B" }""", ifMatch: "\"3\"");
        Assert.Equal(HttpStatusCode.OK, rollback.StatusCode);
        var result = await Body(rollback);
        Assert.Equal(["code", "version", "restoredFrom"], Names(result));
        Assert.Equal(4, result.GetProperty("version").GetInt32());
        Assert.Equal(2, result.GetProperty("restoredFrom").GetInt32());

        var catalog = await _client.GetFromJsonAsync<Catalog>("/api/i18n/de", Json);
        Assert.Equal("A", catalog!.Entries["hier.back"]);
        Assert.Equal("Cap", catalog.Entries["hier.cap"]); // still merged over en

        var versions = await Body(_client.GetAsync("/api/i18n/de/versions"));
        Assert.Equal([4, 3, 2, 1], versions.EnumerateArray().Select(element => element.GetProperty("version").GetInt32()));

        var audit = await Body(_client.GetAsync("/api/i18n/audit?locale=de&limit=1"));
        var line = Assert.Single(audit.EnumerateArray());
        Assert.Equal("rollback", line.GetProperty("action").GetString());
        Assert.Equal("3", line.GetProperty("before").GetString());
        Assert.Equal("2", line.GetProperty("after").GetString());
    }

    [Fact]
    public async Task Rolling_back_to_the_current_version_is_400()
    {
        var response = await Send("POST", "/api/i18n/de/rollback", """{ "toVersion": 1, "actor": "pm.alice" }""");

        await AssertError(response, HttpStatusCode.BadRequest, "already the current version");
        Assert.False(AuditExists);
    }

    [Fact]
    public async Task The_wire_is_camelCase_with_lowercase_actions_and_utc_timestamps()
    {
        var change = await Body(PutEntry("de", "hier.back", "X"));
        Assert.Equal(["code", "version", "key", "before", "after"], Names(change));

        var audit = (await Body(_client.GetAsync("/api/i18n/audit?locale=de"))).EnumerateArray().ToList();
        Assert.Equal(["set", "create"], audit.Select(line => line.GetProperty("action").GetString()));
        Assert.Equal(["id", "timestamp", "actor", "locale", "version", "action", "key", "before", "after", "reason"], Names(audit[0]));

        var timestamp = audit[0].GetProperty("timestamp").GetString()!;
        Assert.EndsWith("Z", timestamp);
        Assert.Equal(DateTimeKind.Utc, DateTime.Parse(timestamp, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind).Kind);
        Assert.Equal(timestamp, audit[1].GetProperty("timestamp").GetString()); // seed and change share one clock reading

        var versions = (await Body(_client.GetAsync("/api/i18n/de/versions"))).EnumerateArray().ToList();
        Assert.Equal(["version", "createdAt", "actor", "action", "reason", "changedKeys"], Names(versions[0]));
        Assert.Equal(["set", "create"], versions.Select(element => element.GetProperty("action").GetString()));
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-5")]
    public async Task An_audit_limit_below_1_is_400(string limit) =>
        await AssertError(await Send("GET", $"/api/i18n/audit?limit={limit}"), HttpStatusCode.BadRequest, "limit");

    [Fact]
    public async Task An_audit_limit_above_the_cap_is_accepted()
    {
        Assert.Equal(HttpStatusCode.OK, (await Send("GET", "/api/i18n/audit?limit=5000")).StatusCode);
    }

    [Fact]
    public async Task Config_must_list_every_catalog_on_disk_and_is_audited()
    {
        const string englishLocale = """{ "code": "en", "name": "English", "enabled": true, "fallbackCode": null }""";
        const string germanLocale = """{ "code": "de", "name": "Deutsch", "enabled": false, "fallbackCode": "en" }""";

        var partial = await Send("PUT", "/api/i18n/config", $$"""{ "config": { "defaultCode": "en", "locales": [ {{englishLocale}} ] }, "actor": "admin" }""");
        await AssertError(partial, HttpStatusCode.BadRequest, "Locale 'de' must be listed");
        Assert.False(AuditExists);

        var full = await Send("PUT", "/api/i18n/config", $$"""{ "config": { "defaultCode": "en", "locales": [ {{englishLocale}}, {{germanLocale}} ] }, "actor": "admin", "reason": "hide de" }""");
        Assert.Equal(HttpStatusCode.OK, full.StatusCode);

        var locales = await Body(_client.GetAsync("/api/i18n/locales"));
        Assert.Equal(["en"], locales.EnumerateArray().Select(locale => locale.GetProperty("code").GetString()));

        var audit = await Body(_client.GetAsync("/api/i18n/audit"));
        var line = Assert.Single(audit.EnumerateArray());
        Assert.Equal("config", line.GetProperty("action").GetString());
        Assert.Equal("hide de", line.GetProperty("reason").GetString());
    }
}
