namespace Atlas.Upstream.Contracts;

/// <summary>Bundle of every upstream port, so a handler takes one dependency, not five.</summary>
public interface IUpstream
{
    IFundClient Funds { get; }
    IDealClient Deals { get; }
    ICoInvestmentClient CoInvestments { get; }
    IAppetiteClient Appetite { get; }
    IExposureClient Exposure { get; }
}
