using System.Text.Json;
using System.Text.Json.Serialization;
using Atlas.Api;
using Atlas.Functional.Commands.Commitments;
using Atlas.Upstream.Contracts;

public partial class Program
{
    private static void Main(string[] args)
    {
        const string FrontendCors = "frontend";

        var builder = WebApplication.CreateBuilder(args);

        // Enums as strings and camelCase keys: the contract the React app codes against.
        builder.Services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });

        // Microsoft's generator reuses the JSON options above, so the document matches what is served.
        builder.Services.AddOpenApi();

        // No production default on purpose: array entries merge by index, so a localhost entry would survive an override.
        var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
        builder.Services.AddCors(options =>
            options.AddPolicy(FrontendCors, policy => policy
                .WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()));

        // "today" is fixed so the seed data's date windows behave deterministically.
        builder.Services.AddSingleton<IUpstream>(_ => InMemoryUpstream.Create());
        var today = new DateOnly(2026, 6, 13);
        builder.Services.AddSingleton(services =>
            new CommitCapitalHandler(services.GetRequiredService<IUpstream>(), today));

        // The store re-reads the disk per request, so a dropped locale file is live without a restart.
        builder.Services.AddSingleton(new I18nStore(I18nStore.ResolveFolder(
            builder.Environment.ContentRootPath, builder.Configuration["I18n:Folder"])));

        var app = builder.Build();

        app.UseCors(FrontendCors);

        // Swashbuckle is only the UI shell at /swagger; the document at /openapi/v1.json is Microsoft's.
        app.MapOpenApi();
        app.UseSwaggerUI(swagger =>
        {
            swagger.SwaggerEndpoint("/openapi/v1.json", "Atlas API v1");
            swagger.RoutePrefix = "swagger";
        });

        app.MapGet("/", () => Results.Text("Atlas API — POST /api/commitments"))
            .WithSummary("Health check.")
            .ExcludeFromDescription();
        app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }))
            .ExcludeFromDescription();

        // The ports only fetch by id, so the seed is read directly to enumerate the lists.
        app.MapGet("/api/reference", () =>
        {
            var seed = SeedData.Build();
            return Results.Ok(ReferenceData.From(seed));
        })
            .WithName("GetReferenceData")
            .WithSummary("Funds, deals and co-investments for the form dropdowns.");

        app.MapPost("/api/commitments", async (
            HttpContext http,
            CommitCapitalHandler handler,
            CancellationToken cancellationToken) =>
        {
            CommitCapitalRequest? request;
            try
            {
                request = await http.Request.ReadFromJsonAsync<CommitCapitalRequest>(cancellationToken);
            }
            catch (JsonException)
            {
                request = null;
            }

            if (request is null)
                return Results.BadRequest(new { error = "Request body is missing or not valid JSON." });

            var correlationId = Guid.NewGuid().ToString("N")[..12];
            var outcome = await handler.HandleAsync(request.ToCommand(), correlationId, cancellationToken);

            // Validated-but-rejected is a 422 with the errors and trace in the body; malformed JSON stays a 400.
            return outcome.Approved
                ? Results.Ok(CommitmentResponse.From(outcome))
                : Results.UnprocessableEntity(CommitmentResponse.From(outcome));
        })
            .WithName("CommitCapital")
            .WithSummary("Commit capital to a co-investment.")
            .WithDescription(
                "Returns the decision trace either way: 200 when approved, 422 when the "
                + "handler rejected it, 400 when the body is not valid JSON.")
            // The body is read off HttpContext, so the request shape must be stated or Swagger shows no schema.
            .Accepts<CommitCapitalRequest>("application/json")
            .Produces<CommitmentResponse>()
            .Produces<CommitmentResponse>(StatusCodes.Status422UnprocessableEntity)
            .Produces(StatusCodes.Status400BadRequest);

        var store = app.Services.GetRequiredService<I18nStore>();
        SeedTranslations(app.Logger, store.Folder);
        app.MapI18n(store);

        // Listens on ASPNETCORE_URLS: http://localhost:5179 in Development, http://+:8080 in the container.
        app.Run();
    }

    // An unwritable folder is logged, not fatal: the endpoints serve no locales until the mount is fixed.
    private static void SeedTranslations(ILogger logger, string folder)
    {
        try
        {
            var copied = I18nSeed.EnsureSeeded(folder, I18nSeed.BundledFolder);
            if (copied > 0)
                logger.LogInformation("Seeded {Count} translation files into {Folder}", copied, folder);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(exception, "Could not seed translations into {Folder}", folder);
        }
    }
}
