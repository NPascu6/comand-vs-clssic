import type PptxGenJS from "pptxgenjs";
import { AMBER, bodyFont, card, codeFont, Deck, GREEN, headerFont, ICE, INK, LINE, marginX, NAVY, NAVY2, shapes, slideWidth, titleBlock, WHITE } from "../deck.ts";

const FLOW = [
  ["Owned core", "@atlas/core · Figma tokens"],
  ["Vertical slices", "one package / domain"],
  ["Thin shell", "registry composes"],
  ["Data-driven config", "views · theme · i18n"],
  ["Mirrors backend", "command → trace"],
];

export function tradeOffsSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Balanced view", "Honest trade-offs — what this costs", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const cost = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", bold: true, fontSize: 12, align: "left", valign: "middle" } });
  const why = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("The cost"), head("Why it's worth it")],
    [cost("Owning the API over MUI (vs using the kit raw)"), why("You control the API, a11y and theming; every new need goes through core first")],
    [cost("The tokens are the only styling channel"), why("15 palettes for free; a hard-coded colour breaks contrast mode — Storybook shows it")],
    [cost("No sx escape hatch for the slices"), why("Slots and className cover the real cases; the rule can't erode one exception at a time")],
    [cost("core carries the variations, not the caller"), why("Tones, variants, sizes and widths are written once and every slice gets them")],
    [cost("Designers and developers must agree a boundary"), why("It is a build step, not a meeting: CI checks the token map and the diff is the review")],
    [cost("pnpm + monorepo tooling to learn"), why("Standard for serious frontend — workspaces, one install")],
    [cost("MUI (+ Emotion) stays a runtime dependency"), why("One dependency, behind a seam slices never cross — upgraded or swapped in one place")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 2.1, w: slideWidth - 2 * marginX, colW: [5.96, 5.97],
    rowH: [0.44, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  card(slide, marginX, 6.45, slideWidth - 2 * marginX, 0.58, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "When it's overkill:  ", options: { bold: true, color: INK } },
    { text: "for a tiny app, a single Vite app + a UI kit used raw is fine.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.45, w: slideWidth - 2 * marginX - 0.6, h: 0.58, fontFace: bodyFont, fontSize: 12.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

export function blueprintSlide(deck: Deck): void {
  const slide = deck.newSlide(true);
  titleBlock(slide, "The blueprint", "A UI that grows for years — without coupling", true);
  const stepCount = FLOW.length, boxWidth = 2.16, boxGap = (slideWidth - 2 * marginX - stepCount * boxWidth) / (stepCount - 1), boxY = 2.75, boxHeight = 1.15;
  FLOW.forEach((step, index) => {
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
    { text: "Change is contained behind the core API, its Figma tokens, runtime-composed slices and backend config — so new domains, components, schemes and languages all land without a rewrite. It mirrors the backend.", options: { color: ICE } },
  ], { x: marginX, y: 5.65, w: slideWidth - 2 * marginX, h: 0.9, fontFace: bodyFont, fontSize: 14, align: "center", valign: "middle", margin: 0 });
  deck.footer(slide, true);
}

export function recommendationSlide(deck: Deck): void {
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
  slide.addText("A token-driven design system, vertical slices, and data-driven config: a frontend that grows for years and mirrors the backend.", {
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
