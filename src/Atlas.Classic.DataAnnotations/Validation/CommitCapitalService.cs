using System.ComponentModel.DataAnnotations;
using Atlas.Upstream.Contracts;

namespace Atlas.Classic.DataAnnotations;

/// <summary>Outcome of a commit attempt: valid or not, plus a flat list of error strings.</summary>
public sealed record CommitResult(bool IsValid, IReadOnlyList<string> Errors)
{
    public static CommitResult Valid() => new(true, Array.Empty<string>());
    public static CommitResult Invalid(IReadOnlyList<string> errors) => new(false, errors);
}

/// <summary>
/// The classic enterprise service: structural validation via DataAnnotations,
/// then business validation as a hand-written sequence of async <c>if</c> checks
/// against the upstream clients.
///
/// THE WHOLE POINT, RESTATED IN CODE:
/// DataAnnotations / IValidatableObject are synchronous. Every business rule that
/// matters (fund open? deal investable? headroom? appetite?) needs awaited
/// upstream I/O, so NONE of them can live in an attribute. The result is the
/// split you see below — a declarative shape layer plus an imperative service
/// layer — and the validation story for one operation is now told in two places.
/// </summary>
public sealed class CommitCapitalService
{
    private readonly IUpstream _upstream;

    // Deterministic "today" for past-date checks. We pass this *into* the shape
    // validation via ValidationContext.Items (see RunStructuralValidation) — the
    // very workaround [NotPastDate] is forced to rely on. In plain code, "today"
    // is just a parameter; in the attribute world it has to be smuggled.
    private static readonly DateOnly Today = new(2026, 6, 13);

    public CommitCapitalService(IUpstream upstream) => _upstream = upstream;

    /// <summary>
    /// Validate the request (shape first, then business rules) and "commit" if valid.
    ///
    /// Error-collection policy: we ACCUMULATE all violations rather than bailing on
    /// the first one. Tradeoff:
    ///   + a fund manager sees every problem at once (Scenario B is designed to
    ///     prove this matters: headroom AND appetite breach together), instead of
    ///     fixing one, resubmitting, and discovering the next.
    ///   - it costs more upstream round-trips per attempt, and the checks have data
    ///     dependencies (you can't sensibly test appetite for a fund that
    ///     doesn't exist), so we still SHORT-CIRCUIT *within* a rule and skip rules
    ///     whose preconditions failed. That conditional skipping is itself a smell:
    ///     the dependency graph between rules is implicit in the order of ifs.
    /// </summary>
    public async Task<CommitResult> ValidateAndCommitAsync(
        CommitCapitalRequest request, CancellationToken ct = default)
    {
        var errors = new List<string>();

        // ---- Rule 1: STRUCTURAL (synchronous, via DataAnnotations) -----------
        // This is all the attributes can do. It returns immediately; no I/O.
        RunStructuralValidation(request, errors);

        // ---- Rules 2-6: BUSINESS (asynchronous, hand-rolled if-chain) --------
        // These cannot be expressed as attributes because each one awaits upstream.
        await RunBusinessValidationAsync(request, errors, ct);

        if (errors.Count > 0)
            return CommitResult.Invalid(errors);

        // ---- The actual side effect would happen here ------------------------
        // e.g. await _upstream.CoInvestments.RecordCommitmentAsync(...). The
        // in-memory upstream is read-only, so we just signal success.
        return CommitResult.Valid();
    }

    /// <summary>
    /// Rule 1. Runs the attribute-based shape validation with <see cref="Validator"/>.
    /// We inject the deterministic "today" through <see cref="ValidationContext.Items"/>
    /// so <see cref="NotPastDateAttribute"/> can reach it — the awkward handshake the
    /// attribute is forced into because it can't take a runtime value in its ctor.
    /// </summary>
    private static void RunStructuralValidation(CommitCapitalRequest request, List<string> errors)
    {
        var context = new ValidationContext(request)
        {
            Items = { [NotPastDateAttribute.TodayKey] = Today },
        };
        var results = new List<ValidationResult>();

        // validateAllProperties: true -> evaluate every property's attributes,
        // not just [Required]. Without this flag, [Range]/[CurrencyCode]/etc. are skipped.
        Validator.TryValidateObject(request, context, results, validateAllProperties: true);

        foreach (var r in results)
            if (!string.IsNullOrWhiteSpace(r.ErrorMessage))
                errors.Add(r.ErrorMessage);
    }

    /// <summary>
    /// Rules 2-6, as imperative async checks. Each rule:
    ///   - short-circuits internally once it knows it failed,
    ///   - is skipped if a precondition it depends on (e.g. "fund exists")
    ///     already failed, to avoid noise and pointless upstream calls.
    /// The cost: the business rules are interleaved with control flow and I/O,
    /// so unit-testing one rule in isolation means standing up the whole service
    /// and faking every client — there are no first-class "rule" objects to test.
    /// </summary>
    private async Task RunBusinessValidationAsync(
        CommitCapitalRequest request, List<string> errors, CancellationToken ct)
    {
        // We need the fund for rules 2 and 3; fetch once and reuse.
        var fund = await _upstream.Funds.GetFundAsync(request.FundId, ct);

        // ---- Rule 2: FundOpen ------------------------------------------
        if (fund is null)
        {
            errors.Add($"Fund '{request.FundId}' was not found.");
        }
        else if (fund.Status != FundStatus.Open)
        {
            errors.Add($"Fund '{request.FundId}' is not open (status: {fund.Status}).");
        }

        // ---- Rule 3: CurrencyPermitted --------------------------------------
        // Depends on the fund existing; skip otherwise. Note we only check
        // membership here — the "length == 3" shape check already ran in Rule 1.
        if (fund is not null &&
            !fund.PermittedCurrencies.Contains(request.Currency))
        {
            errors.Add(
                $"Currency '{request.Currency}' is not permitted for fund " +
                $"'{request.FundId}' (permitted: {string.Join(", ", fund.PermittedCurrencies)}).");
        }

        // ---- Rule 4: DealInvestable -----------------------------------------
        var deal = await _upstream.Deals.GetDealAsync(request.DealId, ct);
        if (deal is null)
        {
            errors.Add($"Deal '{request.DealId}' was not found.");
        }
        else
        {
            if (deal.Status != DealStatus.Investable)
                errors.Add($"Deal '{request.DealId}' is not investable (status: {deal.Status}).");

            if (request.CommitmentDate < deal.InvestableFrom || request.CommitmentDate > deal.InvestableTo)
                errors.Add(
                    $"CommitmentDate {request.CommitmentDate:yyyy-MM-dd} is outside deal " +
                    $"'{request.DealId}' investable window " +
                    $"[{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");

            // The request must describe the same instrument as the deal it targets.
            if (request.AssetClass != deal.AssetClass)
                errors.Add($"AssetClass {request.AssetClass} does not match deal '{request.DealId}' ({deal.AssetClass}).");
            if (request.Region != deal.Region)
                errors.Add($"Region {request.Region} does not match deal '{request.DealId}' ({deal.Region}).");
            if (request.Liquidity != deal.Liquidity)
                errors.Add($"Liquidity {request.Liquidity} does not match deal '{request.DealId}' ({deal.Liquidity}).");
        }

        // ---- Rule 5: CoInvestmentHeadroom -----------------------------------
        var node = await _upstream.CoInvestments.GetNodeAsync(request.CoInvestmentId, ct);
        if (node is null)
        {
            errors.Add($"Co-investment '{request.CoInvestmentId}' was not found.");
        }
        else
        {
            if (node.FundId != request.FundId)
                errors.Add(
                    $"Co-investment '{request.CoInvestmentId}' belongs to fund " +
                    $"'{node.FundId}', not '{request.FundId}'.");

            if (node.Status != CoInvestmentStatus.Active)
                errors.Add($"Co-investment '{request.CoInvestmentId}' is not active (status: {node.Status}).");

            if (node.Headroom < request.Amount)
                errors.Add(
                    $"Co-investment '{request.CoInvestmentId}' has insufficient headroom: " +
                    $"requested {Money(request.Amount)} but only {Money(node.Headroom)} available.");
        }

        // ---- Rule 6: AppetiteWithinLimit ------------------------------------
        // Deny-by-default: if no limit is configured for this bucket, it fails.
        // Needs both the appetite policy and the current exposure -> two calls.
        var limits = await _upstream.Appetite.GetLimitsAsync(request.FundId, ct);
        var limit = limits.FirstOrDefault(l => l.AssetClass == request.AssetClass && l.Region == request.Region);
        if (limit is null)
        {
            errors.Add(
                $"No appetite configured for bucket {Buckets.Key(request.AssetClass, request.Region)} " +
                $"on fund '{request.FundId}' — denied by default.");
        }
        else
        {
            var exposure = await _upstream.Exposure.GetExposureAsync(request.FundId, ct);
            var current = exposure.CommittedIn(request.AssetClass, request.Region);
            var projected = current + request.Amount;
            if (projected > limit.MaxAmount)
                errors.Add(
                    $"Appetite breach for bucket {limit.Bucket}: current {Money(current)} + " +
                    $"requested {Money(request.Amount)} = {Money(projected)} exceeds limit {Money(limit.MaxAmount)}.");
        }
    }

    /// <summary>Compact money formatting for readable error messages (e.g. 25M).</summary>
    private static string Money(decimal amount)
    {
        if (Math.Abs(amount) >= 1_000_000m)
            return $"{amount / 1_000_000m:0.###}M";
        return amount.ToString("0.##");
    }
}
