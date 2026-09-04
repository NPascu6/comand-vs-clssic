import { useTheme } from '@mui/material/styles';
import type { ThemeInputs } from '@atlas/design-tokens';

/**
 * The tokens as this theme resolved them — the shipped export with any overrides already applied.
 * Components read tokens through here rather than importing `themeInputs`, so a host that passes
 * `tokens` to AtlasThemeProvider actually changes what they draw.
 */
export const useAtlasTokens = (): ThemeInputs => useTheme().atlas.tokens;
