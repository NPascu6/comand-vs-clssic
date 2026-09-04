using System.Globalization;
using Atlas.Upstream.Contracts;

namespace Atlas.DesignTokens;

/// <summary>
/// One mode of the theme. The indexer reaches any token by its path; the typed members are the
/// domain vocabulary, so server-rendered output colours a state by asking what the state is
/// rather than by repeating a hex the designer may have moved.
/// </summary>
public sealed class ThemeTokens
{
    private readonly IReadOnlyDictionary<string, string> _values;

    internal ThemeTokens(string mode, IReadOnlyDictionary<string, string> values)
    {
        Mode = mode;
        _values = values;
        Series = [.. Enumerable.Range(1, 8).Select(index => this[$"semantic.series.{index}"])];
    }

    public string Mode { get; }

    /// <summary>Every token of this mode, the mode-independent and component ones included.</summary>
    public IReadOnlyDictionary<string, string> Values => _values;

    /// <summary>Categorical chart colours, in order, for a series with no domain meaning.</summary>
    public IReadOnlyList<string> Series { get; }

    public string this[string path] => _values.TryGetValue(path, out var value)
        ? value
        : throw new KeyNotFoundException($"design token '{path}' is not defined for {Mode}");

    public bool TryGet(string path, out string value) => _values.TryGetValue(path, out value!);

    /// <summary>A numeric token — a radius, a border width, a component height.</summary>
    public double Number(string path) => double.Parse(this[path], CultureInfo.InvariantCulture);

    public string Status(FundStatus status) => this[$"semantic.status.fund.{Camel(status)}"];

    public string Status(DealStatus status) => this[$"semantic.status.deal.{Camel(status)}"];

    public string Status(CoInvestmentStatus status) => this[$"semantic.status.coInvestment.{Camel(status)}"];

    public string Colour(AssetClass assetClass) => this[$"semantic.assetClass.{Camel(assetClass)}"];

    public string Colour(Region region) => this[$"semantic.region.{Camel(region)}"];

    /// <summary>The colour a moving number is drawn in.</summary>
    public string Performance(decimal change) => this[
        change > 0 ? "semantic.performance.positive"
        : change < 0 ? "semantic.performance.negative"
        : "semantic.performance.flat"];

    /// <summary>Headroom against appetite: within it, approaching the limit, or through it.</summary>
    public string Exposure(decimal committed, decimal limit) => this[
        limit <= 0 || committed > limit ? "semantic.exposure.breach"
        : committed >= limit * 0.9m ? "semantic.exposure.approaching"
        : "semantic.exposure.withinAppetite"];

    private static string Camel<TEnum>(TEnum value) where TEnum : struct, Enum
    {
        var name = value.ToString()!;
        return char.ToLowerInvariant(name[0]) + name[1..];
    }
}

public static partial class Tokens
{
    public static readonly IReadOnlyList<string> Modes = ["light", "dark", "contrast"];

    public static bool Has(string mode) => Sets.ContainsKey(mode.ToLowerInvariant());

    /// <summary>Falls back to light, so a caller may pass nothing.</summary>
    public static ThemeTokens For(string? mode = null)
    {
        var themeMode = string.IsNullOrWhiteSpace(mode) ? "light" : mode.ToLowerInvariant();
        return Sets.TryGetValue(themeMode, out var values)
            ? new ThemeTokens(themeMode, values)
            : throw new KeyNotFoundException($"no design tokens for mode '{themeMode}'");
    }
}
