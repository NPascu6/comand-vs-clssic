import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Only `*.test.tsx`: the stories stay Storybook's, and `tests/` stays Deno's.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // The design system's styles are a stylesheet now, so the tests have to load one to assert on it.
    css: true,
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.tsx'],
  },
});
