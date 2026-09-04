namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// SOURCE: CRM (the deal-pipeline system for private equity and private credit).
//
// The ONLY file that knows CRM's deal shape. When the CRM renames a
// field, versions its API, or is swapped for another deal system, the change is
// contained to this adapter — IDealClient and every rule stay untouched.
// ---------------------------------------------------------------------------
public sealed class CrmDealClient(SeedData data, int latencyMs = 5) : IDealClient
{
    public async Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct); // network hop to CRM
        // map CRM deal -> DealSnapshot
        return data.Deals.GetValueOrDefault(dealId);
    }
}
