using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

// ---------------------------------------------------------------------------
// The handler: the entire feature, assembled.
//
// Notice what is NOT here: no if-chains, no adapter plumbing, no mapping, no
// orchestration of "call this, then that". The handler declares which rules
// apply and what to do once they pass. The base class runs the rules
// concurrently, aggregates the errors, and produces the audit trace.
//
// This is the payoff for the team: a new business rule is a one-line addition
// to Rules(...); a change to "what happens on success" is confined to
// ExecuteAsync. The two concerns never tangle.
// ---------------------------------------------------------------------------

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
        CommitCapitalCommand command, CancellationToken ct)
    {
        // In production this is where we POST the accepted commitment to the upstream
        // book of record and emit a domain event. By the time we are here, every rule
        // has already approved — execution is pure business action, not re-checking.
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
