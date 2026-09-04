import type { FormEvent } from 'react';
import type { AssetClass, CommitCapitalCommand, Liquidity, Region, ReferenceData } from '@atlas/contracts';
import type { SelectOption } from '@atlas/core';
import { Box, Button, Grid, Select, Stack, TextField } from '@atlas/core';
import { useT } from '@atlas/i18n';

const ASSET_CLASSES: AssetClass[] = ['PrivateEquity', 'PrivateCredit', 'LiquidEquity', 'Etf'];
const REGIONS: Region[] = ['NorthAmerica', 'Emea', 'Apac', 'Latam'];
const LIQUIDITIES: Liquidity[] = ['Illiquid', 'Liquid'];

const asOptions = (values: string[]): SelectOption[] => values.map((value) => ({ value, label: value }));

export interface CommitCapitalFormProps {
  value: CommitCapitalCommand;
  reference: ReferenceData;
  onChange: (patch: Partial<CommitCapitalCommand>) => void;
  onSubmit: () => void;
  busy: boolean;
}

// A missing id (scenario C's CI-MISSING) stays selectable: core Select shows "<value> (not found)" rather than hiding a bad input.
export function CommitCapitalForm({ value, reference, onChange, onSubmit, busy }: CommitCapitalFormProps) {
  const translate = useT();
  const fundOptions: SelectOption[] = reference.funds.map((fund) => ({ value: fund.fundId, label: `${fund.fundId} — ${fund.name}` }));
  const coInvestmentOptions: SelectOption[] = reference.coInvestments.map((vehicle) => ({ value: vehicle.coInvestmentId, label: vehicle.coInvestmentId }));
  const dealOptions: SelectOption[] = reference.deals.map((deal) => ({ value: deal.dealId, label: `${deal.dealId} — ${deal.name}` }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack sx={{ gap: 2.5 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.fund', 'Fund')} value={value.fundId} options={fundOptions} onChange={(fundId) => onChange({ fundId })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.coInvestment', 'Co-investment')} value={value.coInvestmentId} options={coInvestmentOptions} onChange={(coInvestmentId) => onChange({ coInvestmentId })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.deal', 'Deal')} value={value.dealId} options={dealOptions} onChange={(dealId) => onChange({ dealId })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label={translate('commit.field.requestedBy', 'Requested by')} value={value.requestedBy} placeholder="pm.alice" onChange={(event) => onChange({ requestedBy: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label={translate('commit.field.amount', 'Amount')} type="number" value={value.amount} onChange={(event) => onChange({ amount: Number(event.target.value) })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={translate('commit.field.currency', 'Currency')}
              value={value.currency}
              slotProps={{ htmlInput: { maxLength: 4 } }}
              onChange={(event) => onChange({ currency: event.target.value.toUpperCase() })}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.assetClass', 'Asset class')} value={value.assetClass} options={asOptions(ASSET_CLASSES)} onChange={(assetClass) => onChange({ assetClass: assetClass as AssetClass })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.region', 'Region')} value={value.region} options={asOptions(REGIONS)} onChange={(region) => onChange({ region: region as Region })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Select label={translate('commit.field.liquidity', 'Liquidity')} value={value.liquidity} options={asOptions(LIQUIDITIES)} onChange={(liquidity) => onChange({ liquidity: liquidity as Liquidity })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={translate('commit.field.commitmentDate', 'Commitment date')}
              type="date"
              value={value.commitmentDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => onChange({ commitmentDate: event.target.value })}
            />
          </Grid>
        </Grid>
        <Box>
          <Button type="submit" loading={busy}>
            {translate('commit.submit', 'Commit capital')}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
