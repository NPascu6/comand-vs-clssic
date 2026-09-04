namespace Atlas.Classic.NTier.Configuration;

// ===========================================================================
// JSON CONFIG LAYER (Configuration/).
//
// Appetite limits are POLICY, so the classic stack externalises them into a
// JSON file shipped beside the binary (appetite.config.json) and reads them via
// a typed options object + a loader factory. That is three artefacts — the JSON,
// this typed model, and AppetiteConfigFactory — for what is conceptually a small
// lookup table. (The other samples read appetite from the upstream Appetite
// CLIENT; this one uses config on purpose, to exhibit this whole layer.)
// ===========================================================================

/// <summary>Typed view of the deserialized appetite.config.json file.</summary>
public sealed class AppetiteConfig
{
    public List<AppetiteLimitConfig> Limits { get; set; } = new();

    /// <summary>
    /// Linear scan to find the configured ceiling for a bucket. Returns null when
    /// no limit is configured — rule 6 treats that as a FAIL (no committing into
    /// an un-policied bucket).
    /// </summary>
    public AppetiteLimitConfig? FindLimit(AssetClass assetClass, Region region) =>
        Limits.FirstOrDefault(l => l.AssetClass == assetClass && l.Region == region);
}

/// <summary>One row of the appetite table: a ceiling for an (asset-class, region) bucket.</summary>
public sealed class AppetiteLimitConfig
{
    public AssetClass AssetClass { get; set; }
    public Region Region { get; set; }
    public decimal MaxAmount { get; set; }
}
