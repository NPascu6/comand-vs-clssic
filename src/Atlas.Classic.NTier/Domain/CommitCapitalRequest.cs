namespace Atlas.Classic.NTier.Domain;

// ===========================================================================
// DOMAIN MODEL (Domain/).
//
// In the N-tier orthodoxy each tier speaks its own shape:
//   * the web tier speaks DTOs (CommitCapitalDto)         — Dtos/
//   * the service/domain tier speaks this CommitCapitalRequest
//   * each repository speaks its own Entity                — Repositories/Entities/
//
// The justification is "decoupling": the controller can change its wire shape
// without touching the service, the repos can change their persistence shape
// without touching the domain. The cost is that the SAME ten fields are declared
// three-plus times and copied between shapes by hand (see Mapping/). For one
// feature that is pure ceremony; the README counts it.
// ===========================================================================

/// <summary>
/// The domain request the service operates on. Structurally identical to the
/// inbound <c>CommitCapitalDto</c> and to <c>CommitCapitalInput</c> in the other
/// samples — but it is a SEPARATE type, because crossing the controller→service
/// boundary is supposed to mean leaving the wire model behind.
/// </summary>
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
