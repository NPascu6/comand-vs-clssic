using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

// ---------------------------------------------------------------------------
// The command and its result.
//
// A command is an immutable, intention-revealing record: "commit this capital
// to this co-investment, in this fund, against this deal". It is just the
// data needed to make the decision — no behaviour, no annotations, nothing
// reaching into a framework. That keeps it trivial to construct in a test.
// ---------------------------------------------------------------------------

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

/// <summary>What the handler returns once a commitment has been accepted and recorded.</summary>
public sealed record CommitmentReceipt(
    string CommitmentId,
    string FundId,
    string CoInvestmentId,
    string DealId,
    decimal Amount,
    string Currency,
    DateOnly CommitmentDate,
    string RequestedBy);
