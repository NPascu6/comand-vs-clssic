namespace Atlas.Upstream.Contracts;

public sealed class DmsFundClient(SeedData data, int latencyMs = 5) : IFundClient
{
    public async Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken); // simulates the network hop to the DMS
        return data.Funds.GetValueOrDefault(fundId);
    }
}
