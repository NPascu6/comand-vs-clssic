import { AMBER, bodyFont, bullets, card, codeCard, codeFont, Deck, GREEN, headerFont, INK, LINE, marginX, MUTE, NAVY, slideWidth, titleBlock, WHITE } from "../deck.ts";

const OWNERSHIP = [
  ["Designers own", NAVY, [
    "The 15 palettes, the type ramp, radii and the spacing scale.",
    "Every component's own configuration: button.paddingInlineMd, input.focusBorderColor, dialog.padding — 16 groups.",
    "Changed in Figma, exported, reviewed as a PR. No developer retypes a number.",
  ]],
  ["Developers own", GREEN, [
    "Behaviour, composition, accessibility — and which token a component spends.",
    "The variants, tones and sizes a component supports, and the parts it exposes as slots.",
    "No colour or dimension literal in core: every value comes from a token.",
  ]],
  ["The system owns the mapping", AMBER, [
    "Which token exists, its type, and the visual property it feeds.",
    "That the generated theme matches the export — CI fails on a drift.",
    "token-usage.ts: token → the components it moves, generated from the source.",
  ]],
] as const;

export function designSystemSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Design system", "core = the design system you OWN — MUI behind our API", false);
  codeCard(slide, marginX, 2.0, 6.5, 4.3, [
    { text: "// a slice imports only the stable API — 61 components:", kind: "comment" },
    { text: "import { Stack, Split, Columns, Text,", kind: "keyword" },
    { text: "         Panel, Button, DataGrid } from '@atlas/core';", kind: "keyword" },
    { text: "" },
    { text: "// core/index.ts — the ONLY public entry point:", kind: "comment" },
    { text: "export { Button } from './controls/Button';   // wraps MUI" },
    { text: "export { Stack } from './primitives/Stack';   // ours" },
    { text: "//  no Box · no Grid · no Typography · no sx prop", kind: "comment" },
    { text: "" },
    { text: "// 5 schemes x light | dark | contrast = 15 palettes:", kind: "comment" },
    { text: "<AtlasThemeProvider>", kind: "keyword" },
    { text: "  <SchemeSwitcher /> <ThemeSwitcher />  // restyle all" },
  ], "same props for the slices, MUI underneath");
  const rightX = marginX + 6.5 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 2.05, { edge: NAVY });
  slide.addText("What core owns", { x: rightX + 0.28, y: 2.16, w: rightWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.28, 2.58, rightWidth - 0.55, 1.4, ["61 components + 60 Storybook story files", "Layout, spacing, tone, size — all as props", "The theme: 5 schemes x light / dark / contrast"], { fontSize: 12, gap: 5 });
  card(slide, rightX, 4.25, rightWidth, 2.05, { edge: GREEN });
  slide.addText("What MUI provides", { x: rightX + 0.28, y: 4.41, w: rightWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: GREEN, margin: 0 });
  bullets(slide, rightX + 0.28, 4.83, rightWidth - 0.55, 1.4, ["Accessible primitives + the X DataGrid (community)", "Emotion styling, driven by the theme", "Upgradable — or replaceable — behind the seam"], { fontSize: 12, gap: 5 });
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "Slices import @atlas/core, never @mui — ", options: { bold: true, color: INK } },
    { text: "business code holds no styling, so the implementation can move again.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.05, w: slideWidth - 2 * marginX - 0.6, h: 0.62, fontFace: bodyFont, fontSize: 12.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

export function boundarySlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "The boundary", "Designers own the values — developers own the behaviour", false);
  slide.addText("The design system is the contract between the two, and it is a build step rather than a convention: a token change ships exactly like a code change.", {
    x: marginX, y: 1.68, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 13, italic: true, color: MUTE, margin: 0,
  });
  const columnGap = 0.4, columnWidth = (slideWidth - 2 * marginX - 2 * columnGap) / 3;
  OWNERSHIP.forEach(([heading, edge, points], index) => {
    const columnX = marginX + index * (columnWidth + columnGap);
    card(slide, columnX, 2.2, columnWidth, 3.05, { edge });
    slide.addText(heading, { x: columnX + 0.28, y: 2.36, w: columnWidth - 0.5, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
    bullets(slide, columnX + 0.28, 2.86, columnWidth - 0.55, 2.25, [...points], { fontSize: 11.5, gap: 8 });
  });
  const flowY = 5.55;
  card(slide, marginX, flowY, slideWidth - 2 * marginX, 0.66, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText("Figma  →  export  →  PR (figma/ + generated/)  →  CI: token check · usage check · tests  →  token diff + Storybook artefacts  →  designer + developer approve  →  merge", {
    x: marginX + 0.3, y: flowY, w: slideWidth - 2 * marginX - 0.6, h: 0.66, fontFace: codeFont, fontSize: 10.5, color: "44516B", valign: "middle", margin: 0,
  });
  card(slide, marginX, 6.42, slideWidth - 2 * marginX, 0.62, { fill: NAVY, shadow: true });
  slide.addText([
    { text: "A designer may retune a value, not invent behaviour: ", options: { bold: true, color: GREEN } },
    { text: "a token nobody consumes renders nothing, and the usage map says so. A developer may not invent a value: no colour or dimension literal exists in core.", options: { color: WHITE } },
  ], { x: marginX + 0.3, y: 6.42, w: slideWidth - 2 * marginX - 0.6, h: 0.62, fontFace: bodyFont, fontSize: 12, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}
