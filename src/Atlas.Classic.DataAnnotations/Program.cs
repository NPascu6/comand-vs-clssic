using Atlas.Classic.DataAnnotations;
using Atlas.Upstream.Contracts;

// ===========================================================================
// Atlas CommitCapital — CLASSIC "DataAnnotations + model validation" sample.
//
// This console app demonstrates the classic approach honestly:
//   * Structural rules live as DataAnnotations attributes on the request model
//     (CommitCapitalRequest) — declarative, familiar, zero dependencies.
//   * Business rules need awaited upstream I/O, which attributes CANNOT do, so
//     they live in CommitCapitalService as an imperative async if-chain.
//
// The split is the message. See README.md for the full pros/cons writeup.
// ===========================================================================

IUpstream upstream = InMemoryUpstream.Create();
var service = new CommitCapitalService(upstream);

// --- Scenario A: a clean, fully valid PE commitment ------------------------
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

// --- Scenario B: two business breaches at once (headroom AND appetite) ------
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

// --- Scenario C: structural failures + upstream-state pileup ----------------
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

// --- helper: run one scenario and print a readable verdict ------------------
async Task RunScenarioAsync(string id, string name, CommitCapitalRequest request)
{
    CommitResult result = await service.ValidateAndCommitAsync(request);

    Console.WriteLine();
    Console.WriteLine($"--- Scenario {id}: {name} ---");
    Console.WriteLine($"Result: {(result.IsValid ? "VALID" : "INVALID")}");

    if (result.IsValid)
    {
        Console.WriteLine("  (no validation errors — commitment would be recorded)");
        return;
    }

    Console.WriteLine($"Errors ({result.Errors.Count}):");
    var i = 1;
    foreach (var error in result.Errors)
        Console.WriteLine($"  {i++,2}. {error}");
}

// ===========================================================================
// ANTI-PATTERN (DELIBERATELY NOT USED) — the "smart attribute" trap.
//
// When teams first hit "I can't await in an attribute", a tempting move is to
// resolve a client from the ValidationContext and BLOCK on the async call. It
// compiles, it even passes a quick demo, and it is wrong on at least three axes.
// Shown commented-out so the presentation can point at concrete code.
//
// public sealed class FundMustBeOpenAttribute : ValidationAttribute
// {
//     protected override ValidationResult? IsValid(object? value, ValidationContext ctx)
//     {
//         // (1) SERVICE LOCATOR: the attribute reaches into the DI container at
//         //     validation time. Its real dependencies are now invisible at the
//         //     call site and it only works if someone wired GetService correctly.
//         var client = (IFundClient?)ctx.GetService(typeof(IFundClient));
//         if (client is null) return ValidationResult.Success; // silently a no-op!
//
//         var fundId = (string?)value ?? string.Empty;
//
//         // (2) SYNC-OVER-ASYNC: blocking on async I/O from a synchronous method.
//         //     Under load this exhausts the thread pool and can deadlock in any
//         //     context with a SynchronizationContext (classic ASP.NET, WPF). It
//         //     also makes a network round-trip per attribute, hidden inside a
//         //     property "validation" the caller assumes is cheap and pure.
//         var snapshot = client.GetFundAsync(fundId).GetAwaiter().GetResult();
//
//         // (3) NO ACCUMULATION / NO CONTEXT: each such attribute fires in
//         //     isolation, so you can't express "this rule depends on that one",
//         //     can't share the single fund fetch across rules 2 and 3, and
//         //     have nowhere to record a per-rule audit trail.
//         return snapshot is { Status: FundStatus.Open }
//             ? ValidationResult.Success
//             : new ValidationResult("Fund is not open.");
//     }
// }
//
// The correct home for rules 2-6 is the async service above. Attributes stay
// pure and synchronous; business validation stays explicit, awaitable, testable.
// ===========================================================================
