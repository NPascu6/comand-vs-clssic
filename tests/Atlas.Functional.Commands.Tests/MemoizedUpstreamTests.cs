using Atlas.Upstream.Contracts;

namespace Atlas.Functional.Commands.Tests;

// Proves the honesty fix for the "concurrent rules de-dupe shared reads" claim:
// two rules reading the same fund concurrently hit the upstream ONCE.
public class MemoizedUpstreamTests
{
    private sealed class CountingFund : IFundClient
    {
        public int Calls;

        public Task<FundSnapshot?> GetFundAsync(string fundId, CancellationToken ct = default)
        {
            Interlocked.Increment(ref Calls);
            return Task.FromResult<FundSnapshot?>(
                new FundSnapshot(fundId, "x", FundStatus.Open, "USD", new[] { "USD" }));
        }
    }

    private sealed class CountingUpstream(IFundClient funds) : IUpstream
    {
        private readonly IUpstream _rest = InMemoryUpstream.Create(0);
        public IFundClient Funds { get; } = funds;
        public IDealClient Deals => _rest.Deals;
        public ICoInvestmentClient CoInvestments => _rest.CoInvestments;
        public IAppetiteClient Appetite => _rest.Appetite;
        public IExposureClient Exposure => _rest.Exposure;
    }

    [Fact]
    public async Task Concurrent_reads_of_the_same_key_hit_the_upstream_once()
    {
        var counting = new CountingFund();
        var upstream = new MemoizedUpstream(new CountingUpstream(counting));

        // Two rules, same fund, fired concurrently — exactly how the Validator runs them.
        await Task.WhenAll(
            upstream.Funds.GetFundAsync("PF-1"),
            upstream.Funds.GetFundAsync("PF-1"));

        Assert.Equal(1, counting.Calls);
    }
}
