namespace Atlas.Classic.ValidatorFactory;

/// <summary>
/// The classic homegrown validator: ALL six rules live inside ONE imperative
/// Validate method, executed top-to-bottom, with nested ifs and order-dependence.
///
/// This single method is the thing the README is about. Every observation below
/// is a real property of this code, not a caricature:
///
///   * IF-SOUP / ONE GIANT METHOD: rules 1-6 are inlined here. Adding a 7th rule
///     means editing this method. Two devs adding rules in the same sprint touch
///     the same method and conflict. There is no per-rule unit of code to test in
///     isolation — you test "the validator", all rules at once.
///
///   * SYNC vs ASYNC: this method is synchronous (IValidator<T> demands it), yet
///     every business rule needs upstream data. We resolved that by demanding a
///     pre-fetched CommitCapitalContext — assembled on a SEPARATE async path the
///     caller must remember to run first (see CommitCapitalContext.LoadAsync and
///     Program.cs). The validator therefore validates "input + a bag someone else
///     filled", not the input alone.
///
///   * ORDER-DEPENDENCE / FRAGILITY: later rules assume earlier ones passed. The
///     headroom and appetite rules dereference ctx.Node / compare amounts that
///     only make sense once structural + existence checks have run. Each such spot
///     is marked "ORDERING TRAP". Reorder these blocks and you get a
///     NullReferenceException or a wrong answer instead of a clean error.
///
///   * EXCEPTIONS-FOR-FLOW: rule 2 (FundOpen) throws ValidationException to
///     abort rather than returning. That one throw means the request short-circuits
///     and NO later rule runs — so a request that also breaches appetite will only
///     ever report the fund problem. See the "EXCEPTION-FOR-FLOW" comment.
///
///   * AGGREGATION IS MANUAL: there is no framework collecting errors. We new up a
///     ValidationResult and AddError by hand. Short-circuiting (return/throw) and
///     aggregation (keep going, collect all) are in permanent tension and we end
///     up doing BOTH inconsistently — structural errors aggregate, business errors
///     mostly short-circuit. That inconsistency is itself the lesson.
/// </summary>
public sealed class CommitCapitalValidator : IValidator<CommitCapitalInput>
{
    // Fixed "today" for past-date checks — no DateTime.Now, so the demo is
    // deterministic.
    private static readonly DateOnly Today = new(2026, 6, 13);

    // The context is injected per-instance. This is the awkwardness made concrete:
    // a "validator" that cannot exist without upstream data someone fetched for it.
    private readonly CommitCapitalContext _ctx;

    public CommitCapitalValidator(CommitCapitalContext ctx) => _ctx = ctx;

    public ValidationResult Validate(CommitCapitalInput input)
    {
        var result = new ValidationResult();

        // -------------------------------------------------------------------
        // RULE 1 — STRUCTURAL. These need no upstream data, so they aggregate
        // cleanly: we collect ALL structural problems before moving on. This is
        // the ONE place the "collect everything" instinct wins, which makes the
        // later short-circuiting feel even more inconsistent by contrast.
        // -------------------------------------------------------------------
        if (string.IsNullOrWhiteSpace(input.FundId))
            result.AddError("FundId is required.");
        if (string.IsNullOrWhiteSpace(input.CoInvestmentId))
            result.AddError("CoInvestmentId is required.");
        if (string.IsNullOrWhiteSpace(input.DealId))
            result.AddError("DealId is required.");
        if (string.IsNullOrWhiteSpace(input.RequestedBy))
            result.AddError("RequestedBy is required.");
        if (input.Amount <= 0)
            result.AddError("Amount must be greater than zero.");
        if (string.IsNullOrEmpty(input.Currency) || input.Currency.Length != 3)
            result.AddError("Currency must be a 3-letter code.");
        if (input.CommitmentDate < Today)
            result.AddError($"CommitmentDate {input.CommitmentDate:yyyy-MM-dd} is in the past (today is {Today:yyyy-MM-dd}).");

        // ORDERING TRAP #1: if structural validation failed, we MUST stop here.
        // Everything below assumes ids are non-empty and amount/currency are sane.
        // Comment this guard out and a blank FundId sails into the business
        // rules, where ctx.Fund is null and rule 3 dereferences
        // PermittedCurrencies -> NullReferenceException instead of a tidy
        // "FundId is required." This early-return is also why scenario C
        // reports ONLY structural errors and never reaches the state checks.
        if (!result.IsValid)
            return result;

        // -------------------------------------------------------------------
        // RULE 2 — FundOpen. Fund must exist AND be Open.
        //
        // EXCEPTION-FOR-FLOW (deliberate smell): instead of AddError + return, we
        // THROW. Why would a real codebase do this? Because someone decided "a
        // closed/missing fund is exceptional, abort the whole pipeline" and
        // wired a try/catch at the call site. The cost: this throw short-circuits
        // EVERY remaining rule, so we can never report a fund problem
        // alongside, say, an appetite breach. It also forces every caller to wrap
        // Validate in try/catch or crash. We catch it ourselves below to convert
        // back into the result — proving the throw bought us nothing but coupling.
        // -------------------------------------------------------------------
        try
        {
            EnforceFundOpen(input);
        }
        catch (ValidationException ex)
        {
            // Translate the control-flow exception back into the result shape.
            // This catch is pure tax created by the throw above.
            result.AddError(ex.Message);
            return result;
        }

        // From here on, ctx.Fund is guaranteed non-null (rule 2 threw
        // otherwise). The nullable warning is suppressed by that invariant — an
        // invariant maintained only by READING THE CODE TOP TO BOTTOM, not by the
        // type system. That is the fragility.

        // -------------------------------------------------------------------
        // RULE 3 — CurrencyPermitted. Currency must be in the fund's list.
        // ORDERING TRAP #2: dereferences _ctx.Fund. Only safe because rule 2
        // ran first and threw on a null/closed fund. Move this above rule 2
        // and a missing fund is an NRE here.
        // -------------------------------------------------------------------
        if (!_ctx.Fund!.PermittedCurrencies.Contains(input.Currency))
        {
            result.AddError(
                $"Currency {input.Currency} is not permitted for fund {input.FundId} " +
                $"(permitted: {string.Join(", ", _ctx.Fund!.PermittedCurrencies)}).");
            // Note: we do NOT return here — we let deal/headroom/appetite also run.
            // So currency + deal problems CAN aggregate... but a fund problem
            // (rule 2) cannot, because it threw. The inconsistency is the point.
        }

        // -------------------------------------------------------------------
        // RULE 4 — DealInvestable. Deal must exist, be Investable, the date must
        // fall within its window, and asset-class/region/liquidity must match.
        // Nested ifs guard each dereference because ctx.Deal is nullable.
        // -------------------------------------------------------------------
        if (_ctx.Deal is null)
        {
            result.AddError($"Deal {input.DealId} was not found.");
        }
        else
        {
            var deal = _ctx.Deal;
            if (deal.Status != DealStatus.Investable)
            {
                result.AddError($"Deal {input.DealId} is not investable (status {deal.Status}).");
            }
            else
            {
                // ORDERING TRAP #3: the date-window check only makes sense once we
                // know the deal exists and is investable; it is nested THREE ifs
                // deep purely to keep the dereferences safe. Flattening this for
                // readability would reintroduce the null/closed-deal hazards.
                if (input.CommitmentDate < deal.InvestableFrom || input.CommitmentDate > deal.InvestableTo)
                {
                    result.AddError(
                        $"CommitmentDate {input.CommitmentDate:yyyy-MM-dd} is outside deal window " +
                        $"[{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}].");
                }

                if (deal.AssetClass != input.AssetClass)
                    result.AddError($"AssetClass {input.AssetClass} does not match deal ({deal.AssetClass}).");
                if (deal.Region != input.Region)
                    result.AddError($"Region {input.Region} does not match deal ({deal.Region}).");
                if (deal.Liquidity != input.Liquidity)
                    result.AddError($"Liquidity {input.Liquidity} does not match deal ({deal.Liquidity}).");
            }
        }

        // -------------------------------------------------------------------
        // RULE 5 — CoInvestmentHeadroom. Node must exist, belong to this
        // fund, be Active, and have headroom >= Amount.
        // -------------------------------------------------------------------
        if (_ctx.Node is null)
        {
            result.AddError($"Co-investment node {input.CoInvestmentId} was not found.");
        }
        else
        {
            var node = _ctx.Node;
            if (node.FundId != input.FundId)
            {
                result.AddError(
                    $"Co-investment node {input.CoInvestmentId} belongs to fund " +
                    $"{node.FundId}, not {input.FundId}.");
            }
            else if (node.Status != CoInvestmentStatus.Active)
            {
                result.AddError($"Co-investment node {input.CoInvestmentId} is not active (status {node.Status}).");
            }
            else if (node.Headroom < input.Amount)
            {
                // This is breach #1 in scenario B (headroom 20M < requested 25M).
                result.AddError(
                    $"Co-investment node {input.CoInvestmentId} has insufficient headroom: " +
                    $"{node.Headroom:N0} available, {input.Amount:N0} requested.");
            }
        }

        // -------------------------------------------------------------------
        // RULE 6 — AppetiteWithinLimit. There must be a configured limit for
        // (AssetClass, Region), and current exposure + Amount must not exceed it.
        // If NO limit is configured, that is a FAIL (you cannot commit into an
        // un-policied bucket).
        //
        // ORDERING TRAP #4: this reads _ctx.Exposure (safe — never null) and scans
        // _ctx.Limits. It is independent of rule 5, so in scenario B BOTH the
        // headroom breach AND this appetite breach are reported — *because* rule 5
        // used AddError rather than throwing. Had rule 5 thrown (like rule 2 does),
        // we would report only the headroom breach. Same logic, opposite UX, decided
        // purely by whether a given author reached for throw or AddError that day.
        // -------------------------------------------------------------------
        var limit = _ctx.Limits.FirstOrDefault(l => l.AssetClass == input.AssetClass && l.Region == input.Region);
        if (limit is null)
        {
            result.AddError(
                $"No appetite limit configured for {input.AssetClass}/{input.Region}; " +
                "commitment cannot be made into an un-policied bucket.");
        }
        else
        {
            var committed = _ctx.Exposure.CommittedIn(input.AssetClass, input.Region);
            if (committed + input.Amount > limit.MaxAmount)
            {
                // This is breach #2 in scenario B (230M + 25M = 255M > 250M).
                result.AddError(
                    $"Appetite breach for {input.AssetClass}/{input.Region}: " +
                    $"committed {committed:N0} + requested {input.Amount:N0} = {committed + input.Amount:N0} " +
                    $"exceeds limit {limit.MaxAmount:N0}.");
            }
        }

        return result;
    }

    /// <summary>
    /// Rule 2 extracted only so the THROW is visible. In the wild this is often
    /// inlined into the giant method, making the control-flow exception even
    /// harder to spot. It throws instead of returning — the documented smell.
    /// </summary>
    private void EnforceFundOpen(CommitCapitalInput input)
    {
        if (_ctx.Fund is null)
            throw new ValidationException($"Fund {input.FundId} was not found.");

        if (_ctx.Fund.Status != FundStatus.Open)
            throw new ValidationException(
                $"Fund {input.FundId} is not open (status {_ctx.Fund.Status}).");
    }
}
