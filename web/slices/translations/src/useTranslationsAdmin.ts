import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@atlas/i18n';
import { useDataSource } from '@atlas/platform';
import type { AuditEntry, Catalog, EntryChange, I18nConfig, LocaleSummary, RollbackResult, VersionSummary } from './catalog';
import { isConflict, makeApiClient, mockClient } from './client';
import type { TranslationsClient } from './client';

/** One key of the selected locale: its own value ('' when inherited) beside the default locale's. */
export interface CatalogRow {
  key: string;
  value: string;
  fallback: string;
  own: boolean;
}

export const ALL_LOCALES = 'all';
const DEFAULT_ACTOR = 'pm.alice';

interface Overview {
  config: I18nConfig;
  locales: LocaleSummary[];
}

interface LocaleData {
  catalog: Catalog;
  rows: CatalogRow[];
  versions: VersionSummary[];
}

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

function buildRows(merged: Catalog, own: Catalog, defaults: Catalog): CatalogRow[] {
  return Object.keys(merged.entries)
    .sort()
    .map((key) => ({ key, value: own.entries[key] ?? '', fallback: defaults.entries[key] ?? '', own: key in own.entries }));
}

async function fetchOverview(client: TranslationsClient): Promise<Overview> {
  const [config, locales] = await Promise.all([client.config(), client.locales()]);
  return { config, locales };
}

// The merged catalog gives version + full key coverage; the raw snapshot says which keys the locale owns (only those can be deleted).
async function fetchLocale(client: TranslationsClient, code: string, defaultCode: string): Promise<LocaleData> {
  const [merged, defaults, versions] = await Promise.all([client.catalog(code), client.catalog(defaultCode), client.versions(code)]);
  const own = code === defaultCode ? merged : await client.snapshot(code, merged.version);
  return { catalog: merged, rows: buildRows(merged, own, defaults), versions };
}

export function useTranslationsAdmin() {
  const dataSource = useDataSource();
  const i18n = useI18n();
  const client = useMemo(() => (dataSource.mode === 'api' ? makeApiClient(dataSource.apiBaseUrl) : mockClient), [dataSource.mode, dataSource.apiBaseUrl]);

  const [config, setConfig] = useState<I18nConfig | null>(null);
  const [locales, setLocales] = useState<LocaleSummary[]>([]);
  const [locale, setLocale] = useState('');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLocale, setAuditLocale] = useState(ALL_LOCALES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState(DEFAULT_ACTOR);
  const [reason, setReason] = useState('');

  const defaultCode = config?.defaultCode ?? '';

  const applyOverview = useCallback((overview: Overview) => {
    setConfig(overview.config);
    setLocales(overview.locales);
    setLocale((current) => (overview.config.locales.some((locale) => locale.code === current) ? current : overview.config.defaultCode));
  }, []);

  const applyLocale = useCallback((data: LocaleData) => {
    setCatalog(data.catalog);
    setRows(data.rows);
    setVersions(data.versions);
  }, []);

  // Data source changed: start over.
  useEffect(() => {
    let alive = true;
    setError(null);
    setConfig(null);
    setCatalog(null);
    setRows([]);
    setVersions([]);
    fetchOverview(client)
      .then((overview) => alive && applyOverview(overview))
      .catch((error) => alive && setError(describe(error)));
    return () => {
      alive = false;
    };
  }, [client, applyOverview]);

  // Selected locale (or the fallback chain, via the default) changed.
  useEffect(() => {
    if (!locale || !defaultCode) return;
    let alive = true;
    fetchLocale(client, locale, defaultCode)
      .then((data) => alive && applyLocale(data))
      .catch((error) => alive && setError(describe(error)));
    return () => {
      alive = false;
    };
  }, [client, locale, defaultCode, applyLocale]);

  useEffect(() => {
    let alive = true;
    client
      .audit(auditLocale === ALL_LOCALES ? undefined : auditLocale)
      .then((entries) => alive && setAudit(entries))
      .catch((error) => alive && setError(describe(error)));
    return () => {
      alive = false;
    };
  }, [client, auditLocale]);

  const refreshLocale = useCallback(() => fetchLocale(client, locale, defaultCode).then(applyLocale), [client, locale, defaultCode, applyLocale]);
  const refreshAudit = useCallback(
    () => client.audit(auditLocale === ALL_LOCALES ? undefined : auditLocale).then(setAudit),
    [client, auditLocale],
  );

  async function run<T>(action: () => Promise<T>, refresh: () => Promise<void>): Promise<T> {
    setBusy(true);
    try {
      const result = await action();
      await Promise.all([refresh(), refreshAudit(), fetchOverview(client).then(applyOverview)]);
      // Not awaited: the running app picks up the new strings, but the admin screen must not wait on it.
      void i18n.reload().catch(() => undefined);
      return result;
    } catch (error) {
      // A 409 refetches too, so the caller sees the version it lost to.
      if (isConflict(error)) await refreshLocale().catch(() => undefined);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  const why = reason.trim() || undefined;

  const setEntry = (key: string, value: string): Promise<EntryChange> =>
    run(() => client.setEntry(locale, key, value, actor, why, catalog?.version), refreshLocale);

  const deleteEntry = (key: string): Promise<EntryChange> => run(() => client.deleteEntry(locale, key, actor, why, catalog?.version), refreshLocale);

  const rollback = (toVersion: number): Promise<RollbackResult> => run(() => client.rollback(locale, toVersion, actor, why), refreshLocale);

  const saveConfig = (next: I18nConfig): Promise<I18nConfig> => run(() => client.saveConfig(next, actor, why), refreshLocale);

  return {
    mode: dataSource.mode,
    config,
    locales,
    locale,
    selectLocale: setLocale,
    catalog,
    rows,
    versions,
    audit,
    auditLocale,
    setAuditLocale,
    busy,
    error,
    actor,
    setActor,
    reason,
    setReason,
    setEntry,
    deleteEntry,
    rollback,
    saveConfig,
  };
}

export type TranslationsAdmin = ReturnType<typeof useTranslationsAdmin>;
