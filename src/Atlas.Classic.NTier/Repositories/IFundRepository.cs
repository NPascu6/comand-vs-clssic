using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>
/// Per-aggregate repository port. The service depends on this, not on
/// <see cref="IFundClient"/> — so the upstream port is wrapped by a second
/// port that returns a third type (<see cref="FundEntity"/>). Two interfaces
/// and a mapping for what is, today, a single pass-through call.
/// </summary>
public interface IFundRepository
{
    Task<FundEntity?> GetByIdAsync(string fundId, CancellationToken ct = default);
}
