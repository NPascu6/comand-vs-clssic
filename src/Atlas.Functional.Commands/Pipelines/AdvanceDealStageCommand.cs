using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

// ---------------------------------------------------------------------------
// The command and its result — a deal-stage transition.
//
// Exactly like CommitCapitalCommand: an immutable, intention-revealing record
// carrying only the data needed to decide. "Move this deal to this stage, on
// behalf of this person." No behaviour, no framework, trivial to construct in
// a test.
// ---------------------------------------------------------------------------

public sealed record AdvanceDealStageCommand(
    string DealId,
    DealStatus TargetStage,
    string RequestedBy);

/// <summary>What the handler returns once a transition has been accepted and recorded.</summary>
public sealed record DealStageReceipt(
    string TransitionId,
    string DealId,
    DealStatus From,
    DealStatus To,
    string RequestedBy);
