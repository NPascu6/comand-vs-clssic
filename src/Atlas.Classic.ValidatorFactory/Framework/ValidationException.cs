namespace Atlas.Classic.ValidatorFactory;

/// <summary>
/// Exception used to abort validation mid-flight. Its very existence is a smell:
/// we are using exceptions for *control flow* inside a method whose whole job is
/// to return a result object. See <see cref="CommitCapitalValidator"/> for the
/// place it is thrown, and the README for why this hurts (it makes one rule's
/// failure swallow every other rule's result, and couples callers to try/catch).
/// </summary>
public sealed class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
