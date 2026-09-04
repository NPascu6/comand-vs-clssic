import type { ReactNode } from 'react';
import { cx } from '../util/cx';

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<PillTone, string> = {
  neutral: 'bg-[#EEF2F8] text-[#475569]',
  success: 'bg-[#E2F3EC] text-green',
  warning: 'bg-[#FBF0DA] text-[#9A6B14]',
  danger: 'bg-[#FBE3E2] text-red',
  info: 'bg-[#E5EEFA] text-navy',
};

export function StatusPill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={cx('inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}
