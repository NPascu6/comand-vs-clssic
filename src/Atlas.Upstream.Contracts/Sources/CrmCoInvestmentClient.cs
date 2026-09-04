namespace Atlas.Upstream.Contracts;

public sealed class CrmCoInvestmentClient(SeedData data, int latencyMs = 5) : ICoInvestmentClient
{
    public async Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken);
        return data.CoInvestments.GetValueOrDefault(coInvestmentId);
    }

    public async Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(
        string coInvestmentId, CancellationToken cancellationToken = default)
    {
        await Task.Delay(latencyMs, cancellationToken);
        return data.CoInvestments.Values
            .Where(node => node.ParentCoInvestmentId == coInvestmentId)
            .ToList();
    }
}
