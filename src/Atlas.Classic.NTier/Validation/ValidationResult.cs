namespace Atlas.Classic.NTier.Validation;

// ===========================================================================
// HOMEGROWN VALIDATION LAYER (Validation/).
//
// Sitting ALONGSIDE the DataAnnotations on the DTO, the team also keeps a
// hand-rolled validator abstraction: IValidator<T> + IValidatorFactory +
// ValidatorFactory + concrete validators. Both mechanisms validate the same
// request. Nobody ever deleted one when the other arrived, so structural rules
// are now asserted twice, in two vocabularies — the duplication this sample is
// meant to expose.
// ===========================================================================

/// <summary>
/// The hand-rolled "bool + list of strings" result — distinct from the domain's
/// <see cref="Domain.CommitmentResult"/> and from the response DTO. No per-rule
/// identity, no severity, no codes; just prose.
/// </summary>
public sealed class ValidationResult
{
    private readonly List<string> _errors = new();

    public bool IsValid => _errors.Count == 0;

    public IReadOnlyList<string> Errors => _errors;

    public void AddError(string message) => _errors.Add(message);
}
