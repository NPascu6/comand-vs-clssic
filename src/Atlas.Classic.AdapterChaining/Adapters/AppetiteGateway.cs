using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class AppetiteGateway(IAppetiteClient client, ExposureGateway exposure)
    : AdapterBase("AppetitePolicyStore")
{
    private readonly IAppetiteClient _client = client;
    private readonly ExposureGateway _exposure = exposure;

    /// <summary>Fuses the configured ceiling with the amount already committed, reached through <see cref="ExposureGateway"/>.</summary>
    public async Task<AppetiteContext> LoadForBucketAsync(
        string fundId, AssetClass assetClass, Region region, CancellationToken cancellationToken)
    {
        var limits = await _client.GetLimitsAsync(fundId, cancellationToken).ConfigureAwait(false);
        var bucketKey = Buckets.Key(assetClass, region);
        var limit = limits.FirstOrDefault(candidate => candidate.Bucket == bucketKey);

        var committed = await _exposure
            .GetCommittedInBucketAsync(fundId, assetClass, region, cancellationToken)
            .ConfigureAwait(false);

        return new AppetiteContext
        {
            HasConfiguredLimit = limit is not null,
            MaxAmount = limit?.MaxAmount ?? 0m,
            AlreadyCommittedInBucket = committed,
        };
    }

    public void EnsureWithinLimit(AppetiteContext appetite, AssetClass assetClass, Region region, decimal amount)
    {
        // Fail closed: a bucket with no configured limit refuses the commitment.
        if (!appetite.HasConfiguredLimit)
            throw new CommitmentValidationException(
                $"No appetite limit is configured for bucket {assetClass}|{region}; commitment refused.");

        var projected = appetite.AlreadyCommittedInBucket + amount;
        if (projected > appetite.MaxAmount)
            throw new CommitmentValidationException(
                $"Appetite breached for {assetClass}|{region}: committed {appetite.AlreadyCommittedInBucket:N0} " +
                $"+ requested {amount:N0} = {projected:N0} exceeds limit {appetite.MaxAmount:N0}.");
    }
}
