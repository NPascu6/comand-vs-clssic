namespace Atlas.Functional.Commands.Core;

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

    /// <summary>A rule can just `return error;`.</summary>
    public static implicit operator Result(Error error) => Fail(error);

    /// <summary>Aggregates every error; never stops at the first.</summary>
    public static Result Combine(IEnumerable<Result> results)
    {
        var all = results.Where(result => result.IsFailure).SelectMany(result => result.Errors).ToArray();
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

    /// <summary>A rule can just `return error;`.</summary>
    public static implicit operator Result<T>(Error error) => Fail(error);

    public Result<TOut> Map<TOut>(Func<T, TOut> selector) =>
        IsSuccess ? Result<TOut>.Success(selector(_value!)) : Result<TOut>.Fail(Errors.ToArray());

    public async Task<Result<TOut>> BindAsync<TOut>(Func<T, Task<Result<TOut>>> next) =>
        IsSuccess ? await next(_value!) : Result<TOut>.Fail(Errors.ToArray());

    public Result<T> Tap(Action<T> onSuccess)
    {
        if (IsSuccess) onSuccess(_value!);
        return this;
    }

    public override string ToString() =>
        IsSuccess ? $"Success({_value})" : $"Failure[{string.Join("; ", Errors)}]";
}
