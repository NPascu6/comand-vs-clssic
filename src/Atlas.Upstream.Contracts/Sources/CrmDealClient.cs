namespace Atlas.Upstream.Contracts;

public sealed class CrmDealClient(SeedData data, int latencyMs = 5) : IDealClient
{
    public async Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken); // simulates the network hop to CRM
        return data.Deals.GetValueOrDefault(dealId);
    }
}
