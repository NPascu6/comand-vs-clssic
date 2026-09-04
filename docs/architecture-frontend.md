# Atlas Frontend Architecture

> An owned design system + one vertical slice per business domain, in a pnpm monorepo.
> Companion to the **`Atlas-Frontend.pptx`** deck.

## 1. Context

The Atlas web app lets a fund manager construct and manage funds: commit capital,
set appetite restrictions, navigate co-investment hierarchies, and compose their own views.
It is a React + TypeScript application that talks to the Atlas backend as its API.

The goal is the same as the backend's: **grow for years without coupling** — keep the UI
modular, configurable and testable, so new business functionality is additive.

## 2. The problem we are designing against

UI codebases bloat the same way services do:

- **God components / fat containers** that know about everything (layout + data + many widgets).
- **Deep inheritance** of base components/widgets → rigid and fragile.
- **Hard-coded layout & wiring** → every view is bespoke.
- **Prop-drilling and state sprawl**; **cross-cutting concerns** (loading, error, i18n,
  resizing) duplicated in every widget.
- **Coupling to a UI library's opinions** so it can't be swapped without touching every screen.

## 3. The shape — a pnpm monorepo (`web/`)

```
web/
  packages/
    core/         the design system you OWN — an API over MUI 9 (+ MUI X DataGrid), one theme, Storybook
    design-tokens/ @atlas/design-tokens — Figma variables (figma/*.tokens.json) → the typed theme inputs core reads; generated output committed + checked in CI
    contracts/    TS mirror of the .NET contracts + seed data (one source of domain truth)
    i18n/         @atlas/i18n — backend-served translations (provider, useT, LocaleSwitcher)
    platform/     @atlas/platform — the slice manifest, the data-source context, fetch helpers
  slices/
    commit-capital/   the flagship write use-case (mirrors the backend command)
    appetite/         the appetite-restrictions dashboard
    deal-pipeline/    a deal-stage board (a state machine)
    coinvestment/     a navigable fund & co-investment hierarchy
    workspace/        a customizable dashboard of pluggable, resizable panels
    translations/     administers the backend catalogs: catalog · versions · audit · locales
  apps/
    atlas/          the thin app shell — composes slices via a registry; hosts the Design System page
```

Each **business domain is its own package** (a vertical slice) that owns its UI, its data
client, and its domain types. The **app shell knows nothing** about what's inside a slice —
it only consumes a manifest. Tooling: Vite, React 18, TypeScript (strict), MUI 9 + MUI X
DataGrid (community) behind `@atlas/core`, Emotion, pnpm workspaces; Deno runs lint + the
web tests in CI.

## 4. `core` — the design system you own

`@atlas/core` is the team's design system: an **owned API over MUI**, not a wrapper that
leaks a vendor.

- A **stable component API** (`AppShell`, `PageHeader`, `Card`, `Button`, `Select`,
  `ToggleGroup`, `DataGrid`, `Stat`, `Meter`, `StatusPill`, `Stepper`, `ConfirmDialog`, …)
  exported from one barrel. The MUI primitives we endorse as-is (`Box`, `Stack`, `Grid`,
  `Typography`, `Alert`, `Dialog`, …) are re-exported by name from the same barrel, so the
  import surface of a slice is always `@atlas/core`.
- **One theme, three modes** — light, dark and high contrast — created by
  `createAtlasTheme(mode)` and provided by `AtlasThemeProvider`. Every component reads its
  colours, borders, radii and focus rings from the theme (the DataGrid included, through the
  theme's component overrides), so the `ThemeSwitcher` in the header restyles the whole app —
  one palette swap, not per-component work. The chosen mode persists in `localStorage`.
- **Design tokens from Figma** — the theme's colours, fonts, radii and type scale are owned in
  Figma, not in code. `@atlas/design-tokens` transforms the Figma Variables export into typed
  theme inputs at build time (`pnpm --filter @atlas/design-tokens build`); the generated file
  is committed with the export, CI's `deno test` refuses a stale one, and the Storybook
  **Theme / Tokens** story shows every swatch per mode — the designer's check.
- **The consumer rule**: slices and the shell import `@atlas/core`, never `@mui/*`; no
  `className` styling; layout is `Stack` / `Grid` / `Box` with `sx` spacing only. Business
  code holds no styling — which is what lets the implementation underneath move again.
- **Storybook** documents and exercises every component, with a toolbar global that renders
  any story in each of the three modes.
- The **Design System** page in the app is a gallery of the whole API, rendered by the live
  theme — the proof that a slice needs no styling of its own.

> The frontend mirror of the backend's "own your core": the ergonomics of a mature UI kit,
> behind a seam we control.

## 5. Composition — slices + a registry

A slice exports a **manifest** (`id`, `title`, `domain`, `Component`). The app shell holds a
**registry** (`apps/atlas/src/slices.ts`): a plain array of manifests rendered into a nav,
grouped by `domain` (Fund Construction / Fund Management / Platform).

**Adding a business domain = build the package + add one line** to the registry. The shell,
the nav, and routing are generic — there is no god component to edit. This is composition
over inheritance, at the application level.

## 6. A slice, end to end — it mirrors the backend

```
form  →  typed client (mock | live API)  →  render outcome + decision trace
```

A slice mirrors the backend's `command → rules → handler`: the form builds a typed command,
a client submits it, and the slice renders the **same decision-trace shape** the backend
returns (as a core `DataGrid` — tabular lists are grids, everything else is cards). Two
interchangeable clients per slice:

- a **mock client** (deterministic, offline, mirrors the seeded data), and
- a **live API client** (calls the backend),

selected by a **Mock / Live** toggle in the shell. The domain types come from
`@atlas/contracts`, a TypeScript mirror of the .NET contracts + the same seed — one source of
domain truth across the stack. The mock's six commit rules are tested against the three
scenarios in `tests/Atlas.Web.Tests` (Deno), mirroring the backend's handler tests.

## 7. Configure by data, not code

- **The theme** — colours, typography and component defaults are design tokens owned in Figma;
  `@atlas/design-tokens` turns the variables export into the typed inputs `createAtlasTheme`
  reads, and the three modes are data (one palette record per Figma mode). Restyle by editing
  the Figma variables and rebuilding, not the components — CI's `deno test` refuses a stale
  generated file, and the Storybook **Theme / Tokens** story shows the result.
- **The slice registry** — features are data the shell renders.
- **Backend-served i18n** (`@atlas/i18n`) — the provider fetches the locale list and the chosen
  catalog from the backend; `const translate = useT()` gives `translate(key, fallback)`; a `LocaleSwitcher` lists
  whatever the backend offers. **Adding a language = dropping a JSON on the backend** — the
  frontend ships only English as an offline fallback and otherwise renders whatever
  keys/locales it's given, with **zero frontend change**.
- **Translations are a backend capability**, not a build artifact: catalogs are **versioned**
  (every edit mints a new version in an append-only history per locale), **configurable**
  (enable/disable a locale, its fallback chain) and **audited** (who, when, what, before,
  after, reason) through GET / PUT / DELETE / rollback endpoints, with JSON on disk as storage —
  no database, no packages. The `translations` slice administers it all — catalog, versions,
  audit, locales — from the same core API as every other slice, against the mock or the live
  API.

## 8. Composable, resizable views — the Workspace

The `workspace` slice is the antidote to UI bloat made concrete:

- **Panels are values** in a registry; a **view is data** (a layout array); one **generic
  `PanelFrame`** does resize / title / remove uniformly (hand-rolled pointer-drag + width
  controls — no layout library).
- Users compose their own view (add / remove / resize panels). New panels plug in without
  touching the frame — the cross-cutting chrome is written once.

| What makes OOP UIs bloat | The compositional antidote |
|---|---|
| God components own layout + data + widgets | a generic shell renders a view (data) |
| Inheritance hierarchies of widgets | panels/slices are values in a registry |
| Hard-coded layout per screen | a view is data; one frame handles chrome |
| Cross-cutting concerns duplicated | resize/title/remove/i18n written once |

## 9. New functionality scales additively

The `deal-pipeline` slice (a stage board / state machine) is a worked example: a **new domain
= a new slice package + one registry line**, reusing `@atlas/core`. It also introduced a new
reusable `core` component (`Stepper`) — UI elements grow the same way: **+1 component, +1
story**, styled by the theme, reused everywhere. The `translations` slice is the second
example: an admin surface for a backend capability, built from the existing API alone
(`Tabs`, `DataGrid`, `ConfirmDialog`, toasts) — no new component, no shell change.

## 10. Why it scales

- **Composition over inheritance** — the shell + frame are generic; features and panels are
  values. Growth is additive.
- **Data-driven** — theme, registry, i18n, views are all data; behavior changes without code
  churn.
- **One owned core** — the design system is written once and reused; no per-feature plumbing,
  and the UI library stays behind a seam the slices never cross.
- **Mirrors the backend** — same vertical-slice + owned-core philosophy end to end, so the two
  halves of the team share one mental model.

## 11. Trade-offs (honest)

- **MUI behind an owned API** (vs owning the CSS, or using MUI raw) → we keep a mature,
  accessible kit and its DataGrid, and the seam keeps business code free of it — but every new
  need goes through `core` first, and `core` is ours to maintain.
- **The theme is the only styling channel** → three modes come for free, but a component that
  hard-codes a colour breaks high-contrast mode; review catches it, Storybook shows it.
- **MUI (with Emotion) is a runtime dependency** → one dependency, upgraded in one place;
  acceptable, and the alternative — owning every component's CSS, a11y and a data grid — costs
  far more.
- **pnpm + monorepo tooling to learn** → standard for serious frontends; the payoff is clean
  package boundaries.
- **Translations as JSON on disk** → versioned and audited with no database; right for a
  catalog of hundreds of keys, not a content management system.

For a tiny app, a single Vite app + a UI kit used raw is fine. This earns its keep when the
UI must grow across many domains for years.

## 12. Run it

```bash
cd web && pnpm install
pnpm dev                                   # the Atlas app on :5173 (Mock by default)
pnpm --filter @atlas/core storybook          # the design system on :6006 — toolbar: light / dark / contrast
pnpm --filter @atlas/design-tokens build     # figma/*.tokens.json → the typed theme inputs core reads
pnpm --filter @atlas/design-tokens check     # exit 1 if the generated file is stale (what CI asserts)
# optional, for the Live API toggle + the translations backend:
dotnet run --project ../src/Atlas.Api        # the backend on :5179

# tests — what CI runs (Deno, from the repo root) and the .NET suites
deno lint && deno test -A                    # web sources + tests/Atlas.Web.Tests
dotnet test tests/Atlas.Functional.Commands.Tests
dotnet test tests/Atlas.Api.Tests            # the i18n catalog rules + the store
```

## 13. Deployment

Two static sites and a set of packages. `pnpm build:app` writes `apps/atlas/dist/`, which
`.azure-pipelines/deploy-web-app.yml` ships to an Azure Static Web App; `pnpm build:storybook`
writes `packages/core/storybook-static/`, which `deploy-storybook.yml` ships to a second one. Each
site is its own Terraform stack (`infra/stacks/web-app`, `infra/stacks/storybook`) with its own
state: the deploy pipeline applies it first, then deploys with the token the stack outputs, so no
token is stored anywhere. The build is environment-free: the app fetches `/config.json` at boot
(`loadRuntimeConfig` in `@atlas/platform`) and the pipeline writes that file — `{ "apiBaseUrl": … }`
— into the artefact per environment, dev then prod after an approval. Every package and slice builds
to `dist/` (ESM + `.d.ts`) and is published to an npm feed by `publish-packages.yml`; `publishConfig`
repoints `main` / `types` / `exports` at `dist/` so development stays source-linked. See
[deployment.md](deployment.md).
