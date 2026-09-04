import { useT } from '@atlas/i18n';
import { Card, StatusPill, Stepper } from '@atlas/core';
import type { PillTone } from '@atlas/core';
import { seedDeals } from '@atlas/contracts';
import type { AssetClass, DealStatus } from '@atlas/contracts';

// The deal lifecycle, modelled as an ordered state machine. The board renders
// one column per state; a Stepper in the header shows the happy-path flow.
const STAGES: DealStatus[] = ['Pipeline', 'Investable', 'Closed', 'Withdrawn'];

// Asset class -> pill tone, so each card carries a consistent class signal.
const assetTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  Etf: 'neutral',
  LiquidEquity: 'success',
};

export function DealPipelineSlice() {
  const t = useT();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-bold text-ink">{t('dp.title', 'Deal Pipeline')}</h2>
        <p className="text-sm text-mute">{t('dp.tagline', 'Move deals through their lifecycle')}</p>
        <div className="mt-3 max-w-md">
          <Stepper steps={['Pipeline', 'Investable', 'Closed']} activeIndex={1} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const deals = seedDeals.filter((d) => d.status === stage);
          return (
            <div key={stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink">{t('stage.' + stage.toLowerCase(), stage)}</h3>
                <StatusPill tone="neutral">{deals.length}</StatusPill>
              </div>

              {deals.length === 0 ? (
                <p className="text-sm text-mute">—</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {deals.map((d) => (
                    <Card key={d.dealId} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink">{d.name}</span>
                        <StatusPill tone={assetTone[d.assetClass]}>{d.assetClass}</StatusPill>
                      </div>
                      <p className="mt-1 text-xs text-mute">
                        {d.dealId} · {d.region} · {d.currency}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
