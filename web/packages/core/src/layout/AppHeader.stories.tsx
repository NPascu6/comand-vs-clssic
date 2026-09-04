import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton } from '../controls/IconButton';
import { Button } from '../controls/Button';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { Icon, svgDefaults } from '../primitives/Icon';
import { Brand } from './Brand';
import { AppHeader, MenuButton } from './AppHeader';

/** A product's own artwork — an inline SVG, nothing the design system provides. */
function AtlasMark() {
  return (
    <svg viewBox="0 0 24 24" {...svgDefaults}>
      <path d="M12 2 2 22h4l6-12 6 12h4L12 2Z" />
    </svg>
  );
}

function BurgerMark() {
  return (
    <svg viewBox="0 0 24 24" {...svgDefaults}>
      <rect x="3" y="6" width="18" height="2.5" rx="1.25" />
      <rect x="3" y="11" width="18" height="2.5" rx="1.25" />
      <rect x="3" y="16" width="12" height="2.5" rx="1.25" />
    </svg>
  );
}

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  args: {
    position: 'static',
    size: 'regular',
    surface: 'paper',
    bordered: true,
    children: <Brand name="Atlas" subtitle="Fund administration" />,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['regular', 'compact'], description: 'component.header.height / heightCompact' },
    surface: { control: 'inline-radio', options: ['paper', 'default', 'transparent'] },
    bordered: { control: 'boolean', description: 'component.header.borderColor' },
    position: { control: 'inline-radio', options: ['static', 'sticky', 'fixed'], description: "MUI's own AppBar prop" },
    menuOpen: { control: 'boolean' },
    menuLabel: { control: 'text' },
    menuIcon: { control: false },
    menuOpenIcon: { control: false },
    children: { control: false },
    start: { control: false },
    end: { control: false },
  },
} satisfies Meta<typeof AppHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The bar is a surface. Its height, inline padding, rule, gap and the square an adornment sits in
 * are all `component.header.*` tokens — a designer retunes every application's bar from Figma.
 */
export const Playground: Story = {};

/** With the side menu, and without it: the same component, one prop apart. */
export const SideMenu: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="lg">
        <Stack gap="xs">
          <Text variant="overline" tone="muted">
            onMenuToggle given — the bar carries the button and reports whether it is open
          </Text>
          <AppHeader {...args} onMenuToggle={() => setOpen(!open)} menuOpen={open} menuLabel="Side menu" />
        </Stack>
        <Stack gap="xs">
          <Text variant="overline" tone="muted">
            left out — no menu at all
          </Text>
          <AppHeader {...args} />
        </Stack>
      </Stack>
    );
  },
};

/** Adornments at each end. The content between them takes the free space, so `end` holds the edge. */
export const Adornments: Story = {
  render: (args) => (
    <AppHeader
      {...args}
      start={<IconButton icon={<SearchIcon fontSize="small" />} aria-label="Search" />}
      end={
        <>
          <IconButton icon={<NotificationsIcon fontSize="small" />} aria-label="Notifications" />
          <ThemeSwitcher />
          <Button size="sm" variant="outline">
            Sign out
          </Button>
        </>
      }
    />
  ),
};

/** The app icon and the menu glyph are the application's own SVGs, sized by the icon tokens. */
export const CustomArtwork: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <AppHeader
        {...args}
        onMenuToggle={() => setOpen(!open)}
        menuOpen={open}
        menuIcon={<BurgerMark />}
        end={<ThemeSwitcher />}
      >
        <Brand
          name="Atlas"
          subtitle="Fund administration"
          logo={
            <Icon size="lg">
              <AtlasMark />
            </Icon>
          }
        />
      </AppHeader>
    );
  },
};

/** A shape the props do not express — the mark in the middle — built from MenuButton and Stack. */
export const BuiltFromParts: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <AppHeader
        {...args}
        position="static"
        start={<MenuButton onToggle={() => setOpen(!open)} open={open} icon={<BurgerMark />} />}
        end={<IconButton icon={<NotificationsIcon />} aria-label="Notifications" />}
      >
        <Stack direction="row" gap="sm" align="center" justify="center" grow>
          <Icon size="lg">
            <AtlasMark />
          </Icon>
          <Text variant="heading">Atlas</Text>
        </Stack>
      </AppHeader>
    );
  },
};
