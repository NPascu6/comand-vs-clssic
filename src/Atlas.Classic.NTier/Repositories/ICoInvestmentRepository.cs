using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Per-aggregate co-investment repository port. Wraps <see cref="ICoInvestmentClient"/>.</summary>
public interface ICoInvestmentRepository
{
    Task<CoInvestmentEntity?> GetByIdAsync(string coInvestmentId, CancellationToken cancellationToken = default);
}
