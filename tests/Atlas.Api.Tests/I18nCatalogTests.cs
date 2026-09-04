namespace Atlas.Api.Tests;

public class I18nCatalogTests
{
    private static readonly DateTime Now = new(2026, 9, 4, 12, 0, 0, DateTimeKind.Utc);

    private static Catalog German(int version = 1, params (string Key, string Value)[] extra)
    {
        var entries = new Dictionary<string, string>
        {
            ["hier.back"] = "Zurück",
            ["hier.cap"] = "Obergrenze",
        };
        foreach (var (key, value) in extra)
            entries[key] = value;
        return new Catalog("de", "Deutsch", version, entries);
    }

    private static I18nConfig Config(string defaultCode, params LocaleConfig[] locales) =>
        new(defaultCode, locales);

    private static LocaleConfig Locale(string code, string? fallback, bool enabled = true) =>
        new(code, code, enabled, fallback);

    [Fact]
    public void Set_mints_the_next_version_and_an_audit_entry_with_before_and_after()
    {
        var current = German();

        var (next, entry, changed) = I18nCatalog.Set(current, "hier.back", "Zurück!", "pm.alice", "wording", Now);

        Assert.Equal(2, next.Version);
        Assert.Equal("Zurück!", next.Entries["hier.back"]);
        Assert.Equal("Zurück", current.Entries["hier.back"]); // the input is untouched

        Assert.Equal(AuditActions.Set, entry.Action);
        Assert.Equal("de", entry.Locale);
        Assert.Equal(2, entry.Version);
        Assert.Equal("hier.back", entry.Key);
        Assert.Equal("Zurück", entry.Before);
        Assert.Equal("Zurück!", entry.After);
        Assert.Equal("pm.alice", entry.Actor);
        Assert.Equal("wording", entry.Reason);
        Assert.Equal(Now, entry.Timestamp);
        Assert.Matches("^[0-9a-f]{32}$", entry.Id);
        Assert.Equal(["hier.back"], changed);
    }

    [Fact]
    public void Set_of_a_new_key_records_a_null_before()
    {
        var (next, entry, _) = I18nCatalog.Set(German(), "hier.new", "Neu", "pm.alice", null, Now);

        Assert.Null(entry.Before);
        Assert.Equal("Neu", next.Entries["hier.new"]);
        Assert.Equal(3, next.Entries.Count);
    }

    [Fact]
    public void Set_of_an_unchanged_value_is_still_a_new_version()
    {
        // Decision: every accepted write is one version + one audit line, no special case.
        var (next, entry, _) = I18nCatalog.Set(German(4), "hier.back", "Zurück", "pm.alice", null, Now);

        Assert.Equal(5, next.Version);
        Assert.Equal(entry.Before, entry.After);
    }

    [Fact]
    public void Delete_removes_the_key_and_records_the_old_value()
    {
        var (next, entry, changed) = I18nCatalog.Delete(German(), "hier.cap", "pm.bob", "unused", Now);

        Assert.Equal(2, next.Version);
        Assert.False(next.Entries.ContainsKey("hier.cap"));
        Assert.Equal(AuditActions.Delete, entry.Action);
        Assert.Equal("Obergrenze", entry.Before);
        Assert.Null(entry.After);
        Assert.Equal(["hier.cap"], changed);
    }

    [Fact]
    public void Delete_of_a_missing_key_throws()
    {
        Assert.Throws<KeyNotFoundException>(() => I18nCatalog.Delete(German(), "nope", "pm.bob", null, Now));
    }

    [Fact]
    public void Rollback_restores_the_snapshot_entries_as_a_new_version_naming_restoredFrom()
    {
        var versionOne = German(1);
        var versionThree = German(3, ("hier.back", "Retour"), ("extra.key", "x"));

        var (next, entry, changed) = I18nCatalog.Rollback(versionThree, versionOne, "pm.bob", "revert", Now);

        Assert.Equal(4, next.Version);
        Assert.Equal(versionOne.Entries, next.Entries);
        Assert.Equal(AuditActions.Rollback, entry.Action);
        Assert.Equal("3", entry.Before);
        Assert.Equal("1", entry.After);
        Assert.Null(entry.Key);
        Assert.Equal(["extra.key", "hier.back"], changed);
    }

    [Fact]
    public void Rollback_rejects_a_snapshot_of_another_locale()
    {
        var french = German() with { Code = "fr" };
        Assert.Throws<ArgumentException>(() => I18nCatalog.Rollback(German(), french, "pm.bob", null, Now));
    }

    [Fact]
    public void WithFallback_own_entries_win_then_the_nearest_fallback()
    {
        var own = new Dictionary<string, string> { ["a"] = "own" };
        var near = new Dictionary<string, string> { ["a"] = "near", ["b"] = "near" };
        var far = new Dictionary<string, string> { ["a"] = "far", ["b"] = "far", ["c"] = "far" };

        var merged = I18nCatalog.WithFallback(own, near, far);

        Assert.Equal("own", merged["a"]);
        Assert.Equal("near", merged["b"]);
        Assert.Equal("far", merged["c"]);
        Assert.Equal(3, merged.Count);
    }

    [Fact]
    public void FallbackChain_terminates_on_a_cycle_and_ends_with_the_default()
    {
        var config = Config("en", Locale("en", null), Locale("de", "fr"), Locale("fr", "de"));

        Assert.Equal(["fr", "en"], I18nCatalog.FallbackChain(config, "de"));
        Assert.Equal(["de", "en"], I18nCatalog.FallbackChain(config, "fr"));
    }

    [Fact]
    public void FallbackChain_skips_disabled_locales_but_keeps_the_default()
    {
        var config = Config("en",
            Locale("en", null, enabled: false),
            Locale("de", "at"),
            Locale("at", "fr", enabled: false),
            Locale("fr", null));

        Assert.Equal(["fr", "en"], I18nCatalog.FallbackChain(config, "de"));
    }

    [Fact]
    public void FallbackChain_of_the_default_is_empty()
    {
        var config = Config("en", Locale("en", null), Locale("de", "en"));

        Assert.Empty(I18nCatalog.FallbackChain(config, "en"));
        Assert.Equal(["en"], I18nCatalog.FallbackChain(config, "de"));
    }

    [Fact]
    public void ChangedKeys_lists_added_removed_and_changed_keys_sorted()
    {
        var before = new Dictionary<string, string> { ["a"] = "1", ["b"] = "2", ["c"] = "3" };
        var after = new Dictionary<string, string> { ["a"] = "1", ["b"] = "x", ["d"] = "4" };

        Assert.Equal(["b", "c", "d"], I18nCatalog.ChangedKeys(before, after));
    }

    [Theory]
    [InlineData("a")]
    [InlineData("nav.commitCapital")]
    [InlineData("nav.group.construction")]
    [InlineData("a1.B2.c3")]
    public void Valid_keys_pass(string key) => Assert.True(I18nCatalog.IsValidKey(key));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Nav.x")]
    [InlineData(".a")]
    [InlineData("a.")]
    [InlineData("a..b")]
    [InlineData("a-b")]
    [InlineData("a b")]
    public void Invalid_keys_fail(string? key) => Assert.False(I18nCatalog.IsValidKey(key));

    [Fact]
    public void Keys_longer_than_120_characters_fail()
    {
        Assert.True(I18nCatalog.IsValidKey(new string('a', 120)));
        Assert.False(I18nCatalog.IsValidKey(new string('a', 121)));
    }

    [Theory]
    [InlineData("en")]
    [InlineData("pt-BR")]
    public void Valid_codes_pass(string code) => Assert.True(I18nCatalog.IsValidCode(code));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("EN")]
    [InlineData("e")]
    [InlineData("eng")]
    [InlineData("pt-br")]
    [InlineData("en-")]
    [InlineData("_config")]
    [InlineData("../en")]
    public void Invalid_codes_fail(string? code) => Assert.False(I18nCatalog.IsValidCode(code));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Blank_actors_fail(string? actor) => Assert.False(I18nCatalog.IsValidActor(actor));

    [Fact]
    public void SortCodes_puts_the_default_first_then_alphabetical()
    {
        Assert.Equal(["en", "de", "fr"], I18nCatalog.SortCodes(["fr", "en", "de"]));
        Assert.Equal(["de", "en", "fr"], I18nCatalog.SortCodes(["fr", "en", "de"], defaultCode: "de"));
    }

    [Fact]
    public void ValidateConfig_accepts_a_consistent_config_and_names_each_problem()
    {
        var known = new HashSet<string> { "en", "de" };

        Assert.Null(I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("de", "en")), known));
        Assert.Null(I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("de", "en", enabled: false)), known));

        Assert.Contains("unknown", I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("es", "en")), known));
        Assert.Contains("'de' must be listed", I18nCatalog.ValidateConfig(Config("en", Locale("en", null)), known));
        Assert.Contains("twice", I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("en", null)), known));
        Assert.Contains("itself", I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("de", "de")), known));
        Assert.Contains("not a listed locale", I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("de", "fr")), known));
        Assert.Contains("Default locale", I18nCatalog.ValidateConfig(Config("fr", Locale("en", null), Locale("de", "en")), known));
        Assert.Contains("must be enabled", I18nCatalog.ValidateConfig(Config("en", Locale("en", null, enabled: false), Locale("de", "en")), known));
        Assert.Contains("at least one", I18nCatalog.ValidateConfig(new I18nConfig("en", []), known));
        Assert.Contains("invalid", I18nCatalog.ValidateConfig(Config("en", Locale("en", null), Locale("DE", "en")), known));
    }
}
