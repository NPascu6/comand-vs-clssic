import type { Preview } from '@storybook/react';
import { AtlasThemeProvider } from '../src/theme/AtlasThemeProvider';
import { THEME_MODES } from '../src/theme/createAtlasTheme';
import type { ThemeMode } from '../src/theme/createAtlasTheme';

// Storybook's own key, so stories never read or write the app's persisted mode.
const STORAGE_KEY = 'atlas.theme.storybook';

// The provider prefers what is persisted over `initialMode`; clearing it keeps the toolbar in charge.
function forgetStoredMode(): void {
  try {
    globalThis.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable; the toolbar still sets the mode.
  }
}

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // CssBaseline paints the theme background; the backgrounds addon would fight it.
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    themeMode: {
      description: 'Atlas theme mode',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEME_MODES.map((themeMode) => ({ value: themeMode.id, title: themeMode.label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { themeMode: 'light' },
  decorators: [
    (Story, context) => {
      const mode = context.globals.themeMode as ThemeMode;
      forgetStoredMode();
      // Remounting on mode change re-runs the provider's initial-state read.
      return (
        <AtlasThemeProvider key={mode} initialMode={mode} storageKey={STORAGE_KEY}>
          <Story />
        </AtlasThemeProvider>
      );
    },
  ],
};

export default preview;
