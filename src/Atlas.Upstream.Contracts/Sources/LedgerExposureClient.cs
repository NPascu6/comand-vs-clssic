namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// SOURCE: Ledger (the master positions / exposure book).
//
// The ONLY file that knows Ledger's exposure shape. When Ledger starts returning
// exposure pre-bucketed, or batches funds, or is replaced by a new
// position store, the change lands here — IExposureClient and the appetite rule
// that consumes it stay exactly as they are.
// ---------------------------------------------------------------------------
public sealed class LedgerExposureClient(SeedData data, int latencyMs = 5) : IExposureClient
{
    public async Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct); // network hop to Ledger
        return data.ExposureByFund.TryGetValue(fundId, out var snap)
            ? snap
            : new ExposureSnapshot(fundId, 0m, new Dictionary<string, decimal>());
    }
}
