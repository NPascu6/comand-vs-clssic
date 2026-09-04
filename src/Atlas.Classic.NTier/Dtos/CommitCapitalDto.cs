using System.ComponentModel.DataAnnotations;

namespace Atlas.Classic.NTier.Dtos;

/// <summary>Inbound wire model: mutable, parameterless and attribute-validated, as ASP.NET model binding expects.</summary>
public sealed class CommitCapitalDto
{
    [Required(ErrorMessage = "FundId is required.")]
    public string? FundId { get; set; }

    [Required(ErrorMessage = "CoInvestmentId is required.")]
    public string? CoInvestmentId { get; set; }

    [Required(ErrorMessage = "DealId is required.")]
    public string? DealId { get; set; }

    [Required(ErrorMessage = "RequestedBy is required.")]
    public string? RequestedBy { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Currency is required.")]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code.")]
    public string? Currency { get; set; }

    [Required]
    public AssetClass AssetClass { get; set; }

    [Required]
    public Region Region { get; set; }

    [Required]
    public Liquidity Liquidity { get; set; }

    public DateOnly CommitmentDate { get; set; }
}
