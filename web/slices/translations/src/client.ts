import { fallbackEn } from '@atlas/i18n';
import { getJson, postJson } from '@atlas/platform';
import type { AuditAction, AuditEntry, Catalog, EntryChange, I18nConfig, LocaleSummary, Mutation, RollbackResult, VersionSummary } from './catalog';
import * as rules from './catalog';

export interface TranslationsClient {
  config(): Promise<I18nConfig>;
  saveConfig(config: I18nConfig, actor: string, reason?: string): Promise<I18nConfig>;
  locales(): Promise<LocaleSummary[]>;
  catalog(code: string, version?: number): Promise<Catalog>;
  versions(code: string): Promise<VersionSummary[]>;
  snapshot(code: string, version: number): Promise<Catalog>;
  setEntry(code: string, key: string, value: string, actor: string, reason?: string, ifMatch?: number): Promise<EntryChange>;
  deleteEntry(code: string, key: string, actor: string, reason?: string, ifMatch?: number): Promise<EntryChange>;
  rollback(code: string, toVersion: number, actor: string, reason?: string): Promise<RollbackResult>;
  audit(locale?: string, limit?: number): Promise<AuditEntry[]>;
}

/** A refused request, with the backend's status. 409 carries the version the catalog is at now. */
export class TranslationsRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly currentVersion?: number,
  ) {
    super(message);
    this.name = 'TranslationsRequestError';
  }
}

export function isConflict(error: unknown): error is TranslationsRequestError & { currentVersion: number } {
  return error instanceof TranslationsRequestError && error.status === 409;
}

// In-memory twin of src/Atlas.Api/I18nStore; every mutation goes through catalog.ts.

interface Snapshot extends Catalog {
  createdAt: string;
  actor: string;
  action: AuditAction;
  reason: string | null;
  changedKeys: string[];
}

interface ConfigFile {
  defaultCode: string;
  locales: { code: string; enabled: boolean; fallbackCode: string | null }[];
}

interface MockState {
  catalogs: Map<string, Catalog>;
  snapshots: Map<string, Map<number, Snapshot>>;
  config: ConfigFile;
  audit: AuditEntry[];
}

const SEED_TIME = '2026-01-05T09:00:00.000Z';

// A few real strings from src/Atlas.Api/i18n/de.json; the rest is copied from en.
const GERMAN: Record<string, string> = {
  'app.subtitle': 'Zentrales Fondsmanagement',
  'nav.commitCapital': 'Kapital zusagen',
  'nav.hierarchy': 'Fonds & Hierarchie',
  'nav.appetite': 'Risikobudget',
  'nav.workspace': 'Arbeitsbereich',
  'nav.dealPipeline': 'Deal-Pipeline',
  'nav.group.construction': 'Fondsaufbau',
  'nav.group.management': 'Fondsmanagement',
  'nav.group.platform': 'Plattform',
  'header.source': 'Daten',
  'header.language': 'Sprache',
  'commit.title': 'Kapital zusagen',
  'commit.tagline': 'Kapital einer Co-Investition zusagen, gegen Upstream-Systeme geprüft',
  'commit.approved': 'Genehmigt',
  'commit.rejected': 'Abgelehnt',
  'hier.back': 'Zurück',
  'ws.title': 'Arbeitsbereich',
  'dp.title': 'Deal-Pipeline',
  'stage.closed': 'Geschlossen',
};

function seed(): MockState {
  const english: Catalog = { code: 'en', name: fallbackEn.name, version: 1, entries: { ...fallbackEn.entries } };
  const german: Catalog = { code: 'de', name: 'Deutsch', version: 1, entries: { ...fallbackEn.entries, ...GERMAN } };
  return {
    catalogs: new Map([
      ['en', english],
      ['de', german],
    ]),
    snapshots: new Map(),
    config: {
      defaultCode: 'en',
      locales: [
        { code: 'en', enabled: true, fallbackCode: null },
        { code: 'de', enabled: true, fallbackCode: 'en' },
      ],
    },
    audit: [],
  };
}

const state = seed();
const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const now = () => new Date().toISOString();
const notFound = (message: string) => new TranslationsRequestError(message, 404);
const badRequest = (message: string) => new TranslationsRequestError(message, 400);

/** _config.json merged with the catalogs present: names come from the catalog, unlisted locales are enabled. */
function effectiveConfig(): I18nConfig {
  const configured = new Map(state.config.locales.map((locale) => [locale.code, locale]));
  const defaultCode = state.config.defaultCode;
  return {
    defaultCode,
    locales: rules.sortCodes(state.catalogs.keys(), defaultCode).map((code) => {
      const locale = configured.get(code);
      const name = state.catalogs.get(code)!.name;
      return locale ? { code, name, enabled: locale.enabled, fallbackCode: locale.fallbackCode } : { code, name, enabled: true, fallbackCode: code === defaultCode ? null : defaultCode };
    }),
  };
}

function toSummary(snapshot: Snapshot): VersionSummary {
  return { version: snapshot.version, createdAt: snapshot.createdAt, actor: snapshot.actor, action: snapshot.action, reason: snapshot.reason, changedKeys: snapshot.changedKeys };
}

/** The snapshot a never-mutated catalog becomes the first time it is written. */
function seedSnapshot(current: Catalog): Snapshot {
  return {
    ...current,
    entries: { ...current.entries },
    createdAt: SEED_TIME,
    actor: rules.SYSTEM_ACTOR,
    action: 'create',
    reason: `seeded from ${current.code}.json`,
    changedKeys: Object.keys(current.entries).sort(),
  };
}

function snapshotOrCurrent(code: string, version: number, current: Catalog): Catalog | null {
  const snapshot = state.snapshots.get(code)?.get(version);
  return snapshot ? { code, name: snapshot.name, version: snapshot.version, entries: { ...snapshot.entries } } : version === current.version ? current : null;
}

function readCatalog(code: string, version?: number): Catalog {
  const current = state.catalogs.get(code);
  if (!current) throw notFound(`Locale '${code}' not found.`);
  const own = version === undefined ? current : snapshotOrCurrent(code, version, current);
  if (!own) throw notFound(`Version ${version} of locale '${code}' not found.`);
  const fallbacks = rules
    .fallbackChain(effectiveConfig(), code)
    .map((fallbackCode) => state.catalogs.get(fallbackCode)?.entries)
    .filter((entries): entries is Record<string, string> => entries !== undefined);
  return { ...own, entries: rules.withFallback(own.entries, fallbacks) };
}

/** Before a locale's first mutation its current version has no snapshot: record it, and say so in the audit. */
function ensureSnapshot(current: Catalog) {
  const history = state.snapshots.get(current.code) ?? new Map<number, Snapshot>();
  state.snapshots.set(current.code, history);
  if (history.has(current.version)) return;
  const snapshot = seedSnapshot(current);
  history.set(current.version, snapshot);
  state.audit.push(rules.newAuditEntry(`${current.code}@${current.version}`, now(), rules.SYSTEM_ACTOR, current.code, current.version, 'create', null, null, null, snapshot.reason));
}

/** The one write path: check If-Match, apply the pure function, then persist snapshot → current → audit. */
function mutate<T>(code: string, ifMatch: number | undefined, apply: (current: Catalog) => Mutation, project: (mutation: Mutation) => T): T {
  const current = state.catalogs.get(code);
  if (!current) throw notFound(`Locale '${code}' not found.`);
  if (ifMatch !== undefined && ifMatch !== current.version) {
    throw new TranslationsRequestError(`If-Match does not equal the current version (${current.version}).`, 409, current.version);
  }
  const mutation = apply(current);
  ensureSnapshot(current);
  state.snapshots.get(code)!.set(mutation.next.version, { ...mutation.next, createdAt: mutation.entry.timestamp, actor: mutation.entry.actor, action: mutation.entry.action, reason: mutation.entry.reason, changedKeys: mutation.changedKeys });
  state.catalogs.set(code, mutation.next);
  state.audit.push(mutation.entry);
  return project(mutation);
}

function requireActor(actor: string) {
  const error = rules.validateActor(actor);
  if (error) throw badRequest(error);
}

/** Deterministic, offline. Mirrors the backend seed + rules. */
export const mockClient: TranslationsClient = {
  async config() {
    await delay(40);
    return effectiveConfig();
  },
  async saveConfig(config, actor, reason) {
    await delay(80);
    requireActor(actor);
    const error = rules.validateConfig(config, new Set(state.catalogs.keys()));
    if (error) throw badRequest(error);
    const before = JSON.stringify(state.config);
    state.config = { defaultCode: config.defaultCode, locales: config.locales.map(({ code, enabled, fallbackCode }) => ({ code, enabled, fallbackCode })) };
    state.audit.push(rules.newAuditEntry(`config@${Date.now()}`, now(), actor, null, null, 'config', null, before, JSON.stringify(state.config), reason ?? null));
    return effectiveConfig();
  },
  async locales() {
    await delay(40);
    return effectiveConfig()
      .locales.filter((locale) => locale.enabled)
      .map((locale) => ({ code: locale.code, name: locale.name, version: state.catalogs.get(locale.code)!.version, enabled: true }));
  },
  async catalog(code, version) {
    await delay(60);
    return readCatalog(code, version);
  },
  async versions(code) {
    await delay(60);
    const current = state.catalogs.get(code);
    if (!current) throw notFound(`Locale '${code}' not found.`);
    const summaries = [...(state.snapshots.get(code)?.values() ?? [])].map(toSummary);
    if (!summaries.some((summary) => summary.version === current.version)) summaries.push(toSummary(seedSnapshot(current)));
    return summaries.sort((first, second) => second.version - first.version);
  },
  async snapshot(code, version) {
    await delay(60);
    const current = state.catalogs.get(code);
    const snapshot = current && snapshotOrCurrent(code, version, current);
    if (!snapshot) throw notFound(`Version ${version} of locale '${code}' not found.`);
    return snapshot;
  },
  async setEntry(code, key, value, actor, reason, ifMatch) {
    await delay(100);
    requireActor(actor);
    const invalid = rules.validateKey(key);
    if (invalid) throw badRequest(invalid);
    return mutate(
      code,
      ifMatch,
      (current) => rules.setEntry(current, key, value, actor, reason ?? null, now()),
      (mutation) => ({ code, version: mutation.next.version, key, before: mutation.entry.before, after: mutation.entry.after }),
    );
  },
  async deleteEntry(code, key, actor, reason, ifMatch) {
    await delay(100);
    requireActor(actor);
    return mutate(
      code,
      ifMatch,
      (current) => {
        if (!(key in current.entries)) throw notFound(`Key '${key}' not found in locale '${code}'.`);
        return rules.deleteEntry(current, key, actor, reason ?? null, now());
      },
      (mutation) => ({ code, version: mutation.next.version, key, before: mutation.entry.before, after: mutation.entry.after }),
    );
  },
  async rollback(code, toVersion, actor, reason) {
    await delay(120);
    requireActor(actor);
    return mutate(
      code,
      undefined,
      (current) => {
        const snapshot = snapshotOrCurrent(code, toVersion, current);
        if (!snapshot) throw notFound(`Version ${toVersion} of locale '${code}' not found.`);
        return rules.rollback(current, snapshot, actor, reason ?? null, now());
      },
      (mutation) => ({ code, version: mutation.next.version, restoredFrom: toVersion }),
    );
  },
  async audit(locale, limit = 100) {
    await delay(60);
    const entries = locale ? state.audit.filter((entry) => entry.locale === locale) : state.audit;
    return entries.slice(-limit).reverse();
  },
};

/** PUT/DELETE with a JSON body and an optional If-Match: "N" — the platform helpers only cover GET/POST. */
async function sendJson<T, TBody>(method: 'PUT' | 'DELETE', url: string, body: TBody, ifMatch?: number): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (ifMatch !== undefined) headers['if-match'] = `"${ifMatch}"`;
  const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
  if (!res.ok) throw await toRequestError(method, url, res);
  return (await res.json()) as T;
}

const putJson = <T, TBody>(url: string, body: TBody, ifMatch?: number) => sendJson<T, TBody>('PUT', url, body, ifMatch);
const deleteJson = <T, TBody>(url: string, body: TBody, ifMatch?: number) => sendJson<T, TBody>('DELETE', url, body, ifMatch);

/** The backend answers { error } (and { currentVersion } on 409); fall back to the status line. */
async function toRequestError(method: string, url: string, res: Response): Promise<TranslationsRequestError> {
  let error: string | undefined;
  let currentVersion: number | undefined;
  try {
    const body = (await res.json()) as { error?: string; currentVersion?: number };
    error = body.error;
    currentVersion = body.currentVersion;
  } catch {
    /* no JSON body */
  }
  return new TranslationsRequestError(error ?? `${method} ${url} -> ${res.status} ${res.statusText}`, res.status, currentVersion);
}

/** Calls the live ASP.NET i18n API (src/Atlas.Api). */
export function makeApiClient(baseUrl: string): TranslationsClient {
  const root = `${baseUrl}/i18n`;
  const entry = (code: string, key: string) => `${root}/${encodeURIComponent(code)}/entries/${encodeURIComponent(key)}`;
  return {
    config: () => getJson<I18nConfig>(`${root}/config`),
    saveConfig: (config, actor, reason) => putJson(`${root}/config`, { config, actor, reason }),
    locales: () => getJson<LocaleSummary[]>(`${root}/locales`),
    catalog: (code, version) => getJson<Catalog>(`${root}/${encodeURIComponent(code)}${version === undefined ? '' : `?version=${version}`}`),
    versions: (code) => getJson<VersionSummary[]>(`${root}/${encodeURIComponent(code)}/versions`),
    snapshot: (code, version) => getJson<Catalog>(`${root}/${encodeURIComponent(code)}/versions/${version}`),
    setEntry: (code, key, value, actor, reason, ifMatch) => putJson(entry(code, key), { value, actor, reason }, ifMatch),
    deleteEntry: (code, key, actor, reason, ifMatch) => deleteJson(entry(code, key), { actor, reason }, ifMatch),
    rollback: (code, toVersion, actor, reason) => postJson<RollbackResult>(`${root}/${encodeURIComponent(code)}/rollback`, { toVersion, actor, reason }),
    audit: (locale, limit = 100) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (locale) params.set('locale', locale);
      return getJson<AuditEntry[]>(`${root}/audit?${params}`);
    },
  };
}
