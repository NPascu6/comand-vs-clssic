import type PptxGenJS from "pptxgenjs";
import { bodyFont, codeFont, LINE, shapes } from "../deck.ts";

/** background.default · text.primary · primary · success · warning · error — one mode of one scheme. */
export type Palette = [string, string, string, string, string, string];

export interface SchemePalettes {
  label: string;
  light: Palette;
  dark: Palette;
}

// Mirrors web/packages/design-tokens/src/generated/theme-inputs.ts, the committed Figma export.
export const SCHEMES: SchemePalettes[] = [
  { label: "Atlas Navy", light: ["F6F8FB", "16223A", "0F2143", "1C9D71", "BA801D", "D9534F"], dark: ["0B1220", "E6ECF5", "9DBDF5", "3CCB93", "F0B65A", "F0716C"] },
  { label: "Slate", light: ["F8FAFC", "0F172A", "334155", "15803D", "B45309", "B91C1C"], dark: ["0B1120", "E2E8F0", "CBD5E1", "4ADE80", "FBBF24", "F87171"] },
  { label: "Evergreen", light: ["F5F9F6", "0F1F17", "14532D", "15803D", "A16207", "B91C1C"], dark: ["04140C", "E7F2EA", "86EFAC", "4ADE80", "FACC15", "FB7185"] },
  { label: "Indigo", light: ["F7F7FC", "1B1B33", "3730A3", "15803D", "B45309", "BE123C"], dark: ["0B0B1F", "E8E8F7", "A5B4FC", "4ADE80", "FBBF24", "FB7185"] },
  { label: "Ember", light: ["FBF7F4", "2A1810", "9A3412", "15803D", "B45309", "B91C1C"], dark: ["1A0E06", "F7EBE2", "FDBA74", "4ADE80", "FBBF24", "F87171"] },
];

/** Shared.Contrast — authored once, inherited by every scheme. */
export const CONTRAST: Palette = ["FFFFFF", "000000", "000000", "006B3F", "8A5A00", "B00020"];

// A dark palette's divider is translucent white, which PowerPoint cannot express; these are its solid stand-ins.
export const CELL_BORDERS = [LINE, "35435C", "000000"];

export function paletteCell(slide: PptxGenJS.Slide, left: number, top: number, width: number, height: number, palette: Palette, border: string): void {
  const [background, text, ...mains] = palette;
  const swatch = 0.3, swatchGap = 0.12, swatchesX = left + 0.62;
  slide.addShape(shapes.roundedRectangle, { x: left, y: top, w: width, h: height, rectRadius: 0.06, fill: { color: background }, line: { color: border, width: 1 } });
  slide.addText("Aa", { x: left + 0.16, y: top, w: 0.42, h: height, fontFace: bodyFont, fontSize: 12.5, bold: true, color: text, valign: "middle", margin: 0 });
  mains.forEach((color, index) => {
    slide.addShape(shapes.roundedRectangle, {
      x: swatchesX + index * (swatch + swatchGap), y: top + (height - swatch) / 2, w: swatch, h: swatch,
      rectRadius: 0.05, fill: { color }, line: { color: border, width: 0.5 },
    });
  });
  const hexX = swatchesX + mains.length * (swatch + swatchGap);
  slide.addText(`#${mains[0]}`, { x: hexX, y: top, w: left + width - hexX - 0.14, h: height, fontFace: codeFont, fontSize: 9, color: text, align: "right", valign: "middle", margin: 0 });
}
