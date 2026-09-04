using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class DealGateway(IDealClient client) : AdapterBase("DealPipeline")
{
    private readonly IDealClient _client = client;

    public async Task<DealContext> LoadAsync(string dealId, CancellationToken cancellationToken)
    {
        var snapshot = await _client.GetDealAsync(dealId, cancellationToken).ConfigureAwait(false);
        var found = RequireFound(snapshot, "Deal", dealId);
        return Map(found);
    }

    private static DealContext Map(DealSnapshot snapshot) => new()
    {
        DealId = snapshot.DealId,
        IsInvestable = snapshot.Status == DealStatus.Investable,
        AssetClass = snapshot.AssetClass,
        Region = snapshot.Region,
        Liquidity = snapshot.Liquidity,
        InvestableFrom = snapshot.InvestableFrom,
        InvestableTo = snapshot.InvestableTo,
        Currency = snapshot.Currency,
    };

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
