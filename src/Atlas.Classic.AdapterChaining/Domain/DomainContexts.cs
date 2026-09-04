using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

/// <summary>Internal view of a fund, projected through the typed property bag.</summary>
public sealed class FundContext
{
    public required string FundId { get; init; }
    public required TypedPropertyBag Properties { get; init; }

    public bool IsOpen => Properties.Get(FundProperties.IsOpen);
    public string BaseCurrency => Properties.Get(FundProperties.BaseCurrency);
    public IReadOnlyCollection<string> PermittedCurrencies =>
        Properties.Get(FundProperties.PermittedCurrencies);
}

/// <summary>Internal view of a deal, mapped from <see cref="DealSnapshot"/>.</summary>
public sealed class DealContext
{
    public required string DealId { get; init; }
    public required bool IsInvestable { get; init; }
    public required AssetClass AssetClass { get; init; }
    public required Region Region { get; init; }
    public required Liquidity Liquidity { get; init; }
    public required DateOnly InvestableFrom { get; init; }
    public required DateOnly InvestableTo { get; init; }
    public required string Currency { get; init; }
}

/// <summary>Internal view of a co-investment node, mapped from <see cref="CoInvestmentNode"/>.</summary>
public sealed class CoInvestmentContext
{
    public required string CoInvestmentId { get; init; }
    public required string FundId { get; init; }
    public required bool IsActive { get; init; }
    public required decimal Headroom { get; init; }
    public required string Currency { get; init; }
}

/// <summary>Appetite limit and current exposure fused for one bucket.</summary>
public sealed class AppetiteContext
{
    public required bool HasConfiguredLimit { get; init; }
    public required decimal MaxAmount { get; init; }
    public required decimal AlreadyCommittedInBucket { get; init; }
}
