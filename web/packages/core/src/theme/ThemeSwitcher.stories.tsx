import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Typography } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';
import { useAtlasTheme } from './AtlasThemeProvider';
import { ThemeSwitcher } from './ThemeSwitcher';

const meta = {
  title: 'Theme/ThemeSwitcher',
  component: ThemeSwitcher,
  args: { size: 'small' },
  argTypes: { size: { control: 'inline-radio', options: ['small', 'medium'] } },
} satisfies Meta<typeof ThemeSwitcher>;
export default meta;

type Story = StoryObj<typeof meta>;

const { space } = themeInputs;

function CurrentSelection() {
  const { mode } = useAtlasTheme();
  return <Typography variant="body2">mode: {mode}</Typography>;
}

export const Default: Story = {
  render: (args) => (
    <Stack sx={{ gap: `${space.md}px`, alignItems: 'flex-start' }}>
      <ThemeSwitcher {...args} />
      <CurrentSelection />
    </Stack>
  ),
};
