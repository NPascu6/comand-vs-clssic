using System.ComponentModel.DataAnnotations;

namespace Atlas.Classic.DataAnnotations;

// ---------------------------------------------------------------------------
// Custom ValidationAttribute subclasses for the two structural rules that the
// built-in attributes don't cover out of the box. These are the *good* use of
// custom attributes: pure, synchronous, self-contained, no I/O, no services.
// ---------------------------------------------------------------------------

/// <summary>
/// Validates that a string is a plausible ISO-4217 currency code: exactly three
/// characters. (We deliberately keep it to the spec's "length == 3" rule rather
/// than checking against a real currency table — that lookup would be I/O and so
/// belongs in the async service, which is itself part of the point being made.)
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public sealed class CurrencyCodeAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // Let [Required] own the null/empty case so we don't double-report.
        if (value is null)
            return ValidationResult.Success;

        if (value is not string s)
            return new ValidationResult($"{validationContext.DisplayName} must be a string.",
                new[] { validationContext.MemberName ?? nameof(CurrencyCodeAttribute) });

        if (s.Length != 3)
            return new ValidationResult(
                $"Currency must be a 3-letter ISO code (got \"{s}\", length {s.Length}).",
                new[] { validationContext.MemberName ?? "Currency" });

        return ValidationResult.Success;
    }
}

/// <summary>
/// Validates that a <see cref="DateOnly"/> is not in the past.
///
/// HERE IS THE AWKWARDNESS THE PRESENTATION WANTS TO SURFACE:
/// attributes are instantiated by the compiler with compile-time-constant
/// arguments, so we cannot pass a runtime "today" into the constructor. The
/// business rule, however, demands a *deterministic* today of 2026-06-13 (so the
/// demo never breaks as the wall clock advances). We have three bad options:
///
///   1. Hard-code the date as a const string here  -> couples a reusable
///      attribute to one operation's clock, and rots the moment "today" moves on.
///   2. Read DateTime.Today inside IsValid          -> non-deterministic; the
///      same payload validates differently tomorrow; untestable without faking
///      the system clock globally.
///   3. Fish a clock out of ValidationContext.Items -> works, but now the
///      attribute silently depends on the caller having stuffed the right key in,
///      which is exactly the kind of hidden coupling attributes were meant to avoid.
///
/// We implement (3) with a graceful fallback to (1), and call out the smell. None
/// of this would be necessary if the rule lived in plain code that just takes
/// `today` as a parameter — which is precisely how the functional sample does it.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
public sealed class NotPastDateAttribute : ValidationAttribute
{
    /// <summary>Key the caller may place in <see cref="ValidationContext.Items"/> to inject "today".</summary>
    public const string TodayKey = "Today";

    // Fallback baked-in "today" so the attribute still works when used purely
    // declaratively (e.g. ASP.NET model binding never populates Items). This is
    // option (1)'s rot, on display.
    private static readonly DateOnly FallbackToday = new(2026, 6, 13);

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is not DateOnly date)
            return ValidationResult.Success; // wrong type; not our concern

        var today = FallbackToday;
        if (validationContext.Items.TryGetValue(TodayKey, out var injected) && injected is DateOnly d)
            today = d;

        if (date < today)
            return new ValidationResult(
                $"CommitmentDate {date:yyyy-MM-dd} is in the past (today is {today:yyyy-MM-dd}).",
                new[] { validationContext.MemberName ?? "CommitmentDate" });

        return ValidationResult.Success;
    }
}
