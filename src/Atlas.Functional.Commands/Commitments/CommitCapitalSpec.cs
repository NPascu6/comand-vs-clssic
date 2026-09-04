using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

/// <summary>The same validation as the handler's rule files, written declaratively; both produce Rule&lt;T&gt;.</summary>
public sealed class CommitCapitalSpec : Spec<CommitCapitalCommand>
{
    public CommitCapitalSpec(IUpstream upstream, DateOnly today)
    {
        RuleFor(command => command.FundId).NotEmpty();
        RuleFor(command => command.CoInvestmentId).NotEmpty();
        RuleFor(command => command.DealId).NotEmpty();
        RuleFor(command => command.RequestedBy).NotEmpty();
        RuleFor(command => command.Amount).GreaterThan(0m).WithCode("AMOUNT_NONPOSITIVE").WithMessage("Amount must be greater than 0");
        RuleFor(command => command.Currency).Length(3).WithCode("CURRENCY_FORMAT").WithMessage("Currency must be a 3-letter code");
        RuleFor(command => command.CommitmentDate)
            .Must(date => date >= today, "DATE_IN_PAST", $"CommitmentDate must be on or after {today:yyyy-MM-dd}");

        // The same rule factories the handler uses, so there is one source of truth.
        Add(CommitCapitalRules.FundMustBeOpen(upstream.Funds));
        Add(CommitCapitalRules.CurrencyMustBePermitted(upstream.Funds));
        Add(CommitCapitalRules.DealMustBeInvestable(upstream.Deals));
        Add(CommitCapitalRules.CoInvestmentMustHaveHeadroom(upstream.CoInvestments));
        Add(CommitCapitalRules.CommitmentMustBeWithinAppetite(upstream.Appetite, upstream.Exposure));
    }
}
