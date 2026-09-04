using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

public sealed record AdvanceDealStageCommand(
    string DealId,
    DealStatus TargetStage,
    string RequestedBy);

public sealed record DealStageReceipt(
    string TransitionId,
    string DealId,
    DealStatus From,
    DealStatus To,
    string RequestedBy);
