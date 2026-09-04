# Atlas web — shared `core` + vertical-slice packages

The frontend half of the Atlas showcase. Same philosophy as the backend: a small
**owned core**, **business logic isolated per use case**, and **no coupling to
libraries we don't control**.

It is a **pnpm workspace** where each business domain is its own package — a
*vertical slice* that owns its UI, its data client, and its manifest. The shell
app discovers slices through a manifest and knows nothing about their internals.

```
web/
├── packages/
│   ├── contracts/   @atlas/contracts  — TS mirror of the .NET contracts + seed (domain truth)
│   ├── core/        @atlas/core       — the design system (owns tokens + Tailwind preset)
│   │   ├── src/components/  Tailwind implementation  (the "after")
│   │   └── src/legacy/      MUI implementation        (the "before")  -> @atlas/core/legacy
│   └── platform/    @atlas/platform   — data-source context, slice manifest, fetch helper
├── slices/
│   ├── commit-capital/   @atlas/slice-commit-capital  — the flagship write use-case
│   ├── coinvestment/     @atlas/slice-coinvestment    — the hierarchy view
│   └── appetite/         @atlas/slice-appetite        — the appetite dashboard
└── apps/
    └── atlas/         @atlas/app        — the shell: slice registry + nav + data-source toggle
```

## Two stories this repo tells

**1. `core` is being decoupled from MUI → Tailwind, behind a stable API.**
Today `core` wraps MUI with heavy custom styling. The target is an owned Tailwind
implementation. Both live behind the *same* component props (`@atlas/core` vs
`@atlas/core/legacy`), so the slices import `{ Button }` and never know which backs
it. Migration is component-by-component — no slice changes, no big-bang rewrite.
See the **Design System** page in the running app for a 1:1 before/after.

**2. Each business domain is an independent vertical slice.**
A slice owns everything for its use case in one package: types it needs, a data
client (mock + live API), its components, and a `manifest`. Adding a domain =
adding a package + one line in [`apps/atlas/src/slices.ts`](apps/atlas/src/slices.ts).
You design one use case at a time, with full freedom inside the slice.

## Data source: mock by default, live API optional

Every slice reads `useDataSource()` to pick its client. The header toggles
**Mock** (deterministic, offline, mirrors the backend seed + rules) vs **Live
API** (calls the ASP.NET `Atlas.Api`). The commit-capital decision trace renders
identically from either source — the shape is the contract.

## Run it

```bash
# from web/
pnpm install
pnpm dev          # Vite dev server on http://localhost:5173  (Mock works offline)
pnpm build        # production build
pnpm typecheck    # tsc --noEmit across every package

# optional: the live API the "Live API" toggle calls
dotnet run --project ../src/Atlas.Api      # http://localhost:5179
```

No `clsx`, no `react-query`, no `axios`, no mocking library — the same anti-coupling
stance as the backend. The one intentional dependency is MUI, precisely because
removing it is the point.
