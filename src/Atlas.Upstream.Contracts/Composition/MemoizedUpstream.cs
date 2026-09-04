using System.Collections.Concurrent;

namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// Request-scoped memoization, as a decorator.
//
// Rules are independent and each fetches what it needs — so two rules that both
// read the fund (e.g. "must be open" and "currency permitted") would each
// call the upstream. Wrapping the upstream in this decorator collapses those
// into ONE in-flight call per (port, key): concurrent callers share the same
// Task. So the concurrent fan-out stays complete and parallel WITHOUT issuing
// N duplicate calls to the same five upstreams.
//
// Construct ONE per command/request (in DI: a scoped service) so the cache
// never serves stale data across requests. It is a plain decorator over
// IUpstream — no library, nothing new to couple to.
// ---------------------------------------------------------------------------

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

    // A Lazy<Task<T>> guarantees the underlying call is invoked at most once per key,
    // even under the concurrent fan-out that the Validator runs the rules with.
    private static Task<T> Once<T>(ConcurrentDictionary<string, Lazy<Task<T>>> cache, string key, Func<Task<T>> call)
        => cache.GetOrAdd(key, _ => new Lazy<Task<T>>(call)).Value;

    private sealed class MemoFund(IFundClient inner) : IFundClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<FundSnapshot?>>> _c = new();
        public Task<FundSnapshot?> GetFundAsync(string id, CancellationToken ct = default)
            => Once(_c, id, () => inner.GetFundAsync(id, ct));
    }

    private sealed class MemoDeal(IDealClient inner) : IDealClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<DealSnapshot?>>> _c = new();
        public Task<DealSnapshot?> GetDealAsync(string id, CancellationToken ct = default)
            => Once(_c, id, () => inner.GetDealAsync(id, ct));
    }

    private sealed class MemoCoInvestment(ICoInvestmentClient inner) : ICoInvestmentClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<CoInvestmentNode?>>> _nodes = new();
        private readonly ConcurrentDictionary<string, Lazy<Task<IReadOnlyCollection<CoInvestmentNode>>>> _kids = new();
        public Task<CoInvestmentNode?> GetNodeAsync(string id, CancellationToken ct = default)
            => Once(_nodes, id, () => inner.GetNodeAsync(id, ct));
        public Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(string id, CancellationToken ct = default)
            => Once(_kids, id, () => inner.GetChildrenAsync(id, ct));
    }

    private sealed class MemoAppetite(IAppetiteClient inner) : IAppetiteClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<IReadOnlyCollection<AppetiteLimit>>>> _c = new();
        public Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(string id, CancellationToken ct = default)
            => Once(_c, id, () => inner.GetLimitsAsync(id, ct));
    }

    private sealed class MemoExposure(IExposureClient inner) : IExposureClient
    {
        private readonly ConcurrentDictionary<string, Lazy<Task<ExposureSnapshot>>> _c = new();
        public Task<ExposureSnapshot> GetExposureAsync(string id, CancellationToken ct = default)
            => Once(_c, id, () => inner.GetExposureAsync(id, ct));
    }
}
