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
    core/         the design system you OWN (components, tokens, Storybook)
    contracts/    TS mirror of the .NET contracts + seed data (one source of domain truth)
    i18n/         @atlas/i18n — backend-served translations (provider, useT, LocaleSwitcher)
  slices/
    commit-capital/   the flagship write use-case (mirrors the backend command)
    coinvestment/     a navigable fund & co-investment hierarchy
    appetite/         the appetite-restrictions dashboard
    workspace/        a customizable dashboard of pluggable, resizable panels
    deal-pipeline/    a deal-stage board (a state machine)
  apps/
    atlas/          the thin app shell — composes slices via a registry
```

Each **business domain is its own package** (a vertical slice) that owns its UI, its data
client, and its domain types. The **app shell knows nothing** about what's inside a slice —
it only consumes a manifest. Tooling: Vite, React 18, TypeScript (strict), Tailwind v3, pnpm
workspaces.

## 4. `core` — the design system you own

`@atlas/core` is the team's design system, not a wrapper that leaks a vendor:

- A **stable component API** (`Button`, `Card`, `Field`, `StatusPill`, `Stat`, `Meter`,
  `DataTable`, `Stepper`, …) plus owned **design tokens** (a Tailwind preset).
- **Decoupling MUI → Tailwind behind that API.** Components have a legacy MUI implementation
  and an owned Tailwind implementation behind the *same* exported interface, so the migration
  is **incremental and contained** — the slices import `@atlas/core` and never see MUI or
  Tailwind directly.
- **Storybook** documents and exercises every component (incl. a MUI-vs-Tailwind comparison),
  so the system is demonstrable and testable in isolation.

> The migration story is the frontend mirror of the backend's "own your core, no library
> lock-in": you keep the ergonomics, drop the dependency.

## 5. Composition — slices + a registry

A slice exports a **manifest** (`id`, `title`, `domain`, `Component`). The app shell holds a
**registry** (`apps/atlas/src/slices.ts`): a plain array of manifests rendered into a nav,
grouped by `domain` (Fund Construction / Fund Management).

**Adding a business domain = build the package + add one line** to the registry. The shell,
the nav, and routing are generic — there is no god component to edit. This is composition
over inheritance, at the application level.

## 6. A slice, end to end — it mirrors the backend

```
form  →  typed client (mock | live API)  →  render outcome + decision trace
```

A slice mirrors the backend's `command → rules → handler`: the form builds a typed command,
a client submits it, and the slice renders the **same decision-trace shape** the backend
returns. Two interchangeable clients per slice:

- a **mock client** (deterministic, offline, mirrors the seeded data), and
- a **live API client** (calls the backend),

selected by a **Mock / Live** toggle in the shell. The domain types come from
`@atlas/contracts`, a TypeScript mirror of the .NET contracts + the same seed — one source of
domain truth across the stack.

## 7. Configure by data, not code

- **Design tokens** — colors/spacing/typography live in the owned Tailwind preset; restyle by
  changing data, not components.
- **The slice registry** — features are data the shell renders.
- **Backend-served i18n** (`@atlas/i18n`) — the provider fetches the locale list and the chosen
  catalog from the backend; `useT()` returns `t(key)`; a `LocaleSwitcher` lists whatever the
  backend offers. **Adding a language = dropping a JSON on the backend** — the frontend ships
  only English as an offline fallback and otherwise renders whatever keys/locales it's given,
  with **zero frontend change**.

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
story**, reused everywhere.

## 10. Why it scales

- **Composition over inheritance** — the shell + frame are generic; features and panels are
  values. Growth is additive.
- **Data-driven** — tokens, registry, i18n, views are all data; behavior changes without code
  churn.
- **One owned core** — the design system is written once and reused; no per-feature plumbing,
  no UI-vendor lock-in.
- **Mirrors the backend** — same vertical-slice + owned-core philosophy end to end, so the two
  halves of the team share one mental model.

## 11. Trade-offs (honest)

- **Owning the design system** (vs buying a UI kit) → you control accessibility, theming and
  evolution, with no lock-in — but it's yours to maintain.
- **The MUI → Tailwind migration is real work** → but incremental, behind the stable API.
- **pnpm + monorepo tooling to learn** → standard for serious frontends; the payoff is clean
  package boundaries.
- **Tailwind is a build dependency** → utility CSS with owned tokens; acceptable, and the
  alternative (a heavy UI kit) couples harder.

For a tiny app, a single Vite app + an off-the-shelf UI kit is fine. This earns its keep when
the UI must grow across many domains for years.

## 12. Run it

```bash
cd web && pnpm install
pnpm dev                                   # the Atlas app on :5173 (Mock by default)
pnpm --filter @atlas/core storybook          # the design system on :6006
# optional, for the Live API toggle:
dotnet run --project ../src/Atlas.Api        # the backend on :5179
```
