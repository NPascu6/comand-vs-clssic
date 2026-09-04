import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Typography } from '@mui/material';
import { useThemeMode } from './AtlasThemeProvider';
import { ThemeSwitcher } from './ThemeSwitcher';

// The switcher drives the provider mounted by the preview decorator.
const meta = {
  title: 'Theme/ThemeSwitcher',
  component: ThemeSwitcher,
  args: { size: 'small' },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'medium'] } },
} satisfies Meta<typeof ThemeSwitcher>;
export default meta;

type Story = StoryObj<typeof meta>;

function CurrentMode() {
  const { mode } = useThemeMode();
  return <Typography variant="body2">Current mode: {mode}</Typography>;
}

export const Default: Story = {
  render: (args) => (
    <Stack sx={{ gap: 2, alignItems: 'flex-start' }}>
      <ThemeSwitcher {...args} />
      <CurrentMode />
    </Stack>
  ),
};

export const Medium: Story = {
  args: { size: 'medium' },
};
