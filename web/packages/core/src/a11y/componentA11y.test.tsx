import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../test/renderWithTheme';
import { COMPONENT_SAMPLES } from './componentSamples';
import type { ComponentGroup, ComponentSample } from './componentSamples';
import { THEME_MODES } from '../theme/build/createAtlasTheme';
import { describeViolations, violationsOf } from './runAxe';

const PALETTE_MODES = THEME_MODES.map((themeMode) => themeMode.id);

const GROUPS: readonly ComponentGroup[] = [...new Set(COMPONENT_SAMPLES.map((sample) => sample.group))];

const samplesIn = (group: ComponentGroup): ComponentSample[] => COMPONENT_SAMPLES.filter((sample) => sample.group === group);

describe.each(PALETTE_MODES)('%s mode', (mode) => {
  describe.each(GROUPS)('%s', (group) => {
    // Overlays portal outside the render container, so the whole document is the context.
    it.each(samplesIn(group))('$id', async ({ render }) => {
      renderWithTheme(render(), { mode });
      expect(describeViolations(await violationsOf(document.body))).toEqual([]);
    });
  });
});
