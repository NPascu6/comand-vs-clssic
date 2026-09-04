using Atlas.Functional.Commands.Core;

namespace Atlas.Functional.Commands.Pipelines;

// ---------------------------------------------------------------------------
// The rules that govern a deal-stage transition — ONE FILE PER RULE.
//
// `AdvanceDealStageRules` is a single static partial class spread across this
// folder; each file contributes exactly one named, independently testable rule
// factory — mirroring the Commitments/Rules layout. Adding a rule is adding a
// file here and one line in the handler; no existing file changes.
// ---------------------------------------------------------------------------

public static partial class AdvanceDealStageRules
{
    /// <summary>Rule 1 — structural shape. Pure: no upstream I/O.</summary>
    public static Rule<AdvanceDealStageCommand> Structural() => new(
        Name: "Structural",
        Description: "Command is well-formed (DealId and RequestedBy present)",
        Kind: RuleKind.Structural,
        Check: (cmd, _) =>
        {
            var errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(cmd.DealId))
                errors.Add(new("REQUIRED", "DealId is required", Field: nameof(cmd.DealId)));
            if (string.IsNullOrWhiteSpace(cmd.RequestedBy))
                errors.Add(new("REQUIRED", "RequestedBy is required", Field: nameof(cmd.RequestedBy)));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
