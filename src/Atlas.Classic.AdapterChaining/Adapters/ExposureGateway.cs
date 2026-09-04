using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class ExposureGateway(IExposureClient client) : AdapterBase("ExposureEngine")
{
    private readonly IExposureClient _client = client;

    public async Task<decimal> GetCommittedInBucketAsync(
        string fundId, AssetClass assetClass, Region region, CancellationToken cancellationToken)
    {
        var snapshot = await _client.GetExposureAsync(fundId, cancellationToken).ConfigureAwait(false);
        return snapshot.CommittedIn(assetClass, region);
    }
}
