import type { ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export interface ToggleOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  'aria-label'?: string;
}

export interface ToggleGroupProps<T extends string> {
  value: T;
  options: ReadonlyArray<ToggleOption<T>>;
  onChange: (value: T) => void;
  /** Default 'small'. */
  size?: 'small' | 'medium';
  'aria-label': string;
}

/** Exclusive ToggleButtonGroup. Clicking the active option is ignored (no deselect). */
export function ToggleGroup<T extends string>({ value, options, onChange, size = 'small', 'aria-label': ariaLabel }: ToggleGroupProps<T>) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      size={size}
      aria-label={ariaLabel}
      onChange={(_, next: T | null) => {
        if (next !== null) onChange(next);
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} aria-label={option['aria-label']} sx={{ gap: 0.75 }}>
          {option.icon}
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
