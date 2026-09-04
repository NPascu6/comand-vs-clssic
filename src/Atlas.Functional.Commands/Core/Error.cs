namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// A validation/business error as a first-class VALUE, not an exception.
//
// Errors carry a stable Code (machine-routable, e.g. for the UI or an alert),
// a human Message, a Severity, and the Field they relate to. Because they are
// plain data we can collect them, return them, serialize them, and assert on
// them in tests — none of which is comfortable with exceptions-for-flow.
// ---------------------------------------------------------------------------

public enum Severity
{
    Error,
    Warning
}

public sealed record Error(
    string Code,
    string Message,
    Severity Severity = Severity.Error,
    string? Field = null)
{
    public override string ToString() =>
        Field is null ? $"[{Code}] {Message}" : $"[{Code}] {Field}: {Message}";
}
