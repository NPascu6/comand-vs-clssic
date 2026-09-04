using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public sealed class CommitCapitalHandler(IUpstream upstream, DateOnly today)
    : CommandHandler<CommitCapitalCommand, CommitmentReceipt>
{
    protected override IEnumerable<Rule<CommitCapitalCommand>> Rules(CommitCapitalCommand command) =>
    [
        CommitCapitalRules.Structural(today),
        CommitCapitalRules.FundMustBeOpen(upstream.Funds),
        CommitCapitalRules.CurrencyMustBePermitted(upstream.Funds),
        CommitCapitalRules.DealMustBeInvestable(upstream.Deals),
        CommitCapitalRules.CoInvestmentMustHaveHeadroom(upstream.CoInvestments),
        CommitCapitalRules.CommitmentMustBeWithinAppetite(upstream.Appetite, upstream.Exposure),
    ];

    protected override Task<Result<CommitmentReceipt>> ExecuteAsync(
        CommitCapitalCommand command, CancellationToken cancellationToken)
    {
        // In production: POST the accepted commitment to the book of record and emit a domain event.
        var receipt = new CommitmentReceipt(
            CommitmentId: $"CMT-{command.FundId}-{command.DealId}-{command.Amount:F0}",
            command.FundId,
            command.CoInvestmentId,
            command.DealId,
            command.Amount,
            command.Currency,
            command.CommitmentDate,
            command.RequestedBy);

        return Task.FromResult(Result<CommitmentReceipt>.Success(receipt));
    }
}
