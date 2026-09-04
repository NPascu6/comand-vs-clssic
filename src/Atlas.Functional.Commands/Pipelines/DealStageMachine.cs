using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

// ---------------------------------------------------------------------------
// The deal lifecycle AS DATA.
//
// A state machine is usually written as a tangle of switch statements or a
// pile of if-chains. Here it is just a dictionary of allowed edges plus a
// single lookup. The lifecycle is data — add a stage or an edge here; the
// command/rule/handler do not change. This is a state machine expressed with
// the SAME functional pieces that validate CommitCapital.
// ---------------------------------------------------------------------------

public static class DealStageMachine
{
    /// <summary>The allowed transitions: from each stage, the stages it may move to.</summary>
    public static readonly IReadOnlyDictionary<DealStatus, DealStatus[]> Allowed =
        new Dictionary<DealStatus, DealStatus[]>
        {
            [DealStatus.Pipeline] = [DealStatus.Investable, DealStatus.Withdrawn],
            [DealStatus.Investable] = [DealStatus.Closed, DealStatus.Withdrawn],
            [DealStatus.Closed] = [],
            [DealStatus.Withdrawn] = [],
        };

    public static bool CanTransition(DealStatus from, DealStatus to) =>
        Allowed.TryGetValue(from, out var t) && t.Contains(to);
}
