# Designer proof of concept

One page, three components, one question: **can a designer change how the product looks without a
developer?**

```bash
pnpm -C web dev:poc      # http://localhost:5175
```

The header, the type ramp and the buttons are shown beside the token paths that drive them. The
toggle applies the change a designer has proposed in Figma — the same values as
`web/packages/figma-sync/fixtures/variables.type-refresh.json` — so you can see it before it lands.

Running the sync turns that same change into a versioned, attributed commit:

```bash
node web/packages/figma-sync/scripts/figma-sync.ts --fixture type-refresh --author-handle mara.ilic
```

It validates the export against the theme contract and WCAG AA, bumps the version by the shape of
the change, records who published it, and rewrites only the files whose values moved. CI opens the
pull request from there (`.github/workflows/`, `.azure-pipelines/`).

This app depends on `@atlas/core` and nothing else — no MUI, no CSS, no application code.

## The token studio

"Open the token studio" on the same page edits the four `figma/*.tokens.json` files in the
browser — every token, by its DTCG `$type` — and runs the same engine the sync runs on every
keystroke: the theme is rebuilt and previewed, the diff against what is committed is listed, and
the WCAG gate is checked. Save writes the result as a DTCG export to
`web/packages/figma-sync/exports/studio/`, never into `figma/`, so the release still goes through
the sync and its ledger:

```bash
node web/packages/figma-sync/scripts/figma-sync.ts --export exports/studio --author-handle <you>
```

That is the same path a Figma plugin export takes — and the way to play without a Figma plan that
has the Variables REST API.
