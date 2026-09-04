# Atlas web — shared `core` + vertical-slice packages

The frontend half of the Atlas showcase. Same philosophy as the backend: a small
**owned core**, **business logic isolated per use case**, and **no coupling to
libraries we don't control** — the one UI library we do use sits behind an API
we own.

It is a **pnpm workspace** where each business domain is its own package — a
*vertical slice* that owns its UI, its data client, and its manifest. The shell
app discovers slices through a manifest and knows nothing about their internals.

```
web/
├── packages/
│   ├── contracts/   @atlas/contracts  — TS mirror of the .NET contracts + seed (domain truth)
│   ├── core/        @atlas/core       — the design system: an owned API over MUI 9 + MUI X DataGrid
│   │   └── src/
│   │       ├── theme/          createAtlasTheme (light / dark / contrast), AtlasThemeProvider, ThemeSwitcher
│   │       ├── layout/         AppShell, PageHeader, Section, Card, CardHeader
│   │       ├── navigation/     NavList, Stepper, Breadcrumbs
│   │       ├── controls/       Button, TextField, Select, ToggleGroup
│   │       ├── data-display/   DataGrid, Stat, Meter, StatusPill, KeyValueList, Mono
│   │       ├── feedback/       EmptyState, Loading, ToastProvider
│   │       ├── overlay/        ConfirmDialog
│   │       └── index.ts        the barrel — the only public entry point (stories sit next to each component)
│   ├── design-tokens/ @atlas/design-tokens — Figma variables → the typed theme inputs core reads (no dependencies)
│   │   ├── figma/          the Figma Variables export: Atlas.{Light,Dark,Contrast,Base}.tokens.json — the source of truth
│   │   └── src/generated/  theme-inputs.ts — built from the export, committed, checked in CI
│   ├── i18n/        @atlas/i18n       — backend-served translations: I18nProvider, useT, LocaleSwitcher
│   └── platform/    @atlas/platform   — data-source context, slice manifest, fetch helpers
├── slices/
│   ├── commit-capital/   @atlas/slice-commit-capital  — the flagship write use-case (form → outcome + decision trace)
│   ├── appetite/         @atlas/slice-appetite        — the appetite-restrictions dashboard
│   ├── deal-pipeline/    @atlas/slice-deal-pipeline   — a deal-stage board (a state machine)
│   ├── coinvestment/     @atlas/slice-coinvestment    — the navigable fund & co-investment hierarchy
│   ├── workspace/        @atlas/slice-workspace       — a customizable dashboard of pluggable, resizable panels
│   └── translations/     @atlas/slice-translations    — edit, version, roll back and audit the backend catalogs
└── apps/
    └── atlas/         @atlas/app        — the shell: slice registry + nav + theme / language / data-source switchers + the Design System page
```

## Three stories this repo tells

**1. `core` is an owned API over MUI.**
`@atlas/core` is a stable component API — `AppShell`, `PageHeader`, `Card`,
`Button`, `Select`, `ToggleGroup`, `DataGrid`, `Stat`, `Meter`, `StatusPill`,
`ConfirmDialog`, … — over MUI 9 and the MUI X DataGrid (community edition).
The MUI primitives we endorse as-is (`Box`, `Stack`, `Grid`, `Typography`,
`Alert`, `Dialog`, …) are re-exported by name from the same barrel, so a slice's
import surface is always `@atlas/core`: `grep -r "@mui" slices apps` returns
nothing. One theme with three modes — **light, dark, high contrast** — is the
only place colours, borders, radii and focus rings are decided; every component
reads it, so the header's `ThemeSwitcher` restyles the whole app, grids
included. Business code holds no styling, which is what lets the implementation
move again without touching a slice. The **Design System** page in the running
app is a gallery of the whole API, rendered by the live theme.

The theme's values are **design tokens owned in Figma**. `@atlas/design-tokens`
transforms the Figma Variables export (`packages/design-tokens/figma/*.tokens.json`)
into the typed inputs `createAtlasTheme` reads — at build time, pure TypeScript, no
runtime dependency — and the generated file is committed next to the export. CI's
`deno test` refuses a stale generated file, so the export and the theme cannot
drift; the Storybook **Theme / Tokens** story shows every swatch per mode — the
designer's check that a change landed. A restyle is a Figma edit, an export and a
build: no component changes.

**2. Each business domain is an independent vertical slice.**
A slice owns everything for its use case in one package: types it needs, a data
client (mock + live API), its components, and a `manifest`. Adding a domain =
adding a package + one line in [`apps/atlas/src/slices.ts`](apps/atlas/src/slices.ts).
You design one use case at a time, with full freedom inside the slice. Tabular
lists are the core `DataGrid` (the decision trace, the hierarchy, the pipeline,
the catalogs); the rest are cards.

**3. Translations are a backend capability.**
`@atlas/i18n` fetches the locale list and the chosen catalog from `Atlas.Api`,
so a language added on the backend appears in the `LocaleSwitcher` with no
frontend change (only English ships offline). Catalogs are **versioned** —
every edit mints a new version in an append-only history per locale —
**configurable** (enable/disable a locale, its fallback chain) and **audited**
(who, when, what, before, after, reason) through GET / PUT / DELETE / rollback
endpoints. Storage is JSON on disk: no database, no packages. The
`translations` slice administers all of it — catalog, versions, audit,
locales — against the mock or the live API, built from the same `core` API as
every other slice.

## Data source: mock by default, live API optional

Every slice reads `useDataSource()` to pick its client. The header toggles
**Mock** (deterministic, offline, mirrors the backend seed + rules) vs **Live
API** (calls the ASP.NET `Atlas.Api`). The commit-capital decision trace renders
identically from either source — the shape is the contract.

## Run it

```bash
# from web/
pnpm install
pnpm dev                              # Vite dev server on http://localhost:5173  (Mock works offline)
pnpm build                            # production build of the app (apps/atlas/dist)
pnpm build:packages                   # tsc every package + slice to its own dist/ (ESM + .d.ts) — what gets published
pnpm build:storybook                  # static Storybook → packages/core/storybook-static (what the storybook pipeline deploys)
pnpm typecheck                        # tsc --noEmit across every package
pnpm --filter @atlas/core storybook   # the design system on http://localhost:6006 — toolbar: light / dark / contrast
pnpm --filter @atlas/design-tokens build   # figma/*.tokens.json → packages/design-tokens/src/generated/theme-inputs.ts
pnpm --filter @atlas/design-tokens check   # exit 1 if the generated file is stale (what CI's deno test asserts)

# optional: the live API the "Live API" toggle calls (also serves the translations)
dotnet run --project ../src/Atlas.Api      # http://localhost:5179

# what CI runs (.github/workflows/deno.yml), from the repo root — config in deno.jsonc
deno lint                                  # web/apps, web/packages, web/slices, tests
deno test -A                               # tests/Atlas.Web.Tests: the mock commit rules vs the three scenarios + the design-tokens export ⇔ generated check
```

**Build once, deploy anywhere.** The app reads `/config.json` at boot
(`loadRuntimeConfig` in `@atlas/platform`) for the API base URL; the deployment
writes that file per environment next to `index.html`, so nothing about the
environment is baked into the build. Locally `apps/atlas/public/config.json`
holds the default (`http://localhost:5179/api`), and a missing or malformed file
falls back to the same default. In development the packages stay source-linked
(`main` → `src/index.ts`); `publishConfig` points the published artefact at
`dist/`, so `pnpm build:packages` followed by `pnpm publish` is all a release takes.
How the pipelines build `dist/` and `storybook-static/`, apply each site's own
Terraform stack (`infra/stacks/web-app`, `infra/stacks/storybook`), write `config.json`
per environment and deploy with the token the stack outputs is in
[docs/deployment.md](../docs/deployment.md).

No `clsx`, no `react-query`, no `axios`, no mocking library, no CSS framework —
the same anti-coupling stance as the backend. MUI is the one intentional
dependency, and it sits behind an API we own: slices never import it, so it can
be upgraded, restyled or replaced without touching business code.
