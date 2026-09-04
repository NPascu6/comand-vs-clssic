namespace Atlas.Classic.NTier.Validation;

public interface IValidator<in T>
{
    ValidationResult Validate(T instance);
}
