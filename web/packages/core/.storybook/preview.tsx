import '../src/styles.css';
import type { Preview } from '@storybook/react';
import { AtlasThemeProvider } from '../src/theme/AtlasThemeProvider';
import { DEFAULT_MODE, THEME_MODES } from '../src/theme/build/createAtlasTheme';

// Storybook's own key, so stories never read or write the app's persisted mode.
const STORAGE_KEY = 'atlas.theme.storybook';

// The provider prefers what is persisted over its defaults; clearing it keeps the toolbar in charge.
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
    mode: {
      description: 'Atlas theme mode',
      toolbar: {
        title: 'Mode',
        icon: 'contrast',
        items: THEME_MODES.map((themeMode) => ({ value: themeMode.id, title: themeMode.label })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Storybook types globals as `any`; matching them against the lists both narrows and survives a stale value.
      const mode = THEME_MODES.find((themeMode) => themeMode.id === context.globals.mode)?.id ?? DEFAULT_MODE;
      forgetStoredMode();
      // Remounting on a toolbar change re-runs the provider's initial-state read.
      return (
        <AtlasThemeProvider
          key={mode}
          defaultMode={mode}
          storageKey={STORAGE_KEY}
        >
          <Story />
        </AtlasThemeProvider>
      );
    },
  ],
};

export default preview;
