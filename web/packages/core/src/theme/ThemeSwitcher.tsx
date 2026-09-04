import type { ReactNode } from 'react';
import ContrastIcon from '@mui/icons-material/Contrast';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { ToggleGroup } from '../controls/ToggleGroup';
import type { ToggleOption } from '../controls/ToggleGroup';
import { THEME_MODES } from './createAtlasTheme';
import type { ThemeMode } from './createAtlasTheme';
import { useThemeMode } from './AtlasThemeProvider';

export interface ThemeSwitcherProps {
  size?: 'small' | 'medium';
}

const ICONS: Record<ThemeMode, ReactNode> = {
  light: <LightModeIcon fontSize="small" />,
  dark: <DarkModeIcon fontSize="small" />,
  contrast: <ContrastIcon fontSize="small" />,
};

// Icon-only buttons; the mode label becomes each button's aria-label.
const OPTIONS: ReadonlyArray<ToggleOption<ThemeMode>> = THEME_MODES.map((themeMode) => ({
  value: themeMode.id,
  label: null,
  icon: ICONS[themeMode.id],
  'aria-label': themeMode.label,
}));

/** An exclusive ToggleGroup of the three theme modes. Needs AtlasThemeProvider above it. */
export function ThemeSwitcher({ size = 'small' }: ThemeSwitcherProps) {
  const { mode, setMode } = useThemeMode();
  return <ToggleGroup value={mode} options={OPTIONS} onChange={setMode} size={size} aria-label="Theme" />;
}
