using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

// ---------------------------------------------------------------------------
// The rules that govern a capital commitment — ONE FILE PER RULE.
//
// `CommitCapitalRules` is a single static partial class spread across this
// folder; each file contributes exactly one named, independently testable rule
// factory. Adding a seventh rule is literally adding a file here and one line in
// the handler. No existing file changes — that is the anti-bloat property made
// physical in the folder layout.
//
// Each factory takes ONLY the upstream client it needs, so a rule can be tested
// with a single fake client — no DI container, no mocking framework.
// ---------------------------------------------------------------------------

public static partial class CommitCapitalRules
{
    /// <summary>Rule 1 — structural shape. Pure: no upstream I/O.</summary>
    public static Rule<CommitCapitalCommand> Structural(DateOnly today) => new(
        Name: "Structural",
        Description: "Command is well-formed (ids present, amount positive, currency code, date not in the past)",
        Kind: RuleKind.Structural,
        Check: (cmd, _) =>
        {
            var errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(cmd.FundId))
                errors.Add(new("REQUIRED", "FundId is required", Field: nameof(cmd.FundId)));
            if (string.IsNullOrWhiteSpace(cmd.CoInvestmentId))
                errors.Add(new("REQUIRED", "CoInvestmentId is required", Field: nameof(cmd.CoInvestmentId)));
            if (string.IsNullOrWhiteSpace(cmd.DealId))
                errors.Add(new("REQUIRED", "DealId is required", Field: nameof(cmd.DealId)));
            if (string.IsNullOrWhiteSpace(cmd.RequestedBy))
                errors.Add(new("REQUIRED", "RequestedBy is required", Field: nameof(cmd.RequestedBy)));
            if (cmd.Amount <= 0)
                errors.Add(new("AMOUNT_NONPOSITIVE", $"Amount must be greater than 0 (was {cmd.Amount:N0})", Field: nameof(cmd.Amount)));
            if (cmd.Currency is not { Length: 3 })
                errors.Add(new("CURRENCY_FORMAT", $"Currency must be a 3-letter code (was '{cmd.Currency}')", Field: nameof(cmd.Currency)));
            if (cmd.CommitmentDate < today)
                errors.Add(new("DATE_IN_PAST", $"CommitmentDate {cmd.CommitmentDate:yyyy-MM-dd} is before today ({today:yyyy-MM-dd})", Field: nameof(cmd.CommitmentDate)));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
