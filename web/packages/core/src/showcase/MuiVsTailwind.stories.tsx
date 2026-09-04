import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

// Owned (Tailwind) implementations — the stable public API.
import { Button, StatusPill, Meter } from '@atlas/core';
// Legacy (MUI) originals — same props, different implementation.
import { Button as MuiButton, StatusPill as MuiStatusPill, Meter as MuiMeter } from '@atlas/core/legacy';

const meta: Meta = {
  title: 'Design System/MUI vs Tailwind',
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type Story = StoryObj;

function Column({ heading, subtitle, children }: { heading: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex-1">
      <div className="mb-3">
        <div className="text-sm font-bold uppercase tracking-wide text-navy">{heading}</div>
        <div className="text-xs text-mute">{subtitle}</div>
      </div>
      <div className="flex flex-col gap-6 rounded-card border border-line bg-surface p-5 shadow-sm">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
      {children}
    </div>
  );
}

/**
 * Renders the legacy MUI components and the owned Tailwind components side by
 * side from the SAME props. A vertical slice importing `{ Button }` from
 * `@atlas/core` cannot tell which column it is getting — that decoupling is the
 * whole point of the migration.
 */
export const SideBySide: Story = {
  render: () => (
    <div className="max-w-[920px]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-ink">Same API, two implementations</h2>
        <p className="text-sm text-mute">
          Both columns are driven by identical props. The left is the legacy MUI implementation
          (<code>@atlas/core/legacy</code>); the right is the owned Tailwind one (<code>@atlas/core</code>).
        </p>
      </div>

      <div className="flex gap-6">
        <Column heading="Before" subtitle="MUI (legacy)">
          <Row label="Button — primary / ghost / danger">
            <div className="flex items-center gap-3">
              <MuiButton variant="primary">Commit</MuiButton>
              <MuiButton variant="ghost">Cancel</MuiButton>
              <MuiButton variant="danger">Withdraw</MuiButton>
            </div>
          </Row>
          <Row label="StatusPill — all tones">
            <div className="flex flex-wrap items-center gap-2">
              <MuiStatusPill tone="neutral">Draft</MuiStatusPill>
              <MuiStatusPill tone="success">Approved</MuiStatusPill>
              <MuiStatusPill tone="warning">Pending</MuiStatusPill>
              <MuiStatusPill tone="danger">Breached</MuiStatusPill>
              <MuiStatusPill tone="info">In committee</MuiStatusPill>
            </div>
          </Row>
          <Row label="Meter — 92% of limit">
            <MuiMeter label="PrivateCredit | Emea" value={230_000_000} max={250_000_000} />
          </Row>
        </Column>

        <Column heading="After" subtitle="Tailwind (owned)">
          <Row label="Button — primary / ghost / danger">
            <div className="flex items-center gap-3">
              <Button variant="primary">Commit</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Withdraw</Button>
            </div>
          </Row>
          <Row label="StatusPill — all tones">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="neutral">Draft</StatusPill>
              <StatusPill tone="success">Approved</StatusPill>
              <StatusPill tone="warning">Pending</StatusPill>
              <StatusPill tone="danger">Breached</StatusPill>
              <StatusPill tone="info">In committee</StatusPill>
            </div>
          </Row>
          <Row label="Meter — 92% of limit">
            <Meter label="PrivateCredit | Emea" value={230_000_000} max={250_000_000} />
          </Row>
        </Column>
      </div>
    </div>
  ),
};
