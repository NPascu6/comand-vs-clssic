using System.ComponentModel.DataAnnotations;
using Atlas.Upstream.Contracts;

namespace Atlas.Classic.DataAnnotations;

public sealed record CommitResult(bool IsValid, IReadOnlyList<string> Errors)
{
    public static CommitResult Valid() => new(true, Array.Empty<string>());
    public static CommitResult Invalid(IReadOnlyList<string> errors) => new(false, errors);
}

/// <summary>Structural validation through DataAnnotations, then business validation as awaited checks against the upstream clients.</summary>
public sealed class CommitCapitalService
{
    private readonly IUpstream _upstream;

    // Fixed reference date so past-date checks are deterministic.
    private static readonly DateOnly Today = new(2026, 6, 13);

    public CommitCapitalService(IUpstream upstream) => _upstream = upstream;

    /// <summary>Collects every violation, shape and business alike, rather than stopping at the first.</summary>
    public async Task<CommitResult> ValidateAndCommitAsync(
        CommitCapitalRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();

        RunStructuralValidation(request, errors);

        await RunBusinessValidationAsync(request, errors, cancellationToken);

        if (errors.Count > 0)
            return CommitResult.Invalid(errors);

        // The in-memory upstream is read-only, so a valid request only signals success.
        return CommitResult.Valid();
    }

    private static void RunStructuralValidation(CommitCapitalRequest request, List<string> errors)
    {
        // NotPastDateAttribute reads "today" from Items; it cannot take a runtime value in its constructor.
        var context = new ValidationContext(request)
        {
            Items = { [NotPastDateAttribute.TodayKey] = Today },
        };
        var results = new List<ValidationResult>();

        // Without validateAllProperties only [Required] runs; [Range] and the custom attributes are skipped.
        Validator.TryValidateObject(request, context, results, validateAllProperties: true);

        foreach (var validationResult in results)
            if (!string.IsNullOrWhiteSpace(validationResult.ErrorMessage))
                errors.Add(validationResult.ErrorMessage);
    }

    private async Task RunBusinessValidationAsync(
        CommitCapitalRequest request, List<string> errors, CancellationToken cancellationToken)
    {
        var fund = await _upstream.Funds.GetFundAsync(request.FundId, cancellationToken);

        if (fund is null)
        {
            errors.Add($"Fund '{request.FundId}' was not found.");
        }
        else if (fund.Status != FundStatus.Open)
        {
            errors.Add($"Fund '{request.FundId}' is not open (status: {fund.Status}).");
        }

        if (fund is not null &&
            !fund.PermittedCurrencies.Contains(request.Currency))
        {
            errors.Add(
                $"Currency '{request.Currency}' is not permitted for fund " +
                $"'{request.FundId}' (permitted: {string.Join(", ", fund.PermittedCurrencies)}).");
        }

        var deal = await _upstream.Deals.GetDealAsync(request.DealId, cancellationToken);
        if (deal is null)
        {
            errors.Add($"Deal '{request.DealId}' was not found.");
        }
        else
        {
            if (deal.Status != DealStatus.Investable)
                errors.Add($"Deal '{request.DealId}' is not investable (status: {deal.Status}).");

            if (request.CommitmentDate < deal.InvestableFrom || request.CommitmentDate > deal.InvestableTo)
                errors.Add(
                    $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is outside deal " +
                    $"'{request.DealId}' investable window " +
                    $"[{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");

            if (request.AssetClass != deal.AssetClass)
                errors.Add($"AssetClass {request.AssetClass} does not match deal '{request.DealId}' ({deal.AssetClass}).");
            if (request.Region != deal.Region)
                errors.Add($"Region {request.Region} does not match deal '{request.DealId}' ({deal.Region}).");
            if (request.Liquidity != deal.Liquidity)
                errors.Add($"Liquidity {request.Liquidity} does not match deal '{request.DealId}' ({deal.Liquidity}).");
        }

        var node = await _upstream.CoInvestments.GetNodeAsync(request.CoInvestmentId, cancellationToken);
        if (node is null)
        {
            errors.Add($"Co-investment '{request.CoInvestmentId}' was not found.");
        }
        else
        {
            if (node.FundId != request.FundId)
                errors.Add(
                    $"Co-investment '{request.CoInvestmentId}' belongs to fund " +
                    $"'{node.FundId}', not '{request.FundId}'.");

            if (node.Status != CoInvestmentStatus.Active)
                errors.Add($"Co-investment '{request.CoInvestmentId}' is not active (status: {node.Status}).");

            if (node.Headroom < request.Amount)
                errors.Add(
                    $"Co-investment '{request.CoInvestmentId}' has insufficient headroom: " +
                    $"requested {Money(request.Amount)} but only {Money(node.Headroom)} available.");
        }

        // Deny by default: a bucket with no configured limit fails.
        var limits = await _upstream.Appetite.GetLimitsAsync(request.FundId, cancellationToken);
        var limit = limits.FirstOrDefault(candidate => candidate.AssetClass == request.AssetClass && candidate.Region == request.Region);
        if (limit is null)
        {
            errors.Add(
                $"No appetite configured for bucket {Buckets.Key(request.AssetClass, request.Region)} " +
                $"on fund '{request.FundId}' — denied by default.");
        }
        else
        {
            var exposure = await _upstream.Exposure.GetExposureAsync(request.FundId, cancellationToken);
            var current = exposure.CommittedIn(request.AssetClass, request.Region);
            var projected = current + request.Amount;
            if (projected > limit.MaxAmount)
                errors.Add(
                    $"Appetite breach for bucket {limit.Bucket}: current {Money(current)} + " +
                    $"requested {Money(request.Amount)} = {Money(projected)} exceeds limit {Money(limit.MaxAmount)}.");
        }
    }

    private static string Money(decimal amount)
    {
        if (Math.Abs(amount) >= 1_000_000m)
            return $"{amount / 1_000_000m:0.###}M";
        return amount.ToString("0.##");
    }
}
