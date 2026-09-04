using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

public sealed class AdvanceDealStageHandler(IUpstream upstream)
    : CommandHandler<AdvanceDealStageCommand, DealStageReceipt>
{
    protected override IEnumerable<Rule<AdvanceDealStageCommand>> Rules(AdvanceDealStageCommand command) =>
    [
        AdvanceDealStageRules.Structural(),
        AdvanceDealStageRules.TransitionMustBeValid(upstream.Deals),
    ];

    protected override async Task<Result<DealStageReceipt>> ExecuteAsync(
        AdvanceDealStageCommand command, CancellationToken cancellationToken)
    {
        // Re-fetched for the From status; in production this is where the stage is PATCHed upstream.
        var deal = await upstream.Deals.GetDealAsync(command.DealId, cancellationToken);

        return Result<DealStageReceipt>.Success(new DealStageReceipt(
            TransitionId: $"DST-{command.DealId}-{command.TargetStage}",
            command.DealId,
            From: deal!.Status,
            To: command.TargetStage,
            command.RequestedBy));
    }
}
