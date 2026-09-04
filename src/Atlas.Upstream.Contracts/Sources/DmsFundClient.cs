namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// SOURCE: DMS (the SharePoint-wrapper Document Management System).
//
// This is the ONLY file that knows the DMS's shape. Mapping a DMS record into
// our canonical FundSnapshot happens here. When the DMS changes its
// strongly-typed properties, ships a v2 API, or is replaced outright, THIS file
// changes — the IFundClient port, the rules, and the handlers do not.
// ---------------------------------------------------------------------------
public sealed class DmsFundClient(SeedData data, int latencyMs = 5) : IFundClient
{
    public async Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct); // network hop to the DMS
        // map DMS -> FundSnapshot (identity here; real translation lives in this method)
        return data.Funds.GetValueOrDefault(fundId);
    }
}
