using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Commitments;

public static partial class CommitCapitalRules
{
    /// <summary>Rule 3 — commitment currency is on the fund's permitted list.</summary>
    public static Rule<CommitCapitalCommand> CurrencyMustBePermitted(IFundClient funds) => new(
        Name: "CurrencyMustBePermitted",
        Description: "Commitment currency is on the fund's permitted list",
        Kind: RuleKind.Upstream,
        Check: async (cmd, ct) =>
        {
            var pf = await funds.GetFundAsync(cmd.FundId, ct);
            if (pf is null)
                return Result.Success(); // FundMustBeOpen already reports the missing fund; don't double-count.
            if (!pf.PermittedCurrencies.Contains(cmd.Currency))
                return new Error("CURRENCY_NOT_PERMITTED",
                    $"Currency '{cmd.Currency}' is not permitted for '{cmd.FundId}' (permitted: {string.Join(", ", pf.PermittedCurrencies)})",
                    Field: nameof(cmd.Currency));
            return Result.Success();
        });
}
