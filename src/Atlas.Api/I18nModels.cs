namespace Atlas.Api;

public sealed record Catalog(string Code, string Name, int Version, IReadOnlyDictionary<string, string> Entries);

public sealed record LocaleSummary(string Code, string Name, int Version, bool Enabled);

/// <summary>Name is owned by {code}.json and is read-only here.</summary>
public sealed record LocaleConfig(string Code, string Name, bool Enabled, string? FallbackCode);

public sealed record I18nConfig(string DefaultCode, IReadOnlyList<LocaleConfig> Locales);

public sealed record VersionSummary(
    int Version,
    DateTime CreatedAt,
    string Actor,
    string Action,
    string? Reason,
    IReadOnlyList<string> ChangedKeys);

/// <summary>Append-only; Id is a Guid ("N") and Timestamp is UTC.</summary>
public sealed record AuditEntry(
    string Id,
    DateTime Timestamp,
    string Actor,
    string? Locale,
    int? Version,
    string Action,
    string? Key,
    string? Before,
    string? After,
    string? Reason);

public sealed record EntryChange(string Code, int Version, string Key, string? Before, string? After);

public sealed record RollbackResult(string Code, int Version, int RestoredFrom);

/// <summary>Audit action names exactly as they appear on the wire.</summary>
public static class AuditActions
{
    public const string Set = "set";
    public const string Delete = "delete";
    public const string Rollback = "rollback";
    public const string Config = "config";
    /// <summary>A locale's current version was recorded into history for the first time.</summary>
    public const string Create = "create";
}

public sealed record Mutation(Catalog Next, AuditEntry Entry, IReadOnlyList<string> ChangedKeys);

public sealed record SetEntryRequest(string? Value, string? Actor, string? Reason);
public sealed record DeleteEntryRequest(string? Actor, string? Reason);
public sealed record RollbackRequest(int? ToVersion, string? Actor, string? Reason);
public sealed record SaveConfigRequest(I18nConfig? Config, string? Actor, string? Reason);

public enum WriteFailure { Invalid, NotFound, VersionMismatch }

public sealed record WriteError(WriteFailure Failure, string Message, int? CurrentVersion = null);

public sealed record WriteResult<T>(T? Value, WriteError? Error)
{
    public static WriteResult<T> Success(T value) => new(value, null);
    public static WriteResult<T> Invalid(string message) => new(default, new(WriteFailure.Invalid, message));
    public static WriteResult<T> NotFound(string message) => new(default, new(WriteFailure.NotFound, message));
    public static WriteResult<T> Conflict(int currentVersion) => new(default, new(
        WriteFailure.VersionMismatch,
        $"If-Match does not equal the current version ({currentVersion}).",
        currentVersion));
}
