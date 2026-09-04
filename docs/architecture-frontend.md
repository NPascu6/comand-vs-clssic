# Atlas Frontend Architecture

> An owned design system, its tokens owned in Figma, and one application that consumes both.
> Companion to the **`Atlas-Frontend.pptx`** deck.

## 1. Context

The Atlas frontend is a React + TypeScript design system and the application that
consumes it. The goal is the same as the backend's: **grow for years without
coupling** — keep the UI modular, configurable and testable, so a new screen is
composition rather than construction.

## 2. The problem we are designing against

UI codebases bloat the same way services do:

- **God components / fat containers** that know about everything (layout + data + many widgets).
- **Deep inheritance** of base components → rigid and fragile.
- **Hard-coded visual values** scattered across screens, so a rebrand is a search-and-replace.
- **Cross-cutting concerns** (loading, error, i18n, theming) duplicated in every widget.
- **Coupling to a UI library's opinions** so it can't be swapped without touching every screen.

## 3. The shape — a pnpm monorepo (`web/`)

```
web/
  packages/
    design-tokens/  Figma variables (figma/*.tokens.json, one file per mode) → four generated targets:
                    the typed theme inputs, CSS custom properties, a JSON bundle and a .NET package
    core/           the design system you OWN — an API over MUI 9: the theme, the primitives,
                    the layout frame and the controls, with Storybook as its shopfront
    figma-sync/     Figma Variables → a reviewed, versioned, attributed token release
    commands/       the rule → validator → handler pattern the sync is written in
    contracts/      TS mirror of the .NET contracts (one source of domain truth)
    i18n/           backend-served translations (provider, useT)
    platform/       runtime configuration and fetch helpers
  apps/
    atlas/          the showcase: the served palette, the modes, the overrides, the controls
```

Tooling: Vite, React 18, TypeScript (strict), MUI 9 behind `@atlas/core`, Emotion,
pnpm workspaces; Deno runs lint and the pure-TypeScript tests in CI.

## 4. `core` — the design system you own

`@atlas/core` is an **owned API over MUI**, not a wrapper that leaks a vendor. Its
barrel is the whole vocabulary an application has, and nothing else: none of its
components takes an `sx` prop, and **no MUI component is re-exported at all**, so
nothing outside core imports from `@mui/*` even indirectly.

- **Designers own the values, developers own the behaviour.** The design system is the
  mapping between them, and it is a build step, not a convention. A designer moves
  `component.button.paddingInlineMd` from 16 to 20 in Figma and every Button in every
  mode moves, with no React change; a designer cannot invent behaviour, because a
  component token nobody consumes **fails CI**. Developers, symmetrically, may not
  invent a value: no colour, radius, spacing or dimension literal exists in `core/src/**`.
- **Primitives instead of `Box` / `Grid` / `Typography`.** `Stack` (direction · `gap` ·
  `align` · `justify` · `wrap` · `grow` · `fill`), `Split` (a row whose children sit at
  the two ends), `Columns` + `Column` (`columns={{ xs: 1, md: 2, xl: 3 }}`, `span`), and
  `Text` — seven semantic variants with a tone and a weight. Every gap and padding is a
  name on one scale — `Space` = `none | xs | sm | md | lg | xl` → 0 / 4 / 8 / 16 / 24 /
  32 px — so a call site never writes a number; widths work the same way
  (`width="sm" | "md" | "lg" | "full"` → 220 / 360 / 480 px).
- **A granular frame.** `AppHeader` is a *surface* — the header tokens' height, inline
  padding and bottom rule — and arranges nothing; `Brand` and `Split` do that, so each
  part stays usable on its own. `Page` is the body's inset and rhythm, from the layout
  tokens, so an application never picks a page padding either.
- **One tone vocabulary.** `Tone` = `primary · secondary · success · warning · danger ·
  info · neutral`, and it means the same thing on every component that has a colour.
  Core offers the variations rather than making the caller build them: a Button is
  `solid | soft | outline | ghost | link` × tone × `sm | md | lg`.
- **Three modes from one export.** `createAtlasTheme({ mode })` builds light, dark or
  high contrast; `getAtlasTheme` memoises, and `atlasTheme` is a ready-made default, so
  a consumer that wants the defaults configures nothing. `AtlasThemeProvider` owns the
  selection, persists it and stamps `data-theme` on `<html>`. Every component reads its
  colours, borders, radii and focus rings from the theme, so one swap restyles
  everything, and high contrast keeps its heavier borders and focus rings everywhere.

## 5. Tokens — two classes, four targets

*Global tokens* — colour, `space` (4/8/16/24/32), `radius` (control 8, surface 12),
`opacity.soft`, the type ramp, page `layout` — are reusable everywhere. *Component
tokens* under `component.<name>.<property>` are one component's own visual
configuration (`button`, `input`, `field`, `header`). The line is deliberate: a value
only one component can use does not belong in the global scale, and a value three
components share does not belong to one of them.

Above them sits a **semantic vocabulary of the domain** — `status.*`, `performance.*`,
`exposure.*`, `assetClass.*`, `region.*`, and an eight-step categorical `series` — each
an alias into the palette, authored once and resolved per mode.

Figma exports one file per mode; a lookup cascades `Atlas.<Mode> → Atlas.Base`. A
component **colour** token is the one alias the transform does *not* resolve: it is
emitted as the palette path (`focusBorderColor: 'primary.main'`), because there is one
`components` object but three palettes — the path is true in all of them, and core
resolves it at render time with `resolveColorToken`.

One build produces four targets from that export — the MUI theme inputs, CSS custom
properties, a flat JSON bundle and a C# package — so no consumer can drift from
another. CI refuses a stale target, and refuses a stale `core/src/generated/token-usage.ts`
(the token → component map) with it.

Who may change what, and how a token change is reviewed:
[design-tokens-governance.md](design-tokens-governance.md).

## 6. Overrides — how an application re-skins without CSS

Three ways in, and they compose:

| level | reaches | for |
|---|---|---|
| `tokens` on `AtlasThemeProvider` | the whole application | a host that wants its own brand |
| `<AtlasTokenScope tokens={…}>` | one subtree | what would otherwise have been a one-off stylesheet |
| `useAtlasTokens()` | any component | reading what the theme actually resolved |

A scope starts from the tokens its parent resolved, not from the shipped defaults, so
scopes nest. The tests read the **emitted CSS rules** rather than the theme object,
because an override that reaches the theme and not the screen is not an override.

## 7. The palette is served, not only bundled

`GET /api/design-tokens/{mode}` returns the same values flat, with the export's version
as the ETag. The API also renders artefacts with them — a fund's exposure factsheet as
SVG, coloured by `Tokens.Colour(assetClass)` — so a server-rendered PDF, XLSX or email
uses the design system rather than its own copy of it. The showcase reads the served
palette and falls back to the local export when the API is down, which is why both look
identical.

## 8. Translations are a backend capability

`@atlas/i18n` fetches the locale list and the chosen catalog from `Atlas.Api`, so a
language added on the backend appears in the `LocaleSwitcher` with no frontend change
(only English ships offline). Catalogs are versioned, configurable and audited through
the API. Storage is JSON on disk: no database, no packages.

## 9. The source has its own rules

Everywhere under `web/`: comments as close to zero as possible (a comment survives only
where a reader would otherwise get the behaviour *wrong*); a functional paradigm (pure
functions and function components, no classes, `const` over `let`, no imperative
accumulation); **150 lines per file, hard**, split by responsibility into siblings named
for what they are (`buttonSurface.ts`, `colorTokens.ts`); **no util modules** — a
function lives with the concept that owns it; and strict types — a union over `string`,
a typed record over an index signature, no `any`, `unknown` only at a real boundary.

The consumer rule is enforceable in one line:

```bash
git grep -nP "sx=|from '@mui|style=\{\{" -- web/apps     # → no output
```

## 10. Trade-offs (honest)

- **MUI behind an owned API** (vs owning the CSS, or using MUI raw) → we keep a mature,
  accessible kit, and the seam keeps application code free of it — but every new need
  goes through `core` first, and `core` is ours to maintain.
- **The theme is the only styling channel** → three modes come for free, but a component
  that hard-codes a colour breaks high-contrast mode; review catches it, the contrast
  gate fails on it.
- **No `sx` escape hatch in the consumer API** → the "behaviour only" rule stays true
  instead of eroding one exception at a time. The cost is that `core` has to carry the
  variations rather than the caller. The pressure valve is deliberate and narrow: token
  overrides and scopes cover the re-skinning case, slots let a team replace a documented
  part without forking, and `className` (never a style object) covers the genuinely
  exceptional one.
- **A deliberately small component set** → the design system is the theme, the
  primitives, a frame and the controls. Anything domain-shaped — a table of deals, a
  status pill, a money formatter — belongs to the application that needs it, composed
  from these. The cost is that two applications may build a similar thing twice; the
  benefit is that the design system stays reviewable and its tokens all have readers.
- **MUI (with Emotion) is a runtime dependency** → one dependency, upgraded in one place.
- **Translations as JSON on disk** → versioned and audited with no database; right for a
  catalog of hundreds of keys, not a content management system.

## 11. Run it

```bash
cd web && pnpm install
pnpm dev                                     # the showcase on :5174
pnpm --filter @atlas/core storybook          # the design system on :6006 — toolbar: light / dark / high contrast
pnpm --filter @atlas/design-tokens build     # figma/*.tokens.json → the four generated targets
pnpm --filter @atlas/design-tokens check     # exit 1 if a target is stale (what CI asserts)
# optional, for the served palette and the translations:
dotnet run --project ../src/Atlas.Api        # the backend on :5179

# tests — what CI runs (Deno, from the repo root) and the .NET suites
deno lint && deno test -A                    # web sources + tests/Atlas.Web.Tests
dotnet test tests/Atlas.Functional.Commands.Tests
dotnet test tests/Atlas.Api.Tests            # the i18n catalog rules, the store, the token endpoints
```

## 12. Deployment

Two static sites and a set of packages. The proof of concept (`pnpm --filter @atlas/designer-poc build` → `apps/designer-poc/dist/`,
`.azure-pipelines/deploy-web-app.yml`) and Storybook (`pnpm build:storybook`,
`deploy-storybook.yml`) each go to their own Azure Static Web App. Each site is its own
Terraform stack with its own state — `infra/stacks/web-app`, `infra/stacks/storybook` —
which the deploy pipeline applies first, then deploys with the token the stack outputs,
so no token is stored anywhere. The build is environment-free: the app fetches
`/config.json` at boot (`loadRuntimeConfig` in `@atlas/platform`) and its pipeline writes
that file into the artefact per environment, dev then prod after an approval. Every
package also builds to `dist/` (ESM + `.d.ts`) and is published to an npm feed by
`publish-packages.yml`; `publishConfig` repoints `main` / `types` / `exports` at `dist/`
so development stays source-linked. See [deployment.md](deployment.md).
