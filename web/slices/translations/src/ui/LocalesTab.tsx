import { useEffect, useState } from 'react';
import { Button, DataGrid, Mono, Select, Stack, Switch, useToast } from '@atlas/core';
import type { GridColDef } from '@atlas/core';
import { useT } from '@atlas/i18n';
import type { I18nConfig, LocaleConfig } from '../catalog';
import type { TranslationsAdmin } from '../useTranslationsAdmin';
import { describeError, localeOptions } from './shared';

export interface LocalesTabProps {
  admin: TranslationsAdmin;
  config: I18nConfig;
}

interface LocaleRow extends LocaleConfig {
  /** Known for enabled locales only (GET /i18n/locales lists those). */
  version: number | null;
}

// A sentinel, since MUI shows nothing for an empty select value. Codes are xx or xx-XX, so no clash.
const NO_FALLBACK = 'none';

/** Edits a draft of the config in place; "Save configuration" sends the whole thing. */
export function LocalesTab({ admin, config }: LocalesTabProps) {
  const translate = useT();
  const toast = useToast();
  const { locales, busy, saveConfig } = admin;
  const [draft, setDraft] = useState<I18nConfig>(config);

  // A fresh server config (after a save, or a data-source switch) replaces the draft.
  useEffect(() => setDraft(config), [config]);

  const patch = (code: string, change: Partial<LocaleConfig>) =>
    setDraft((current) => ({ ...current, locales: current.locales.map((locale) => (locale.code === code ? { ...locale, ...change } : locale)) }));

  const rows: LocaleRow[] = draft.locales.map((locale) => ({ ...locale, version: locales.find((summary) => summary.code === locale.code)?.version ?? null }));

  const fallbackOptions = (code: string) => [
    { value: NO_FALLBACK, label: translate('tr.noFallback', '— none —') },
    ...draft.locales.filter((locale) => locale.code !== code).map((locale) => ({ value: locale.code, label: `${locale.name} (${locale.code})` })),
  ];

  const columns: GridColDef<LocaleRow>[] = [
    { field: 'code', headerName: translate('tr.col.code', 'Code'), width: 100, display: 'flex', renderCell: (params) => <Mono>{params.row.code}</Mono> },
    { field: 'name', headerName: translate('tr.col.name', 'Name'), flex: 1 },
    {
      field: 'enabled',
      headerName: translate('tr.col.enabled', 'Enabled'),
      width: 110,
      display: 'flex',
      renderCell: (params) => (
        <Switch
          size="small"
          checked={params.row.enabled}
          onChange={(_, checked) => patch(params.row.code, { enabled: checked })}
          slotProps={{ input: { 'aria-label': `${translate('tr.col.enabled', 'Enabled')} ${params.row.code}` } }}
        />
      ),
    },
    {
      field: 'fallbackCode',
      headerName: translate('tr.col.fallback', 'Fallback'),
      width: 220,
      display: 'flex',
      renderCell: (params) => (
        <Select
          value={params.row.fallbackCode ?? NO_FALLBACK}
          options={fallbackOptions(params.row.code)}
          onChange={(selected) => patch(params.row.code, { fallbackCode: selected === NO_FALLBACK ? null : selected })}
          aria-label={`${translate('tr.col.fallback', 'Fallback')} ${params.row.code}`}
        />
      ),
    },
    { field: 'version', headerName: translate('tr.col.version', 'Version'), width: 100, valueFormatter: (value: number | null) => (value === null ? '—' : `v${value}`) },
  ];

  async function save() {
    try {
      await saveConfig(draft);
      toast.show(translate('tr.toast.configSaved', 'Configuration saved'), 'success');
    } catch (error) {
      toast.show(describeError(error, translate), 'error');
    }
  }

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row">
        <Select
          label={translate('tr.defaultLocale', 'Default locale')}
          value={draft.defaultCode}
          options={localeOptions(draft)}
          onChange={(defaultCode) => setDraft((current) => ({ ...current, defaultCode }))}
          fullWidth={false}
          sx={{ minWidth: 220 }}
        />
      </Stack>

      <DataGrid<LocaleRow> rows={rows} columns={columns} idField="code" density="standard" toolbar={false} emptyMessage={translate('tr.empty.locales', 'No locales configured')} />

      <Stack direction="row">
        <Button onClick={save} loading={busy}>
          {translate('tr.saveConfig', 'Save configuration')}
        </Button>
      </Stack>
    </Stack>
  );
}
