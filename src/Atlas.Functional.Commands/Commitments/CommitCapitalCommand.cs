using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public sealed record CommitCapitalCommand(
    string FundId,
    string CoInvestmentId,
    string DealId,
    decimal Amount,
    string Currency,
    AssetClass AssetClass,
    Region Region,
    Liquidity Liquidity,
    DateOnly CommitmentDate,
    string RequestedBy);

public sealed record CommitmentReceipt(
    string CommitmentId,
    string FundId,
    string CoInvestmentId,
    string DealId,
    decimal Amount,
    string Currency,
    DateOnly CommitmentDate,
    string RequestedBy);
