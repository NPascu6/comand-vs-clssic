namespace Atlas.Classic.AdapterChaining;

/// <summary>Wraps one upstream client and projects its snapshots into internal domain contexts.</summary>
public abstract class AdapterBase(string upstreamName)
{
    /// <summary>Label for the wrapped upstream system, used in error text.</summary>
    protected string UpstreamName { get; } = upstreamName;

    /// <summary>Throws <see cref="CommitmentValidationException"/> when the upstream lookup returned nothing.</summary>
    protected T RequireFound<T>(T? value, string entityKind, string entityId) where T : class
    {
        if (value is null)
            throw new CommitmentValidationException(
                $"{entityKind} '{entityId}' was not found in {UpstreamName}.");

        return value;
    }
}
