// Pure mirror of src/Atlas.Api/I18nCatalog.cs; wire shapes are in web/packages/core/README.md ("Backend i18n contract").

export interface Catalog {
  code: string;
  name: string;
  version: number;
  entries: Record<string, string>;
}

export interface LocaleSummary {
  code: string;
  name: string;
  version: number;
  enabled: true;
}

export interface LocaleConfig {
  code: string;
  name: string;
  enabled: boolean;
  fallbackCode: string | null;
}

export interface I18nConfig {
  defaultCode: string;
  locales: LocaleConfig[];
}

export type AuditAction = 'set' | 'delete' | 'rollback' | 'config' | 'create';

export interface VersionSummary {
  version: number;
  createdAt: string;
  actor: string;
  action: AuditAction;
  reason: string | null;
  changedKeys: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  locale: string | null;
  version: number | null;
  action: AuditAction;
  key: string | null;
  before: string | null;
  after: string | null;
  reason: string | null;
}

export interface EntryChange {
  code: string;
  version: number;
  key: string;
  before: string | null;
  after: string | null;
}

export interface RollbackResult {
  code: string;
  version: number;
  restoredFrom: number;
}

export interface Mutation {
  next: Catalog;
  entry: AuditEntry;
  changedKeys: string[];
}

export const DEFAULT_CODE = 'en';
export const SYSTEM_ACTOR = 'system';
export const KEY_MAX_LENGTH = 120;

const CODE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const KEY_PATTERN = /^[a-z0-9]+(\.[a-zA-Z0-9]+)*$/;

// Validators return null when valid, otherwise the reason.

export function validateCode(code: string): string | null {
  return CODE_PATTERN.test(code) ? null : `Locale code '${code}' is invalid: use xx or xx-XX.`;
}

export function validateKey(key: string): string | null {
  if (key.length === 0 || key.length > KEY_MAX_LENGTH || !KEY_PATTERN.test(key)) {
    return `Key '${key}' is invalid: use ^[a-z0-9]+(\\.[a-zA-Z0-9]+)*$, at most ${KEY_MAX_LENGTH} characters.`;
  }
  return null;
}

export function validateActor(actor: string): string | null {
  return actor.trim().length > 0 ? null : 'actor is required.';
}

/** Cycles in fallback chains are allowed — resolution is cycle-safe (see fallbackChain). */
export function validateConfig(config: I18nConfig, knownCodes: ReadonlySet<string>): string | null {
  if (config.locales.length === 0) return 'config must list at least one locale.';

  const seen = new Set<string>();
  for (const locale of config.locales) {
    if (validateCode(locale.code)) return `Locale code '${locale.code}' is invalid.`;
    if (!knownCodes.has(locale.code)) return `Locale '${locale.code}' is unknown (no ${locale.code}.json).`;
    if (seen.has(locale.code)) return `Locale '${locale.code}' is listed twice.`;
    seen.add(locale.code);
    if (locale.fallbackCode === locale.code) return `Locale '${locale.code}' cannot fall back to itself.`;
  }
  for (const locale of config.locales) {
    if (locale.fallbackCode !== null && !seen.has(locale.fallbackCode)) {
      return `Fallback '${locale.fallbackCode}' of '${locale.code}' is not a listed locale.`;
    }
  }
  if (validateCode(config.defaultCode) || !seen.has(config.defaultCode)) {
    return `Default locale '${config.defaultCode}' is not a listed locale.`;
  }
  if (!config.locales.find((locale) => locale.code === config.defaultCode)!.enabled) return 'The default locale must be enabled.';
  return null;
}

/** Locale codes with the default first, then alphabetical. */
export function sortCodes(codes: Iterable<string>, defaultCode = DEFAULT_CODE): string[] {
  return [...codes].sort((first, second) => Number(second === defaultCode) - Number(first === defaultCode) || (first < second ? -1 : first > second ? 1 : 0));
}

/** Own entries win, then the first fallback (nearest first) that has the key. */
export function withFallback(entries: Record<string, string>, fallbacks: Record<string, string>[]): Record<string, string> {
  const merged: Record<string, string> = {};
  for (let index = fallbacks.length - 1; index >= 0; index--) Object.assign(merged, fallbacks[index]);
  return Object.assign(merged, entries);
}

/** Fallbacks for `code`, nearest first, ending with the default; a disabled locale is skipped but its own fallback is still followed. */
export function fallbackChain(config: I18nConfig, code: string): string[] {
  const byCode = new Map(config.locales.map((locale) => [locale.code, locale]));
  const chain: string[] = [];
  const visited = new Set([code]);

  let next = byCode.get(code)?.fallbackCode ?? null;
  while (next !== null && !visited.has(next)) {
    visited.add(next);
    const locale = byCode.get(next);
    if (locale && (locale.enabled || next === config.defaultCode)) chain.push(next);
    next = locale?.fallbackCode ?? null;
  }
  if (!visited.has(config.defaultCode)) chain.push(config.defaultCode);
  return chain;
}

export function changedKeys(before: Record<string, string>, after: Record<string, string>): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => before[key] !== after[key]).sort();
}

// Writing an unchanged value is deliberately still a new version: every accepted write is one version and one audit line.

export function setEntry(current: Catalog, key: string, value: string, actor: string, reason: string | null, now: string): Mutation {
  const before = current.entries[key] ?? null;
  const entries = { ...current.entries, [key]: value };
  return next(current, entries, 'set', key, before, value, actor, reason, now, [key]);
}

/** Throws when the key is not in the catalog. */
export function deleteEntry(current: Catalog, key: string, actor: string, reason: string | null, now: string): Mutation {
  if (!(key in current.entries)) throw new Error(`Key '${key}' is not in locale '${current.code}'.`);
  const { [key]: before, ...entries } = current.entries;
  return next(current, entries, 'delete', key, before, null, actor, reason, now, [key]);
}

/** Restore a snapshot's entries as a NEW version; before/after name the versions replaced and restored. */
export function rollback(current: Catalog, snapshot: Catalog, actor: string, reason: string | null, now: string): Mutation {
  if (snapshot.code !== current.code) throw new Error(`Snapshot is of locale '${snapshot.code}', not '${current.code}'.`);
  const entries = { ...snapshot.entries };
  return next(current, entries, 'rollback', null, String(current.version), String(snapshot.version), actor, reason, now, changedKeys(current.entries, snapshot.entries));
}

export function newAuditEntry(
  id: string,
  now: string,
  actor: string,
  locale: string | null,
  version: number | null,
  action: AuditAction,
  key: string | null,
  before: string | null,
  after: string | null,
  reason: string | null,
): AuditEntry {
  return { id, timestamp: now, actor, locale, version, action, key, before, after, reason };
}

function next(
  current: Catalog,
  entries: Record<string, string>,
  action: AuditAction,
  key: string | null,
  before: string | null,
  after: string | null,
  actor: string,
  reason: string | null,
  now: string,
  changed: string[],
): Mutation {
  const version = current.version + 1;
  const entry = newAuditEntry(`${current.code}@${version}`, now, actor, current.code, version, action, key, before, after, reason);
  return { next: { ...current, version, entries }, entry, changedKeys: changed };
}
