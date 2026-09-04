namespace Atlas.Classic.ValidatorFactory;

// ===========================================================================
// HOMEGROWN validation abstraction (Framework/).
//
// This is the kind of thing a competent enterprise team writes in-house when
// it has decided, as a matter of policy, NOT to take a dependency on
// FluentValidation (or any third-party validation library). The reasons are
// usually real: "one less transitive dependency to audit", "we don't want our
// domain rules coupled to a library's fluent DSL", "we already have a validator
// interface from 2015". So they hand-roll IValidator<T> + a result type + a
// factory/registry. None of this is strawman code — it is exactly the shape you
// find in long-lived line-of-business systems.
//
// The cracks only show once the rules need *async upstream I/O*, which Atlas rules
// all do. The Validators/ folder is where the pattern starts to fight the problem.
// ===========================================================================

/// <summary>
/// Hand-rolled validation result: the classic "bool + list of strings" shape.
///
/// Note what it deliberately does NOT have, because homegrown types rarely grow
/// these until someone gets burned:
///   * no per-rule identity (which rule produced which message?)
///   * no severity (error vs warning)
///   * no machine-readable code, only human prose
///   * no structured trace of which rules even RAN vs were short-circuited
/// For a trading-adjacent system like Atlas, that missing audit trail is a real
/// gap — see the README "Cons".
/// </summary>
public sealed class ValidationResult
{
    private readonly List<string> _errors = new();

    public bool IsValid => _errors.Count == 0;

    public IReadOnlyList<string> Errors => _errors;

    public void AddError(string message) => _errors.Add(message);

    /// <summary>Fold another result's errors into this one (manual aggregation).</summary>
    public void Merge(ValidationResult other) => _errors.AddRange(other._errors);

    public static ValidationResult Success() => new();

    public static ValidationResult Fail(string message)
    {
        var r = new ValidationResult();
        r.AddError(message);
        return r;
    }
}
