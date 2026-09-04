using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Pipelines;

/// <summary>The lifecycle as data: add a stage or an edge here and the command, rule and handler stay unchanged.</summary>
public static class DealStageMachine
{
    public static readonly IReadOnlyDictionary<DealStatus, DealStatus[]> Allowed =
        new Dictionary<DealStatus, DealStatus[]>
        {
            [DealStatus.Pipeline] = [DealStatus.Investable, DealStatus.Withdrawn],
            [DealStatus.Investable] = [DealStatus.Closed, DealStatus.Withdrawn],
            [DealStatus.Closed] = [],
            [DealStatus.Withdrawn] = [],
        };

    public static bool CanTransition(DealStatus current, DealStatus target) =>
        Allowed.TryGetValue(current, out var targets) && targets.Contains(target);
}
