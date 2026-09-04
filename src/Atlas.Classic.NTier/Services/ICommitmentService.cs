using Atlas.Classic.NTier.Domain;

namespace Atlas.Classic.NTier.Services;

/// <summary>
/// The service port the controller depends on. One method, but behind it sits
/// the validator factory, four repositories, the appetite config and all of
/// rules 2-6 — the whole feature funnels through here.
/// </summary>
public interface ICommitmentService
{
    Task<CommitmentResult> CommitAsync(CommitCapitalRequest request, CancellationToken ct = default);
}
