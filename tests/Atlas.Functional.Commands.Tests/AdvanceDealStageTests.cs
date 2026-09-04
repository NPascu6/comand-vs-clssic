using Atlas.Functional.Commands.Pipelines;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// ---------------------------------------------------------------------------
// The SAME pattern, a NEW capability: a deal-stage state machine driven by a
// command + a transition rule + a thin handler, all on the owned Core.
//
// These run end-to-end against the seeded in-memory upstream and prove the
// three lifecycle outcomes that matter: a legal edge is approved with a
// receipt, an illegal edge is refused, and structural shape is enforced — with
// no new library and no change to the base CommandHandler.
// ---------------------------------------------------------------------------

public class AdvanceDealStageTests
{
    private static AdvanceDealStageHandler NewHandler() =>
        new(InMemoryUpstream.Create(latencyMs: 0));

    [Fact]
    public async Task Allowed_transition_is_approved_with_a_receipt()
    {
        // DEAL-PE-LATAM-09 is seeded as Pipeline; Pipeline -> Investable is a legal edge.
        var cmd = new AdvanceDealStageCommand("DEAL-PE-LATAM-09", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(cmd, "DST-ALLOW");

        Assert.True(outcome.Approved);
        Assert.Equal(DealStatus.Pipeline, outcome.Result.Value.From);
        Assert.Equal(DealStatus.Investable, outcome.Result.Value.To);
        Assert.Equal("DEAL-PE-LATAM-09", outcome.Result.Value.DealId);
    }

    [Fact]
    public async Task Disallowed_transition_is_rejected()
    {
        // DEAL-CLOSED-04 is Closed; Closed has no outgoing edges, so any move is illegal.
        var cmd = new AdvanceDealStageCommand("DEAL-CLOSED-04", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(cmd, "DST-DENY");
        var codes = outcome.Result.Errors.Select(e => e.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("TRANSITION_NOT_ALLOWED", codes);
    }

    [Fact]
    public async Task Missing_deal_is_rejected()
    {
        var cmd = new AdvanceDealStageCommand("DEAL-NOPE", DealStatus.Investable, "pm.alice");

        var outcome = await NewHandler().HandleAsync(cmd, "DST-MISSING");
        var codes = outcome.Result.Errors.Select(e => e.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("DEAL_NOT_FOUND", codes);
    }

    [Fact]
    public async Task Structural_shape_is_enforced()
    {
        var cmd = new AdvanceDealStageCommand("", DealStatus.Investable, "");

        var outcome = await NewHandler().HandleAsync(cmd, "DST-SHAPE");
        var codes = outcome.Result.Errors.Select(e => e.Code).ToList();

        Assert.False(outcome.Approved);
        Assert.Contains("REQUIRED", codes);
    }
}
