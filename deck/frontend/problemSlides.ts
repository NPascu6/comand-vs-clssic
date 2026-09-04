import { AMBER, arrow, bodyFont, bullets, card, codeFont, Deck, GREEN, headerFont, INK, LINE, marginX, MUTE, NAVY, RED, shapes, slideWidth, titleBlock } from "../deck.ts";

export function problemSlide(deck: Deck): void {
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

export function shapeSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "The shape", "A pnpm monorepo — shared core + one package per domain", false);
  slide.addText("Each business domain is a vertical slice: a package owning its UI, data client, and manifest. A thin app shell composes them.", {
    x: marginX, y: 1.72, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const columnY = 2.55, columnHeight = 3.4;
  const sharedX = marginX, sharedWidth = 3.7;
  card(slide, sharedX, columnY, sharedWidth, columnHeight, { edge: NAVY });
  slide.addText("Shared packages", { x: sharedX + 0.25, y: columnY + 0.18, w: sharedWidth - 0.5, h: 0.35, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
  ["@atlas/core — 61 components over MUI", "@atlas/design-tokens — Figma → theme", "@atlas/contracts · i18n · platform"].forEach((label, index) => {
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
  slide.addText("Composes slices at runtime from config.json, renders the nav, hosts the theme / language / data-source switchers. Adding a domain never touches the shell.", { x: shellX + 0.25, y: columnY + 1.12, w: shellWidth - 0.5, h: 1.8, fontFace: bodyFont, fontSize: 12, color: "44516B", valign: "top", margin: 0 });
  arrow(slide, sharedX + sharedWidth + 0.06, columnY + columnHeight / 2, 0.38);
  arrow(slide, slicesX + slicesWidth + 0.06, columnY + columnHeight / 2, 0.38);
  slide.addText("slices depend on the shared packages  →  the app shell composes the slices", { x: marginX, y: columnY + columnHeight + 0.22, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 12.5, italic: true, color: MUTE, align: "center", margin: 0 });
  deck.footer(slide, false);
}
