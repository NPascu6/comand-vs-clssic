using System.ComponentModel.DataAnnotations;
using Atlas.Upstream.Contracts;

namespace Atlas.Classic.DataAnnotations;

// ---------------------------------------------------------------------------
// The request model for the CommitCapital operation, annotated the classic way.
//
// This is the part of the pattern that DataAnnotations does well: declaring the
// *shape* a payload must have. Everything here is pure and synchronous — no
// upstream call is (or could be) made. Rule 1 ("structural") from the spec maps
// cleanly onto attributes; rules 2-6 do not and live in CommitCapitalService.
//
// Note on style: a real enterprise team would reuse this exact record as the
// ASP.NET Core action parameter, letting model binding + [ApiController]
// auto-validate the shape before the handler ever runs. That is the genuine
// sweet spot for DataAnnotations, and the reason this pattern is so familiar.
// ---------------------------------------------------------------------------

/// <summary>
/// A request to commit capital to a co-investment node within a fund,
/// against a specific deal. Attributes here cover structural validation only.
/// </summary>
public sealed record CommitCapitalRequest
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "FundId is required.")]
    public string FundId { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "CoInvestmentId is required.")]
    public string CoInvestmentId { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "DealId is required.")]
    public string DealId { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false, ErrorMessage = "RequestedBy is required.")]
    public string RequestedBy { get; init; } = string.Empty;

    // [Range] gives us "Amount > 0" declaratively. We use a tiny epsilon as the
    // floor because [Range] is inclusive; the upper bound is decimal.MaxValue so
    // we only constrain positivity here. (A nicer message than the default helps,
    // since the default Range message leaks the raw bound numbers to the user.)
    [Range(typeof(decimal), "0.00000001", "79228162514264337593543950335",
        ErrorMessage = "Amount must be greater than 0.")]
    public decimal Amount { get; init; }

    // A custom attribute keeps the "exactly 3 chars" rule declarative and
    // reusable across every currency-bearing DTO in the codebase.
    [Required(AllowEmptyStrings = false, ErrorMessage = "Currency is required.")]
    [CurrencyCode]
    public string Currency { get; init; } = string.Empty;

    // CommitmentDate must not be in the past. See [NotPastDate] for the awkward
    // part: the attribute cannot be handed a runtime "today", so the rule's
    // reference point has to be baked in or smuggled through ValidationContext.
    [NotPastDate]
    public DateOnly CommitmentDate { get; init; }

    // Enums bind fine and are constrained by the type system; no attribute needed
    // for "is it a valid AssetClass" because an invalid enum can't be constructed
    // here. (Over HTTP you'd add [EnumDataType] to reject out-of-range ints.)
    public AssetClass AssetClass { get; init; }
    public Region Region { get; init; }
    public Liquidity Liquidity { get; init; }
}
