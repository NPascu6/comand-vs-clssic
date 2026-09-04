using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// CommitmentFacade: the single entry point the web tier calls, exactly like the
// SharePoint-wrapping DMS exposes one facade method per document operation.
//
// SubmitCommitmentAsync orchestrates the whole thing by calling adapter after
// adapter and threading the mapped contexts through, with validation checks
// INTERLEAVED between the loads. Read top to bottom and you can see the shape of
// the operation — but you canNOT see all six rules in one place, because four of
// them are enforced inside the gateways this method calls.
//
// Two honest limitations are baked in and commented at the point they bite:
//   1. Deep call chains: facade -> gateway -> AdapterBase -> upstream client
//      (and AppetiteGateway -> ExposureGateway -> client on top of that).
//   2. Short-circuit on first business breach: the business phase is a try/catch
//      around throwing adapters, so a request that breaks rule 5 AND rule 6
//      surfaces only the first one. Scenario B is built to demonstrate exactly
//      this, and it is a genuine weakness of chained orchestration for Atlas, where
//      a trader wants to see ALL breaches at once.
// ---------------------------------------------------------------------------

public sealed class CommitmentFacade
{
    private readonly FundGateway _funds;
    private readonly DealGateway _deals;
    private readonly CoInvestmentGateway _coInvestments;
    private readonly AppetiteGateway _appetite;

    // The facade takes FOUR adapters as dependencies (and AppetiteGateway itself
    // wraps a fifth, ExposureGateway). To unit-test this orchestration you must
    // construct or mock every one of them — even to exercise a single rule.
    public CommitmentFacade(
        FundGateway funds,
        DealGateway deals,
        CoInvestmentGateway coInvestments,
        AppetiteGateway appetite)
    {
        _funds = funds;
        _deals = deals;
        _coInvestments = coInvestments;
        _appetite = appetite;
    }

    /// <summary>
    /// Composition root convenience: wire the whole adapter chain from a single
    /// <see cref="IUpstream"/>. In production this would be the DI container's job;
    /// having it here keeps the demo (and the chain) easy to see.
    /// </summary>
    public static CommitmentFacade FromUpstream(IUpstream upstream)
    {
        var exposureGateway = new ExposureGateway(upstream.Exposure);
        return new CommitmentFacade(
            new FundGateway(upstream.Funds),
            new DealGateway(upstream.Deals),
            new CoInvestmentGateway(upstream.CoInvestments),
            new AppetiteGateway(upstream.Appetite, exposureGateway));
    }

    public async Task<CommitmentResult> SubmitCommitmentAsync(
        CommitCapitalRequest request, CancellationToken ct = default)
    {
        // -- Phase 1: structural (rule 1) --------------------------------------
        // The only phase that returns a COMPLETE list of problems. We stop here if
        // the shape is wrong, because the upstream calls below would just throw on
        // the empty ids / bad values anyway.
        var structuralErrors = StructuralValidator.Validate(request);
        if (structuralErrors.Count > 0)
            return CommitmentResult.Fail(structuralErrors);

        // -- Phase 2: business rules (rules 2-6), via the adapter chain ---------
        // Everything below is validation-as-exception: each adapter throws on the
        // first rule it finds broken, and this try/catch turns the first throw
        // into the (single) reported error. THIS IS THE SHORT-CIRCUIT. A request
        // that breaks several business rules at once will report only the earliest
        // one in this sequence. We accept that here to stay true to how chained
        // facades are really written — and we flag it as a limitation.
        try
        {
            // Rule 2 + 3 live in FundGateway. Load (which also enforces the
            // "fund exists" half), then run the two fund rules. Notice
            // the rule call needs request.Currency passed down — the rule is split
            // between the adapter (data) and the facade (input).
            var fund = await _funds.LoadAsync(request.FundId, ct).ConfigureAwait(false);
            _funds.EnsureOpen(fund);                                  // rule 2
            _funds.EnsureCurrencyPermitted(fund, request.Currency);   // rule 3

            // Rule 4 lives in DealGateway. We have to hand it four request fields
            // for it to do its job — the orchestration is doing the "gather the
            // inputs and call the rule" dance that a single rules engine would not
            // need.
            var deal = await _deals.LoadAsync(request.DealId, ct).ConfigureAwait(false);
            _deals.EnsureInvestableFor(                                          // rule 4
                deal, request.AssetClass, request.Region, request.Liquidity, request.CommitmentDate);

            // Rule 5 lives in CoInvestmentGateway. Same story: FundId and
            // Amount are threaded down from the request.
            var node = await _coInvestments.LoadAsync(request.CoInvestmentId, ct).ConfigureAwait(false);
            _coInvestments.EnsureHeadroom(node, request.FundId, request.Amount);  // rule 5

            // Rule 6 lives in AppetiteGateway, which internally chains into
            // ExposureGateway. By the time we get here we are four method-hops deep
            // for this single check: facade -> AppetiteGateway.LoadForBucketAsync
            // -> ExposureGateway.GetCommittedInBucketAsync -> IExposureClient.
            var appetite = await _appetite
                .LoadForBucketAsync(request.FundId, request.AssetClass, request.Region, ct)
                .ConfigureAwait(false);
            _appetite.EnsureWithinLimit(appetite, request.AssetClass, request.Region, request.Amount); // rule 6

            return CommitmentResult.Ok();
        }
        catch (CommitmentValidationException ex)
        {
            // One throw in, one message out. No structured per-rule trail: we
            // can't say WHICH rule id failed, can't list the others that WOULD
            // have failed, and can't attach the inputs that were evaluated. For a
            // Atlas audit ("show me every check this trade passed and failed, with
            // values"), this is the wrong shape — see README "Cons".
            return CommitmentResult.Fail(ex.Message);
        }
    }
}
