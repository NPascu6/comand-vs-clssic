using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Repositories;

/// <summary>Wraps <see cref="ICoInvestmentClient"/>; maps <see cref="CoInvestmentNode"/> to <see cref="CoInvestmentEntity"/>.</summary>
public sealed class CoInvestmentRepository : ICoInvestmentRepository
{
    private readonly ICoInvestmentClient _client;
    private readonly CommitmentMapper _mapper;

    public CoInvestmentRepository(ICoInvestmentClient client, CommitmentMapper mapper)
    {
        _client = client;
        _mapper = mapper;
    }

    public async Task<CoInvestmentEntity?> GetByIdAsync(string coInvestmentId, CancellationToken ct = default)
    {
        CoInvestmentNode? node = await _client.GetNodeAsync(coInvestmentId, ct);
        return node is null ? null : _mapper.ToEntity(node);
    }
}
