using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> DealMustBeInvestable(IDealClient deals) => new(
        Name: "DealMustBeInvestable",
        Description: "Deal exists, is Investable in-window, and matches asset class / region / liquidity",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var deal = await deals.GetDealAsync(command.DealId, cancellationToken);
            if (deal is null)
                return new Error("DEAL_NOT_FOUND", $"Deal '{command.DealId}' was not found", Field: nameof(command.DealId));

            var errors = new List<Error>();
            if (deal.Status != DealStatus.Investable)
                errors.Add(new("DEAL_NOT_INVESTABLE", $"Deal '{command.DealId}' is {deal.Status}, must be Investable", Field: nameof(command.DealId)));
            if (command.CommitmentDate < deal.InvestableFrom || command.CommitmentDate > deal.InvestableTo)
                errors.Add(new("DEAL_WINDOW", $"CommitmentDate {command.CommitmentDate:yyyy-MM-dd} is outside the deal window [{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}]", Field: nameof(command.CommitmentDate)));
            if (command.AssetClass != deal.AssetClass)
                errors.Add(new("ASSETCLASS_MISMATCH", $"Command asset class {command.AssetClass} does not match deal {deal.AssetClass}", Field: nameof(command.AssetClass)));
            if (command.Region != deal.Region)
                errors.Add(new("REGION_MISMATCH", $"Command region {command.Region} does not match deal {deal.Region}", Field: nameof(command.Region)));
            if (command.Liquidity != deal.Liquidity)
                errors.Add(new("LIQUIDITY_MISMATCH", $"Command liquidity {command.Liquidity} does not match deal {deal.Liquidity}", Field: nameof(command.Liquidity)));

            return errors.Count == 0 ? Result.Success() : Result.Fail(errors);
        });
}
