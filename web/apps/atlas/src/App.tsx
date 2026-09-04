import { useMemo, useState } from 'react';
import type { SliceManifest, DataSourceMode } from '@atlas/platform';
import { DataSourceProvider, DEFAULT_API_BASE } from '@atlas/platform';
import { useT, LocaleSwitcher } from '@atlas/i18n';
import { cx } from '@atlas/core';
import { slices } from './slices';
import { CoreShowcase } from './showcase/CoreShowcase';

const CORE_ID = '__core';

// slice id -> translation key for the nav label (falls back to the manifest title)
const NAV_KEY: Record<string, string> = {
  'commit-capital': 'nav.commitCapital',
  coinvestment: 'nav.hierarchy',
  appetite: 'nav.appetite',
  workspace: 'nav.workspace',
  'deal-pipeline': 'nav.dealPipeline',
};

// domain group header -> translation key
const DOMAIN_KEY: Record<string, string> = {
  'Fund Construction': 'nav.group.construction',
  'Fund Management': 'nav.group.management',
};

function groupByDomain(items: SliceManifest[]): [string, SliceManifest[]][] {
  const order: string[] = [];
  const map = new Map<string, SliceManifest[]>();
  for (const s of items) {
    if (!map.has(s.domain)) {
      map.set(s.domain, []);
      order.push(s.domain);
    }
    map.get(s.domain)!.push(s);
  }
  return order.map((d) => [d, map.get(d)!]);
}

function NavItem({ active, title, tagline, onClick }: { active: boolean; title: string; tagline: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx('mb-1 block w-full rounded-[8px] px-2.5 py-2 text-left transition', active ? 'bg-navy text-white' : 'hover:bg-[#EEF3FA] text-ink')}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={cx('text-xs', active ? 'text-ice' : 'text-mute')}>{tagline}</div>
    </button>
  );
}

function DataToggle({ mode, onChange }: { mode: DataSourceMode; onChange: (m: DataSourceMode) => void }) {
  const t = useT();
  const opt = (m: DataSourceMode, label: string) => (
    <button
      onClick={() => onChange(m)}
      className={cx('rounded-[6px] px-3 py-1 text-xs font-semibold transition', mode === m ? 'bg-white text-navy shadow-sm' : 'text-mute')}
    >
      {label}
    </button>
  );
  return (
    <div className="flex items-center gap-3">
      {mode === 'api' && <span className="font-mono text-[11px] text-mute">{DEFAULT_API_BASE}</span>}
      <div className="flex items-center gap-1 rounded-[8px] bg-[#EEF2F8] p-1">
        {opt('mock', t('header.mock'))}
        {opt('api', t('header.live'))}
      </div>
    </div>
  );
}

export function App() {
  const t = useT();
  const [active, setActive] = useState<string>(slices[0].id);
  const [mode, setMode] = useState<DataSourceMode>('mock');
  const ds = useMemo(() => ({ mode, apiBaseUrl: DEFAULT_API_BASE }), [mode]);

  const activeSlice = slices.find((s) => s.id === active);
  const ActiveView = activeSlice?.Component;
  const navTitle = (s: SliceManifest) => (NAV_KEY[s.id] ? t(NAV_KEY[s.id], s.title) : s.title);

  return (
    <DataSourceProvider value={ds}>
      <div className="flex min-h-full">
        <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
          <div className="px-5 py-4">
            <div className="text-lg font-bold text-navy">Atlas</div>
            <div className="text-xs text-mute">{t('app.subtitle')}</div>
          </div>
          <nav className="px-3 pb-6">
            {groupByDomain(slices).map(([domain, items]) => (
              <div key={domain} className="mb-3">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-mute">{t(DOMAIN_KEY[domain] ?? '', domain)}</div>
                {items.map((s) => (
                  <NavItem key={s.id} active={active === s.id} title={navTitle(s)} tagline={s.tagline} onClick={() => setActive(s.id)} />
                ))}
              </div>
            ))}
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-mute">{t('nav.group.platform')}</div>
            <NavItem active={active === CORE_ID} title={t('nav.designSystem')} tagline="MUI → Tailwind decoupling" onClick={() => setActive(CORE_ID)} />
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
            <div className="text-sm font-semibold text-mute">{active === CORE_ID ? 'Platform' : activeSlice?.domain}</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-mute">{t('header.language')}</span>
                <LocaleSwitcher />
              </div>
              <DataToggle mode={mode} onChange={setMode} />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {active === CORE_ID ? <CoreShowcase /> : ActiveView ? <ActiveView /> : null}
          </main>
        </div>
      </div>
    </DataSourceProvider>
  );
}
