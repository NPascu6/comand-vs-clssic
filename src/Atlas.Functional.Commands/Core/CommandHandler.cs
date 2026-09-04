namespace Atlas.Functional.Commands.Core;

public sealed record HandlerOutcome<TResult>(Result<TResult> Result, DecisionTrace Trace)
{
    public bool Approved => Result.IsSuccess;
}

public abstract class CommandHandler<TCommand, TResult>
{
    /// <summary>Order is irrelevant: the rules run concurrently.</summary>
    protected abstract IEnumerable<Rule<TCommand>> Rules(TCommand command);

    /// <summary>Runs only after every rule has approved.</summary>
    protected abstract Task<Result<TResult>> ExecuteAsync(TCommand command, CancellationToken cancellationToken);

    public async Task<HandlerOutcome<TResult>> HandleAsync(
        TCommand command, string? correlationId = null, CancellationToken cancellationToken = default)
    {
        correlationId ??= Guid.NewGuid().ToString("N")[..12];

        var validator = new Validator<TCommand>(Rules(command));
        var (validation, trace) = await validator.ValidateAsync(command, correlationId, cancellationToken);

        if (validation.IsFailure)
            return new HandlerOutcome<TResult>(Result<TResult>.Fail(validation.Errors.ToArray()), trace);

        var executed = await ExecuteAsync(command, cancellationToken);
        return new HandlerOutcome<TResult>(executed, trace);
    }
}
