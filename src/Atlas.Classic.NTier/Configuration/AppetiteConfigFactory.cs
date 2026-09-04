using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atlas.Classic.NTier.Configuration;

/// <summary>
/// Loads and deserializes <c>appetite.config.json</c> into an
/// <see cref="AppetiteConfig"/>. Hand-rolled (System.Text.Json, no options
/// framework) so the config plumbing is visible:
///
///   * the file is located relative to <see cref="AppContext.BaseDirectory"/>,
///     which only works because the csproj marks the JSON as Content with
///     CopyToOutputDirectory — forget that and this throws at runtime;
///   * enums are read by NAME via <see cref="JsonStringEnumConverter"/>, so a
///     typo like "PrivateCreditt" in the JSON fails deserialization rather than
///     silently mapping to enum 0;
///   * property names are matched case-insensitively so "assetClass" in the file
///     binds to AssetClass on the model;
///   * a missing or empty file is treated as a hard configuration error — the
///     feature cannot run without its policy table.
/// </summary>
public sealed class AppetiteConfigFactory
{
    private const string ConfigFileName = "appetite.config.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    /// <summary>Locate, read and deserialize the appetite config. Throws if missing or malformed.</summary>
    public AppetiteConfig Load()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Configuration", ConfigFileName);

        if (!File.Exists(path))
            throw new FileNotFoundException(
                $"Appetite configuration not found at '{path}'. Ensure {ConfigFileName} is marked " +
                "as Content with CopyToOutputDirectory in the csproj.", path);

        var json = File.ReadAllText(path);

        AppetiteConfig? config;
        try
        {
            config = JsonSerializer.Deserialize<AppetiteConfig>(json, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Appetite configuration at '{path}' is not valid JSON: {ex.Message}", ex);
        }

        if (config is null)
            throw new InvalidOperationException($"Appetite configuration at '{path}' deserialized to null.");

        return config;
    }
}
