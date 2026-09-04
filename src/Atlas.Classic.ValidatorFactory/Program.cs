using System.Globalization;
using Atlas.Classic.ValidatorFactory;

// Pin the culture so the N0-grouped amounts in error messages render identically on any machine.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

IUpstream upstream = Atlas.Upstream.Contracts.InMemoryUpstream.Create();

var scenarioA = new CommitCapitalInput(
    FundId: "PF-APAC-CREDIT",
    CoInvestmentId: "CI-ROOT",
    DealId: "DEAL-PE-NA-02",
    RequestedBy: "pm.alice",
    Amount: 10_000_000m,
    Currency: "USD",
    AssetClass: AssetClass.PrivateEquity,
    Region: Region.NorthAmerica,
    Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2026, 9, 1));

var scenarioB = new CommitCapitalInput(
    FundId: "PF-APAC-CREDIT",
    CoInvestmentId: "CI-SLEEVE-PC",
    DealId: "DEAL-PC-EMEA-01",
    RequestedBy: "pm.bob",
    Amount: 25_000_000m,
    Currency: "EUR",
    AssetClass: AssetClass.PrivateCredit,
    Region: Region.Emea,
    Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2026, 7, 1));

var scenarioC = new CommitCapitalInput(
    FundId: "PF-DRAFT",
    CoInvestmentId: "CI-MISSING",
    DealId: "DEAL-CLOSED-04",
    RequestedBy: "",
    Amount: -5_000_000m,
    Currency: "US",
    AssetClass: AssetClass.PrivateEquity,
    Region: Region.Emea,
    Liquidity: Liquidity.Illiquid,
    CommitmentDate: new DateOnly(2020, 1, 1));

await RunScenario("A: Valid PE commitment", scenarioA, upstream);
await RunScenario("B: Two simultaneous breaches", scenarioB, upstream);
await RunScenario("C: Structural + state pileup", scenarioC, upstream);

static async Task RunScenario(string name, CommitCapitalInput input, IUpstream upstream)
{
    Console.WriteLine(new string('-', 72));
    Console.WriteLine($"SCENARIO {name}");

    // IValidator<T> is synchronous, so upstream data is prefetched before the validator is built.
    var context = await CommitCapitalContext.LoadAsync(upstream, input);

    var factory = new ValidatorFactory()
        .Register<CommitCapitalInput>(new CommitCapitalValidator(context));

    IValidator<CommitCapitalInput> validator = factory.GetValidator<CommitCapitalInput>();
    ValidationResult result = validator.Validate(input);

    Console.WriteLine(result.IsValid ? "RESULT : VALID" : "RESULT : INVALID");
    if (!result.IsValid)
    {
        Console.WriteLine($"ERRORS ({result.Errors.Count}):");
        foreach (var error in result.Errors)
            Console.WriteLine($"  - {error}");
    }

    Console.WriteLine();
}
