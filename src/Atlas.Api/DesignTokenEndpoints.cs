using System.Globalization;
using System.Text;
using Atlas.DesignTokens;
using Atlas.Upstream.Contracts;

namespace Atlas.Api;

// Wire contract: web/packages/design-tokens/README.md, "Backend token contract".
//
// The values come from Atlas.DesignTokens, generated from the same Figma export the web app
// builds its MUI theme from. There is no write side on purpose: tokens are edited in Figma and
// versioned by the sync in git (figma/tokens.lock.json), not mutated through an API. That is the
// difference from the translation store, where the edits are made by people using the product.
public static class DesignTokenEndpoints
{
    public static IEndpointRouteBuilder MapDesignTokens(this IEndpointRouteBuilder app)
    {
        var tokens = app.MapGroup("/api/design-tokens");

        tokens.MapGet("/", () => Results.Ok(new TokenCatalog(Tokens.Version, Tokens.Modes)))
            .WithName("GetDesignTokenCatalog")
            .WithSummary("The token version and the modes an application may ask for.")
            .Produces<TokenCatalog>();

        tokens.MapGet("/{mode}", (HttpContext http, string mode) =>
        {
            if (!Tokens.Has(mode))
                return Results.NotFound(new { error = $"no tokens for mode '{mode}'" });

            // The version is the whole contract's identity: a client caches until the next release.
            if (NotModified(http)) return Results.StatusCode(StatusCodes.Status304NotModified);
            var theme = Tokens.For(mode);
            return Results.Ok(new TokenSet(Tokens.Version, theme.Mode, theme.Values));
        })
            .AddEndpointFilter(Tagged)
            .WithName("GetDesignTokens")
            .WithSummary("Every token of one mode, flat, as `path -> value`. The same bundle generated/tokens.json holds.")
            .Produces<TokenSet>()
            .Produces(StatusCodes.Status304NotModified)
            .Produces(StatusCodes.Status404NotFound);

        tokens.MapGet("/{mode}/funds/{fundId}/exposure.svg", (string mode, string fundId) =>
        {
            if (!Tokens.Has(mode))
                return Results.NotFound(new { error = $"no tokens for mode '{mode}'" });

            var seed = SeedData.Build();
            if (!seed.ExposureByFund.TryGetValue(fundId, out var exposure))
                return Results.NotFound(new { error = $"no exposure for fund '{fundId}'" });

            var fund = seed.Funds.GetValueOrDefault(fundId);
            var svg = ExposureFactsheet.Render(Tokens.For(mode), fund?.Name ?? fundId, fund?.Status, exposure);
            return Results.Text(svg, "image/svg+xml", Encoding.UTF8);
        })
            .WithName("GetFundExposureFactsheet")
            .WithSummary("A fund's committed capital by asset class, rendered on the server with the same tokens the browser paints with.")
            .Produces<string>(StatusCodes.Status200OK, "image/svg+xml")
            .Produces(StatusCodes.Status404NotFound);

        return app;
    }

    private static bool NotModified(HttpContext http) =>
        http.Request.Headers.IfNoneMatch.Any(tag => tag == Tag);

    private static async ValueTask<object?> Tagged(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        context.HttpContext.Response.Headers.ETag = Tag;
        context.HttpContext.Response.Headers.CacheControl = "public, max-age=60";
        return await next(context);
    }

    private static string Tag => $"\"{Tokens.Version}\"";
}

public sealed record TokenCatalog(string Version, IReadOnlyList<string> Modes);

public sealed record TokenSet(string Version, string Mode, IReadOnlyDictionary<string, string> Tokens);

/// <summary>
/// The proof that the backend paints with the design system rather than with its own copy of it:
/// a chart the API renders, coloured by <see cref="ThemeTokens.Colour(AssetClass)"/> and
/// <see cref="ThemeTokens.Status(FundStatus)"/>. A PDF factsheet, an XLSX export or an email
/// template reads the same tokens the same way.
/// </summary>
internal static class ExposureFactsheet
{
    private const int Width = 520;
    private const int BarHeight = 26;

    public static string Render(ThemeTokens theme, string fundName, FundStatus? status, ExposureSnapshot exposure)
    {
        var buckets = Enum.GetValues<AssetClass>()
            .Select(assetClass => (
                AssetClass: assetClass,
                Committed: Enum.GetValues<Region>().Sum(region => exposure.CommittedIn(assetClass, region))))
            .Where(bucket => bucket.Committed > 0)
            .OrderByDescending(bucket => bucket.Committed)
            .ToList();

        var largest = buckets.Count == 0 ? 1m : buckets.Max(bucket => bucket.Committed);
        var height = 96 + buckets.Count * (BarHeight + 10);
        var radius = theme.Number("radius.surface").ToString(CultureInfo.InvariantCulture);
        var svg = new StringBuilder();

        svg.Append(CultureInfo.InvariantCulture, $"""<svg xmlns="http://www.w3.org/2000/svg" width="{Width}" height="{height}" viewBox="0 0 {Width} {height}" font-family="{Escape(theme["font.sans"])}">""");
        svg.Append(CultureInfo.InvariantCulture, $"""<rect width="{Width}" height="{height}" rx="{radius}" fill="{theme["background.paper"]}" stroke="{theme["border.color"]}" stroke-width="{theme.Number("border.width").ToString(CultureInfo.InvariantCulture)}"/>""");
        svg.Append(CultureInfo.InvariantCulture, $"""<text x="20" y="34" font-size="15" font-weight="600" fill="{theme["text.primary"]}">{Escape(fundName)}</text>""");

        if (status is { } fundStatus)
        {
            svg.Append(CultureInfo.InvariantCulture, $"""<rect x="20" y="46" width="86" height="18" rx="6" fill="{theme.Status(fundStatus)}"/>""");
            svg.Append(CultureInfo.InvariantCulture, $"""<text x="63" y="59" font-size="10" font-weight="600" text-anchor="middle" fill="{theme["background.paper"]}">{fundStatus.ToString().ToUpperInvariant()}</text>""");
        }

        svg.Append(CultureInfo.InvariantCulture, $"""<text x="{Width - 20}" y="34" font-size="13" text-anchor="end" fill="{theme.Performance(exposure.TotalCommitted)}">{Money(exposure.TotalCommitted)} committed</text>""");

        var y = 84;
        foreach (var (assetClass, committed) in buckets)
        {
            var barWidth = (int)decimal.Round(committed / largest * 300m);
            svg.Append(CultureInfo.InvariantCulture, $"""<text x="20" y="{y + 17}" font-size="11" fill="{theme["text.secondary"]}">{Spaced(assetClass)}</text>""");
            svg.Append(CultureInfo.InvariantCulture, $"""<rect x="160" y="{y}" width="{barWidth}" height="{BarHeight}" rx="4" fill="{theme.Colour(assetClass)}"/>""");
            svg.Append(CultureInfo.InvariantCulture, $"""<text x="{170 + barWidth}" y="{y + 17}" font-size="11" fill="{theme["text.primary"]}">{Money(committed)}</text>""");
            y += BarHeight + 10;
        }

        svg.Append("</svg>");
        return svg.ToString();
    }

    private static string Money(decimal amount) => $"EUR {amount / 1_000_000m:0.#}m";

    private static string Spaced(AssetClass assetClass) =>
        string.Concat(assetClass.ToString().Select((character, index) =>
            index > 0 && char.IsUpper(character) ? $" {character}" : character.ToString()));

    private static string Escape(string value) =>
        value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
}
