import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getJson } from '@atlas/platform';
import { fallbackEn } from './fallback';

// Locales and catalogs are backend data; the bundled English exists only as the offline fallback.

export interface LocaleInfo {
  code: string;
  name: string;
  version?: number;
}

interface Catalog {
  code: string;
  name: string;
  version: number;
  entries: Record<string, string>;
}

interface Loaded {
  entries: Record<string, string>;
  source: 'backend' | 'fallback';
  version: number | null;
}

interface I18nState {
  locale: string;
  locales: LocaleInfo[];
  entries: Record<string, string>;
  setLocale: (code: string) => void;
  /** Where the current catalog came from, e.g. to show "backend" vs "offline". */
  source: 'backend' | 'fallback';
  /** The backend's catalog version; null while on the bundled fallback. */
  version: number | null;
  /** Re-fetches the locale list and the current catalog, e.g. after an edit. */
  reload: () => Promise<void>;
}

const OFFLINE_LOCALES: LocaleInfo[] = [{ code: fallbackEn.code, name: fallbackEn.name }];
const OFFLINE_CATALOG: Loaded = { entries: fallbackEn.entries, source: 'fallback', version: null };

const I18nContext = createContext<I18nState>({
  locale: fallbackEn.code,
  locales: OFFLINE_LOCALES,
  entries: fallbackEn.entries,
  setLocale: () => {},
  source: 'fallback',
  version: null,
  reload: async () => {},
});

async function fetchLocales(apiBaseUrl: string): Promise<LocaleInfo[] | null> {
  try {
    const list = await getJson<LocaleInfo[]>(`${apiBaseUrl}/i18n/locales`);
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

async function fetchCatalog(apiBaseUrl: string, code: string): Promise<Catalog | null> {
  try {
    return await getJson<Catalog>(`${apiBaseUrl}/i18n/${code}`);
  } catch {
    return null;
  }
}

export function I18nProvider({ apiBaseUrl, children }: { apiBaseUrl: string; children: ReactNode }) {
  const [locale, setLocale] = useState(fallbackEn.code);
  const [locales, setLocales] = useState<LocaleInfo[]>(OFFLINE_LOCALES);
  const [loaded, setLoaded] = useState<Loaded>(OFFLINE_CATALOG);

  // Backend unreachable: only English is guaranteed offline; other locales keep what they had.
  const applyCatalog = useCallback((code: string, catalog: Catalog | null) => {
    if (catalog) setLoaded({ entries: catalog.entries, source: 'backend', version: catalog.version ?? null });
    else if (code === fallbackEn.code) setLoaded(OFFLINE_CATALOG);
  }, []);

  useEffect(() => {
    void fetchLocales(apiBaseUrl).then((list) => {
      if (list) setLocales(list);
    });
  }, [apiBaseUrl]);

  // A response superseded by a newer locale change is dropped.
  useEffect(() => {
    let stale = false;
    void fetchCatalog(apiBaseUrl, locale).then((catalog) => {
      if (!stale) applyCatalog(locale, catalog);
    });
    return () => {
      stale = true;
    };
  }, [apiBaseUrl, locale, applyCatalog]);

  const reload = useCallback(async () => {
    const [list, catalog] = await Promise.all([fetchLocales(apiBaseUrl), fetchCatalog(apiBaseUrl, locale)]);
    if (list) setLocales(list);
    applyCatalog(locale, catalog);
  }, [apiBaseUrl, locale, applyCatalog]);

  const value = useMemo<I18nState>(
    () => ({ locale, locales, entries: loaded.entries, source: loaded.source, version: loaded.version, setLocale, reload }),
    [locale, locales, loaded, reload],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  return useContext(I18nContext);
}

/** translate('commit.title', 'Commit Capital') -> the localized string, else the fallback, else the key. */
export function useT(): (key: string, fallback?: string) => string {
  const { entries } = useContext(I18nContext);
  return useCallback((key: string, fallback?: string) => entries[key] ?? fallback ?? key, [entries]);
}
