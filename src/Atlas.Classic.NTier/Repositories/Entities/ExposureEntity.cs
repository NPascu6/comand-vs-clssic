namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>Repository-owned mirror of <see cref="ExposureSnapshot"/>.</summary>
public sealed class ExposureEntity
{
    public required string FundId { get; init; }
    public required decimal TotalCommitted { get; init; }
    public required IReadOnlyDictionary<string, decimal> CommittedByBucket { get; init; }

    public decimal CommittedIn(AssetClass assetClass, Region region) =>
        CommittedByBucket.TryGetValue(BucketKey(assetClass, region), out var committed) ? committed : 0m;

    // Duplicates Buckets.Key so the entity does not depend on the contracts type it mirrors.
    private static string BucketKey(AssetClass assetClass, Region region) => $"{assetClass}|{region}";
}
