import { forwardRef } from 'react';
import { Button as MuiButton } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const BUTTON_VARIANTS: readonly ButtonVariant[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
export const BUTTON_SIZES: readonly ButtonSize[] = ['sm', 'md', 'lg'];

const MUI_VARIANT: Readonly<Record<ButtonVariant, MuiButtonProps['variant']>> = {
  solid: 'contained',
  outline: 'outlined',
  soft: 'text',
  ghost: 'text',
  link: 'text',
};

const MUI_SIZE: Readonly<Record<ButtonSize, MuiButtonProps['size']>> = { sm: 'small', md: 'medium', lg: 'large' };

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  /** Which `component.button.*` colours it takes; the theme styles each from the tokens. */
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** MUI's Button, sized and coloured by the button tokens. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', ...rest },
  ref,
) {
  return <MuiButton ref={ref} variant={MUI_VARIANT[variant]} size={MUI_SIZE[size]} data-variant={variant} {...rest} />;
});
