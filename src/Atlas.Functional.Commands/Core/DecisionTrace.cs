using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atlas.Functional.Commands.Core;

public enum RuleOutcome
{
    Passed,
    Failed
}

public sealed record TraceEntry(
    string Rule,
    string Description,
    RuleKind Kind,
    RuleOutcome Outcome,
    double ElapsedMs,
    IReadOnlyList<string> Messages);

/// <summary>Plain data for the audit trail: every rule that ran, how it decided and what it took.</summary>
public sealed record DecisionTrace(
    string CorrelationId,
    string Command,
    IReadOnlyList<TraceEntry> Entries)
{
    public bool Approved => Entries.All(entry => entry.Outcome == RuleOutcome.Passed);

    public int Passed => Entries.Count(entry => entry.Outcome == RuleOutcome.Passed);
    public int Failed => Entries.Count(entry => entry.Outcome == RuleOutcome.Failed);

    /// <summary>Sum of per-rule time; compare with wall-clock to see the gain from running rules concurrently.</summary>
    public double TotalRuleMs => Entries.Sum(entry => entry.ElapsedMs);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        // An internal audit record, not HTML output: relaxed escaping keeps it human-readable.
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public string ToJson() => JsonSerializer.Serialize(this, JsonOpts);
}
