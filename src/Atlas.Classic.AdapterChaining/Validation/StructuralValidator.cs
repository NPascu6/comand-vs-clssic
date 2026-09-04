namespace Atlas.Classic.AdapterChaining;

public static class StructuralValidator
{
    public static IReadOnlyList<string> Validate(CommitCapitalRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.FundId))
            errors.Add("FundId is required.");
        if (string.IsNullOrWhiteSpace(request.CoInvestmentId))
            errors.Add("CoInvestmentId is required.");
        if (string.IsNullOrWhiteSpace(request.DealId))
            errors.Add("DealId is required.");
        if (string.IsNullOrWhiteSpace(request.RequestedBy))
            errors.Add("RequestedBy is required.");

        if (request.Amount <= 0m)
            errors.Add("Amount must be greater than 0.");

        if (request.Currency.Length != 3)
            errors.Add("Currency must be a 3-letter ISO code.");

        if (request.CommitmentDate < CommitmentClock.Today)
            errors.Add(
                $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is in the past " +
                $"(today is {CommitmentClock.Today:yyyy-MM-dd}).");

        return errors;
    }
}
