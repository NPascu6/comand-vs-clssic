// Each panel is a pluggable VALUE in a registry — not a branch in a god
// component. Add a panel here; the shell never changes.
//
// An OOP dashboard tends to grow a fat view-controller that switch/cases over
// widget kinds and re-implements each widget's chrome. Here a panel is just
// `{ id, titleKey, minW, render }`. The shell (PanelFrame + WorkspaceSlice)
// renders ANY panel generically, so widgets stay tiny and self-contained and
// "adding a widget" means appending one entry to the array below.

import type { ReactNode } from 'react';
import {
  bucketKey,
  seedAppetite,
  seedCoInvestments,
  seedDeals,
  seedExposure,
} from '@atlas/contracts';
import type { AssetClass } from '@atlas/contracts';
import type { PillTone } from '@atlas/core';
import { Meter, Stat, StatusPill, compactMoney } from '@atlas/core';

export interface PanelDef {
  id: string;
  titleKey: string;
  minW: number;
  render: () => ReactNode;
}

// --- headroom ----------------------------------------------------------------
function HeadroomPanel() {
  const total = seedCoInvestments.reduce((sum, n) => sum + n.headroom, 0);
  return <Stat value={compactMoney(total)} label="Total headroom" tone="green" />;
}

// --- appetite ----------------------------------------------------------------
const APPETITE_FUND = 'PF-APAC-CREDIT';

function AppetitePanel() {
  const limits = seedAppetite[APPETITE_FUND] ?? [];
  const exposure = seedExposure[APPETITE_FUND];
  return (
    <div className="space-y-3">
      {limits.map((l) => (
        <Meter
          key={bucketKey(l.assetClass, l.region)}
          value={exposure?.committedByBucket[bucketKey(l.assetClass, l.region)] ?? 0}
          max={l.maxAmount}
          label={`${l.assetClass} | ${l.region}`}
          format={compactMoney}
        />
      ))}
    </div>
  );
}

// --- hierarchy ---------------------------------------------------------------
function HierarchyPanel() {
  const roots = seedCoInvestments.filter((n) => !n.parentCoInvestmentId);
  return (
    <div className="space-y-3">
      {roots.map((n) => (
        <div key={n.coInvestmentId} className="space-y-1">
          <div className="text-xs font-semibold text-ink">{n.coInvestmentId}</div>
          <Meter value={n.alreadyCommitted} max={n.commitmentCap} format={compactMoney} />
        </div>
      ))}
    </div>
  );
}

// --- deals -------------------------------------------------------------------
// Exhaustive map keeps the tone lookup honest: a new AssetClass forces a choice
// here rather than silently falling through a switch in a controller.
const dealTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  Etf: 'neutral',
  LiquidEquity: 'success',
};

function DealsPanel() {
  const investable = seedDeals.filter((d) => d.status === 'Investable');
  return (
    <div className="space-y-2">
      {investable.map((d) => (
        <div key={d.dealId} className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">{d.name}</div>
            <div className="text-xs text-mute">
              {d.region} · {d.currency}
            </div>
          </div>
          <StatusPill tone={dealTone[d.assetClass]}>{d.assetClass}</StatusPill>
        </div>
      ))}
    </div>
  );
}

export const panels: PanelDef[] = [
  { id: 'headroom', titleKey: 'panel.headroom', minW: 3, render: () => <HeadroomPanel /> },
  { id: 'appetite', titleKey: 'panel.appetite', minW: 4, render: () => <AppetitePanel /> },
  { id: 'hierarchy', titleKey: 'panel.hierarchy', minW: 4, render: () => <HierarchyPanel /> },
  { id: 'deals', titleKey: 'panel.deals', minW: 4, render: () => <DealsPanel /> },
];
