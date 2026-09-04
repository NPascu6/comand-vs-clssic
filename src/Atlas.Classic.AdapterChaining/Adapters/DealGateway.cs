using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// DealGateway: wraps IDealClient, maps DealSnapshot -> DealContext, and owns
// rule 4 (DealInvestable) — which is itself four sub-checks bundled together:
//   status investable; date within window; asset-class match; region match;
//   liquidity match.
//
// Because all four sub-checks throw from inside one method, a request that gets
// (say) both the status AND the asset-class wrong will only ever be told about
// whichever check runs first. That is the chained-orchestration short-circuit
// showing up WITHIN a single rule, not just between rules.
// ---------------------------------------------------------------------------

public sealed class DealGateway(IDealClient client) : AdapterBase("DealPipeline")
{
    private readonly IDealClient _client = client;

    public async Task<DealContext> LoadAsync(string dealId, CancellationToken ct)
    {
        var snapshot = await _client.GetDealAsync(dealId, ct).ConfigureAwait(false);
        var found = RequireFound(snapshot, "Deal", dealId);
        return Map(found);
    }

    // Hand-mapping again. DealStatus.Investable is flattened to a bool, and the
    // four classification fields are copied straight across so the rule below can
    // compare them to the request. Three places to touch if a deal ever grows,
    // say, a "sub-strategy" dimension that the rule must also match on.
    private static DealContext Map(DealSnapshot s) => new()
    {
        DealId = s.DealId,
        IsInvestable = s.Status == DealStatus.Investable,
        AssetClass = s.AssetClass,
        Region = s.Region,
        Liquidity = s.Liquidity,
        InvestableFrom = s.InvestableFrom,
        InvestableTo = s.InvestableTo,
        Currency = s.Currency,
    };

    /// <summary>
    /// Rule 4: DealInvestable. Needs almost the entire request (asset class,
    /// region, liquidity, commitment date), so the facade has to hand the request
    /// fields down here. The rule body is the classic "wall of ifs that each
    /// throw", and the order of the ifs silently decides which breach a caller
    /// hears about first.
    /// </summary>
    public void EnsureInvestableFor(
        DealContext deal,
        AssetClass assetClass,
        Region region,
        Liquidity liquidity,
        DateOnly commitmentDate)
    {
        if (!deal.IsInvestable)
            throw new CommitmentValidationException(
                $"Deal '{deal.DealId}' is not Investable.");

        if (commitmentDate < deal.InvestableFrom || commitmentDate > deal.InvestableTo)
            throw new CommitmentValidationException(
                $"Commitment date {commitmentDate:yyyy-MM-dd} is outside deal '{deal.DealId}' " +
                $"investable window [{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");

        if (deal.AssetClass != assetClass)
            throw new CommitmentValidationException(
                $"Asset class {assetClass} does not match deal '{deal.DealId}' ({deal.AssetClass}).");

        if (deal.Region != region)
            throw new CommitmentValidationException(
                $"Region {region} does not match deal '{deal.DealId}' ({deal.Region}).");

        if (deal.Liquidity != liquidity)
            throw new CommitmentValidationException(
                $"Liquidity {liquidity} does not match deal '{deal.DealId}' ({deal.Liquidity}).");
    }
}
