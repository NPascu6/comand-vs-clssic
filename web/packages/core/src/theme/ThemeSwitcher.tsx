import type { ReactNode } from 'react';
import ContrastIcon from '@mui/icons-material/Contrast';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { Stack } from '../primitives/Stack';
import { IconButton } from '../controls/IconButton';
import { THEME_MODES } from './build/createAtlasTheme';
import type { ThemeMode } from './build/createAtlasTheme';
import { useAtlasTheme } from './AtlasThemeProvider';

const ICONS: Readonly<Record<ThemeMode, ReactNode>> = {
  light: <LightModeIcon fontSize="small" />,
  dark: <DarkModeIcon fontSize="small" />,
  contrast: <ContrastIcon fontSize="small" />,
};

/** The one control the library ships for its own sake: light, dark, high contrast. */
export function ThemeSwitcher() {
  const { mode, setMode } = useAtlasTheme();
  return (
    <Stack direction="row" gap="xs" align="center">
      {THEME_MODES.map((themeMode) => (
        <IconButton
          key={themeMode.id}
          icon={ICONS[themeMode.id]}
          aria-label={themeMode.label}
          aria-pressed={themeMode.id === mode}
          color={themeMode.id === mode ? 'primary' : 'default'}
          onClick={() => setMode(themeMode.id)}
        />
      ))}
    </Stack>
  );
}
