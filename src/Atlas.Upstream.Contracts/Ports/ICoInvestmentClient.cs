namespace Atlas.Upstream.Contracts;

/// <summary>Co-investment hierarchy. Backed today by CRM (see Sources/CrmCoInvestmentClient).</summary>
public interface ICoInvestmentClient
{
    Task<CoInvestmentNode?> GetNodeAsync(string coInvestmentId, CancellationToken ct = default);

    Task<IReadOnlyCollection<CoInvestmentNode>> GetChildrenAsync(
        string coInvestmentId, CancellationToken ct = default);
}
