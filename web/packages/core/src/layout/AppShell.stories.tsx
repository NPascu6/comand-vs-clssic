import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { NavList } from '../navigation/NavList';
import { PageHeader } from './PageHeader';
import { Card } from './Card';
import { AppShell } from './AppShell';

const GROUPS = [
  {
    label: 'Fund',
    items: [
      { id: 'appetite', title: 'Appetite', tagline: 'Capacity by strategy' },
      { id: 'pipeline', title: 'Deal pipeline', tagline: 'Screening to close' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'commit', title: 'Commit capital', tagline: 'Draw-downs and calls' },
      { id: 'translations', title: 'Translations' },
    ],
  },
];

function Demo(props: { drawerWidth?: number }) {
  const [active, setActive] = useState('appetite');
  return (
    <Box sx={{ height: '100vh' }}>
      <AppShell
        brand={
          <Box>
            <Typography variant="h6" color="primary">
              Atlas
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Central Fund Management
            </Typography>
          </Box>
        }
        nav={<NavList groups={GROUPS} activeId={active} onSelect={setActive} />}
        headerTitle={<Typography variant="subtitle1">Fund / {active}</Typography>}
        actions={<ThemeSwitcher />}
        drawerWidth={props.drawerWidth}
      >
        <PageHeader title="Appetite" tagline="How much capacity each strategy has left this vintage." />
        <Card>
          <Typography variant="body2">Page content scrolls inside &lt;main&gt;; the header stays put.</Typography>
        </Card>
      </AppShell>
    </Box>
  );
}

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { brand: null, nav: null, children: null },
  render: () => <Demo />,
};

export const NarrowDrawer: Story = {
  args: { brand: null, nav: null, children: null },
  render: () => <Demo drawerWidth={200} />,
};
