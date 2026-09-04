namespace Atlas.Classic.AdapterChaining;

// ---------------------------------------------------------------------------
// Common base for the gateway adapters.
//
// In the SharePoint-wrapping DMS, every adapter shares the same ceremony:
// resolve the upstream entity by id, and if it isn't there, fail in a uniform
// way. Hoisting that into a base class removes a little duplication and makes the
// layering explicit (facade -> adapter : AdapterBase -> upstream client).
//
// It also quietly sets the tone for the whole design: a validation rule
// ("the fund must exist") is now expressed as a base-class helper that
// THROWS. That is convenient and it is also where the first business rule starts
// living inside an adapter instead of in one obvious rules list.
// ---------------------------------------------------------------------------

/// <summary>
/// Base class for adapters that wrap a single upstream client and project its
/// snapshots into internal domain contexts.
/// </summary>
public abstract class AdapterBase(string upstreamName)
{
    /// <summary>Human label for the wrapped upstream system, used in error text.</summary>
    protected string UpstreamName { get; } = upstreamName;

    /// <summary>
    /// Uniform "must exist" guard. Returns the value when present; otherwise
    /// throws a validation exception. Several rules' "exists" half is enforced
    /// here rather than in the rules themselves — convenient, but it means the
    /// existence checks are physically separate from the rest of each rule.
    /// </summary>
    protected T RequireFound<T>(T? value, string entityKind, string id) where T : class
    {
        if (value is null)
            throw new CommitmentValidationException(
                $"{entityKind} '{id}' was not found in {UpstreamName}.");

        return value;
    }
}
