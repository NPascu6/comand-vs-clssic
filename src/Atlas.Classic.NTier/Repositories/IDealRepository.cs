using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Per-aggregate deal repository port. Wraps <see cref="IDealClient"/>.</summary>
public interface IDealRepository
{
    Task<DealEntity?> GetByIdAsync(string dealId, CancellationToken cancellationToken = default);
}
