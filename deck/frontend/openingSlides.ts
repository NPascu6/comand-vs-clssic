import type PptxGenJS from "pptxgenjs";
import { AMBER, bodyFont, card, Deck, GREEN, headerFont, ICE, INK, marginX, MUTE, NAVY, NAVY2, shapes, slideWidth, titleBlock, WHITE } from "../deck.ts";

const AGENDA_ROWS = [
  ["1", "Own the core", "Why UIs bloat, the monorepo shape, the token-driven design system you own — and the boundary it draws."],
  ["2", "Pluggable composition", "Slices & panels register themselves; views are data; one frame does the chrome."],
  ["3", "Scale & configure", "New domains drop in, config is data, and i18n is a backend capability — versioned and audited."],
];

function agenda(slide: PptxGenJS.Slide): void {
  const cardWidth = slideWidth - 2 * marginX, rowHeight = 0.92, firstRowY = 2.1, rowGap = 0.22;
  AGENDA_ROWS.forEach((row, index) => {
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

export function titleSlide(deck: Deck): void {
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
  slide.addText([
    { text: "React 18 · TypeScript · Vite · MUI 9 behind an owned API", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
    { text: "pnpm workspace · @atlas/core · Figma design tokens · vertical slices · backend-served i18n", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
    { text: "Engineering design review · June 2026", options: { color: "8AA0C6", fontSize: 11.5 } },
  ], { x: marginX, y: 5.1, w: 9, h: 1.1, fontFace: bodyFont, valign: "top", margin: 0, paraSpaceAfter: 4 });
  deck.footer(slide, true);
}

export function agendaSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Agenda", "How this runs", false);
  agenda(slide);
  deck.footer(slide, false);
}
