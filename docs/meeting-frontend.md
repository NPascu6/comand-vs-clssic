# Meeting agenda — Atlas Frontend architecture review

**Goal:** agree to build the Atlas UI on an **owned design system (`core`) whose values are owned in Figma**, in a pnpm monorepo.
**Deck:** `Atlas-Frontend.pptx` (20 slides) · **Pre-read:** [architecture-frontend.md](architecture-frontend.md)
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
| 4–14 | **The shape + the rule** — a pnpm monorepo: the token export, `core` built on it, and the application that consumes both; `core` = the design system you own (**MUI 9 behind an API we own**, driven by Figma tokens, **light / dark / high contrast**). Then the split that makes it work: **the application layer holds behaviour, core serves every pixel** — zero `sx`, zero `@mui` imports, zero CSS in the application. | §Own the core + app: the showcase, flip the **theme** switcher; Storybook's Mode toolbar |
| 14–24 | **Tokens, and who owns them** — Figma variables → four generated targets; the designer / developer boundary as a build step; **overrides** (the whole app, one subtree, and how they compose) so a host re-skins without CSS; the palette **served over HTTP** for consumers that are not React. | §Tokens + app: the served palette, the **Overrides** section, Storybook's token pages |
| 24–34 | **Scale & configure** — a Figma edit becomes a reviewed, versioned, attributed pull request (`@atlas/figma-sync`); **backend-served i18n** — versioned, configurable, audited. | §Scale & configure + app: switch **Language**; run the sync against a recorded payload and read the release report |
| 34–38 | **Honest trade-offs** — MUI behind an owned API, the tokens as the only styling channel, no `sx` escape hatch, monorepo tooling. | §trade-offs |
| 38–40 | **The ask + next steps.** | blueprint + close |

## The ask
Build the Atlas UI on an owned `core` whose values are Figma tokens, with token overrides as the only re-skinning channel and backend-served i18n. Greenlight `core` + the token pipeline as the template.

## Anticipated questions → responses
- **"Why MUI behind our own API rather than raw MUI or Tailwind?"** — Raw MUI couples every screen to a vendor's props and `sx`; a utility-CSS framework such as Tailwind would mean owning every component's CSS, accessibility and a data grid ourselves. `@atlas/core` keeps MUI's maturity, hides it behind an API we own, and puts every colour, gap, radius and width in tokens exported from Figma — so a switcher restyles the whole app, and the library could still be upgraded or swapped behind the seam without touching application code. Note the difference from raw MUI: our components take no `sx`, so an application cannot reach past the seam even by accident.
- **"Isn't a monorepo overkill?"** — It buys clean package boundaries (design-tokens, core, contracts, i18n, platform) and lets the token export be built, checked and published on its own. For a UI that grows for years, it pays for itself; for a tiny app it wouldn't.
- **"How do the modes stay consistent?"** — They are three palette records, one Figma file each, read by `createAtlasTheme({ mode })`. Components never hard-code a colour, a gap or a width: those come from the same token export, and a component colour token is a palette *path*, so it means the right thing in all three. Storybook has a **Mode** toolbar, so any component can be seen in any palette and a regression is visible before review.
- **"How do designers change the look?"** — They edit the Figma variables; the sync converts them, versions the release and opens a pull request, and `pnpm --filter @atlas/design-tokens build` turns the export into the four generated targets. It is not only colour: spacing (4/8/16/24/32), radii, control widths, the page inset and the header dimensions are tokens too, so a change to the spacing scale moves every screen at once. Storybook's token pages show every value; CI refuses a stale target, so the export and the theme cannot drift. No component changes.
- **"How do new languages work?"** — They're data on the backend; the FE renders whatever keys/locales it's given — zero FE change to add one. Edits are versioned (append-only history per locale), configurable (enable/disable, fallback chain) and audited (who / when / what / before / after / reason); rollback is just another new version. Storage is JSON on disk — no database, no packages.
- **"What happens when `core` can't express what an application needs?"** — That is the one real cost, and it is deliberate: the application does not style its way out. If the *value* is wrong, it overrides the token — for the whole app or for one subtree, with no CSS. If the *behaviour* is missing, it asks for a prop, which lands once in `core` with a story and a test. The alternative — one `sx` "just here" — is how design systems die.
- **"How does this stay consistent across teams?"** — One `core`, one token export, and Storybook as the contract. The rule is greppable, which is what makes it survive: `git grep -nP "sx=|from '@mui|style=\{\{" web/apps` returns nothing today and is a review gate (and a CI one if you want it). There is no `sx` prop on any core component, so the usual erosion — one exception at a time — has nowhere to start.

## Decision sought & next steps
- ✅ Decision: adopt owned-core + Figma-owned tokens for the Atlas UI (or a spike).
- Next: stand up `core` (theme + first components) + the Figma → pull request pipeline end to end; review in 2 weeks.

## Live-demo checklist
```bash
cd web && pnpm dev                                   # the showcase on :5174
pnpm --filter @atlas/core storybook                  # design system on :6006, mode toolbar
dotnet run --project ../src/Atlas.Api                # backend on :5179, for the served palette + i18n
node web/packages/figma-sync/scripts/figma-sync.ts --fixture brand-refresh --author-handle mara.ilic
node web/packages/figma-sync/scripts/figma-sync.ts --export exports/studio --author-handle mara.ilic   # a plugin export, or the token studio's
```
In the app: read **the palette, served** with the API up and again with it down → flip the **theme switcher** through light / dark / high contrast → walk the **Overrides** section (the shipped tokens, one scope, two nested scopes) → switch **Language**. Then run the sync against the recorded payload and read the release report: the rules that passed, the version bump, the author, and the files it rewrote.
