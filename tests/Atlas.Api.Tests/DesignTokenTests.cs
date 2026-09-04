using System.Net;
using System.Net.Http.Json;
using Atlas.DesignTokens;
using Atlas.Upstream.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Atlas.Api.Tests;

// The point of the generated package: the server paints with the design system, not with a
// second copy of it that drifts. These tests hold the two together.
public sealed class DesignTokenTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Factsheet = "/funds/PF-GLOBAL-MULTI/exposure.svg";

    private readonly HttpClient _client;

    public DesignTokenTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public void Every_domain_state_has_a_colour_in_every_mode()
    {
        foreach (var mode in Tokens.Modes)
        {
            var theme = Tokens.For(mode);

            foreach (var status in Enum.GetValues<FundStatus>()) Assert.StartsWith("#", theme.Status(status));
            foreach (var status in Enum.GetValues<DealStatus>()) Assert.StartsWith("#", theme.Status(status));
            foreach (var status in Enum.GetValues<CoInvestmentStatus>()) Assert.StartsWith("#", theme.Status(status));
            foreach (var assetClass in Enum.GetValues<AssetClass>()) Assert.StartsWith("#", theme.Colour(assetClass));
            foreach (var region in Enum.GetValues<Region>()) Assert.StartsWith("#", theme.Colour(region));
            Assert.Equal(8, theme.Series.Count);
        }
    }

    [Fact]
    public void The_vocabulary_is_the_palette_it_aliases_not_a_second_set_of_hexes()
    {
        foreach (var mode in Tokens.Modes)
        {
            var theme = Tokens.For(mode);

            Assert.Equal(theme["success.main"], theme.Status(DealStatus.Investable));
            Assert.Equal(theme["error.main"], theme.Status(DealStatus.Withdrawn));
            Assert.Equal(theme["semantic.series.1"], theme.Colour(AssetClass.PrivateEquity));
        }

        // Each mode carries its own, so the vocabulary is not one set of colours reused.
        Assert.NotEqual(Tokens.For("light").Status(DealStatus.Investable), Tokens.For("dark").Status(DealStatus.Investable));
    }

    [Fact]
    public void Component_tokens_arrive_resolved_because_a_document_has_no_theme_to_resolve_against()
    {
        var light = Tokens.For("light");
        var dark = Tokens.For("dark");

        // component.header.borderColor is the palette path {color.divider} in the TypeScript theme;
        // here it must already be that mode's hex.
        Assert.Equal(light["divider"], light["component.header.borderColor"]);
        Assert.Equal(dark["divider"], dark["component.header.borderColor"]);
        Assert.NotEqual(light["component.header.borderColor"], dark["component.header.borderColor"]);
        Assert.Equal(64d, light.Number("component.header.height"));
    }

    [Fact]
    public void Performance_and_exposure_read_the_number_rather_than_a_hard_coded_hex()
    {
        var theme = Tokens.For();

        Assert.Equal(theme["semantic.performance.positive"], theme.Performance(2.4m));
        Assert.Equal(theme["semantic.performance.negative"], theme.Performance(-0.1m));
        Assert.Equal(theme["semantic.performance.flat"], theme.Performance(0m));
        Assert.Equal(theme["semantic.exposure.withinAppetite"], theme.Exposure(committed: 10m, limit: 100m));
        Assert.Equal(theme["semantic.exposure.approaching"], theme.Exposure(committed: 95m, limit: 100m));
        Assert.Equal(theme["semantic.exposure.breach"], theme.Exposure(committed: 101m, limit: 100m));
    }

    [Fact]
    public void An_unknown_mode_or_token_says_which_one()
    {
        Assert.Contains("sepia", Assert.Throws<KeyNotFoundException>(() => Tokens.For("sepia")).Message);
        Assert.Contains("not.a.token", Assert.Throws<KeyNotFoundException>(() => Tokens.For()["not.a.token"]).Message);
    }

    [Fact]
    public async Task The_catalog_lists_the_modes_an_application_may_ask_for()
    {
        var catalog = await _client.GetFromJsonAsync<TokenCatalog>("/api/design-tokens");

        Assert.NotNull(catalog);
        Assert.Equal(Tokens.Version, catalog.Version);
        Assert.Equal(Tokens.Modes, catalog.Modes);
    }

    [Fact]
    public async Task A_mode_serves_the_same_values_the_package_holds()
    {
        var served = await _client.GetFromJsonAsync<TokenSet>("/api/design-tokens/dark");
        var theme = Tokens.For("dark");

        Assert.NotNull(served);
        Assert.Equal(theme.Values, served.Tokens);
        Assert.Equal(theme.Status(DealStatus.Investable), served.Tokens["semantic.status.deal.investable"]);
    }

    [Fact]
    public async Task The_version_is_the_cache_identity()
    {
        var tag = "\"" + Tokens.Version + "\"";
        var first = await _client.GetAsync("/api/design-tokens/light");
        Assert.Equal(tag, first.Headers.ETag?.ToString());

        _client.DefaultRequestHeaders.IfNoneMatch.ParseAdd(tag);
        Assert.Equal(HttpStatusCode.NotModified, (await _client.GetAsync("/api/design-tokens/light")).StatusCode);
    }

    [Fact]
    public async Task An_unknown_mode_is_a_404()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync("/api/design-tokens/sepia")).StatusCode);
    }

    [Fact]
    public async Task A_server_rendered_factsheet_is_painted_with_the_mode_it_was_asked_for()
    {
        var response = await _client.GetAsync("/api/design-tokens/dark" + Factsheet);
        var svg = await response.Content.ReadAsStringAsync();
        var dark = Tokens.For("dark");

        Assert.Equal("image/svg+xml", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains(dark.Colour(AssetClass.PrivateEquity), svg);
        Assert.Contains(dark.Status(FundStatus.Open), svg);
        Assert.Contains(dark["text.primary"], svg);

        // The same fund in light is the same chart in the other palette.
        var light = await (await _client.GetAsync("/api/design-tokens/light" + Factsheet)).Content.ReadAsStringAsync();
        Assert.Contains(Tokens.For("light")["text.primary"], light);
        Assert.DoesNotContain(dark["text.primary"], light);
    }

    [Fact]
    public async Task A_fund_with_no_exposure_is_a_404()
    {
        var response = await _client.GetAsync("/api/design-tokens/light/funds/PF-NOPE/exposure.svg");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
