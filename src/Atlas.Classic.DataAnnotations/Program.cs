using Atlas.Classic.DataAnnotations;
using Atlas.Upstream.Contracts;

IUpstream upstream = InMemoryUpstream.Create();
var service = new CommitCapitalService(upstream);

var scenarioA = new CommitCapitalRequest
{
    FundId = "PF-APAC-CREDIT",
    CoInvestmentId = "CI-ROOT",
    DealId = "DEAL-PE-NA-02",
    Amount = 10_000_000m,
    Currency = "USD",
    AssetClass = AssetClass.PrivateEquity,
    Region = Region.NorthAmerica,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2026, 9, 1),
    RequestedBy = "pm.alice",
};

var scenarioB = new CommitCapitalRequest
{
    FundId = "PF-APAC-CREDIT",
    CoInvestmentId = "CI-SLEEVE-PC",
    DealId = "DEAL-PC-EMEA-01",
    Amount = 25_000_000m,
    Currency = "EUR",
    AssetClass = AssetClass.PrivateCredit,
    Region = Region.Emea,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2026, 7, 1),
    RequestedBy = "pm.bob",
};

var scenarioC = new CommitCapitalRequest
{
    FundId = "PF-DRAFT",
    CoInvestmentId = "CI-MISSING",
    DealId = "DEAL-CLOSED-04",
    Amount = -5_000_000m,
    Currency = "US",
    AssetClass = AssetClass.PrivateEquity,
    Region = Region.Emea,
    Liquidity = Liquidity.Illiquid,
    CommitmentDate = new DateOnly(2020, 1, 1),
    RequestedBy = "",
};

Console.WriteLine("=================================================================");
Console.WriteLine(" Atlas CommitCapital — Classic DataAnnotations + service validation");
Console.WriteLine("=================================================================");

await RunScenarioAsync("A", "Valid PE commitment", scenarioA);
await RunScenarioAsync("B", "Two simultaneous breaches", scenarioB);
await RunScenarioAsync("C", "Structural + state pileup", scenarioC);

Console.WriteLine();
Console.WriteLine("Done.");
return;

async Task RunScenarioAsync(string scenarioId, string name, CommitCapitalRequest request)
{
    CommitResult result = await service.ValidateAndCommitAsync(request);

    Console.WriteLine();
    Console.WriteLine($"--- Scenario {scenarioId}: {name} ---");
    Console.WriteLine($"Result: {(result.IsValid ? "VALID" : "INVALID")}");

    if (result.IsValid)
    {
        Console.WriteLine("  (no validation errors — commitment would be recorded)");
        return;
    }

    Console.WriteLine($"Errors ({result.Errors.Count}):");
    var index = 1;
    foreach (var error in result.Errors)
        Console.WriteLine($"  {index++,2}. {error}");
}
