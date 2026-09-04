import { cx } from '../util/cx';

export type MeterTone = 'green' | 'amber' | 'red' | 'auto';

export interface MeterProps {
  value: number;
  max: number;
  label?: string;
  /** 'auto' colours by fill: <80% green, <100% amber, >=100% red. */
  tone?: MeterTone;
  format?: (n: number) => string;
}

const bars: Record<Exclude<MeterTone, 'auto'>, string> = {
  green: 'bg-green',
  amber: 'bg-amber',
  red: 'bg-red',
};

export function Meter({ value, max, label, tone = 'auto', format }: MeterProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const resolved = tone === 'auto' ? (pct >= 100 ? 'red' : pct >= 80 ? 'amber' : 'green') : tone;
  const fmt = format ?? ((n: number) => n.toLocaleString('en-US'));
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink">{label}</span>
          <span className="text-mute tabular-nums">
            {fmt(value)} / {fmt(max)} · {pct}%
          </span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-pill bg-[#EEF2F8]">
        <div className={cx('h-full rounded-pill transition-all', bars[resolved])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
