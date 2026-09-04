# Atlas.Upstream.Contracts

The boundary between Atlas and the systems it reads from. Atlas is a downstream
API: it owns no source data, it calls upstream services (fund book of record, deal
pipeline, co-investment structures, exposure engine, appetite policy) and composes
answers.

## Layout

```
Domain/         Enums · Snapshots — the vocabulary every rule and handler speaks
Ports/          IFundClient · IDealClient · ICoInvestmentClient · IAppetiteClient · IExposureClient · IUpstream
Sources/        DmsFundClient · CrmDealClient · CrmCoInvestmentClient · LedgerExposureClient · PolicyHubAppetiteClient
Composition/    InMemoryUpstream (binds ports to sources) · MemoizedUpstream (request-scoped decorator)
Data/           SeedData — the one deterministic dataset every source reads
```

## Ports

A port is a narrow interface expressed in Atlas's own vocabulary (the `Domain/`
snapshots). Rules and handlers depend only on ports, never on a concrete source.
`IUpstream` bundles the five ports so a handler takes one dependency.

Upstream systems change over a long life: fields are added, APIs are versioned, a
source is replaced. The port keeps that change contained:

- the mapping from a source's shape into a snapshot lives in exactly one place per
  source (`Sources/`);
- which source backs which port is decided in exactly one place (`Composition/`).

Swapping a source is one line in `InMemoryUpstream`; nothing else moves.

## Sources

Each source adapter is the only file that knows its system's shape. Today every
adapter reads a slice of `SeedData` behind a small `Task.Delay` that stands in for
the network hop, so the whole solution runs offline and deterministically.

## Domain snapshots

Read-models returned by the ports, deliberately immutable:

- `FundSnapshot`: status and permitted currencies.
- `DealSnapshot`: status, investable window, asset class, region, liquidity.
- `CoInvestmentNode`: a node in the co-investment hierarchy with a cap and an
  already-committed amount; `Headroom` is the difference. Child sleeves roll up to
  their `ParentCoInvestmentId`.
- `AppetiteLimit`: a ceiling per asset-class/region bucket.
- `ExposureSnapshot`: committed exposure per bucket. `Buckets.Key` is the canonical
  bucket key so limits and exposure always agree on spelling.

## MemoizedUpstream

A decorator over `IUpstream` that collapses concurrent reads of the same key into
one in-flight call per port. Construct one per command or request (a scoped service
under DI) so the cache never serves stale data across requests.
