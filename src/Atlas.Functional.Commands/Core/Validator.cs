using System.Diagnostics;

namespace Atlas.Functional.Commands.Core;

/// <summary>Rules run concurrently and every error is aggregated, never short-circuited.</summary>
public sealed class Validator<T>
{
    private readonly IReadOnlyList<Rule<T>> _rules;

    public Validator(IEnumerable<Rule<T>> rules) => _rules = rules.ToList();

    public async Task<(Result Result, DecisionTrace Trace)> ValidateAsync(
        T input, string correlationId, CancellationToken cancellationToken = default)
    {
        var evaluated = await Task.WhenAll(_rules.Select(rule => RunAsync(rule, input, cancellationToken)));

        var result = Result.Combine(evaluated.Select(evaluation => evaluation.Result));
        var trace = new DecisionTrace(
            correlationId,
            typeof(T).Name,
            evaluated.Select(evaluation => evaluation.Entry).ToList());

        return (result, trace);
    }

    private static async Task<(Result Result, TraceEntry Entry)> RunAsync(
        Rule<T> rule, T input, CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        Result result;
        try
        {
            result = await rule.Check(input, cancellationToken);
        }
        catch (Exception exception)
        {
            // A misbehaving rule becomes data, not a thrown exception that hides the other findings.
            result = Result.Fail(new Error("RULE_THREW", $"{rule.Name} threw: {exception.Message}"));
        }
        stopwatch.Stop();

        var entry = new TraceEntry(
            rule.Name,
            rule.Description,
            rule.Kind,
            result.IsSuccess ? RuleOutcome.Passed : RuleOutcome.Failed,
            Math.Round(stopwatch.Elapsed.TotalMilliseconds, 2),
            result.Errors.Select(error => error.ToString()).ToList());

        return (result, entry);
    }
}
