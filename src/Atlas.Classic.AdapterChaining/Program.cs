using System.Globalization;
using Atlas.Classic.AdapterChaining;
using Atlas.Upstream.Contracts;

// Pin the culture so number and date formatting is identical on every machine.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

IUpstream upstream = InMemoryUpstream.Create();
var facade = CommitmentFacade.FromUpstream(upstream);

Console.WriteLine("============================================================");
Console.WriteLine(" Atlas CommitCapital — CLASSIC facade + adapter chaining");
Console.WriteLine(" (SharePoint-wrapper DMS style: facade over upstream,");
Console.WriteLine("  adapters mapping between layers, rules scattered across)");
Console.WriteLine("============================================================");

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
