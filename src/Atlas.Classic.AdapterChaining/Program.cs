using System.Globalization;
using Atlas.Classic.AdapterChaining;
using Atlas.Upstream.Contracts;

// Pin culture so number/date formatting is identical on every machine, instead
// of inheriting the host's regional settings.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// ---------------------------------------------------------------------------
// Demo runner for the CLASSIC "facade + adapter chaining" approach.
//
// We construct the seeded upstream, wire the facade (which wires the whole
// adapter chain under it), and run the three presentation scenarios. The output
// shows VALID/INVALID plus the error(s) the chained orchestration surfaced.
//
// Watch scenario B specifically: the request breaks TWO business rules at once
// (co-investment headroom AND appetite), but the chained facade short-circuits
// on the first throw, so only ONE breach is reported. That is the headline
// limitation of this style for Atlas.
// ---------------------------------------------------------------------------

IUpstream upstream = InMemoryUpstream.Create();
var facade = CommitmentFacade.FromUpstream(upstream);

Console.WriteLine("============================================================");
Console.WriteLine(" Atlas CommitCapital — CLASSIC facade + adapter chaining");
Console.WriteLine(" (SharePoint-wrapper DMS style: facade over upstream,");
Console.WriteLine("  adapters mapping between layers, rules scattered across)");
Console.WriteLine("============================================================");

// -- Scenario A: a clean, valid PE commitment -------------------------------
var scenarioA = new CommitCapitalRequest
{
    FundId = "PF-APAC-CREDIT",
    CoInvestmentId = "CI-ROOT",
    DealId = "DEAL-PE-NA-02",
    RequestedBy = "pm.alice",
    Amount = 10_000_000m,
    Currency = "USD",
    AssetClass = AssetClass.PrivateEquity,
    Region = Region.NorthAmerica,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2026, 9, 1),
};
await RunScenarioAsync("A: Valid PE commitment", scenarioA);

// -- Scenario B: two simultaneous breaches (headroom AND appetite) ----------
// Headroom: CI-SLEEVE-PC has 20M, request is 25M  -> breach.
// Appetite: PrivateCredit|Emea sits at 230M of a 250M ceiling; +25M = 255M -> breach.
// The facade checks headroom (rule 5) BEFORE appetite (rule 6) and throws on the
// first, so we EXPECT to see only the headroom breach reported. Instructive.
var scenarioB = new CommitCapitalRequest
{
    FundId = "PF-APAC-CREDIT",
    CoInvestmentId = "CI-SLEEVE-PC",
    DealId = "DEAL-PC-EMEA-01",
    RequestedBy = "pm.bob",
    Amount = 25_000_000m,
    Currency = "EUR",
    AssetClass = AssetClass.PrivateCredit,
    Region = Region.Emea,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2026, 7, 1),
};
await RunScenarioAsync("B: Two simultaneous breaches (headroom + appetite)", scenarioB);

// -- Scenario C: structural + state pileup ----------------------------------
// Empty RequestedBy, negative Amount, 2-char Currency, past CommitmentDate, a
// Draft fund, a missing co-investment node, and a Closed deal. Structural
// validation (rule 1) catches the shape problems first and returns the full
// list, so the business adapters are never even reached.
var scenarioC = new CommitCapitalRequest
{
    FundId = "PF-DRAFT",
    CoInvestmentId = "CI-MISSING",
    DealId = "DEAL-CLOSED-04",
    RequestedBy = "",
    Amount = -5_000_000m,
    Currency = "US",
    AssetClass = AssetClass.PrivateEquity,
    Region = Region.Emea,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2020, 1, 1),
};
await RunScenarioAsync("C: Structural + state pileup", scenarioC);

Console.WriteLine();
Console.WriteLine("Done. Note how scenario B reports only ONE of its two breaches:");
Console.WriteLine("that is the chained-orchestration short-circuit, not a bug.");

return;

// -- local helper ------------------------------------------------------------
async Task RunScenarioAsync(string name, CommitCapitalRequest request)
{
    var result = await facade.SubmitCommitmentAsync(request);

    Console.WriteLine();
    Console.WriteLine($"------------------------------------------------------------");
    Console.WriteLine($"Scenario {name}");
    Console.WriteLine($"  Result : {(result.IsValid ? "VALID" : "INVALID")}");

    if (result.Errors.Count == 0)
    {
        Console.WriteLine("  Errors : (none)");
    }
    else
    {
        Console.WriteLine($"  Errors ({result.Errors.Count}):");
        foreach (var error in result.Errors)
            Console.WriteLine($"    - {error}");
    }
}
