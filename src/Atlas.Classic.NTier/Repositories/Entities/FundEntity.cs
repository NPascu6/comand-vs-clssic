namespace Atlas.Classic.NTier.Repositories.Entities;

// ===========================================================================
// REPOSITORY ENTITIES (Repositories/Entities/).
//
// Classic repository orthodoxy says a repository must not leak the upstream /
// persistence shape; it returns its OWN entity. So for four aggregates we get
// four entities — each a near-verbatim copy of the contracts snapshot it wraps,
// plus a per-entity mapper in the repo. This is the "repository-layer bloat":
// per-aggregate repo + per-aggregate entity + per-aggregate mapping, all to
// re-state shapes the contracts assembly already defines.
// ===========================================================================

/// <summary>Repository-owned fund shape. Mirrors <see cref="FundSnapshot"/>.</summary>
public sealed class FundEntity
{
    public required string FundId { get; init; }
    public required string Name { get; init; }
    public required FundStatus Status { get; init; }
    public required string BaseCurrency { get; init; }
    public required IReadOnlyCollection<string> PermittedCurrencies { get; init; }
}
