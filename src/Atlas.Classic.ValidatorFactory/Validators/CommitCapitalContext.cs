namespace Atlas.Classic.ValidatorFactory;

// ---------------------------------------------------------------------------
// The async afterthought.
//
// IValidator<T> is sync. Atlas rules need awaited upstream data (fund, deal,
// node, appetite, exposure). There is no clean way to bolt async onto the sync
// interface, so a real team ends up doing ONE of three ugly things:
//
//   (a) block on async inside Validate:  client.GetX().GetAwaiter().GetResult()
//       -> deadlock risk on sync-context UIs, burns a thread pool thread per call.
//   (b) pre-fetch everything into a "context" object on a separate async path,
//       then hand that context to a sync validator.
//   (c) define a *parallel* IAsyncValidator<T> and now maintain two hierarchies.
//
// We show (b) — the prefetch context — because it is the most defensible of the
// three and is what disciplined teams actually reach for. But notice the price:
// the "validator" no longer validates the raw input; it validates input PLUS a
// bag of pre-loaded data that SOMEONE ELSE had to assemble in the right order,
// and getting that assembly wrong (e.g. forgetting exposure) yields a
// NullReferenceException deep inside the if-soup rather than a clean error.
// ---------------------------------------------------------------------------

/// <summary>
/// Pre-fetched upstream snapshots that the (synchronous) business validator
/// needs. Assembling this is an async concern living OUTSIDE the validator,
/// which is the whole awkwardness: the sync IValidator&lt;T&gt; can't fetch, so
/// the fetching leaks back up into a service. Nullable members are deliberate —
/// upstream lookups can miss, and the validator must cope with nulls, which is
/// precisely where ordering bugs become NREs.
/// </summary>
public sealed class CommitCapitalContext
{
    public required FundSnapshot? Fund { get; init; }
    public required DealSnapshot? Deal { get; init; }
    public required CoInvestmentNode? Node { get; init; }
    public required IReadOnlyCollection<AppetiteLimit> Limits { get; init; }

    // Exposure is non-null by contract (IExposureClient returns a zeroed snapshot
    // for unknown funds), so it is the one upstream value we can rely on.
    public required ExposureSnapshot Exposure { get; init; }

    /// <summary>
    /// The async prefetch path. This is code that, in a "pure" validator world,
    /// you wish lived inside the validator — but cannot, because the validator is
    /// sync. So it sits here as plumbing the caller must remember to invoke first.
    /// Note we fire the independent calls concurrently to claw back the latency
    /// the sync interface would otherwise have forced us to pay serially.
    /// </summary>
    public static async Task<CommitCapitalContext> LoadAsync(
        IUpstream upstream, CommitCapitalInput input, CancellationToken ct = default)
    {
        var fundTask = upstream.Funds.GetFundAsync(input.FundId, ct);
        var dealTask = upstream.Deals.GetDealAsync(input.DealId, ct);
        var nodeTask = upstream.CoInvestments.GetNodeAsync(input.CoInvestmentId, ct);
        var limitsTask = upstream.Appetite.GetLimitsAsync(input.FundId, ct);
        var exposureTask = upstream.Exposure.GetExposureAsync(input.FundId, ct);

        await Task.WhenAll(fundTask, dealTask, nodeTask, limitsTask, exposureTask);

        return new CommitCapitalContext
        {
            Fund = fundTask.Result,
            Deal = dealTask.Result,
            Node = nodeTask.Result,
            Limits = limitsTask.Result,
            Exposure = exposureTask.Result,
        };
    }
}
