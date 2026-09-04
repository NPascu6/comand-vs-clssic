import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppBar, Box, Divider, Drawer, IconButton, Stack, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export interface AppShellProps {
  /** Top-left brand block (logo / product name / subtitle). */
  brand: ReactNode;
  /** The navigation — normally <NavList/>. */
  nav: ReactNode;
  /** Header, left side (e.g. the current domain). */
  headerTitle?: ReactNode;
  /** Header, right side (switchers, toggles). Rendered in a Stack with gap 2. */
  actions?: ReactNode;
  /** Drawer width in px. Default 256. */
  drawerWidth?: number;
  children: ReactNode;
}

/** Permanent drawer on md+, temporary drawer below md, sticky header, scrolling <main>; html/body/#root `height: 100%` is the app's job. */
export function AppShell({ brand, nav, headerTitle, actions, drawerWidth = 256, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  const drawerContent = (
    <>
      <Box sx={{ p: 2 }}>{brand}</Box>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>{nav}</Box>
    </>
  );
  const paperSx = { width: drawerWidth, boxSizing: 'border-box' } as const;

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': paperSx }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          height: '100%',
          '& .MuiDrawer-paper': { ...paperSx, position: 'relative', height: '100%' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <IconButton
              aria-label="Open navigation"
              edge="start"
              onClick={() => setOpen(true)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>{headerTitle}</Box>
            {actions ? (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                {actions}
              </Stack>
            ) : null}
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
