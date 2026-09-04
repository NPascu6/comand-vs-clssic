namespace Atlas.Classic.NTier.Validation;

public interface IValidatorFactory
{
    IValidator<T> GetValidator<T>();
}
