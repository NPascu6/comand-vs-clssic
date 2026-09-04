namespace Atlas.Upstream.Contracts;

/// <summary>Fund book of record. Backed today by the DMS (see Sources/DmsFundClient).</summary>
public interface IFundClient
{
    Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken ct = default);
}
