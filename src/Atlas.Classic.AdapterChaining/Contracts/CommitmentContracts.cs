using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// The public surface the web app sees: a request DTO, a result DTO, and a
// fixed "today" clock.
//
// This is modelled on how the SharePoint-wrapping DMS exposes itself to its
// own web tier: the controller builds a request object, hands it to ONE facade
// method, and gets back a flat result it can render. Everything between the
// facade and the upstream SharePoint/CSOM calls is hidden behind adapters.
// ---------------------------------------------------------------------------

/// <summary>
/// A request to commit capital to a co-investment node within a fund,
/// against a specific deal. This is what the web tier posts to the facade.
/// </summary>
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

/// <summary>
/// The flat result the facade returns to the web tier. Note there is no
/// per-rule breakdown here — by the time orchestration finishes we only have a
/// bag of strings, because each layer threw or appended its own message in its
/// own way. Atlas ultimately needs trading-grade, per-rule audit; this shape
/// cannot carry it without a rewrite. (See README "Cons".)
/// </summary>
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

/// <summary>
/// Fixed "today" for all past-date checks, per spec — never DateTime.Now, so the
/// demo is deterministic. In the real DMS this would be an injected IClock; the
/// rule's reference point still has to be threaded down through the adapters
/// that need it, which is part of the plumbing cost.
/// </summary>
public static class CommitmentClock
{
    public static readonly DateOnly Today = new(2026, 6, 13);
}

/// <summary>
/// Thrown by an adapter when a rule it owns is violated. Carrying validation as
/// exceptions is a common (if debatable) DMS habit: it lets a deep call chain
/// abort without every caller having to inspect a return value — at the cost of
/// using control flow for expected business outcomes, and of collapsing all the
/// rules a request broke down to whichever one threw first.
/// </summary>
public sealed class CommitmentValidationException(string message) : Exception(message);
