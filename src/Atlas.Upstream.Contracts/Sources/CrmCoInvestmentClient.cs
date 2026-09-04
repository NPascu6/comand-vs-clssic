namespace Atlas.Upstream.Contracts;

// ---------------------------------------------------------------------------
// SOURCE: CRM (co-investment structures).
//
// Co-investment vehicles and their sleeves are modelled in the CRM. This
// adapter maps CRM's hierarchy into our CoInvestmentNode tree. A second
// adapter against the same CRM system, isolated from the deal adapter —
// each port is bound independently in Composition/.
// ---------------------------------------------------------------------------
public sealed class CrmCoInvestmentClient(SeedData data, int latencyMs = 5) : ICoInvestmentClient
{
    public async Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct);
        return data.CoInvestments.GetValueOrDefault(coInvestmentId);
    }

    public async Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(
        string coInvestmentId, CancellationToken ct = default)
    {
        await Task.Delay(latencyMs, ct);
        return data.CoInvestments.Values
            .Where(c => c.ParentCoInvestmentId == coInvestmentId)
            .ToList();
    }
}
