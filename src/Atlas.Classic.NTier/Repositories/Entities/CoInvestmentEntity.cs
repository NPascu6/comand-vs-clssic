namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>Repository-owned mirror of <see cref="CoInvestmentNode"/>; <see cref="Headroom"/> is re-derived because the entity cannot inherit the snapshot's computed property.</summary>
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
