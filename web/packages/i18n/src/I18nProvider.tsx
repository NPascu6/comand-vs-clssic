import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fallbackEn } from './fallback';
import { fetchCatalog, fetchLocales, OFFLINE_CATALOG, OFFLINE_LOCALES } from './catalog';
import type { Catalog, CatalogSource, LoadedCatalog, LocaleInfo } from './catalog';

export type { LocaleInfo } from './catalog';

interface I18nState {
  locale: string;
  locales: LocaleInfo[];
  entries: Record<string, string>;
  setLocale: (code: string) => void;
  source: CatalogSource;
  version: number | null;
  reload: () => Promise<void>;
}

const I18nContext = createContext<I18nState>({
  locale: fallbackEn.code,
  locales: OFFLINE_LOCALES,
  entries: fallbackEn.entries,
  setLocale: () => {},
  source: 'fallback',
  version: null,
  reload: async () => {},
});

export function I18nProvider({ apiBaseUrl, children }: { apiBaseUrl: string; children: ReactNode }) {
  const [locale, setLocale] = useState(fallbackEn.code);
  const [locales, setLocales] = useState<LocaleInfo[]>(OFFLINE_LOCALES);
  const [loaded, setLoaded] = useState<LoadedCatalog>(OFFLINE_CATALOG);

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

export function useT(): (key: string, fallback?: string) => string {
  const { entries } = useContext(I18nContext);
  return useCallback((key: string, fallback?: string) => entries[key] ?? fallback ?? key, [entries]);
}
