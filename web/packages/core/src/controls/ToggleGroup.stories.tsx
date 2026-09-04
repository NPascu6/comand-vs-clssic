import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { ToggleGroup } from './ToggleGroup';

const VIEWS = [
  { value: 'table', label: 'Table' },
  { value: 'cards', label: 'Cards' },
  { value: 'timeline', label: 'Timeline' },
] as const;

const meta = {
  title: 'Controls/ToggleGroup',
  component: ToggleGroup,
  args: { value: 'table', options: VIEWS, onChange: () => undefined, 'aria-label': 'View', size: 'small' },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'medium'] } },
} satisfies Meta<typeof ToggleGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string>(args.value);
    return <ToggleGroup {...args} value={value} onChange={setValue} />;
  },
};

export const WithIcons: Story = {
  args: {
    value: 'light',
    options: [
      { value: 'light', label: 'Light', icon: <LightModeIcon fontSize="small" /> },
      { value: 'dark', label: 'Dark', icon: <DarkModeIcon fontSize="small" /> },
    ],
    'aria-label': 'Theme',
  },
};

export const IconOnly: Story = {
  args: {
    value: 'light',
    options: [
      { value: 'light', label: null, icon: <LightModeIcon fontSize="small" />, 'aria-label': 'Light' },
      { value: 'dark', label: null, icon: <DarkModeIcon fontSize="small" />, 'aria-label': 'Dark' },
    ],
    'aria-label': 'Theme',
    size: 'medium',
  },
};
