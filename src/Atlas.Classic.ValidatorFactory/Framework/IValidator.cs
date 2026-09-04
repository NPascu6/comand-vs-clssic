namespace Atlas.Classic.ValidatorFactory;

/// <summary>
/// The core synchronous validator contract. SYNC is the natural shape for a
/// homegrown abstraction — most teams write this signature first and only
/// discover the async problem later, by which point everything implements it.
/// </summary>
public interface IValidator<in T>
{
    ValidationResult Validate(T instance);
}
