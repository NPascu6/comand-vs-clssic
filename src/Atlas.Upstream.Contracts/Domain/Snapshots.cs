namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// Read-models returned by the upstream services.
//
// Both DMS and Atlas are *downstream* APIs: they own no source data, they call
// upstream systems (fund book, deal pipeline, exposure engine, appetite
// policy store) and compose answers. These records are the shapes those
// upstream calls return. They are deliberately immutable.
// ---------------------------------------------------------------------------

/// <summary>A fund as the upstream book of record sees it.</summary>
public sealed record FundSnapshot(
    string FundId,
    string Name,
    FundStatus Status,
    string BaseCurrency,
    IReadOnlyCollection<string> PermittedCurrencies);

/// <summary>An investable deal (private asset or liquid instrument) upstream.</summary>
public sealed record DealSnapshot(
    string DealId,
    string Name,
    DealStatus Status,
    AssetClass AssetClass,
    Region Region,
    Liquidity Liquidity,
    DateOnly InvestableFrom,
    DateOnly InvestableTo,
    string Currency);

/// <summary>
/// A node in the co-investment hierarchy. A commitment is made against a node;
/// the node has a cap and an already-committed amount, so headroom = cap - committed.
/// Child sleeves roll up to a parent (<see cref="ParentCoInvestmentId"/>).
/// </summary>
public sealed record CoInvestmentNode(
    string CoInvestmentId,
    string FundId,
    string? ParentCoInvestmentId,
    CoInvestmentStatus Status,
    decimal CommitmentCap,
    decimal AlreadyCommitted,
    string Currency)
{
    public decimal Headroom => CommitmentCap - AlreadyCommitted;
}

/// <summary>
/// One appetite restriction: a ceiling on how much (absolute and as a % of the
/// book) may be committed to a given asset-class / region bucket.
/// </summary>
public sealed record AppetiteLimit(
    AssetClass AssetClass,
    Region Region,
    decimal MaxAmount,
    decimal MaxConcentrationPct)
{
    /// <summary>Bucket key used to line limits up with exposure, e.g. "PrivateCredit|Emea".</summary>
    public string Bucket => Buckets.Key(AssetClass, Region);
}

/// <summary>Current committed exposure for a fund, totalled and bucketed.</summary>
public sealed record ExposureSnapshot(
    string FundId,
    decimal TotalCommitted,
    IReadOnlyDictionary<string, decimal> CommittedByBucket)
{
    public decimal CommittedIn(AssetClass assetClass, Region region) =>
        CommittedByBucket.TryGetValue(Buckets.Key(assetClass, region), out var v) ? v : 0m;
}

/// <summary>Canonical bucket key so limits and exposure always agree on spelling.</summary>
public static class Buckets
{
    public static string Key(AssetClass assetClass, Region region) => $"{assetClass}|{region}";
}
