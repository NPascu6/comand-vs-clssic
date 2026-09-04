import type { Meta, StoryObj } from '@storybook/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Stack } from '../primitives/Stack';
import { BUTTON_SIZES } from './Button';
import { IconButton } from './IconButton';

const meta = {
  title: 'Controls/IconButton',
  component: IconButton,
  args: { icon: <NotificationsIcon />, 'aria-label': 'Notifications', size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: BUTTON_SIZES, description: 'component.button.height*' },
    color: { control: 'inline-radio', options: ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] },
    disabled: { control: 'boolean' },
    icon: { control: false },
  },
} satisfies Meta<typeof IconButton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A square the size of the matching Button height, per size token. */
export const Sizes: Story = {
  render: (args) => (
    <Stack direction="row" gap="md" align="center">
      {BUTTON_SIZES.map((size) => (
        <IconButton key={size} {...args} size={size} />
      ))}
    </Stack>
  ),
};
