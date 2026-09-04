namespace Atlas.Upstream.Contracts;

/// <summary>Appetite / policy ceilings. Backed today by PolicyHub (see Sources/PolicyHubAppetiteClient).</summary>
public interface IAppetiteClient
{
    Task<IReadOnlyCollection<AppetiteLimit>> GetLimitsAsync(
        string fundId, CancellationToken ct = default);
}
