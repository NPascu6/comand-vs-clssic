namespace Atlas.Classic.NTier.Configuration;

/// <summary>Typed view of the deserialized appetite.config.json file.</summary>
public sealed class AppetiteConfig
{
    public List<AppetiteLimitConfig> Limits { get; set; } = new();

    public AppetiteLimitConfig? FindLimit(AssetClass assetClass, Region region) =>
        Limits.FirstOrDefault(limit => limit.AssetClass == assetClass && limit.Region == region);
}

/// <summary>One row of the appetite table: a ceiling for an (asset-class, region) bucket.</summary>
public sealed class AppetiteLimitConfig
{
    public AssetClass AssetClass { get; set; }
    public Region Region { get; set; }
    public decimal MaxAmount { get; set; }
}
