namespace Atlas.Classic.ValidatorFactory;

public sealed class ValidationResult
{
    private readonly List<string> _errors = new();

    public bool IsValid => _errors.Count == 0;

    public IReadOnlyList<string> Errors => _errors;

    public void AddError(string message) => _errors.Add(message);

    public void Merge(ValidationResult other) => _errors.AddRange(other._errors);

    public static ValidationResult Success() => new();

    public static ValidationResult Fail(string message)
    {
        var result = new ValidationResult();
        result.AddError(message);
        return result;
    }
}
