using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> FundMustBeOpen(IFundClient funds) => new(
        Name: "FundMustBeOpen",
        Description: "Fund exists upstream and is in the Open state",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var fund = await funds.GetFundAsync(command.FundId, cancellationToken);
            if (fund is null)
                return new Error("FUND_NOT_FOUND", $"Fund '{command.FundId}' was not found", Field: nameof(command.FundId));
            if (fund.Status != FundStatus.Open)
                return new Error("FUND_NOT_OPEN", $"Fund '{command.FundId}' is {fund.Status}, must be Open", Field: nameof(command.FundId));
            return Result.Success();
        });
}
