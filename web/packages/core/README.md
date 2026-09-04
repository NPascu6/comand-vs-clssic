# `@atlas/core` — the Atlas design system

An **owned, stable API over MUI**. Slices and the app import from `@atlas/core`
only — never from `@mui/*` — so the implementation can change underneath them
and the business code never learns which library is drawing the pixels.

The bar: **the app and the slices contain business logic and composition only.**
If a slice needs chrome (a shell, a page header, a table, a form control, an
empty state, a toast), it comes from here. Nothing in a slice styles itself
beyond `sx` spacing on layout primitives.

This README documents the package: what it is, its folders, the public API by
section, the theme and its three modes, the DataGrid defaults, the rules for
consumers, and the backend i18n contract that `@atlas/i18n` and the
Translations slice code against.

---

## Ground rules

- **Runtime**: React 18, TypeScript strict, `verbatimModuleSyntax` (use `import type`).
- **Dependencies**: `@mui/material@9`, `@mui/x-data-grid@9` (community, MIT),
  `@mui/icons-material@9`, `@emotion/react`, `@emotion/styled`, plus the workspace
  package `@atlas/design-tokens` (the theme's values; pure TypeScript, no dependencies
  of its own). Nothing else — not `clsx`, not `react-query`, not `axios`, no CSS framework.
- **No `className` styling, no stylesheet of tokens.** Styling is the MUI theme +
  `sx`. The theme owns the palette (its values come from the Figma-owned tokens in
  `@atlas/design-tokens`); components read `theme.palette.*` and never hard-code a
  colour — that is what makes the three modes one palette swap.
- **Every export is named** (`export function X`, `export type XProps`). Default
  exports are not used. Each file exports one component (plus its prop type).
- **Re-exports are explicit.** When core endorses a MUI primitive as-is, it is
  re-exported by name from the barrel (`export { Box, Stack } from '@mui/material'`),
  so the import surface stays `@atlas/core`.
- **Accessibility**: every icon-only button has `aria-label`; the theme's
  `contrast` mode must keep focus rings visible.
- Typecheck with `pnpm --filter @atlas/core exec tsc --noEmit`; Storybook with
  `pnpm --filter @atlas/core storybook` (:6006). CI lints the sources with `deno lint`.

## Folder structure

```
src/
  theme/          createAtlasTheme.ts, AtlasThemeProvider.tsx, ThemeSwitcher.tsx, useThemeMode (in provider)
  layout/         AppShell.tsx, PageHeader.tsx, Section.tsx, Card.tsx, CardHeader.tsx
  navigation/     NavList.tsx, Stepper.tsx, Breadcrumbs.tsx
  controls/       Button.tsx, TextField.tsx, Select.tsx, ToggleGroup.tsx
  data-display/   DataGrid.tsx, Stat.tsx, Meter.tsx, StatusPill.tsx, KeyValueList.tsx, Mono.tsx
  feedback/       EmptyState.tsx, Loading.tsx, ToastProvider.tsx
  overlay/        ConfirmDialog.tsx
  util/           format.ts
  index.ts        the barrel — the ONLY public entry point
```

Each folder also holds its `*.stories.tsx` next to the component. Storybook's
`preview.tsx` renders every story inside the Atlas theme and exposes a toolbar
global `themeMode` (light / dark / contrast), so any component can be checked in
every mode.

---

## Theme

```ts
export type ThemeMode = 'light' | 'dark' | 'contrast';
export const THEME_MODES: ReadonlyArray<{ id: ThemeMode; label: string }>;
//   [{ id:'light', label:'Light' }, { id:'dark', label:'Dark' }, { id:'contrast', label:'High contrast' }]

export function createAtlasTheme(mode: ThemeMode): Theme;   // MUI Theme

export interface AtlasThemeProviderProps {
  children: ReactNode;
  /** Used when nothing is persisted. Default 'light'. */
  initialMode?: ThemeMode;
  /** localStorage key. Default 'atlas.theme'. Reads/writes are try/catch-wrapped. */
  storageKey?: string;
}
export function AtlasThemeProvider(props: AtlasThemeProviderProps): JSX.Element;
//   = MUI ThemeProvider + CssBaseline + a context. Sets `data-theme={mode}` on <html>.

export function useThemeMode(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void };

export interface ThemeSwitcherProps { size?: 'small' | 'medium' }
export function ThemeSwitcher(props: ThemeSwitcherProps): JSX.Element;
//   An exclusive ToggleGroup of the three modes with icons
//   (LightMode / DarkMode / Contrast from @mui/icons-material), aria-label "Theme".
```

### Palette per mode — the values live in `@atlas/design-tokens`

The theme's values are design tokens **owned in Figma**, not in this package. The
export lives in `web/packages/design-tokens/figma/*.tokens.json` — one file per mode
(`Atlas.Light`, `Atlas.Dark`, `Atlas.Contrast`) plus `Atlas.Base` for the
mode-independent tokens — and `pnpm --filter @atlas/design-tokens build` turns it into
the typed `themeInputs` that `createAtlasTheme` reads (CI's `deno test` refuses a stale
generated file). Every token path, its type and its meaning are documented in
[the `@atlas/design-tokens` README](../design-tokens/README.md); the Storybook
**Theme / Tokens** story shows every swatch per mode.

Per mode the theme takes `primary.main|light|contrastText`, `secondary.main`,
`success.main`, `warning.main`, `error.main`, `info.main`, `text.primary|secondary`,
`divider`, `background.default|paper`, the outline `border` (width + colour, on cards,
grids, inputs and chips), the `focus` ring (width 0 = MUI's default), and — contrast
only — the contained-button colours (`button.contained.*`).

`palette.mode` is `'light'` for light and contrast, `'dark'` for dark.

Shared (`Atlas.Base`): `radius.control` → `shape.borderRadius` (buttons, inputs) and
`radius.surface` (cards, papers, the data grid); `font.sans` and `font.mono` (the mono
stack is exposed as `theme.typography.fontFamilyMono` via module augmentation);
`typography.button.weight`, `typography.chip.weight`, `typography.overline.*` and
`typography.tableHeader.*`. `typography.button.textTransform = 'none'` is the theme's own.

Component defaults (`theme.components`), all modes:
- `MuiButton`: `disableElevation`, `radius.control`, `typography.button.weight`.
- `MuiCard` / `MuiPaper` (variant outlined): `radius.surface`, the `border` token, no shadow.
- `MuiChip`: `typography.chip.weight`.
- `MuiTextField`: `size: 'small'`, `fullWidth: true`.
- `MuiDataGrid` (via `@mui/x-data-grid/themeAugmentation`): column headers in
  `typography.tableHeader` (size, weight, letter-spacing), `textTransform uppercase`,
  `color text.secondary`, header background `background.default`, cell border `divider`,
  no outer border radius clash (`radius.surface`).
- **contrast mode only**: every outlined control gets the mode's `border` (2px black);
  focus-visible outline from the `focus` token (3px black) with `outlineOffset 2px`;
  `MuiButton` contained is black text on a white background with a border, inverting on
  hover (`button.contained.*`); disable all box-shadows; links underlined.

---

## Layout

```ts
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
export function AppShell(props: AppShellProps): JSX.Element;
//   Permanent Drawer (md and up) / temporary Drawer with a menu IconButton (below md),
//   an AppBar (position sticky, color inherit, paper background, divider border-bottom),
//   and a <main> that scrolls with padding 3. Full-height flex layout.

export interface PageHeaderProps {
  title: ReactNode;                 // rendered as h1 typography variant h5
  tagline?: ReactNode;              // body2, text.secondary
  actions?: ReactNode;              // right side, wraps
  children?: ReactNode;             // a row under the title (filters, steppers, scenario buttons)
}
export function PageHeader(props: PageHeaderProps): JSX.Element;

export interface SectionProps { title?: ReactNode; children: ReactNode; sx?: SxProps<Theme> }
export function Section(props: SectionProps): JSX.Element;
//   An overline title (uppercase, text.secondary, 11px, letterSpacing) + a Box with mt 1.

export type EdgeTone = 'navy' | 'green' | 'amber' | 'red';
export interface CardProps {
  children: ReactNode;
  /** 4px left accent edge — the Atlas motif. navy→primary, green→success, amber→warning, red→error. */
  edge?: EdgeTone;
  /** Apply padding 2.5 to the content. Default true. */
  padded?: boolean;
  /** Makes the whole card a button (hover elevation, cursor pointer, role=button, keyboard). */
  onClick?: () => void;
  sx?: SxProps<Theme>;
}
export function Card(props: CardProps): JSX.Element;         // MUI Card variant outlined

export interface CardHeaderProps { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }
export function CardHeader(props: CardHeaderProps): JSX.Element;
//   Title (subtitle1, 600) + optional subtitle (caption) + action on the right; border-bottom divider.

// endorsed MUI primitives, re-exported as-is:
export { Box, Stack, Grid, Divider, Container, Paper, Typography } from '@mui/material';
export type { SxProps, Theme } from '@mui/material/styles';
```

## Navigation

```ts
export interface NavItem { id: string; title: string; tagline?: string; icon?: ReactNode }
export interface NavGroup { label: string; items: NavItem[] }
export interface NavListProps { groups: NavGroup[]; activeId: string; onSelect: (id: string) => void }
export function NavList(props: NavListProps): JSX.Element;
//   MUI List with ListSubheader per group (overline style) and ListItemButton per item
//   (selected = primary background, contrast text; secondary line = tagline).

export interface StepperProps { steps: string[]; activeIndex: number }
export function Stepper(props: StepperProps): JSX.Element;          // MUI Stepper alternativeLabel

export interface BreadcrumbItem { label: ReactNode; onClick?: () => void }
export interface BreadcrumbsProps { items: BreadcrumbItem[] }
export function Breadcrumbs(props: BreadcrumbsProps): JSX.Element;  // last item is text, others are Link buttons

export { Tabs, Tab } from '@mui/material';
```

## Controls

```ts
export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';
export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant;      // primary→contained/primary, ghost→outlined/primary, danger→contained/error
  size?: ButtonSize;            // md→medium, sm→small
  /** Shows a CircularProgress startIcon and disables. */
  loading?: boolean;
}
export function Button(props: ButtonProps): JSX.Element;

export { TextField } from './controls/TextField';   // MUI's TextField endorsed as-is; the theme makes it small + fullWidth
export type { TextFieldProps } from './controls/TextField';
export { IconButton, Switch, Checkbox, FormControlLabel, InputAdornment } from '@mui/material';

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  helperText?: ReactNode;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;          // default true
  size?: 'small' | 'medium';    // default 'small'
  /** If the current value is not in options, it is prepended as "<value> (not found)". Default true. */
  keepCurrent?: boolean;
  'aria-label'?: string;
  sx?: SxProps<Theme>;
}
export function Select(props: SelectProps): JSX.Element;    // MUI TextField select

export interface ToggleOption<T extends string> { value: T; label: ReactNode; icon?: ReactNode; 'aria-label'?: string }
export interface ToggleGroupProps<T extends string> {
  value: T;
  options: ReadonlyArray<ToggleOption<T>>;
  onChange: (value: T) => void;
  size?: 'small' | 'medium';
  'aria-label': string;
}
export function ToggleGroup<T extends string>(props: ToggleGroupProps<T>): JSX.Element;
//   MUI ToggleButtonGroup exclusive; ignores null (no deselect).
```

## Data display

```ts
// the data table: MUI X DataGrid (community) behind Atlas defaults. Types slices need are re-exported.
export type {
  GridColDef, GridRowsProp, GridRowId, GridRowModel, GridValidRowModel,
  GridRenderCellParams, GridValueGetter, GridValueFormatter, GridRowParams,
  GridSortModel, GridFilterModel, GridPaginationModel, GridRowSelectionModel,
} from '@mui/x-data-grid';

export interface DataGridProps<R extends GridValidRowModel = GridValidRowModel>
  extends Omit<MuiDataGridProps<R>, 'rows' | 'columns' | 'slots' | 'slotProps'> {
  rows: R[];
  columns: GridColDef<R>[];
  /** Fixed height (px or CSS). When omitted the grid uses autoHeight. */
  height?: number | string;
  /** Show the toolbar (quick filter, columns, density, export). Default true. */
  toolbar?: boolean;
  /** Text for the no-rows overlay. Default "No rows". */
  emptyMessage?: string;
  /** Column field to use as the row id when the row has no `id`. */
  idField?: keyof R & string;
}
export function DataGrid<R extends GridValidRowModel = GridValidRowModel>(props: DataGridProps<R>): JSX.Element;
```

DataGrid defaults (props the wrapper sets unless overridden): `density="compact"`,
`disableRowSelectionOnClick`, `pageSizeOptions={[10, 25, 50, 100]}`,
`initialState.pagination.paginationModel = { pageSize: 10 }`, `showToolbar`
(MUI X v8+ prop) when `toolbar !== false`, quick filter enabled in the toolbar,
`slots.noRowsOverlay` = `EmptyState` with `emptyMessage`,
`slots.loadingOverlay` = skeleton variant, `getRowId` derived from `idField`
when given, `autoHeight` when `height` is undefined. Column header/cell styling
comes from the theme, not from the wrapper. Editing works out of the box:
consumers pass `editable: true` on a column and `processRowUpdate`.

```ts
export type StatTone = 'navy' | 'green' | 'amber' | 'red';
export interface StatProps { value: ReactNode; label: string; tone?: StatTone }
export function Stat(props: StatProps): JSX.Element;
//   overline label (text.secondary) then value in h5 weight 700, tabular-nums, toned.

export type MeterTone = 'green' | 'amber' | 'red' | 'auto';
export interface MeterProps {
  value: number; max: number; label?: string;
  /** 'auto': <80% success, <100% warning, >=100% error. Default 'auto'. */
  tone?: MeterTone;
  format?: (value: number) => string;   // default toLocaleString('en-US')
}
export function Meter(props: MeterProps): JSX.Element;
//   optional caption row (label left, "value / max · pct%" right, tabular) + LinearProgress
//   determinate, height 8, radius 999, colour by tone. role="progressbar" with aria-valuenow.

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export interface StatusPillProps { tone?: PillTone; children: ReactNode; size?: 'small' | 'medium' }
export function StatusPill(props: StatusPillProps): JSX.Element;
//   MUI Chip, size small by default; neutral→default filled, others→coloured outlined.

export interface KeyValueListProps { items: Array<{ label: ReactNode; value: ReactNode }>; dense?: boolean }
export function KeyValueList(props: KeyValueListProps): JSX.Element;   // two-column definition list

export interface MonoProps { children: ReactNode; color?: 'inherit' | 'secondary' | 'error'; sx?: SxProps<Theme> }
export function Mono(props: MonoProps): JSX.Element;     // <Typography component="span"> in the mono font, 0.85em

export { Chip, Avatar, List, ListItem, ListItemText, ListItemButton, ListItemIcon, Link } from '@mui/material';
```

## Feedback

```ts
export interface EmptyStateProps {
  title: ReactNode; description?: ReactNode; icon?: ReactNode; action?: ReactNode;
  minHeight?: number | string;   // default 160
}
export function EmptyState(props: EmptyStateProps): JSX.Element;   // centred, dashed divider border

export interface LoadingProps { label?: string; inline?: boolean }
export function Loading(props: LoadingProps): JSX.Element;         // CircularProgress (+ label)

export interface ToastProviderProps { children: ReactNode }
export function ToastProvider(props: ToastProviderProps): JSX.Element;   // one Snackbar + Alert, bottom-right
export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';
export function useToast(): { show: (message: string, severity?: ToastSeverity) => void };

export { Alert, AlertTitle, Skeleton, LinearProgress, CircularProgress, Tooltip } from '@mui/material';
```

## Overlay

```ts
export interface ConfirmDialogProps {
  open: boolean; title: ReactNode; description?: ReactNode;
  confirmLabel?: string;   // default 'Confirm'
  cancelLabel?: string;    // default 'Cancel'
  danger?: boolean;        // confirm button variant danger
  busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}
export function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;

export { Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Popover } from '@mui/material';
```

## Util

```ts
export function money(amount: number, currency?: string): string;    // "EUR 25,000,000"
export function compactMoney(amount: number): string;                // "25M"
```

---

## Consumer rules (for the app and every slice)

1. Import from `@atlas/core` only. `grep -r "@mui" slices apps` must return nothing.
2. No `className` props with styling. Layout is `Stack` / `Grid` / `Box` with `sx`
   spacing only (`gap`, `p`, `mt`, `flex`, `minWidth: 0`). Colours, fonts, borders
   and radii come from components and the theme.
3. A page is `PageHeader` + content. Lists of things are a `DataGrid` when they are
   tabular; cards when they are not.
4. Errors are `Alert`; loading is `Loading` or `Skeleton`; no data is `EmptyState`.
5. Text the user reads goes through `const translate = useT()` — `translate(key, fallback)`, with an English fallback argument.
6. Business logic stays in hooks / pure modules inside the slice; components only compose.

## Backend i18n contract (used by `@atlas/i18n` and `@atlas/slice-translations`)

Served by `src/Atlas.Api` (`I18nEndpoints.cs`; the rules in `I18nCatalog.cs`, the files in
`I18nStore.cs`). All under `http://localhost:5179/api`. JSON, camelCase. Times are ISO-8601
UTC. Storage is JSON on disk under `i18n/`: `{code}.json` (current catalog),
`_history/{code}/{N}.json` (one snapshot per version, append-only), `_audit.jsonl` (one
audit line per mutation) and `_config.json` — no database.

```
GET    /i18n/locales                    → LocaleSummary[]   enabled locales only, default first
GET    /i18n/config                     → I18nConfig
PUT    /i18n/config                     ← { config: I18nConfig, actor, reason? }  → I18nConfig   (audit: "config")
GET    /i18n/{code}                     → Catalog           entries merged over the fallback chain
GET    /i18n/{code}?version=N           → Catalog           that snapshot's own entries, merged over the CURRENT fallback
GET    /i18n/{code}/versions            → VersionSummary[]  newest first
GET    /i18n/{code}/versions/{n}        → Catalog           raw snapshot, no fallback merge
PUT    /i18n/{code}/entries/{key}       ← { value, actor, reason? }  [If-Match: "N"]  → EntryChange   (audit: "set")
DELETE /i18n/{code}/entries/{key}       ← { actor, reason? }         [If-Match: "N"]  → EntryChange   (audit: "delete")
POST   /i18n/{code}/rollback            ← { toVersion, actor, reason? }               → RollbackResult (audit: "rollback")
GET    /i18n/audit?locale=&limit=100    → AuditEntry[]      newest first

LocaleSummary  { code, name, version, enabled: true }
I18nConfig     { defaultCode, locales: [{ code, name, enabled, fallbackCode: string | null }] }
Catalog        { code, name, version, entries: Record<string,string> }
VersionSummary { version, createdAt, actor, action, reason: string | null, changedKeys: string[] }
EntryChange    { code, version, key, before: string | null, after: string | null }
RollbackResult { code, version, restoredFrom }
AuditEntry     { id, timestamp, actor, locale: string | null, version: number | null,
                 action: 'set' | 'delete' | 'rollback' | 'config' | 'create',
                 key: string | null, before: string | null, after: string | null, reason: string | null }

Errors: 400 { error } bad body / empty actor / invalid key / malformed locale code / unparsable
If-Match; 404 { error } unknown locale, key, or version; 409 { error, currentVersion } when
If-Match does not equal the current version; 415 when a write's Content-Type is not
application/json.
Locale codes match ^[a-z]{2}(-[A-Z]{2})?$ ; keys match ^[a-z0-9]+(\.[a-zA-Z0-9]+)*$ (max 120 chars).
Every accepted write mints version + 1, one snapshot and one audit line; a rollback is a new
version whose entries equal the restored snapshot — history is never rewritten.
```
