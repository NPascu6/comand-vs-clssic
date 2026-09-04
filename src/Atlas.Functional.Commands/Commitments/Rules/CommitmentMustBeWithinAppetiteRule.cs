using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    /// <summary>Rule 6 — existing exposure + this commitment stays within the appetite limit for the bucket.</summary>
    public static Rule<CommitCapitalCommand> CommitmentMustBeWithinAppetite(
        IAppetiteClient appetite, IExposureClient exposure) => new(
        Name: "CommitmentMustBeWithinAppetite",
        Description: "Existing exposure + this commitment stays within the appetite limit for the bucket",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            // Two independent upstream reads — fetched concurrently.
            var limitsTask = appetite.GetLimitsAsync(cmd.FundId, ct);
            var exposureTask = exposure.GetExposureAsync(cmd.FundId, ct);
            await Task.WhenAll(limitsTask, exposureTask);

            var limit = (await limitsTask).FirstOrDefault(l => l.AssetClass == cmd.AssetClass && l.Region == cmd.Region);
            if (limit is null)
                return new Error("APPETITE_NONE",
                    $"No appetite configured for bucket {Buckets.Key(cmd.AssetClass, cmd.Region)} on '{cmd.FundId}' — denied by default",
                    Field: nameof(cmd.FundId));

            var committed = (await exposureTask).CommittedIn(cmd.AssetClass, cmd.Region);
            var projected = committed + cmd.Amount;
            if (projected > limit.MaxAmount)
                return new Error("APPETITE_BREACH",
                    $"Bucket {limit.Bucket}: {committed:N0} committed + {cmd.Amount:N0} = {projected:N0} exceeds limit {limit.MaxAmount:N0}",
                    Field: nameof(cmd.Amount));

            return Result.Success();
        });
}
