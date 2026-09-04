using Atlas.Functional.Commands.Commitments;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// ---------------------------------------------------------------------------
// Hand-rolled stubs — NO mocking library.
//
// Because a rule depends only on the one narrow client interface it needs, a
// "mock" is just a four-line class returning a fixed value. This is the team's
// anti-coupling principle applied to tests too: you do not need Moq/NSubstitute
// to test a rule, any more than you need FluentValidation to write one.
// ---------------------------------------------------------------------------

internal sealed class StubFundClient(FundSnapshot? snapshot) : IFundClient
{
    public Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken ct = default)
        => Task.FromResult(snapshot);
}

internal sealed class StubDealClient(DealSnapshot? deal) : IDealClient
{
    public Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken ct = default)
        => Task.FromResult(deal);
}

internal sealed class StubCoInvestmentClient(CoInvestmentNode? node) : ICoInvestmentClient
{
    public Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken ct = default)
        => Task.FromResult(node);

    public Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(string coInvestmentId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyCollection<CoInvestmentNode>>(Array.Empty<CoInvestmentNode>());
}

internal sealed class StubAppetiteClient(IReadOnlyCollection<AppetiteLimit> limits) : IAppetiteClient
{
    public Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(string fundId, CancellationToken ct = default)
        => Task.FromResult(limits);
}

internal sealed class StubExposureClient(ExposureSnapshot snapshot) : IExposureClient
{
    public Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken ct = default)
        => Task.FromResult(snapshot);
}

internal static class Commands
{
    public static readonly DateOnly Today = new(2026, 6, 13);

    /// <summary>A command that passes every rule against the seeded in-memory upstream.</summary>
    public static CommitCapitalCommand Valid() => new(
        FundId: "PF-APAC-CREDIT",
        CoInvestmentId: "CI-ROOT",
        DealId: "DEAL-PE-NA-02",
        Amount: 10_000_000m,
        Currency: "USD",
        AssetClass: AssetClass.PrivateEquity,
        Region: Region.NorthAmerica,
        Liquidity: Liquidity.Illiquid,
        CommitmentDate: new DateOnly(2026, 9, 1),
        RequestedBy: "pm.alice");
}
