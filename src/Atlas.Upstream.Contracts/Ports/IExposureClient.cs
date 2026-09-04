namespace Atlas.Upstream.Contracts;

/// <summary>Committed exposure / positions. Backed today by Ledger (see Sources/LedgerExposureClient).</summary>
public interface IExposureClient
{
    Task<ExposureSnapshot> GetExposureAsync(string fundId, CancellationToken cancellationToken = default);
}
