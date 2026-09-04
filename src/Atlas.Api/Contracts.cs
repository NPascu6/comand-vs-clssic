using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Api;

// The API's own shapes, kept apart from the domain command so the frontend contract can evolve independently.

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

public sealed record ErrorResponse(string Code, string Message, string? Field, Severity Severity)
{
    public static ErrorResponse From(Error error) =>
        new(error.Code, error.Message, error.Field, error.Severity);
}

/// <summary>Always carries the full decision trace, approved or not.</summary>
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
    public static FundRef From(FundSnapshot fund) =>
        new(fund.FundId, fund.Name, fund.Status, fund.BaseCurrency, fund.PermittedCurrencies);
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
    public static DealRef From(DealSnapshot deal) =>
        new(deal.DealId, deal.Name, deal.Status, deal.AssetClass, deal.Region, deal.Liquidity,
            deal.InvestableFrom, deal.InvestableTo, deal.Currency);
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
    public static CoInvestmentRef From(CoInvestmentNode node) =>
        new(node.CoInvestmentId, node.FundId, node.ParentCoInvestmentId, node.Status,
            node.CommitmentCap, node.AlreadyCommitted, node.Headroom, node.Currency);
}
