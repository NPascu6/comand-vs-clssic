// The harness the design system tests itself with, so anything built on it tests the same way:
// a render inside the real theme, and the colours the emitted rules actually carry.

export { renderWithTheme } from './renderWithTheme';
export type { RenderWithThemeOptions } from './renderWithTheme';
export { emittedColorsOf, emittedValuesOf, RENDERED_PALETTE } from './emittedColor';
