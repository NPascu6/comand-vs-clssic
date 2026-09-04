namespace Atlas.Classic.NTier.Domain;

public sealed class CommitmentResult
{
    private readonly List<string> _errors = new();

    public bool IsSuccess => _errors.Count == 0;

    public IReadOnlyList<string> Errors => _errors;

    /// <summary>Populated on success: a synthetic id for the booked commitment.</summary>
    public string? CommitmentId { get; private set; }

    public void AddError(string message) => _errors.Add(message);

    public void AddErrors(IEnumerable<string> messages) => _errors.AddRange(messages);

    public void MarkBooked(string commitmentId) => CommitmentId = commitmentId;
}
