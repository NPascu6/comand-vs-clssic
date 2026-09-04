import { useMemo, useState } from 'react';
import type { AssetClass, CoInvestmentStatus, DealSnapshot } from '@atlas/contracts';
import { seedCoInvestments, seedDeals, seedFunds } from '@atlas/contracts';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardHeader,
  DataGrid,
  Grid,
  Meter,
  Mono,
  PageHeader,
  Section,
  Select,
  Stack,
  Stat,
  StatusPill,
  Typography,
  compactMoney,
} from '@atlas/core';
import type { BreadcrumbItem, EdgeTone, GridColDef, PillTone } from '@atlas/core';
import { useT } from '@atlas/i18n';

const childrenOf = (parentId: string | null) => seedCoInvestments.filter((vehicle) => vehicle.parentCoInvestmentId === parentId);

const fundsWithVehicles = seedFunds.filter((fund) =>
  seedCoInvestments.some((vehicle) => !vehicle.parentCoInvestmentId && vehicle.fundId === fund.fundId),
);

const fundOptions = fundsWithVehicles.map((fund) => ({ value: fund.fundId, label: `${fund.fundId} — ${fund.name}` }));

const assetTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  LiquidEquity: 'success',
  Etf: 'neutral',
};

const edgeOf = (status: CoInvestmentStatus): EdgeTone => (status === 'Active' ? 'navy' : 'amber');
const pillOf = (status: CoInvestmentStatus): PillTone => (status === 'Active' ? 'success' : 'warning');

type Translate = (key: string, fallback?: string) => string;

const holdingColumns = (translate: Translate): GridColDef<DealSnapshot>[] => [
  { field: 'name', headerName: translate('hier.name', 'Name'), flex: 2, minWidth: 160 },
  {
    field: 'assetClass',
    headerName: translate('hier.assetClass', 'Asset class'),
    flex: 1,
    minWidth: 140,
    renderCell: (params) => <StatusPill tone={assetTone[params.row.assetClass]}>{params.row.assetClass}</StatusPill>,
  },
  { field: 'region', headerName: translate('hier.region', 'Region'), flex: 1, minWidth: 120 },
  { field: 'liquidity', headerName: translate('hier.liquidity', 'Liquidity'), flex: 1, minWidth: 100 },
  { field: 'currency', headerName: translate('hier.currency', 'Currency'), width: 100 },
];

export function CoInvestmentSlice() {
  const translate = useT();
  const [fundId, setFundId] = useState('PF-APAC-CREDIT');
  const [path, setPath] = useState<string[]>([]); // vehicle ids from a root; [] = fund level
  const fund = seedFunds.find((candidate) => candidate.fundId === fundId)!;

  const currentId = path.length ? path[path.length - 1] : null;
  const current = currentId ? seedCoInvestments.find((vehicle) => vehicle.coInvestmentId === currentId) ?? null : null;
  const subVehicles =
    currentId === null
      ? seedCoInvestments.filter((vehicle) => !vehicle.parentCoInvestmentId && vehicle.fundId === fundId)
      : childrenOf(currentId);
  const isLeaf = currentId !== null && subVehicles.length === 0;
  const holdings: DealSnapshot[] = isLeaf ? seedDeals.filter((deal) => deal.status === 'Investable') : [];

  const crumbs: BreadcrumbItem[] = [
    { label: fund.fundId, onClick: () => setPath([]) },
    ...path.map((vehicleId, index) => ({ label: vehicleId, onClick: () => setPath(path.slice(0, index + 1)) })),
  ];

  const columns = useMemo(() => holdingColumns(translate), [translate]);

  return (
    <Stack sx={{ gap: 3 }}>
      <PageHeader title={translate('hier.title', 'Fund & Co-investment Hierarchy')} tagline={translate('hier.tagline', 'Navigate vehicles, sleeves and holdings across levels')}>
        <Select
          value={fundId}
          options={fundOptions}
          onChange={(selectedFundId) => {
            setFundId(selectedFundId);
            setPath([]);
          }}
          label={translate('hier.fund', 'Fund')}
          sx={{ maxWidth: 360 }}
        />
      </PageHeader>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Breadcrumbs items={crumbs} />
        {path.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setPath(path.slice(0, -1))}>
            ← {translate('hier.back', 'Back')}
          </Button>
        )}
      </Stack>

      {current && (
        <Card edge={edgeOf(current.status)} padded={false}>
          <CardHeader
            title={<Mono>{current.coInvestmentId}</Mono>}
            action={<StatusPill tone={pillOf(current.status)}>{current.status}</StatusPill>}
          />
          <Stack sx={{ p: 2.5, gap: 2 }}>
            <Meter
              value={current.alreadyCommitted}
              max={current.commitmentCap}
              format={compactMoney}
              label={`${translate('hier.committed', 'Committed')} / ${translate('hier.cap', 'Cap')}`}
            />
            <Stat
              value={`${compactMoney(current.headroom)} ${current.currency}`}
              label={translate('hier.headroom', 'Headroom')}
              tone={current.headroom <= 0 ? 'red' : 'green'}
            />
          </Stack>
        </Card>
      )}

      {subVehicles.length > 0 && (
        <Section title={translate('hier.children', 'Sub-vehicles')}>
          <Grid container spacing={2}>
            {subVehicles.map((vehicle) => (
              <Grid key={vehicle.coInvestmentId} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card edge={edgeOf(vehicle.status)} onClick={() => setPath([...path, vehicle.coInvestmentId])}>
                  <Stack sx={{ gap: 2 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Mono>{vehicle.coInvestmentId} ›</Mono>
                      <StatusPill tone={pillOf(vehicle.status)}>{vehicle.status}</StatusPill>
                    </Stack>
                    <Meter value={vehicle.alreadyCommitted} max={vehicle.commitmentCap} format={compactMoney} />
                    <Typography variant="caption" color="text.secondary">
                      {translate('hier.headroom', 'Headroom')}: {compactMoney(vehicle.headroom)} {vehicle.currency}
                    </Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Section>
      )}

      {isLeaf && (
        <Section title={translate('hier.holdings', 'Holdings')}>
          <Box sx={{ minWidth: 0 }}>
            <DataGrid rows={holdings} columns={columns} idField="dealId" toolbar={false} emptyMessage={translate('hier.noHoldings', 'No holdings')} />
          </Box>
        </Section>
      )}
    </Stack>
  );
}
