import { useState } from 'react';
import { useT } from '@atlas/i18n';
import {
  Box,
  Card,
  DataGrid,
  EmptyState,
  Grid,
  PageHeader,
  Stack,
  StatusPill,
  Stepper,
  ToggleGroup,
  Typography,
} from '@atlas/core';
import type { GridColDef, PillTone, ToggleOption } from '@atlas/core';
import { seedDeals } from '@atlas/contracts';
import type { AssetClass, DealSnapshot, DealStatus } from '@atlas/contracts';

const STAGES: DealStatus[] = ['Pipeline', 'Investable', 'Closed', 'Withdrawn'];
const HAPPY_PATH: DealStatus[] = ['Pipeline', 'Investable', 'Closed'];

const assetTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  Etf: 'neutral',
  LiquidEquity: 'success',
};

const statusTone: Record<DealStatus, PillTone> = {
  Pipeline: 'neutral',
  Investable: 'success',
  Closed: 'info',
  Withdrawn: 'danger',
};

type View = 'board' | 'table';
type Translate = (key: string, fallback?: string) => string;

const stageLabel = (translate: Translate, stage: DealStatus) => translate('stage.' + stage.toLowerCase(), stage);

const columns = (translate: Translate): GridColDef<DealSnapshot>[] => [
  { field: 'name', headerName: translate('dp.col.name', 'Name'), flex: 2, minWidth: 200 },
  {
    field: 'status',
    headerName: translate('dp.col.status', 'Status'),
    width: 120,
    renderCell: (params) => <StatusPill tone={statusTone[params.row.status]}>{stageLabel(translate, params.row.status)}</StatusPill>,
  },
  {
    field: 'assetClass',
    headerName: translate('dp.col.assetClass', 'Asset class'),
    width: 140,
    renderCell: (params) => <StatusPill tone={assetTone[params.row.assetClass]}>{params.row.assetClass}</StatusPill>,
  },
  { field: 'region', headerName: translate('dp.col.region', 'Region'), width: 130 },
  { field: 'liquidity', headerName: translate('dp.col.liquidity', 'Liquidity'), width: 110 },
  { field: 'currency', headerName: translate('dp.col.currency', 'Currency'), width: 100 },
  { field: 'investableFrom', headerName: translate('dp.col.investableFrom', 'Investable from'), width: 140 },
  { field: 'investableTo', headerName: translate('dp.col.investableTo', 'Investable to'), width: 130 },
];

export function DealPipelineSlice() {
  const translate = useT();
  const [view, setView] = useState<View>('board');

  const views: ToggleOption<View>[] = [
    { value: 'board', label: translate('dp.view.board', 'Board') },
    { value: 'table', label: translate('dp.view.table', 'Table') },
  ];

  return (
    <>
      <PageHeader title={translate('dp.title', 'Deal Pipeline')} tagline={translate('dp.tagline', 'Move deals through their lifecycle — the same command + rule pattern')}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
            <Stepper steps={HAPPY_PATH.map((stage) => stageLabel(translate, stage))} activeIndex={1} />
          </Box>
          <ToggleGroup value={view} options={views} onChange={setView} aria-label={translate('dp.view', 'View')} />
        </Stack>
      </PageHeader>

      {view === 'board' ? (
        <Grid container spacing={2}>
          {STAGES.map((stage) => {
            const deals = seedDeals.filter((deal) => deal.status === stage);
            return (
              <Grid key={stage} size={{ xs: 12, md: 6, xl: 3 }}>
                <Stack sx={{ gap: 1.5 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="subtitle2">{stageLabel(translate, stage)}</Typography>
                    <StatusPill tone="neutral">{deals.length}</StatusPill>
                  </Stack>

                  {deals.length === 0 ? (
                    <EmptyState title="—" minHeight={80} />
                  ) : (
                    <Stack sx={{ gap: 1.5 }}>
                      {deals.map((deal) => (
                        <Card key={deal.dealId}>
                          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Typography variant="subtitle2">{deal.name}</Typography>
                            <StatusPill tone={assetTone[deal.assetClass]}>{deal.assetClass}</StatusPill>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {deal.dealId} · {deal.region} · {deal.currency}
                          </Typography>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Page size 5 over the ten seed deals so pagination is exercised, not just present.
        <DataGrid<DealSnapshot>
          rows={seedDeals}
          columns={columns(translate)}
          idField="dealId"
          emptyMessage={translate('dp.empty', 'No deals')}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        />
      )}
    </>
  );
}
