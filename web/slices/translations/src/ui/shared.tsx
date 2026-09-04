import { StatusPill } from '@atlas/core';
import type { PillTone, SelectOption } from '@atlas/core';
import { useT } from '@atlas/i18n';
import type { AuditAction, I18nConfig } from '../catalog';
import { isConflict } from '../client';

export type Translate = ReturnType<typeof useT>;

const TONE: Record<AuditAction, PillTone> = { set: 'info', delete: 'danger', rollback: 'warning', config: 'neutral', create: 'success' };

export function ActionPill({ action }: { action: AuditAction }) {
  const translate = useT();
  return <StatusPill tone={TONE[action] ?? 'neutral'}>{translate(`tr.action.${action}`, action)}</StatusPill>;
}

export const localeOptions = (config: I18nConfig): SelectOption[] => config.locales.map((locale) => ({ value: locale.code, label: `${locale.name} (${locale.code})` }));

export const formatTime = (iso: string) => new Date(iso).toLocaleString();

/** "Saved {key} as v{version}" → with the named values filled in. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));

/** A 409 is explained as the version the catalog moved to; anything else is its message. */
export function describeError(error: unknown, translate: Translate): string {
  if (isConflict(error)) return fill(translate('tr.toast.conflict', 'Catalog changed to v{version} — reload'), { version: error.currentVersion });
  return error instanceof Error ? error.message : String(error);
}
