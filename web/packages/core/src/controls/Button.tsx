import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  /** primary→contained/primary, ghost→outlined/primary, danger→contained/error. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a CircularProgress startIcon and disables. */
  loading?: boolean;
}

const VARIANT = {
  primary: { variant: 'contained', color: 'primary' },
  ghost: { variant: 'outlined', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
} as const;

const SIZE = { md: 'medium', sm: 'small' } as const;

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, startIcon, ...rest }: ButtonProps) {
  return (
    <MuiButton
      {...VARIANT[variant]}
      size={SIZE[size]}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    />
  );
}
