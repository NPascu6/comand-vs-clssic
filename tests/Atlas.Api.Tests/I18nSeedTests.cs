namespace Atlas.Api.Tests;

public sealed class I18nSeedTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "atlas-seed-tests", Guid.NewGuid().ToString("N"));

    private string Seeds => Path.Combine(_root, "seeds");
    private string Target => Path.Combine(_root, "target");

    public I18nSeedTests()
    {
        Directory.CreateDirectory(Seeds);
        File.WriteAllText(Path.Combine(Seeds, "en.json"), """{ "name": "English", "entries": {} }""");
        File.WriteAllText(Path.Combine(Seeds, "_config.json"), """{ "defaultCode": "en" }""");
    }

    public void Dispose() => Directory.Delete(_root, recursive: true);

    private IEnumerable<string?> TargetFiles() => Directory.GetFiles(Target).Select(path => Path.GetFileName(path)).Order();

    [Fact]
    public void A_missing_folder_is_created_and_seeded()
    {
        Assert.Equal(2, I18nSeed.EnsureSeeded(Target, Seeds));
        Assert.Equal(["_config.json", "en.json"], TargetFiles());
    }

    [Fact]
    public void A_folder_with_a_catalog_is_left_alone()
    {
        Directory.CreateDirectory(Target);
        File.WriteAllText(Path.Combine(Target, "de.json"), "{}");

        Assert.Equal(0, I18nSeed.EnsureSeeded(Target, Seeds));
        Assert.Equal(["de.json"], TargetFiles());
    }

    [Fact]
    public void A_config_alone_does_not_count_and_is_kept_as_is()
    {
        Directory.CreateDirectory(Target);
        File.WriteAllText(Path.Combine(Target, "_config.json"), "hand-written");

        Assert.Equal(1, I18nSeed.EnsureSeeded(Target, Seeds));
        Assert.Equal("hand-written", File.ReadAllText(Path.Combine(Target, "_config.json")));
        Assert.Equal(["_config.json", "en.json"], TargetFiles());
    }

    [Fact]
    public void The_seed_folder_is_never_seeded_into_itself() =>
        Assert.Equal(0, I18nSeed.EnsureSeeded(Seeds, Seeds));
}
