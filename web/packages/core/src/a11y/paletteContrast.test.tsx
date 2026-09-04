import { describe, expect, it } from 'vitest';
import { checkContrast, themeInputs } from '@atlas/design-tokens';
import type { ThemeMode } from '@atlas/design-tokens';

const MODES: readonly ThemeMode[] = ['light', 'dark', 'contrast'];

// The same gate the Figma sync runs before a release may be published, run here against the
// export the library ships — so a palette cannot reach a consumer that the sync would have refused.
describe.each(MODES)('%s palette', (mode) => {
  it('clears WCAG AA on every pair the theme promises', () => {
    const shortfalls = checkContrast(themeInputs.palettes[mode]).map(
      (finding) => `${finding.id} — ${finding.ratio.toFixed(2)}:1, needs ${finding.minimum}:1`,
    );
    expect(shortfalls).toEqual([]);
  });
});
