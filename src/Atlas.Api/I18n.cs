using System.Text.Json;

namespace Atlas.Api;

// ---------------------------------------------------------------------------
// I18n — backend-served, file-driven translations.
//
// The whole point: a new UI language is added by dropping a JSON file into the
// i18n folder. NO code change, NO rebuild, NO frontend change, and NO third-party
// library — just System.Text.Json over the filesystem.
//
// The loader reads the folder on EVERY request (see ReadAll). That is what makes
// the demo "dynamic": drop i18n/es.json while the app is running and the very
// next call to /api/i18n/locales lists "es" — no restart, no recompile.
// ---------------------------------------------------------------------------

/// <summary>One locale file: its display name and its key→text map.</summary>
/// <remarks>
/// Shape on disk: { "name": "English", "entries": { "key": "value", ... } }.
/// The locale CODE is the file name without extension (en, de, fr).
/// </remarks>
public sealed record Locale(string Name, Dictionary<string, string> Entries);

public static class I18n
{
    /// <summary>The default/fallback locale code. en is guaranteed to exist.</summary>
    public const string DefaultCode = "en";

    private static readonly JsonSerializerOptions ReadOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Resolve the i18n folder robustly: prefer the content root (source layout
    /// during `dotnet run`), fall back to the binary's base directory (published
    /// output, where the files are copied via CopyToOutputDirectory).
    /// </summary>
    public static string ResolveFolder(string contentRootPath)
    {
        var fromContentRoot = Path.Combine(contentRootPath, "i18n");
        if (Directory.Exists(fromContentRoot))
            return fromContentRoot;

        return Path.Combine(AppContext.BaseDirectory, "i18n");
    }

    /// <summary>
    /// Read every *.json file in the folder, keyed by locale code (the file name
    /// without extension). Called on each request so newly dropped files appear
    /// without a rebuild. Malformed or unreadable files are skipped silently — a
    /// bad drop never takes the endpoint down.
    /// </summary>
    public static Dictionary<string, Locale> ReadAll(string folder)
    {
        var result = new Dictionary<string, Locale>(StringComparer.OrdinalIgnoreCase);

        if (!Directory.Exists(folder))
            return result;

        foreach (var path in Directory.EnumerateFiles(folder, "*.json"))
        {
            try
            {
                var json = File.ReadAllText(path);
                var locale = JsonSerializer.Deserialize<Locale>(json, ReadOptions);

                // Guard against valid-JSON-but-wrong-shape files (e.g. null/missing
                // members deserialising to nulls): skip anything not usable.
                if (locale is null || locale.Name is null || locale.Entries is null)
                    continue;

                var code = Path.GetFileNameWithoutExtension(path);
                if (string.IsNullOrWhiteSpace(code))
                    continue;

                result[code] = locale;
            }
            catch (Exception ex) when (ex is JsonException or IOException or UnauthorizedAccessException)
            {
                // Resilient by design: ignore a single bad/locked file and carry on.
                continue;
            }
        }

        return result;
    }

    /// <summary>
    /// Locale codes sorted with the default (en) first, then alphabetically.
    /// </summary>
    public static IEnumerable<string> SortCodes(IEnumerable<string> codes) =>
        codes.OrderBy(c => c.Equals(DefaultCode, StringComparison.OrdinalIgnoreCase) ? 0 : 1)
             .ThenBy(c => c, StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Merge a locale's entries over the en fallback so the frontend always gets
    /// complete key coverage: every en key is present, the requested locale's
    /// translations win where they exist.
    /// </summary>
    public static Dictionary<string, string> WithFallback(
        Dictionary<string, string> entries,
        Dictionary<string, string>? fallback)
    {
        var merged = fallback is null
            ? new Dictionary<string, string>()
            : new Dictionary<string, string>(fallback);

        foreach (var (key, value) in entries)
            merged[key] = value;

        return merged;
    }
}
