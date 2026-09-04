using Atlas.Functional.Commands.Core;

namespace Atlas.Functional.Commands.Pipelines;

public static partial class AdvanceDealStageRules
{
    public static Rule<AdvanceDealStageCommand> Structural() => new(
        Name: "Structural",
        Description: "Command is well-formed (DealId and RequestedBy present)",
        Kind: RuleKind.Structural,
        Check: (command, _) =>
        {
            var errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(command.DealId))
                errors.Add(new("REQUIRED", "DealId is required", Field: nameof(command.DealId)));
            if (string.IsNullOrWhiteSpace(command.RequestedBy))
                errors.Add(new("REQUIRED", "RequestedBy is required", Field: nameof(command.RequestedBy)));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
