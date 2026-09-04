namespace Atlas.Classic.NTier.Domain;

/// <summary>
/// The service's own result shape — yet another "bool + list of strings",
/// distinct from the homegrown <c>ValidationResult</c> in Validation/ and from
/// the outbound <c>CommitmentResponseDto</c>. Three result shapes for one
/// outcome, each mapped to the next by hand.
///
/// Like the validator's result it carries no per-rule identity, no severity, no
/// machine-readable code, and no record of which rules RAN versus were skipped —
/// for a trading-adjacent system that missing decision trail is a real audit gap
/// (see the README "Cons").
/// </summary>
public sealed class CommitmentResult
{
    private readonly List<string> _errors = new();

    public bool IsSuccess => _errors.Count == 0;

    public IReadOnlyList<string> Errors => _errors;

    /// <summary>Populated on success: a synthetic id for the booked commitment.</summary>
    public string? CommitmentId { get; private set; }

    public void AddError(string message) => _errors.Add(message);

    /// <summary>Fold a homegrown <see cref="Validation.ValidationResult"/>'s messages in by hand.</summary>
    public void AddErrors(IEnumerable<string> messages) => _errors.AddRange(messages);

    public void MarkBooked(string commitmentId) => CommitmentId = commitmentId;
}
