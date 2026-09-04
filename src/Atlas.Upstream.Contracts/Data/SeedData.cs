namespace Atlas.Upstream.Contracts;

/// <summary>The one deterministic dataset every Sources/ adapter reads, so samples and tests run offline and identically.</summary>
public sealed class SeedData
{
    public required Dictionary<string, FundSnapshot> Funds { get; init; }
    public required Dictionary<string, DealSnapshot> Deals { get; init; }
    public required Dictionary<string, CoInvestmentNode> CoInvestments { get; init; }
    public required Dictionary<string, List<AppetiteLimit>> AppetiteByFund { get; init; }
    public required Dictionary<string, ExposureSnapshot> ExposureByFund { get; init; }

    public static SeedData Build()
    {
        var funds = new[]
        {
            new FundSnapshot("PF-APAC-CREDIT", "APAC Credit Opportunities",
                FundStatus.Open, "USD", new[] { "USD", "EUR", "GBP", "SGD" }),
            new FundSnapshot("PF-DRAFT", "Unfunded Draft Book",
                FundStatus.Draft, "USD", new[] { "USD" }),
            new FundSnapshot("PF-EU-PE", "European Buyout Fund IV",
                FundStatus.Open, "EUR", new[] { "EUR", "USD", "GBP" }),
            new FundSnapshot("PF-GLOBAL-MULTI", "Global Multi-Asset Mandate",
                FundStatus.Open, "USD", new[] { "USD", "EUR", "GBP", "JPY", "SGD" }),
        }.ToDictionary(fund => fund.FundId);

        var deals = new[]
        {
            new DealSnapshot("DEAL-PC-EMEA-01", "Nordic Senior Direct Lending",
                DealStatus.Investable, AssetClass.PrivateCredit, Region.Emea, Liquidity.Illiquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "EUR"),
            new DealSnapshot("DEAL-PE-NA-02", "US Mid-Market Buyout III",
                DealStatus.Investable, AssetClass.PrivateEquity, Region.NorthAmerica, Liquidity.Illiquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 9, 30), "USD"),
            new DealSnapshot("DEAL-ETF-APAC-03", "APAC Liquid Equity ETF",
                DealStatus.Investable, AssetClass.Etf, Region.Apac, Liquidity.Liquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "USD"),
            new DealSnapshot("DEAL-CLOSED-04", "Closed Vintage Fund",
                DealStatus.Closed, AssetClass.PrivateEquity, Region.Emea, Liquidity.Illiquid,
                new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31), "EUR"),
            new DealSnapshot("DEAL-PE-EU-05", "DACH Software Buyout",
                DealStatus.Investable, AssetClass.PrivateEquity, Region.Emea, Liquidity.Illiquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "EUR"),
            new DealSnapshot("DEAL-PC-NA-06", "US Asset-Based Lending",
                DealStatus.Investable, AssetClass.PrivateCredit, Region.NorthAmerica, Liquidity.Illiquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "USD"),
            new DealSnapshot("DEAL-ETF-EU-07", "Europe Sustainable Equity ETF",
                DealStatus.Investable, AssetClass.Etf, Region.Emea, Liquidity.Liquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "EUR"),
            new DealSnapshot("DEAL-EQ-APAC-08", "Japan Quality Equity",
                DealStatus.Investable, AssetClass.LiquidEquity, Region.Apac, Liquidity.Liquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "JPY"),
            new DealSnapshot("DEAL-PE-LATAM-09", "Brazil Infrastructure Platform",
                DealStatus.Pipeline, AssetClass.PrivateEquity, Region.Latam, Liquidity.Illiquid,
                new DateOnly(2026, 6, 1), new DateOnly(2027, 6, 30), "USD"),
            new DealSnapshot("DEAL-PC-APAC-10", "APAC Mezzanine Fund II",
                DealStatus.Investable, AssetClass.PrivateCredit, Region.Apac, Liquidity.Illiquid,
                new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), "SGD"),
        }.ToDictionary(deal => deal.DealId);

        var coInvestments = new[]
        {
            new CoInvestmentNode("CI-ROOT", "PF-APAC-CREDIT", null,
                CoInvestmentStatus.Active, 500_000_000m, 100_000_000m, "USD"),
            new CoInvestmentNode("CI-SLEEVE-PC", "PF-APAC-CREDIT", "CI-ROOT",
                CoInvestmentStatus.Active, 200_000_000m, 180_000_000m, "USD"),
            new CoInvestmentNode("CI-SUSPENDED", "PF-APAC-CREDIT", "CI-ROOT",
                CoInvestmentStatus.Suspended, 100_000_000m, 0m, "USD"),
            new CoInvestmentNode("CI-SLEEVE-EQ", "PF-APAC-CREDIT", "CI-ROOT",
                CoInvestmentStatus.Active, 150_000_000m, 40_000_000m, "USD"),
            new CoInvestmentNode("CI-EQ-A", "PF-APAC-CREDIT", "CI-SLEEVE-EQ",
                CoInvestmentStatus.Active, 80_000_000m, 30_000_000m, "USD"),
            new CoInvestmentNode("CI-EU-ROOT", "PF-EU-PE", null,
                CoInvestmentStatus.Active, 400_000_000m, 250_000_000m, "EUR"),
            new CoInvestmentNode("CI-EU-BUYOUT", "PF-EU-PE", "CI-EU-ROOT",
                CoInvestmentStatus.Active, 250_000_000m, 180_000_000m, "EUR"),
            new CoInvestmentNode("CI-EU-GROWTH", "PF-EU-PE", "CI-EU-ROOT",
                CoInvestmentStatus.Active, 150_000_000m, 60_000_000m, "EUR"),
            new CoInvestmentNode("CI-GLB-ROOT", "PF-GLOBAL-MULTI", null,
                CoInvestmentStatus.Active, 1_000_000_000m, 300_000_000m, "USD"),
            new CoInvestmentNode("CI-GLB-PE", "PF-GLOBAL-MULTI", "CI-GLB-ROOT",
                CoInvestmentStatus.Active, 400_000_000m, 200_000_000m, "USD"),
            new CoInvestmentNode("CI-GLB-CREDIT", "PF-GLOBAL-MULTI", "CI-GLB-ROOT",
                CoInvestmentStatus.Active, 300_000_000m, 150_000_000m, "USD"),
            new CoInvestmentNode("CI-GLB-LIQUID", "PF-GLOBAL-MULTI", "CI-GLB-ROOT",
                CoInvestmentStatus.Active, 300_000_000m, 100_000_000m, "USD"),
        }.ToDictionary(node => node.CoInvestmentId);

        var appetite = new Dictionary<string, List<AppetiteLimit>>
        {
            ["PF-APAC-CREDIT"] = new()
            {
                new AppetiteLimit(AssetClass.PrivateCredit, Region.Emea, 250_000_000m, 40m),
                new AppetiteLimit(AssetClass.PrivateEquity, Region.NorthAmerica, 300_000_000m, 50m),
                new AppetiteLimit(AssetClass.Etf, Region.Apac, 100_000_000m, 20m),
            },
            ["PF-EU-PE"] = new()
            {
                new AppetiteLimit(AssetClass.PrivateEquity, Region.Emea, 350_000_000m, 60m),
                new AppetiteLimit(AssetClass.Etf, Region.Emea, 100_000_000m, 20m),
            },
            ["PF-GLOBAL-MULTI"] = new()
            {
                new AppetiteLimit(AssetClass.PrivateEquity, Region.NorthAmerica, 400_000_000m, 40m),
                new AppetiteLimit(AssetClass.PrivateCredit, Region.NorthAmerica, 300_000_000m, 30m),
                new AppetiteLimit(AssetClass.Etf, Region.Apac, 150_000_000m, 20m),
                new AppetiteLimit(AssetClass.LiquidEquity, Region.Apac, 200_000_000m, 25m),
            },
        };

        var exposure = new Dictionary<string, ExposureSnapshot>
        {
            ["PF-APAC-CREDIT"] = new ExposureSnapshot(
                "PF-APAC-CREDIT",
                TotalCommitted: 400_000_000m,
                CommittedByBucket: new Dictionary<string, decimal>
                {
                    [Buckets.Key(AssetClass.PrivateCredit, Region.Emea)] = 230_000_000m,
                    [Buckets.Key(AssetClass.PrivateEquity, Region.NorthAmerica)] = 120_000_000m,
                    [Buckets.Key(AssetClass.Etf, Region.Apac)] = 50_000_000m,
                }),
            ["PF-EU-PE"] = new ExposureSnapshot(
                "PF-EU-PE", TotalCommitted: 250_000_000m,
                CommittedByBucket: new Dictionary<string, decimal>
                {
                    [Buckets.Key(AssetClass.PrivateEquity, Region.Emea)] = 180_000_000m,
                    [Buckets.Key(AssetClass.Etf, Region.Emea)] = 30_000_000m,
                }),
            ["PF-GLOBAL-MULTI"] = new ExposureSnapshot(
                "PF-GLOBAL-MULTI", TotalCommitted: 450_000_000m,
                CommittedByBucket: new Dictionary<string, decimal>
                {
                    [Buckets.Key(AssetClass.PrivateEquity, Region.NorthAmerica)] = 200_000_000m,
                    [Buckets.Key(AssetClass.PrivateCredit, Region.NorthAmerica)] = 150_000_000m,
                    [Buckets.Key(AssetClass.Etf, Region.Apac)] = 50_000_000m,
                    [Buckets.Key(AssetClass.LiquidEquity, Region.Apac)] = 50_000_000m,
                }),
        };

        return new SeedData
        {
            Funds = funds,
            Deals = deals,
            CoInvestments = coInvestments,
            AppetiteByFund = appetite,
            ExposureByFund = exposure,
        };
    }
}
