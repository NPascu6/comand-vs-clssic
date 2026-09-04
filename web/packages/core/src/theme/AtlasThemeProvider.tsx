import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { cssVariables } from '@atlas/design-tokens';
import { DEFAULT_MODE, THEME_MODES, createAtlasTheme, getAtlasTheme } from './build/createAtlasTheme';
import type { AtlasTheme, ThemeMode, ThemeOverrides } from './build/createAtlasTheme';

export interface AtlasThemeProviderProps {
  children: ReactNode;
  /** Used when nothing is persisted. Default 'light'. */
  defaultMode?: ThemeMode;
  /**
   * Token values to lay over the shipped ones — how a host re-skins without a stylesheet.
   * Ignored when `theme` is passed, which is already a built theme.
   */
  tokens?: ThemeOverrides;
  /** A theme built elsewhere. Pass `atlasTheme` for the defaults and configure nothing. */
  theme?: AtlasTheme;
  /** localStorage key. Default 'atlas.theme'. Reads and writes are try/catch-wrapped. */
  storageKey?: string;
}

export interface AtlasThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: AtlasTheme;
}

const AtlasThemeContext = createContext<AtlasThemeContextValue | null>(null);

const isThemeMode = (value: unknown): value is ThemeMode => THEME_MODES.some((themeMode) => themeMode.id === value);

// Storage can be unavailable (private mode, sandboxed iframes); a miss is not an error.
function readStoredMode(key: string): ThemeMode | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return isThemeMode(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredMode(key: string, mode: ThemeMode): void {
  try {
    window.localStorage.setItem(key, mode);
  } catch {
    // Persisting the mode is best-effort.
  }
}

/** The theme, the mode and its persistence. Stamps `data-theme` on <html>, which the stylesheet keys on. */
export function AtlasThemeProvider({
  children,
  defaultMode = DEFAULT_MODE,
  tokens,
  theme,
  storageKey = 'atlas.theme',
}: AtlasThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode(storageKey) ?? defaultMode);

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


  // An un-overridden theme comes from the cache; overrides have no stable identity to key on.
  const active = useMemo(
    () => theme ?? (tokens ? createAtlasTheme({ mode, tokens }) : getAtlasTheme(mode)),
    [theme, tokens, mode],
  );

  // Every token for the mode, as the custom properties the theme's styles read. Written here so
  // an application configures nothing but this provider, and before paint so nothing flashes.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const variables = cssVariables(active.atlas.tokens, mode);
    for (const [name, value] of Object.entries(variables)) root.style.setProperty(name, value);
    return () => {
      for (const name of Object.keys(variables)) root.style.removeProperty(name);
    };
  }, [active, mode]);

  const value = useMemo(() => ({ mode, setMode, theme: active }), [mode, setMode, active]);

  return (
    <AtlasThemeContext.Provider value={value}>
      <ThemeProvider theme={active}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AtlasThemeContext.Provider>
  );
}

export function useAtlasTheme(): AtlasThemeContextValue {
  const context = useContext(AtlasThemeContext);
  if (!context) throw new Error('useAtlasTheme must be used inside <AtlasThemeProvider>');
  return context;
}
