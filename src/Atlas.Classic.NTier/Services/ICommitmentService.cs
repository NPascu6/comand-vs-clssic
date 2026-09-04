using Atlas.Classic.NTier.Domain;

namespace Atlas.Classic.NTier.Services;

public interface ICommitmentService
{
    Task<CommitmentResult> CommitAsync(CommitCapitalRequest request, CancellationToken cancellationToken = default);
}
