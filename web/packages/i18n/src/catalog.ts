import { getJson } from '@atlas/platform';
import { fallbackEn } from './fallback';

export type CatalogSource = 'backend' | 'fallback';

export interface LocaleInfo {
  code: string;
  name: string;
  version?: number;
}

export interface Catalog {
  code: string;
  name: string;
  version: number;
  entries: Record<string, string>;
}

export interface LoadedCatalog {
  entries: Record<string, string>;
  source: CatalogSource;
  version: number | null;
}

export const OFFLINE_LOCALES: LocaleInfo[] = [{ code: fallbackEn.code, name: fallbackEn.name }];
export const OFFLINE_CATALOG: LoadedCatalog = { entries: fallbackEn.entries, source: 'fallback', version: null };

export async function fetchLocales(apiBaseUrl: string): Promise<LocaleInfo[] | null> {
  try {
    const list = await getJson<LocaleInfo[]>(`${apiBaseUrl}/i18n/locales`);
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

export async function fetchCatalog(apiBaseUrl: string, code: string): Promise<Catalog | null> {
  try {
    return await getJson<Catalog>(`${apiBaseUrl}/i18n/${code}`);
  } catch {
    return null;
  }
}
