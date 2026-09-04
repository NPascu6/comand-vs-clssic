namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>
/// Repository-owned exposure shape. Mirrors <see cref="ExposureSnapshot"/>,
/// including a hand-copied re-implementation of <c>CommittedIn</c> and a private
/// copy of the bucket-key convention — because the entity cannot use the
/// snapshot's <c>CommittedIn</c> or <c>Buckets.Key</c> without depending on the
/// very type the repository pattern told us to hide.
/// </summary>
public sealed class ExposureEntity
{
    public required string FundId { get; init; }
    public required decimal TotalCommitted { get; init; }
    public required IReadOnlyDictionary<string, decimal> CommittedByBucket { get; init; }

    public decimal CommittedIn(AssetClass assetClass, Region region) =>
        CommittedByBucket.TryGetValue(BucketKey(assetClass, region), out var v) ? v : 0m;

    // Duplicated from Buckets.Key in the contracts assembly. If that convention
    // ever changes ("PrivateCredit|Emea" -> "PrivateCredit/Emea"), this private
    // copy silently disagrees and the appetite rule reads the wrong bucket. The
    // entity boundary bought isolation at the cost of a hidden second source of
    // truth for the bucket key.
    private static string BucketKey(AssetClass assetClass, Region region) => $"{assetClass}|{region}";
}
