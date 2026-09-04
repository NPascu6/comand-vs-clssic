using System.ComponentModel.DataAnnotations;

namespace Atlas.Classic.DataAnnotations;

/// <summary>Exactly three characters; a lookup against a real currency table would be I/O and belongs in the async service.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public sealed class CurrencyCodeAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // [Required] owns the null case, so it is not reported twice.
        if (value is null)
            return ValidationResult.Success;

        if (value is not string code)
            return new ValidationResult($"{validationContext.DisplayName} must be a string.",
                new[] { validationContext.MemberName ?? nameof(CurrencyCodeAttribute) });

        if (code.Length != 3)
            return new ValidationResult(
                $"Currency must be a 3-letter ISO code (got \"{code}\", length {code.Length}).",
                new[] { validationContext.MemberName ?? "Currency" });

        return ValidationResult.Success;
    }
}

/// <summary>Rejects dates before "today", read from <see cref="ValidationContext.Items"/> because attribute arguments must be compile-time constants.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public sealed class NotPastDateAttribute : ValidationAttribute
{
    /// <summary>Key the caller may place in <see cref="ValidationContext.Items"/> to inject "today".</summary>
    public const string TodayKey = "Today";

    // Model binding never populates Items, so a baked-in date keeps the attribute usable declaratively.
    private static readonly DateOnly FallbackToday = new(2026, 6, 13);

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not DateOnly date)
            return ValidationResult.Success;

        var today = FallbackToday;
        if (validationContext.Items.TryGetValue(TodayKey, out var injected) && injected is DateOnly injectedToday)
            today = injectedToday;

        if (date < today)
            return new ValidationResult(
                $"CommitmentDate {date:yyyy-MM-dd} is in the past (today is {today:yyyy-MM-dd}).",
                new[] { validationContext.MemberName ?? "CommitmentDate" });

        return ValidationResult.Success;
    }
}
