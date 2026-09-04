namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// StructuralValidator: rule 1 (STRUCTURAL).
//
// This is the ONE rule that needs no upstream data, so it can run synchronously
// before any adapter is touched. It is also the one place in this whole sample
// that collects multiple problems and returns them together — because it is the
// only layer not built on validation-as-exception. The contrast with the adapter
// rules (which each throw on the first failure) is the whole point: structural
// gives a full list, the chained business rules give one-at-a-time.
// ---------------------------------------------------------------------------

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
