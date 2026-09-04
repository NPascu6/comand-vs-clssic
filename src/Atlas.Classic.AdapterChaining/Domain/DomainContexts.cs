using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// Internal "domain" models.
//
// These are the strongly-typed shapes the facade orchestrates against. They are
// NOT the upstream snapshots — each one is hand-mapped from a snapshot by its
// gateway. That mapping is the boilerplate this pattern is famous for: the data
// already exists, fully typed, on the snapshot; we copy it field-by-field into a
// near-identical internal record so the orchestration "doesn't depend on
// upstream contracts directly".
//
// The upside is real (one place to absorb an upstream rename). The downside is
// also real: every new field upstream means editing the snapshot, the context,
// AND the mapping, in three files, before the facade can even see it.
// ---------------------------------------------------------------------------

/// <summary>Internal view of a fund, projected through the typed property bag.</summary>
public sealed class FundContext
{
    public required string FundId { get; init; }
    public required TypedPropertyBag Properties { get; init; }

    // Convenience accessors so the facade reads a little less like a dictionary
    // lookup. Each one re-derives from the bag — i.e. another hop of indirection
    // on top of data that was plain on the snapshot to begin with.
    public bool IsOpen => Properties.Get(FundProperties.IsOpen);
    public string BaseCurrency => Properties.Get(FundProperties.BaseCurrency);
    public IReadOnlyCollection<string> PermittedCurrencies =>
        Properties.Get(FundProperties.PermittedCurrencies);
}

/// <summary>Internal view of a deal, hand-mapped from <see cref="DealSnapshot"/>.</summary>
public sealed class DealContext
{
    public required string DealId { get; init; }
    public required bool IsInvestable { get; init; }
    public required AssetClass AssetClass { get; init; }
    public required Region Region { get; init; }
    public required Liquidity Liquidity { get; init; }
    public required DateOnly InvestableFrom { get; init; }
    public required DateOnly InvestableTo { get; init; }
    public required string Currency { get; init; }
}

/// <summary>Internal view of a co-investment node, hand-mapped from the snapshot.</summary>
public sealed class CoInvestmentContext
{
    public required string CoInvestmentId { get; init; }
    public required string FundId { get; init; }
    public required bool IsActive { get; init; }
    public required decimal Headroom { get; init; }
    public required string Currency { get; init; }
}

/// <summary>
/// Internal view that fuses appetite + exposure for one bucket. Note this single
/// context is assembled from TWO upstream services (appetite limits and current
/// exposure) by TWO different gateways — so the rule that consumes it
/// (AppetiteWithinLimit) has a dependency on both, which is invisible from the
/// facade until you trace the calls.
/// </summary>
public sealed class AppetiteContext
{
    public required bool HasConfiguredLimit { get; init; }
    public required decimal MaxAmount { get; init; }
    public required decimal AlreadyCommittedInBucket { get; init; }
}
