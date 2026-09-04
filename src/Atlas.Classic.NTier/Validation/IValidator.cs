namespace Atlas.Classic.NTier.Validation;

/// <summary>
/// The synchronous validator contract. SYNC is the shape most teams write first
/// — and here it suffices, because the heavy async upstream work is done by the
/// repositories in the SERVICE before this validator ever runs. So this
/// homegrown validator only ever sees the already-fetched, in-memory request and
/// covers the structural rule. (In the ValidatorFactory sample the same sync
/// signature had to be fed a pre-loaded context; here the service plays that role
/// instead — same tension, relocated.)
/// </summary>
public interface IValidator<in T>
{
    ValidationResult Validate(T instance);
}
