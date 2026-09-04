import type { ReactNode } from 'react';
import { AppBar, Toolbar } from '@mui/material';
import type { AppBarProps } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { IconButton } from '../controls/IconButton';
import type { IconButtonProps } from '../controls/IconButton';
import { Stack } from '../primitives/Stack';

export type HeaderSize = 'regular' | 'compact';
export type HeaderSurface = 'paper' | 'default' | 'transparent';

export interface MenuButtonProps extends Omit<IconButtonProps, 'icon' | 'aria-label' | 'onClick'> {
  onToggle: () => void;
  open?: boolean;
  label?: string;
  /** A custom glyph for the closed state — any SVG. */
  icon?: ReactNode;
  /** A custom glyph for the open state. Defaults to `icon`, then to the library's. */
  openIcon?: ReactNode;
}

/** The side-menu toggle, on its own so a bar built by hand can place it anywhere. */
export function MenuButton({ onToggle, open, label = 'Menu', icon, openIcon, ...rest }: MenuButtonProps) {
  const glyph = open === true ? (openIcon ?? icon ?? <MenuOpenIcon />) : (icon ?? <MenuIcon />);
  return <IconButton icon={glyph} aria-label={label} aria-expanded={open} onClick={onToggle} {...rest} />;
}

export interface AppHeaderProps extends AppBarProps {
  children: ReactNode;
  /** Given a handler the bar carries the side-menu button; left out it has no menu at all. */
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  menuLabel?: string;
  menuIcon?: ReactNode;
  menuOpenIcon?: ReactNode;
  /** Adornments before the content — a product mark, a back arrow. */
  start?: ReactNode;
  /** Adornments after it — a search field, a status, an avatar. */
  end?: ReactNode;
  /** `component.header.height`, or the denser `heightCompact`. */
  size?: HeaderSize;
  surface?: HeaderSurface;
  /** The rule along its bottom edge. */
  bordered?: boolean;
}

/** Each adornment sits in the same square, one gap apart — both header tokens. */
const ADORNMENTS = {
  gap: 'var(--atlas-component-header-adornment-gap)',
  '& > *': { minHeight: 'var(--atlas-component-header-adornment-size)' },
} as const;

const SURFACE: Readonly<Record<HeaderSurface, string>> = {
  paper: 'var(--atlas-background-paper)',
  default: 'var(--atlas-background-default)',
  transparent: 'transparent',
};

/** MUI's AppBar on the header tokens. The middle takes the free space, which holds `end` to the edge. */
export function AppHeader({
  children,
  onMenuToggle,
  menuOpen,
  menuLabel,
  menuIcon,
  menuOpenIcon,
  start,
  end,
  size = 'regular',
  surface = 'paper',
  bordered = true,
  position = 'sticky',
  sx,
  ...rest
}: AppHeaderProps) {
  const menu = onMenuToggle && <MenuButton onToggle={onMenuToggle} open={menuOpen} label={menuLabel} icon={menuIcon} openIcon={menuOpenIcon} />;
  return (
    <AppBar
      component="header"
      position={position}
      sx={[{ backgroundColor: SURFACE[surface], borderBlockEnd: bordered ? undefined : 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...rest}
    >
      <Toolbar variant={size === 'compact' ? 'dense' : 'regular'}>
        {menu || start ? (
          <Stack direction="row" align="center" sx={ADORNMENTS}>
            {menu}
            {start}
          </Stack>
        ) : null}
        <Stack direction="row" gap="md" align="center" grow>
          {children}
        </Stack>
        {end ? (
          <Stack direction="row" align="center" sx={ADORNMENTS}>
            {end}
          </Stack>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}
