namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// A validation rule is a VALUE, not a place in a call chain.
//
// Each rule is: a Name + Description (for the audit trail), a Kind (does it
// touch upstream I/O?), and an async Check. Because a rule is just data with a
// function, you can:
//   - test it in complete isolation (give it an input + a fake client),
//   - run many of them concurrently,
//   - add a new one without editing any existing method,
//   - and record exactly which ones ran and how they decided.
//
// Note the Check is ASYNC by construction. In Atlas almost every meaningful rule
// must call an upstream service, so async is the default, not an afterthought.
// ---------------------------------------------------------------------------

public enum RuleKind
{
    /// <summary>Pure shape/structure check — no I/O.</summary>
    Structural,

    /// <summary>Business rule that must consult an upstream service.</summary>
    Upstream
}

/// <summary>The decision function for a rule: given the input, succeed or return errors.</summary>
public delegate Task<Result> RuleCheck<in T>(T input, CancellationToken ct);

public sealed record Rule<T>(
    string Name,
    string Description,
    RuleKind Kind,
    RuleCheck<T> Check);
