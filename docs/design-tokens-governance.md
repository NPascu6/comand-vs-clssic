# Design token governance

Designers own the visual language. Developers own the React contract. The design
system owns the mapping between them, and it is a build step — not a convention.

A token change therefore ships exactly like a code change: it is authored in Figma,
exported, opened as a pull request, validated by CI, and reviewed against evidence
CI produces. Nothing about it is manual, and nothing about it needs a developer to
retype a number.

## The boundary

| Owned by | What | Where it lives |
| --- | --- | --- |
| **Designers** | The visual language: the three modes, the type scale, radii, the spacing scale, page layout dimensions, the domain vocabulary, and each component's own visual configuration (`component.button.paddingInlineMd`, `component.input.focusBorderColor`, `component.header.height`, …). | Figma Variables, exported to `web/packages/design-tokens/figma/<Collection>.<Mode>.tokens.json` |
| **Developers** | The React contract: props, variants, sizes, tones and states; behaviour; accessibility; the documented extension points (`slots`, `slotProps`, `className`) and composition. Which token a component spends, and where. | `web/packages/core/src/**` |
| **The design system** | The mapping and its guarantees: which token exists, what type it has, which visual property it feeds, and that the generated output matches the export. | `web/packages/design-tokens/src/{manifest,transform,emit}.ts`, `web/packages/core/src/theme/createAtlasTheme.ts`, `web/packages/core/src/generated/token-usage.ts` |

A designer retunes `component.button.paddingInlineMd` from 16px to 20px and every
Button in every mode moves, with no React change. A designer cannot invent
behaviour: a component token nobody consumes **fails the usage check**, so a token
that changes no pixel cannot be merged and called a change.

## The flow

1. **Figma variables.** The designer changes a variable in the Atlas library — a
   global semantic token (`radius.control`, `space.md`, a palette colour) or a
   component token under `component.<name>.<property>`.
2. **Sync.** `@atlas/figma-sync` reads the Figma Variables API, converts the
   payload to one DTCG file per mode under `web/packages/design-tokens/figma/`,
   versions the change against `figma/tokens.lock.json` and attributes it to the
   designer who published it. The file name's second segment is the mode;
   `Atlas.Base` is the layer every mode cascades onto.
3. **Regenerate and open a pull request.** `pnpm --filter @atlas/design-tokens build`
   turns the export into all four targets — the theme inputs, the CSS custom
   properties, the JSON bundle and the .NET package. The export, the ledger and
   every generated target are committed together.
4. **Validation.** The `ValidateTokens` job
   (`.azure-pipelines/templates/validate-tokens.yml`, wired into `azure-pipelines.yml`)
   runs `pnpm --filter @atlas/design-tokens check` (the committed output still matches
   the export), `pnpm --filter @atlas/core tokens:usage:check` (the token → component
   map is current), `deno lint` and `deno test -A`
   (`tests/Atlas.Web.Tests/design-tokens.test.ts` covers the cascade, aliases and
   missing paths), then `pnpm test` — the component suite,
   which carries [the contrast gate](#the-contrast-gate).
5. **Generated TypeScript.** `theme-inputs.ts` is the only thing `@atlas/core` reads;
   `createAtlasTheme` turns it into the three palettes and the MUI component
   defaults. It is never edited by hand — the check fails if it is.
6. **Storybook evidence.** The same job publishes two artefacts: `token-diff`
   (`tokens.diff`, the `git diff` restricted to `web/packages/design-tokens/figma`
   and `web/packages/design-tokens/src/generated`) and `storybook`, the built
   Storybook. The Tokens story (`web/packages/core/src/theme/Tokens.stories.tsx`)
   shows every palette swatch per mode, and the Global and Components stories list
   the dimensions — so the reviewer sees the numbers *and* the rendered result.
7. **Two approvals.** A designer approves the rendered result, a developer approves
   the diff. Neither approves alone.
8. **Merge.** `.azure-pipelines/deploy-storybook.yml` runs the same job as its build
   stage and deploys that Storybook to dev, then to prod after the `atlas-prod`
   approval — so what is published is what was reviewed.

## The contrast gate

Colour is the one part of the visual language a designer cannot settle alone.
`web/packages/core/src/a11y/paletteContrast.test.tsx` measures every palette
`theme-inputs.ts` emits — light, dark and high contrast — and CI treats it as
authoritative:
a failing pair blocks the merge, and the palette that ships is the one that passed.

| Pair | Minimum |
| --- | --- |
| `text.primary` and `text.secondary`, each on `background.default` and `background.paper` | 4.5:1 (WCAG AA body text) |
| `primary.main`, `secondary.main`, `success.main`, `warning.main`, `error.main`, `info.main`, each on both backgrounds | 3:1 (WCAG AA non-text UI) |
| `primary.contrastText` on `primary.main` | 4.5:1 |

The failure names the pair, both hexes and the measured ratio
(`text.secondary #6B7A95 on #F6F8FB — 4.08:1, needs 4.5:1`), so the fix is a
Figma edit, not an investigation.

**When a Figma change trips it:** retune the *failing* variable in that mode's file
and regenerate. Move lightness first and saturation second — hue is brand identity
and stays put; a tone that must drop 3 to 5 points of lightness still reads as the
same colour, a rotated hue does not. Clear the threshold by a small margin
(≈4.6–5.0:1 for text, ≈3.1–3.6:1 for tones); overshooting darkens the palette as
visibly as failing lightens it. Backgrounds are the last thing to touch — every
pair in that mode is measured against them, so moving one moves eight results.

The thresholds are WCAG AA, not a team preference: they are not negotiable, and a
pull request that edits `TEXT_MINIMUM`, `NON_TEXT_MINIMUM` or the pair list in
`contrastPairs.ts` to make a palette pass is rejected on sight. If a brand colour
genuinely cannot meet its threshold, it is the wrong colour for that role — give
the tone a darker `main` for light mode and keep the bright value for `light`,
where nothing is measured against it.

## What a token pull request must contain

- The changed `web/packages/design-tokens/figma/*.tokens.json` files.
- The regenerated targets: `src/generated/theme-inputs.ts`, `generated/tokens.css`,
  `generated/tokens.json` and `src/Atlas.DesignTokens/Tokens.g.cs`, plus the
  updated `figma/tokens.lock.json`.
- Nothing under `web/packages/core/src/**` or `web/apps/**`. A
  change that needs a `.tsx` edit is not a token change: split it, and review the
  behaviour separately.
- A one-line note of the intent ("Button md padding 16 → 20 for the new label
  metrics") and the **Used by** list for each changed token, copied from the Tokens
  story of the published `storybook` artefact.

A *new* token is the one case where the two sides land together: the designer adds
the variable, the developer consumes it in the component that owns it. Landing the
token first is safe — until something reads it, it changes nothing.

## Run the gate locally

```bash
# web (from web/)
pnpm install --frozen-lockfile
pnpm --filter @atlas/design-tokens build     # after editing figma/
pnpm --filter @atlas/design-tokens check
pnpm --filter @atlas/core tokens:usage:check
pnpm --filter @atlas/core exec vitest run src/a11y   # the contrast gate, three palettes
pnpm build:packages && pnpm build:storybook  # web/packages/core/storybook-static

# tests and the diff a reviewer sees (from the repo root)
deno lint && deno test -A
git diff -- web/packages/design-tokens/figma web/packages/design-tokens/src/generated
```

## The two rules that make it work

**Figma does not generate React components.** The export carries values, not
structure: no component is scaffolded from a frame, no variant is invented by a
naming convention. A component exists because a developer designed its API,
behaviour and accessibility; tokens only configure what it already does.

**Developers do not hard-code design values.** A colour, radius, size or spacing in
a core component reads its token; application code carries no styling at all. The
review line is one command:

```bash
git grep -nP "sx=|from '@mui|style=\{\{" -- web/apps   # → no output
```

When something cannot be said with a token or a prop, the fix is a token or a prop —
never a literal, and never a fork of a core component. See
[architecture-frontend.md](architecture-frontend.md) for the component contract and
`web/packages/design-tokens/README.md` for the cascade and the file format.
