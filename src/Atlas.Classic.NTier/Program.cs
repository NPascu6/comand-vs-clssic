using System.Globalization;
using Atlas.Classic.NTier.Configuration;
using Atlas.Classic.NTier.Controllers;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories;
using Atlas.Classic.NTier.Services;
using Atlas.Classic.NTier.Validation;

// Pin the culture so the N0-grouped amounts in error messages render identically on any machine.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

IUpstream upstream = Atlas.Upstream.Contracts.InMemoryUpstream.Create();

var mapper = new CommitmentMapper();

IFundRepository fundRepository = new FundRepository(upstream.Funds, mapper);
IDealRepository dealRepository = new DealRepository(upstream.Deals, mapper);
ICoInvestmentRepository coInvestmentRepository = new CoInvestmentRepository(upstream.CoInvestments, mapper);
IExposureRepository exposureRepository = new ExposureRepository(upstream.Exposure, mapper);

var appetiteConfig = new AppetiteConfigFactory().Load();

IValidatorFactory validatorFactory = new ValidatorFactory()
    .Register<CommitCapitalRequest>(new CommitCapitalRequestValidator());

ICommitmentService service = new CommitmentService(
    validatorFactory,
    fundRepository,
    dealRepository,
    coInvestmentRepository,
    exposureRepository,
    appetiteConfig);

var controller = new CommitmentController(service, mapper);

var scenarioA = new CommitCapitalDto
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

var scenarioB = new CommitCapitalDto
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

var scenarioC = new CommitCapitalDto
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

await RunScenario("A: Valid PE commitment", scenarioA, controller);
await RunScenario("B: Two simultaneous breaches", scenarioB, controller);
await RunScenario("C: Structural + state pileup", scenarioC, controller);

static async Task RunScenario(string name, CommitCapitalDto dto, CommitmentController controller)
{
    Console.WriteLine(new string('-', 72));
    Console.WriteLine($"SCENARIO {name}");

    CommitmentResponseDto response = await controller.Submit(dto);

    Console.WriteLine(response.Success
        ? $"RESULT : SUCCESS (HTTP {response.StatusCode})"
        : $"RESULT : FAILURE (HTTP {response.StatusCode})");

    if (response.Success)
    {
        Console.WriteLine($"BOOKED : {response.CommitmentId}");
    }
    else
    {
        Console.WriteLine($"ERRORS ({response.Errors.Count}):");
        foreach (var error in response.Errors)
            Console.WriteLine($"  - {error}");
    }

    Console.WriteLine();
}
