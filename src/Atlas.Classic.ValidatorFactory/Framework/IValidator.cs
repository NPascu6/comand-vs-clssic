namespace Atlas.Classic.ValidatorFactory;

public interface IValidator<in T>
{
    ValidationResult Validate(T instance);
}
