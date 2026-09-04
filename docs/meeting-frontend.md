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
- Pre-flight: `cd web && pnpm install`; have `pnpm dev` (:5173) and `pnpm --filter @atlas/core storybook` (:6006) running.

## Agenda (timeboxed)
| Min | Segment | Deck / demo |
|---|---|---|
| 0–4 | **Frame the problem** — UI apps bloat too (god components, inheritance, hard-coded layout). | §Own the core |
| 4–12 | **The shape** — a pnpm monorepo: shared `core` + one package per domain + a thin shell; `core` = the design system you own (**MUI → Tailwind** behind a stable API). | §Own the core + Storybook: **Design System / MUI vs Tailwind** |
| 12–24 | **Pluggable composition** — the slice registry (add a domain = a package + one line); a slice end-to-end mirrors the backend; the composable, resizable **Workspace**; OOP-bloat → antidote. | §Pluggable composition + app: open slices, **Workspace** (resize/add/remove panels) |
| 24–34 | **Scale & configure** — new functionality drops in (**Deal Pipeline** + the `Stepper`); configure by data; **backend-served i18n** (add a language with zero FE change). | §Scale & configure + app: switch **Language**, open **Deal Pipeline** |
| 34–38 | **Honest trade-offs** — owning the design system, the MUI→Tailwind migration, monorepo tooling. | §trade-offs |
| 38–40 | **The ask + next steps.** | blueprint + close |

## The ask
Build the Atlas UI as an owned `core` + vertical-slice packages (one per domain), with data-driven config and backend-served i18n. Greenlight `core` + the first slice as the template.

## Anticipated questions → responses
- **"Why not just use a UI kit (MUI/AntD) directly?"** — We do today (MUI); the issue is coupling. An owned API lets us migrate MUI→Tailwind behind it, control a11y/theming, and never lock the whole app to one vendor.
- **"Isn't a monorepo overkill?"** — It buys clean package boundaries (core, contracts, i18n, slices). For a multi-domain app that grows for years, it pays for itself; for a tiny app it wouldn't.
- **"Tailwind vs CSS-in-JS?"** — Utility CSS with **owned tokens** (a preset `core` controls); no runtime UI dependency.
- **"How do new languages work?"** — They're data on the backend; the FE renders whatever keys/locales it's given — zero FE change to add one.
- **"How does this stay consistent across teams?"** — One `core` + the slice registry + Storybook as the contract; agreed conventions enforced in review.

## Decision sought & next steps
- ✅ Decision: adopt owned-core + vertical slices for the Atlas UI (or a spike).
- Next: stand up `core` (tokens + first components) + one slice end-to-end against the backend; review in 2 weeks.

## Live-demo checklist
```bash
cd web && pnpm dev                                 # Atlas app on :5173 (Mock by default)
pnpm --filter @atlas/core storybook                  # design system on :6006
dotnet run --project ../src/Atlas.Api                # backend on :5179, for the Live API toggle + i18n
```
In the app: drill the **Fund & Hierarchy** slice → compose the **Workspace** → open **Deal Pipeline** → switch **Language** → flip **Mock / Live API**.
