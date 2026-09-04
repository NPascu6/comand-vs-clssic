import { DataGrid, Mono, Select, Stack } from '@atlas/core';
import type { GridColDef } from '@atlas/core';
import { useT } from '@atlas/i18n';
import type { AuditEntry, I18nConfig } from '../catalog';
import { ALL_LOCALES } from '../useTranslationsAdmin';
import type { TranslationsAdmin } from '../useTranslationsAdmin';
import { ActionPill, formatTime, localeOptions } from './shared';

export interface AuditTabProps {
  admin: TranslationsAdmin;
  config: I18nConfig;
}

/** The append-only trail, newest first. Config lines carry the whole config before/after. */
export function AuditTab({ admin, config }: AuditTabProps) {
  const translate = useT();
  const { audit, auditLocale, setAuditLocale } = admin;

  const columns: GridColDef<AuditEntry>[] = [
    { field: 'timestamp', headerName: translate('tr.col.timestamp', 'When'), width: 180, valueFormatter: (value: string) => formatTime(value) },
    { field: 'actor', headerName: translate('tr.col.actor', 'Actor'), width: 130 },
    { field: 'locale', headerName: translate('tr.col.locale', 'Locale'), width: 90 },
    { field: 'version', headerName: translate('tr.col.version', 'Version'), width: 90 },
    { field: 'action', headerName: translate('tr.col.action', 'Action'), width: 120, display: 'flex', renderCell: (params) => <ActionPill action={params.row.action} /> },
    { field: 'key', headerName: translate('tr.col.key', 'Key'), flex: 1.2, display: 'flex', renderCell: (params) => (params.row.key ? <Mono>{params.row.key}</Mono> : null) },
    { field: 'before', headerName: translate('tr.col.before', 'Before'), flex: 1.5 },
    { field: 'after', headerName: translate('tr.col.after', 'After'), flex: 1.5 },
    { field: 'reason', headerName: translate('tr.col.reason', 'Reason'), flex: 1 },
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row">
        <Select
          label={translate('tr.locale', 'Locale')}
          value={auditLocale}
          options={[{ value: ALL_LOCALES, label: translate('tr.allLocales', 'All locales') }, ...localeOptions(config)]}
          onChange={setAuditLocale}
          fullWidth={false}
          sx={{ minWidth: 220 }}
        />
      </Stack>
      <DataGrid<AuditEntry> rows={audit} columns={columns} height={520} emptyMessage={translate('tr.empty.audit', 'Nothing has been changed yet')} />
    </Stack>
  );
}
