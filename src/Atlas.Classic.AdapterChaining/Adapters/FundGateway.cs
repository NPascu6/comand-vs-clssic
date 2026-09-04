using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class FundGateway(IFundClient client) : AdapterBase("FundBook")
{
    private readonly IFundClient _client = client;

    public async Task<FundContext> LoadAsync(string fundId, CancellationToken cancellationToken)
    {
        var snapshot = await _client.GetFundAsync(fundId, cancellationToken).ConfigureAwait(false);
        var found = RequireFound(snapshot, "Fund", fundId);
        return Map(found);
    }

    private static FundContext Map(FundSnapshot snapshot)
    {
        var bag = new TypedPropertyBag()
            .Set(FundProperties.DisplayName, snapshot.Name)
            .Set(FundProperties.IsOpen, snapshot.Status == FundStatus.Open)
            .Set(FundProperties.BaseCurrency, snapshot.BaseCurrency)
            .Set(FundProperties.PermittedCurrencies, snapshot.PermittedCurrencies);

        return new FundContext
        {
            FundId = snapshot.FundId,
            Properties = bag,
        };
    }

    public void EnsureOpen(FundContext fund)
    {
        if (!fund.IsOpen)
            throw new CommitmentValidationException(
                $"Fund '{fund.FundId}' is not Open and cannot accept commitments.");
    }

    public void EnsureCurrencyPermitted(FundContext fund, string currency)
    {
        if (!fund.PermittedCurrencies.Contains(currency))
            throw new CommitmentValidationException(
                $"Currency '{currency}' is not permitted for fund " +
                $"'{fund.FundId}'. Permitted: {string.Join(", ", fund.PermittedCurrencies)}.");
    }
}
