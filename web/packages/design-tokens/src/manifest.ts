export type ThemeMode = 'light' | 'dark' | 'contrast';

export interface PaletteInputs {
  /** MUI palette mode; contrast is a light palette pushed to black/white. */
  mode: 'light' | 'dark';
  primary: { main: string; light: string; contrastText: string };
  secondary: { main: string };
  success: { main: string };
  warning: { main: string };
  error: { main: string };
  info: { main: string };
  text: { primary: string; secondary: string };
  divider: string;
  background: { default: string; paper: string };
  /** Outline of cards, grids, inputs, chips. 1px divider normally; 2px black in contrast. */
  border: { width: number; color: string };
  /** Focus ring. width 0 = MUI's default ring; contrast uses 3px black. */
  focus: { width: number; color: string };
  /** Contained buttons in contrast mode are black text on white with a border, inverting on hover; absent otherwise. */
  buttonContained?: { background: string; text: string; hoverBackground: string; hoverText: string };
}

export interface ThemeInputs {
  palettes: Record<ThemeMode, PaletteInputs>;
  font: { sans: string; mono: string };
  /** control = buttons, inputs, MUI shape.borderRadius; surface = cards, papers, the data grid. */
  radius: { control: number; surface: number };
  typography: {
    button: { weight: number };
    chip: { weight: number };
    overline: { size: number; weight: number; letterSpacing: string; lineHeight: number };
    tableHeader: { size: number; weight: number; letterSpacing: string };
  };
}

/** The value a token path must carry. `number` also takes a px dimension. */
export type TokenKind = 'color' | 'number' | 'fontWeight' | 'fontFamily' | 'string';

export type TokenPaths = Readonly<Record<string, TokenKind>>;

/** Required in every mode file (light, dark, contrast, and any other mode Figma exports). */
export const MODE_PATHS: TokenPaths = {
  'palette.mode': 'string',
  'color.primary.main': 'color',
  'color.primary.light': 'color',
  'color.primary.contrastText': 'color',
  'color.secondary.main': 'color',
  'color.success.main': 'color',
  'color.warning.main': 'color',
  'color.error.main': 'color',
  'color.info.main': 'color',
  'color.text.primary': 'color',
  'color.text.secondary': 'color',
  'color.divider': 'color',
  'color.background.default': 'color',
  'color.background.paper': 'color',
  'border.width': 'number',
  'border.color': 'color',
  'focus.width': 'number',
  'focus.color': 'color',
};

/** Optional per mode: all four or none. */
export const BUTTON_CONTAINED_PATHS: TokenPaths = {
  'button.contained.background': 'color',
  'button.contained.text': 'color',
  'button.contained.hoverBackground': 'color',
  'button.contained.hoverText': 'color',
};

/** Required in Base, shared by every mode. */
export const BASE_PATHS: TokenPaths = {
  'font.sans': 'fontFamily',
  'font.mono': 'fontFamily',
  'radius.control': 'number',
  'radius.surface': 'number',
  'typography.button.weight': 'fontWeight',
  'typography.chip.weight': 'fontWeight',
  'typography.overline.size': 'number',
  'typography.overline.weight': 'fontWeight',
  'typography.overline.letterSpacing': 'string',
  'typography.overline.lineHeight': 'number',
  'typography.tableHeader.size': 'number',
  'typography.tableHeader.weight': 'fontWeight',
  'typography.tableHeader.letterSpacing': 'string',
};
