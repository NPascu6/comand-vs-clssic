namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// Shared Atlas domain vocabulary.
//
// Atlas (Central Fund Management) spans liquid and illiquid markets:
// private equity, private credit, and some public/liquid ETFs, across regions.
// These enums are the language every sample in this solution speaks, so the
// "classic" and "functional" approaches can be compared on identical ground.
// ---------------------------------------------------------------------------

/// <summary>The kind of asset a commitment targets.</summary>
public enum AssetClass
{
    PrivateEquity,
    PrivateCredit,
    LiquidEquity,
    Etf
}

/// <summary>Geography bucket used for appetite restrictions and reporting.</summary>
public enum Region
{
    NorthAmerica,
    Emea,
    Apac,
    Latam
}

/// <summary>Whether the position can be exited on a public market.</summary>
public enum Liquidity
{
    Illiquid,
    Liquid
}

/// <summary>Lifecycle state of a fund held upstream.</summary>
public enum FundStatus
{
    Draft,
    Open,
    Frozen,
    Closed
}

/// <summary>Lifecycle state of an investable deal held upstream.</summary>
public enum DealStatus
{
    Pipeline,
    Investable,
    Closed,
    Withdrawn
}

/// <summary>
/// Lifecycle state of a co-investment node. Co-investments form a hierarchy
/// (a root vehicle with child sleeves), so each node also carries a parent id.
/// </summary>
public enum CoInvestmentStatus
{
    Proposed,
    Active,
    Suspended,
    Closed
}
