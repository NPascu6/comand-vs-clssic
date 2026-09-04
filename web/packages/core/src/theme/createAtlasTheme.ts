import { createTheme } from '@mui/material/styles';
import type { Components, PaletteOptions, Shadows, Theme } from '@mui/material/styles';
import '@mui/x-data-grid/themeAugmentation';
import { themeInputs } from '@atlas/design-tokens';
import type { PaletteInputs, ThemeMode } from '@atlas/design-tokens';

// Exposes the mono stack as `theme.typography.fontFamilyMono` (MUI 9's TypographyVariants interfaces).
declare module '@mui/material/styles' {
  interface TypographyVariants {
    fontFamilyMono: string;
  }
  interface TypographyVariantsOptions {
    fontFamilyMono?: string;
  }
}

export type { ThemeMode };

export const THEME_MODES: ReadonlyArray<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'High contrast' },
];

const { font, radius, typography } = themeInputs;

const NO_SHADOWS: Shadows = [
  'none', 'none', 'none', 'none', 'none',
  'none', 'none', 'none', 'none', 'none',
  'none', 'none', 'none', 'none', 'none',
  'none', 'none', 'none', 'none', 'none',
  'none', 'none', 'none', 'none', 'none',
];

// Lifts the focus ring off the control's own border. Not a Figma token.
const FOCUS_RING_OFFSET = 2;

/** Border, focus and buttonContained are not palette entries; they feed the component overrides instead. */
function paletteOptions(inputs: PaletteInputs): PaletteOptions {
  return {
    mode: inputs.mode,
    primary: inputs.primary,
    secondary: inputs.secondary,
    success: inputs.success,
    warning: inputs.warning,
    error: inputs.error,
    info: inputs.info,
    text: inputs.text,
    divider: inputs.divider,
    background: inputs.background,
  };
}

/** What a mode overrides follows from its tokens: a heavy border, a focus ring, a contained-button colour set. */
function components(inputs: PaletteInputs, contrast: boolean): Components<Theme> {
  const border = `${inputs.border.width}px solid ${inputs.border.color}`;
  // MUI draws its own 1px outline on buttons, inputs, toggles and chips; the token replaces it only when heavier.
  const heavyBorder = inputs.border.width > 1;
  const controlBorder = heavyBorder ? { border } : {};
  const focusRing =
    inputs.focus.width > 0
      ? { outline: `${inputs.focus.width}px solid ${inputs.focus.color}`, outlineOffset: FOCUS_RING_OFFSET }
      : undefined;
  const contained = inputs.buttonContained;
  return {
    MuiCssBaseline: {
      styleOverrides: focusRing ? { '*:focus-visible': focusRing } : {},
    },
    MuiButtonBase: {
      styleOverrides: { root: focusRing ? { '&.Mui-focusVisible': focusRing } : {} },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.control, fontWeight: typography.button.weight },
        outlined: heavyBorder ? { border, '&:hover': { border } } : {},
        contained: contained
          ? {
              backgroundColor: contained.background,
              color: contained.text,
              border,
              '&:hover': { backgroundColor: contained.hoverBackground, color: contained.hoverText },
            }
          : {},
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { notchedOutline: controlBorder },
    },
    MuiToggleButton: {
      styleOverrides: { root: controlBorder },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: { borderRadius: radius.surface, border, boxShadow: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: radius.surface } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: typography.chip.weight }, outlined: controlBorder },
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
    MuiLink: {
      // No token covers link underlining; it stays keyed on the mode, like the shadows.
      defaultProps: { underline: contrast ? 'always' : 'hover' },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.surface,
          border,
          '--DataGrid-containerBackground': theme.palette.background.default,
          '--DataGrid-rowBorderColor': theme.palette.divider,
        }),
        columnHeader: ({ theme }) => ({ backgroundColor: theme.palette.background.default }),
        columnHeaderTitle: ({ theme }) => ({
          fontSize: typography.tableHeader.size,
          fontWeight: typography.tableHeader.weight,
          textTransform: 'uppercase',
          letterSpacing: typography.tableHeader.letterSpacing,
          color: theme.palette.text.secondary,
        }),
        cell: ({ theme }) => ({ borderColor: theme.palette.divider }),
      },
    },
  };
}

export function createAtlasTheme(mode: ThemeMode): Theme {
  const palette = themeInputs.palettes[mode];
  const contrast = mode === 'contrast';
  return createTheme({
    palette: paletteOptions(palette),
    shape: { borderRadius: radius.control },
    // An explicit `shadows: undefined` would deep-merge over MUI's defaults, so the key is only set in contrast.
    ...(contrast ? { shadows: NO_SHADOWS } : {}),
    typography: {
      fontFamily: font.sans,
      fontFamilyMono: font.mono,
      button: { textTransform: 'none', fontWeight: typography.button.weight },
      overline: {
        fontSize: typography.overline.size,
        fontWeight: typography.overline.weight,
        letterSpacing: typography.overline.letterSpacing,
        lineHeight: typography.overline.lineHeight,
      },
    },
    components: components(palette, contrast),
  });
}
