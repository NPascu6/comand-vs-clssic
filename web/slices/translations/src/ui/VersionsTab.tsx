import { useState } from 'react';
import { Box, Button, ConfirmDialog, DataGrid, Mono, Select, Stack, Tooltip, useToast } from '@atlas/core';
import type { GridColDef } from '@atlas/core';
import { useT } from '@atlas/i18n';
import type { I18nConfig, VersionSummary } from '../catalog';
import type { TranslationsAdmin } from '../useTranslationsAdmin';
import { ActionPill, describeError, fill, formatTime, localeOptions } from './shared';

export interface VersionsTabProps {
  admin: TranslationsAdmin;
  config: I18nConfig;
}

const TOOLTIP_KEYS = 10;

function ChangedKeys({ keys }: { keys: string[] }) {
  const translate = useT();
  if (keys.length === 0) return <span>0</span>;
  const shown = keys.slice(0, TOOLTIP_KEYS);
  const more = keys.length - shown.length;
  return (
    <Tooltip
      title={
        <Stack>
          {shown.map((key) => (
            <Mono key={key}>{key}</Mono>
          ))}
          {more > 0 ? <span>{fill(translate('tr.moreKeys', '+{count} more'), { count: more })}</span> : null}
        </Stack>
      }
    >
      <Box component="span">{keys.length}</Box>
    </Tooltip>
  );
}

/** History of one locale, newest first; rolling back mints a new version rather than rewriting one. */
export function VersionsTab({ admin, config }: VersionsTabProps) {
  const translate = useT();
  const toast = useToast();
  const { locale, selectLocale, catalog, versions, busy, rollback } = admin;
  const [pending, setPending] = useState<number | null>(null);

  const columns: GridColDef<VersionSummary>[] = [
    { field: 'version', headerName: translate('tr.col.version', 'Version'), width: 90 },
    { field: 'createdAt', headerName: translate('tr.col.createdAt', 'Created'), width: 180, valueFormatter: (value: string) => formatTime(value) },
    { field: 'actor', headerName: translate('tr.col.actor', 'Actor'), width: 140 },
    { field: 'action', headerName: translate('tr.col.action', 'Action'), width: 120, display: 'flex', renderCell: (params) => <ActionPill action={params.row.action} /> },
    {
      field: 'changedKeys',
      headerName: translate('tr.col.changedKeys', 'Changed keys'),
      width: 130,
      valueGetter: (_, row) => row.changedKeys.length,
      display: 'flex',
      renderCell: (params) => <ChangedKeys keys={params.row.changedKeys} />,
    },
    { field: 'reason', headerName: translate('tr.col.reason', 'Reason'), flex: 1 },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      display: 'flex',
      renderCell: (params) => (
        <Button variant="ghost" size="sm" disabled={busy || params.row.version === catalog?.version} onClick={() => setPending(params.row.version)}>
          {translate('tr.rollback', 'Roll back')}
        </Button>
      ),
    },
  ];

  async function confirmRollback() {
    if (pending === null) return;
    try {
      const result = await rollback(pending);
      toast.show(fill(translate('tr.toast.rolledBack', 'Restored v{from} as v{version}'), { from: result.restoredFrom, version: result.version }), 'success');
    } catch (error) {
      toast.show(describeError(error, translate), 'error');
    } finally {
      setPending(null);
    }
  }

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row">
        <Select label={translate('tr.locale', 'Locale')} value={locale} options={localeOptions(config)} onChange={selectLocale} fullWidth={false} sx={{ minWidth: 220 }} />
      </Stack>

      <DataGrid<VersionSummary>
        rows={versions}
        columns={columns}
        idField="version"
        loading={catalog?.code !== locale}
        toolbar={false}
        emptyMessage={translate('tr.empty.versions', 'No versions yet')}
      />

      <ConfirmDialog
        open={pending !== null}
        title={translate('tr.rollback.title', 'Roll back?')}
        description={fill(translate('tr.rollback.description', 'Restores the entries of v{version} of {locale} as a new version. Nothing is rewritten.'), { version: pending ?? 0, locale })}
        confirmLabel={translate('tr.rollback', 'Roll back')}
        cancelLabel={translate('tr.cancel', 'Cancel')}
        busy={busy}
        onConfirm={confirmRollback}
        onCancel={() => setPending(null)}
      />
    </Stack>
  );
}
