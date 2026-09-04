import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import { NavList } from './NavList';

const GROUPS = [
  {
    label: 'Fund',
    items: [
      { id: 'appetite', title: 'Appetite', tagline: 'Capacity by strategy', icon: <InboxIcon fontSize="small" /> },
      { id: 'pipeline', title: 'Deal pipeline', tagline: 'Screening to close' },
      { id: 'coinvest', title: 'Co-investment' },
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

const meta = {
  title: 'Navigation/NavList',
  component: NavList,
  args: { groups: GROUPS, activeId: 'appetite', onSelect: () => undefined },
  decorators: [
    (Story) => (
      <Box sx={{ width: 256, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 3, py: 1 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof NavList>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [active, setActive] = useState(args.activeId);
    return <NavList {...args} activeId={active} onSelect={setActive} />;
  },
};
