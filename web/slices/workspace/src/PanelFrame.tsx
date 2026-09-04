import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react';
import { useT } from '@atlas/i18n';
import { Box, Button, Card, CardHeader, ResizeHandle, Stack } from '@atlas/core';
import { clamp } from './clamp';

const COLS = 12;

export interface PanelFrameProps {
  title: string;
  width: number;
  minWidth: number;
  gridRef: RefObject<HTMLDivElement>;
  onResize: (width: number) => void;
  onRemove: () => void;
  children: ReactNode;
}

export function PanelFrame({ title, width, minWidth, gridRef, onResize, onRemove, children }: PanelFrameProps) {
  const translate = useT();

  // Horizontal pointer travel is converted into whole grid columns.
  function onHandleDown(event: ReactPointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMove = (moveEvent: PointerEvent) => {
      const grid = gridRef.current;
      if (!grid) return;
      const columnPixels = grid.clientWidth / COLS;
      if (columnPixels <= 0) return;
      const delta = Math.round((moveEvent.clientX - startX) / columnPixels);
      onResize(clamp(startWidth + delta, minWidth, COLS));
    };
    const onUp = () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };

    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
  }

  const controls = (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={translate('ws.shrink', 'Decrease width')}
        disabled={width <= minWidth}
        onClick={() => onResize(clamp(width - 1, minWidth, COLS))}
      >
        −
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={translate('ws.grow', 'Increase width')}
        disabled={width >= COLS}
        onClick={() => onResize(clamp(width + 1, minWidth, COLS))}
      >
        +
      </Button>
      <Button variant="danger" size="sm" aria-label={translate('ws.remove', 'Remove panel')} onClick={onRemove}>
        ×
      </Button>
    </Stack>
  );

  return (
    <Card edge="navy" padded={false} sx={{ height: '100%', position: 'relative' }}>
      <CardHeader title={title} action={controls} />
      <Box sx={{ p: 2 }}>{children}</Box>

      <ResizeHandle
        onPointerDown={onHandleDown}
        aria-label={translate('ws.resize', 'Drag to resize')}
        title={translate('ws.resize', 'Drag to resize')}
      />
    </Card>
  );
}
