namespace Atlas.Classic.ValidatorFactory;

/// <summary>
/// Hand-rolled validator factory + registry. No DI container, no library — just
/// a dictionary keyed by the validated type. This is genuinely useful: callers
/// resolve a validator by T without knowing the concrete class, and you could
/// swap implementations or register per-tenant variants. It is the strongest
/// part of the pattern.
/// </summary>
public interface IValidatorFactory
{
    IValidator<T> GetValidator<T>();
}

/// <summary>
/// Dictionary-backed registry. Validators are registered by their target type;
/// resolution is a typed cast back out. A real system would register these at
/// startup (or via a DI container's keyed services) — here we do it by hand to
/// keep the "no library" promise visible.
/// </summary>
public sealed class ValidatorFactory : IValidatorFactory
{
    private readonly Dictionary<Type, object> _validators = new();

    public ValidatorFactory Register<T>(IValidator<T> validator)
    {
        _validators[typeof(T)] = validator;
        return this;
    }

    public IValidator<T> GetValidator<T>()
    {
        if (_validators.TryGetValue(typeof(T), out var found))
        {
            return (IValidator<T>)found;
        }

        // No registration -> hard failure. Note this is itself an exception used
        // where a Result might be cleaner; but a missing validator is genuinely a
        // programmer error, so throwing here is defensible (unlike the throw
        // inside the validator body).
        throw new InvalidOperationException(
            $"No validator registered for type '{typeof(T).FullName}'.");
    }
}
