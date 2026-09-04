using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    /// <summary>Rule 4 — deal exists, is Investable in-window, and matches asset class / region / liquidity.</summary>
    public static Rule<CommitCapitalCommand> DealMustBeInvestable(IDealClient deals) => new(
        Name: "DealMustBeInvestable",
        Description: "Deal exists, is Investable in-window, and matches asset class / region / liquidity",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            var deal = await deals.GetDealAsync(cmd.DealId, ct);
            if (deal is null)
                return new Error("DEAL_NOT_FOUND", $"Deal '{cmd.DealId}' was not found", Field: nameof(cmd.DealId));

            var errors = new List<Error>();
            if (deal.Status != DealStatus.Investable)
                errors.Add(new("DEAL_NOT_INVESTABLE", $"Deal '{cmd.DealId}' is {deal.Status}, must be Investable", Field: nameof(cmd.DealId)));
            if (cmd.CommitmentDate < deal.InvestableFrom || cmd.CommitmentDate > deal.InvestableTo)
                errors.Add(new("DEAL_WINDOW", $"CommitmentDate {cmd.CommitmentDate:yyyy-MM-dd} is outside the deal window [{deal.InvestableFrom:yyyy-MM-dd}..{deal.InvestableTo:yyyy-MM-dd}]", Field: nameof(cmd.CommitmentDate)));
            if (cmd.AssetClass != deal.AssetClass)
                errors.Add(new("ASSETCLASS_MISMATCH", $"Command asset class {cmd.AssetClass} does not match deal {deal.AssetClass}", Field: nameof(cmd.AssetClass)));
            if (cmd.Region != deal.Region)
                errors.Add(new("REGION_MISMATCH", $"Command region {cmd.Region} does not match deal {deal.Region}", Field: nameof(cmd.Region)));
            if (cmd.Liquidity != deal.Liquidity)
                errors.Add(new("LIQUIDITY_MISMATCH", $"Command liquidity {cmd.Liquidity} does not match deal {deal.Liquidity}", Field: nameof(cmd.Liquidity)));

            return errors.Count == 0 ? Result.Success() : Result.Fail(errors);
        });
}
