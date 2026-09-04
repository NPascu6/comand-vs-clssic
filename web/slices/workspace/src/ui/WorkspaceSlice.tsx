// A view is DATA (the layout array). The shell renders any registry panel
// generically — there is no god component listing widgets. Pluggable +
// resizable + customizable, all without a layout library.
//
// `layout` is the entire customization state: an ordered list of
// { panelId, w }. The shell maps each item to its PanelDef and wraps it in the
// generic PanelFrame. Adding/removing/resizing a panel is just editing this
// array — the rendering code never grows.

import { useRef, useState } from 'react';
import { useT } from '@atlas/i18n';
import { Button } from '@atlas/core';
import { panels } from '../panels';
import { PanelFrame } from '../PanelFrame';

const COLS = 12;

interface LayoutItem {
  panelId: string;
  w: number;
}

const defaultLayout: LayoutItem[] = [
  { panelId: 'headroom', w: 4 },
  { panelId: 'appetite', w: 8 },
  { panelId: 'hierarchy', w: 6 },
  { panelId: 'deals', w: 6 },
];

export function WorkspaceSlice() {
  const t = useT();
  const gridRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);

  // Panels in the registry but not yet on the board — the "Add panel" choices.
  // Filtering here is what enforces a unique panelId per layout item.
  const present = new Set(layout.map((it) => it.panelId));
  const available = panels.filter((p) => !present.has(p.id));

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-ink">{t('ws.title', 'Workspace')}</h2>
        <p className="text-sm text-mute">
          {t('ws.tagline', 'Custom views from pluggable, resizable panels')}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-mute">
          {t('ws.addPanel', 'Add panel')}
        </span>
        {available.length === 0 ? (
          <span className="text-xs text-mute">—</span>
        ) : (
          available.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="ghost"
              onClick={() => setLayout((L) => [...L, { panelId: p.id, w: 4 }])}
            >
              + {t(p.titleKey, p.id)}
            </Button>
          ))
        )}
      </div>

      <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: '16px' }}>
        {layout.map((item, i) => {
          const def = panels.find((p) => p.id === item.panelId);
          if (!def) return null;
          return (
            <div key={item.panelId} style={{ gridColumn: 'span ' + Math.min(item.w, COLS) }}>
              <PanelFrame
                title={t(def.titleKey, def.id)}
                w={item.w}
                minW={def.minW}
                gridRef={gridRef}
                onResize={(w) => setLayout((L) => L.map((it, j) => (j === i ? { ...it, w } : it)))}
                onRemove={() => setLayout((L) => L.filter((_, j) => j !== i))}
              >
                {def.render()}
              </PanelFrame>
            </div>
          );
        })}
      </div>
    </div>
  );
}
