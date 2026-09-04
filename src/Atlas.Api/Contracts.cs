using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Api;

// ---------------------------------------------------------------------------
// HTTP wire contracts.
//
// These records are the API's own shapes, kept separate from the domain command
// and result so the frontend contract can evolve independently. The mapping is
// trivial and explicit — no AutoMapper, just a constructor call — which keeps
// every field the wire exposes visible in one place.
// ---------------------------------------------------------------------------

/// <summary>Inbound POST body — the same fields as the command, mapped 1:1.</summary>
public sealed record CommitCapitalRequest(
    string FundId,
    string CoInvestmentId,
    string DealId,
    decimal Amount,
    string Currency,
    AssetClass AssetClass,
    Region Region,
    Liquidity Liquidity,
    DateOnly CommitmentDate,
    string RequestedBy)
{
    public CommitCapitalCommand ToCommand() => new(
        FundId,
        CoInvestmentId,
        DealId,
        Amount,
        Currency,
        AssetClass,
        Region,
        Liquidity,
        CommitmentDate,
        RequestedBy);
}

/// <summary>One validation/business error, flattened for the UI.</summary>
public sealed record ErrorResponse(string Code, string Message, string? Field, Severity Severity)
{
    public static ErrorResponse From(Error error) =>
        new(error.Code, error.Message, error.Field, error.Severity);
}

/// <summary>
/// The outcome of a commitment attempt: whether it was approved, the new
/// commitment id (on success), any errors (on failure), and always the full
/// decision trace so the UI can show exactly which rules ran and why.
/// </summary>
public sealed record CommitmentResponse(
    bool Approved,
    string? CommitmentId,
    IReadOnlyList<ErrorResponse> Errors,
    DecisionTrace Trace)
{
    public static CommitmentResponse From(HandlerOutcome<CommitmentReceipt> outcome) =>
        outcome.Approved
            ? new CommitmentResponse(true, outcome.Result.Value.CommitmentId, [], outcome.Trace)
            : new CommitmentResponse(
                false,
                null,
                [.. outcome.Result.Errors.Select(ErrorResponse.From)],
                outcome.Trace);
}

// --- Reference data (form dropdowns) ---------------------------------------

public sealed record ReferenceData(
    IReadOnlyList<FundRef> Funds,
    IReadOnlyList<DealRef> Deals,
    IReadOnlyList<CoInvestmentRef> CoInvestments)
{
    public static ReferenceData From(SeedData seed) => new(
        [.. seed.Funds.Values.Select(FundRef.From)],
        [.. seed.Deals.Values.Select(DealRef.From)],
        [.. seed.CoInvestments.Values.Select(CoInvestmentRef.From)]);
}

public sealed record FundRef(
    string FundId,
    string Name,
    FundStatus Status,
    string BaseCurrency,
    IReadOnlyCollection<string> PermittedCurrencies)
{
    public static FundRef From(FundSnapshot p) =>
        new(p.FundId, p.Name, p.Status, p.BaseCurrency, p.PermittedCurrencies);
}

public sealed record DealRef(
    string DealId,
    string Name,
    DealStatus Status,
    AssetClass AssetClass,
    Region Region,
    Liquidity Liquidity,
    DateOnly InvestableFrom,
    DateOnly InvestableTo,
    string Currency)
{
    public static DealRef From(DealSnapshot d) =>
        new(d.DealId, d.Name, d.Status, d.AssetClass, d.Region, d.Liquidity,
            d.InvestableFrom, d.InvestableTo, d.Currency);
}

public sealed record CoInvestmentRef(
    string CoInvestmentId,
    string FundId,
    string? ParentCoInvestmentId,
    CoInvestmentStatus Status,
    decimal CommitmentCap,
    decimal AlreadyCommitted,
    decimal Headroom,
    string Currency)
{
    public static CoInvestmentRef From(CoInvestmentNode c) =>
        new(c.CoInvestmentId, c.FundId, c.ParentCoInvestmentId, c.Status,
            c.CommitmentCap, c.AlreadyCommitted, c.Headroom, c.Currency);
}
