using System.ComponentModel.DataAnnotations;
using Atlas.Upstream.Contracts;

namespace Atlas.Classic.DataAnnotations;

/// <summary>The attributes cover structural validation only; the business rules live in <see cref="CommitCapitalService"/>.</summary>
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

    // [Range] is inclusive, so the floor is an epsilon rather than 0.
    [Range(typeof(decimal), "0.00000001", "79228162514264337593543950335",
        ErrorMessage = "Amount must be greater than 0.")]
    public decimal Amount { get; init; }

    [Required(AllowEmptyStrings = false, ErrorMessage = "Currency is required.")]
    [CurrencyCode]
    public string Currency { get; init; } = string.Empty;

    [NotPastDate]
    public DateOnly CommitmentDate { get; init; }

    public AssetClass AssetClass { get; init; }
    public Region Region { get; init; }
    public Liquidity Liquidity { get; init; }
}
