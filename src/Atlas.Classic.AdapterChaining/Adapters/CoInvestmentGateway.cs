using Atlas.Upstream.Contracts;

namespace Atlas.Classic.AdapterChaining;

public sealed class CoInvestmentGateway(ICoInvestmentClient client) : AdapterBase("CoInvestmentHierarchy")
{
    private readonly ICoInvestmentClient _client = client;

    public async Task<CoInvestmentContext> LoadAsync(string coInvestmentId, CancellationToken cancellationToken)
    {
        var node = await _client.GetNodeAsync(coInvestmentId, cancellationToken).ConfigureAwait(false);
        var found = RequireFound(node, "Co-investment node", coInvestmentId);
        return Map(found);
    }

    private static CoInvestmentContext Map(CoInvestmentNode node) => new()
    {
        CoInvestmentId = node.CoInvestmentId,
        FundId = node.FundId,
        IsActive = node.Status == CoInvestmentStatus.Active,
        Headroom = node.Headroom,
        Currency = node.Currency,
    };

    public void EnsureHeadroom(CoInvestmentContext node, string fundId, decimal amount)
    {
        if (node.FundId != fundId)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' belongs to fund " +
                $"'{node.FundId}', not '{fundId}'.");

        if (!node.IsActive)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' is not Active.");

        if (node.Headroom < amount)
            throw new CommitmentValidationException(
                $"Co-investment node '{node.CoInvestmentId}' has insufficient headroom: " +
                $"{node.Headroom:N0} available, {amount:N0} requested.");
    }
}
