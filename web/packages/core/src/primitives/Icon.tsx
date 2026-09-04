import type { ReactNode, SVGProps } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';

export type IconSize = 'sm' | 'md' | 'lg';

export const ICON_SIZES: readonly IconSize[] = ['sm', 'md', 'lg'];

export interface IconProps extends Omit<BoxProps<'span'>, 'component'> {
  /** Any glyph: an inline `<svg>`, an icon component, an `<img>`. It is sized and coloured here. */
  children: ReactNode;
  /** `component.icon.size*` — the square it is drawn in. */
  size?: IconSize;
  /** Decorative unless labelled, so a screen reader skips it. */
  label?: string;
}

/** The seam for a product's own artwork: sized from the icon tokens, inheriting the text colour. */
export function Icon({ children, size = 'md', label, sx, ...rest }: IconProps) {
  const side = `var(--atlas-component-icon-size-${size})`;
  return (
    <Box
      component="span"
      role={label === undefined ? 'presentation' : 'img'}
      aria-label={label}
      aria-hidden={label === undefined || undefined}
      sx={[
        { display: 'inline-flex', flexShrink: 0, width: side, height: side, '& > *': { width: '100%', height: '100%', display: 'block' } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}

/** The props a custom `<svg>` should carry to size and colour itself from the design system. */
export const svgDefaults: Pick<SVGProps<SVGSVGElement>, 'width' | 'height' | 'fill' | 'focusable' | 'aria-hidden'> = {
  width: '100%',
  height: '100%',
  fill: 'currentColor',
  focusable: false,
  'aria-hidden': true,
};
