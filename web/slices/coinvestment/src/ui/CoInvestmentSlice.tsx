import { useState } from 'react';
import type { AssetClass, DealSnapshot } from '@atlas/contracts';
import { seedCoInvestments, seedDeals, seedFunds } from '@atlas/contracts';
import { Card, Meter, Select, Stat, StatusPill, compactMoney } from '@atlas/core';
import type { PillTone } from '@atlas/core';
import { useT } from '@atlas/i18n';

// ---------------------------------------------------------------------------
// Navigable fund / co-investment hierarchy.
//
// Drill from the fund into vehicles, into sub-vehicles, down to the
// leaf where holdings of DIFFERENT investment types live. A breadcrumb walks
// back up. The whole view is data-driven (seed hierarchy) and i18n-labelled —
// a worked example of "construction across hierarchies with navigability".
// ---------------------------------------------------------------------------

const childrenOf = (id: string | null) => seedCoInvestments.filter((n) => n.parentCoInvestmentId === id);

// only funds that actually have a co-investment tree
const fundsWithVehicles = seedFunds.filter((p) =>
  seedCoInvestments.some((n) => !n.parentCoInvestmentId && n.fundId === p.fundId),
);

const assetTone: Record<AssetClass, PillTone> = {
  PrivateEquity: 'info',
  PrivateCredit: 'warning',
  LiquidEquity: 'success',
  Etf: 'neutral',
};

export function CoInvestmentSlice() {
  const t = useT();
  const [pid, setPid] = useState('PF-APAC-CREDIT');
  const [path, setPath] = useState<string[]>([]); // node ids from a root; [] = fund level
  const fund = seedFunds.find((p) => p.fundId === pid)!;

  const currentId = path.length ? path[path.length - 1] : null;
  const current = currentId ? seedCoInvestments.find((n) => n.coInvestmentId === currentId) ?? null : null;
  const subVehicles =
    currentId === null
      ? seedCoInvestments.filter((n) => !n.parentCoInvestmentId && n.fundId === pid)
      : childrenOf(currentId);
  const isLeaf = currentId !== null && subVehicles.length === 0;
  const holdings: DealSnapshot[] = isLeaf ? seedDeals.filter((d) => d.status === 'Investable') : [];

  const crumbs: { id: string | null; label: string }[] = [
    { id: null, label: fund.fundId },
    ...path.map((id) => ({ id, label: id })),
  ];

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-ink">{t('hier.title')}</h2>
        <p className="text-sm text-mute">{t('hier.tagline')}</p>
        <div className="mt-3 max-w-xs">
          <Select
            value={pid}
            onChange={(e) => {
              setPid(e.target.value);
              setPath([]);
            }}
          >
            {fundsWithVehicles.map((p) => (
              <option key={p.fundId} value={p.fundId}>
                {p.fundId} — {p.name}
              </option>
            ))}
          </Select>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={c.id ?? '__root'} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-mute">/</span>}
            <button
              className={i === crumbs.length - 1 ? 'font-semibold text-ink' : 'text-navy hover:underline'}
              onClick={() => setPath(c.id === null ? [] : path.slice(0, path.indexOf(c.id) + 1))}
            >
              {c.label}
            </button>
          </span>
        ))}
        {path.length > 0 && (
          <button className="ml-2 text-xs text-mute hover:underline" onClick={() => setPath(path.slice(0, -1))}>
            ← {t('hier.back')}
          </button>
        )}
      </div>

      {current && (
        <Card edge={current.status === 'Active' ? 'navy' : 'amber'} className="p-5">
          <div className="flex items-start justify-between">
            <span className="font-mono font-semibold text-ink">{current.coInvestmentId}</span>
            <StatusPill tone={current.status === 'Active' ? 'success' : 'warning'}>{current.status}</StatusPill>
          </div>
          <div className="mt-3">
            <Meter value={current.alreadyCommitted} max={current.commitmentCap} format={compactMoney} label={`${t('hier.committed')} / ${t('hier.cap')}`} />
          </div>
          <div className="mt-3">
            <Stat value={`${compactMoney(current.headroom)} ${current.currency}`} label={t('hier.headroom')} tone={current.headroom <= 0 ? 'red' : 'green'} />
          </div>
        </Card>
      )}

      {subVehicles.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">{t('hier.children')}</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subVehicles.map((n) => (
              <button key={n.coInvestmentId} onClick={() => setPath([...path, n.coInvestmentId])} className="block text-left">
                <Card edge={n.status === 'Active' ? 'navy' : 'amber'} className="p-4 transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-ink">{n.coInvestmentId} ›</span>
                    <StatusPill tone={n.status === 'Active' ? 'success' : 'warning'}>{n.status}</StatusPill>
                  </div>
                  <div className="mt-3">
                    <Meter value={n.alreadyCommitted} max={n.commitmentCap} format={compactMoney} />
                  </div>
                  <div className="mt-2 text-xs text-mute">
                    {t('hier.headroom')}: {compactMoney(n.headroom)} {n.currency}
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {holdings.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">{t('hier.holdings')}</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {holdings.map((d) => (
              <Card key={d.dealId} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{d.name}</span>
                  <StatusPill tone={assetTone[d.assetClass]}>{d.assetClass}</StatusPill>
                </div>
                <div className="mt-1 text-xs text-mute">
                  {d.dealId} · {d.region} · {d.liquidity} · {d.currency}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
