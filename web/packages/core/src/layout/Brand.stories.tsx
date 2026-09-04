import type { Meta, StoryObj } from '@storybook/react';
import { Brand } from './Brand';

const meta = {
  title: 'Layout/Brand',
  component: Brand,
  args: { name: 'Atlas', subtitle: 'Fund administration' },
} satisfies Meta<typeof Brand>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
