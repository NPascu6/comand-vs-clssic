using System.Diagnostics;
using System.Globalization;
using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

// Deterministic, host-independent formatting (thousands separators, dates).
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// ===========================================================================
//  Atlas CommitCapital — Functional command + async validation + handler
//
//  Same operation, same upstream data, same three scenarios as each classic
//  sample. The difference is what you SEE: a complete set of errors in one
//  pass, and a structured decision trace you could hand to an auditor.
// ===========================================================================

// One shared upstream; each command gets a request-scoped memoizing wrapper, so
// concurrent rules reading the same upstream share a single call (no duplicates).
IUpstream baseUpstream = InMemoryUpstream.Create();
var today = new DateOnly(2026, 6, 13);

Console.WriteLine("===============================================================");
Console.WriteLine(" Atlas CommitCapital — Functional command + async validation");
Console.WriteLine("===============================================================");

// --- Scenario A: valid -----------------------------------------------------
await Run("SCN-A", "Valid PE commitment", new CommitCapitalCommand(
    FundId: "PF-APAC-CREDIT", CoInvestmentId: "CI-ROOT", DealId: "DEAL-PE-NA-02",
    Amount: 10_000_000m, Currency: "USD", AssetClass: AssetClass.PrivateEquity,
    Region: Region.NorthAmerica, Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2026, 9, 1), RequestedBy: "pm.alice"));

// --- Scenario B: two simultaneous breaches ---------------------------------
await Run("SCN-B", "Two simultaneous breaches", new CommitCapitalCommand(
    FundId: "PF-APAC-CREDIT", CoInvestmentId: "CI-SLEEVE-PC", DealId: "DEAL-PC-EMEA-01",
    Amount: 25_000_000m, Currency: "EUR", AssetClass: AssetClass.PrivateCredit,
    Region: Region.Emea, Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2026, 7, 1), RequestedBy: "pm.bob"), printTrace: true);

// --- Scenario C: structural + state pileup ---------------------------------
await Run("SCN-C", "Structural + state pileup", new CommitCapitalCommand(
    FundId: "PF-DRAFT", CoInvestmentId: "CI-MISSING", DealId: "DEAL-CLOSED-04",
    Amount: -5_000_000m, Currency: "US", AssetClass: AssetClass.PrivateEquity,
    Region: Region.Emea, Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2020, 1, 1), RequestedBy: ""));

return;

async Task Run(string correlationId, string title, CommitCapitalCommand cmd, bool printTrace = false)
{
    Console.WriteLine();
    Console.WriteLine($"--- {title}  ({correlationId}) ---");

    // request-scoped: memoize the upstream for the lifetime of this one command
    var handler = new CommitCapitalHandler(new MemoizedUpstream(baseUpstream), today);

    var sw = Stopwatch.StartNew();
    HandlerOutcome<CommitmentReceipt> outcome = await handler.HandleAsync(cmd, correlationId);
    sw.Stop();

    if (outcome.Approved)
    {
        Console.WriteLine($"Result: VALID — receipt {outcome.Result.Value.CommitmentId}");
    }
    else
    {
        Console.WriteLine($"Result: INVALID  ({outcome.Result.Errors.Count} error(s) — ALL reported in one pass)");
        var i = 1;
        foreach (var e in outcome.Result.Errors)
            Console.WriteLine($"  {i++,2}. {e}");
    }

    // Concurrency win: wall-clock is ~ the slowest rule, not the sum of all upstream calls.
    Console.WriteLine(
        $"     rules: {outcome.Trace.Entries.Count}  passed: {outcome.Trace.Passed}  failed: {outcome.Trace.Failed}  " +
        $"| wall-clock {sw.Elapsed.TotalMilliseconds:F0}ms vs sum-of-rules {outcome.Trace.TotalRuleMs:F0}ms");

    if (printTrace)
    {
        Console.WriteLine();
        Console.WriteLine("     decision trace (trading-grade audit record, serialized with in-box System.Text.Json):");
        foreach (var line in outcome.Trace.ToJson().Split('\n'))
            Console.WriteLine("     " + line.TrimEnd());
    }
}
