import type { Meta, StoryObj } from '@storybook/react';
import { TONES } from '../system/tones';
import { Stack } from './Stack';
import type { TextTone } from './Text';
import { TEXT_VARIANTS, Text } from './Text';

const TEXT_TONES: readonly TextTone[] = [...TONES, 'muted'];

const meta = {
  title: 'Primitives/Text',
  component: Text,
  args: {
    variant: 'body',
    tone: 'neutral',
    children: 'Commitment approved against Fund IV Buyout.',
  },
  argTypes: {
    truncate: { control: { type: 'number', min: 1, max: 5 } },
    variant: { control: 'select', options: TEXT_VARIANTS },
    tone: { control: 'select', options: TEXT_TONES },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
} satisfies Meta<typeof Text>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap="md">
      {TEXT_VARIANTS.map((variant) => (
        <Stack key={variant} gap="xs">
          <Text variant="overline" tone="muted">
            {variant}
          </Text>
          <Text variant={variant}>
            Atlas fund administration
          </Text>
        </Stack>
      ))}
    </Stack>
  ),
};
