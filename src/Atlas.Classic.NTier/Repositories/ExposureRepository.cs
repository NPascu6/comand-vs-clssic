using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Wraps <see cref="IExposureClient"/>; maps <see cref="ExposureSnapshot"/> to <see cref="ExposureEntity"/>.</summary>
public sealed class ExposureRepository : IExposureRepository
{
    private readonly IExposureClient _client;
    private readonly CommitmentMapper _mapper;

    public ExposureRepository(IExposureClient client, CommitmentMapper mapper)
    {
        _client = client;
        _mapper = mapper;
    }

    public async Task<ExposureEntity> GetByFundAsync(string fundId, CancellationToken cancellationToken = default)
    {
        ExposureSnapshot snapshot = await _client.GetExposureAsync(fundId, cancellationToken);
        return _mapper.ToEntity(snapshot);
    }
}
