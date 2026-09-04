using System.Globalization;
using Atlas.Classic.NTier.Configuration;
using Atlas.Classic.NTier.Controllers;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories;
using Atlas.Classic.NTier.Services;
using Atlas.Classic.NTier.Validation;

// Pin formatting so the N0-grouped amounts in error messages render identically
// (comma thousands separators) on any machine, regardless of its locale.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// ===========================================================================
// Atlas.Classic.NTier — demo entry point AND manual composition root.
//
// There is no DI container here on purpose: newing everything up by hand makes
// the wiring COUNT visible. For ONE feature (CommitCapital) the composition root
// has to construct, in order:
//
//   1  upstream bundle (InMemoryUpstream)
//   2  the hand-rolled mapper
//   3  FundRepository      (port -> entity)
//   4  DealRepository
//   5  CoInvestmentRepository
//   6  ExposureRepository
//   7  the AppetiteConfigFactory ... and call it to load the JSON config
//   8  the ValidatorFactory ... and Register the structural validator on it
//   9  the CommitmentService     (six dependencies)
//  10  the CommitmentController  (service + mapper)
//
// Ten construction steps before a single request can be handled. The functional
// command sample wires the same feature in a fraction of this.
// ===========================================================================

// (1) upstream bundle — the fake-over-seed-data implementation of every port.
IUpstream upstream = Atlas.Upstream.Contracts.InMemoryUpstream.Create();

// (2) the one mapper, shared by the repositories and the controller.
var mapper = new CommitmentMapper();

// (3-6) one repository per aggregate, each wrapping its upstream port + the mapper.
IFundRepository fundRepository = new FundRepository(upstream.Funds, mapper);
IDealRepository dealRepository = new DealRepository(upstream.Deals, mapper);
ICoInvestmentRepository coInvestmentRepository = new CoInvestmentRepository(upstream.CoInvestments, mapper);
IExposureRepository exposureRepository = new ExposureRepository(upstream.Exposure, mapper);

// (7) the JSON config layer — load + deserialize appetite.config.json (throws if missing).
var appetiteConfig = new AppetiteConfigFactory().Load();

// (8) the homegrown validator factory — register the structural validator by type.
IValidatorFactory validatorFactory = new ValidatorFactory()
    .Register<CommitCapitalRequest>(new CommitCapitalRequestValidator());

// (9) the god service — six dependencies funnel in here.
ICommitmentService service = new CommitmentService(
    validatorFactory,
    fundRepository,
    dealRepository,
    coInvestmentRepository,
    exposureRepository,
    appetiteConfig);

// (10) the controller — the only thing the "endpoints" below talk to.
var controller = new CommitmentController(service, mapper);

// ---------------------------------------------------------------------------
// The three scenarios — identical inputs to every other sample in the suite,
// expressed here as inbound DTOs (the wire shape the controller binds).
// ---------------------------------------------------------------------------

// Scenario A: a clean private-equity commitment. EXPECT VALID (HTTP 200).
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

// Scenario B: two simultaneous business breaches. EXPECT INVALID (HTTP 422).
// headroom (CI-SLEEVE-PC = 20M < 25M) AND appetite (230M + 25M > 250M). Both are
// reported because rules 5 and 6 in the service AddError instead of returning.
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

// Scenario C: structural + state pileup. EXPECT INVALID (HTTP 400 — rejected at
// the DTO boundary). Blank RequestedBy, negative Amount, 2-letter Currency, past
// date are all structural, so DataAnnotations fails the DTO in the controller and
// the request never reaches the service: the draft fund / missing node /
// closed deal are NEVER evaluated. Honest, but a fix-the-form-then-resubmit slog.
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

// ---------------------------------------------------------------------------
// Drive one request THROUGH THE CONTROLLER and print its HTTP-ish response.
// ---------------------------------------------------------------------------
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
