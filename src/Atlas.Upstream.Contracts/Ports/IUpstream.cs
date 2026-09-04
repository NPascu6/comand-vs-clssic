namespace Atlas.Upstream.Contracts;

// ===========================================================================
// PORTS — the stable contracts Atlas depends on.
//
// Atlas is a downstream API over many upstream systems — the CRM, the DMS,
// Ledger, PolicyHub, and other internal datasources. Over a 5+ year life those systems
// WILL change: fields get added, APIs get versioned, a source gets replaced,
// a new source appears, a call becomes batched or slower.
//
// The defence is a PORT: a narrow interface expressed in Atlas's own vocabulary
// (the Domain/ snapshots). Business rules and handlers depend ONLY on these
// ports — never on the CRM or any concrete source. The mapping from a real
// source's shape into our snapshot lives in exactly one place per source
// (see Sources/), and which source backs which port is decided in exactly one
// place (see Composition/). Change is therefore CONTAINED, not rippled.
// ===========================================================================

/// <summary>Bundle of every upstream port, so a handler takes one dependency, not five.</summary>
public interface IUpstream
{
    IFundClient Funds { get; }
    IDealClient Deals { get; }
    ICoInvestmentClient CoInvestments { get; }
    IAppetiteClient Appetite { get; }
    IExposureClient Exposure { get; }
}
