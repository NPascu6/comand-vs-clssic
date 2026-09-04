import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  args: {
    items: [
      { label: 'Fund', onClick: () => undefined },
      { label: 'Deal pipeline', onClick: () => undefined },
      { label: 'Project Aurora' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Single: Story = { args: { items: [{ label: 'Fund' }] } };
