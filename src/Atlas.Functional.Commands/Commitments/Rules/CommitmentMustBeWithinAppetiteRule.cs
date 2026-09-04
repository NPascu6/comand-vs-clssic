using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> CommitmentMustBeWithinAppetite(
        IAppetiteClient appetite, IExposureClient exposure) => new(
        Name: "CommitmentMustBeWithinAppetite",
        Description: "Existing exposure + this commitment stays within the appetite limit for the bucket",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var limitsTask = appetite.GetLimitsAsync(command.FundId, cancellationToken);
            var exposureTask = exposure.GetExposureAsync(command.FundId, cancellationToken);
            await Task.WhenAll(limitsTask, exposureTask);

            var limit = (await limitsTask).FirstOrDefault(candidate => candidate.AssetClass == command.AssetClass && candidate.Region == command.Region);
            if (limit is null)
                return new Error("APPETITE_NONE",
                    $"No appetite configured for bucket {Buckets.Key(command.AssetClass, command.Region)} on '{command.FundId}' — denied by default",
                    Field: nameof(command.FundId));

            var committed = (await exposureTask).CommittedIn(command.AssetClass, command.Region);
            var projected = committed + command.Amount;
            if (projected > limit.MaxAmount)
                return new Error("APPETITE_BREACH",
                    $"Bucket {limit.Bucket}: {committed:N0} committed + {command.Amount:N0} = {projected:N0} exceeds limit {limit.MaxAmount:N0}",
                    Field: nameof(command.Amount));

            return Result.Success();
        });
}
