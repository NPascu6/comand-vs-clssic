using Atlas.Classic.NTier.Domain;

namespace Atlas.Classic.NTier.Validation;

/// <summary>Structural checks restated against the domain request; the past-date check exists only here, not on the DTO.</summary>
public sealed class CommitCapitalRequestValidator : IValidator<CommitCapitalRequest>
{
    // Fixed reference date so past-date checks are deterministic.
    private static readonly DateOnly Today = new(2026, 6, 13);

    public ValidationResult Validate(CommitCapitalRequest request)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(request.FundId))
            result.AddError("FundId is required.");
        if (string.IsNullOrWhiteSpace(request.CoInvestmentId))
            result.AddError("CoInvestmentId is required.");
        if (string.IsNullOrWhiteSpace(request.DealId))
            result.AddError("DealId is required.");
        if (string.IsNullOrWhiteSpace(request.RequestedBy))
            result.AddError("RequestedBy is required.");
        if (request.Amount <= 0)
            result.AddError("Amount must be greater than zero.");
        if (string.IsNullOrEmpty(request.Currency) || request.Currency.Length != 3)
            result.AddError("Currency must be a 3-letter code.");

        if (request.CommitmentDate < Today)
            result.AddError(
                $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is in the past " +
                $"(today is {Today:yyyy-MM-dd}).");

        return result;
    }
}
