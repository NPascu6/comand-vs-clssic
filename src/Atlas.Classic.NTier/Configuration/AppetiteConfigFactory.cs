using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atlas.Classic.NTier.Configuration;

/// <summary>Loads appetite.config.json from beside the binary; a missing or malformed file is a hard configuration error.</summary>
public sealed class AppetiteConfigFactory
{
    private const string ConfigFileName = "appetite.config.json";

    // Enums are read by name, so a misspelt bucket fails deserialization instead of mapping to enum 0.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

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
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                $"Appetite configuration at '{path}' is not valid JSON: {exception.Message}", exception);
        }

        if (config is null)
            throw new InvalidOperationException($"Appetite configuration at '{path}' deserialized to null.");

        return config;
    }
}
