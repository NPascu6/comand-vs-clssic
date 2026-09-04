using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// ExposureGateway: wraps IExposureClient. It owns no rule on its own — it just
// answers "how much is already committed in this (asset class, region) bucket?".
//
// On its own that looks harmless. The catch is that rule 6 (AppetiteWithinLimit)
// needs BOTH this number and the appetite ceiling, so the rule cannot live here
// OR in the appetite gateway cleanly — it ends up straddling both. We resolve
// that by having AppetiteGateway call THROUGH to this gateway (adapter calling
// adapter), which deepens the chain: facade -> AppetiteGateway -> ExposureGateway
// -> IExposureClient.
// ---------------------------------------------------------------------------

public sealed class ExposureGateway(IExposureClient client) : AdapterBase("ExposureEngine")
{
    private readonly IExposureClient _client = client;

    /// <summary>
    /// Returns the amount already committed in the given bucket for the fund.
    /// The snapshot's own CommittedIn(...) helper does the lookup; we surface just
    /// the scalar the appetite rule needs, discarding the rest of the snapshot.
    /// </summary>
    public async Task<decimal> GetCommittedInBucketAsync(
        string fundId, AssetClass assetClass, Region region, CancellationToken ct)
    {
        var snapshot = await _client.GetExposureAsync(fundId, ct).ConfigureAwait(false);
        return snapshot.CommittedIn(assetClass, region);
    }
}
