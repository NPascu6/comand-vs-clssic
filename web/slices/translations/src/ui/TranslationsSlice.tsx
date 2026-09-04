import { useState } from 'react';
import { Alert, Box, Divider, Loading, Mono, PageHeader, Stack, Tab, Tabs, TextField } from '@atlas/core';
import { useT } from '@atlas/i18n';
import { useTranslationsAdmin } from '../useTranslationsAdmin';
import { CatalogTab } from './CatalogTab';
import { VersionsTab } from './VersionsTab';
import { AuditTab } from './AuditTab';
import { LocalesTab } from './LocalesTab';

type TabId = 'catalog' | 'versions' | 'audit' | 'locales';

export function TranslationsSlice() {
  const translate = useT();
  const admin = useTranslationsAdmin();
  const [tab, setTab] = useState<TabId>('catalog');
  const { config, error, mode, actor, setActor, reason, setReason } = admin;

  return (
    <Box>
      <PageHeader
        title={translate('tr.title', 'Translations')}
        tagline={translate('tr.tagline', 'Edit, version, roll back and audit the backend-served catalogs')}
        actions={
          <>
            <TextField label={translate('tr.actor', 'Editing as')} value={actor} onChange={(event) => setActor(event.target.value)} fullWidth={false} sx={{ width: 180 }} />
            <TextField label={translate('tr.reason', 'Reason')} placeholder={translate('tr.reasonHint', 'Optional')} value={reason} onChange={(event) => setReason(event.target.value)} fullWidth={false} sx={{ width: 260 }} />
          </>
        }
      />

      {error ? (
        <Alert severity="error">
          {translate('tr.error', 'Could not load translations in')} <Mono>{mode}</Mono> {translate('tr.error.mode', 'mode')}: <Mono>{error}</Mono>
          <br />
          {translate('tr.error.hint', 'Switch to Mock in the header, or start the API:')} <Mono>dotnet run --project src/Atlas.Api</Mono>
        </Alert>
      ) : !config ? (
        <Loading label={translate('tr.loading', 'Loading catalogs…')} />
      ) : (
        <Stack sx={{ gap: 2 }}>
          <Tabs value={tab} onChange={(_, selected: TabId) => setTab(selected)} aria-label={translate('tr.title', 'Translations')}>
            <Tab value="catalog" label={translate('tr.tab.catalog', 'Catalog')} />
            <Tab value="versions" label={translate('tr.tab.versions', 'Versions')} />
            <Tab value="audit" label={translate('tr.tab.audit', 'Audit')} />
            <Tab value="locales" label={translate('tr.tab.locales', 'Locales')} />
          </Tabs>
          <Divider />
          {tab === 'catalog' ? <CatalogTab admin={admin} config={config} /> : null}
          {tab === 'versions' ? <VersionsTab admin={admin} config={config} /> : null}
          {tab === 'audit' ? <AuditTab admin={admin} config={config} /> : null}
          {tab === 'locales' ? <LocalesTab admin={admin} config={config} /> : null}
        </Stack>
      )}
    </Box>
  );
}
