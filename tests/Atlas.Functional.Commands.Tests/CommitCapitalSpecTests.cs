using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// The declarative Spec<T> (FluentValidation-style ergonomics, owned core) produces
// Rule<T>s that run on the same Validator<T> — and agree with the rest of the system.
public class CommitCapitalSpecTests
{
    private static readonly DateOnly Today = new(2026, 6, 13);

    private static async Task<Result> ValidateAsync(CommitCapitalCommand cmd)
    {
        var upstream = InMemoryUpstream.Create(0);
        var rules = new CommitCapitalSpec(upstream, Today).Rules;
        var (result, _) = await new Validator<CommitCapitalCommand>(rules).ValidateAsync(cmd, "spec-test");
        return result;
    }

    [Fact]
    public async Task Valid_commitment_passes_the_declarative_spec()
    {
        var cmd = new CommitCapitalCommand(
            "PF-APAC-CREDIT", "CI-ROOT", "DEAL-PE-NA-02", 10_000_000m, "USD",
            AssetClass.PrivateEquity, Region.NorthAmerica, Liquidity.Illiquid,
            new DateOnly(2026, 9, 1), "pm.alice");

        var result = await ValidateAsync(cmd);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Malformed_command_fails_with_the_expected_codes()
    {
        var cmd = new CommitCapitalCommand(
            "PF-DRAFT", "CI-MISSING", "DEAL-CLOSED-04", -5_000_000m, "US",
            AssetClass.PrivateEquity, Region.Emea, Liquidity.Illiquid,
            new DateOnly(2020, 1, 1), "");

        var result = await ValidateAsync(cmd);
        var codes = result.Errors.Select(e => e.Code).ToHashSet();

        Assert.True(result.IsFailure);
        Assert.Contains("REQUIRED", codes);            // RequestedBy empty
        Assert.Contains("AMOUNT_NONPOSITIVE", codes);  // -5M
        Assert.Contains("CURRENCY_FORMAT", codes);     // "US" is 2 chars
        Assert.Contains("DATE_IN_PAST", codes);        // 2020
        Assert.Contains("FUND_NOT_OPEN", codes);  // reused async rule fires too
    }
}
