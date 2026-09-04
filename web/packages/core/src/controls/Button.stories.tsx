import type { Meta, StoryObj } from '@storybook/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { BUTTON_SIZES, BUTTON_VARIANTS, Button } from './Button';

const meta = {
  title: 'Controls/Button',
  component: Button,
  args: { children: 'Commit capital', variant: 'solid', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: BUTTON_VARIANTS },
    size: { control: 'inline-radio', options: BUTTON_SIZES },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    variant: "outline"
  }
};

/**
 * Five variants, and not one colour among them is in the React. Each reads
 * `component.button.<variant>*` from the token export, so a designer restyles every button in
 * every application by publishing in Figma.
 */
export const Variants: Story = {
  render: (args) => (
    <Stack gap="md" align="start">
      {BUTTON_VARIANTS.map((variant) => (
        <Stack key={variant} direction="row" gap="md" align="center">
          <Text variant="overline" tone="muted">
            {variant}
          </Text>
          <Button {...args} variant={variant} />
          <Button {...args} variant={variant} disabled />
        </Stack>
      ))}
    </Stack>
  ),
};

/** Height and inline padding per size, all `component.button.*`. */
export const Sizes: Story = {
  render: (args) => (
    <Stack direction="row" gap="md" align="center" wrap>
      {BUTTON_SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </Stack>
  ),
};

/** Adornments sit inside the button, one `component.button.gap` from the label. */
export const Adornments: Story = {
  render: (args) => (
    <Stack direction="row" gap="md" align="center" wrap>
      <Button {...args} startIcon={<CheckIcon fontSize="small" />} />
      <Button {...args} endIcon={<ArrowForwardIcon fontSize="small" />} />
      <Button {...args} startIcon={<CheckIcon fontSize="small" />} endIcon={<ArrowForwardIcon fontSize="small" />} />
    </Stack>
  ),
};

export const FullWidth: Story = { args: { fullWidth: true } };
