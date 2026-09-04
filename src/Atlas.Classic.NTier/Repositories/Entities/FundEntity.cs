namespace Atlas.Classic.NTier.Repositories.Entities;

/// <summary>Repository-owned mirror of <see cref="FundSnapshot"/>.</summary>
public sealed class FundEntity
{
    public required string FundId { get; init; }
    public required string Name { get; init; }
    public required FundStatus Status { get; init; }
    public required string BaseCurrency { get; init; }
    public required IReadOnlyCollection<string> PermittedCurrencies { get; init; }
}
