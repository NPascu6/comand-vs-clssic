using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> CoInvestmentMustHaveHeadroom(ICoInvestmentClient nodes) => new(
        Name: "CoInvestmentMustHaveHeadroom",
        Description: "Co-investment node belongs to the fund, is Active, and has enough headroom",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var node = await nodes.GetNodeAsync(command.CoInvestmentId, cancellationToken);
            if (node is null)
                return new Error("COINVEST_NOT_FOUND", $"Co-investment '{command.CoInvestmentId}' was not found", Field: nameof(command.CoInvestmentId));

            var errors = new List<Error>();
            if (node.FundId != command.FundId)
                errors.Add(new("COINVEST_WRONG_FUND", $"Co-investment '{command.CoInvestmentId}' belongs to '{node.FundId}', not '{command.FundId}'", Field: nameof(command.CoInvestmentId)));
            if (node.Status != CoInvestmentStatus.Active)
                errors.Add(new("COINVEST_NOT_ACTIVE", $"Co-investment '{command.CoInvestmentId}' is {node.Status}, must be Active", Field: nameof(command.CoInvestmentId)));
            if (node.Headroom < command.Amount)
                errors.Add(new("COINVEST_NO_HEADROOM", $"Co-investment '{command.CoInvestmentId}' has {node.Headroom:N0} headroom, requested {command.Amount:N0}", Field: nameof(command.Amount)));

            return errors.Count == 0 ? Result.Success() : Result.Fail(errors);
        });
}
