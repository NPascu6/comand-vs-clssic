using System.ComponentModel.DataAnnotations;

namespace Atlas.Classic.NTier.Dtos;

// ===========================================================================
// REQUEST DTO (Dtos/).
//
// The shape the (simulated) MVC controller binds off the wire. DataAnnotations
// carry the STRUCTURAL rule (rule 1): required ids, a positive amount, a
// 3-letter currency. This is the "free" validation the framework runs for you
// via Validator.TryValidateObject.
//
// Note the duplication baked in from the start: every structural check here is
// ALSO asserted in CommitCapitalRequestValidator (Validation/). Two mechanisms,
// two error vocabularies, one rule — kept in sync by hand. That double-entry is
// not an accident of this sample; it is what happens when a team has both a
// DataAnnotations habit AND a homegrown validator factory and never decides
// which one owns structural validation. The README calls this out.
// ===========================================================================

/// <summary>Inbound wire model for "commit capital". Mutable, parameterless-ctor,
/// attribute-validated — the canonical ASP.NET request DTO.</summary>
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

    // Enums bind fine; DataAnnotations can't easily express "must be a configured
    // bucket", so the business meaning of these lands in the service, not here.
    [Required]
    public AssetClass AssetClass { get; set; }

    [Required]
    public Region Region { get; set; }

    [Required]
    public Liquidity Liquidity { get; set; }

    // DataAnnotations has no "not in the past" attribute out of the box, so the
    // date>=today half of rule 1 CANNOT be expressed here — it is carried by the
    // homegrown validator instead. The structural rule is therefore split across
    // two layers, neither of which owns it fully.
    public DateOnly CommitmentDate { get; set; }
}
