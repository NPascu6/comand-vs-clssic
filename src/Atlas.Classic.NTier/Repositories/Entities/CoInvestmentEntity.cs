namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>
/// Repository-owned co-investment shape. Mirrors <see cref="CoInvestmentNode"/>.
/// Note we even have to re-derive <see cref="Headroom"/> here, because the entity
/// is a separate type and does not inherit the snapshot's computed property — the
/// same one-liner, restated, in yet another place.
/// </summary>
public sealed class CoInvestmentEntity
{
    public required string CoInvestmentId { get; init; }
    public required string FundId { get; init; }
    public required string? ParentCoInvestmentId { get; init; }
    public required CoInvestmentStatus Status { get; init; }
    public required decimal CommitmentCap { get; init; }
    public required decimal AlreadyCommitted { get; init; }
    public required string Currency { get; init; }

    public decimal Headroom => CommitmentCap - AlreadyCommitted;
}
