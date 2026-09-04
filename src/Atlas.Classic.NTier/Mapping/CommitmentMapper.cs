using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Mapping;

// ===========================================================================
// HAND-ROLLED MAPPER (Mapping/).
//
// The team has decided NOT to take AutoMapper (one less dependency to audit,
// no "magic" reflection, mappings you can step through in a debugger). The
// consequence is THIS file: every cross-shape copy in the feature, written out
// field by field, by hand. It is all mechanical and all load-bearing — get one
// assignment wrong and a field silently travels as default(T).
//
// Count what one feature needs:
//   1. DTO            -> domain request   (ToRequest)
//   2. FundSnapshot   -> FundEntity     (ToEntity)
//   3. DealSnapshot        -> DealEntity          (ToEntity)
//   4. CoInvestmentNode    -> CoInvestmentEntity  (ToEntity)
//   5. ExposureSnapshot    -> ExposureEntity      (ToEntity)
//   6. domain result  -> response DTO    (ToResponse)
//
// Six mappings, ~40 property assignments, for ONE operation. This is the
// "mapping boilerplate" the README counts, and it is exactly the cost a team
// pays for the per-tier-owns-its-shape discipline.
// ===========================================================================
public sealed class CommitmentMapper
{
    // -----------------------------------------------------------------------
    // (1) Inbound: wire DTO -> domain request.
    //
    // By the time we get here DataAnnotations has run, so the [Required] string
    // fields are non-null in practice — but the DTO TYPE still says string?, so
    // we must coalesce every one to keep the non-nullable domain record happy.
    // That "!"-or-"?? string.Empty" noise on every field is the nullable-shape
    // mismatch tax between the two models.
    // -----------------------------------------------------------------------
    public CommitCapitalRequest ToRequest(CommitCapitalDto dto) => new(
        FundId: dto.FundId ?? string.Empty,
        CoInvestmentId: dto.CoInvestmentId ?? string.Empty,
        DealId: dto.DealId ?? string.Empty,
        RequestedBy: dto.RequestedBy ?? string.Empty,
        Amount: dto.Amount,
        Currency: dto.Currency ?? string.Empty,
        AssetClass: dto.AssetClass,
        Region: dto.Region,
        Liquidity: dto.Liquidity,
        CommitmentDate: dto.CommitmentDate);

    // -----------------------------------------------------------------------
    // (2) FundSnapshot -> FundEntity. Field-for-field. If a sixth
    // fund field is ever added upstream it must be added to the snapshot,
    // the entity, AND here, or it never reaches the service.
    // -----------------------------------------------------------------------
    public FundEntity ToEntity(FundSnapshot s) => new()
    {
        FundId = s.FundId,
        Name = s.Name,
        Status = s.Status,
        BaseCurrency = s.BaseCurrency,
        PermittedCurrencies = s.PermittedCurrencies,
    };

    // -----------------------------------------------------------------------
    // (3) DealSnapshot -> DealEntity. Nine assignments; the date window and the
    // three classification fields all have to be copied across by hand.
    // -----------------------------------------------------------------------
    public DealEntity ToEntity(DealSnapshot s) => new()
    {
        DealId = s.DealId,
        Name = s.Name,
        Status = s.Status,
        AssetClass = s.AssetClass,
        Region = s.Region,
        Liquidity = s.Liquidity,
        InvestableFrom = s.InvestableFrom,
        InvestableTo = s.InvestableTo,
        Currency = s.Currency,
    };

    // -----------------------------------------------------------------------
    // (4) CoInvestmentNode -> CoInvestmentEntity. We copy the raw cap/committed
    // fields; Headroom is re-derived on the entity, so the SAME computation now
    // exists on both the snapshot and the entity.
    // -----------------------------------------------------------------------
    public CoInvestmentEntity ToEntity(CoInvestmentNode n) => new()
    {
        CoInvestmentId = n.CoInvestmentId,
        FundId = n.FundId,
        ParentCoInvestmentId = n.ParentCoInvestmentId,
        Status = n.Status,
        CommitmentCap = n.CommitmentCap,
        AlreadyCommitted = n.AlreadyCommitted,
        Currency = n.Currency,
    };

    // -----------------------------------------------------------------------
    // (5) ExposureSnapshot -> ExposureEntity. The bucket dictionary is passed
    // by reference; CommittedIn is re-implemented on the entity (with its own
    // private copy of the bucket-key format).
    // -----------------------------------------------------------------------
    public ExposureEntity ToEntity(ExposureSnapshot s) => new()
    {
        FundId = s.FundId,
        TotalCommitted = s.TotalCommitted,
        CommittedByBucket = s.CommittedByBucket,
    };

    // -----------------------------------------------------------------------
    // (6) Outbound: domain result -> response DTO. Picks an HTTP-ish status from
    // the success flag and copies the error prose across into the third and final
    // result shape.
    // -----------------------------------------------------------------------
    public CommitmentResponseDto ToResponse(CommitmentResult result) => new()
    {
        Success = result.IsSuccess,
        StatusCode = result.IsSuccess ? 200 : 422, // 422 Unprocessable Entity
        CommitmentId = result.CommitmentId,
        Errors = result.Errors.ToList(),
    };

    /// <summary>
    /// Outbound for the case where the controller rejects the DTO at the model
    /// boundary (DataAnnotations failed) and never calls the service. A 400-shaped
    /// envelope built directly from the framework's validation messages.
    /// </summary>
    public CommitmentResponseDto ToBadRequest(IEnumerable<string> modelErrors) => new()
    {
        Success = false,
        StatusCode = 400, // 400 Bad Request
        CommitmentId = null,
        Errors = modelErrors.ToList(),
    };
}
