namespace Atlas.Classic.NTier.Dtos;

/// <summary>
/// Outbound wire model — the controller's HTTP-ish envelope. This is the THIRD
/// result shape the outcome passes through (after the validator's
/// <c>ValidationResult</c> and the domain's <c>CommitmentResult</c>), and the
/// mapper copies the previous one into this one by hand.
/// </summary>
public sealed class CommitmentResponseDto
{
    /// <summary>True iff structural validation, business validation and booking all passed.</summary>
    public bool Success { get; set; }

    /// <summary>A coarse HTTP-ish status so the demo can show the controller acting like an endpoint.</summary>
    public int StatusCode { get; set; }

    /// <summary>Populated on success: the booked commitment id.</summary>
    public string? CommitmentId { get; set; }

    /// <summary>Flat list of human-readable error prose — no codes, no per-rule identity.</summary>
    public List<string> Errors { get; set; } = new();
}
