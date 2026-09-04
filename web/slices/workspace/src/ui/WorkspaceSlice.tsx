// The layout array is the whole customization state; the shell renders any registry panel generically.

import { useRef, useState } from 'react';
import { useT } from '@atlas/i18n';
import { Box, Button, PageHeader, Stack, Typography } from '@atlas/core';
import { panels } from '../panels';
import { PanelFrame } from '../PanelFrame';

const COLS = 12;

interface LayoutItem {
  panelId: string;
  width: number;
}

const defaultLayout: LayoutItem[] = [
  { panelId: 'headroom', width: 4 },
  { panelId: 'appetite', width: 8 },
  { panelId: 'hierarchy', width: 6 },
  { panelId: 'deals', width: 6 },
];

export function WorkspaceSlice() {
  const translate = useT();
  const gridRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);

  // Filtering the registry against the board is what keeps panelId unique per layout item.
  const present = new Set(layout.map((item) => item.panelId));
  const available = panels.filter((panel) => !present.has(panel.id));

  return (
    <>
      <PageHeader
        title={translate('ws.title', 'Workspace')}
        tagline={translate('ws.tagline', 'Compose your own view from pluggable, resizable panels')}
      />

      <Stack sx={{ gap: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="overline" color="text.secondary">
            {translate('ws.addPanel', 'Add panel')}
          </Typography>
          {available.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              —
            </Typography>
          ) : (
            available.map((panel) => (
              <Button
                key={panel.id}
                size="sm"
                variant="ghost"
                onClick={() => setLayout((current) => [...current, { panelId: panel.id, width: 4 }])}
              >
                + {translate(panel.titleKey, panel.id)}
              </Button>
            ))
          )}
        </Stack>

        {/* PanelFrame's resize maths reads this element's width, so the grid stays a Box the slice owns. */}
        <Box ref={gridRef} sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 2 }}>
          {layout.map((item, index) => {
            const definition = panels.find((panel) => panel.id === item.panelId);
            if (!definition) return null;
            return (
              <Box key={item.panelId} sx={{ gridColumn: 'span ' + Math.min(item.width, COLS), minWidth: 0 }}>
                <PanelFrame
                  title={translate(definition.titleKey, definition.id)}
                  width={item.width}
                  minWidth={definition.minWidth}
                  gridRef={gridRef}
                  onResize={(width) => setLayout((current) => current.map((entry, position) => (position === index ? { ...entry, width } : entry)))}
                  onRemove={() => setLayout((current) => current.filter((_, position) => position !== index))}
                >
                  {definition.render()}
                </PanelFrame>
              </Box>
            );
          })}
        </Box>
      </Stack>
    </>
  );
}
