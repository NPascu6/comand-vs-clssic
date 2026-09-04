using System.ComponentModel.DataAnnotations;
using Atlas.Classic.NTier.Domain;
using Atlas.Classic.NTier.Dtos;
using Atlas.Classic.NTier.Mapping;
using Atlas.Classic.NTier.Services;

namespace Atlas.Classic.NTier.Controllers;

// ===========================================================================
// CONTROLLER (Controllers/).
//
// A plain class standing in for an ASP.NET MVC/Web API controller — no web host,
// so the demo stays a console app, but the SHAPE is the real thing: bind a DTO,
// run model validation, map to the domain, delegate to a service, map the result
// back to a response DTO, return an HTTP-ish envelope.
//
// Even this thin controller does FOUR jobs (validate / map-in / delegate /
// map-out). The validate step here (DataAnnotations) is the FIRST of the two
// structural passes — the service runs the homegrown validator again.
// ===========================================================================
public sealed class CommitmentController
{
    private readonly ICommitmentService _service;
    private readonly CommitmentMapper _mapper;

    public CommitmentController(ICommitmentService service, CommitmentMapper mapper)
    {
        _service = service;
        _mapper = mapper;
    }

    /// <summary>
    /// Simulated POST endpoint. Returns a response DTO carrying success, an
    /// HTTP-ish status, the commitment id and any errors.
    /// </summary>
    public async Task<CommitmentResponseDto> Submit(CommitCapitalDto dto, CancellationToken ct = default)
    {
        // -------------------------------------------------------------------
        // STEP 1 — MODEL VALIDATION (DataAnnotations).
        // What ASP.NET would do as ModelState before the action body runs; here
        // we do it by hand with Validator.TryValidateObject. This is structural
        // rule 1, pass #1. If it fails we shape a 400 and NEVER reach the service
        // (so the homegrown validator's pass #2 doesn't even run for bad DTOs).
        // -------------------------------------------------------------------
        var validationContext = new ValidationContext(dto);
        var validationResults = new List<ValidationResult>();
        bool isModelValid = Validator.TryValidateObject(
            dto, validationContext, validationResults, validateAllProperties: true);

        if (!isModelValid)
        {
            var modelErrors = validationResults
                .Select(r => r.ErrorMessage ?? "Invalid value.")
                .ToList();
            return _mapper.ToBadRequest(modelErrors);
        }

        // -------------------------------------------------------------------
        // STEP 2 — MAP the wire DTO into the domain request (hand-rolled mapper).
        // -------------------------------------------------------------------
        CommitCapitalRequest request = _mapper.ToRequest(dto);

        // -------------------------------------------------------------------
        // STEP 3 — DELEGATE to the service (where rules 1-6 actually run).
        // -------------------------------------------------------------------
        CommitmentResult result = await _service.CommitAsync(request, ct);

        // -------------------------------------------------------------------
        // STEP 4 — MAP the domain result into the outbound response DTO.
        // -------------------------------------------------------------------
        return _mapper.ToResponse(result);
    }
}
