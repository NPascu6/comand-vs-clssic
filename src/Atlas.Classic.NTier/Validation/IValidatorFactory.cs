namespace Atlas.Classic.NTier.Validation;

/// <summary>
/// The "factory" the service resolves validators from. In a real app this is
/// often backed by the DI container; here it is a tiny dictionary registry, so
/// the indirection is visible: register by type, resolve by type, get back an
/// <see cref="IValidator{T}"/>. For one validator this is pure ceremony — but it
/// is the ceremony the pattern prescribes, and the README counts it as its own
/// layer.
/// </summary>
public interface IValidatorFactory
{
    IValidator<T> GetValidator<T>();
}
