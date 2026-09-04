using System.Text.Json;
using System.Text.Json.Serialization;
using Atlas.Api;
using Atlas.Functional.Commands.Commitments;
using Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// Atlas.Api — a thin HTTP skin over the functional CommitCapital handler.
//
// The whole point of the functional approach is that the feature already lives
// in the handler: validation, error aggregation and the decision trace are done
// there. This API does nothing clever — it binds JSON, calls HandleAsync, and
// shapes the outcome for a browser. No MediatR, no Swashbuckle, no AutoMapper:
// just the ASP.NET Core framework, System.Text.Json and Microsoft's own
// OpenAPI generator.
// ---------------------------------------------------------------------------

public partial class Program
{
    private static void Main(string[] args)
    {
        const string FrontendCors = "frontend";

        var builder = WebApplication.CreateBuilder(args);

        // JSON: enums as strings ("PrivateEquity"), camelCase keys, applied to every
        // minimal-API read and write. This is the contract the React app codes against.
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        // OpenAPI: Microsoft's generator reads the endpoints the framework already
        // knows about and reuses the JSON options above, so the document describes
        // exactly what the API serves — camelCase keys, enums as strings.
        builder.Services.AddOpenApi();

        // CORS: allow the Vite dev server (5173) and preview server (4173).
        builder.Services.AddCors(options =>
            options.AddPolicy(FrontendCors, policy => policy
                .WithOrigins("http://localhost:5173", "http://localhost:4173")
                .AllowAnyHeader()
                .AllowAnyMethod()));

        // The upstream is an in-memory seeded fake; "today" is fixed so the demo data's
        // date windows behave deterministically. The handler is stateless, so one
        // singleton serves every request.
        builder.Services.AddSingleton<IUpstream>(_ => InMemoryUpstream.Create());
        var today = new DateOnly(2026, 6, 13);
        builder.Services.AddSingleton(sp =>
            new CommitCapitalHandler(sp.GetRequiredService<IUpstream>(), today));

        var app = builder.Build();

        app.UseCors(FrontendCors);

        // The document at /openapi/v1.json, and Swagger UI at /swagger to browse it.
        // Swashbuckle is here only as the static UI shell — no AddSwaggerGen, no
        // attributes on the endpoints; the document itself is Microsoft's.
        app.MapOpenApi();
        app.UseSwaggerUI(ui =>
        {
            ui.SwaggerEndpoint("/openapi/v1.json", "Atlas API v1");
            ui.RoutePrefix = "swagger";
        });

        // --- Endpoints -------------------------------------------------------------

        // 1. Health.
        app.MapGet("/", () => Results.Text("Atlas API — POST /api/commitments"))
            .WithSummary("Health check.")
            .ExcludeFromDescription();

        // 2. Reference data for the frontend form dropdowns. The client interfaces only
        //    fetch by id, so we read the shared seed directly to enumerate the lists.
        app.MapGet("/api/reference", () =>
        {
            var seed = SeedData.Build();
            return Results.Ok(ReferenceData.From(seed));
        })
            .WithName("GetReferenceData")
            .WithSummary("Funds, deals and co-investments for the form dropdowns.");

        // 3. Commit capital. Bind the request, hand it to the existing handler, and
        //    project its outcome (approval, errors and the full decision trace) to JSON.
        app.MapPost("/api/commitments", async (
            HttpContext http,
            CommitCapitalHandler handler,
            CancellationToken ct) =>
        {
            CommitCapitalRequest? request;
            try
            {
                request = await http.Request.ReadFromJsonAsync<CommitCapitalRequest>(ct);
            }
            catch (JsonException)
            {
                request = null;
            }

            if (request is null)
                return Results.BadRequest(new { error = "Request body is missing or not valid JSON." });

            var correlationId = Guid.NewGuid().ToString("N")[..12];
            var outcome = await handler.HandleAsync(request.ToCommand(), correlationId, ct);

            // Approved → 200; validated-but-rejected → 422 (errors + full trace in the body,
            // like the classic samples). Malformed JSON is still a 400 above.
            return outcome.Approved
                ? Results.Ok(CommitmentResponse.From(outcome))
                : Results.UnprocessableEntity(CommitmentResponse.From(outcome));
        })
            .WithName("CommitCapital")
            .WithSummary("Commit capital to a co-investment.")
            .WithDescription(
                "Returns the decision trace either way: 200 when approved, 422 when the "
                + "handler rejected it, 400 when the body is not valid JSON.")
            // The handler reads the body off HttpContext, so the framework cannot infer
            // the request shape — state it, or Swagger shows no schema and no "Try it out".
            .Accepts<CommitCapitalRequest>("application/json")
            .Produces<CommitmentResponse>()
            .Produces<CommitmentResponse>(StatusCodes.Status422UnprocessableEntity)
            .Produces(StatusCodes.Status400BadRequest);

        // --- i18n (backend-served translations) ------------------------------------
        // Resolve the folder once; the FILES inside it are re-read on every request
        // (see I18n.ReadAll), so dropping a new locale JSON is picked up live — no
        // rebuild, no restart, no code change. These endpoints sit under the same app,
        // so the existing CORS policy already covers them.
        var i18nFolder = I18n.ResolveFolder(builder.Environment.ContentRootPath);

        // 4. List available locales as { code, name }, en first then alphabetical.
        app.MapGet("/api/i18n/locales", () =>
        {
            var locales = I18n.ReadAll(i18nFolder);
            var list = I18n.SortCodes(locales.Keys)
                .Select(code => new { code, name = locales[code].Name });
            return Results.Ok(list);
        })
            .WithName("GetLocales")
            .WithSummary("Available locales as { code, name }.");

        // 5. One locale's full map. Missing keys are filled from en so the frontend
        //    always gets complete coverage. Unknown code (and not en) → 404.
        app.MapGet("/api/i18n/{code}", (string code) =>
        {
            var locales = I18n.ReadAll(i18nFolder);

            if (!locales.TryGetValue(code, out var locale))
                return Results.NotFound(new { error = $"Locale '{code}' not found." });

            locales.TryGetValue(I18n.DefaultCode, out var fallback);
            var entries = I18n.WithFallback(locale.Entries, fallback?.Entries);

            return Results.Ok(new { code, name = locale.Name, entries });
        })
            .WithName("GetLocale")
            .WithSummary("One locale's full translation map, with en as fallback.")
            .Produces(StatusCodes.Status404NotFound);

        app.Run("http://localhost:5179");
    }
}