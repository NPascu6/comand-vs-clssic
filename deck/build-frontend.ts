import type PptxGenJS from "pptxgenjs";
import { AMBER, arrow, bodyFont, box, bullets, card, codeCard, codeFont, Deck, GREEN, headerFont, ICE, INK, LINE, marginX, MUTE, NAVY, NAVY2, RED, shapes, slideWidth, titleBlock, WHITE } from "./deck.ts";

const SECTIONS = ["Own the core", "Pluggable composition", "Scale & configure"];

const deck = new Deck({
  title: "Designing the Atlas frontend",
  footerText: "Atlas · Frontend architecture — owned core + vertical slices",
  sections: SECTIONS,
});

function agenda(slide: PptxGenJS.Slide): void {
  const rows = [
    ["1", "Own the core", "Why UIs bloat, the monorepo shape, and the design system you own."],
    ["2", "Pluggable composition", "Slices & panels register themselves; views are data; one frame does the chrome."],
    ["3", "Scale & configure", "New domains drop in, config is data, and i18n is a backend capability — versioned and audited."],
  ];
  const cardWidth = slideWidth - 2 * marginX, rowHeight = 0.92, firstRowY = 2.1, rowGap = 0.22;
  rows.forEach((row, index) => {
    const rowY = firstRowY + index * (rowHeight + rowGap);
    card(slide, marginX, rowY, cardWidth, rowHeight, { edge: NAVY });
    slide.addShape(shapes.rectangle, { x: marginX + 0.3, y: rowY + (rowHeight - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: NAVY } });
    slide.addText(row[0], { x: marginX + 0.3, y: rowY + (rowHeight - 0.5) / 2, w: 0.5, h: 0.5, fontFace: headerFont, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    slide.addText([
      { text: row[1] + "    ", options: { fontFace: headerFont, fontSize: 18, bold: true, color: INK } },
      { text: row[2], options: { fontFace: bodyFont, fontSize: 13.5, color: MUTE } },
    ], { x: marginX + 1.1, y: rowY, w: cardWidth - 1.4, h: rowHeight, valign: "middle", margin: 0 });
  });
  const askY = firstRowY + 3 * (rowHeight + rowGap) + 0.12;
  card(slide, marginX, askY, cardWidth, 0.66, { fill: NAVY, shadow: true });
  slide.addText([
    { text: "The ask:  ", options: { bold: true, color: GREEN } },
    { text: "build the Atlas UI as owned core + vertical slices.", options: { color: WHITE } },
  ], { x: marginX + 0.3, y: askY, w: cardWidth - 0.6, h: 0.66, fontFace: bodyFont, fontSize: 15, valign: "middle", margin: 0 });
}

{
  const slide = deck.newSlide(true);
  slide.addShape(shapes.rectangle, { x: marginX, y: 1.75, w: 0.9, h: 0.16, fill: { color: GREEN } });
  slide.addShape(shapes.rectangle, { x: marginX, y: 2.0, w: 0.42, h: 0.16, fill: { color: AMBER } });
  slide.addText("Atlas · FRONTEND ARCHITECTURE", {
    x: marginX, y: 2.35, w: 11, h: 0.4, fontFace: bodyFont, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  slide.addText("Designing the Atlas frontend", {
    x: marginX, y: 2.75, w: 11.8, h: 1.1, fontFace: headerFont, fontSize: 50, bold: true, color: WHITE, margin: 0,
  });
  slide.addText("A pluggable, scalable UI — owned core + one vertical slice per domain", {
    x: marginX, y: 3.95, w: 11.5, h: 0.6, fontFace: bodyFont, fontSize: 19, color: ICE, margin: 0,
  });
  slide.addShape(shapes.line, { x: marginX, y: 4.95, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  slide.addText(
    [
      { text: "React 18 · TypeScript · Vite · MUI 9 behind an owned API", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "pnpm workspace · @atlas/core · vertical slices · backend-served i18n", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Engineering design review · June 2026", options: { color: "8AA0C6", fontSize: 11.5 } },
    ],
    { x: marginX, y: 5.1, w: 9, h: 1.1, fontFace: bodyFont, valign: "top", margin: 0, paraSpaceAfter: 4 }
  );
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Agenda", "How this runs", false);
  agenda(slide);
  deck.footer(slide, false);
}

deck.divider(1, "Own the core", 0);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The problem", "UI apps bloat too — the same rot, in the browser", false);
  slide.addText("A single Vite app plus a bought UI kit starts fast — then accretes the familiar weight as domains and teams pile on.", {
    x: marginX, y: 1.72, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const columnWidth = (slideWidth - 2 * marginX - 0.5) / 2;
  card(slide, marginX, 2.35, columnWidth, 4.0, { edge: RED });
  slide.addText("How a UI accretes weight", { x: marginX + 0.3, y: 2.5, w: columnWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 17, bold: true, color: RED, margin: 0 });
  bullets(slide, marginX + 0.3, 3.05, columnWidth - 0.6, 3.2, [
    "God components — one screen owns fetch, state, layout & rules",
    "Deep inheritance (BaseWidget → …) nobody dares touch",
    "Layout hard-coded inside components — no reuse, no config",
    "Prop-drilling and sprawling shared state across the tree",
    "Cross-cutting chrome (title, resize, i18n) copied per widget",
  ], { fontSize: 13, gap: 10 });
  const rightX = marginX + columnWidth + 0.5;
  card(slide, rightX, 2.35, columnWidth, 4.0, { edge: AMBER });
  slide.addText("Why it compounds", { x: rightX + 0.3, y: 2.5, w: columnWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 17, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 3.05, columnWidth - 0.6, 3.2, [
    "A UI kit used raw is a dependency every screen depends on",
    "Every new domain edits the same shell — merge pain",
    "No seam to migrate a component without a big-bang rewrite",
    "Adding a screen means a branch, not an entry in a registry",
    "The 10th domain costs far more than the 1st",
  ], { fontSize: 13, gap: 10 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The shape", "A pnpm monorepo — shared core + one package per domain", false);
  slide.addText("Each business domain is a vertical slice: a package owning its UI, data client, and manifest. A thin app shell composes them.", {
    x: marginX, y: 1.72, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const columnY = 2.55, columnHeight = 3.4;
  const sharedX = marginX, sharedWidth = 3.7;
  card(slide, sharedX, columnY, sharedWidth, columnHeight, { edge: NAVY });
  slide.addText("Shared packages", { x: sharedX + 0.25, y: columnY + 0.18, w: sharedWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
  ["@atlas/core — owned API over MUI", "@atlas/contracts — types + seed", "@atlas/i18n · @atlas/platform"].forEach((label, index) => {
    const rowY = columnY + 0.65 + index * 0.85;
    slide.addShape(shapes.roundedRectangle, { x: sharedX + 0.25, y: rowY, w: sharedWidth - 0.5, h: 0.68, rectRadius: 0.06, fill: { color: "F4F7FB" }, line: { color: LINE, width: 1 } });
    slide.addText(label, { x: sharedX + 0.4, y: rowY, w: sharedWidth - 0.8, h: 0.68, fontFace: codeFont, fontSize: 10.5, color: INK, valign: "middle", margin: 0 });
  });
  const slicesX = sharedX + sharedWidth + 0.5, slicesWidth = 3.9;
  card(slide, slicesX, columnY, slicesWidth, columnHeight, { edge: GREEN });
  slide.addText("Vertical slices", { x: slicesX + 0.25, y: columnY + 0.18, w: slicesWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: GREEN, margin: 0 });
  ["slices/commit-capital · appetite", "slices/deal-pipeline · coinvestment", "slices/workspace · translations"].forEach((label, index) => {
    const rowY = columnY + 0.65 + index * 0.85;
    slide.addShape(shapes.roundedRectangle, { x: slicesX + 0.25, y: rowY, w: slicesWidth - 0.5, h: 0.68, rectRadius: 0.06, fill: { color: "ECF7F1" }, line: { color: "CBE8DC", width: 1 } });
    slide.addText(label, { x: slicesX + 0.4, y: rowY, w: slicesWidth - 0.8, h: 0.68, fontFace: codeFont, fontSize: 10.5, bold: true, color: INK, valign: "middle", margin: 0 });
  });
  const shellX = slicesX + slicesWidth + 0.5, shellWidth = slideWidth - marginX - shellX;
  card(slide, shellX, columnY, shellWidth, columnHeight, { edge: AMBER });
  slide.addText("Shell app", { x: shellX + 0.25, y: columnY + 0.18, w: shellWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
  slide.addText("apps/atlas", { x: shellX + 0.25, y: columnY + 0.62, w: shellWidth - 0.5, h: 0.4, fontFace: codeFont, fontSize: 12, bold: true, color: INK, margin: 0 });
  slide.addText("Registers slices, renders the nav, hosts the theme / language / data-source switchers. Adding a domain is one line in slices.ts.", { x: shellX + 0.25, y: columnY + 1.12, w: shellWidth - 0.5, h: 1.8, fontFace: bodyFont, fontSize: 12, color: "44516B", valign: "top", margin: 0 });
  arrow(slide, sharedX + sharedWidth + 0.06, columnY + columnHeight / 2, 0.38);
  arrow(slide, slicesX + slicesWidth + 0.06, columnY + columnHeight / 2, 0.38);
  slide.addText("slices depend on the shared packages  →  the app shell composes the slices", { x: marginX, y: columnY + columnHeight + 0.22, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 12.5, italic: true, color: MUTE, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Design system", "core = the design system you OWN — MUI behind our API", false);
  codeCard(slide, marginX, 2.0, 6.5, 4.3, [
    { text: "// every slice imports only the stable API:", kind: "comment" },
    { text: "import { Button, DataGrid, Meter } from '@atlas/core';", kind: "keyword" },
    { text: "" },
    { text: "// core/index.ts — the ONLY public entry point:", kind: "comment" },
    { text: "export { Button } from './controls/Button';   // wraps MUI" },
    { text: "export { Box, Stack, Grid } from '@mui/material'; // endorsed" },
    { text: "" },
    { text: "// one theme, three modes — every component reads it:", kind: "comment" },
    { text: "<AtlasThemeProvider>   // light | dark | contrast", kind: "keyword" },
    { text: "  <ThemeSwitcher />    // restyles the whole app" },
  ], "same props for the slices, MUI underneath");
  const rightX = marginX + 6.5 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 2.05, { edge: NAVY });
  slide.addText("What core owns", { x: rightX + 0.28, y: 2.16, w: rightWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.28, 2.58, rightWidth - 0.55, 1.4, ["The component API the slices code against", "The theme: light / dark / high contrast", "DataGrid defaults: compact, paginated, quick filter"], { fontSize: 12, gap: 5 });
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

deck.divider(2, "Pluggable composition", 1);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The slice registry", "The shell knows nothing about a slice", false);
  codeCard(slide, marginX, 2.0, 6.7, 4.3, [
    { text: "// apps/atlas/src/slices.ts", kind: "comment" },
    { text: "import type { SliceManifest } from '@atlas/platform';", kind: "keyword" },
    { text: "import { manifest as commitCapital }" },
    { text: "  from '@atlas/slice-commit-capital';" },
    { text: "import { manifest as appetite }" },
    { text: "  from '@atlas/slice-appetite';" },
    { text: "// …deal-pipeline, coinvestment, workspace, translations" },
    { text: "" },
    { text: "// the registry: add a domain = +1 line", kind: "comment" },
    { text: "export const slices: SliceManifest[] = [", kind: "keyword" },
    { text: "  commitCapital, appetite, dealPipeline," },
    { text: "  coinvestment, workspace, translations," },
    { text: "];" },
  ], "the shell only consumes the manifest");
  const rightX = marginX + 6.7 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 4.3, { edge: GREEN });
  slide.addText("Add a business domain", { x: rightX + 0.3, y: 2.16, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 2.7, rightWidth - 0.6, 3.4, [
    "Build the package — UI, data client, manifest.",
    "Add one import + one entry in slices.ts.",
    "The shell renders nav from the manifest; it never reads a slice's internals.",
    "Order in the array drives nav grouping by domain.",
    { text: "No branch in the shell, no shared file to edit — just a new package.", bold: true },
  ], { fontSize: 13, gap: 11 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Anatomy", "A slice, end to end — it mirrors the backend", false);
  const boxWidth = 2.3, boxHeight = 1.0, labelX = marginX, firstBoxX = marginX + 1.6;
  const gap = (slideWidth - marginX - firstBoxX - 4 * boxWidth) / 3;
  const backendY = 2.65, frontendY = 4.6;
  slide.addText("Backend\n(.NET)", { x: labelX, y: backendY, w: 1.5, h: boxHeight, fontFace: bodyFont, fontSize: 12, bold: true, color: NAVY, valign: "middle", margin: 0 });
  const backendSteps = [["Command", "immutable record"], ["Rules", "named, async"], ["Handler", "validate → execute"], ["Result + Trace", "DecisionTrace"]];
  backendSteps.forEach((step, index) => {
    const boxX = firstBoxX + index * (boxWidth + gap);
    box(slide, boxX, backendY, boxWidth, boxHeight, step[0], index === 3 ? AMBER : NAVY, index === 3 ? NAVY : WHITE, step[1]);
    if (index < 3) arrow(slide, boxX + boxWidth, backendY + boxHeight / 2, gap);
  });
  slide.addText("Frontend\n(React)", { x: labelX, y: frontendY, w: 1.5, h: boxHeight, fontFace: bodyFont, fontSize: 12, bold: true, color: GREEN, valign: "middle", margin: 0 });
  const frontendSteps = [["Form", "command state"], ["Client", "mock | live API"], ["Slice", "owns the use case"], ["Outcome + Trace", "same JSON, rendered"]];
  frontendSteps.forEach((step, index) => {
    const boxX = firstBoxX + index * (boxWidth + gap);
    box(slide, boxX, frontendY, boxWidth, boxHeight, step[0], index === 3 ? AMBER : GREEN, index === 3 ? NAVY : WHITE, step[1]);
    if (index < 3) arrow(slide, boxX + boxWidth, frontendY + boxHeight / 2, gap);
    slide.addShape(shapes.line, { x: boxX + boxWidth / 2, y: backendY + boxHeight, w: 0, h: frontendY - (backendY + boxHeight), line: { color: "C9D4E5", width: 1.2, dashType: "dash" } });
  });
  slide.addText("The DecisionTrace shape is the contract — the same JSON renders in the UI whether it came from the mock or the live API.", { x: marginX, y: 6.0, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 13, italic: true, color: MUTE, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Composable UI", "Composable, resizable views — panels are values", false);
  codeCard(slide, marginX, 2.05, 6.7, 4.4, [
    { text: "// panels.tsx — each panel is a pluggable VALUE", kind: "comment" },
    { text: "export const panels: PanelDef[] = [", kind: "keyword" },
    { text: "  { id:'headroom',  render: () => <Stat … /> }," },
    { text: "  { id:'appetite',  render: () => <Meter … /> }," },
    { text: "  { id:'hierarchy', render: () => <…/> }," },
    { text: "  { id:'deals',     render: () => <…/> }," },
    { text: "];" },
    { text: "" },
    { text: "// a VIEW is DATA — the layout a user customizes:", kind: "comment" },
    { text: "const layout = [" },
    { text: "  { panelId:'headroom', w:4 }, { panelId:'appetite', w:8 }," },
    { text: "  { panelId:'hierarchy', w:6 }, { panelId:'deals', w:6 }," },
    { text: "];" },
  ], "panel registry + view-as-data");
  const rightX = marginX + 6.7 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.05, rightWidth, 4.4, { edge: GREEN });
  slide.addText("Pluggable · resizable · customizable", { x: rightX + 0.3, y: 2.2, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 2.72, rightWidth - 0.6, 3.5, [
    "Pluggable — register a panel; the shell never changes.",
    "Resizable — drag the edge or ± the width; size is just data.",
    "Customizable — add/remove panels per user; the view persists as config.",
    "One generic PanelFrame does title + resize + remove for ALL panels — chrome written once.",
    { text: "No god component, no per-widget boilerplate, no layout library.", bold: true },
  ], { fontSize: 12.5, gap: 10 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Anti-bloat", "OOP-UI bloat → the compositional antidote", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const bad = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", fontSize: 12, align: "left", valign: "middle" } });
  const good = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("Cause of bloat (classic OOP UI)"), head("Compositional / functional antidote")],
    [bad("God components / fat view-controllers"), good("Small panels & slices as values in a registry")],
    [bad("Inheritance trees (BaseWidget → …)"), good("Composition — plain functions / records, no base classes")],
    [bad("Layout hardcoded inside components"), good("Layout & views are DATA the shell renders generically")],
    [bad("Cross-cutting chrome copied per widget"), good("One generic frame: resize · title · remove · i18n, once")],
    [bad("Conditional sprawl (ifs for which view)"), good("Registry lookup — add an entry, not a branch")],
    [bad("State sprawl / prop drilling"), good("Scoped state per slice / panel; data via small hooks")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 2.15, w: slideWidth - 2 * marginX, colW: [5.96, 5.97],
    rowH: [0.5, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  slide.addText("Same lesson as the backend: small, named, composable pieces + data-driven wiring. The shell stays tiny while the app grows.", {
    x: marginX, y: 6.55, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 11.5, italic: true, color: MUTE, margin: 0,
  });
  deck.footer(slide, false);
}

deck.divider(3, "Scale & configure", 2);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Scales the same way", "New functionality drops in — the Deal Pipeline", false);
  const stages = ["Pipeline", "Investable", "Closed"];
  const stageWidth = 2.2, stageGap = 0.5, stageY = 1.98, stageHeight = 0.7;
  stages.forEach((stage, index) => {
    const stageX = marginX + index * (stageWidth + stageGap);
    box(slide, stageX, stageY, stageWidth, stageHeight, stage, index === 2 ? "5B6B85" : NAVY, WHITE);
    if (index < 2) arrow(slide, stageX + stageWidth, stageY + stageHeight / 2, stageGap);
  });
  slide.addText("a board by stage · + a new reusable Stepper in core", { x: marginX + 3 * (stageWidth + stageGap), y: stageY, w: 3.7, h: stageHeight, fontFace: bodyFont, fontSize: 11, italic: true, color: MUTE, valign: "middle", margin: 0 });
  codeCard(slide, marginX, 3.0, 6.4, 3.4, [
    { text: "// a new slice — board by stage:", kind: "comment" },
    { text: "slices/deal-pipeline  → +1 manifest, +1 line" },
    { text: "" },
    { text: "// a new reusable element added to the core:", kind: "comment" },
    { text: "import { Stepper } from '@atlas/core';", kind: "keyword" },
    { text: "<Stepper steps={stages} active={deal.stage} />" },
    { text: "" },
    { text: "// the UI grows additively:", kind: "comment" },
    { text: "//   +1 slice  /  +1 component", kind: "comment" },
  ], "Stepper · Storybook story · styled by the theme");
  const rightX = marginX + 6.4 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 3.0, rightWidth, 3.4, { edge: GREEN });
  slide.addText("What it cost to add", { x: rightX + 0.3, y: 3.15, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 3.65, rightWidth - 0.6, 2.6, [
    "+1 slice (deal-pipeline) — a board by stage, registered in one line.",
    "+1 reusable core element — a Stepper, with its own Storybook story.",
    "Both read the one theme; no shell change, no new dependency.",
    { text: "UI grows additively: +1 slice / +1 component.", bold: true },
  ], { fontSize: 12.5, gap: 10 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Configurable", "Configure by data, not code — own every layer", false);
  const items = [
    ["Theme", "One theme, three modes — light / dark / high contrast. Every component reads it, so the switcher restyles the whole app.", NAVY],
    ["Feature surface", "The slice registry — add or remove a business domain by editing one array.", GREEN],
    ["Policy & wiring", "Which client backs each slice — Mock or Live — is a toggle, not a code change.", AMBER],
    ["Language", "Translations are served, versioned and audited by the backend — add or edit one as data (next slide).", NAVY],
  ];
  const cardWidth = (slideWidth - 2 * marginX - 0.4) / 2, cardHeight = 1.75, columnGap = 0.4, rowGap = 0.35;
  items.forEach((item, index) => {
    const column = index % 2, row = Math.floor(index / 2);
    const cardX = marginX + column * (cardWidth + columnGap), cardY = 2.05 + row * (cardHeight + rowGap);
    card(slide, cardX, cardY, cardWidth, cardHeight, { edge: item[2] });
    slide.addText(item[0], { x: cardX + 0.3, y: cardY + 0.22, w: cardWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
    slide.addText(item[1], { x: cardX + 0.3, y: cardY + 0.72, w: cardWidth - 0.55, h: cardHeight - 0.9, fontFace: bodyFont, fontSize: 13, color: "44516B", valign: "top", margin: 0 });
  });
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "Every knob is one we own — ", options: { bold: true, color: INK } },
    { text: "no package lock-in: no Redux · react-query · axios · clsx; MUI sits behind an API we own.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.05, w: slideWidth - 2 * marginX - 0.6, h: 0.62, fontFace: bodyFont, fontSize: 12.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Configurable", "Backend-served i18n — versioned, audited, zero FE change", false);
  codeCard(slide, marginX, 2.05, 6.6, 4.4, [
    { text: "// read — the app and the LocaleSwitcher", kind: "comment" },
    { text: "GET  /api/i18n/locales           enabled, default first", kind: "keyword" },
    { text: "GET  /api/i18n/{code}            merged over its fallback chain" },
    { text: "GET  /api/i18n/{code}/versions   history, newest first" },
    { text: "" },
    { text: "// write — every call mints a version + one audit line", kind: "comment" },
    { text: "PUT  /api/i18n/{code}/entries/{key}    If-Match: \"N\"", kind: "keyword" },
    { text: "DEL  /api/i18n/{code}/entries/{key}" },
    { text: "POST /api/i18n/{code}/rollback         restore = a NEW version" },
    { text: "PUT  /api/i18n/config                  enable · disable · fallback" },
    { text: "GET  /api/i18n/audit        who · when · what · before · after" },
    { text: "" },
    { text: "// storage: JSON on disk — no database, no packages", kind: "comment" },
    { text: "i18n/de.json  _history/de/3.json  _audit.jsonl  _config.json", kind: "comment" },
  ], "the backend is the source of truth");
  const rightX = marginX + 6.6 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.05, rightWidth, 4.4, { edge: GREEN });
  slide.addText("The FE renders keys; the backend owns them", { x: rightX + 0.3, y: 2.2, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 2.72, rightWidth - 0.6, 3.5, [
    "@atlas/i18n fetches the locale list + catalog; the LocaleSwitcher lists whatever the backend offers.",
    "Components call useT() / t(\"key\"); strings are never hardcoded. Only English ships offline.",
    "Versioned: every edit is a new version in an append-only history; rollback is another version.",
    "Configurable + audited: enable/disable locales, set the fallback chain; who · when · what · before · after · reason.",
    { text: "The Translations slice administers it all — catalog, versions, audit, locales — from the same core API.", bold: true },
  ], { fontSize: 12, gap: 8 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Balanced view", "Honest trade-offs — what this costs", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const cost = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", bold: true, fontSize: 12, align: "left", valign: "middle" } });
  const why = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("The cost"), head("Why it's worth it")],
    [cost("Owning the API over MUI (vs using the kit raw)"), why("You control the API, a11y and theming; every new need goes through core first")],
    [cost("The theme is the only styling channel"), why("Three modes for free; a hard-coded colour breaks contrast mode — Storybook shows it")],
    [cost("pnpm + monorepo tooling to learn"), why("Standard for serious frontend — workspaces, one install")],
    [cost("MUI (+ Emotion) stays a runtime dependency"), why("One dependency, behind a seam slices never cross — upgraded or swapped in one place")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 2.2, w: slideWidth - 2 * marginX, colW: [5.96, 5.97],
    rowH: [0.55, 0.85, 0.85, 0.85, 0.85], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  card(slide, marginX, 6.35, slideWidth - 2 * marginX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "When it's overkill:  ", options: { bold: true, color: INK } },
    { text: "for a tiny app, a single Vite app + a UI kit used raw is fine.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.35, w: slideWidth - 2 * marginX - 0.6, h: 0.62, fontFace: bodyFont, fontSize: 12.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(true);
  titleBlock(slide, "The blueprint", "A UI that grows for years — without coupling", true);
  const flow = [
    ["Owned core", "@atlas/core · one theme"],
    ["Vertical slices", "one package / domain"],
    ["Thin shell", "registry composes"],
    ["Data-driven config", "views · theme · i18n"],
    ["Mirrors backend", "command → trace"],
  ];
  const stepCount = flow.length, boxWidth = 2.16, boxGap = (slideWidth - 2 * marginX - stepCount * boxWidth) / (stepCount - 1), boxY = 2.75, boxHeight = 1.15;
  flow.forEach((step, index) => {
    const boxX = marginX + index * (boxWidth + boxGap);
    slide.addShape(shapes.roundedRectangle, { x: boxX, y: boxY, w: boxWidth, h: boxHeight, rectRadius: 0.07, fill: { color: index === 0 ? GREEN : NAVY2 }, line: { color: "27406E", width: 1 } });
    slide.addText([
      { text: step[0], options: { breakLine: true, bold: true, fontSize: 13, color: WHITE } },
      { text: step[1], options: { fontSize: 9, color: index === 0 ? "E6FFF5" : ICE } },
    ], { x: boxX + 0.06, y: boxY, w: boxWidth - 0.12, h: boxHeight, fontFace: bodyFont, align: "center", valign: "middle", margin: 0 });
    if (index < stepCount - 1) slide.addShape(shapes.line, { x: boxX + boxWidth, y: boxY + boxHeight / 2, w: boxGap, h: 0, line: { color: "6E83A8", width: 2, endArrowType: "triangle" } });
  });
  const badges = ["Configurable", "Composable", "Ownable", "Scalable"];
  const badgeWidth = 2.6, badgeGap = (slideWidth - 2 * marginX - 4 * badgeWidth) / 3, badgeY = 4.55;
  badges.forEach((badge, index) => {
    const badgeX = marginX + index * (badgeWidth + badgeGap);
    slide.addShape(shapes.roundedRectangle, { x: badgeX, y: badgeY, w: badgeWidth, h: 0.72, rectRadius: 0.36, fill: { color: NAVY2 }, line: { color: GREEN, width: 1.2 } });
    slide.addText(badge, { x: badgeX, y: badgeY, w: badgeWidth, h: 0.72, fontFace: headerFont, fontSize: 15, bold: true, color: GREEN, align: "center", valign: "middle", margin: 0 });
  });
  slide.addText([
    { text: "Owned core + vertical slices + data-driven config. ", options: { bold: true, color: WHITE } },
    { text: "Change is contained behind the core API, its theme, the slice registry and backend config — so new domains, components, modes and languages all land without a rewrite. It mirrors the backend.", options: { color: ICE } },
  ], { x: marginX, y: 5.65, w: slideWidth - 2 * marginX, h: 0.9, fontFace: bodyFont, fontSize: 14, align: "center", valign: "middle", margin: 0 });
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(true);
  slide.addShape(shapes.rectangle, { x: marginX, y: 1.7, w: 0.9, h: 0.16, fill: { color: GREEN } });
  slide.addShape(shapes.rectangle, { x: marginX, y: 1.95, w: 0.42, h: 0.16, fill: { color: AMBER } });
  slide.addText("RECOMMENDATION", {
    x: marginX, y: 2.3, w: 11, h: 0.4, fontFace: bodyFont, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  slide.addText("Build the Atlas UI as an owned core + one slice per domain.", {
    x: marginX, y: 2.75, w: 11.9, h: 1.5, fontFace: headerFont, fontSize: 33, bold: true, color: WHITE, margin: 0,
  });
  slide.addShape(shapes.line, { x: marginX, y: 4.55, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  slide.addText("An owned design system, vertical slices, and data-driven config: a frontend that grows for years and mirrors the backend.", {
    x: marginX, y: 4.75, w: 11.5, h: 0.8, fontFace: bodyFont, fontSize: 15, color: ICE, valign: "top", margin: 0,
  });
  card(slide, marginX, 5.75, slideWidth - 2 * marginX, 1.0, { fill: NAVY2, shadow: true, border: "27406E" });
  slide.addText([
    { text: "Run it:   ", options: { bold: true, color: GREEN, fontFace: bodyFont, fontSize: 13 } },
    { text: "cd web && pnpm dev", options: { fontFace: codeFont, color: WHITE, fontSize: 13 } },
    { text: "      Storybook:   ", options: { bold: true, color: GREEN, fontFace: bodyFont, fontSize: 13 } },
    { text: "pnpm -C web --filter @atlas/core storybook", options: { fontFace: codeFont, color: WHITE, fontSize: 13 } },
  ], { x: marginX + 0.35, y: 5.75, w: slideWidth - 2 * marginX - 0.7, h: 1.0, fontFace: bodyFont, valign: "middle", margin: 0 });
  deck.footer(slide, true);
}

await deck.write("Atlas-Frontend.pptx");
