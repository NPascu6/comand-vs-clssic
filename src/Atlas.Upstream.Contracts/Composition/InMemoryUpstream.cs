namespace Atlas.Upstream.Contracts;

/// <summary>The one place that decides which source backs which port; every port is a fake over SeedData.</summary>
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

        Funds         = new DmsFundClient(data, latencyMs);
        Deals         = new CrmDealClient(data, latencyMs);
        CoInvestments = new CrmCoInvestmentClient(data, latencyMs);
        Appetite      = new PolicyHubAppetiteClient(data, latencyMs);
        Exposure      = new LedgerExposureClient(data, latencyMs);
    }

    public static InMemoryUpstream Create(int latencyMs = 5) => new(latencyMs);
}
