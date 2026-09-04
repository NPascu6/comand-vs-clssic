import type { ReactNode } from 'react';
import { cx } from '../util/cx';

export type EdgeTone = 'navy' | 'green' | 'amber' | 'red';

export interface CardProps {
  children: ReactNode;
  /** Optional thick left edge — the design-system motif. */
  edge?: EdgeTone;
  className?: string;
}

const edges: Record<EdgeTone, string> = {
  navy: 'before:bg-navy',
  green: 'before:bg-green',
  amber: 'before:bg-amber',
  red: 'before:bg-red',
};

export function Card({ children, edge, className }: CardProps) {
  return (
    <div
      className={cx(
        'relative rounded-card border border-line bg-surface shadow-sm',
        edge && "overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] before:content-['']",
        edge && edges[edge],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
      <div>
        <div className="font-semibold text-ink">{title}</div>
        {subtitle && <div className="text-xs text-mute">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
