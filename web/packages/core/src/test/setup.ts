import '../styles.css';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25 defines its own inert `localStorage`, and Vitest's jsdom environment
// leaves an already-present global alone — so jsdom's Storage never arrives and
// AtlasThemeProvider's persistence would silently no-op. Install a working one.
const entries = new Map<string, string>();

const storage: Storage = {
  get length() {
    return entries.size;
  },
  key: (index) => [...entries.keys()][index] ?? null,
  getItem: (key) => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, String(value)),
  removeItem: (key) => entries.delete(key),
  clear: () => entries.clear(),
};

Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });

// One test's theme choice must not leak into the next.
afterEach(() => {
  cleanup();
  storage.clear();
});
