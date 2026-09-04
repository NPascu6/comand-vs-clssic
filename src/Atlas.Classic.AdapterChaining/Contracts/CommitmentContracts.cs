using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

/// <summary>What the web tier posts to the facade: commit capital to a co-investment node in a fund, against a deal.</summary>
public sealed record CommitCapitalRequest
{
    public string FundId { get; init; } = string.Empty;
    public string CoInvestmentId { get; init; } = string.Empty;
    public string DealId { get; init; } = string.Empty;
    public string RequestedBy { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public AssetClass AssetClass { get; init; }
    public Region Region { get; init; }
    public Liquidity Liquidity { get; init; }
    public DateOnly CommitmentDate { get; init; }
}

public sealed record CommitmentResult
{
    public bool IsValid { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

    public static CommitmentResult Ok() =>
        new() { IsValid = true, Errors = Array.Empty<string>() };

    public static CommitmentResult Fail(params string[] errors) =>
        new() { IsValid = false, Errors = errors };

    public static CommitmentResult Fail(IReadOnlyList<string> errors) =>
        new() { IsValid = false, Errors = errors };
}

/// <summary>Fixed reference date so past-date checks are deterministic; never DateTime.Now.</summary>
public static class CommitmentClock
{
    public static readonly DateOnly Today = new(2026, 6, 13);
}

/// <summary>Thrown by an adapter when a rule it owns is violated.</summary>
public sealed class CommitmentValidationException(string message) : Exception(message);
