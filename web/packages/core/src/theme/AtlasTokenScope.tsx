import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { changedCssVariables } from '@atlas/design-tokens';
import type { ThemeOverrides } from '@atlas/design-tokens';
import { createAtlasTheme } from './build/createAtlasTheme';
import type { CSSProperties } from 'react';

export interface AtlasTokenScopeProps {
  children: ReactNode;
  /** Laid over whatever this subtree already inherited, so scopes nest. */
  tokens: ThemeOverrides;
}

/**
 * Token overrides for one part of the tree.
 *
 *     <AtlasTokenScope tokens={{ components: { button: { radius: 0 } } }}>
 *       <Button>…</Button>
 *     </AtlasTokenScope>
 */
export function AtlasTokenScope({ children, tokens }: AtlasTokenScopeProps) {
  const outer = useTheme();
  const theme = useMemo(
    () => createAtlasTheme({ mode: outer.atlas.mode, tokens, base: outer.atlas.tokens }),
    [outer.atlas.mode, outer.atlas.tokens, tokens],
  );
  const properties = useMemo(
    () => changedCssVariables(outer.atlas.tokens, theme.atlas.tokens, theme.atlas.mode) as CSSProperties,
    [outer.atlas.tokens, theme],
  );
  return (
    <ThemeProvider theme={theme}>
      <div style={properties}>{children}</div>
    </ThemeProvider>
  );
}
