import type { TokensOf } from './kinds.ts';
import { components } from './components.ts';
import type { PaletteInputs, ThemeMode } from './palette.ts';

const typeStyle = { size: 'number', weight: 'fontWeight', lineHeight: 'number' } as const;

/** The mode-independent tokens, read once from Base. */
export const shared = {
  font: { sans: 'fontFamily', mono: 'fontFamily' },
  radius: { control: 'number', surface: 'number' },
  opacity: { soft: 'number', disabled: 'number' },
  typography: {
    title: typeStyle,
    heading: typeStyle,
    subheading: typeStyle,
    body: typeStyle,
    bodySmall: typeStyle,
    caption: typeStyle,
    button: { weight: 'fontWeight' },
    overline: { size: 'number', weight: 'fontWeight', letterSpacing: 'string', lineHeight: 'number' },
  },
  space: { xs: 'number', sm: 'number', md: 'number', lg: 'number', xl: 'number' },
  layout: { contentPadding: 'number', contentGap: 'number' },
} as const;

export type TypeStyle = TokensOf<typeof typeStyle>;
export type TypeRamp = Pick<TokensOf<typeof shared>['typography'], 'title' | 'heading' | 'subheading' | 'body' | 'bodySmall' | 'caption'>;

/** What createAtlasTheme reads: the shared tokens, a palette per mode, and the component tokens. */
export interface ThemeInputs extends TokensOf<typeof shared> {
  palettes: Record<ThemeMode, PaletteInputs>;
  components: TokensOf<typeof components>;
}

export type { ComponentTokens, ButtonTokens, HeaderTokens, IconTokens } from './components.ts';
export type { PaletteInputs, ThemeMode } from './palette.ts';
export type { SemanticInputs } from './semantic.ts';
export { SERIES_LENGTH } from './semantic.ts';
export { THEME_MODES } from './palette.ts';
