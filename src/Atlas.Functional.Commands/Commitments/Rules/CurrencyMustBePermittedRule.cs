using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    public static Rule<CommitCapitalCommand> CurrencyMustBePermitted(IFundClient funds) => new(
        Name: "CurrencyMustBePermitted",
        Description: "Commitment currency is on the fund's permitted list",
        Kind: RuleKind.Upstream,
        Check: async (command, cancellationToken) =>
        {
            var fund = await funds.GetFundAsync(command.FundId, cancellationToken);
            if (fund is null)
                return Result.Success(); // FundMustBeOpen already reports the missing fund; don't double-count.
            if (!fund.PermittedCurrencies.Contains(command.Currency))
                return new Error("CURRENCY_NOT_PERMITTED",
                    $"Currency '{command.Currency}' is not permitted for '{command.FundId}' (permitted: {string.Join(", ", fund.PermittedCurrencies)})",
                    Field: nameof(command.Currency));
            return Result.Success();
        });
}
