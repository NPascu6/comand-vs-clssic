namespace Atlas.Upstream.Contracts;

public sealed class LedgerExposureClient(SeedData data, int latencyMs = 5) : IExposureClient
{
    public async Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken); // simulates the network hop to Ledger
        return data.ExposureByFund.TryGetValue(fundId, out var snapshot)
            ? snapshot
            : new ExposureSnapshot(fundId, 0m, new Dictionary<string, decimal>());
    }
}
