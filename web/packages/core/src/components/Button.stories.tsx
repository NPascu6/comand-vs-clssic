import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: {
    children: 'Commit capital',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Withdraw commitment' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Add allocation' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Commit capital' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm">
          Primary
        </Button>
        <Button variant="ghost" size="sm">
          Ghost
        </Button>
        <Button variant="danger" size="sm">
          Danger
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled>
          Primary
        </Button>
        <Button variant="ghost" disabled>
          Ghost
        </Button>
        <Button variant="danger" disabled>
          Danger
        </Button>
      </div>
    </div>
  ),
};
