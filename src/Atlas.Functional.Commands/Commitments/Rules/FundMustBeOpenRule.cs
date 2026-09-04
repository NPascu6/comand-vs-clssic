using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    /// <summary>Rule 2 — fund exists upstream and is Open.</summary>
    public static Rule<CommitCapitalCommand> FundMustBeOpen(IFundClient funds) => new(
        Name: "FundMustBeOpen",
        Description: "Fund exists upstream and is in the Open state",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            var pf = await funds.GetFundAsync(cmd.FundId, ct);
            if (pf is null)
                return new Error("FUND_NOT_FOUND", $"Fund '{cmd.FundId}' was not found", Field: nameof(cmd.FundId));
            if (pf.Status != FundStatus.Open)
                return new Error("FUND_NOT_OPEN", $"Fund '{cmd.FundId}' is {pf.Status}, must be Open", Field: nameof(cmd.FundId));
            return Result.Success();
        });
}
