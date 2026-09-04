import { Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import type { Tone } from '../system/tones';

export type TextVariant = 'title' | 'heading' | 'subheading' | 'body' | 'bodySmall' | 'caption' | 'overline';
export type TextTone = Tone | 'muted';

export const TEXT_VARIANTS: readonly TextVariant[] = ['title', 'heading', 'subheading', 'body', 'bodySmall', 'caption', 'overline'];

const MUI_VARIANT: Readonly<Record<TextVariant, TypographyProps['variant']>> = {
  title: 'h1',
  heading: 'h2',
  subheading: 'h3',
  body: 'body1',
  bodySmall: 'body2',
  caption: 'caption',
  overline: 'overline',
};

/** A tone as the palette path Typography's `color` resolves; `danger` is what MUI calls `error`. */
const COLOR: Readonly<Record<TextTone, string>> = {
  primary: 'primary.main',
  secondary: 'secondary.main',
  success: 'success.main',
  warning: 'warning.main',
  danger: 'error.main',
  info: 'info.main',
  neutral: 'text.primary',
  muted: 'text.secondary',
};

export interface TextProps extends Omit<TypographyProps, 'variant' | 'color'> {
  /** One entry of the type ramp: `typography.<variant>` decides its size, weight and line height. */
  variant?: TextVariant;
  /** Which palette colour it takes; none inherits. */
  tone?: TextTone;
  /** Clamp to this many lines, with an ellipsis. */
  truncate?: number;
}

/** MUI's Typography on the token ramp. */
export function Text({ variant = 'body', tone, truncate, sx, ...rest }: TextProps) {
  const clamp = truncate === undefined ? {} : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: truncate, overflow: 'hidden' };
  return <Typography variant={MUI_VARIANT[variant]} sx={[{ color: tone && COLOR[tone] }, clamp, ...(Array.isArray(sx) ? sx : [sx])]} {...rest} />;
}
