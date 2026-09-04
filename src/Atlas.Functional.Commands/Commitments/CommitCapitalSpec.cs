using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

// ---------------------------------------------------------------------------
// CommitCapital validation in a DECLARATIVE, FluentValidation-style form —
// the same RuleFor(...) ergonomics — but on the owned Spec<T> core: no
// FluentValidation, async-native, and every rule still flows into the concurrent
// Validator<T> + the DecisionTrace.
//
// Two styles, one core. The handler uses one-file-per-rule (Commitments/Rules/);
// this Spec is the equivalent written declaratively. Same Rule<T>, same machinery
// — choose whichever reads better for a given feature. That choice is the
// flexibility the team keeps by owning the core instead of renting a library.
// ---------------------------------------------------------------------------

public sealed class CommitCapitalSpec : Spec<CommitCapitalCommand>
{
    public CommitCapitalSpec(IUpstream upstream, DateOnly today)
    {
        // --- structural: declarative, FluentValidation-style RuleFor chains ---
        RuleFor(x => x.FundId).NotEmpty();
        RuleFor(x => x.CoInvestmentId).NotEmpty();
        RuleFor(x => x.DealId).NotEmpty();
        RuleFor(x => x.RequestedBy).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0m).WithCode("AMOUNT_NONPOSITIVE").WithMessage("Amount must be greater than 0");
        RuleFor(x => x.Currency).Length(3).WithCode("CURRENCY_FORMAT").WithMessage("Currency must be a 3-letter code");
        RuleFor(x => x.CommitmentDate)
            .Must(d => d >= today, "DATE_IN_PAST", $"CommitmentDate must be on or after {today:yyyy-MM-dd}");

        // --- async business rules: first-class here (the FluentValidation pain point).
        // Reuse the SAME named rule factories the handler uses — single source of truth. ---
        Add(CommitCapitalRules.FundMustBeOpen(upstream.Funds));
        Add(CommitCapitalRules.CurrencyMustBePermitted(upstream.Funds));
        Add(CommitCapitalRules.DealMustBeInvestable(upstream.Deals));
        Add(CommitCapitalRules.CoInvestmentMustHaveHeadroom(upstream.CoInvestments));
        Add(CommitCapitalRules.CommitmentMustBeWithinAppetite(upstream.Appetite, upstream.Exposure));
    }
}
