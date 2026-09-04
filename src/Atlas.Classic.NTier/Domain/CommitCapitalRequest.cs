namespace Atlas.Classic.NTier.Domain;

/// <summary>The domain twin of <c>CommitCapitalDto</c>; the service never sees the wire type.</summary>
public sealed record CommitCapitalRequest(
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
