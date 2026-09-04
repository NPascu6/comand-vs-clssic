using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Per-aggregate exposure repository port; exposure is never null upstream, so the entity is non-nullable.</summary>
public interface IExposureRepository
{
    Task<ExposureEntity> GetByFundAsync(string fundId, CancellationToken cancellationToken = default);
}
