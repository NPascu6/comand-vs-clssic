namespace Atlas.Functional.Commands.Core;

public enum Severity
{
    Error,
    Warning
}

/// <summary>A value, not an exception: errors are collected, returned and serialized.</summary>
public sealed record Error(
    string Code,
    string Message,
    Severity Severity = Severity.Error,
    string? Field = null)
{
    public override string ToString() =>
        Field is null ? $"[{Code}] {Message}" : $"[{Code}] {Field}: {Message}";
}
