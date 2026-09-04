using System.Linq.Expressions;
using System.Text.RegularExpressions;

namespace Atlas.Functional.Commands.Core;

/// <summary>Declarative RuleFor-style validation; every declared rule is a Rule&lt;T&gt; and runs on the same Validator&lt;T&gt;.</summary>
public abstract class Spec<T>
{
    private readonly List<Rule<T>> _rules = new();

    public IReadOnlyList<Rule<T>> Rules => _rules;

    protected PropertyRules<T, TProp> RuleFor<TProp>(Expression<Func<T, TProp>> selector)
    {
        var propertyRules = new PropertyRules<T, TProp>(selector);
        _rules.Add(propertyRules.ToRule());
        return propertyRules;
    }

    protected void MustAsync(string name, string description, RuleCheck<T> check)
        => _rules.Add(new Rule<T>(name, description, RuleKind.Upstream, check));

    protected void Add(Rule<T> rule) => _rules.Add(rule);

    protected void Include(Spec<T> other) => _rules.AddRange(other.Rules);
}

/// <summary>All checks on one property become a single Rule&lt;T&gt;.</summary>
public sealed class PropertyRules<T, TProp>
{
    private readonly Func<T, TProp> _get;
    private readonly string _name;
    private readonly List<(Func<TProp, bool> Passes, string Code, string Message)> _checks = new();
    private Func<T, bool>? _when;

    internal PropertyRules(Expression<Func<T, TProp>> selector)
    {
        _get = selector.Compile();
        _name = selector.Body switch
        {
            MemberExpression member => member.Member.Name,
            UnaryExpression { Operand: MemberExpression converted } => converted.Member.Name,
            _ => "value",
        };
    }

    private PropertyRules<T, TProp> Check(Func<TProp, bool> passes, string code, string message)
    {
        _checks.Add((passes, code, message));
        return this;
    }

    public PropertyRules<T, TProp> NotEmpty(string? message = null) => Check(
        value => (object?)value switch
        {
            null => false,
            string text => !string.IsNullOrWhiteSpace(text),
            Guid guid => guid != Guid.Empty,
            _ => true,
        },
        "REQUIRED", message ?? $"{_name} is required");

    public PropertyRules<T, TProp> GreaterThan(TProp min, string? message = null) => Check(
        value => Comparer<TProp>.Default.Compare(value, min) > 0,
        "OUT_OF_RANGE", message ?? $"{_name} must be greater than {min}");

    public PropertyRules<T, TProp> Length(int exact, string? message = null) => Check(
        value => (object?)value is string text && text.Length == exact,
        "LENGTH", message ?? $"{_name} must be exactly {exact} characters");

    public PropertyRules<T, TProp> MaximumLength(int max, string? message = null) => Check(
        value => (object?)value is string text && text.Length <= max,
        "MAX_LENGTH", message ?? $"{_name} must be at most {max} characters");

    public PropertyRules<T, TProp> Matches(string pattern, string? message = null) => Check(
        value => (object?)value is string text && Regex.IsMatch(text, pattern),
        "FORMAT", message ?? $"{_name} has an invalid format");

    public PropertyRules<T, TProp> Must(Func<TProp, bool> predicate, string code, string message) =>
        Check(predicate, code, message);

    public PropertyRules<T, TProp> When(Func<T, bool> condition)
    {
        _when = condition;
        return this;
    }

    /// <summary>Overrides the message of the most recently added check.</summary>
    public PropertyRules<T, TProp> WithMessage(string message)
    {
        if (_checks.Count > 0) { var last = _checks[^1]; _checks[^1] = (last.Passes, last.Code, message); }
        return this;
    }

    /// <summary>Overrides the code of the most recently added check.</summary>
    public PropertyRules<T, TProp> WithCode(string code)
    {
        if (_checks.Count > 0) { var last = _checks[^1]; _checks[^1] = (last.Passes, code, last.Message); }
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
            foreach (var (passes, code, message) in _checks)
                if (!passes(value)) errors.Add(new Error(code, message, Field: _name));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
