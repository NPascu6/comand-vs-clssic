using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Wraps <see cref="IFundClient"/>; maps <see cref="FundSnapshot"/> to <see cref="FundEntity"/>.</summary>
public sealed class FundRepository : IFundRepository
{
    private readonly IFundClient _client;
    private readonly CommitmentMapper _mapper;

    public FundRepository(IFundClient client, CommitmentMapper mapper)
    {
        _client = client;
        _mapper = mapper;
    }

    public async Task<FundEntity?> GetByIdAsync(string fundId, CancellationToken cancellationToken = default)
    {
        FundSnapshot? snapshot = await _client.GetFundAsync(fundId, cancellationToken);
        return snapshot is null ? null : _mapper.ToEntity(snapshot);
    }
}
