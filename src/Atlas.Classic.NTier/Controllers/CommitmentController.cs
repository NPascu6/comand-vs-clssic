using System.ComponentModel.DataAnnotations;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Services;

namespace Atlas.Classic.NTier.Controllers;

/// <summary>Stands in for an ASP.NET controller: binds a DTO, validates it, maps to the domain, delegates, maps back.</summary>
public sealed class CommitmentController
{
    private readonly ICommitmentService _service;
    private readonly CommitmentMapper _mapper;

    public CommitmentController(ICommitmentService service, CommitmentMapper mapper)
    {
        _service = service;
        _mapper = mapper;
    }

    /// <summary>Simulated POST endpoint; a DTO that fails model validation is rejected with a 400 before the service runs.</summary>
    public async Task<CommitmentResponseDto> Submit(CommitCapitalDto dto, CancellationToken cancellationToken = default)
    {
        var validationContext = new ValidationContext(dto);
        var validationResults = new List<ValidationResult>();
        bool isModelValid = Validator.TryValidateObject(
            dto, validationContext, validationResults, validateAllProperties: true);

        if (!isModelValid)
        {
            var modelErrors = validationResults
                .Select(validationResult => validationResult.ErrorMessage ?? "Invalid value.")
                .ToList();
            return _mapper.ToBadRequest(modelErrors);
        }

        CommitCapitalRequest request = _mapper.ToRequest(dto);

        CommitmentResult result = await _service.CommitAsync(request, cancellationToken);

        return _mapper.ToResponse(result);
    }
}
