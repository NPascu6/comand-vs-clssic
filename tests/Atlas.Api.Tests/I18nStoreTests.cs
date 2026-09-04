using System.Text.Json;

namespace Atlas.Api.Tests;

public sealed class I18nStoreTests : IDisposable
{
    private readonly string _folder = Path.Combine(Path.GetTempPath(), "atlas-i18n-tests", Guid.NewGuid().ToString("N"));
    private readonly I18nStore _store;

    public I18nStoreTests()
    {
        Directory.CreateDirectory(_folder);
        WriteFile("en.json", """{ "name": "English", "version": 1, "entries": { "hier.back": "Back", "hier.cap": "Cap" } }""");
        WriteFile("de.json", """{ "name": "Deutsch", "entries": { "hier.back": "Zurück" } }""");
        _store = new I18nStore(_folder);
    }

    public void Dispose() => Directory.Delete(_folder, recursive: true);

    private void WriteFile(string name, string json) => File.WriteAllText(Path.Combine(_folder, name), json);
    private string PathOf(params string[] parts) => Path.Combine([_folder, .. parts]);
    private int AuditLineCount() => File.ReadAllLines(PathOf("_audit.jsonl")).Count(line => line.Length > 0);
    private static int VersionInFile(string path) => JsonDocument.Parse(File.ReadAllText(path)).RootElement.GetProperty("version").GetInt32();

    [Fact]
    public void A_file_without_version_reads_as_1()
    {
        Assert.Equal(1, _store.ReadCatalog("de")!.Version);
        Assert.Equal(1, _store.ReadSnapshot("de", 1)!.Version);
    }

    [Fact]
    public void Catalog_is_merged_over_the_fallback_chain_but_a_snapshot_is_raw()
    {
        var merged = _store.ReadCatalog("de")!;
        Assert.Equal("Zurück", merged.Entries["hier.back"]);
        Assert.Equal("Cap", merged.Entries["hier.cap"]);

        var raw = _store.ReadSnapshot("de", 1)!;
        Assert.False(raw.Entries.ContainsKey("hier.cap"));
    }

    [Fact]
    public void Unknown_or_malformed_codes_read_as_null()
    {
        Assert.Null(_store.ReadCatalog("es"));
        Assert.Null(_store.ReadCatalog("../en"));
        Assert.Null(_store.ListVersions("es"));
        Assert.Null(_store.ReadSnapshot("de", 9));
    }

    [Fact]
    public void A_file_dropped_into_the_folder_appears_on_the_next_read()
    {
        Assert.Equal(["en", "de"], _store.ListLocales().Select(locale => locale.Code));

        WriteFile("fr.json", """{ "name": "Français", "entries": { "hier.back": "Retour" } }""");

        Assert.Equal(["en", "de", "fr"], _store.ListLocales().Select(locale => locale.Code));
        Assert.Equal("Retour", _store.ReadCatalog("fr")!.Entries["hier.back"]);
    }

    [Fact]
    public void Versions_of_an_unmutated_locale_show_the_current_one_as_create()
    {
        var versions = _store.ListVersions("de")!;

        var only = Assert.Single(versions);
        Assert.Equal(1, only.Version);
        Assert.Equal(AuditActions.Create, only.Action);
        Assert.Equal(I18nCatalog.SystemActor, only.Actor);
        Assert.Equal(["hier.back"], only.ChangedKeys);
    }

    [Fact]
    public async Task Set_writes_the_snapshots_and_bumps_the_current_file()
    {
        var result = await _store.SetEntryAsync("de", "hier.cap", "Obergrenze", "pm.alice", null, ifMatch: 1);

        Assert.Null(result.Error);
        Assert.Equal(new EntryChange("de", 2, "hier.cap", null, "Obergrenze"), result.Value);

        Assert.True(File.Exists(PathOf("_history", "de", "1.json")), "the pre-mutation version is snapshotted lazily");
        Assert.True(File.Exists(PathOf("_history", "de", "2.json")));
        Assert.Equal(2, VersionInFile(PathOf("de.json")));

        Assert.False(_store.ReadSnapshot("de", 1)!.Entries.ContainsKey("hier.cap"));
        Assert.Equal("Obergrenze", _store.ReadSnapshot("de", 2)!.Entries["hier.cap"]);
        Assert.Equal(2, _store.ListLocales().Single(locale => locale.Code == "de").Version);
    }

    [Fact]
    public async Task Every_mutation_appends_one_audit_line()
    {
        await _store.SetEntryAsync("de", "hier.cap", "Obergrenze", "pm.alice", null, null);
        await _store.SetEntryAsync("de", "hier.cap", "Limit", "pm.alice", null, null);
        await _store.DeleteEntryAsync("de", "hier.cap", "pm.bob", "unused", null);

        // 1 "create" for the seeded version 1 + 3 mutations.
        Assert.Equal(4, AuditLineCount());

        var all = _store.ReadAudit(null, 100);
        Assert.Equal([AuditActions.Delete, AuditActions.Set, AuditActions.Set, AuditActions.Create], all.Select(entry => entry.Action));
        Assert.Equal([4, 3, 2, 1], all.Select(entry => entry.Version));

        Assert.Equal(2, _store.ReadAudit("de", 2).Count);
        Assert.Empty(_store.ReadAudit("en", 100));
    }

    [Fact]
    public async Task A_stale_IfMatch_is_rejected_and_nothing_is_written()
    {
        var result = await _store.SetEntryAsync("de", "hier.back", "X", "pm.alice", null, ifMatch: 7);

        Assert.Equal(WriteFailure.VersionMismatch, result.Error!.Failure);
        Assert.Equal(1, result.Error.CurrentVersion);
        Assert.Null(result.Value);

        Assert.False(Directory.Exists(PathOf("_history")));
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
        Assert.Equal("Zurück", _store.ReadCatalog("de")!.Entries["hier.back"]);
    }

    [Fact]
    public async Task Deleting_a_missing_key_or_unknown_locale_is_NotFound_and_writes_nothing()
    {
        var missingKey = await _store.DeleteEntryAsync("de", "hier.cap", "pm.bob", null, null);
        var unknownLocale = await _store.SetEntryAsync("es", "hier.cap", "x", "pm.bob", null, null);
        var unknownVersion = await _store.RollbackAsync("de", 9, "pm.bob", null, null);

        Assert.Equal(WriteFailure.NotFound, missingKey.Error!.Failure);
        Assert.Equal(WriteFailure.NotFound, unknownLocale.Error!.Failure);
        Assert.Equal(WriteFailure.NotFound, unknownVersion.Error!.Failure);
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
    }

    [Fact]
    public async Task Rollback_restores_entries_as_a_new_version_and_history_is_newest_first()
    {
        await _store.SetEntryAsync("de", "hier.back", "A", "pm.alice", null, null);   // v2
        await _store.SetEntryAsync("de", "hier.back", "B", "pm.alice", null, null);   // v3

        var result = await _store.RollbackAsync("de", 2, "pm.bob", "revert B", null);

        Assert.Equal(new RollbackResult("de", 4, 2), result.Value);
        Assert.Equal("A", _store.ReadCatalog("de")!.Entries["hier.back"]);
        Assert.Equal("B", _store.ReadSnapshot("de", 3)!.Entries["hier.back"]); // history untouched

        var versions = _store.ListVersions("de")!;
        Assert.Equal([4, 3, 2, 1], versions.Select(summary => summary.Version));
        Assert.Equal(AuditActions.Rollback, versions[0].Action);
        Assert.Equal("revert B", versions[0].Reason);
        Assert.Equal(["hier.back"], versions[0].ChangedKeys);
        Assert.Equal(AuditActions.Create, versions[3].Action);

        Assert.Equal("2", _store.ReadAudit("de", 1).Single().After);
    }

    [Fact]
    public async Task Catalog_at_a_version_merges_that_snapshot_over_the_current_fallback()
    {
        await _store.SetEntryAsync("de", "hier.back", "Neu", "pm.alice", null, null);

        var old = _store.ReadCatalog("de", version: 1)!;

        Assert.Equal(1, old.Version);
        Assert.Equal("Zurück", old.Entries["hier.back"]);
        Assert.Equal("Cap", old.Entries["hier.cap"]);
    }

    [Fact]
    public async Task Rollback_to_the_current_version_is_Invalid_and_writes_nothing()
    {
        var result = await _store.RollbackAsync("de", 1, "pm.bob", null, null);

        Assert.Equal(WriteFailure.Invalid, result.Error!.Failure);
        Assert.Contains("already the current version", result.Error.Message);
        Assert.False(Directory.Exists(PathOf("_history")));
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
    }

    [Fact]
    public async Task The_seed_and_the_change_share_one_clock_reading()
    {
        await _store.SetEntryAsync("de", "hier.cap", "Obergrenze", "pm.alice", null, null);

        var audit = _store.ReadAudit("de", 10);
        Assert.Equal([2, 1], audit.Select(entry => entry.Version));
        Assert.Equal(audit[1].Timestamp, audit[0].Timestamp);
        Assert.Equal(audit[1].Timestamp, _store.ListVersions("de")![1].CreatedAt);
    }

    [Fact]
    public async Task A_catalog_edited_by_hand_is_recorded_as_its_own_version_before_the_next_write()
    {
        await _store.SetEntryAsync("de", "hier.cap", "Obergrenze", "pm.alice", null, null);   // seeds v1, writes v2

        // Someone edits de.json in an editor: same version number, different entries.
        WriteFile("de.json", """{ "name": "Deutsch", "version": 2, "entries": { "hier.back": "Zurück!", "hier.cap": "Obergrenze" } }""");

        var result = await _store.SetEntryAsync("de", "hier.cap", "Limit", "pm.alice", null, ifMatch: 2);

        // v3 is the hand-made state, v4 this write: two audit lines for one call.
        Assert.Equal(4, result.Value!.Version);
        Assert.Equal(4, AuditLineCount());

        var audit = _store.ReadAudit("de", 2);
        Assert.Equal([AuditActions.Set, AuditActions.Create], audit.Select(entry => entry.Action));
        Assert.Equal([4, 3], audit.Select(entry => entry.Version));
        Assert.Equal(I18nCatalog.SystemActor, audit[1].Actor);
        Assert.Equal("catalog file changed outside the API", audit[1].Reason);
        Assert.Equal(audit[1].Timestamp, audit[0].Timestamp);

        // History keeps both states: what the API wrote, and what the editor made of it.
        Assert.Equal("Zurück", _store.ReadSnapshot("de", 2)!.Entries["hier.back"]);
        Assert.Equal("Zurück!", _store.ReadSnapshot("de", 3)!.Entries["hier.back"]);
        Assert.Equal("Limit", _store.ReadSnapshot("de", 4)!.Entries["hier.cap"]);

        var versions = _store.ListVersions("de")!;
        Assert.Equal([4, 3, 2, 1], versions.Select(summary => summary.Version));
        Assert.Equal(AuditActions.Create, versions[1].Action);
        Assert.Equal(["hier.back"], versions[1].ChangedKeys);
    }

    [Fact]
    public async Task A_catalog_rewritten_by_hand_with_the_same_entries_is_not_reseeded()
    {
        await _store.SetEntryAsync("de", "hier.cap", "Obergrenze", "pm.alice", null, null);   // v2

        WriteFile("de.json", """{ "name": "Deutsch", "version": 2, "entries": { "hier.cap": "Obergrenze", "hier.back": "Zurück" } }""");
        var result = await _store.SetEntryAsync("de", "hier.cap", "Limit", "pm.alice", null, ifMatch: 2);

        Assert.Equal(3, result.Value!.Version);
        Assert.Equal(3, AuditLineCount());
    }

    // A write persists snapshot → audit → current; these simulate dying in between.

    private string WriteSnapshot(string code, int version, string actor)
    {
        Directory.CreateDirectory(PathOf("_history", code));
        var path = PathOf("_history", code, $"{version}.json");
        File.WriteAllText(path, $$"""{ "name": "Deutsch", "version": {{version}}, "createdAt": "2026-09-04T12:00:00Z", "actor": "{{actor}}", "action": "set", "changedKeys": ["orphan.key"], "entries": { "orphan.key": "x" } }""");
        return path;
    }

    [Fact]
    public async Task A_snapshot_ahead_of_the_current_file_refuses_the_write_and_is_never_overwritten()
    {
        // An earlier write died after its snapshot: history says 2, de.json says 1.
        var orphan = WriteSnapshot("de", 2, "ORPHAN");
        var orphanText = File.ReadAllText(orphan);
        var currentText = File.ReadAllText(PathOf("de.json"));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _store.SetEntryAsync("de", "hier.back", "X", "pm.alice", null, null));

        Assert.Contains("history is ahead", exception.Message);
        Assert.Equal(orphanText, File.ReadAllText(orphan));
        Assert.Equal(currentText, File.ReadAllText(PathOf("de.json")));
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
        Assert.Equal(["2.json"], Directory.GetFiles(PathOf("_history", "de")).Select(Path.GetFileName)); // no seed, no temp file

        // Reconciled by hand (here: the orphan removed), the locale writes again.
        File.Delete(orphan);
        var result = await _store.SetEntryAsync("de", "hier.back", "X", "pm.alice", null, null);
        Assert.Equal(2, result.Value!.Version);
        Assert.Equal("pm.alice", _store.ListVersions("de")![0].Actor);
    }

    [Fact]
    public async Task The_audit_line_is_written_before_the_current_file_so_an_unaudited_version_never_goes_live()
    {
        // Version 1 is already in history and a directory sits at the audit log's path, so the write dies right there.
        WriteSnapshot("de", 1, "system");
        Directory.CreateDirectory(PathOf("_audit.jsonl"));

        await Assert.ThrowsAnyAsync<SystemException>(() =>
            _store.SetEntryAsync("de", "hier.back", "X", "pm.alice", null, null));

        Assert.True(File.Exists(PathOf("_history", "de", "2.json")), "the snapshot is the write-ahead record");
        Assert.Equal(1, _store.ReadCatalog("de")!.Version);
        Assert.Equal("Zurück", _store.ReadCatalog("de")!.Entries["hier.back"]);

        // With the log writable again the locale is still refused: history is ahead.
        Directory.Delete(PathOf("_audit.jsonl"));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _store.SetEntryAsync("de", "hier.back", "X", "pm.alice", null, null));
    }

    [Fact]
    public void Without_a_config_file_everything_is_enabled_and_falls_back_to_en()
    {
        var config = _store.ReadConfig();

        Assert.Equal("en", config.DefaultCode);
        Assert.Equal([("en", true, null), ("de", true, "en")],
            config.Locales.Select(locale => (locale.Code, locale.Enabled, locale.FallbackCode)));
        Assert.Equal("Deutsch", config.Locales[1].Name);
    }

    [Fact]
    public async Task Config_round_trips_and_is_audited()
    {
        var proposed = new I18nConfig("en", [
            new LocaleConfig("en", "ignored", true, null),
            new LocaleConfig("de", "ignored", false, "en"),
        ]);

        var result = await _store.SaveConfigAsync(proposed, "admin", "hide de");

        Assert.Null(result.Error);
        Assert.True(File.Exists(PathOf("_config.json")));

        var read = _store.ReadConfig();
        Assert.Equal("en", read.DefaultCode);
        Assert.Equal([("en", true, null), ("de", false, "en")],
            read.Locales.Select(locale => (locale.Code, locale.Enabled, locale.FallbackCode)));
        Assert.Equal("Deutsch", read.Locales[1].Name); // name comes from de.json, not the body

        var audit = _store.ReadAudit(null, 10).Single();
        Assert.Equal(AuditActions.Config, audit.Action);
        Assert.Null(audit.Locale);
        Assert.Contains("\"enabled\":false", audit.After);
        Assert.Contains("\"enabled\":true", audit.Before);
    }

    [Fact]
    public async Task A_disabled_locale_leaves_the_list_but_stays_readable_by_code()
    {
        await _store.SaveConfigAsync(new I18nConfig("en", [
            new LocaleConfig("en", "", true, null),
            new LocaleConfig("de", "", false, "en"),
        ]), "admin", null);

        Assert.Equal(["en"], _store.ListLocales().Select(locale => locale.Code));

        var german = _store.ReadCatalog("de")!;
        Assert.Equal("Zurück", german.Entries["hier.back"]);
        Assert.Equal("Cap", german.Entries["hier.cap"]);
    }

    [Fact]
    public async Task Config_naming_an_unknown_locale_is_Invalid_and_writes_nothing()
    {
        var result = await _store.SaveConfigAsync(new I18nConfig("en", [
            new LocaleConfig("en", "", true, null),
            new LocaleConfig("es", "", true, "en"),
        ]), "admin", null);

        Assert.Equal(WriteFailure.Invalid, result.Error!.Failure);
        Assert.False(File.Exists(PathOf("_config.json")));
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
    }

    [Fact]
    public async Task Config_leaving_out_a_catalog_on_disk_is_Invalid_and_writes_nothing()
    {
        var result = await _store.SaveConfigAsync(new I18nConfig("en", [
            new LocaleConfig("en", "", true, null),
        ]), "admin", null);

        Assert.Equal(WriteFailure.Invalid, result.Error!.Failure);
        Assert.Equal("Locale 'de' must be listed.", result.Error.Message);
        Assert.False(File.Exists(PathOf("_config.json")));
        Assert.False(File.Exists(PathOf("_audit.jsonl")));
    }
}
