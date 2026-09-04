namespace Atlas.Upstream.Contracts;

// ===========================================================================
// COMPOSITION ROOT — the ONE place that decides which source backs which port.
//
// This is the entire "wiring". Swapping the CRM for a new deal system, or
// pointing at a sandbox vs production source, is a one-line change HERE and
// nowhere else. Rules and handlers never see a concrete source — only ports.
//
// For dev/test every port is bound to a fake source over the shared SeedData,
// so the whole solution runs offline and deterministically.
// ===========================================================================
public sealed class InMemoryUpstream : IUpstream
{
    public IFundClient Funds { get; }
    public IDealClient Deals { get; }
    public ICoInvestmentClient CoInvestments { get; }
    public IAppetiteClient Appetite { get; }
    public IExposureClient Exposure { get; }

    public InMemoryUpstream(int latencyMs = 5)
    {
        var data = SeedData.Build();

        // bind PORT  <-  SOURCE     (the only place that names a source)
        Funds         = new DmsFundClient(data, latencyMs);          // DMS
        Deals         = new CrmDealClient(data, latencyMs);         // CRM
        CoInvestments = new CrmCoInvestmentClient(data, latencyMs); // CRM
        Appetite      = new PolicyHubAppetiteClient(data, latencyMs); // PolicyHub
        Exposure      = new LedgerExposureClient(data, latencyMs);    // Ledger
        // tomorrow:  Deals = new NextGenDealsClient(...);  — one line, nothing else moves.
    }

    public static InMemoryUpstream Create(int latencyMs = 5) => new(latencyMs);
}
