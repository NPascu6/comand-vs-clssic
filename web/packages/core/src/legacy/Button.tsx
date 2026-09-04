import MuiButton from '@mui/material/Button';
import type { ButtonProps } from '../components/Button';

// LEGACY (the "before"): the original MUI-backed Button.
//
// It implements the SAME ButtonProps as the owned Tailwind Button, so a slice
// that does `import { Button } from '@atlas/core'` cannot tell which one it got.
// That is the whole point of the migration: swap the barrel export in
// core/index.ts from this to the Tailwind version and no slice changes.
export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const muiVariant = variant === 'ghost' ? 'outlined' : 'contained';
  const muiColor = variant === 'danger' ? 'error' : 'primary';
  return (
    <MuiButton
      variant={muiVariant}
      color={muiColor}
      size={size === 'sm' ? 'small' : 'medium'}
      disableElevation
      className={className}
      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
      // Legacy wrapper: forward native button attrs to MUI. The `as any` is the
      // friction of bridging two prop systems — gone once we drop MUI.
      {...(rest as any)}
    >
      {children}
    </MuiButton>
  );
}
