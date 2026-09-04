using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;

namespace Atlas.Api;

// Wire contract: web/packages/core/README.md, "Backend i18n contract".
public static class I18nEndpoints
{
    private const int DefaultAuditLimit = 100;
    private const int MaxAuditLimit = 1000;

    public static IEndpointRouteBuilder MapI18n(this IEndpointRouteBuilder app, I18nStore store)
    {
        var i18n = app.MapGroup("/api/i18n");

        // Literal routes first, so they are never captured by "/{code}".

        i18n.MapGet("/locales", () => Results.Ok(store.ListLocales()))
            .WithName("GetLocales")
            .WithSummary("Enabled locales as { code, name, version, enabled }, default first.")
            .Produces<IReadOnlyList<LocaleSummary>>();

        i18n.MapGet("/config", () => Results.Ok(store.ReadConfig()))
            .WithName("GetI18nConfig")
            .WithSummary("Default locale plus enabled/fallback per locale.")
            .Produces<I18nConfig>();

        i18n.MapPut("/config", async (HttpContext http, CancellationToken cancellationToken) =>
        {
            if (UnsupportedMediaType(http.Request) is { } unsupported)
                return unsupported;

            var body = await ReadBodyAsync<SaveConfigRequest>(http, cancellationToken);
            if (body?.Config is null)
                return BadRequest("Body must be { config, actor, reason? }.");
            if (!I18nCatalog.IsValidActor(body.Actor))
                return BadRequest("actor is required.");

            return ToResponse(await store.SaveConfigAsync(body.Config, body.Actor, body.Reason, cancellationToken));
        })
            .WithName("PutI18nConfig")
            .WithSummary("Replace the locale configuration (audited as \"config\"). Every catalog on disk must be listed.")
            .Accepts<SaveConfigRequest>("application/json")
            .Produces<I18nConfig>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status415UnsupportedMediaType);

        i18n.MapGet("/audit", (string? locale, int? limit) =>
            limit is < 1
                ? BadRequest("limit must be at least 1.")
                : Results.Ok(store.ReadAudit(locale, Math.Min(limit ?? DefaultAuditLimit, MaxAuditLimit))))
            .WithName("GetI18nAudit")
            .WithSummary("Audit trail, newest first. ?locale= filters, ?limit= caps (default 100, at most 1000).")
            .Produces<IReadOnlyList<AuditEntry>>()
            .Produces(StatusCodes.Status400BadRequest);

        // {code} is checked once here, so a malformed code never reaches the store.

        var locale = i18n.MapGroup("/{code}").AddEndpointFilter(RequireValidCode);

        locale.MapGet("", (string code, int? version) =>
            store.ReadCatalog(code, version) is { } catalog
                ? Results.Ok(catalog)
                : NotFound(LocaleNotFound(code, version)))
            .WithName("GetLocale")
            .WithSummary("One locale merged over its fallback chain; ?version=N for that snapshot's entries over the current fallbacks.")
            .Produces<Catalog>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        locale.MapGet("/versions", (string code) =>
            store.ListVersions(code) is { } versions
                ? Results.Ok(versions)
                : NotFound(LocaleNotFound(code, null)))
            .WithName("GetLocaleVersions")
            .WithSummary("Version history of one locale, newest first.")
            .Produces<IReadOnlyList<VersionSummary>>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        locale.MapGet("/versions/{n:int}", (string code, [FromRoute(Name = "n")] int version) =>
            store.ReadSnapshot(code, version) is { } snapshot
                ? Results.Ok(snapshot)
                : NotFound(LocaleNotFound(code, version)))
            .WithName("GetLocaleVersion")
            .WithSummary("One raw snapshot, no fallback merge.")
            .Produces<Catalog>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        locale.MapPut("/entries/{key}", async (string code, string key, HttpContext http, CancellationToken cancellationToken) =>
        {
            if (!I18nCatalog.IsValidKey(key))
                return BadRequest(InvalidKey(key));
            if (UnsupportedMediaType(http.Request) is { } unsupported)
                return unsupported;

            var body = await ReadBodyAsync<SetEntryRequest>(http, cancellationToken);
            if (body?.Value is null)
                return BadRequest("Body must be { value, actor, reason? }.");
            if (!I18nCatalog.IsValidActor(body.Actor))
                return BadRequest("actor is required.");
            if (!TryReadIfMatch(http.Request, out var ifMatch, out var error))
                return BadRequest(error);

            return ToResponse(await store.SetEntryAsync(code, key, body.Value, body.Actor, body.Reason, ifMatch, cancellationToken));
        })
            .WithName("SetLocaleEntry")
            .WithSummary("Set one entry; mints a new version (audited as \"set\"). If-Match: \"N\" guards against lost updates.")
            .Accepts<SetEntryRequest>("application/json")
            .Produces<EntryChange>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status415UnsupportedMediaType);

        locale.MapDelete("/entries/{key}", async (string code, string key, HttpContext http, CancellationToken cancellationToken) =>
        {
            if (!I18nCatalog.IsValidKey(key))
                return BadRequest(InvalidKey(key));
            if (UnsupportedMediaType(http.Request) is { } unsupported)
                return unsupported;

            var body = await ReadBodyAsync<DeleteEntryRequest>(http, cancellationToken);
            if (body is null || !I18nCatalog.IsValidActor(body.Actor))
                return BadRequest("Body must be { actor, reason? }; actor is required.");
            if (!TryReadIfMatch(http.Request, out var ifMatch, out var error))
                return BadRequest(error);

            return ToResponse(await store.DeleteEntryAsync(code, key, body.Actor, body.Reason, ifMatch, cancellationToken));
        })
            .WithName("DeleteLocaleEntry")
            .WithSummary("Delete one entry; mints a new version (audited as \"delete\").")
            .Accepts<DeleteEntryRequest>("application/json")
            .Produces<EntryChange>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status415UnsupportedMediaType);

        locale.MapPost("/rollback", async (string code, HttpContext http, CancellationToken cancellationToken) =>
        {
            if (UnsupportedMediaType(http.Request) is { } unsupported)
                return unsupported;

            var body = await ReadBodyAsync<RollbackRequest>(http, cancellationToken);
            if (body?.ToVersion is not int toVersion || toVersion < 1)
                return BadRequest("Body must be { toVersion, actor, reason? }; toVersion is a positive version number.");
            if (!I18nCatalog.IsValidActor(body.Actor))
                return BadRequest("actor is required.");
            if (!TryReadIfMatch(http.Request, out var ifMatch, out var error))
                return BadRequest(error);

            return ToResponse(await store.RollbackAsync(code, toVersion, body.Actor, body.Reason, ifMatch, cancellationToken));
        })
            .WithName("RollbackLocale")
            .WithSummary("Restore an older version's entries as a NEW version (audited as \"rollback\"); history is never rewritten. Restoring the current version is a 400.")
            .Accepts<RollbackRequest>("application/json")
            .Produces<RollbackResult>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces(StatusCodes.Status415UnsupportedMediaType);

        return app;
    }

    private static ValueTask<object?> RequireValidCode(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var code = context.HttpContext.GetRouteValue("code") as string;
        return I18nCatalog.IsValidCode(code)
            ? next(context)
            : ValueTask.FromResult<object?>(BadRequest(InvalidCode(code)));
    }

    // The body is read by hand so a bad one can answer with { error }, so the framework's 415 rule is applied here.
    private static IResult? UnsupportedMediaType(HttpRequest request) =>
        request.HttpContext.Features.Get<IHttpRequestBodyDetectionFeature>()?.CanHaveBody == true
        && !request.HasJsonContentType()
            ? Results.StatusCode(StatusCodes.Status415UnsupportedMediaType)
            : null;

    // Null when the body is missing, not JSON, or not the right shape, so the caller answers 400.
    private static async Task<T?> ReadBodyAsync<T>(HttpContext http, CancellationToken cancellationToken) where T : class
    {
        try
        {
            return await http.Request.ReadFromJsonAsync<T>(cancellationToken);
        }
        catch (Exception exception) when (exception is JsonException or InvalidOperationException)
        {
            return null;
        }
    }

    // Quoted like an ETag or bare; absent or "*" means no check.
    private static bool TryReadIfMatch(HttpRequest request, out int? version, out string error)
    {
        version = null;
        error = "";

        var raw = request.Headers.IfMatch.ToString().Trim();
        if (raw.Length == 0 || raw == "*")
            return true;

        if (raw.StartsWith("W/", StringComparison.Ordinal))
            raw = raw[2..];

        if (int.TryParse(raw.Trim('"'), out var parsed) && parsed >= 1)
        {
            version = parsed;
            return true;
        }

        error = "If-Match must be a version number, e.g. \"3\".";
        return false;
    }

    private static IResult ToResponse<T>(WriteResult<T> result) => result.Error switch
    {
        null => Results.Ok(result.Value),
        { Failure: WriteFailure.NotFound } error => NotFound(error.Message),
        { Failure: WriteFailure.VersionMismatch } error => Results.Conflict(new { error = error.Message, currentVersion = error.CurrentVersion }),
        var error => BadRequest(error.Message),
    };

    private static IResult BadRequest(string error) => Results.BadRequest(new { error });
    private static IResult NotFound(string error) => Results.NotFound(new { error });

    private static string LocaleNotFound(string code, int? version) =>
        version is null ? $"Locale '{code}' not found." : $"Version {version} of locale '{code}' not found.";

    private static string InvalidCode(string? code) =>
        $"Locale code '{code}' is invalid: use ^[a-z]{{2}}(-[A-Z]{{2}})?$.";

    private static string InvalidKey(string key) =>
        $"Key '{key}' is invalid: use ^[a-z0-9]+(\\.[a-zA-Z0-9]+)*$, at most {I18nCatalog.KeyMaxLength} characters.";
}
