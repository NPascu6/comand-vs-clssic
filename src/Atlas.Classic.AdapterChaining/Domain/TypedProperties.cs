namespace Atlas.Classic.AdapterChaining;

/// <summary>Identifies one configurable property and its CLR type, like a DMS field definition.</summary>
public sealed class PropertyDescriptor<T>(string key)
{
    public string Key { get; } = key;
    public Type ValueType => typeof(T);
    public override string ToString() => $"{Key}:{typeof(T).Name}";
}

/// <summary>The well-known descriptors a <see cref="FundContext"/> is built from.</summary>
public static class FundProperties
{
    public static readonly PropertyDescriptor<string> DisplayName = new("Fund.DisplayName");
    public static readonly PropertyDescriptor<bool> IsOpen = new("Fund.IsOpen");
    public static readonly PropertyDescriptor<string> BaseCurrency = new("Fund.BaseCurrency");
    public static readonly PropertyDescriptor<IReadOnlyCollection<string>> PermittedCurrencies =
        new("Fund.PermittedCurrencies");
}

/// <summary>Values go in keyed by a descriptor and come back out as that descriptor's CLR type, with no cast at the call site.</summary>
public sealed class TypedPropertyBag
{
    private readonly Dictionary<string, object?> _values = new();

    public TypedPropertyBag Set<T>(PropertyDescriptor<T> descriptor, T value)
    {
        _values[descriptor.Key] = value;
        return this;
    }

    public T Get<T>(PropertyDescriptor<T> descriptor)
    {
        if (!_values.TryGetValue(descriptor.Key, out var raw))
            throw new KeyNotFoundException($"Property '{descriptor.Key}' was not set on the bag.");

        // A mismatched Set<T>/Get<T> pair only fails here, at runtime.
        return (T)raw!;
    }

    public bool Has<T>(PropertyDescriptor<T> descriptor) => _values.ContainsKey(descriptor.Key);
}
