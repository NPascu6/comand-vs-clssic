import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fallbackEn } from './fallback';

// ---------------------------------------------------------------------------
// Translations are a BACKEND capability. This provider:
//   1. discovers available locales from GET /api/i18n/locales, so a language
//      added on the backend appears in the switcher with NO frontend change;
//   2. loads the chosen locale from GET /api/i18n/{code};
//   3. falls back to the bundled English if the backend is unreachable.
// The frontend never hard-codes a non-English string or a language list.
// ---------------------------------------------------------------------------

export interface LocaleInfo {
  code: string;
  name: string;
}

interface Catalog {
  code: string;
  name: string;
  entries: Record<string, string>;
}

interface I18nState {
  locale: string;
  locales: LocaleInfo[];
  entries: Record<string, string>;
  setLocale: (code: string) => void;
  /** where the current catalog came from — useful to show "backend" vs "offline". */
  source: 'backend' | 'fallback';
}

const I18nContext = createContext<I18nState>({
  locale: 'en',
  locales: [{ code: 'en', name: 'English' }],
  entries: fallbackEn.entries,
  setLocale: () => {},
  source: 'fallback',
});

export function I18nProvider({ apiBaseUrl, children }: { apiBaseUrl: string; children: ReactNode }) {
  const [locale, setLocaleState] = useState('en');
  const [locales, setLocales] = useState<LocaleInfo[]>([{ code: 'en', name: 'English' }]);
  const [entries, setEntries] = useState<Record<string, string>>(fallbackEn.entries);
  const [source, setSource] = useState<'backend' | 'fallback'>('fallback');

  // Discover the language list from the backend (the dynamic, data-driven part).
  useEffect(() => {
    let alive = true;
    fetch(`${apiBaseUrl}/i18n/locales`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((ls: LocaleInfo[]) => {
        if (alive && Array.isArray(ls) && ls.length) setLocales(ls);
      })
      .catch(() => {
        /* offline — keep the bundled English-only list */
      });
    return () => {
      alive = false;
    };
  }, [apiBaseUrl]);

  const setLocale = useCallback(
    (code: string) => {
      setLocaleState(code);
      fetch(`${apiBaseUrl}/i18n/${code}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((cat: Catalog) => {
          setEntries(cat.entries);
          setSource('backend');
        })
        .catch(() => {
          // backend unreachable: only English is guaranteed offline
          if (code === 'en') {
            setEntries(fallbackEn.entries);
            setSource('fallback');
          }
        });
    },
    [apiBaseUrl],
  );

  return (
    <I18nContext.Provider value={{ locale, locales, entries, setLocale, source }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nState {
  return useContext(I18nContext);
}

/** Returns a translate function: t('commit.title') -> localized string (falls back to the key). */
export function useT(): (key: string, fallback?: string) => string {
  const { entries } = useContext(I18nContext);
  return (key: string, fallback?: string) => entries[key] ?? fallback ?? key;
}
