using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

public static partial class AdvanceDealStageRules
{
    /// <summary>Rule 2 — the deal exists and the requested move is a legal edge in the state machine.</summary>
    public static Rule<AdvanceDealStageCommand> TransitionMustBeValid(IDealClient deals) => new(
        Name: "TransitionMustBeValid",
        Description: "Deal exists and the requested move is an allowed edge in the deal-stage machine",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            var deal = await deals.GetDealAsync(cmd.DealId, ct);
            if (deal is null)
                return new Error("DEAL_NOT_FOUND", $"Deal '{cmd.DealId}' was not found", Field: nameof(cmd.DealId));

            if (!DealStageMachine.CanTransition(deal.Status, cmd.TargetStage))
                return new Error("TRANSITION_NOT_ALLOWED", $"Deal '{cmd.DealId}' cannot move {deal.Status} → {cmd.TargetStage}", Field: nameof(cmd.TargetStage));

            return Result.Success();
        });
}
