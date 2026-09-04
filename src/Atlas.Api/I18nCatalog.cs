using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

namespace Atlas.Api;

/// <summary>Pure rules: every mutation returns the next version plus its audit entry; nothing is rewritten in place.</summary>
public static partial class I18nCatalog
{
    /// <summary>The default locale when _config.json does not say otherwise.</summary>
    public const string DefaultCode = "en";

    /// <summary>Actor recorded for versions the store seeds from a hand-dropped file.</summary>
    public const string SystemActor = "system";

    public const int KeyMaxLength = 120;

    [GeneratedRegex(@"^[a-z]{2}(-[A-Z]{2})?$")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"^[a-z0-9]+(\.[a-zA-Z0-9]+)*$")]
    private static partial Regex KeyPattern();

    public static bool IsValidCode([NotNullWhen(true)] string? code) =>
        code is not null && CodePattern().IsMatch(code);

    public static bool IsValidKey([NotNullWhen(true)] string? key) =>
        key is { Length: > 0 and <= KeyMaxLength } && KeyPattern().IsMatch(key);

    public static bool IsValidActor([NotNullWhen(true)] string? actor) =>
        !string.IsNullOrWhiteSpace(actor);

    /// <summary>Null when acceptable. Fallback cycles are allowed; FallbackChain is cycle-safe.</summary>
    public static string? ValidateConfig(I18nConfig? config, IReadOnlySet<string> knownCodes)
    {
        if (config?.Locales is null || config.Locales.Count == 0)
            return "config must list at least one locale.";

        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var locale in config.Locales)
        {
            if (!IsValidCode(locale?.Code))
                return $"Locale code '{locale?.Code}' is invalid.";
            if (!knownCodes.Contains(locale.Code))
                return $"Locale '{locale.Code}' is unknown (no {locale.Code}.json).";
            if (!seen.Add(locale.Code))
                return $"Locale '{locale.Code}' is listed twice.";
            if (locale.FallbackCode == locale.Code)
                return $"Locale '{locale.Code}' cannot fall back to itself.";
        }

        // A full replacement: a catalog left out would silently fall back to the defaults.
        foreach (var code in knownCodes.Order(StringComparer.Ordinal))
        {
            if (!seen.Contains(code))
                return $"Locale '{code}' must be listed.";
        }

        foreach (var locale in config.Locales)
        {
            if (locale.FallbackCode is not null && !seen.Contains(locale.FallbackCode))
                return $"Fallback '{locale.FallbackCode}' of '{locale.Code}' is not a listed locale.";
        }

        if (!IsValidCode(config.DefaultCode) || !seen.Contains(config.DefaultCode))
            return $"Default locale '{config.DefaultCode}' is not a listed locale.";
        if (!config.Locales.First(locale => locale.Code == config.DefaultCode).Enabled)
            return "The default locale must be enabled.";

        return null;
    }

    /// <summary>The default first, then alphabetical.</summary>
    public static IEnumerable<string> SortCodes(IEnumerable<string> codes, string defaultCode = DefaultCode) =>
        codes.OrderBy(code => code == defaultCode ? 0 : 1)
             .ThenBy(code => code, StringComparer.Ordinal);

    /// <summary>Own entries win, then the nearest fallback that has the key.</summary>
    public static IReadOnlyDictionary<string, string> WithFallback(
        IReadOnlyDictionary<string, string> entries,
        params IReadOnlyList<IReadOnlyDictionary<string, string>> fallbacks)
    {
        var merged = new Dictionary<string, string>(StringComparer.Ordinal);

        for (var index = fallbacks.Count - 1; index >= 0; index--)
            foreach (var (key, value) in fallbacks[index])
                merged[key] = value;

        foreach (var (key, value) in entries)
            merged[key] = value;

        return merged;
    }

    /// <summary>Nearest first, always ending with the default; a disabled locale is skipped but its own fallback is still followed.</summary>
    public static IReadOnlyList<string> FallbackChain(I18nConfig config, string code)
    {
        var byCode = config.Locales.ToDictionary(entry => entry.Code, StringComparer.Ordinal);
        var chain = new List<string>();
        var visited = new HashSet<string>(StringComparer.Ordinal) { code };

        var next = byCode.GetValueOrDefault(code)?.FallbackCode;
        while (next is not null && visited.Add(next))
        {
            var locale = byCode.GetValueOrDefault(next);
            if (locale is not null && (locale.Enabled || next == config.DefaultCode))
                chain.Add(next);
            next = locale?.FallbackCode;
        }

        if (visited.Add(config.DefaultCode))
            chain.Add(config.DefaultCode);

        return chain;
    }

    /// <summary>Keys whose value differs between two maps, sorted.</summary>
    public static IReadOnlyList<string> ChangedKeys(
        IReadOnlyDictionary<string, string> before,
        IReadOnlyDictionary<string, string> after) =>
        before.Keys.Union(after.Keys, StringComparer.Ordinal)
              .Where(key => !(before.TryGetValue(key, out var oldValue) && after.TryGetValue(key, out var newValue) && oldValue == newValue))
              .Order(StringComparer.Ordinal)
              .ToList();

    // Writing the same value again is still a version: every accepted write is one version and one audit line.
    public static Mutation Set(Catalog current, string key, string value, string actor, string? reason, DateTime now)
    {
        var before = current.Entries.GetValueOrDefault(key);
        var entries = new Dictionary<string, string>(current.Entries, StringComparer.Ordinal) { [key] = value };
        return Next(current, entries, AuditActions.Set, key, before, value, actor, reason, now, [key]);
    }

    /// <exception cref="KeyNotFoundException">The key is not in the catalog.</exception>
    public static Mutation Delete(Catalog current, string key, string actor, string? reason, DateTime now)
    {
        if (!current.Entries.TryGetValue(key, out var before))
            throw new KeyNotFoundException($"Key '{key}' is not in locale '{current.Code}'.");

        var entries = new Dictionary<string, string>(current.Entries, StringComparer.Ordinal);
        entries.Remove(key);
        return Next(current, entries, AuditActions.Delete, key, before, null, actor, reason, now, [key]);
    }

    /// <summary>A NEW version; the audit entry's before/after name the version replaced and the version restored.</summary>
    public static Mutation Rollback(Catalog current, Catalog snapshot, string actor, string? reason, DateTime now)
    {
        if (snapshot.Code != current.Code)
            throw new ArgumentException($"Snapshot is of locale '{snapshot.Code}', not '{current.Code}'.", nameof(snapshot));

        var entries = new Dictionary<string, string>(snapshot.Entries, StringComparer.Ordinal);
        return Next(current, entries, AuditActions.Rollback, key: null,
            before: current.Version.ToString(), after: snapshot.Version.ToString(),
            actor, reason, now, ChangedKeys(current.Entries, snapshot.Entries));
    }

    public static AuditEntry NewAuditEntry(
        DateTime now, string actor, string? locale, int? version, string action,
        string? key, string? before, string? after, string? reason) =>
        new(Guid.NewGuid().ToString("N"), now, actor, locale, version, action, key, before, after, reason);

    private static Mutation Next(
        Catalog current, Dictionary<string, string> entries, string action, string? key,
        string? before, string? after, string actor, string? reason, DateTime now,
        IReadOnlyList<string> changedKeys)
    {
        var version = current.Version + 1;
        var next = current with { Version = version, Entries = entries };
        var entry = NewAuditEntry(now, actor, current.Code, version, action, key, before, after, reason);
        return new Mutation(next, entry, changedKeys);
    }
}
