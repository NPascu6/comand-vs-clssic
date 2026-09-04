# Atlas web — the design system and the application that consumes it

The frontend half of the Atlas showcase. Same philosophy as the backend: a small
**owned core**, and **no coupling to libraries we don't control** — the one UI
library we do use sits behind an API we own.

It is a **pnpm workspace**: the token export, the design system built on it, and
one application that consumes both the way a client application would.

```
web/
├── packages/
│   ├── design-tokens/ @atlas/design-tokens — Figma variables → the typed theme inputs core reads (no dependencies)
│   │   ├── figma/          the Figma Variables export: Atlas.{Base,Light,Dark,Contrast}.tokens.json — the source of truth
│   │   └── src/            the pipeline, one folder per stage:
│   │       ├── schema/         every token stated once; types, paths, readers and emit order derive from it
│   │       ├── parse/          DTCG files in, resolved values out (the cascade, the aliases)
│   │       ├── build/          token set → ThemeInputs, and overrides deep-merged onto it
│   │       ├── emit/           ThemeInputs → TypeScript, CSS, JSON and C#
│   │       ├── validate/       the WCAG gate a release has to clear
│   │       └── generated/      theme-inputs.ts — built from the export, committed, checked in CI
│   ├── core/        @atlas/core       — the design system: the theme, its tokens and the basic controls, over MUI 9
│   │   └── src/
│   │       ├── theme/          createAtlasTheme, AtlasThemeProvider, AtlasTokenScope, useAtlasTokens,
│   │       │                   ThemeSwitcher, the Tone vocabulary, palette-path resolution
│   │       ├── primitives/     Stack, Text, Icon — MUI's, forwarded with the space scale and the type ramp
│   │       ├── layout/         AppHeader, Brand, Page — the frame: the bar, its app mark, the body
│   │       ├── controls/       Button, IconButton — MUI's, styled by the button tokens through the theme
│   │       ├── styles.css      the token export as custom properties, for a consumer without React
│   │       ├── generated/      token-usage.ts — token path → the components that read it (checked in CI)
│   │       └── index.ts        the barrel — the only public entry point (stories sit next to each component)
│   ├── figma-sync/  @atlas/figma-sync — Figma Variables → a reviewed token release
│   │   └── src/            figma/ (their payload, converted and hashed) · release/ (diff, ledger,
│   │                       report) · command/ (the command, its rules, its handler)
│   ├── commands/    @atlas/commands   — the rule → validator → handler pattern the sync is written in
│   ├── contracts/   @atlas/contracts  — TS mirror of the .NET contracts (domain truth)
│   ├── i18n/        @atlas/i18n       — backend-served translations: I18nProvider, useT
│   └── platform/    @atlas/platform   — runtime configuration and fetch helpers
└── apps/
    └── designer-poc/ @atlas/designer-poc — one page: the header, the type ramp and the buttons a designer owns
```

## Three stories this repo tells

**1. `core` is an owned API over MUI, and application code has no styling at all.**
Arrangement and type are core's own primitives — `Stack`, `Split`,
`Columns`/`Column`, `Text` — so MUI's `Box`, `Grid` and `Typography` are not
exported at all and an application has nothing to style with. The rule the whole
frontend is built to hold:

```bash
git grep -nP "sx=|from '@mui|style=\{\{" -- web/apps   # prints nothing
```

Every visual decision arrives as a prop: `tone`, `variant`, `size`, `gap`,
`padding`, `width`, `columns`. One `Tone` vocabulary (`primary｜secondary｜
success｜warning｜danger｜info｜neutral`) is spoken by every component that has a
colour. **No public component takes `sx`** — it would tie the contract to MUI and
let any call site invent a value the tokens do not know about.

**2. An application re-skins with tokens, never with CSS.**
The theme ships **three modes** — light, dark and high contrast — from one token
export. Any token can be laid over: `tokens` on `AtlasThemeProvider` for the
whole application, `AtlasTokenScope` for one subtree, and the two compose.
`useAtlasTokens()` gives a component the values the theme actually resolved, so
an override reaches what is drawn — proved in `theme/tokenOverrides.test.tsx`
against the emitted CSS rules rather than the theme object.

The values are **design tokens owned in Figma**, in **two classes**: *global*
tokens (colour, spacing, radius, typography — reusable everywhere) and
*component* tokens (`button.paddingInlineMd`, `input.focusBorderColor`,
`header.height` — one component's own configuration), so a designer moves a
button's padding from 16 to 20 without a developer touching `Button.tsx`.
`@atlas/design-tokens` transforms the Figma Variables export
(`packages/design-tokens/figma/*.tokens.json`, resolved through a mode → base
cascade) into the typed inputs `createAtlasTheme` reads — at build time, pure
TypeScript, no runtime dependency — and the generated file is committed next to
the export. A component **colour** token stays an alias: it arrives as the
palette path (`'primary.main'`), not a hex, so one token means the right colour
in every mode. CI refuses a stale generated file, and refuses a component token
no component reads. The governance flow — who owns what, what CI validates, what
a token PR must carry — is
[docs/design-tokens-governance.md](../docs/design-tokens-governance.md).

**3. The palette is served, not only bundled.**
The same export is emitted as CSS custom properties, a flat JSON bundle and a
.NET package, and the API serves it at `GET /api/design-tokens/{mode}`. A report
renderer, a native application or an email template paints with the design
system without importing React; the showcase reads the served palette and falls
back to the local export when the API is not running, which is why both look
identical.

**4. Translations are a backend capability.**
`@atlas/i18n` fetches the locale list and the chosen catalog from `Atlas.Api`,
so a language added on the backend reaches the frontend with no
frontend change (only English ships offline). Catalogs are **versioned**,
**configurable** and **audited** through the API's GET / PUT / DELETE / rollback
endpoints. Storage is JSON on disk: no database, no packages.

## Code design rules (every `.ts` / `.tsx` under `web/`)

The same discipline the architecture argues for, applied to the source:

- **Comments as close to zero as possible.** No doc comments on props, no
  section banners, no restating the code. A comment survives only where a reader
  would otherwise get the behaviour *wrong* — a browser quirk, a deliberate
  deviation — and then it is one line. Documentation lives in the README and in
  Storybook, which is the handshake.
- **Functional paradigm.** Pure functions and function components; no classes,
  `const` over `let`, no parameter mutation, `map` / `filter` / `reduce` /
  object spread over imperative accumulation. Side effects stay at the edges:
  React state, the DOM, `fetch`.
- **150 lines per file, hard; 100 preferred.** Split by responsibility into
  siblings named for what they are (`buttonSurface.ts`, `controlWidth.ts`,
  `colorTokens.ts`), never "part 1 / part 2". Generated files and data
  catalogues (`src/generated/*`, the i18n fallback, token JSON) are exempt.
- **No util modules.** No `util/`, no `helpers.ts`, no `misc.ts`. A function
  lives with the concept that owns it — spacing resolution with the `Space`
  scale, slot helpers with the slot contract.
- **Strict types, no ambiguity.** A union or template-literal type over
  `string`, a typed record over an index signature, no `any`, `unknown` only
  where data genuinely crosses a boundary, and no `as` to silence an error.

## Run it

```bash
# from web/
pnpm install
pnpm dev                              # Vite dev server on http://localhost:5174
pnpm build                            # production build (apps/designer-poc/dist)
pnpm build:packages                   # tsc every package to its own dist/ (ESM + .d.ts) — what gets published
pnpm build:storybook                  # static Storybook → packages/core/storybook-static (what the storybook pipeline deploys)
pnpm typecheck                        # tsc --noEmit across every package
pnpm --filter @atlas/core storybook   # the design system on http://localhost:6006 — toolbar: light / dark / high contrast
pnpm --filter @atlas/design-tokens build   # figma/*.tokens.json → packages/design-tokens/src/generated/theme-inputs.ts
pnpm --filter @atlas/design-tokens check   # exit 1 if a generated target is stale (what CI asserts)
pnpm --filter @atlas/core tokens:usage     # rescan core for token reads → packages/core/src/generated/token-usage.ts
pnpm --filter @atlas/core tokens:usage:check   # exit 1 if that map is stale (what the token pipeline asserts)

# optional: the API that serves the palette and the translations
dotnet run --project ../src/Atlas.Api      # http://localhost:5179

# what CI runs (.github/workflows/deno.yml), from the repo root — config in deno.jsonc
deno lint                                  # web/apps, web/packages, web/build, tests
deno test -A                               # tests/Atlas.Web.Tests: the token export ⇔ generated check, the
                                           # design vocabulary, and the token-usage map
```

**Build once, deploy anywhere.** The app reads `/config.json` at boot
(`loadRuntimeConfig` in `@atlas/platform`) for the API base URL; the deployment
writes that file per environment next to `index.html`, so nothing about the
environment is baked into the build. Locally `apps/designer-poc/public/config.json`
holds the default (`http://localhost:5179/api`), and a missing or malformed file
falls back to the same default. In development the packages stay source-linked
(`main` → `src/index.ts`); `publishConfig` points the published artefact at
`dist/`, so `pnpm build:packages` followed by `pnpm publish` is all a release
takes. How the pipelines build `dist/` and `storybook-static/`, apply each site's
own Terraform stack (`infra/stacks/web-app`, `infra/stacks/storybook`), write
`config.json` per environment and deploy with the token the stack outputs is in
[docs/deployment.md](../docs/deployment.md).

No `clsx`, no `react-query`, no `axios`, no mocking library, no CSS framework —
and not one `.css` file in the application. The same anti-coupling stance as the
backend: MUI is the one intentional dependency, and it sits behind an API we own.
The application never imports it and never styles itself, so it can be upgraded,
restyled or replaced without touching application code.
