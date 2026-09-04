using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

// ---------------------------------------------------------------------------
// The handler: a state-machine transition, assembled from the owned Core.
//
// Same Core, new feature: a state-machine transition is just a command + a
// transition rule + a thin handler. The base class runs the rules, aggregates
// errors, and builds the audit trace — exactly as it does for CommitCapital.
// Nothing about advancing a deal's lifecycle needed a new framework, a new base
// type, or a new library. The pattern simply scaled.
// ---------------------------------------------------------------------------

public sealed class AdvanceDealStageHandler(IUpstream upstream)
    : CommandHandler<AdvanceDealStageCommand, DealStageReceipt>
{
    protected override IEnumerable<Rule<AdvanceDealStageCommand>> Rules(AdvanceDealStageCommand command) =>
    [
        AdvanceDealStageRules.Structural(),
        AdvanceDealStageRules.TransitionMustBeValid(upstream.Deals),
    ];

    protected override async Task<Result<DealStageReceipt>> ExecuteAsync(
        AdvanceDealStageCommand command, CancellationToken ct)
    {
        // By the time we are here every rule has approved, so the transition is legal.
        // Re-fetch the deal to capture the From status for the receipt; in production
        // this is where we PATCH the deal's stage upstream and emit a domain event.
        var deal = await upstream.Deals.GetDealAsync(command.DealId, ct);

        return Result<DealStageReceipt>.Success(new DealStageReceipt(
            TransitionId: $"DST-{command.DealId}-{command.TargetStage}",
            command.DealId,
            From: deal!.Status,
            To: command.TargetStage,
            command.RequestedBy));
    }
}
