namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>Repository-owned mirror of <see cref="DealSnapshot"/>.</summary>
public sealed class DealEntity
{
    public required string DealId { get; init; }
    public required string Name { get; init; }
    public required DealStatus Status { get; init; }
    public required AssetClass AssetClass { get; init; }
    public required Region Region { get; init; }
    public required Liquidity Liquidity { get; init; }
    public required DateOnly InvestableFrom { get; init; }
    public required DateOnly InvestableTo { get; init; }
    public required string Currency { get; init; }
}
