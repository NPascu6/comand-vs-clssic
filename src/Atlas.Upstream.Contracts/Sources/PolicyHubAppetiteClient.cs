namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// SOURCE: PolicyHub (the compliance / policy centre that owns appetite ceilings).
//
// The ONLY file that knows how PolicyHub publishes limits. If PolicyHub moves to an
// event-streamed policy feed, or starts returning per-strategy sub-limits, the
// mapping changes here — IAppetiteClient and the appetite rule are unaffected.
// ---------------------------------------------------------------------------
public sealed class PolicyHubAppetiteClient(SeedData data, int latencyMs = 5) : IAppetiteClient
{
    public async Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(
        string fundId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct); // network hop to PolicyHub
        return data.AppetiteByFund.TryGetValue(fundId, out var limits)
            ? limits
            : Array.Empty<AppetiteLimit>();
    }
}
