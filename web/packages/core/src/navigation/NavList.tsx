import type { ReactNode } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';

export interface NavItem {
  id: string;
  title: string;
  tagline?: string;
  icon?: ReactNode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavListProps {
  groups: NavGroup[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** One List per group with an overline subheader; the active item is filled with primary. */
export function NavList({ groups, activeId, onSelect }: NavListProps) {
  return (
    <Box component="nav" sx={{ px: 1 }}>
      {groups.map((group) => (
        <List
          key={group.label}
          disablePadding
          subheader={
            <ListSubheader
              disableSticky
              sx={{ bgcolor: 'transparent', typography: 'overline', color: 'text.secondary', lineHeight: '32px' }}
            >
              {group.label}
            </ListSubheader>
          }
        >
          {group.items.map((item) => (
            <ListItemButton
              key={item.id}
              selected={item.id === activeId}
              onClick={() => onSelect(item.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.light' },
                  '& .MuiListItemIcon-root': { color: 'inherit' },
                  '& .MuiListItemText-secondary': { color: 'inherit', opacity: 0.8 },
                },
              }}
            >
              {item.icon ? <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon> : null}
              <ListItemText
                primary={item.title}
                secondary={item.tagline}
                slotProps={{
                  primary: { noWrap: true, sx: { fontWeight: 600 } },
                  secondary: { variant: 'caption', noWrap: true },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      ))}
    </Box>
  );
}
