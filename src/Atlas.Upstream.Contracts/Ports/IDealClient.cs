namespace Atlas.Upstream.Contracts;

/// <summary>Deal pipeline. Backed today by CRM (see Sources/CrmDealClient).</summary>
public interface IDealClient
{
    Task<DealSnapshot?> GetDealAsync(string dealId, CancellationToken cancellationToken = default);
}
