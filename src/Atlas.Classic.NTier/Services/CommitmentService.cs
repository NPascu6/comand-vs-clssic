using Atlas.Classic.NTier.Configuration;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Repositories;
using Atlas.Classic.NTier.Repositories.Entities;
using Atlas.Classic.NTier.Validation;

namespace Atlas.Classic.NTier.Services;

public sealed class CommitmentService : ICommitmentService
{
    // Fixed reference date; matches the structural validator and the other samples.

    private readonly IValidatorFactory _validatorFactory;
    private readonly IFundRepository _funds;
    private readonly IDealRepository _deals;
    private readonly ICoInvestmentRepository _coInvestments;
    private readonly IExposureRepository _exposures;
    private readonly AppetiteConfig _appetite;

    public CommitmentService(
        IValidatorFactory validatorFactory,
        IFundRepository funds,
        IDealRepository deals,
        ICoInvestmentRepository coInvestments,
        IExposureRepository exposures,
        AppetiteConfig appetite)
    {
        _validatorFactory = validatorFactory;
        _funds = funds;
        _deals = deals;
        _coInvestments = coInvestments;
        _exposures = exposures;
        _appetite = appetite;
    }

    public async Task<CommitmentResult> CommitAsync(CommitCapitalRequest request, CancellationToken cancellationToken = default)
    {
        var result = new CommitmentResult();

        IValidator<CommitCapitalRequest> structural =
            _validatorFactory.GetValidator<CommitCapitalRequest>();
        ValidationResult structuralResult = structural.Validate(request);
        if (!structuralResult.IsValid)
        {
            result.AddErrors(structuralResult.Errors);
            return result;
        }

        FundEntity? fund = await _funds.GetByIdAsync(request.FundId, cancellationToken);
        if (fund is null)
        {
            result.AddError($"Fund {request.FundId} was not found.");
            return result;
        }
        if (fund.Status != FundStatus.Open)
        {
            result.AddError($"Fund {request.FundId} is not open (status {fund.Status}).");
            return result;
        }

        // From here on errors accumulate, so currency, deal, headroom and appetite problems report together.
        if (!fund.PermittedCurrencies.Contains(request.Currency))
        {
            result.AddError(
                $"Currency {request.Currency} is not permitted for fund {request.FundId} " +
                $"(permitted: {string.Join(", ", fund.PermittedCurrencies)}).");
        }

        DealEntity? deal = await _deals.GetByIdAsync(request.DealId, cancellationToken);
        if (deal is null)
        {
            result.AddError($"Deal {request.DealId} was not found.");
        }
        else
        {
            if (deal.Status != DealStatus.Investable)
            {
                result.AddError($"Deal {request.DealId} is not investable (status {deal.Status}).");
            }
            else
            {
                if (request.CommitmentDate < deal.InvestableFrom || request.CommitmentDate > deal.InvestableTo)
                {
                    result.AddError(
                        $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is outside deal window " +
                        $"[{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");
                }

                if (deal.AssetClass != request.AssetClass)
                    result.AddError($"AssetClass {request.AssetClass} does not match deal ({deal.AssetClass}).");
                if (deal.Region != request.Region)
                    result.AddError($"Region {request.Region} does not match deal ({deal.Region}).");
                if (deal.Liquidity != request.Liquidity)
                    result.AddError($"Liquidity {request.Liquidity} does not match deal ({deal.Liquidity}).");
            }
        }

        CoInvestmentEntity? node = await _coInvestments.GetByIdAsync(request.CoInvestmentId, cancellationToken);
        if (node is null)
        {
            result.AddError($"Co-investment node {request.CoInvestmentId} was not found.");
        }
        else if (node.FundId != request.FundId)
        {
            result.AddError(
                $"Co-investment node {request.CoInvestmentId} belongs to fund " +
                $"{node.FundId}, not {request.FundId}.");
        }
        else if (node.Status != CoInvestmentStatus.Active)
        {
            result.AddError($"Co-investment node {request.CoInvestmentId} is not active (status {node.Status}).");
        }
        else if (node.Headroom < request.Amount)
        {
            result.AddError(
                $"Co-investment node {request.CoInvestmentId} has insufficient headroom: " +
                $"{node.Headroom:N0} available, {request.Amount:N0} requested.");
        }

        // Fail closed: a bucket with no configured limit refuses the commitment.
        ExposureEntity exposure = await _exposures.GetByFundAsync(request.FundId, cancellationToken);
        AppetiteLimitConfig? limit = _appetite.FindLimit(request.AssetClass, request.Region);
        if (limit is null)
        {
            result.AddError(
                $"No appetite limit configured for {request.AssetClass}/{request.Region}; " +
                "commitment cannot be made into an un-policied bucket.");
        }
        else
        {
            decimal committed = exposure.CommittedIn(request.AssetClass, request.Region);
            if (committed + request.Amount > limit.MaxAmount)
            {
                result.AddError(
                    $"Appetite breach for {request.AssetClass}/{request.Region}: " +
                    $"committed {committed:N0} + requested {request.Amount:N0} = {committed + request.Amount:N0} " +
                    $"exceeds limit {limit.MaxAmount:N0}.");
            }
        }

        // No real write here; booking only stamps an id.
        if (result.IsSuccess)
            result.MarkBooked($"CMT-{request.FundId}-{request.CoInvestmentId}-{request.CommitmentDate:yyyyMMdd}");

        return result;
    }
}
