import { arrow, bodyFont, box, card, Deck, GREEN, INK, LINE, marginX, MUTE, NAVY, slideWidth, titleBlock, WHITE } from "../deck.ts";
import { CELL_BORDERS, CONTRAST, paletteCell, SCHEMES } from "./palettes.ts";

const PIPELINE = [
  ["Figma Variables", "a collection = a scheme"],
  ["figma/*.tokens.json", "17 files, committed"],
  ["build → theme-inputs.ts", "typed, checked in CI"],
  ["createAtlasTheme", "scheme × mode → theme"],
];

export function tokensSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Design tokens", "Two token classes — global semantic and per component", false);
  slide.addText("Colour, spacing, radius and type are reusable everywhere. Each component's own configuration — button padding, input focus border, dialog width — is its own group, so a designer retunes one component without touching React.", {
    x: marginX, y: 1.68, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 13, italic: true, color: MUTE, margin: 0,
  });
  const stepWidth = 2.6, stepGap = (slideWidth - 2 * marginX - PIPELINE.length * stepWidth) / (PIPELINE.length - 1);
  const stepY = 2.12, stepHeight = 0.66;
  PIPELINE.forEach((step, index) => {
    const stepX = marginX + index * (stepWidth + stepGap);
    box(slide, stepX, stepY, stepWidth, stepHeight, step[0], index === PIPELINE.length - 1 ? GREEN : NAVY, WHITE, step[1]);
    if (index < PIPELINE.length - 1) arrow(slide, stepX + stepWidth, stepY + stepHeight / 2, stepGap);
  });
  const labelWidth = 1.55, cellsX = marginX + labelWidth, cellGap = 0.22;
  const cellWidth = (slideWidth - marginX - cellsX - 2 * cellGap) / 3;
  ["Light", "Dark", "High contrast"].forEach((mode, column) => {
    slide.addText(mode.toUpperCase(), {
      x: cellsX + column * (cellWidth + cellGap), y: 3.02, w: cellWidth, h: 0.28,
      fontFace: bodyFont, fontSize: 11, bold: true, color: MUTE, charSpacing: 2, align: "center", margin: 0,
    });
  });
  const rowHeight = 0.54, rowGap = 0.09, firstRowY = 3.36;
  SCHEMES.forEach((scheme, row) => {
    const rowY = firstRowY + row * (rowHeight + rowGap);
    slide.addText(scheme.label, { x: marginX, y: rowY, w: labelWidth - 0.12, h: rowHeight, fontFace: bodyFont, fontSize: 12, bold: true, color: INK, valign: "middle", margin: 0 });
    [scheme.light, scheme.dark, CONTRAST].forEach((palette, column) => {
      paletteCell(slide, cellsX + column * (cellWidth + cellGap), rowY, cellWidth, rowHeight, palette, CELL_BORDERS[column]);
    });
  });
  card(slide, marginX, 6.5, slideWidth - 2 * marginX, 0.6, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "A component colour token stays an alias — ", options: { bold: true, color: INK } },
    { text: "it arrives as the palette path ('primary.main'), never a hex, so one token is right in all fifteen palettes. High contrast is authored once in Shared and inherited by every scheme; a sixth scheme is three Figma files and a rebuild.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.5, w: slideWidth - 2 * marginX - 0.6, h: 0.6, fontFace: bodyFont, fontSize: 12.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}
