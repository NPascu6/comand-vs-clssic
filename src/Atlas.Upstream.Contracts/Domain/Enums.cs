namespace Atlas.Upstream.Contracts;

public enum AssetClass
{
    PrivateEquity,
    PrivateCredit,
    LiquidEquity,
    Etf
}

public enum Region
{
    NorthAmerica,
    Emea,
    Apac,
    Latam
}

public enum Liquidity
{
    Illiquid,
    Liquid
}

public enum FundStatus
{
    Draft,
    Open,
    Frozen,
    Closed
}

public enum DealStatus
{
    Pipeline,
    Investable,
    Closed,
    Withdrawn
}

public enum CoInvestmentStatus
{
    Proposed,
    Active,
    Suspended,
    Closed
}
