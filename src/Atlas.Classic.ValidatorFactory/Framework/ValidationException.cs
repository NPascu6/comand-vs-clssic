namespace Atlas.Classic.ValidatorFactory;

/// <summary>Thrown by <see cref="CommitCapitalValidator"/> to abort validation mid-flight.</summary>
public sealed class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
