import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../util/cx';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mute">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-mute">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red">{error}</span>}
    </label>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid, className, ...rest }: TextInputProps) {
  return (
    <input
      className={cx(
        'w-full rounded-[8px] border bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/30',
        invalid ? 'border-red' : 'border-line',
        className,
      )}
      {...rest}
    />
  );
}
