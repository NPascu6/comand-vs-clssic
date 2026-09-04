import type { Meta, StoryObj } from '@storybook/react';
import type { ThemeOverrides } from '@atlas/design-tokens';
import { Button } from '../controls/Button';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { AtlasTokenScope } from './AtlasTokenScope';

const SQUARED: ThemeOverrides = { components: { button: { radius: 0, heightMd: 52 } } };
// A second brand, stated as the tokens a designer would publish rather than as CSS.
const REBRANDED: ThemeOverrides = {
  palettes: {
    light: { primary: { main: '#7A4E24', soft: '#F3E7DA' } },
    dark: { primary: { main: '#C08B54', soft: '#3A2A18' } },
  },
};

const meta = {
  title: 'Theme/AtlasTokenScope',
  component: AtlasTokenScope,
  args: { tokens: SQUARED, children: null },
} satisfies Meta<typeof AtlasTokenScope>;
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * How an application changes the design system without writing CSS: it passes token values. The
 * scope sets those tokens as custom properties on its subtree, so everything inside restyles and
 * everything outside is untouched.
 */
export const Scoped: Story = {
  render: () => (
    <Stack gap="lg" align="start">
      <Stack gap="xs" align="start">
        <Text variant="overline" tone="muted">
          shipped tokens
        </Text>
        <Button>Commit capital</Button>
      </Stack>
      <AtlasTokenScope tokens={SQUARED}>
        <Stack gap="xs" align="start">
          <Text variant="overline" tone="muted">
            one scope: radius 0, height 52
          </Text>
          <Button>Commit capital</Button>
        </Stack>
      </AtlasTokenScope>
    </Stack>
  ),
};

/** Scopes nest: the inner one keeps what the outer set and adds a palette of its own. */
export const Nested: Story = {
  render: () => (
    <AtlasTokenScope tokens={SQUARED}>
      <Stack gap="lg" align="start">
        <Button>Outer scope</Button>
        <AtlasTokenScope tokens={REBRANDED}>
          <Button>Inner scope</Button>
        </AtlasTokenScope>
      </Stack>
    </AtlasTokenScope>
  ),
};
