using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

/// <summary>One file per rule; each factory takes only the client it needs, so a rule is testable with a single stub.</summary>
public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> Structural(DateOnly today) => new(
        Name: "Structural",
        Description: "Command is well-formed (ids present, amount positive, currency code, date not in the past)",
        Kind: RuleKind.Structural,
        Check: (command, _) =>
        {
            var errors = new List<Error>();

            if (string.IsNullOrWhiteSpace(command.FundId))
                errors.Add(new("REQUIRED", "FundId is required", Field: nameof(command.FundId)));
            if (string.IsNullOrWhiteSpace(command.CoInvestmentId))
                errors.Add(new("REQUIRED", "CoInvestmentId is required", Field: nameof(command.CoInvestmentId)));
            if (string.IsNullOrWhiteSpace(command.DealId))
                errors.Add(new("REQUIRED", "DealId is required", Field: nameof(command.DealId)));
            if (string.IsNullOrWhiteSpace(command.RequestedBy))
                errors.Add(new("REQUIRED", "RequestedBy is required", Field: nameof(command.RequestedBy)));
            if (command.Amount <= 0)
                errors.Add(new("AMOUNT_NONPOSITIVE", $"Amount must be greater than 0 (was {command.Amount:N0})", Field: nameof(command.Amount)));
            if (command.Currency is not { Length: 3 })
                errors.Add(new("CURRENCY_FORMAT", $"Currency must be a 3-letter code (was '{command.Currency}')", Field: nameof(command.Currency)));
            if (command.CommitmentDate < today)
                errors.Add(new("DATE_IN_PAST", $"CommitmentDate {command.CommitmentDate:yyyy-MM-dd} is before today ({today:yyyy-MM-dd})", Field: nameof(command.CommitmentDate)));

            return Task.FromResult(errors.Count == 0 ? Result.Success() : Result.Fail(errors));
        });
}
