namespace Atlas.Functional.Commands.Core;

// ---------------------------------------------------------------------------
// Railway-oriented Result types.
//
// Result          -> success, or a SET of errors (validation can fail many ways).
// Result<T>       -> success carrying a value, or a set of errors.
//
// The important move is Result.Combine: it AGGREGATES errors from many checks
// instead of stopping at the first one. That is what lets a fund manager
// see "headroom breached AND appetite breached" in a single response, rather
// than fixing one error only to discover the next on resubmit.
//
// These are ~80 lines of plain C#. There is no library here to be coupled to —
// the team owns this outright.
// ---------------------------------------------------------------------------

public sealed class Result
{
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public IReadOnlyList<Error> Errors { get; }

    private Result(bool isSuccess, IReadOnlyList<Error> errors)
    {
        IsSuccess = isSuccess;
        Errors = errors;
    }

    public static Result Success() => new(true, Array.Empty<Error>());

    public static Result Fail(params Error[] errors) =>
        new(false, errors.Length == 0
            ? new[] { new Error("UNSPECIFIED", "Validation failed") }
            : errors);

    public static Result Fail(IEnumerable<Error> errors) => Fail(errors.ToArray());

    /// <summary>Lift an error straight into a failed result: a rule can just `return error;`</summary>
    public static implicit operator Result(Error error) => Fail(error);

    /// <summary>Collect ALL errors across many results (applicative aggregation).</summary>
    public static Result Combine(IEnumerable<Result> results)
    {
        var all = results.Where(r => r.IsFailure).SelectMany(r => r.Errors).ToArray();
        return all.Length == 0 ? Success() : new Result(false, all);
    }

    public override string ToString() =>
        IsSuccess ? "Success" : $"Failure[{string.Join("; ", Errors)}]";
}

public sealed class Result<T>
{
    private readonly T? _value;

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public IReadOnlyList<Error> Errors { get; }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException(
            "Cannot read Value of a failed result. Errors: " + string.Join("; ", Errors));

    private Result(bool isSuccess, T? value, IReadOnlyList<Error> errors)
    {
        IsSuccess = isSuccess;
        _value = value;
        Errors = errors;
    }

    public static Result<T> Success(T value) => new(true, value, Array.Empty<Error>());

    public static Result<T> Fail(params Error[] errors) =>
        new(false, default, errors.Length == 0
            ? [new Error("UNSPECIFIED", "Operation failed")]
            : errors);

    public static Result<T> Fail(IEnumerable<Error> errors) => Fail(errors.ToArray());

    /// <summary>Lift an error straight into a failed result: `return error;`</summary>
    public static implicit operator Result<T>(Error error) => Fail(error);

    // --- Railway combinators ------------------------------------------------

    public Result<TOut> Map<TOut>(Func<T, TOut> f) =>
        IsSuccess ? Result<TOut>.Success(f(_value!)) : Result<TOut>.Fail(Errors.ToArray());

    public async Task<Result<TOut>> BindAsync<TOut>(Func<T, Task<Result<TOut>>> f) =>
        IsSuccess ? await f(_value!) : Result<TOut>.Fail(Errors.ToArray());

    public Result<T> Tap(Action<T> onSuccess)
    {
        if (IsSuccess) onSuccess(_value!);
        return this;
    }

    public override string ToString() =>
        IsSuccess ? $"Success({_value})" : $"Failure[{string.Join("; ", Errors)}]";
}
