namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// A small "strongly-typed configurable property" construct.
//
// This deliberately echoes the heart of the SharePoint-wrapping DMS: documents
// (and libraries) there are described by configurable field definitions, and the
// wrapper exposes them as a typed property bag so callers don't have to know the
// underlying field's internal name or coerce object -> T by hand everywhere.
//
// We reuse the same idea for fund attributes: instead of reading raw
// snapshot fields directly in the orchestration, the FundGateway projects
// the snapshot into a TypedPropertyBag of well-known PropertyDescriptors. It
// looks tidy and "enterprise". It is also, honestly, indirection: the data was
// already strongly typed on the snapshot record, and now there's a second typed
// representation to keep in sync. That drift is exactly the kind of thing that
// accumulates in a wrapper over time.
// ---------------------------------------------------------------------------

/// <summary>
/// Identifies one configurable property and its CLR type. Mirrors a DMS field
/// definition (internal name + data type), minus the SharePoint specifics.
/// </summary>
public sealed class PropertyDescriptor<T>(string key)
{
    public string Key { get; } = key;
    public Type ValueType => typeof(T);
    public override string ToString() => $"{Key}:{typeof(T).Name}";
}

/// <summary>
/// The well-known descriptors a FundContext is built from. In the DMS these
/// would be loaded from a content-type/field configuration; here they are static
/// so the sample stays runnable, but the shape is the same.
/// </summary>
public static class FundProperties
{
    public static readonly PropertyDescriptor<string> DisplayName = new("Fund.DisplayName");
    public static readonly PropertyDescriptor<bool> IsOpen = new("Fund.IsOpen");
    public static readonly PropertyDescriptor<string> BaseCurrency = new("Fund.BaseCurrency");
    public static readonly PropertyDescriptor<IReadOnlyCollection<string>> PermittedCurrencies =
        new("Fund.PermittedCurrencies");
}

/// <summary>
/// A typed property bag. Values go in keyed by a <see cref="PropertyDescriptor{T}"/>
/// and come back out as the right CLR type without the caller casting.
/// </summary>
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

        // The whole point of the construct is to centralise this coercion so it
        // isn't scattered as inline casts. The cost is that a wrong Set<T>/Get<T>
        // pairing only blows up here at runtime, not at compile time.
        return (T)raw!;
    }

    public bool Has<T>(PropertyDescriptor<T> descriptor) => _values.ContainsKey(descriptor.Key);
}
