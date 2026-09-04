import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { THEME_MODES, createAtlasTheme } from './createAtlasTheme';
import type { ThemeMode } from './createAtlasTheme';

export interface AtlasThemeProviderProps {
  children: ReactNode;
  /** Used when nothing is persisted. Default 'light'. */
  initialMode?: ThemeMode;
  /** localStorage key. Default 'atlas.theme'. Reads/writes are try/catch-wrapped. */
  storageKey?: string;
}

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function isThemeMode(stored: string | null): stored is ThemeMode {
  return THEME_MODES.some((themeMode) => themeMode.id === stored);
}

// Storage can be unavailable (private mode, sandboxed iframes); a miss is not an error.
function readStoredMode(key: string): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(key);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredMode(key: string, mode: ThemeMode): void {
  try {
    window.localStorage.setItem(key, mode);
  } catch {
    // Persisting the mode is best-effort.
  }
}

/** MUI ThemeProvider + CssBaseline + the mode context. Sets `data-theme` on <html>. */
export function AtlasThemeProvider({ children, initialMode = 'light', storageKey = 'atlas.theme' }: AtlasThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode(storageKey) ?? initialMode);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      writeStoredMode(storageKey, next);
    },
    [storageKey],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const theme = useMemo(() => createAtlasTheme(mode), [mode]);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error('useThemeMode must be used inside <AtlasThemeProvider>');
  return context;
}
