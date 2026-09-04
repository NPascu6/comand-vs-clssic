import type { ReactNode } from 'react';
import { Button as TwButton, Meter as TwMeter, StatusPill as TwPill, Card } from '@atlas/core';
import { Button as MuiButton, Meter as MuiMeter, StatusPill as MuiPill } from '@atlas/core/legacy';
import { compactMoney } from '@atlas/core';

// The frontend's "old vs new": the SAME component API rendered by the legacy
// MUI implementation and the owned Tailwind implementation. Slices import from
// `@atlas/core` and never see either — which is what lets the migration proceed
// component-by-component without touching a single slice.
function Pair({ title, mui, tw }: { title: string; mui: ReactNode; tw: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr_1fr] items-center gap-4 border-b border-line py-4 last:border-0">
      <div className="text-sm font-semibold text-ink">{title}</div>
      <div>{mui}</div>
      <div>{tw}</div>
    </div>
  );
}

export function CoreShowcase() {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-ink">Design System — decoupling MUI → Tailwind</h2>
        <p className="max-w-3xl text-sm text-mute">
          Today <code className="font-mono text-xs">core</code> wraps MUI with heavy custom styling. The target is an owned Tailwind implementation behind the
          <i> same </i> component API, so the vertical slices never change. Each row is one component, rendered both ways from one set of props.
        </p>
      </header>

      <Card className="p-6">
        <div className="grid grid-cols-[140px_1fr_1fr] gap-4 border-b-2 border-line pb-2 text-xs font-semibold uppercase tracking-wide text-mute">
          <div>Component</div>
          <div>@atlas/core/legacy · MUI (before)</div>
          <div>@atlas/core · Tailwind (after)</div>
        </div>

        <Pair
          title="Button"
          mui={
            <div className="flex flex-wrap gap-2">
              <MuiButton>Primary</MuiButton>
              <MuiButton variant="ghost">Ghost</MuiButton>
              <MuiButton variant="danger">Danger</MuiButton>
            </div>
          }
          tw={
            <div className="flex flex-wrap gap-2">
              <TwButton>Primary</TwButton>
              <TwButton variant="ghost">Ghost</TwButton>
              <TwButton variant="danger">Danger</TwButton>
            </div>
          }
        />

        <Pair
          title="StatusPill"
          mui={
            <div className="flex flex-wrap gap-2">
              <MuiPill tone="success">Open</MuiPill>
              <MuiPill tone="warning">Near limit</MuiPill>
              <MuiPill tone="danger">Breached</MuiPill>
            </div>
          }
          tw={
            <div className="flex flex-wrap gap-2">
              <TwPill tone="success">Open</TwPill>
              <TwPill tone="warning">Near limit</TwPill>
              <TwPill tone="danger">Breached</TwPill>
            </div>
          }
        />

        <Pair
          title="Meter"
          mui={<MuiMeter value={230_000_000} max={250_000_000} label="PrivateCredit | Emea" format={compactMoney} />}
          tw={<TwMeter value={230_000_000} max={250_000_000} label="PrivateCredit | Emea" format={compactMoney} />}
        />
      </Card>

      <Card edge="green" className="p-5">
        <p className="text-sm text-ink">
          <b>The migration recipe:</b> implement the component in Tailwind, point the <code className="font-mono text-xs">@atlas/core</code> barrel at it, delete the MUI one.
          Because slices depend only on the API, MUI leaves the dependency tree one component at a time — no slice edits, no big-bang rewrite.
        </p>
      </Card>
    </div>
  );
}
