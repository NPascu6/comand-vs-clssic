// Resize, title and remove are handled here for ALL panels — no per-panel chrome duplication.
//
// This is the cross-cutting "chrome" written ONCE. In an OOP UI this tends to be
// re-implemented per widget (or smeared across a base class everything must
// inherit). As a single generic frame it stays one place: every registry panel
// gets the same header controls and the same hand-rolled resize for free.

import { useT } from '@atlas/i18n';
import { Button, Card } from '@atlas/core';
import type { ReactNode } from 'react';
import { clamp } from './clamp';

const COLS = 12;

export interface PanelFrameProps {
  title: string;
  w: number;
  minW: number;
  gridRef: React.RefObject<HTMLDivElement>;
  onResize: (w: number) => void;
  onRemove: () => void;
  children: ReactNode;
}

export function PanelFrame({ title, w, minW, gridRef, onResize, onRemove, children }: PanelFrameProps) {
  // `title` arrives already translated from the shell; we still pull `t` for the
  // control labels so even the chrome is localized in one place.
  const t = useT();

  // Hand-rolled resize: translate horizontal pointer travel into grid columns.
  function onHandleDown(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = w;

    const onMove = (ev: PointerEvent) => {
      const grid = gridRef.current;
      if (!grid) return;
      const colPx = grid.clientWidth / COLS;
      if (colPx <= 0) return;
      const delta = Math.round((ev.clientX - startX) / colPx);
      onResize(clamp(startW + delta, minW, COLS));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <Card edge="navy" className="relative h-full">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="truncate font-semibold text-ink">{title}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('ws.shrink', 'Decrease width')}
            disabled={w <= minW}
            onClick={() => onResize(clamp(w - 1, minW, COLS))}
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('ws.grow', 'Increase width')}
            disabled={w >= COLS}
            onClick={() => onResize(clamp(w + 1, minW, COLS))}
          >
            +
          </Button>
          <Button
            variant="danger"
            size="sm"
            aria-label={t('ws.remove', 'Remove panel')}
            onClick={onRemove}
          >
            ×
          </Button>
        </div>
      </div>

      <div className="px-4 py-4">{children}</div>

      {/* Thin drag handle on the right edge — the resize affordance. */}
      <div
        onPointerDown={onHandleDown}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('ws.resize', 'Drag to resize')}
        title={t('ws.resize', 'Drag to resize')}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none rounded-r-card hover:bg-navy/20"
      />
    </Card>
  );
}
