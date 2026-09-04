import type { SelectHTMLAttributes } from 'react';
import { cx } from '../util/cx';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cx(
        'w-full rounded-[8px] border bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/30',
        invalid ? 'border-red' : 'border-line',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
