const preset = require('@atlas/core/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The Atlas design system is owned by `core` and consumed as a preset.
  presets: [preset],
  // Scan the app AND the workspace packages so utility classes used inside
  // `core` and the slices are not purged from the build.
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/core/src/**/*.{ts,tsx}',
    '../../slices/*/src/**/*.{ts,tsx}',
  ],
};
