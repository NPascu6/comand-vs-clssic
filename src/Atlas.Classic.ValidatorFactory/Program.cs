using System.Globalization;
using Atlas.Classic.ValidatorFactory;

// Pin formatting so the N0-grouped amounts in error messages render identically
// (comma thousands separators) on any machine, regardless of its locale —
// presentation output should not depend on the host culture.
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// ===========================================================================
// Atlas.Classic.ValidatorFactory — demo entry point.
//
// Shows the HOMEGROWN validator-factory pattern end-to-end against the shared
// seeded upstream. The orchestration here is itself part of the lesson: because
// IValidator<T> is synchronous, the caller must (1) run an ASYNC prefetch to
// build a context, then (2) resolve a SYNC validator from the factory that was
// built around that context, then (3) call Validate. Three steps, and the order
// matters — forget step 1 and the validator NREs on null upstream data.
// ===========================================================================

IUpstream upstream = Atlas.Upstream.Contracts.InMemoryUpstream.Create();

// --- Scenario A: a clean private-equity commitment. EXPECT VALID. -----------
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

// --- Scenario B: two simultaneous business breaches. EXPECT INVALID. --------
// headroom (CI-SLEEVE-PC = 20M < 25M) AND appetite (230M + 25M > 250M).
// Both are reported here ONLY because rules 5 and 6 use AddError; if either had
// thrown (the way rule 2 does), the PM would see just one breach and fix it,
// resubmit, and be told about the second — a classic one-error-at-a-time slog.
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

// --- Scenario C: structural + state pileup. EXPECT INVALID. -----------------
// Blank RequestedBy, negative Amount, 2-letter Currency, past date — all
// structural. Because rule 1 early-returns on any structural failure, the draft
// fund / missing node / closed deal are NEVER evaluated: the PM is told to
// fix the form first, then resubmits straight into the state failures. Honest,
// but a poor experience.
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

// ---------------------------------------------------------------------------
// The orchestration the sync interface forces on every caller.
// ---------------------------------------------------------------------------
static async Task RunScenario(string name, CommitCapitalInput input, IUpstream upstream)
{
    Console.WriteLine(new string('-', 72));
    Console.WriteLine($"SCENARIO {name}");

    // STEP 1 (async, OUTSIDE the validator): prefetch upstream snapshots. This is
    // the work the validator wishes it could do itself but cannot, because
    // IValidator<T>.Validate is synchronous.
    var ctx = await CommitCapitalContext.LoadAsync(upstream, input);

    // STEP 2: build a factory/registry and register a validator bound to THIS
    // request's context. Re-registering per request is the price of pushing
    // async data in through the constructor of a sync validator — the factory
    // can resolve by type, but the instance is per-call, not a singleton.
    var factory = new ValidatorFactory()
        .Register<CommitCapitalInput>(new CommitCapitalValidator(ctx));

    // STEP 3: resolve by type and validate (sync). A caller who skipped STEP 1
    // would hand the validator a context full of nulls and get a
    // NullReferenceException out of the if-soup instead of a clean result.
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
