import { forwardRef } from 'react';
import { IconButton as MuiIconButton } from '@mui/material';
import type { IconButtonProps as MuiIconButtonProps } from '@mui/material';
import type { ButtonSize } from './Button';

const MUI_SIZE: Readonly<Record<ButtonSize, MuiIconButtonProps['size']>> = { sm: 'small', md: 'medium', lg: 'large' };

export interface IconButtonProps extends Omit<MuiIconButtonProps, 'size'> {
  /** Any glyph — an icon component, an inline SVG inside `Icon`. */
  icon: React.ReactNode;
  'aria-label': string;
  /** A square the size of the matching Button height. */
  size?: ButtonSize;
}

/** MUI's IconButton in the button tokens' square. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, size = 'md', ...rest },
  ref,
) {
  return (
    <MuiIconButton ref={ref} size={MUI_SIZE[size]} {...rest}>
      {icon}
    </MuiIconButton>
  );
});
