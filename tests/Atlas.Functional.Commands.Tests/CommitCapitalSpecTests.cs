using Atlas.Functional.Commands.Commitments;
using Atlas.Functional.Commands.Core;
using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

public class CommitCapitalSpecTests
{
    private static readonly DateOnly Today = new(2026, 6, 13);

    private static async Task<Result> ValidateAsync(CommitCapitalCommand command)
    {
        var upstream = InMemoryUpstream.Create(0);
        var rules = new CommitCapitalSpec(upstream, Today).Rules;
        var (result, _) = await new Validator<CommitCapitalCommand>(rules).ValidateAsync(command, "spec-test");
        return result;
    }

    [Fact]
    public async Task Valid_commitment_passes_the_declarative_spec()
    {
        var command = new CommitCapitalCommand(
            "PF-APAC-CREDIT", "CI-ROOT", "DEAL-PE-NA-02", 10_000_000m, "USD",
            AssetClass.PrivateEquity, Region.NorthAmerica, Liquidity.Illiquid,
            new DateOnly(2026, 9, 1), "pm.alice");

        var result = await ValidateAsync(command);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Malformed_command_fails_with_the_expected_codes()
    {
        var command = new CommitCapitalCommand(
            "PF-DRAFT", "CI-MISSING", "DEAL-CLOSED-04", -5_000_000m, "US",
            AssetClass.PrivateEquity, Region.Emea, Liquidity.Illiquid,
            new DateOnly(2020, 1, 1), "");

        var result = await ValidateAsync(command);
        var codes = result.Errors.Select(error => error.Code).ToHashSet();

        Assert.True(result.IsFailure);
        Assert.Contains("REQUIRED", codes);            // RequestedBy empty
        Assert.Contains("AMOUNT_NONPOSITIVE", codes);  // -5M
        Assert.Contains("CURRENCY_FORMAT", codes);     // "US" is 2 chars
        Assert.Contains("DATE_IN_PAST", codes);        // 2020
        Assert.Contains("FUND_NOT_OPEN", codes);  // reused async rule fires too
    }
}
