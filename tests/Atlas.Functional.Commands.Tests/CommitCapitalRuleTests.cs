using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// ---------------------------------------------------------------------------
// Each rule is tested IN ISOLATION: construct the rule with one tiny stub,
// run its Check against one command, assert on the returned errors.
//
// No handler, no other rules, no upstream wiring, no DI. This is the property
// the classic samples cannot match: in the adapter-chaining and validator-
// factory versions there is no single "rule" object to test — you can only test
// the whole orchestration, and only by standing up several collaborators.
// ---------------------------------------------------------------------------

public class CommitCapitalRuleTests
{
    private static async Task<IReadOnlyList<string>> CodesAsync(Rule<CommitCapitalCommand> rule, CommitCapitalCommand cmd)
    {
        var result = await rule.Check(cmd, CancellationToken.None);
        return result.Errors.Select(e => e.Code).ToList();
    }

    // --- Structural (pure, no I/O) -----------------------------------------

    [Fact]
    public async Task Structural_accepts_a_wellformed_command()
    {
        var codes = await CodesAsync(CommitCapitalRules.Structural(Commands.Today), Commands.Valid());
        Assert.Empty(codes);
    }

    [Fact]
    public async Task Structural_reports_every_shape_problem_at_once()
    {
        var bad = Commands.Valid() with
        {
            RequestedBy = "",
            Amount = -1m,
            Currency = "US",
            CommitmentDate = new DateOnly(2020, 1, 1)
        };

        var codes = await CodesAsync(CommitCapitalRules.Structural(Commands.Today), bad);

        Assert.Contains("REQUIRED", codes);
        Assert.Contains("AMOUNT_NONPOSITIVE", codes);
        Assert.Contains("CURRENCY_FORMAT", codes);
        Assert.Contains("DATE_IN_PAST", codes);
    }

    // --- FundMustBeOpen -----------------------------------------------

    [Fact]
    public async Task FundMustBeOpen_fails_when_fund_is_missing()
    {
        var rule = CommitCapitalRules.FundMustBeOpen(new StubFundClient(null));
        var codes = await CodesAsync(rule, Commands.Valid());
        Assert.Equal(new[] { "FUND_NOT_FOUND" }, codes);
    }

    [Fact]
    public async Task FundMustBeOpen_fails_when_fund_is_not_open()
    {
        var draft = new FundSnapshot("PF-APAC-CREDIT", "Draft", FundStatus.Draft, "USD", new[] { "USD" });
        var rule = CommitCapitalRules.FundMustBeOpen(new StubFundClient(draft));
        var codes = await CodesAsync(rule, Commands.Valid());
        Assert.Equal(new[] { "FUND_NOT_OPEN" }, codes);
    }

    [Fact]
    public async Task FundMustBeOpen_passes_when_open()
    {
        var open = new FundSnapshot("PF-APAC-CREDIT", "Open", FundStatus.Open, "USD", new[] { "USD" });
        var rule = CommitCapitalRules.FundMustBeOpen(new StubFundClient(open));
        Assert.Empty(await CodesAsync(rule, Commands.Valid()));
    }

    // --- CoInvestmentMustHaveHeadroom --------------------------------------

    [Fact]
    public async Task CoInvestment_fails_when_headroom_is_insufficient()
    {
        // cap 200M, committed 190M => 10M headroom, but the command asks for 10M+1
        var node = new CoInvestmentNode("CI-X", "PF-APAC-CREDIT", null, CoInvestmentStatus.Active, 200_000_000m, 190_000_000m, "USD");
        var rule = CommitCapitalRules.CoInvestmentMustHaveHeadroom(new StubCoInvestmentClient(node));

        var codes = await CodesAsync(rule, Commands.Valid() with { Amount = 10_000_001m });
        Assert.Contains("COINVEST_NO_HEADROOM", codes);
    }

    [Fact]
    public async Task CoInvestment_fails_when_suspended()
    {
        var node = new CoInvestmentNode("CI-X", "PF-APAC-CREDIT", null, CoInvestmentStatus.Suspended, 200_000_000m, 0m, "USD");
        var rule = CommitCapitalRules.CoInvestmentMustHaveHeadroom(new StubCoInvestmentClient(node));
        Assert.Contains("COINVEST_NOT_ACTIVE", await CodesAsync(rule, Commands.Valid()));
    }

    [Fact]
    public async Task CoInvestment_fails_when_it_belongs_to_a_different_fund()
    {
        var node = new CoInvestmentNode("CI-X", "PF-OTHER", null, CoInvestmentStatus.Active, 200_000_000m, 0m, "USD");
        var rule = CommitCapitalRules.CoInvestmentMustHaveHeadroom(new StubCoInvestmentClient(node));
        Assert.Contains("COINVEST_WRONG_FUND", await CodesAsync(rule, Commands.Valid()));
    }

    // --- CommitmentMustBeWithinAppetite ------------------------------------

    [Fact]
    public async Task Appetite_fails_when_projected_exposure_breaches_the_limit()
    {
        var limits = new[] { new AppetiteLimit(AssetClass.PrivateEquity, Region.NorthAmerica, 100_000_000m, 50m) };
        var exposure = new ExposureSnapshot("PF-APAC-CREDIT", 95_000_000m,
            new Dictionary<string, decimal> { [Buckets.Key(AssetClass.PrivateEquity, Region.NorthAmerica)] = 95_000_000m });

        var rule = CommitCapitalRules.CommitmentMustBeWithinAppetite(
            new StubAppetiteClient(limits), new StubExposureClient(exposure));

        // 95M committed + 10M = 105M > 100M
        Assert.Contains("APPETITE_BREACH", await CodesAsync(rule, Commands.Valid()));
    }

    [Fact]
    public async Task Appetite_denies_by_default_when_no_limit_is_configured()
    {
        var rule = CommitCapitalRules.CommitmentMustBeWithinAppetite(
            new StubAppetiteClient(Array.Empty<AppetiteLimit>()),
            new StubExposureClient(new ExposureSnapshot("PF-APAC-CREDIT", 0m, new Dictionary<string, decimal>())));

        Assert.Contains("APPETITE_NONE", await CodesAsync(rule, Commands.Valid()));
    }

    [Fact]
    public async Task Appetite_passes_when_within_the_limit()
    {
        var limits = new[] { new AppetiteLimit(AssetClass.PrivateEquity, Region.NorthAmerica, 300_000_000m, 50m) };
        var exposure = new ExposureSnapshot("PF-APAC-CREDIT", 120_000_000m,
            new Dictionary<string, decimal> { [Buckets.Key(AssetClass.PrivateEquity, Region.NorthAmerica)] = 120_000_000m });

        var rule = CommitCapitalRules.CommitmentMustBeWithinAppetite(
            new StubAppetiteClient(limits), new StubExposureClient(exposure));

        Assert.Empty(await CodesAsync(rule, Commands.Valid()));
    }
}
