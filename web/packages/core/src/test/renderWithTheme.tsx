import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { AtlasThemeProvider } from '../theme/AtlasThemeProvider';
import { DEFAULT_MODE } from '../theme/build/createAtlasTheme';
import type { ThemeMode, ThemeOverrides } from '../theme/build/createAtlasTheme';

export interface RenderWithThemeOptions extends Omit<RenderOptions, 'wrapper'> {
  mode?: ThemeMode;
  /** Token overrides, so a test can render the skin a host would pass rather than only the default. */
  tokens?: ThemeOverrides;
}

export function renderWithTheme(
  ui: ReactElement,
  { mode = DEFAULT_MODE, tokens, ...options }: RenderWithThemeOptions = {},
): RenderResult {
  const Themed = ({ children }: { children: ReactNode }) => (
    <AtlasThemeProvider defaultMode={mode} tokens={tokens}>
      {children}
    </AtlasThemeProvider>
  );
  return render(ui, { wrapper: Themed, ...options });
}
