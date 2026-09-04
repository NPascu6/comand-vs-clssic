namespace Atlas.Classic.NTier.Dtos;

/// <summary>The controller's HTTP-ish envelope.</summary>
public sealed class CommitmentResponseDto
{
    public bool Success { get; set; }

    public int StatusCode { get; set; }

    /// <summary>Populated on success: the booked commitment id.</summary>
    public string? CommitmentId { get; set; }

    public List<string> Errors { get; set; } = new();
}
