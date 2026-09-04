using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Per-aggregate fund repository port. Wraps <see cref="IFundClient"/>.</summary>
public interface IFundRepository
{
    Task<FundEntity?> GetByIdAsync(string fundId, CancellationToken cancellationToken = default);
}
