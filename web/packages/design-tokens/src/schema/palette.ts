import { at } from './kinds.ts';
import type { TokensOf } from './kinds.ts';
import { semantic } from './semantic.ts';

export type ThemeMode = 'light' | 'dark' | 'contrast';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'contrast'];

/** One mode's palette. Read from that mode's file, cascading to Base. */
export const palette = {
  mode: at('palette.mode', 'string'),
  primary: {
    main: at('color.primary.main', 'color'),
    light: at('color.primary.light', 'color'),
    /** The pale tint a tinted control sits on — the designer's, not a blend. */
    soft: at('color.primary.soft', 'color'),
    contrastText: at('color.primary.contrastText', 'color'),
  },
  secondary: { main: at('color.secondary.main', 'color') },
  success: { main: at('color.success.main', 'color') },
  warning: { main: at('color.warning.main', 'color') },
  error: { main: at('color.error.main', 'color') },
  info: { main: at('color.info.main', 'color') },
  text: { primary: at('color.text.primary', 'color'), secondary: at('color.text.secondary', 'color') },
  divider: at('color.divider', 'color'),
  background: { default: at('color.background.default', 'color'), paper: at('color.background.paper', 'color') },
  border: { width: 'number', color: 'color' },
  focus: { width: 'number', color: 'color' },
} as const;

/** Optional as a set: a mode gives all four or none. */
export const buttonContained = {
  background: at('button.contained.background', 'color'),
  text: at('button.contained.text', 'color'),
  hoverBackground: at('button.contained.hoverBackground', 'color'),
  hoverText: at('button.contained.hoverText', 'color'),
} as const;

export interface PaletteInputs extends TokensOf<typeof palette> {
  mode: 'light' | 'dark';
  buttonContained?: TokensOf<typeof buttonContained>;
  semantic: TokensOf<typeof semantic>;
}
