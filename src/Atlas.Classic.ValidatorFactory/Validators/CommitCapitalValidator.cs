namespace Atlas.Classic.ValidatorFactory;

/// <summary>All six rules in one imperative <see cref="Validate"/> method, run top to bottom against a prefetched context.</summary>
public sealed class CommitCapitalValidator : IValidator<CommitCapitalInput>
{
    // Fixed reference date so past-date checks are deterministic.
    private static readonly DateOnly Today = new(2026, 6, 13);

    private readonly CommitCapitalContext _context;

    public CommitCapitalValidator(CommitCapitalContext context) => _context = context;

    public ValidationResult Validate(CommitCapitalInput input)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(input.FundId))
            result.AddError("FundId is required.");
        if (string.IsNullOrWhiteSpace(input.CoInvestmentId))
            result.AddError("CoInvestmentId is required.");
        if (string.IsNullOrWhiteSpace(input.DealId))
            result.AddError("DealId is required.");
        if (string.IsNullOrWhiteSpace(input.RequestedBy))
            result.AddError("RequestedBy is required.");
        if (input.Amount <= 0)
            result.AddError("Amount must be greater than zero.");
        if (string.IsNullOrEmpty(input.Currency) || input.Currency.Length != 3)
            result.AddError("Currency must be a 3-letter code.");
        if (input.CommitmentDate < Today)
            result.AddError($"CommitmentDate {input.CommitmentDate:yyyy-MM-dd} is in the past (today is {Today:yyyy-MM-dd}).");

        // Everything below dereferences context loaded by these ids, so structural failures must stop here.
        if (!result.IsValid)
            return result;

        // EnforceFundOpen throws, so a fund problem can never be reported alongside the later rules.
        try
        {
            EnforceFundOpen(input);
        }
        catch (ValidationException exception)
        {
            result.AddError(exception.Message);
            return result;
        }

        // Fund is non-null here because EnforceFundOpen threw otherwise.
        if (!_context.Fund!.PermittedCurrencies.Contains(input.Currency))
        {
            result.AddError(
                $"Currency {input.Currency} is not permitted for fund {input.FundId} " +
                $"(permitted: {string.Join(", ", _context.Fund!.PermittedCurrencies)}).");
        }

        if (_context.Deal is null)
        {
            result.AddError($"Deal {input.DealId} was not found.");
        }
        else
        {
            var deal = _context.Deal;
            if (deal.Status != DealStatus.Investable)
            {
                result.AddError($"Deal {input.DealId} is not investable (status {deal.Status}).");
            }
            else
            {
                if (input.CommitmentDate < deal.InvestableFrom || input.CommitmentDate > deal.InvestableTo)
                {
                    result.AddError(
                        $"CommitmentDate {input.CommitmentDate:yyyy-MM-dd} is outside deal window " +
                        $"[{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");
                }

                if (deal.AssetClass != input.AssetClass)
                    result.AddError($"AssetClass {input.AssetClass} does not match deal ({deal.AssetClass}).");
                if (deal.Region != input.Region)
                    result.AddError($"Region {input.Region} does not match deal ({deal.Region}).");
                if (deal.Liquidity != input.Liquidity)
                    result.AddError($"Liquidity {input.Liquidity} does not match deal ({deal.Liquidity}).");
            }
        }

        if (_context.Node is null)
        {
            result.AddError($"Co-investment node {input.CoInvestmentId} was not found.");
        }
        else
        {
            var node = _context.Node;
            if (node.FundId != input.FundId)
            {
                result.AddError(
                    $"Co-investment node {input.CoInvestmentId} belongs to fund " +
                    $"{node.FundId}, not {input.FundId}.");
            }
            else if (node.Status != CoInvestmentStatus.Active)
            {
                result.AddError($"Co-investment node {input.CoInvestmentId} is not active (status {node.Status}).");
            }
            else if (node.Headroom < input.Amount)
            {
                result.AddError(
                    $"Co-investment node {input.CoInvestmentId} has insufficient headroom: " +
                    $"{node.Headroom:N0} available, {input.Amount:N0} requested.");
            }
        }

        // Fail closed: a bucket with no configured limit refuses the commitment.
        var limit = _context.Limits.FirstOrDefault(candidate => candidate.AssetClass == input.AssetClass && candidate.Region == input.Region);
        if (limit is null)
        {
            result.AddError(
                $"No appetite limit configured for {input.AssetClass}/{input.Region}; " +
                "commitment cannot be made into an un-policied bucket.");
        }
        else
        {
            var committed = _context.Exposure.CommittedIn(input.AssetClass, input.Region);
            if (committed + input.Amount > limit.MaxAmount)
            {
                result.AddError(
                    $"Appetite breach for {input.AssetClass}/{input.Region}: " +
                    $"committed {committed:N0} + requested {input.Amount:N0} = {committed + input.Amount:N0} " +
                    $"exceeds limit {limit.MaxAmount:N0}.");
            }
        }

        return result;
    }

    private void EnforceFundOpen(CommitCapitalInput input)
    {
        if (_context.Fund is null)
            throw new ValidationException($"Fund {input.FundId} was not found.");

        if (_context.Fund.Status != FundStatus.Open)
            throw new ValidationException(
                $"Fund {input.FundId} is not open (status {_context.Fund.Status}).");
    }
}
