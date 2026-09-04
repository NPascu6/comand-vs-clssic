using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

public static partial class AdvanceDealStageRules
{
    public static Rule<AdvanceDealStageCommand> TransitionMustBeValid(IDealClient deals) => new(
        Name: "TransitionMustBeValid",
        Description: "Deal exists and the requested move is an allowed edge in the deal-stage machine",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var deal = await deals.GetDealAsync(command.DealId, cancellationToken);
            if (deal is null)
                return new Error("DEAL_NOT_FOUND", $"Deal '{command.DealId}' was not found", Field: nameof(command.DealId));

            if (!DealStageMachine.CanTransition(deal.Status, command.TargetStage))
                return new Error("TRANSITION_NOT_ALLOWED", $"Deal '{command.DealId}' cannot move {deal.Status} → {command.TargetStage}", Field: nameof(command.TargetStage));

            return Result.Success();
        });
}
