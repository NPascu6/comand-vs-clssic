namespace Atlas.Classic.NTier.Validation;

/// <summary>
/// Dictionary-backed validator registry. Validators are registered by their
/// target type in the composition root and resolved by the service. The cast in
/// <see cref="GetValidator{T}"/> is unchecked-by-the-compiler: register the wrong
/// instance under a type and you get an <see cref="InvalidCastException"/> at
/// runtime, not a build error. That is the price of a stringly-/typely-keyed
/// registry hand-rolled instead of using the container's generic resolution.
/// </summary>
public sealed class ValidatorFactory : IValidatorFactory
{
    private readonly Dictionary<Type, object> _validators = new();

    /// <summary>Register a validator instance for type <typeparamref name="T"/>. Fluent for terse wiring.</summary>
    public ValidatorFactory Register<T>(IValidator<T> validator)
    {
        _validators[typeof(T)] = validator;
        return this;
    }

    public IValidator<T> GetValidator<T>()
    {
        if (!_validators.TryGetValue(typeof(T), out var validator))
            throw new InvalidOperationException(
                $"No validator registered for {typeof(T).Name}. " +
                "Did the composition root forget to Register it?");

        return (IValidator<T>)validator;
    }
}
