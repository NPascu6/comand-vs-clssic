using Atlas.Functional.Commands.Commitments;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// ---------------------------------------------------------------------------
// End-to-end handler tests against the seeded in-memory upstream — the same
// three scenarios the console demo runs. These assert the two behaviours that
// matter most for Atlas: COMPLETE error aggregation and a full audit trace.
// ---------------------------------------------------------------------------

public class CommitCapitalHandlerTests
{
    private static CommitCapitalHandler NewHandler() =>
        new(InMemoryUpstream.Create(latencyMs: 0), Commands.Today);

    [Fact]
    public async Task Scenario_A_valid_commitment_is_approved_with_a_receipt()
    {
        var outcome = await NewHandler().HandleAsync(Commands.Valid(), "SCN-A");

        Assert.True(outcome.Approved);
        Assert.Equal("PF-APAC-CREDIT", outcome.Result.Value.FundId);
        Assert.True(outcome.Trace.Approved);
        Assert.Equal(6, outcome.Trace.Passed);
        Assert.Equal(0, outcome.Trace.Failed);
    }

    [Fact]
    public async Task Scenario_B_reports_BOTH_breaches_in_a_single_pass()
    {
        var twoBreaches = Commands.Valid() with
        {
            CoInvestmentId = "CI-SLEEVE-PC",   // 20M headroom
            DealId = "DEAL-PC-EMEA-01",
            Amount = 25_000_000m,              // > 20M headroom AND pushes appetite over
            Currency = "EUR",
            AssetClass = AssetClass.PrivateCredit,
            Region = Region.Emea,
            CommitmentDate = new DateOnly(2026, 7, 1),
            RequestedBy = "pm.bob"
        };

        var outcome = await NewHandler().HandleAsync(twoBreaches, "SCN-B");
        var codes = outcome.Result.Errors.Select(e => e.Code).ToList();

        Assert.False(outcome.Approved);
        // This is the headline: the classic short-circuiting samples lose one of these.
        Assert.Contains("COINVEST_NO_HEADROOM", codes);
        Assert.Contains("APPETITE_BREACH", codes);
    }

    [Fact]
    public async Task Scenario_C_aggregates_structural_and_state_failures_together()
    {
        var pileup = new CommitCapitalCommand(
            FundId: "PF-DRAFT",
            CoInvestmentId: "CI-MISSING",
            DealId: "DEAL-CLOSED-04",
            Amount: -5_000_000m,
            Currency: "US",
            AssetClass: AssetClass.PrivateEquity,
            Region: Region.Emea,
            Liquidity: Liquidity.Illiquid,
            CommitmentDate: new DateOnly(2020, 1, 1),
            RequestedBy: "");

        var outcome = await NewHandler().HandleAsync(pileup, "SCN-C");
        var codes = outcome.Result.Errors.Select(e => e.Code).ToList();

        Assert.False(outcome.Approved);
        // Structural AND state failures arrive together — not one-then-resubmit.
        Assert.Contains("AMOUNT_NONPOSITIVE", codes);
        Assert.Contains("FUND_NOT_OPEN", codes);
        Assert.Contains("DEAL_NOT_INVESTABLE", codes);
        Assert.Contains("COINVEST_NOT_FOUND", codes);
    }

    [Fact]
    public async Task Every_command_produces_a_full_six_rule_audit_trace()
    {
        var outcome = await NewHandler().HandleAsync(Commands.Valid(), "AUDIT");

        Assert.Equal("AUDIT", outcome.Trace.CorrelationId);
        Assert.Equal(6, outcome.Trace.Entries.Count);

        var ruleNames = outcome.Trace.Entries.Select(e => e.Rule).ToList();
        Assert.Contains("Structural", ruleNames);
        Assert.Contains("FundMustBeOpen", ruleNames);
        Assert.Contains("CurrencyMustBePermitted", ruleNames);
        Assert.Contains("DealMustBeInvestable", ruleNames);
        Assert.Contains("CoInvestmentMustHaveHeadroom", ruleNames);
        Assert.Contains("CommitmentMustBeWithinAppetite", ruleNames);

        // The trace serializes to JSON for an auditor / event store with no logging library.
        Assert.Contains("CorrelationId", outcome.Trace.ToJson());
    }

    [Fact]
    public async Task A_failed_command_never_produces_a_receipt()
    {
        var outcome = await NewHandler().HandleAsync(Commands.Valid() with { FundId = "PF-DRAFT" }, "NO-RECEIPT");

        Assert.False(outcome.Approved);
        Assert.Throws<InvalidOperationException>(() => _ = outcome.Result.Value);
    }
}
