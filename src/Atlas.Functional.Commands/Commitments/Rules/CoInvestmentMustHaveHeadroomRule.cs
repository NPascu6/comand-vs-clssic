using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    /// <summary>Rule 5 — co-investment node belongs to the fund, is Active, and has headroom.</summary>
    public static Rule<CommitCapitalCommand> CoInvestmentMustHaveHeadroom(ICoInvestmentClient nodes) => new(
        Name: "CoInvestmentMustHaveHeadroom",
        Description: "Co-investment node belongs to the fund, is Active, and has enough headroom",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            var node = await nodes.GetNodeAsync(cmd.CoInvestmentId, ct);
            if (node is null)
                return new Error("COINVEST_NOT_FOUND", $"Co-investment '{cmd.CoInvestmentId}' was not found", Field: nameof(cmd.CoInvestmentId));

            var errors = new List<Error>();
            if (node.FundId != cmd.FundId)
                errors.Add(new("COINVEST_WRONG_FUND", $"Co-investment '{cmd.CoInvestmentId}' belongs to '{node.FundId}', not '{cmd.FundId}'", Field: nameof(cmd.CoInvestmentId)));
            if (node.Status != CoInvestmentStatus.Active)
                errors.Add(new("COINVEST_NOT_ACTIVE", $"Co-investment '{cmd.CoInvestmentId}' is {node.Status}, must be Active", Field: nameof(cmd.CoInvestmentId)));
            if (node.Headroom < cmd.Amount)
                errors.Add(new("COINVEST_NO_HEADROOM", $"Co-investment '{cmd.CoInvestmentId}' has {node.Headroom:N0} headroom, requested {cmd.Amount:N0}", Field: nameof(cmd.Amount)));

            return errors.Count == 0 ? Result.Success() : Result.Fail(errors);
        });
}
