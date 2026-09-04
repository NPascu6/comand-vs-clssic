import type { Meta, StoryObj } from '@storybook/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Stack } from './Stack';
import { Text } from './Text';
import { ICON_SIZES, Icon, svgDefaults } from './Icon';

/** A product's own mark, drawn inline. Nothing about it is special — it is an `<svg>`. */
function AtlasMark() {
  return (
    <svg viewBox="0 0 24 24" {...svgDefaults}>
      <path d="M12 2 2 22h4l6-12 6 12h4L12 2Z" />
      <circle cx="12" cy="17" r="2.5" />
    </svg>
  );
}

const meta = {
  title: 'Primitives/Icon',
  component: Icon,
  args: { size: 'md', children: <AtlasMark /> },
  argTypes: {
    size: { control: 'inline-radio', options: ICON_SIZES, description: 'component.icon.size*' },
    label: { control: 'text', description: 'Leave empty for a decorative glyph a screen reader skips' },
    children: { control: false },
  },
} satisfies Meta<typeof Icon>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Three sizes, all `component.icon.*`. A designer moves them in Figma and every glyph follows. */
export const Sizes: Story = {
  render: (args) => (
    <Stack direction="row" gap="md" align="center">
      {ICON_SIZES.map((size) => (
        <Stack key={size} gap="xs" align="center">
          <Icon {...args} size={size} />
          <Text variant="caption" tone="muted">
            {size}
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};

/**
 * Whatever is inside fills the square and takes the surrounding colour: a custom SVG, an icon
 * component, an `<img>`. Spread `svgDefaults` on your own `<svg>` and it behaves like the rest.
 */
export const AnyGlyph: Story = {
  render: (args) => (
    <Stack direction="row" gap="lg" align="center">
      <Stack gap="xs" align="center">
        <Icon {...args}>
          <AtlasMark />
        </Icon>
        <Text variant="caption" tone="muted">
          inline svg
        </Text>
      </Stack>
      <Stack gap="xs" align="center">
        <Icon {...args}>
          <NotificationsIcon />
        </Icon>
        <Text variant="caption" tone="muted">
          icon component
        </Text>
      </Stack>
      <Stack gap="xs" align="center">
        <Text tone="danger">
          <Icon {...args}>
            <AtlasMark />
          </Icon>
        </Text>
        <Text variant="caption" tone="muted">
          inherits the text colour
        </Text>
      </Stack>
    </Stack>
  ),
};
