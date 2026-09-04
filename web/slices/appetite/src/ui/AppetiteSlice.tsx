import { useState } from 'react';
import { useT } from '@atlas/i18n';
import { bucketKey, seedAppetite, seedExposure, seedFunds } from '@atlas/contracts';
import { Box, Card, Grid, Meter, Mono, PageHeader, Select, Stack, Stat, StatusPill, Typography, compactMoney } from '@atlas/core';
import type { EdgeTone, PillTone } from '@atlas/core';

const fundOptions = seedFunds.map((fund) => ({ value: fund.fundId, label: `${fund.fundId} — ${fund.name}` }));

type Translate = (key: string, fallback?: string) => string;

interface BucketStatus {
  tone: PillTone;
  edge: EdgeTone;
  label: string;
}

function bucketStatus(translate: Translate, percent: number): BucketStatus {
  if (percent >= 100) return { tone: 'danger', edge: 'red', label: translate('appetite.status.breached', 'Breached') };
  if (percent >= 90) return { tone: 'warning', edge: 'amber', label: translate('appetite.status.nearLimit', 'Near limit') };
  return { tone: 'success', edge: 'green', label: translate('appetite.status.within', 'Within') };
}

export function AppetiteSlice() {
  const translate = useT();
  const [fundId, setFundId] = useState('PF-APAC-CREDIT');
  const limits = seedAppetite[fundId] ?? [];
  const exposure = seedExposure[fundId];

  return (
    <Stack sx={{ gap: 3 }}>
      <PageHeader
        title={translate('appetite.title', 'Appetite Restrictions')}
        tagline={translate('appetite.tagline', 'Current committed exposure against the configured ceiling for each asset-class / region bucket.')}
      >
        <Select value={fundId} options={fundOptions} onChange={setFundId} label={translate('appetite.fund', 'Fund')} sx={{ maxWidth: 360 }} />
      </PageHeader>

      {limits.length === 0 ? (
        <Card edge="amber">
          <Stack sx={{ gap: 1.5, alignItems: 'flex-start' }}>
            <StatusPill tone="warning">{translate('appetite.none', 'No appetite configured')}</StatusPill>
            <Typography variant="body2">
              {translate('appetite.noLimits', 'No appetite limits are configured for')} <Mono>{fundId}</Mono>.{' '}
              {translate('appetite.failClosed', 'Every commitment into this book is denied by default (fail-closed).')}
            </Typography>
          </Stack>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {limits.map((limit) => {
            const committed = exposure?.committedByBucket[bucketKey(limit.assetClass, limit.region)] ?? 0;
            const headroom = limit.maxAmount - committed;
            const percent = Math.round((committed / limit.maxAmount) * 100);
            const status = bucketStatus(translate, percent);
            return (
              <Grid key={bucketKey(limit.assetClass, limit.region)} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card edge={status.edge}>
                  <Stack sx={{ gap: 2 }}>
                    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2">{limit.assetClass}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {limit.region}
                        </Typography>
                      </Box>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </Stack>
                    <Meter value={committed} max={limit.maxAmount} format={compactMoney} />
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Stat value={compactMoney(headroom)} label={translate('appetite.headroom', 'Headroom')} tone={headroom <= 0 ? 'red' : 'green'} />
                      </Grid>
                      <Grid size={6}>
                        <Stat value={`${limit.maxConcentrationPct}%`} label={translate('appetite.maxConcentration', 'Max concentration')} tone="navy" />
                      </Grid>
                    </Grid>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
