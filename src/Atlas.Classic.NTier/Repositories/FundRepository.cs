using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>
/// Wraps the upstream <see cref="IFundClient"/> and maps the returned
/// <see cref="FundSnapshot"/> into the repository's own
/// <see cref="FundEntity"/>. The mapping is delegated to
/// <see cref="CommitmentMapper"/> so the snapshot→entity boilerplate is all in
/// one visible place.
/// </summary>
public sealed class FundRepository : IFundRepository
{
    private readonly IFundClient _client;
    private readonly CommitmentMapper _mapper;

    public FundRepository(IFundClient client, CommitmentMapper mapper)
    {
        _client = client;
        _mapper = mapper;
    }

    public async Task<FundEntity?> GetByIdAsync(string fundId, CancellationToken ct = default)
    {
        FundSnapshot? snapshot = await _client.GetFundAsync(fundId, ct);
        // The repository's whole reason to exist, made literal: translate the
        // upstream shape into our entity. Returns null straight through when the
        // aggregate is absent.
        return snapshot is null ? null : _mapper.ToEntity(snapshot);
    }
}
