# Meeting agenda — Atlas Frontend architecture review

**Goal:** agree to build the Atlas UI as an **owned design system (`core`) + one vertical slice per business domain** in a pnpm monorepo.
**Deck:** `Atlas-Frontend.pptx` (18 slides) · **Pre-read:** [architecture-frontend.md](architecture-frontend.md)
**Length:** ~40 min · **Format:** deck + live demo

## Attendees & roles
- **You** — presenter / proposer.
- **Lead architect** — decision-maker.
- **Frontend lead / senior FE** — implementation lens (optional).

## Before the meeting
- Send the pre-read (architecture-frontend.md) + the deck 24h ahead.
- Pre-flight: `cd web && pnpm install`; have `pnpm dev` (:5173), `pnpm --filter @atlas/core storybook` (:6006) and `dotnet run --project src/Atlas.Api` (:5179) running.

## Agenda (timeboxed)
| Min | Segment | Deck / demo |
|---|---|---|
| 0–4 | **Frame the problem** — UI apps bloat too (god components, inheritance, hard-coded layout). | §Own the core |
| 4–12 | **The shape** — a pnpm monorepo: shared `core` + one package per domain + a thin shell; `core` = the design system you own (**MUI 9 behind an API we own**, one theme with light / dark / high-contrast modes that every component reads). | §Own the core + app: **Design System** page, flip the **theme switcher**; Storybook's theme toolbar |
| 12–24 | **Pluggable composition** — the slice registry (add a domain = a package + one line); a slice end-to-end mirrors the backend; the composable, resizable **Workspace**; OOP-bloat → antidote. | §Pluggable composition + app: open slices, **Workspace** (resize/add/remove panels) |
| 24–34 | **Scale & configure** — new functionality drops in (**Deal Pipeline** + the `Stepper`); configure by data; **backend-served i18n** — versioned, configurable, audited — and the **Translations** slice that administers it. | §Scale & configure + app: switch **Language**, open **Deal Pipeline**, edit a key in **Translations** and watch the app pick it up |
| 34–38 | **Honest trade-offs** — MUI behind an owned API, the theme as the only styling channel, monorepo tooling. | §trade-offs |
| 38–40 | **The ask + next steps.** | blueprint + close |

## The ask
Build the Atlas UI as an owned `core` + vertical-slice packages (one per domain), with data-driven config and backend-served i18n. Greenlight `core` + the first slice as the template.

## Anticipated questions → responses
- **"Why MUI behind our own API rather than raw MUI or Tailwind?"** — Raw MUI couples every screen to a vendor's props and `sx`; a utility-CSS framework such as Tailwind would mean owning every component's CSS, accessibility and a data grid ourselves. `@atlas/core` keeps MUI's maturity and its DataGrid, hides it behind an API we own, and puts every colour in one theme — so the switcher restyles the whole app, and the library could still be upgraded or swapped behind the seam without touching a slice.
- **"Isn't a monorepo overkill?"** — It buys clean package boundaries (core, contracts, i18n, platform, slices). For a multi-domain app that grows for years, it pays for itself; for a tiny app it wouldn't.
- **"How do the three theme modes stay consistent?"** — They are three palette records — one Figma mode each — read by `createAtlasTheme`; components never hard-code a colour, and Storybook renders every component in every mode, so a regression is visible before review.
- **"How do designers change the look?"** — They edit the Figma variables and export them; `pnpm --filter @atlas/design-tokens build` turns the export into the typed theme inputs `createAtlasTheme` reads; Storybook's **Theme / Tokens** story shows every swatch per mode; and CI's `deno test` refuses a stale generated file, so the export and the theme cannot drift. No component changes.
- **"How do new languages work?"** — They're data on the backend; the FE renders whatever keys/locales it's given — zero FE change to add one. Edits are versioned (append-only history per locale), configurable (enable/disable, fallback chain) and audited (who / when / what / before / after / reason); rollback is just another new version. Storage is JSON on disk — no database, no packages.
- **"How does this stay consistent across teams?"** — One `core` + the slice registry + Storybook as the contract; `grep -r "@mui" slices apps` returns nothing, and that stays true in review.

## Decision sought & next steps
- ✅ Decision: adopt owned-core + vertical slices for the Atlas UI (or a spike).
- Next: stand up `core` (theme + first components) + one slice end-to-end against the backend; review in 2 weeks.

## Live-demo checklist
```bash
cd web && pnpm dev                                 # Atlas app on :5173 (Mock by default)
pnpm --filter @atlas/core storybook                  # design system on :6006, theme toolbar
dotnet run --project ../src/Atlas.Api                # backend on :5179, for the Live API toggle + i18n
```
In the app: open **Design System** and flip the **theme switcher** → drill the **Fund & Hierarchy** slice → compose the **Workspace** → open **Deal Pipeline** → switch **Language** → edit a key in **Translations**, then roll it back → flip **Mock / Live API**.
