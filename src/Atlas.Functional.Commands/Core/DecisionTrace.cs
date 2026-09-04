using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// Traceability without a logging library.
//
// Coming from trading, the audit question is never "did it pass?" but "WHY did
// it decide that, and what did it look at?". A DecisionTrace answers that: for
// one command it records every rule that ran, the outcome, how long the
// upstream call took, and the exact messages produced.
//
// It is plain data, serialized with the in-box System.Text.Json. No Serilog, no
// third-party sink. You can write it to a file, an event, a DB column, or a
// Kafka topic — the team decides, because the team owns the shape.
// ---------------------------------------------------------------------------

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

public sealed record DecisionTrace(
    string CorrelationId,
    string Command,
    IReadOnlyList<TraceEntry> Entries)
{
    public bool Approved => Entries.All(e => e.Outcome == RuleOutcome.Passed);

    public int Passed => Entries.Count(e => e.Outcome == RuleOutcome.Passed);
    public int Failed => Entries.Count(e => e.Outcome == RuleOutcome.Failed);

    /// <summary>Sum of per-rule time. Compare to wall-clock to see the win from running rules concurrently.</summary>
    public double TotalRuleMs => Entries.Sum(e => e.ElapsedMs);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        // This is an internal audit record, not HTML output — relaxed escaping keeps it human-readable.
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public string ToJson() => JsonSerializer.Serialize(this, JsonOpts);
}
