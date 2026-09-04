namespace Atlas.Classic.NTier.Validation;

/// <summary>Dictionary-backed registry; registering the wrong instance under a type surfaces as an <see cref="InvalidCastException"/> at resolve time, not at build time.</summary>
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
        if (!_validators.TryGetValue(typeof(T), out var validator))
            throw new InvalidOperationException(
                $"No validator registered for {typeof(T).Name}. " +
                "Did the composition root forget to Register it?");

        return (IValidator<T>)validator;
    }
}
