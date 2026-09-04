using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// CoInvestmentGateway: wraps ICoInvestmentClient, maps CoInvestmentNode ->
// CoInvestmentContext, and owns rule 5 (CoInvestmentHeadroom).
//
// Rule 5 has three parts (node belongs to this fund; node is Active;
// headroom covers the amount). Two of them — the cross-check that the node's
// FundId matches the request, and the amount comparison — need data the
// gateway doesn't own (the request's FundId and Amount). So once again the
// facade has to pass request state down into the adapter for the rule to run.
// ---------------------------------------------------------------------------

public sealed class CoInvestmentGateway(ICoInvestmentClient client) : AdapterBase("CoInvestmentHierarchy")
{
    private readonly ICoInvestmentClient _client = client;

    public async Task<CoInvestmentContext> LoadAsync(string coInvestmentId, CancellationToken ct)
    {
        var node = await _client.GetNodeAsync(coInvestmentId, ct).ConfigureAwait(false);
        var found = RequireFound(node, "Co-investment node", coInvestmentId);
        return Map(found);
    }

    // Headroom is a computed property on the snapshot; we copy its *value* into
    // the context here. If the definition of headroom ever changes upstream, this
    // mapping keeps reading the old shape until someone remembers to update it —
    // a subtle place for the wrapper to drift from the source of truth.
    private static CoInvestmentContext Map(CoInvestmentNode n) => new()
    {
        CoInvestmentId = n.CoInvestmentId,
        FundId = n.FundId,
        IsActive = n.Status == CoInvestmentStatus.Active,
        Headroom = n.Headroom,
        Currency = n.Currency,
    };

    /// <summary>
    /// Rule 5: CoInvestmentHeadroom. Three checks, each throwing, so a suspended
    /// node that ALSO lacks headroom only reports the "not Active" breach. The
    /// fund-ownership check lives here even though "which fund" is a
    /// facade-level concept — another rule fragment that migrated into an adapter.
    /// </summary>
    public void EnsureHeadroom(CoInvestmentContext node, string fundId, decimal amount)
    {
        if (node.FundId != fundId)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' belongs to fund " +
                $"'{node.FundId}', not '{fundId}'.");

        if (!node.IsActive)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' is not Active.");

        if (node.Headroom < amount)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' has insufficient headroom: " +
                $"{node.Headroom:N0} available, {amount:N0} requested.");
    }
}
