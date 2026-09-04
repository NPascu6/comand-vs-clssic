using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class CommitmentFacade
{
    private readonly FundGateway _funds;
    private readonly DealGateway _deals;
    private readonly CoInvestmentGateway _coInvestments;
    private readonly AppetiteGateway _appetite;

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

    /// <summary>Wires the whole adapter chain by hand; a DI container would own this in production.</summary>
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
        CommitCapitalRequest request, CancellationToken cancellationToken = default)
    {
        var structuralErrors = StructuralValidator.Validate(request);
        if (structuralErrors.Count > 0)
            return CommitmentResult.Fail(structuralErrors);

        // Each adapter throws on the first breach it finds, so at most one business error surfaces.
        try
        {
            var fund = await _funds.LoadAsync(request.FundId, cancellationToken).ConfigureAwait(false);
            _funds.EnsureOpen(fund);
            _funds.EnsureCurrencyPermitted(fund, request.Currency);

            var deal = await _deals.LoadAsync(request.DealId, cancellationToken).ConfigureAwait(false);
            _deals.EnsureInvestableFor(
                deal, request.AssetClass, request.Region, request.Liquidity, request.CommitmentDate);

            var node = await _coInvestments.LoadAsync(request.CoInvestmentId, cancellationToken).ConfigureAwait(false);
            _coInvestments.EnsureHeadroom(node, request.FundId, request.Amount);

            var appetite = await _appetite
                .LoadForBucketAsync(request.FundId, request.AssetClass, request.Region, cancellationToken)
                .ConfigureAwait(false);
            _appetite.EnsureWithinLimit(appetite, request.AssetClass, request.Region, request.Amount);

            return CommitmentResult.Ok();
        }
        catch (CommitmentValidationException exception)
        {
            return CommitmentResult.Fail(exception.Message);
        }
    }
}
