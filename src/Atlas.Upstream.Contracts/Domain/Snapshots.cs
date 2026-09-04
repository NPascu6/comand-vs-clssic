namespace Atlas.Upstream.Contracts;

public sealed record FundSnapshot(
    string FundId,
    string Name,
    FundStatus Status,
    string BaseCurrency,
    IReadOnlyCollection<string> PermittedCurrencies);

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

/// <summary>One node of the co-investment hierarchy; child sleeves roll up to their parent.</summary>
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

/// <summary>A ceiling per asset-class/region bucket, absolute and as a percentage of the book.</summary>
public sealed record AppetiteLimit(
    AssetClass AssetClass,
    Region Region,
    decimal MaxAmount,
    decimal MaxConcentrationPct)
{
    public string Bucket => Buckets.Key(AssetClass, Region);
}

public sealed record ExposureSnapshot(
    string FundId,
    decimal TotalCommitted,
    IReadOnlyDictionary<string, decimal> CommittedByBucket)
{
    public decimal CommittedIn(AssetClass assetClass, Region region) =>
        CommittedByBucket.TryGetValue(Buckets.Key(assetClass, region), out var committed) ? committed : 0m;
}

/// <summary>Canonical bucket key so limits and exposure always agree on spelling.</summary>
public static class Buckets
{
    public static string Key(AssetClass assetClass, Region region) => $"{assetClass}|{region}";
}
