import { createTheme } from '@mui/material/styles';
import type { Components, Theme } from '@mui/material/styles';
import { applyOverrides, themeInputs } from '@atlas/design-tokens';
import type { ThemeInputs, ThemeMode, ThemeOverrides, TypeStyle } from '@atlas/design-tokens';

export interface AtlasThemeExtras {
  mode: ThemeMode;
  tokens: ThemeInputs;
}

declare module '@mui/material/styles' {
  interface Theme {
    atlas: AtlasThemeExtras;
  }
  interface ThemeOptions {
    atlas?: AtlasThemeExtras;
  }
}

export type { ThemeMode, ThemeOverrides };
export type AtlasTheme = Theme;

export const THEME_MODES: ReadonlyArray<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'High contrast' },
];

export const DEFAULT_MODE: ThemeMode = 'light';

/** A token as the custom property the export writes for it, so a scope's override reaches the style. */
const token = (path: string) => `var(--atlas-${path.replace(/\./g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()})`;

const styleOf = ({ size, weight, lineHeight }: TypeStyle) => ({ fontSize: size, fontWeight: weight, lineHeight });

/**
 * MUI's components, styled from the tokens. Every value is a `var(--atlas-…)` rather than a
 * number, which is what lets an `AtlasTokenScope` restyle a subtree by setting properties on it.
 */
const components: Components<Theme> = {
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        textTransform: 'none',
        gap: token('component.button.gap'),
        borderRadius: token('component.button.radius'),
        fontWeight: token('component.button.fontWeight'),
        '&:disabled': { opacity: token('opacity.disabled') },
      },
      sizeSmall: { minHeight: token('component.button.heightSm'), paddingInline: token('component.button.paddingInlineSm') },
      sizeMedium: { minHeight: token('component.button.heightMd'), paddingInline: token('component.button.paddingInlineMd') },
      sizeLarge: { minHeight: token('component.button.heightLg'), paddingInline: token('component.button.paddingInlineLg') },
      contained: {
        backgroundColor: token('component.button.solidBackground'),
        color: token('component.button.solidText'),
        '&:hover': { backgroundColor: token('component.button.solidHoverBackground') },
      },
      outlined: {
        borderColor: token('component.button.outlineBorder'),
        color: token('component.button.outlineText'),
        '&:hover': { backgroundColor: token('component.button.hoverSurface') },
      },
      text: {
        color: token('component.button.ghostText'),
        '&:hover': { backgroundColor: token('component.button.hoverSurface') },
        '&[data-variant="soft"]': {
          backgroundColor: token('component.button.softBackground'),
          color: token('component.button.softText'),
        },
        '&[data-variant="link"]': { textDecoration: 'underline', paddingInline: 0, minHeight: 0 },
      },
      startIcon: { marginInline: 0 },
      endIcon: { marginInline: 0 },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: token('component.button.radius'),
        color: token('component.button.ghostText'),
        '&:hover': { backgroundColor: token('component.button.hoverSurface') },
        '&:disabled': { opacity: token('opacity.disabled') },
      },
      sizeSmall: { width: token('component.button.heightSm'), height: token('component.button.heightSm') },
      sizeMedium: { width: token('component.button.heightMd'), height: token('component.button.heightMd') },
      sizeLarge: { width: token('component.button.heightLg'), height: token('component.button.heightLg') },
    },
  },
  MuiSvgIcon: {
    styleOverrides: {
      fontSizeSmall: { fontSize: token('component.icon.sizeSm') },
      fontSizeMedium: { fontSize: token('component.icon.sizeMd') },
      fontSizeLarge: { fontSize: token('component.icon.sizeLg') },
    },
  },
  MuiAppBar: {
    defaultProps: { color: 'inherit', elevation: 0 },
    styleOverrides: {
      root: {
        backgroundColor: token('background.paper'),
        borderBlockEnd: `${token('border.width')} solid ${token('component.header.borderColor')}`,
      },
    },
  },
  MuiToolbar: {
    defaultProps: { disableGutters: true },
    styleOverrides: {
      root: {
        gap: token('component.header.gap'),
        paddingInline: token('component.header.paddingInline'),
        minHeight: token('component.header.height'),
        '@media (min-width: 0px)': { minHeight: token('component.header.height'), paddingInline: token('component.header.paddingInline') },
        '&.MuiToolbar-dense': { minHeight: token('component.header.heightCompact') },
      },
    },
  },
};

export interface CreateAtlasThemeOptions {
  mode?: ThemeMode;
  /** Token values laid over the shipped ones — every token is reachable. */
  tokens?: ThemeOverrides;
  /** What the overrides are laid over; a nested scope passes what it inherited, so scopes compose. */
  base?: ThemeInputs;
}

export function createAtlasTheme({ mode = DEFAULT_MODE, tokens, base = themeInputs }: CreateAtlasThemeOptions = {}): AtlasTheme {
  const inputs = applyOverrides(base, tokens);
  const { font, radius, typography } = inputs;
  const { mode: paletteMode, primary, secondary, success, warning, error, info, text, divider, background } = inputs.palettes[mode];
  return createTheme({
    atlas: { mode, tokens: inputs },
    palette: { mode: paletteMode, primary, secondary, success, warning, error, info, text, divider, background },
    shape: { borderRadius: radius.control },
    typography: {
      fontFamily: font.sans,
      h1: styleOf(typography.title),
      h2: styleOf(typography.heading),
      h3: styleOf(typography.subheading),
      body1: styleOf(typography.body),
      body2: styleOf(typography.bodySmall),
      caption: styleOf(typography.caption),
      overline: { ...styleOf(typography.overline), letterSpacing: typography.overline.letterSpacing },
      button: { textTransform: 'none', fontWeight: typography.button.weight },
    },
    components,
  });
}

const cache = new Map<ThemeMode, AtlasTheme>();

export function getAtlasTheme(mode: ThemeMode): AtlasTheme {
  const cached = cache.get(mode);
  if (cached) return cached;
  const theme = createAtlasTheme({ mode });
  cache.set(mode, theme);
  return theme;
}

export const atlasTheme: AtlasTheme = getAtlasTheme(DEFAULT_MODE);
