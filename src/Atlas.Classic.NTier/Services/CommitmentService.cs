using Atlas.Classic.NTier.Configuration;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Repositories;
using Atlas.Classic.NTier.Repositories.Entities;
using Atlas.Classic.NTier.Validation;

namespace Atlas.Classic.NTier.Services;

// ===========================================================================
// THE GOD SERVICE (Services/).
//
// This is where the N-tier stack's logic actually lives — and where it sprawls.
// One class, six constructor dependencies (validator factory + four repositories
// + appetite config), and one long imperative method that:
//
//   * resolves the structural validator FROM THE FACTORY and runs rule 1;
//   * calls each repository in turn for rules 2-6;
//   * reads appetite limits FROM CONFIG;
//   * applies rules 2-6 as nested if-checks, accumulating errors by hand into a
//     CommitmentResult.
//
// Everything the controller, DTOs, mapper, validator factory, repositories,
// entities and config exist to support converges in this single method. Adding
// a 7th rule means editing it; two devs adding rules in one sprint conflict
// here; there is no per-rule unit to test in isolation — you test "the service".
// That concentration is the natural endpoint of the layered style.
// ===========================================================================
public sealed class CommitmentService : ICommitmentService
{
    // Fixed "today" — matches the homegrown validator and the other samples.
    private static readonly DateOnly Today = new(2026, 6, 13);

    private readonly IValidatorFactory _validatorFactory;
    private readonly IFundRepository _funds;
    private readonly IDealRepository _deals;
    private readonly ICoInvestmentRepository _coInvestments;
    private readonly IExposureRepository _exposures;
    private readonly AppetiteConfig _appetite;

    // Six dependencies for one operation. Each is "just" a seam for testability,
    // but together they are the constructor a new joiner has to understand before
    // they can read the one method below.
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

    public async Task<CommitmentResult> CommitAsync(CommitCapitalRequest request, CancellationToken ct = default)
    {
        var result = new CommitmentResult();

        // -------------------------------------------------------------------
        // RULE 1 — STRUCTURAL, via the homegrown ValidatorFactory.
        //
        // We resolve a validator by type from the factory and run it. This is the
        // SECOND time the structural rule runs for this request — the controller
        // already ran DataAnnotations on the DTO. The duplication is deliberate
        // and intentional in the exhibit: each layer "defends itself", so the same
        // checks fire twice.
        //
        // If structural validation fails we STOP — exactly like scenario C, where
        // the blank RequestedBy / negative Amount / 2-letter Currency / past date
        // are reported and the state checks (draft fund, missing node, closed
        // deal) are never reached. Honest, but a one-error-bucket-at-a-time UX.
        // -------------------------------------------------------------------
        IValidator<CommitCapitalRequest> structural =
            _validatorFactory.GetValidator<CommitCapitalRequest>();
        ValidationResult structuralResult = structural.Validate(request);
        if (!structuralResult.IsValid)
        {
            // Manual aggregation across two result shapes — copy the validator's
            // messages into the domain result by hand.
            result.AddErrors(structuralResult.Errors);
            return result;
        }

        // -------------------------------------------------------------------
        // RULE 2 — Fund exists AND is Open. Repository call #1.
        // We do NOT throw here (unlike the ValidatorFactory sample); we AddError
        // and return, because the later rules dereference the fund.
        // -------------------------------------------------------------------
        FundEntity? fund = await _funds.GetByIdAsync(request.FundId, ct);
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

        // -------------------------------------------------------------------
        // RULE 3 — Currency must be in the fund's permitted list.
        // From here we switch to ACCUMULATING (we do not return), so currency +
        // deal + headroom + appetite problems can all be reported together. The
        // inconsistency with rules 1/2 (which DID return) is exactly the tension
        // the README flags: short-circuit vs aggregate, decided per-rule.
        // -------------------------------------------------------------------
        if (!fund.PermittedCurrencies.Contains(request.Currency))
        {
            result.AddError(
                $"Currency {request.Currency} is not permitted for fund {request.FundId} " +
                $"(permitted: {string.Join(", ", fund.PermittedCurrencies)}).");
        }

        // -------------------------------------------------------------------
        // RULE 4 — Deal exists, is Investable, date in window, classification
        // (AssetClass/Region/Liquidity) matches. Repository call #2. Nested ifs
        // guard each dereference because the entity is nullable.
        // -------------------------------------------------------------------
        DealEntity? deal = await _deals.GetByIdAsync(request.DealId, ct);
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

        // -------------------------------------------------------------------
        // RULE 5 — Co-investment node exists, belongs to this fund, is
        // Active, and has Headroom >= Amount. Repository call #3.
        // This is breach #1 in scenario B (headroom 20M < requested 25M).
        // -------------------------------------------------------------------
        CoInvestmentEntity? node = await _coInvestments.GetByIdAsync(request.CoInvestmentId, ct);
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

        // -------------------------------------------------------------------
        // RULE 6 — Appetite: committed-in-bucket + Amount <= configured limit.
        // Repository call #4 (exposure) + a read from the JSON CONFIG. No limit
        // configured => FAIL (cannot commit into an un-policied bucket).
        // This is breach #2 in scenario B (230M + 25M = 255M > 250M). Because
        // rule 5 used AddError (not return), scenario B reports BOTH breaches.
        // -------------------------------------------------------------------
        ExposureEntity exposure = await _exposures.GetByFundAsync(request.FundId, ct);
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

        // -------------------------------------------------------------------
        // BOOK IT. Only if every accumulated rule passed do we "persist" the
        // commitment and stamp an id. (No real write here — the focus is the
        // validation/orchestration sprawl, not storage.)
        // -------------------------------------------------------------------
        if (result.IsSuccess)
            result.MarkBooked($"CMT-{request.FundId}-{request.CoInvestmentId}-{request.CommitmentDate:yyyyMMdd}");

        return result;
    }
}
