using System.Linq.Expressions;
using System.Text.RegularExpressions;

namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// A declarative validator — the declarative, FluentValidation-style ergonomics
// (RuleFor(x => x.Field).NotEmpty()..., a generic base + derived
// specialisations, .When(...) conditionals) — but on the core
// the team OWNS:
//
//   * no FluentValidation, no library to couple to (~120 lines, right here);
//   * ASYNC is first-class via MustAsync/Add — FluentValidation's weak spot;
//   * every declared rule becomes a Rule<T>, so the SAME concurrent Validator<T>
//     runs them and the SAME DecisionTrace records them.
//
// Use it when a declarative spec reads better than one-file-per-rule. Both
// styles produce Rule<T> and run on the identical machinery — pick per feature.
// ---------------------------------------------------------------------------

public abstract class Spec<T>
{
    private readonly List<Rule<T>> _rules = new();

    /// <summary>The rules this spec declares — feed straight to a Validator&lt;T&gt; or a handler.</summary>
    public IReadOnlyList<Rule<T>> Rules => _rules;

    /// <summary>Declare structural conditions on one property (FluentValidation-style chaining).</summary>
    protected PropertyRules<T, TProp> RuleFor<TProp>(Expression<Func<T, TProp>> selector)
    {
        var pr = new PropertyRules<T, TProp>(selector);
        _rules.Add(pr.ToRule());
        return pr;
    }

    /// <summary>Declare an async business rule that consults upstream — the thing FluentValidation does awkwardly.</summary>
    protected void MustAsync(string name, string description, RuleCheck<T> check)
        => _rules.Add(new Rule<T>(name, description, RuleKind.Upstream, check));

    /// <summary>Reuse an existing named Rule&lt;T&gt; (single source of truth with the handler).</summary>
    protected void Add(Rule<T> rule) => _rules.Add(rule);

    /// <summary>Compose another spec's rules — base/derived reuse, without inheritance.</summary>
    protected void Include(Spec<T> other) => _rules.AddRange(other.Rules);
}

/// <summary>Fluent builder for one property's structural checks. Becomes a single Rule&lt;T&gt;.</summary>
public sealed class PropertyRules<T, TProp>
{
    private readonly Func<T, TProp> _get;
    private readonly string _name;
    private readonly List<(Func<TProp, bool> Ok, string Code, string Message)> _checks = new();
    private Func<T, bool>? _when;

    internal PropertyRules(Expression<Func<T, TProp>> selector)
    {
        _get = selector.Compile();
        _name = selector.Body switch
        {
            MemberExpression m => m.Member.Name,
            UnaryExpression { Operand: MemberExpression m2 } => m2.Member.Name,
            _ => "value",
        };
    }

    private PropertyRules<T, TProp> Check(Func<TProp, bool> ok, string code, string message)
    {
        _checks.Add((ok, code, message));
        return this;
    }

    public PropertyRules<T, TProp> NotEmpty(string? message = null) => Check(
        v => (object?)v switch
        {
            null => false,
            string s => !string.IsNullOrWhiteSpace(s),
            Guid g => g != Guid.Empty,
            _ => true,
        },
        "REQUIRED", message ?? $"{_name} is required");

    public PropertyRules<T, TProp> GreaterThan(TProp min, string? message = null) => Check(
        v => Comparer<TProp>.Default.Compare(v, min) > 0,
        "OUT_OF_RANGE", message ?? $"{_name} must be greater than {min}");

    public PropertyRules<T, TProp> Length(int exact, string? message = null) => Check(
        v => (object?)v is string s && s.Length == exact,
        "LENGTH", message ?? $"{_name} must be exactly {exact} characters");

    public PropertyRules<T, TProp> MaximumLength(int max, string? message = null) => Check(
        v => (object?)v is string s && s.Length <= max,
        "MAX_LENGTH", message ?? $"{_name} must be at most {max} characters");

    public PropertyRules<T, TProp> Matches(string pattern, string? message = null) => Check(
        v => (object?)v is string s && Regex.IsMatch(s, pattern),
        "FORMAT", message ?? $"{_name} has an invalid format");

    public PropertyRules<T, TProp> Must(Func<TProp, bool> predicate, string code, string message) =>
        Check(predicate, code, message);

    /// <summary>Only evaluate the checks above when the condition holds (FluentValidation's .When).</summary>
    public PropertyRules<T, TProp> When(Func<T, bool> condition)
    {
        _when = condition;
        return this;
    }

    /// <summary>Override the message of the most recently added check.</summary>
    public PropertyRules<T, TProp> WithMessage(string message)
    {
        if (_checks.Count > 0) { var c = _checks[^1]; _checks[^1] = (c.Ok, c.Code, message); }
        return this;
    }

    /// <summary>Override the machine-readable code of the most recently added check.</summary>
    public PropertyRules<T, TProp> WithCode(string code)
    {
        if (_checks.Count > 0) { var c = _checks[^1]; _checks[^1] = (c.Ok, code, c.Message); }
        return this;
    }

    internal Rule<T> ToRule() => new(
        Name: _name,
        Description: $"Well-formed {_name}",
        Kind: RuleKind.Structural,
        Check: (input, _) =>
        {
            if (_when is not null && !_when(input))
                return Task.FromResult(Result.Success());

            var value = _get(input);
            var errors = new List<Error>();
            foreach (var (ok, code, message) in _checks)
                if (!ok(value)) errors.Add(new Error(code, message, Field: _name));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
