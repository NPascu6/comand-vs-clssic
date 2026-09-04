using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// FundGateway: wraps IFundClient, maps FundSnapshot ->
// FundContext (via the typed property bag), and owns two of the six rules:
//   - FundOpen      (rule 2)
//   - CurrencyPermitted  (rule 3)
//
// Note already how the rules have drifted: rules 2 and 3 are physically here, in
// the fund adapter, while rules 4/5/6 live in other adapters and rule 1
// lives in the facade. There is no single file you can open to read "all the
// rules for committing capital".
// ---------------------------------------------------------------------------

public sealed class FundGateway(IFundClient client) : AdapterBase("FundBook")
{
    private readonly IFundClient _client = client;

    /// <summary>
    /// Loads the fund and maps it into the internal context. The "must
    /// exist" half of rule 2 is enforced here through the base class.
    /// </summary>
    public async Task<FundContext> LoadAsync(string fundId, CancellationToken ct)
    {
        var snapshot = await _client.GetFundAsync(fundId, ct).ConfigureAwait(false);
        var found = RequireFound(snapshot, "Fund", fundId);
        return Map(found);
    }

    /// <summary>
    /// Hand-mapping from snapshot to context. Every field is copied across, and
    /// FundStatus.Open is flattened into a bool here — so the meaning of
    /// "open" is decided in the mapping layer, not where the rule reads.
    /// </summary>
    private static FundContext Map(FundSnapshot s)
    {
        var bag = new TypedPropertyBag()
            .Set(FundProperties.DisplayName, s.Name)
            .Set(FundProperties.IsOpen, s.Status == FundStatus.Open)
            .Set(FundProperties.BaseCurrency, s.BaseCurrency)
            .Set(FundProperties.PermittedCurrencies, s.PermittedCurrencies);

        return new FundContext
        {
            FundId = s.FundId,
            Properties = bag,
        };
    }

    /// <summary>Rule 2: FundOpen. Throws on breach (validation-as-exception).</summary>
    public void EnsureOpen(FundContext fund)
    {
        if (!fund.IsOpen)
            throw new CommitmentValidationException(
                $"Fund '{fund.FundId}' is not Open and cannot accept commitments.");
    }

    /// <summary>
    /// Rule 3: CurrencyPermitted. Lives here because it needs the fund's
    /// permitted-currency list — but note it ALSO needs the request's Currency,
    /// which the facade has to pass down. The rule is now split across two
    /// layers: the data on this side, the input from the facade side.
    /// </summary>
    public void EnsureCurrencyPermitted(FundContext fund, string currency)
    {
        if (!fund.PermittedCurrencies.Contains(currency))
            throw new CommitmentValidationException(
                $"Currency '{currency}' is not permitted for fund " +
                $"'{fund.FundId}'. Permitted: {string.Join(", ", fund.PermittedCurrencies)}.");
    }
}
