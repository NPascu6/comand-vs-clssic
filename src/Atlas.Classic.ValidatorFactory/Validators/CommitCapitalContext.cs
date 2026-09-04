namespace Atlas.Classic.ValidatorFactory;

/// <summary>Upstream snapshots prefetched for the synchronous validator; the nullable members are lookups that can miss.</summary>
public sealed class CommitCapitalContext
{
    public required FundSnapshot? Fund { get; init; }
    public required DealSnapshot? Deal { get; init; }
    public required CoInvestmentNode? Node { get; init; }
    public required IReadOnlyCollection<AppetiteLimit> Limits { get; init; }

    // IExposureClient returns a zeroed snapshot for a missing fund, so Exposure is never null.
    public required ExposureSnapshot Exposure { get; init; }

    /// <summary>Fetches the five snapshots concurrently; the sync validator cannot do this itself.</summary>
    public static async Task<CommitCapitalContext> LoadAsync(
        IUpstream upstream, CommitCapitalInput input, CancellationToken cancellationToken = default)
    {
        var fundTask = upstream.Funds.GetFundAsync(input.FundId, cancellationToken);
        var dealTask = upstream.Deals.GetDealAsync(input.DealId, cancellationToken);
        var nodeTask = upstream.CoInvestments.GetNodeAsync(input.CoInvestmentId, cancellationToken);
        var limitsTask = upstream.Appetite.GetLimitsAsync(input.FundId, cancellationToken);
        var exposureTask = upstream.Exposure.GetExposureAsync(input.FundId, cancellationToken);

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
