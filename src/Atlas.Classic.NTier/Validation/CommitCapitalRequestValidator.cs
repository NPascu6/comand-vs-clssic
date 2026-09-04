using Atlas.Classic.NTier.Domain;

namespace Atlas.Classic.NTier.Validation;

/// <summary>
/// The homegrown structural validator for the domain request. This is RULE 1 —
/// and it is, by design, almost entirely a DUPLICATE of the DataAnnotations on
/// <c>CommitCapitalDto</c>:
///
///   * ids non-empty        — also [Required] on the DTO
///   * Amount &gt; 0        — also [Range] on the DTO
///   * Currency length 3    — also [StringLength(3, Min=3)] on the DTO
///   * CommitmentDate &gt;= today — the ONE structural check DataAnnotations
///     could not express out of the box, so it is ONLY here.
///
/// So the two mechanisms overlap on three checks and each owns one uniquely. A
/// reader cannot tell, without opening both files, where "the structural rule"
/// actually lives — it lives in two places, in two error vocabularies, and they
/// are kept in agreement by hand. That is the duplication this exhibit is about.
///
/// The validator is SYNC and needs no upstream data: rules 2-6 (which DO need
/// I/O) are NOT here — they sprawl in the service instead. So even "validation"
/// is split across two homes: structural here, business in the god service.
/// </summary>
public sealed class CommitCapitalRequestValidator : IValidator<CommitCapitalRequest>
{
    // Fixed "today" so past-date checks are deterministic for the demo — matches
    // the constant in the service and in the other samples.
    private static readonly DateOnly Today = new(2026, 6, 13);

    public ValidationResult Validate(CommitCapitalRequest request)
    {
        var result = new ValidationResult();

        // These aggregate cleanly (no I/O, no ordering hazards) — the same set the
        // DTO's attributes already checked, restated against the domain shape.
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

        // The one structural check DataAnnotations couldn't carry — so it exists
        // ONLY in this homegrown validator, and nowhere on the DTO.
        if (request.CommitmentDate < Today)
            result.AddError(
                $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is in the past " +
                $"(today is {Today:yyyy-MM-dd}).");

        return result;
    }
}
