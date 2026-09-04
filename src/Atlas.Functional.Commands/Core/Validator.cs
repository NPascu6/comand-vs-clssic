using System.Diagnostics;

namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// Runs a set of rules and turns them into (a) one aggregated Result and
// (b) a DecisionTrace.
//
// Two design choices that matter:
//
//  1. Rules run CONCURRENTLY (Task.WhenAll). Because each rule is independent
//     and fetches what it needs, the validator's wall-clock time is roughly the
//     slowest single rule, not the SUM of all upstream calls. The classic
//     adapter chain calls upstream sequentially; this does not.
//
//  2. Errors are AGGREGATED, never short-circuited. Every rule gets to speak,
//     so the caller sees the complete picture in one pass.
//
// A rule that throws is caught and recorded as a failure — a bug in one rule
// can never take down the whole evaluation or hide the other findings.
// ---------------------------------------------------------------------------

public sealed class Validator<T>
{
    private readonly IReadOnlyList<Rule<T>> _rules;

    public Validator(IEnumerable<Rule<T>> rules) => _rules = rules.ToList();

    public async Task<(Result Result, DecisionTrace Trace)> ValidateAsync(
        T input, string correlationId, CancellationToken ct = default)
    {
        var evaluated = await Task.WhenAll(_rules.Select(rule => RunAsync(rule, input, ct)));

        var result = Result.Combine(evaluated.Select(e => e.Result));
        var trace = new DecisionTrace(
            correlationId,
            typeof(T).Name,
            evaluated.Select(e => e.Entry).ToList());

        return (result, trace);
    }

    private static async Task<(Result Result, TraceEntry Entry)> RunAsync(
        Rule<T> rule, T input, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        Result result;
        try
        {
            result = await rule.Check(input, ct);
        }
        catch (Exception ex)
        {
            // A misbehaving rule becomes data, not a thrown exception that hides the rest.
            result = Result.Fail(new Error("RULE_THREW", $"{rule.Name} threw: {ex.Message}"));
        }
        sw.Stop();

        var entry = new TraceEntry(
            rule.Name,
            rule.Description,
            rule.Kind,
            result.IsSuccess ? RuleOutcome.Passed : RuleOutcome.Failed,
            Math.Round(sw.Elapsed.TotalMilliseconds, 2),
            result.Errors.Select(e => e.ToString()).ToList());

        return (result, entry);
    }
}
