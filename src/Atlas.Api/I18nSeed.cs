namespace Atlas.Api;

/// <summary>A folder that already holds a catalog is never touched, so edits made through the API survive every restart.</summary>
public static class I18nSeed
{
    public static string BundledFolder => Path.Combine(AppContext.BaseDirectory, "i18n");

    /// <summary>Copies the seeds only when the folder has no catalog yet; returns the number of files copied.</summary>
    public static int EnsureSeeded(string folder, string seedFolder)
    {
        if (SamePath(folder, seedFolder) || HasCatalog(folder) || !Directory.Exists(seedFolder))
            return 0;

        Directory.CreateDirectory(folder);
        var copied = 0;
        foreach (var source in Directory.EnumerateFiles(seedFolder, "*.json"))
        {
            var target = Path.Combine(folder, Path.GetFileName(source));
            if (File.Exists(target))
                continue;
            File.Copy(source, target);
            copied++;
        }

        return copied;
    }

    // A catalog is any *.json named after a locale code; _config.json is not one.
    private static bool HasCatalog(string folder) =>
        Directory.Exists(folder)
        && Directory.EnumerateFiles(folder, "*.json")
            .Any(path => I18nCatalog.IsValidCode(Path.GetFileNameWithoutExtension(path)));

    private static bool SamePath(string left, string right) =>
        string.Equals(Path.GetFullPath(left), Path.GetFullPath(right), StringComparison.Ordinal);
}
