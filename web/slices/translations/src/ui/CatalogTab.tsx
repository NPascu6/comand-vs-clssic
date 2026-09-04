import { useState } from 'react';
import { Button, ConfirmDialog, DataGrid, Mono, Select, Stack, TextField, Typography, useToast } from '@atlas/core';
import type { GridColDef } from '@atlas/core';
import { useT } from '@atlas/i18n';
import { validateKey } from '../catalog';
import type { I18nConfig } from '../catalog';
import type { CatalogRow, TranslationsAdmin } from '../useTranslationsAdmin';
import { describeError, fill, localeOptions } from './shared';

export interface CatalogTabProps {
  admin: TranslationsAdmin;
  config: I18nConfig;
}

/** One row per key; the value cell edits in place (If-Match = the version on screen). */
export function CatalogTab({ admin, config }: CatalogTabProps) {
  const translate = useT();
  const toast = useToast();
  const { locale, selectLocale, catalog, rows, busy, setEntry, deleteEntry } = admin;
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const keyError = newKey ? validateKey(newKey) : null;

  const columns: GridColDef<CatalogRow>[] = [
    { field: 'key', headerName: translate('tr.col.key', 'Key'), flex: 1.5, display: 'flex', renderCell: (params) => <Mono>{params.row.key}</Mono> },
    { field: 'value', headerName: translate('tr.col.value', 'Value'), flex: 3, editable: true },
    {
      field: 'fallback',
      headerName: translate('tr.col.fallback', 'Fallback'),
      flex: 2,
      display: 'flex',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {params.row.fallback}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 110,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      display: 'flex',
      renderCell: (params) => (
        <Button variant="ghost" size="sm" disabled={busy || !params.row.own} onClick={() => setPendingDelete(params.row.key)}>
          {translate('tr.delete', 'Delete')}
        </Button>
      ),
    },
  ];

  async function processRowUpdate(newRow: CatalogRow, oldRow: CatalogRow): Promise<CatalogRow> {
    if (newRow.value === oldRow.value) return oldRow;
    try {
      const change = await setEntry(newRow.key, newRow.value);
      toast.show(fill(translate('tr.toast.set', 'Saved {key} as v{version}'), { key: change.key, version: change.version }), 'success');
      return { ...newRow, own: true };
    } catch (error) {
      toast.show(describeError(error, translate), 'error');
      return oldRow;
    }
  }

  async function addKey() {
    try {
      const change = await setEntry(newKey, newValue);
      toast.show(fill(translate('tr.toast.set', 'Saved {key} as v{version}'), { key: change.key, version: change.version }), 'success');
      setNewKey('');
      setNewValue('');
    } catch (error) {
      toast.show(describeError(error, translate), 'error');
    }
  }

  async function confirmDelete() {
    if (pendingDelete === null) return;
    try {
      const change = await deleteEntry(pendingDelete);
      toast.show(fill(translate('tr.toast.deleted', 'Deleted {key} — now v{version}'), { key: change.key, version: change.version }), 'success');
    } catch (error) {
      toast.show(describeError(error, translate), 'error');
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select label={translate('tr.locale', 'Locale')} value={locale} options={localeOptions(config)} onChange={selectLocale} fullWidth={false} sx={{ minWidth: 220 }} />
        {catalog ? (
          <Typography variant="body2" color="text.secondary">
            {fill(translate('tr.currentVersion', 'Current version v{version}'), { version: catalog.version })}
          </Typography>
        ) : null}
      </Stack>

      <DataGrid<CatalogRow>
        rows={rows}
        columns={columns}
        idField="key"
        loading={catalog?.code !== locale}
        processRowUpdate={processRowUpdate}
        emptyMessage={translate('tr.empty.catalog', 'No keys in this catalog')}
      />

      <Stack direction="row" sx={{ gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <TextField
          label={translate('tr.add.key', 'New key')}
          value={newKey}
          onChange={(event) => setNewKey(event.target.value.trim())}
          error={keyError !== null}
          helperText={keyError ?? ' '}
          fullWidth={false}
          sx={{ width: 260 }}
        />
        <TextField label={translate('tr.add.value', 'Value')} value={newValue} onChange={(event) => setNewValue(event.target.value)} helperText=" " sx={{ flex: 1, minWidth: 240 }} />
        <Button onClick={addKey} loading={busy} disabled={!newKey || keyError !== null}>
          {translate('tr.add.submit', 'Add key')}
        </Button>
      </Stack>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={translate('tr.delete.title', 'Delete key?')}
        description={fill(translate('tr.delete.description', 'Removes {key} from {locale} as a new version. History keeps the old value.'), { key: pendingDelete ?? '', locale })}
        confirmLabel={translate('tr.delete', 'Delete')}
        cancelLabel={translate('tr.cancel', 'Cancel')}
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Stack>
  );
}
