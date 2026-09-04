import type { ReactNode } from 'react';
import { MenuItem, TextField } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  helperText?: ReactNode;
  error?: boolean;
  disabled?: boolean;
  /** Default true. */
  fullWidth?: boolean;
  /** Default 'small'. */
  size?: 'small' | 'medium';
  /** If the current value is not in options, it is prepended as "<value> (not found)". Default true. */
  keepCurrent?: boolean;
  'aria-label'?: string;
  sx?: SxProps<Theme>;
}

// A stale value (e.g. a locale the backend no longer offers) stays selectable, so the control never shows the wrong option.
function withCurrent(options: SelectOption[], value: string, keepCurrent: boolean): SelectOption[] {
  if (!keepCurrent || value === '' || options.some((option) => option.value === value)) return options;
  return [{ value, label: `${value} (not found)` }, ...options];
}

/** MUI TextField in select mode. */
export function Select({
  value,
  options,
  onChange,
  label,
  helperText,
  error,
  disabled,
  fullWidth = true,
  size = 'small',
  keepCurrent = true,
  'aria-label': ariaLabel,
  sx,
}: SelectProps) {
  return (
    <TextField
      select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      sx={sx}
      slotProps={{ select: { inputProps: ariaLabel ? { 'aria-label': ariaLabel } : undefined } }}
    >
      {withCurrent(options, value, keepCurrent).map((option) => (
        <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
