# `@atlas/design-tokens` — Figma variables → theme inputs

The design system's palettes, fonts, radii, type scale, spacing, the semantic
vocabulary of the domain **and every component's own visual configuration** are
**owned in Figma**. This package turns the Figma Variables export (W3C Design
Tokens JSON) into the typed inputs `createAtlasTheme` reads — and into three
other targets, so a consumer that is neither React nor .NET gets the same values.

```
figma/*.tokens.json  ──►  pnpm --filter @atlas/design-tokens build  ──►  four targets  ──►  every consumer
      (design)                     (transform, no deps)                   (committed)
```

No runtime dependency: the transform is pure TypeScript, the CLI runs on Node
(≥ 23.6, which executes `.ts` directly), and CI checks the committed output
against the export with `deno test`.

## The four targets

| target | file | who reads it |
|---|---|---|
| MUI theme inputs | `src/generated/theme-inputs.ts` | `@atlas/core` — `createAtlasTheme` |
| CSS custom properties | `generated/tokens.css` | any stylesheet, keyed on `[data-theme]` |
| Flat JSON bundle | `generated/tokens.json` | anything else; the API serves it per mode |
| .NET package | `../../../src/Atlas.DesignTokens/Tokens.g.cs` | `Atlas.Api` — server-rendered artefacts |

One transform feeds all four, so none of them can drift from the others.

## Layout

```
figma/
  Atlas.Base.tokens.json      the shape every mode shares: global tokens, the component tokens, the semantic aliases
  Atlas.Light.tokens.json     the light palette + its series
  Atlas.Dark.tokens.json      the dark palette + its series
  Atlas.Contrast.tokens.json  the high-contrast palette + its series
  authors.json                the designers a release may be attributed to
  tokens.lock.json            the token ledger: version, digest, and every release (see @atlas/figma-sync)

src/
  dtcg.ts                     the export format: files → TokenSet, aliases, types
  cascade.ts                  the two-level fallback (mode → base) and reading through it
  manifest.ts                 ThemeInputs and the global token paths — the contract the theme needs
  palette.ts / palettes.ts    PaletteInputs and the paths every mode must carry
  componentTokens.ts          the component token types (button, input, field, header)
  componentPaths.ts           their paths and kinds
  componentValues.ts          reading them, leaving colour aliases as palette paths
  semanticTokens.ts …         the domain vocabulary: status, performance, exposure, asset class, region, series
  contrast.ts                 WCAG ratios and the pairs the theme promises
  overrides.ts                applyOverrides — a deep-partial laid over the shipped tokens
  transform.ts                TokenSet → ThemeInputs (throws TokenError)
  emit*.ts                    ThemeInputs → each of the four targets
  flatten.ts                  the one flattening the CSS, JSON and .NET targets share
  toolkit.ts                  the entry point the build and the sync use — everything except generated output
```

## The cascade

Looking a token up for mode `M` walks two levels, most specific first:

```
Atlas.M  →  Atlas.Base
```

| level | holds | example |
|---|---|---|
| `Atlas.M` | that mode's palette and its series | `Atlas.Dark` → `color.primary.main` `#9DBDF5` |
| `Atlas.Base` | the shape tokens, the component tokens and the semantic aliases | `space.md` `16px` |

The file name's second segment is the mode; the first only groups the export in
Figma. A semantic alias lives in `Base` **once** and resolves per mode, because
it names a palette path rather than a colour.

## The token groups

### Per palette — `Atlas.{Light,Dark,Contrast}`

| group | paths | used for |
|---|---|---|
| `palette` | `mode` | which MUI palette mode this is (`light` \| `dark`) |
| `color` | `primary.{main,light,contrastText}`, `secondary.main`, `success.main`, `warning.main`, `error.main`, `info.main`, `text.{primary,secondary}`, `divider`, `background.{default,paper}` | the MUI palette |
| `border` | `width`, `color` | the outline of surfaces and — when heavier than 1px — inputs and chips |
| `focus` | `width`, `color` | the focus ring; width 0 means MUI's default |
| `series` | `1`–`8` | the categorical scale the domain vocabulary aliases into |
| `button.contained` | `background`, `text`, `hoverBackground`, `hoverText` | contained buttons where the palette needs to override them (contrast) |

### Shared shape — `Atlas.Base`

| group | values | used for |
|---|---|---|
| `font` | `sans`, `mono` | the typography families |
| `radius` | `control` 8, `surface` 12 | buttons and inputs / papers and surfaces |
| `opacity` | `soft` 0.12 | the alpha a tinted surface keeps of its tone |
| `typography` | `button.weight`, `chip.weight`, `overline.{size,weight,letterSpacing,lineHeight}` | the MUI typography options |
| `space` | `xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32 | every gap and padding the primitives spend |
| `layout` | `contentPadding` 24, `contentGap` 24 | the page body's inset and rhythm (`Page`) |
| `component.*` | `button`, `input`, `field`, `header` | one component's own configuration |

### The domain vocabulary

`status.{fund,deal,coInvestment}.*`, `performance.{positive,negative,flat}`,
`exposure.{withinAppetite,approaching,breach}`, `assetClass.*`, `region.*` — each
an alias into the palette or the series, so the meaning is owned in Figma and the
colour still changes with the mode. The .NET package exposes them as
`Tokens.For(mode).Status(…)`, `.Colour(assetClass)`, `.Performance(…)`.

### Colour tokens are references, not copies

```json
"component": { "input": { "focusBorderColor": { "$type": "color", "$value": "{color.primary.main}" } } }
```

emits

```ts
components: { input: { focusBorderColor: 'primary.main', … } }
```

— the **palette path**, not `#0F2143`. This is the one place the transform
deliberately stops resolving an alias, and the reason is the cascade: there is
one `components` object but three palettes. A hex resolved here would be right in
light and wrong in the other two. Core resolves the path against the live palette
at render time (`resolveColorToken`); the CSS, JSON and .NET targets have no theme
at render time, so `flatten.ts` resolves it once per mode for them.

| the token's `$value` | emitted |
|---|---|
| `"{color.primary.main}"`, `$type` `color` | `'primary.main'` — the path, alias unresolved |
| `"#B00020"`, `$type` `color` | `'#B00020'` — a literal colour, normalised as usual |
| `"{radius.control}"`, `$type` `dimension` | `8` — an alias out of any other group resolves as usual |

The emitted path is checked against `PalettePath`, so an alias into a colour the
palette does not have (`{color.primary.dark}`) fails the build with the token's
name instead of reaching a component as an invalid CSS colour.

## Commands

```bash
pnpm --filter @atlas/design-tokens build   # figma/*.tokens.json → the four targets, then tsc → dist/
pnpm --filter @atlas/design-tokens check   # exit 1 if any committed target is stale (what CI asserts)
deno test -A                               # from the repo root: the export ⇔ generated check + unit tests
```

## Governance — a token change ships like a code change

| owned by | what | where it lives |
|---|---|---|
| **Designers** | the visual language: three modes, the type scale, radii, spacing, the domain vocabulary, and every component's own visual configuration | Figma Variables → `figma/*.tokens.json` |
| **Developers** | the React contract: props, variants, tones, sizes, behaviour, accessibility — and which token a component spends | `packages/core/src/**` |
| **The design system** | the mapping and its guarantees: which token exists, what type it has, what it feeds, and that every generated target matches the export | `src/{manifest,componentPaths,transform,emit}.ts`, `core/src/theme/createAtlasTheme.ts`, `core/src/generated/token-usage.ts` |

```
Figma  →  sync  →  PR (figma/ + generated/)  →  CI validation  →  Storybook evidence  →  designer + developer approve  →  merge
```

`@atlas/figma-sync` is what turns an export into that pull request: it validates
the payload, versions it against `tokens.lock.json`, attributes it to a designer
and writes the release. The full flow, and what a token pull request must
contain, is
[docs/design-tokens-governance.md](../../../docs/design-tokens-governance.md).

## Updating the design

1. In Figma, edit the variables.
2. `node web/packages/figma-sync/scripts/figma-sync.ts --author-handle <handle>`
   (or `--fixture <name>` against a recorded payload) — it rewrites only the
   files whose token *values* changed and records the release.
3. `pnpm --filter @atlas/design-tokens build`, then open Storybook.
4. Commit the export **and** the generated targets together; CI refuses a mismatch.

**Adding a global token** is one entry in `Atlas.Base`, one path in `BASE_PATHS`,
one field on `ThemeInputs`, one line each in `transform.ts` and `emit.ts` — then
core reads it from the theme instead of inlining a number.

**Adding a component token** is the same, one level down:

1. `figma/Atlas.Base.tokens.json` — add `component.<group>.<property>` under the
   group's `$type` (`dimension` for a size, `number` for a ratio, `fontWeight`
   for a weight). A colour is `{ "$type": "color", "$value": "{color.…}" }`.
2. `src/componentTokens.ts` — the property on the group's interface
   (`ColorToken` for a colour, `number` otherwise), and its path in
   `COMPONENT_PATHS` (`src/componentPaths.ts`) with its kind. A new group also
   needs its own `…Tokens` interface, an entry on `ComponentTokens`, and a
   re-export from `src/manifest.ts` and `src/index.ts`.
3. `src/componentValues.ts` — one line in `components()`:
   `numberOf('<group>.<prop>')` or `colorOf('<group>.<prop>')`.
4. `src/emitComponents.ts` — one line in `components()`, in the same order.
5. `pnpm --filter @atlas/design-tokens build`, then have the component read it
   through the theme, and regenerate core's usage map.

A component token nobody reads **fails CI**: designers may retune a value, not
invent behaviour, and a token with no consumer is a claim the system cannot keep.
