using Atlas.Functional.Commands.Commitments;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// Hand-rolled stubs, no mocking library: a rule depends on one narrow client, so a stub is a fixed return value.

internal sealed class StubFundClient(FundSnapshot? snapshot) : IFundClient
{
    public Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken cancellationToken = default)
        => Task.FromResult(snapshot);
}

internal sealed class StubDealClient(DealSnapshot? deal) : IDealClient
{
    public Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken cancellationToken = default)
        => Task.FromResult(deal);
}

internal sealed class StubCoInvestmentClient(CoInvestmentNode? node) : ICoInvestmentClient
{
    public Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken cancellationToken = default)
        => Task.FromResult(node);

    public Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(string coInvestmentId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyCollection<CoInvestmentNode>>(Array.Empty<CoInvestmentNode>());
}

internal sealed class StubAppetiteClient(IReadOnlyCollection<AppetiteLimit> limits) : IAppetiteClient
{
    public Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(string fundId, CancellationToken cancellationToken = default)
        => Task.FromResult(limits);
}

internal sealed class StubExposureClient(ExposureSnapshot snapshot) : IExposureClient
{
    public Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken cancellationToken = default)
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
