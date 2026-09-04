import { useMemo, useState } from 'react';
import { bucketKey, seedDeals } from '@atlas/contracts';
import type { DealSnapshot, DealStatus, Region } from '@atlas/contracts';
import {
  Alert,
  Button,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  Grid,
  Loading,
  Meter,
  PageHeader,
  Section,
  Select,
  Stack,
  Stat,
  StatusPill,
  Stepper,
  TextField,
  ThemeSwitcher,
  ToggleGroup,
  compactMoney,
  useToast,
} from '@atlas/core';
import type { ButtonSize, ButtonVariant, GridColDef, PillTone, StatTone, ToggleOption } from '@atlas/core';
import { useT } from '@atlas/i18n';

type Translate = (key: string, fallback?: string) => string;

const VARIANTS: ButtonVariant[] = ['primary', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['md', 'sm'];
const PILL_TONES: PillTone[] = ['neutral', 'success', 'warning', 'danger', 'info'];
const STATS: Array<{ tone: StatTone; value: string }> = [
  { tone: 'navy', value: compactMoney(100_000_000) },
  { tone: 'green', value: compactMoney(400_000_000) },
  { tone: 'amber', value: '85%' },
  { tone: 'red', value: '2' },
];
const METERS: Array<{ label: string; value: number }> = [
  { label: bucketKey('PrivateEquity', 'NorthAmerica'), value: 100_000_000 },
  { label: bucketKey('PrivateCredit', 'Emea'), value: 212_500_000 },
  { label: bucketKey('Etf', 'Apac'), value: 250_000_000 },
];
const METER_MAX = 250_000_000;
const STAGES: Array<[string, string]> = [
  ['stage.pipeline', 'Pipeline'],
  ['stage.investable', 'Investable'],
  ['stage.closed', 'Closed'],
];
const REGIONS: Region[] = ['NorthAmerica', 'Emea', 'Apac', 'Latam'];
const STATUS_TONE: Record<DealStatus, PillTone> = { Pipeline: 'info', Investable: 'success', Closed: 'neutral', Withdrawn: 'danger' };

type View = 'table' | 'cards';

function dealColumns(translate: Translate): GridColDef<DealSnapshot>[] {
  return [
    { field: 'dealId', headerName: translate('ds.col.deal', 'Deal'), width: 170 },
    { field: 'name', headerName: translate('ds.col.name', 'Name (editable)'), flex: 1, minWidth: 200, editable: true },
    {
      field: 'status',
      headerName: translate('ds.col.status', 'Status'),
      width: 130,
      renderCell: (params) => <StatusPill tone={STATUS_TONE[params.row.status]}>{params.row.status}</StatusPill>,
    },
    { field: 'assetClass', headerName: translate('ds.col.assetClass', 'Asset class'), width: 140 },
    { field: 'region', headerName: translate('ds.col.region', 'Region'), width: 130 },
    { field: 'liquidity', headerName: translate('ds.col.liquidity', 'Liquidity'), width: 110 },
    { field: 'currency', headerName: translate('ds.col.currency', 'Ccy'), width: 80 },
  ];
}

export function DesignSystemPage() {
  const translate = useT();
  const toast = useToast();
  const [region, setRegion] = useState<string>('Emea');
  const [amount, setAmount] = useState('25000000');
  const [view, setView] = useState<View>('table');
  const [deals, setDeals] = useState<DealSnapshot[]>(seedDeals);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const columns = useMemo(() => dealColumns(translate), [translate]);

  const viewOptions: ToggleOption<View>[] = [
    { value: 'table', label: translate('ds.view.table', 'Table') },
    { value: 'cards', label: translate('ds.view.cards', 'Cards') },
  ];

  return (
    <>
      <PageHeader
        title={translate('nav.designSystem', 'Design System')}
        tagline={translate('ds.tagline', 'The owned component API over MUI, rendered by the live theme.')}
        actions={<ThemeSwitcher />}
      />

      <Stack sx={{ gap: 4 }}>
        <Alert severity="info">
          {translate(
            'ds.intro',
            'Slices import @atlas/core only — never the UI library underneath — so that library can change without touching business code. The theme switcher restyles everything on this page at once because every component reads its colours, borders and focus rings from the theme: light, dark and high contrast are one palette swap, not per-component work.',
          )}
        </Alert>

        <Section title={translate('ds.buttons', 'Buttons')}>
          <Stack sx={{ gap: 1.5 }}>
            {SIZES.map((size) => (
              <Stack key={size} direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                {VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} size={size}>
                    {variant}
                  </Button>
                ))}
                <Button size={size} loading>
                  {translate('ds.saving', 'Saving')}
                </Button>
              </Stack>
            ))}
          </Stack>
        </Section>

        <Section title={translate('ds.pills', 'Status pills')}>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {PILL_TONES.map((tone) => (
              <StatusPill key={tone} tone={tone}>
                {tone}
              </StatusPill>
            ))}
          </Stack>
        </Section>

        <Section title={translate('ds.stats', 'Stats')}>
          <Grid container spacing={2}>
            {STATS.map((stat) => (
              <Grid key={stat.tone} size={{ xs: 6, md: 3 }}>
                <Stat label={stat.tone} value={stat.value} tone={stat.tone} />
              </Grid>
            ))}
          </Grid>
        </Section>

        <Section title={translate('ds.meters', 'Meters (auto tone at 40 / 85 / 100%)')}>
          <Stack sx={{ gap: 2 }}>
            {METERS.map((meter) => (
              <Meter key={meter.label} label={meter.label} value={meter.value} max={METER_MAX} format={compactMoney} />
            ))}
          </Stack>
        </Section>

        <Section title={translate('ds.stepper', 'Stepper')}>
          <Stepper steps={STAGES.map(([key, fallback]) => translate(key, fallback))} activeIndex={1} />
        </Section>

        <Section title={translate('ds.fields', 'Select and text field')}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Select
                label={translate('ds.region', 'Region')}
                value={region}
                options={REGIONS.map((region) => ({ value: region, label: region }))}
                onChange={setRegion}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={translate('ds.amount', 'Amount')}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                helperText={translate('ds.amountHelp', 'Whole units in the deal currency')}
              />
            </Grid>
          </Grid>
        </Section>

        <Section title={translate('ds.toggle', 'Toggle group')}>
          <ToggleGroup value={view} options={viewOptions} onChange={setView} aria-label={translate('ds.view', 'View')} />
        </Section>

        <Section title={translate('ds.grid', 'Data grid (double-click a name to edit)')}>
          <DataGrid<DealSnapshot>
            rows={deals}
            columns={columns}
            idField="dealId"
            toolbar
            processRowUpdate={(next) => {
              setDeals((previous) => previous.map((deal) => (deal.dealId === next.dealId ? next : deal)));
              return next;
            }}
          />
        </Section>

        <Section title={translate('ds.states', 'Empty and loading states')}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <EmptyState
                title={translate('ds.empty.title', 'No deals match')}
                description={translate('ds.empty.description', 'Clear the filter or load a scenario.')}
                action={
                  <Button variant="ghost" size="sm">
                    {translate('ds.empty.action', 'Clear filter')}
                  </Button>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack sx={{ gap: 1, alignItems: 'center' }}>
                <Loading label={translate('ds.loadingBlock', 'Loading deals')} />
                <Loading inline label={translate('ds.loadingInline', 'Checking upstream')} />
              </Stack>
            </Grid>
          </Grid>
        </Section>

        <Section title={translate('ds.feedback', 'Dialog and toast')}>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              {translate('ds.confirm.open', 'Withdraw deal')}
            </Button>
            <Button variant="ghost" onClick={() => toast.show(translate('ds.toast.message', 'Saved — the change is on the audit log.'), 'success')}>
              {translate('ds.toast.open', 'Show toast')}
            </Button>
          </Stack>
          <ConfirmDialog
            open={confirmOpen}
            title={translate('ds.confirm.title', 'Withdraw this deal?')}
            description={translate('ds.confirm.description', 'The deal moves to Withdrawn and the decision is traced.')}
            confirmLabel={translate('ds.confirm.ok', 'Withdraw')}
            cancelLabel={translate('ds.confirm.cancel', 'Keep')}
            danger
            onConfirm={() => {
              setConfirmOpen(false);
              toast.show(translate('ds.confirm.done', 'Deal withdrawn.'), 'warning');
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        </Section>
      </Stack>
    </>
  );
}
