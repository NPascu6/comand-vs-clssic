using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Wraps <see cref="IDealClient"/>; maps <see cref="DealSnapshot"/> to <see cref="DealEntity"/>.</summary>
public sealed class DealRepository : IDealRepository
{
    private readonly IDealClient _client;
    private readonly CommitmentMapper _mapper;

    public DealRepository(IDealClient client, CommitmentMapper mapper)
    {
        _client = client;
        _mapper = mapper;
    }

    public async Task<DealEntity?> GetByIdAsync(string dealId, CancellationToken cancellationToken = default)
    {
        DealSnapshot? snapshot = await _client.GetDealAsync(dealId, cancellationToken);
        return snapshot is null ? null : _mapper.ToEntity(snapshot);
    }
}
