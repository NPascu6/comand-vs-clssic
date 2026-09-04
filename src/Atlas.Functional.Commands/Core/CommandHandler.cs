namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// The command pipeline, in one place: validate -> (if approved) execute.
//
// A concrete handler only has to answer two questions:
//   - Rules:   which named rules govern this command?
//   - Execute: what do we do once every rule has approved?
//
// Everything else — running the rules, aggregating errors, building the audit
// trace, short-circuiting execution on failure — lives here and is shared. A
// handler therefore contains business logic and almost no plumbing, which is
// the whole point: spend your attention on the domain, not on chaining.
// ---------------------------------------------------------------------------

/// <summary>The full outcome of handling a command: the typed result plus the audit trace.</summary>
public sealed record HandlerOutcome<TResult>(Result<TResult> Result, DecisionTrace Trace)
{
    public bool Approved => Result.IsSuccess;
}

public abstract class CommandHandler<TCommand, TResult>
{
    /// <summary>The rules that govern this command. Order is irrelevant — they run concurrently.</summary>
    protected abstract IEnumerable<Rule<TCommand>> Rules(TCommand command);

    /// <summary>Runs only after every rule has approved. This is where the business action happens.</summary>
    protected abstract Task<Result<TResult>> ExecuteAsync(TCommand command, CancellationToken ct);

    public async Task<HandlerOutcome<TResult>> HandleAsync(
        TCommand command, string? correlationId = null, CancellationToken ct = default)
    {
        correlationId ??= Guid.NewGuid().ToString("N")[..12];

        var validator = new Validator<TCommand>(Rules(command));
        var (validation, trace) = await validator.ValidateAsync(command, correlationId, ct);

        if (validation.IsFailure)
            return new HandlerOutcome<TResult>(Result<TResult>.Fail(validation.Errors.ToArray()), trace);

        var executed = await ExecuteAsync(command, ct);
        return new HandlerOutcome<TResult>(executed, trace);
    }
}
