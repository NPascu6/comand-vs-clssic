using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;

namespace Atlas.Api;

/// <summary>The only place translations touch disk. History is append-only: every write is snapshot, then audit line, then current file.</summary>
public sealed class I18nStore
{
    private const string HistoryFolder = "_history";
    private const string AuditFileName = "_audit.jsonl";
    private const string ConfigFileName = "_config.json";

    private static readonly JsonSerializerOptions FileJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
        // Keep "Français" readable in the files instead of é escapes.
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private static readonly JsonSerializerOptions LineJson = new(FileJson) { WriteIndented = false };

    private readonly SemaphoreSlim _gate = new(1, 1);

    public I18nStore(string folder) => Folder = folder;

    public string Folder { get; }

    /// <summary>"I18n:Folder" wins (absolute or content-root-relative); otherwise i18n/ under the content root, else next to the binary.</summary>
    public static string ResolveFolder(string contentRootPath, string? configured = null)
    {
        if (!string.IsNullOrWhiteSpace(configured))
            return Path.GetFullPath(Path.Combine(contentRootPath, configured));

        var fromContentRoot = Path.Combine(contentRootPath, "i18n");
        return Directory.Exists(fromContentRoot)
            ? fromContentRoot
            : Path.Combine(AppContext.BaseDirectory, "i18n");
    }

    // Reads are lock-free and re-read the disk on every call, so a dropped file appears on the next request.

    public I18nConfig ReadConfig() => EffectiveConfig(ReadCatalogs());

    /// <summary>Enabled locales, default first then alphabetical.</summary>
    public IReadOnlyList<LocaleSummary> ListLocales()
    {
        var catalogs = ReadCatalogs();
        return EffectiveConfig(catalogs).Locales
            .Where(locale => locale.Enabled)
            .Select(locale => new LocaleSummary(locale.Code, locale.Name, catalogs[locale.Code].Version, true))
            .ToList();
    }

    /// <summary>Merged over the fallback chain; with a version, that snapshot's entries over the CURRENT fallbacks. Null when unknown.</summary>
    public Catalog? ReadCatalog(string code, int? version = null)
    {
        var catalogs = ReadCatalogs();
        if (!catalogs.TryGetValue(code, out var current))
            return null;

        var own = version is int requested ? SnapshotOrCurrent(code, requested, current) : current;
        if (own is null)
            return null;

        var fallbacks = I18nCatalog.FallbackChain(EffectiveConfig(catalogs), code)
            .Select(fallbackCode => catalogs.GetValueOrDefault(fallbackCode)?.Entries)
            .OfType<IReadOnlyDictionary<string, string>>()
            .ToList();

        return own with { Entries = I18nCatalog.WithFallback(own.Entries, fallbacks) };
    }

    /// <summary>One version's raw entries, no fallback merge. Null when unknown.</summary>
    public Catalog? ReadSnapshot(string code, int version) =>
        ReadCurrent(code) is { } current ? SnapshotOrCurrent(code, version, current) : null;

    /// <summary>Version history, newest first. Null when the locale is unknown.</summary>
    public IReadOnlyList<VersionSummary>? ListVersions(string code)
    {
        var current = ReadCurrent(code);
        if (current is null)
            return null;

        var summaries = ReadAllSnapshots(code).Select(snapshot => snapshot.ToSummary()).ToList();

        // A hand-dropped file has no snapshot yet: show it as the "create" version it will become.
        if (summaries.All(summary => summary.Version != current.Version))
            summaries.Add(FirstSeed(code, current, File.GetLastWriteTimeUtc(CatalogPath(code))).ToSummary());

        return summaries.OrderByDescending(summary => summary.Version).ToList();
    }

    /// <summary>Audit lines, newest first; optionally one locale only.</summary>
    public IReadOnlyList<AuditEntry> ReadAudit(string? locale, int limit)
    {
        if (!File.Exists(AuditPath))
            return [];

        var entries = new List<AuditEntry>();
        using var reader = new StreamReader(OpenShared(AuditPath));
        while (reader.ReadLine() is { } line)
        {
            var entry = ParseAuditLine(line);
            if (entry is null || (!string.IsNullOrEmpty(locale) && entry.Locale != locale))
                continue;
            entries.Add(entry);
        }

        entries.Reverse();
        return entries.Take(limit).ToList();
    }

    public Task<WriteResult<EntryChange>> SetEntryAsync(
        string code, string key, string value, string actor, string? reason, int? ifMatch,
        CancellationToken cancellationToken = default) =>
        MutateAsync(code, ifMatch,
            (current, now) => WriteResult<Mutation>.Success(
                I18nCatalog.Set(current, key, value, actor, reason, now)),
            mutation => new EntryChange(code, mutation.Next.Version, key, mutation.Entry.Before, mutation.Entry.After),
            cancellationToken);

    public Task<WriteResult<EntryChange>> DeleteEntryAsync(
        string code, string key, string actor, string? reason, int? ifMatch,
        CancellationToken cancellationToken = default) =>
        MutateAsync(code, ifMatch,
            (current, now) => current.Entries.ContainsKey(key)
                ? WriteResult<Mutation>.Success(I18nCatalog.Delete(current, key, actor, reason, now))
                : WriteResult<Mutation>.NotFound($"Key '{key}' not found in locale '{code}'."),
            mutation => new EntryChange(code, mutation.Next.Version, key, mutation.Entry.Before, mutation.Entry.After),
            cancellationToken);

    /// <summary>A rollback must change something: restoring the current version is refused, not minted.</summary>
    public Task<WriteResult<RollbackResult>> RollbackAsync(
        string code, int toVersion, string actor, string? reason, int? ifMatch,
        CancellationToken cancellationToken = default) =>
        MutateAsync(code, ifMatch,
            (current, now) => toVersion == current.Version
                ? WriteResult<Mutation>.Invalid($"Version {toVersion} is already the current version of locale '{code}'.")
                : SnapshotOrCurrent(code, toVersion, current) is { } snapshot
                    ? WriteResult<Mutation>.Success(I18nCatalog.Rollback(current, snapshot, actor, reason, now))
                    : WriteResult<Mutation>.NotFound($"Version {toVersion} of locale '{code}' not found."),
            mutation => new RollbackResult(code, mutation.Next.Version, toVersion),
            cancellationToken);

    /// <summary>Names in the body are ignored: a locale's name is owned by its {code}.json.</summary>
    public async Task<WriteResult<I18nConfig>> SaveConfigAsync(
        I18nConfig config, string actor, string? reason, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var catalogs = ReadCatalogs();
            var error = I18nCatalog.ValidateConfig(config, catalogs.Keys.ToHashSet(StringComparer.Ordinal));
            if (error is not null)
                return WriteResult<I18nConfig>.Invalid(error);

            var before = ConfigFile.From(EffectiveConfig(catalogs));
            var after = ConfigFile.From(config);

            WriteJson(ConfigPath, after);
            AppendAudit(I18nCatalog.NewAuditEntry(
                DateTime.UtcNow, actor, locale: null, version: null, AuditActions.Config,
                key: null, Compact(before), Compact(after), reason));

            return WriteResult<I18nConfig>.Success(EffectiveConfig(catalogs));
        }
        finally
        {
            _gate.Release();
        }
    }

    // The one write path: lock, re-read, check history and If-Match, apply, then persist seed → snapshot → audit → current.
    // The clock is read once so the seed and the change share a timestamp.
    private async Task<WriteResult<T>> MutateAsync<T>(
        string code, int? ifMatch,
        Func<Catalog, DateTime, WriteResult<Mutation>> apply,
        Func<Mutation, T> project,
        CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var current = ReadCurrent(code);
            if (current is null)
                return WriteResult<T>.NotFound($"Locale '{code}' not found.");
            EnsureHistoryNotAhead(code, current);
            if (ifMatch is int expected && expected != current.Version)
                return WriteResult<T>.Conflict(current.Version);

            var now = DateTime.UtcNow;
            var (basis, seed) = Reconcile(code, current, now);
            var applied = apply(basis, now);
            if (applied.Value is null)
                return new WriteResult<T>(default, applied.Error);

            var mutation = applied.Value;
            if (seed is not null)
            {
                CreateJson(SnapshotPath(code, seed.Version), seed);
                AppendAudit(SeedEntry(code, seed));
            }
            CreateJson(SnapshotPath(code, mutation.Next.Version), LocaleSnapshot.From(mutation));
            AppendAudit(mutation.Entry);
            WriteJson(CatalogPath(code), LocaleFile.From(mutation.Next));

            return WriteResult<T>.Success(project(mutation));
        }
        finally
        {
            _gate.Release();
        }
    }

    // Minting a number that history already holds would overwrite it, so refuse until someone reconciles the folder.
    private void EnsureHistoryNotAhead(string code, Catalog current)
    {
        var latest = LatestSnapshotVersion(code);
        if (latest > current.Version)
            throw new InvalidOperationException(
                $"Locale '{code}': history is ahead of the current file (snapshot {latest}, current version {current.Version}). " +
                $"Reconcile {HistoryFolder}/{code}/{latest}.json before writing.");
    }

    // A file with no snapshot is recorded as the version it claims; one edited by hand is recorded as version + 1 first.
    // Nothing is written here; the caller persists the seed before the change.
    private (Catalog Basis, LocaleSnapshot? Seed) Reconcile(string code, Catalog current, DateTime now)
    {
        var recorded = ReadSnapshotFile(code, current.Version);
        if (recorded is null)
            return (current, FirstSeed(code, current, now));

        var changed = I18nCatalog.ChangedKeys(recorded.Entries!, current.Entries);
        if (changed.Count == 0)
            return (current, null);

        var edited = current with { Version = current.Version + 1 };
        return (edited, Seed(edited, now, "catalog file changed outside the API", changed));
    }

    private static LocaleSnapshot FirstSeed(string code, Catalog current, DateTime createdAt) =>
        Seed(current, createdAt, $"seeded from {code}.json", current.Entries.Keys.Order(StringComparer.Ordinal).ToList());

    private static LocaleSnapshot Seed(Catalog catalog, DateTime createdAt, string reason, IReadOnlyList<string> changedKeys) => new(
        catalog.Name,
        catalog.Version,
        createdAt,
        I18nCatalog.SystemActor,
        AuditActions.Create,
        reason,
        [.. changedKeys],
        new Dictionary<string, string>(catalog.Entries));

    private static AuditEntry SeedEntry(string code, LocaleSnapshot seed) =>
        I18nCatalog.NewAuditEntry(
            seed.CreatedAt, I18nCatalog.SystemActor, code, seed.Version, AuditActions.Create,
            key: null, before: null, after: null, seed.Reason);

    private string CatalogPath(string code) => Path.Combine(Folder, code + ".json");
    private string HistoryPath(string code) => Path.Combine(Folder, HistoryFolder, code);
    private string SnapshotPath(string code, int version) => Path.Combine(HistoryPath(code), version + ".json");
    private string AuditPath => Path.Combine(Folder, AuditFileName);
    private string ConfigPath => Path.Combine(Folder, ConfigFileName);

    // A malformed file is skipped, so a bad drop never takes the endpoint down.
    private Dictionary<string, Catalog> ReadCatalogs()
    {
        var result = new Dictionary<string, Catalog>(StringComparer.Ordinal);
        if (!Directory.Exists(Folder))
            return result;

        foreach (var path in Directory.EnumerateFiles(Folder, "*.json"))
        {
            var code = Path.GetFileNameWithoutExtension(path);
            if (I18nCatalog.IsValidCode(code) && ReadCatalogFile(code, path) is { } catalog)
                result[code] = catalog;
        }

        return result;
    }

    private Catalog? ReadCurrent(string code) =>
        I18nCatalog.IsValidCode(code) ? ReadCatalogFile(code, CatalogPath(code)) : null;

    private static Catalog? ReadCatalogFile(string code, string path)
    {
        var file = ReadJson<LocaleFile>(path);
        if (file?.Name is null || file.Entries is null)
            return null;

        // A hand-written file has no "version": it is version 1.
        return new Catalog(code, file.Name, Math.Max(1, file.Version ?? 1), file.Entries);
    }

    // Version N from history; the current file if that IS version N; else null.
    private Catalog? SnapshotOrCurrent(string code, int version, Catalog current) =>
        ReadSnapshotFile(code, version)?.ToCatalog(code)
        ?? (version == current.Version ? current : null);

    private LocaleSnapshot? ReadSnapshotFile(string code, int version) =>
        ReadJson<LocaleSnapshot>(SnapshotPath(code, version)) is { Name: not null, Entries: not null } snapshot ? snapshot : null;

    private List<LocaleSnapshot> ReadAllSnapshots(string code) =>
        SnapshotFiles(code)
            .Select(path => ReadJson<LocaleSnapshot>(path))
            .Where(snapshot => snapshot is { Name: not null, Entries: not null })
            .Select(snapshot => snapshot!)
            .ToList();

    // 0 when the locale has no history yet.
    private int LatestSnapshotVersion(string code) =>
        SnapshotFiles(code)
            .Select(path => int.Parse(Path.GetFileNameWithoutExtension(path)))
            .DefaultIfEmpty(0)
            .Max();

    private IEnumerable<string> SnapshotFiles(string code)
    {
        var folder = HistoryPath(code);
        return Directory.Exists(folder)
            ? Directory.EnumerateFiles(folder, "*.json").Where(path => int.TryParse(Path.GetFileNameWithoutExtension(path), out _))
            : [];
    }

    // Locales without a config line are enabled and fall back to the default; config lines without a file are dropped.
    private I18nConfig EffectiveConfig(IReadOnlyDictionary<string, Catalog> catalogs)
    {
        var file = ReadJson<ConfigFile>(ConfigPath);
        var defaultCode = I18nCatalog.IsValidCode(file?.DefaultCode) ? file.DefaultCode : I18nCatalog.DefaultCode;

        var configured = new Dictionary<string, ConfigFileLocale>(StringComparer.Ordinal);
        foreach (var locale in file?.Locales ?? [])
            if (locale?.Code is not null)
                configured[locale.Code] = locale;

        var locales = I18nCatalog.SortCodes(catalogs.Keys, defaultCode)
            .Select(code => configured.GetValueOrDefault(code) is { } settings
                ? new LocaleConfig(code, catalogs[code].Name, settings.Enabled, settings.FallbackCode)
                : new LocaleConfig(code, catalogs[code].Name, true, code == defaultCode ? null : defaultCode))
            .ToList();

        return new I18nConfig(defaultCode, locales);
    }

    private static T? ReadJson<T>(string path) where T : class
    {
        try
        {
            using var stream = OpenShared(path);
            return JsonSerializer.Deserialize<T>(stream, FileJson);
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    private static AuditEntry? ParseAuditLine(string line)
    {
        if (line.Length == 0)
            return null;
        try
        {
            return JsonSerializer.Deserialize<AuditEntry>(line, LineJson);
        }
        catch (JsonException)
        {
            return null; // a torn last line while a writer is mid-append
        }
    }

    private static void WriteJson<T>(string path, T value) => MoveIntoPlace(path, value, overwrite: true);

    // An existing target is an error: history is never rewritten.
    private static void CreateJson<T>(string path, T value) => MoveIntoPlace(path, value, overwrite: false);

    // A sibling temp file, flushed then moved, so a reader never sees a half-written file.
    private static void MoveIntoPlace<T>(string path, T value, bool overwrite)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temp = $"{path}.{Guid.NewGuid():N}.tmp";
        try
        {
            WriteDurable(temp, FileMode.CreateNew, JsonSerializer.Serialize(value, FileJson) + "\n");
            File.Move(temp, path, overwrite);
        }
        catch
        {
            File.Delete(temp);
            throw;
        }
    }

    private void AppendAudit(AuditEntry entry) =>
        WriteDurable(AuditPath, FileMode.Append, JsonSerializer.Serialize(entry, LineJson) + "\n");

    // Flushed through to disk, so a power loss never leaves an empty file behind the rename or append.
    private static void WriteDurable(string path, FileMode mode, string text)
    {
        using var stream = new FileStream(path, mode, FileAccess.Write, FileShare.Read);
        stream.Write(Encoding.UTF8.GetBytes(text));
        stream.Flush(flushToDisk: true);
    }

    private static string Compact<T>(T value) => JsonSerializer.Serialize(value, LineJson);

    private static FileStream OpenShared(string path) =>
        new(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
}

// On-disk shapes. Members are nullable because a hand-edited file may omit anything.

internal sealed record LocaleFile(string? Name, int? Version, Dictionary<string, string>? Entries)
{
    public static LocaleFile From(Catalog catalog) =>
        new(catalog.Name, catalog.Version, new Dictionary<string, string>(catalog.Entries));
}

internal sealed record LocaleSnapshot(
    string? Name,
    int Version,
    DateTime CreatedAt,
    string? Actor,
    string? Action,
    string? Reason,
    List<string>? ChangedKeys,
    Dictionary<string, string>? Entries)
{
    public static LocaleSnapshot From(Mutation mutation) => new(
        mutation.Next.Name, mutation.Next.Version, mutation.Entry.Timestamp, mutation.Entry.Actor, mutation.Entry.Action, mutation.Entry.Reason,
        [.. mutation.ChangedKeys], new Dictionary<string, string>(mutation.Next.Entries));

    public Catalog ToCatalog(string code) => new(code, Name!, Version, Entries!);

    public VersionSummary ToSummary() =>
        new(Version, CreatedAt, Actor ?? I18nCatalog.SystemActor, Action ?? AuditActions.Create, Reason, ChangedKeys ?? []);
}

internal sealed record ConfigFile(string? DefaultCode, List<ConfigFileLocale>? Locales)
{
    public static ConfigFile From(I18nConfig config) => new(
        config.DefaultCode,
        config.Locales.Select(locale => new ConfigFileLocale(locale.Code, locale.Enabled, locale.FallbackCode)).ToList());
}

internal sealed record ConfigFileLocale(string? Code, bool Enabled, string? FallbackCode);
