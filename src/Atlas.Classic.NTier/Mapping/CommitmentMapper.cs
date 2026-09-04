using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Repositories.Entities;

namespace Atlas.Classic.NTier.Mapping;

/// <summary>Every cross-shape copy in the feature, written out by hand instead of taking AutoMapper.</summary>
public sealed class CommitmentMapper
{
    // DataAnnotations has already run, but the DTO's string? members still need coalescing for the domain record.
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

    public FundEntity ToEntity(FundSnapshot snapshot) => new()
    {
        FundId = snapshot.FundId,
        Name = snapshot.Name,
        Status = snapshot.Status,
        BaseCurrency = snapshot.BaseCurrency,
        PermittedCurrencies = snapshot.PermittedCurrencies,
    };

    public DealEntity ToEntity(DealSnapshot snapshot) => new()
    {
        DealId = snapshot.DealId,
        Name = snapshot.Name,
        Status = snapshot.Status,
        AssetClass = snapshot.AssetClass,
        Region = snapshot.Region,
        Liquidity = snapshot.Liquidity,
        InvestableFrom = snapshot.InvestableFrom,
        InvestableTo = snapshot.InvestableTo,
        Currency = snapshot.Currency,
    };

    public CoInvestmentEntity ToEntity(CoInvestmentNode node) => new()
    {
        CoInvestmentId = node.CoInvestmentId,
        FundId = node.FundId,
        ParentCoInvestmentId = node.ParentCoInvestmentId,
        Status = node.Status,
        CommitmentCap = node.CommitmentCap,
        AlreadyCommitted = node.AlreadyCommitted,
        Currency = node.Currency,
    };

    public ExposureEntity ToEntity(ExposureSnapshot snapshot) => new()
    {
        FundId = snapshot.FundId,
        TotalCommitted = snapshot.TotalCommitted,
        CommittedByBucket = snapshot.CommittedByBucket,
    };

    public CommitmentResponseDto ToResponse(CommitmentResult result) => new()
    {
        Success = result.IsSuccess,
        StatusCode = result.IsSuccess ? 200 : 422,
        CommitmentId = result.CommitmentId,
        Errors = result.Errors.ToList(),
    };

    /// <summary>Envelope for a DTO rejected at the model boundary, before the service is called.</summary>
    public CommitmentResponseDto ToBadRequest(IEnumerable<string> modelErrors) => new()
    {
        Success = false,
        StatusCode = 400,
        CommitmentId = null,
        Errors = modelErrors.ToList(),
    };
}
