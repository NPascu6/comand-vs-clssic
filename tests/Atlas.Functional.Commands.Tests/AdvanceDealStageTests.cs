using Atlas.Functional.Commands.Pipelines;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

public class AdvanceDealStageTests
{
    private static AdvanceDealStageHandler NewHandler() =>
        new(InMemoryUpstream.Create(latencyMs: 0));

    [Fact]
    public async Task Allowed_transition_is_approved_with_a_receipt()
    {
        // DEAL-PE-LATAM-09 is seeded as Pipeline; Pipeline -> Investable is a legal edge.
        var command = new AdvanceDealStageCommand("DEAL-PE-LATAM-09", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(command, "DST-ALLOW");

        Assert.True(outcome.Approved);
        Assert.Equal(DealStatus.Pipeline, outcome.Result.Value.From);
        Assert.Equal(DealStatus.Investable, outcome.Result.Value.To);
        Assert.Equal("DEAL-PE-LATAM-09", outcome.Result.Value.DealId);
    }

    [Fact]
    public async Task Disallowed_transition_is_rejected()
    {
        // DEAL-CLOSED-04 is Closed; Closed has no outgoing edges, so any move is illegal.
        var command = new AdvanceDealStageCommand("DEAL-CLOSED-04", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(command, "DST-DENY");
        var codes = outcome.Result.Errors.Select(error => error.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("TRANSITION_NOT_ALLOWED", codes);
    }

    [Fact]
    public async Task Missing_deal_is_rejected()
    {
        var command = new AdvanceDealStageCommand("DEAL-NOPE", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(command, "DST-MISSING");
        var codes = outcome.Result.Errors.Select(error => error.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("DEAL_NOT_FOUND", codes);
    }

    [Fact]
    public async Task Structural_shape_is_enforced()
    {
        var command = new AdvanceDealStageCommand("", DealStatus.Investable, "");

        var outcome = await NewHandler().HandleAsync(command, "DST-SHAPE");
        var codes = outcome.Result.Errors.Select(error => error.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("REQUIRED", codes);
    }
}
