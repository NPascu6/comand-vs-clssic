import { useState } from 'react';
import { bucketKey, seedAppetite, seedExposure, seedFunds } from '@atlas/contracts';
import { Card, Field, Meter, Select, Stat, StatusPill, compactMoney } from '@atlas/core';

export function AppetiteSlice() {
  const [pid, setPid] = useState('PF-APAC-CREDIT');
  const limits = seedAppetite[pid] ?? [];
  const exposure = seedExposure[pid];

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-ink">Appetite Restrictions</h2>
        <p className="text-sm text-mute">Current committed exposure against the configured ceiling for each asset-class / region bucket.</p>
        <div className="mt-3 max-w-xs">
          <Field label="Fund">
            <Select value={pid} onChange={(e) => setPid(e.target.value)}>
              {seedFunds.map((p) => (
                <option key={p.fundId} value={p.fundId}>{p.fundId} — {p.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </header>

      {limits.length === 0 ? (
        <Card edge="amber" className="p-5">
          <StatusPill tone="warning">No appetite configured</StatusPill>
          <p className="mt-2 text-sm text-ink">No appetite limits are configured for <b>{pid}</b>. Every commitment into this book is denied by default (fail-closed).</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {limits.map((l) => {
            const committed = exposure?.committedByBucket[bucketKey(l.assetClass, l.region)] ?? 0;
            const headroom = l.maxAmount - committed;
            const pct = Math.round((committed / l.maxAmount) * 100);
            const status = pct >= 100 ? { tone: 'danger' as const, edge: 'red' as const, label: 'Breached' } : pct >= 90 ? { tone: 'warning' as const, edge: 'amber' as const, label: 'Near limit' } : { tone: 'success' as const, edge: 'green' as const, label: 'Within' };
            return (
              <Card key={bucketKey(l.assetClass, l.region)} edge={status.edge} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink">{l.assetClass}</div>
                    <div className="text-xs text-mute">{l.region}</div>
                  </div>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                <div className="mt-4">
                  <Meter value={committed} max={l.maxAmount} format={compactMoney} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat value={compactMoney(headroom)} label="Headroom" tone={headroom <= 0 ? 'red' : 'green'} />
                  <Stat value={`${l.maxConcentrationPct}%`} label="Max concentration" tone="navy" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
