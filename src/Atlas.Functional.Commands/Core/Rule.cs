namespace Atlas.Functional.Commands.Core;

public enum RuleKind
{
    Structural,
    Upstream
}

public delegate Task<Result> RuleCheck<in T>(T input, CancellationToken cancellationToken);

/// <summary>A rule is a value: testable alone with one fake client, runnable concurrently, recorded by name in the trace.</summary>
public sealed record Rule<T>(
    string Name,
    string Description,
    RuleKind Kind,
    RuleCheck<T> Check);
