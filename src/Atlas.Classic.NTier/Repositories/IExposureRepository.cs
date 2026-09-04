using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>
/// Per-aggregate exposure repository port. Wraps <see cref="IExposureClient"/>.
/// Exposure is never null upstream, so this returns a non-nullable entity.
/// </summary>
public interface IExposureRepository
{
    Task<ExposureEntity> GetByFundAsync(string fundId, CancellationToken ct = default);
}
