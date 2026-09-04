namespace Atlas.Classic.ValidatorFactory;

public interface IValidatorFactory
{
    IValidator<T> GetValidator<T>();
}

/// <summary>Dictionary-backed registry keyed by the validated type; resolution is a typed cast back out.</summary>
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

        // A missing registration is a programmer error, so throwing here is appropriate.
        throw new InvalidOperationException(
            $"No validator registered for type '{typeof(T).FullName}'.");
    }
}
