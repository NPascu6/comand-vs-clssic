import type { ReactNode } from 'react';

export type StatTone = 'navy' | 'green' | 'amber' | 'red';

const tones: Record<StatTone, string> = {
  navy: 'text-navy',
  green: 'text-green',
  amber: 'text-amber',
  red: 'text-red',
};

export function Stat({ value, label, tone = 'navy' }: { value: ReactNode; label: string; tone?: StatTone }) {
  return (
    <div>
      <div className={`text-3xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-mute">{label}</div>
    </div>
  );
}
