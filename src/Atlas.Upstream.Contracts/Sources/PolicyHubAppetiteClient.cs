namespace Atlas.Upstream.Contracts;

public sealed class PolicyHubAppetiteClient(SeedData data, int latencyMs = 5) : IAppetiteClient
{
    public async Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(
        string fundId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken); // simulates the network hop to PolicyHub
        return data.AppetiteByFund.TryGetValue(fundId, out var limits)
            ? limits
            : Array.Empty<AppetiteLimit>();
    }
}
