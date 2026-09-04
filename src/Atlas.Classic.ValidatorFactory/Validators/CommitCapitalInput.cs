namespace Atlas.Classic.ValidatorFactory;

/// <summary>The command being validated: a fund manager commits capital to a co-investment node, in a fund, against a deal.</summary>
public sealed record CommitCapitalInput(
    string FundId,
    string CoInvestmentId,
    string DealId,
    string RequestedBy,
    decimal Amount,
    string Currency,
    AssetClass AssetClass,
    Region Region,
    Liquidity Liquidity,
    DateOnly CommitmentDate);
