import { useMemo, useState } from 'react';
import type { DataSourceMode, RuntimeConfig } from '@atlas/platform';
import { DataSourceProvider } from '@atlas/platform';
import { useT, LocaleSwitcher } from '@atlas/i18n';
import { AppShell, Box, Mono, NavList, Stack, ThemeSwitcher, ToggleGroup, Typography } from '@atlas/core';
import type { NavGroup, ToggleOption } from '@atlas/core';
import { slices } from './slices';
import { DesignSystemPage } from './pages/DesignSystemPage';

const CORE_ID = '__core';
const PLATFORM = 'Platform';

const NAV_KEY: Record<string, string> = {
  'commit-capital': 'nav.commitCapital',
  coinvestment: 'nav.hierarchy',
  appetite: 'nav.appetite',
  workspace: 'nav.workspace',
  'deal-pipeline': 'nav.dealPipeline',
  translations: 'nav.translations',
};

const DOMAIN_KEY: Record<string, string> = {
  'Fund Construction': 'nav.group.construction',
  'Fund Management': 'nav.group.management',
  [PLATFORM]: 'nav.group.platform',
};

interface NavEntry {
  id: string;
  title: string;
  tagline: string;
  domain: string;
}

function groupByDomain<T extends { domain: string }>(items: T[]): [string, T[]][] {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.domain)) {
      map.set(item.domain, []);
      order.push(item.domain);
    }
    map.get(item.domain)!.push(item);
  }
  return order.map((domain) => [domain, map.get(domain)!]);
}

function DataToggle({ mode, apiBaseUrl, onChange }: { mode: DataSourceMode; apiBaseUrl: string; onChange: (mode: DataSourceMode) => void }) {
  const translate = useT();
  const options: ToggleOption<DataSourceMode>[] = [
    { value: 'mock', label: translate('header.mock', 'Mock') },
    { value: 'api', label: translate('header.live', 'Live API') },
  ];
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
      {mode === 'api' ? <Mono color="secondary">{apiBaseUrl}</Mono> : null}
      <ToggleGroup value={mode} options={options} onChange={onChange} aria-label={translate('header.source', 'Data')} />
    </Stack>
  );
}

export function App({ config }: { config: RuntimeConfig }) {
  const translate = useT();
  const [active, setActive] = useState<string>(slices[0].id);
  const [mode, setMode] = useState<DataSourceMode>('mock');
  const dataSource = useMemo(() => ({ mode, apiBaseUrl: config.apiBaseUrl }), [mode, config.apiBaseUrl]);

  const entries: NavEntry[] = [
    ...slices.map((slice) => ({ id: slice.id, title: NAV_KEY[slice.id] ? translate(NAV_KEY[slice.id], slice.title) : slice.title, tagline: slice.tagline, domain: slice.domain })),
    { id: CORE_ID, title: translate('nav.designSystem', 'Design System'), tagline: translate('nav.designSystem.tagline', 'Owned API over MUI · light / dark / high contrast'), domain: PLATFORM },
  ];
  const domainLabel = (domain: string) => translate(DOMAIN_KEY[domain] ?? '', domain);
  const groups: NavGroup[] = groupByDomain(entries).map(([domain, items]) => ({ label: domainLabel(domain), items }));

  const activeDomain = entries.find((entry) => entry.id === active)?.domain;
  const ActiveView = slices.find((slice) => slice.id === active)?.Component;

  return (
    <DataSourceProvider value={dataSource}>
      <AppShell
        brand={
          <Box>
            <Typography variant="h6" color="primary">
              Atlas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {translate('app.subtitle', 'Central Fund Management')}
            </Typography>
          </Box>
        }
        nav={<NavList groups={groups} activeId={active} onSelect={setActive} />}
        headerTitle={
          <Typography variant="subtitle2" color="text.secondary">
            {activeDomain ? domainLabel(activeDomain) : null}
          </Typography>
        }
        actions={
          <>
            <LocaleSwitcher />
            <ThemeSwitcher />
            <DataToggle mode={mode} apiBaseUrl={config.apiBaseUrl} onChange={setMode} />
          </>
        }
      >
        {active === CORE_ID ? <DesignSystemPage /> : ActiveView ? <ActiveView /> : null}
      </AppShell>
    </DataSourceProvider>
  );
}
