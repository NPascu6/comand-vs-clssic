// Adding a panel is appending one entry to `panels`; the shell renders any PanelDef generically.

import type { ReactNode } from 'react';
import { useT } from '@atlas/i18n';
import {
  bucketKey,
  seedAppetite,
  seedCoInvestments,
  seedDeals,
  seedExposure,
} from '@atlas/contracts';
import type { AssetClass, DealSnapshot } from '@atlas/contracts';
import type { GridColDef, PillTone } from '@atlas/core';
import { Box, DataGrid, Meter, Mono, Stack, Stat, StatusPill, Typography, compactMoney } from '@atlas/core';

export interface PanelDef {
  id: string;
  titleKey: string;
  minWidth: number;
  render: () => ReactNode;
}

function HeadroomPanel() {
  const translate = useT();
  const total = seedCoInvestments.reduce((sum, vehicle) => sum + vehicle.headroom, 0);
  return <Stat value={compactMoney(total)} label={translate('panel.headroom.total', 'Total headroom')} tone="green" />;
}

const APPETITE_FUND = 'PF-APAC-CREDIT';

function AppetitePanel() {
  const limits = seedAppetite[APPETITE_FUND] ?? [];
  const exposure = seedExposure[APPETITE_FUND];
  return (
    <Stack sx={{ gap: 2 }}>
      {limits.map((limit) => (
        <Meter
          key={bucketKey(limit.assetClass, limit.region)}
          value={exposure?.committedByBucket[bucketKey(limit.assetClass, limit.region)] ?? 0}
          max={limit.maxAmount}
          label={`${limit.assetClass} | ${limit.region}`}
          format={compactMoney}
        />
      ))}
    </Stack>
  );
}

function HierarchyPanel() {
  const roots = seedCoInvestments.filter((vehicle) => !vehicle.parentCoInvestmentId);
  return (
    <Stack sx={{ gap: 2 }}>
      {roots.map((vehicle) => (
        <Box key={vehicle.coInvestmentId}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            <Mono>{vehicle.coInvestmentId}</Mono>
          </Typography>
          <Meter value={vehicle.alreadyCommitted} max={vehicle.commitmentCap} format={compactMoney} />
        </Box>
      ))}
    </Stack>
  );
}

const dealTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  Etf: 'neutral',
  LiquidEquity: 'success',
};

const dealColumns = (translate: (key: string, fallback?: string) => string): GridColDef<DealSnapshot>[] => [
  { field: 'name', headerName: translate('panel.deals.name', 'Name'), flex: 2, minWidth: 160 },
  { field: 'region', headerName: translate('panel.deals.region', 'Region'), width: 120 },
  {
    field: 'assetClass',
    headerName: translate('panel.deals.assetClass', 'Asset class'),
    width: 140,
    renderCell: (params) => <StatusPill tone={dealTone[params.row.assetClass]}>{params.row.assetClass}</StatusPill>,
  },
];

function DealsPanel() {
  const translate = useT();
  const investable = seedDeals.filter((deal) => deal.status === 'Investable');
  return (
    <DataGrid<DealSnapshot>
      rows={investable}
      columns={dealColumns(translate)}
      idField="dealId"
      toolbar={false}
      hideFooter
      density="compact"
      height={260}
      emptyMessage={translate('panel.deals.empty', 'No investable deals')}
    />
  );
}

export const panels: PanelDef[] = [
  { id: 'headroom', titleKey: 'panel.headroom', minWidth: 3, render: () => <HeadroomPanel /> },
  { id: 'appetite', titleKey: 'panel.appetite', minWidth: 4, render: () => <AppetitePanel /> },
  { id: 'hierarchy', titleKey: 'panel.hierarchy', minWidth: 4, render: () => <HierarchyPanel /> },
  { id: 'deals', titleKey: 'panel.deals', minWidth: 4, render: () => <DealsPanel /> },
];
