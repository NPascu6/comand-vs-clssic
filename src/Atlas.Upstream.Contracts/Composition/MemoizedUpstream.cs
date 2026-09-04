using System.Collections.Concurrent;

namespace Atlas.Upstream.Contracts;

/// <summary>Request-scoped: construct one per command so the cache never serves stale data across requests.</summary>
public sealed class MemoizedUpstream : IUpstream
{
    public IFundClient Funds { get; }
    public IDealClient Deals { get; }
    public ICoInvestmentClient CoInvestments { get; }
    public IAppetiteClient Appetite { get; }
    public IExposureClient Exposure { get; }

    public MemoizedUpstream(IUpstream inner)
    {
        Funds = new MemoFund(inner.Funds);
        Deals = new MemoDeal(inner.Deals);
        CoInvestments = new MemoCoInvestment(inner.CoInvestments);
        Appetite = new MemoAppetite(inner.Appetite);
        Exposure = new MemoExposure(inner.Exposure);
    }

    /// <summary>Wrap any upstream so duplicate reads within one request share a single call.</summary>
    public static IUpstream Around(IUpstream inner) => new MemoizedUpstream(inner);

    // Lazy<Task<T>> so concurrent callers share one in-flight call per key.
    private static Task<T> Once<T>(ConcurrentDictionary<string, Lazy<Task<T>>> cache, string key, Func<Task<T>> call)
        => cache.GetOrAdd(key, _ => new Lazy<Task<T>>(call)).Value;

    private sealed class MemoFund(IFundClient inner) : IFundClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<FundSnapshot?>>> _cache = new();
        public Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken cancellationToken = default)
            => Once(_cache, fundId, () => inner.GetFundAsync(fundId, cancellationToken));
    }

    private sealed class MemoDeal(IDealClient inner) : IDealClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<DealSnapshot?>>> _cache = new();
        public Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken cancellationToken = default)
            => Once(_cache, dealId, () => inner.GetDealAsync(dealId, cancellationToken));
    }

    private sealed class MemoCoInvestment(ICoInvestmentClient inner) : ICoInvestmentClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<CoInvestmentNode?>>> _nodes = new();
        private readonly ConcurrentDictionary<string, Lazy<Task<IReadOnlyCollection<CoInvestmentNode>>>> _children = new();
        public Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken cancellationToken = default)
            => Once(_nodes, coInvestmentId, () => inner.GetNodeAsync(coInvestmentId, cancellationToken));
        public Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(string coInvestmentId, CancellationToken cancellationToken = default)
            => Once(_children, coInvestmentId, () => inner.GetChildrenAsync(coInvestmentId, cancellationToken));
    }

    private sealed class MemoAppetite(IAppetiteClient inner) : IAppetiteClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<IReadOnlyCollection<AppetiteLimit>>>> _cache = new();
        public Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(string fundId, CancellationToken cancellationToken = default)
            => Once(_cache, fundId, () => inner.GetLimitsAsync(fundId, cancellationToken));
    }

    private sealed class MemoExposure(IExposureClient inner) : IExposureClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<ExposureSnapshot>>> _cache = new();
        public Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken cancellationToken = default)
            => Once(_cache, fundId, () => inner.GetExposureAsync(fundId, cancellationToken));
    }
}
