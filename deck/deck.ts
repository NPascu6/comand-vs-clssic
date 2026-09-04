import PptxGenJS from "pptxgenjs";

// LAYOUT_WIDE is 13.33 × 7.5 in; every position and size in the decks is in inches
export const slideWidth = 13.33;
export const slideHeight = 7.5;
export const marginX = 0.7;

// Semantic roles: green = functional / pass, amber = caution / classic, red = breach / loss
export const NAVY = "0F2143";
export const NAVY2 = "1B3460";
export const ICE = "CFE0F5";
export const WHITE = "FFFFFF";
export const INK = "16223A";
export const MUTE = "6B7A95";
export const LINE = "E3E9F2";
export const GREEN = "1FA97A";
export const AMBER = "E0A33B";
export const RED = "D9534F";
const CODEBG = "0C1A30";
const CODETX = "DCE7FB";
const CODEDIM = "7E93B6";
const CODEKEY = "7FD1B9";

export const headerFont = "Georgia";
export const bodyFont = "Calibri";
export const codeFont = "Consolas";

export const shapes: Readonly<Record<"rectangle" | "roundedRectangle" | "line", PptxGenJS.SHAPE_NAME>> = {
  rectangle: "rect",
  roundedRectangle: "roundRect",
  line: "line",
};

export interface CodeLine {
  text: string;
  kind?: "comment" | "keyword";
}

export type BulletItem = string | { text: string; color?: string; bold?: boolean };

export interface BulletOptions {
  fontSize?: number;
  gap?: number;
}

export interface CardOptions {
  fill?: string;
  edge?: string;
  border?: string;
  shadow?: boolean;
}

export interface DeckOptions {
  title: string;
  footerText: string;
  sections: string[];
}

const makeShadow = (): PptxGenJS.ShadowProps => ({ type: "outer", color: "0B1830", blur: 9, offset: 3, angle: 135, opacity: 0.16 });

export function titleBlock(slide: PptxGenJS.Slide, kicker: string, title: string, dark: boolean): void {
  const accent = dark ? GREEN : NAVY;
  slide.addShape(shapes.rectangle, { x: marginX, y: 0.62, w: 0.16, h: 0.16, fill: { color: accent } });
  slide.addText(kicker.toUpperCase(), {
    x: marginX + 0.28, y: 0.5, w: slideWidth - 2 * marginX - 0.28, h: 0.36, fontFace: bodyFont, fontSize: 12.5, bold: true,
    color: dark ? GREEN : "3C6FB5", charSpacing: 2, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(title, {
    x: marginX, y: 0.92, w: slideWidth - 2 * marginX, h: 0.85, fontFace: headerFont, fontSize: 30, bold: true,
    color: dark ? WHITE : INK, align: "left", valign: "middle", margin: 0,
  });
}

export function card(slide: PptxGenJS.Slide, left: number, top: number, width: number, height: number, options: CardOptions = {}): void {
  const fill = options.fill || WHITE;
  const edge = options.edge || null;
  slide.addShape(shapes.rectangle, {
    x: left, y: top, w: width, h: height, fill: { color: fill },
    line: options.border ? { color: options.border, width: 1 } : { color: LINE, width: 1 },
    shadow: options.shadow === false ? undefined : makeShadow(),
  });
  if (edge) slide.addShape(shapes.rectangle, { x: left, y: top, w: 0.09, h: height, fill: { color: edge } });
}

export function chip(slide: PptxGenJS.Slide, left: number, top: number, width: number, text: string, color: string, textColor?: string): void {
  slide.addShape(shapes.roundedRectangle, { x: left, y: top, w: width, h: 0.34, rectRadius: 0.17, fill: { color } });
  slide.addText(text, { x: left, y: top, w: width, h: 0.34, fontFace: codeFont, fontSize: 10.5, bold: true, color: textColor || WHITE, align: "center", valign: "middle", margin: 0 });
}

export function codeCard(slide: PptxGenJS.Slide, left: number, top: number, width: number, height: number, lines: CodeLine[], label?: string): void {
  slide.addShape(shapes.rectangle, { x: left, y: top, w: width, h: height, fill: { color: CODEBG }, line: { color: "20355C", width: 1 }, shadow: makeShadow() });
  if (label) {
    slide.addText(label, { x: left + 0.18, y: top + 0.12, w: width - 0.36, h: 0.28, fontFace: codeFont, fontSize: 9.5, italic: true, color: CODEDIM, align: "left", margin: 0 });
  }
  const runs: PptxGenJS.TextProps[] = lines.map((line) => ({
    text: line.text,
    options: { breakLine: true, color: line.kind === "comment" ? CODEDIM : line.kind === "keyword" ? CODEKEY : CODETX, italic: line.kind === "comment", bold: line.kind === "keyword" },
  }));
  slide.addText(runs, {
    x: left + 0.18, y: top + (label ? 0.42 : 0.16), w: width - 0.36, h: height - (label ? 0.56 : 0.3),
    fontFace: codeFont, fontSize: 10.5, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.06,
  });
}

export function bullets(slide: PptxGenJS.Slide, left: number, top: number, width: number, height: number, items: BulletItem[], options: BulletOptions = {}): void {
  slide.addText(items.map((item) => ({
    text: typeof item === "string" ? item : item.text,
    options: { bullet: { code: "2022", indent: 14 }, breakLine: true, color: (typeof item === "object" && item.color) || INK,
      bold: typeof item === "object" && item.bold, paraSpaceAfter: options.gap ?? 8, fontSize: options.fontSize || 14 },
  })), { x: left, y: top, w: width, h: height, fontFace: bodyFont, valign: "top", margin: 0 });
}

export function box(slide: PptxGenJS.Slide, left: number, top: number, width: number, height: number, text: string, fill: string, textColor: string, subtitle?: string): void {
  slide.addShape(shapes.roundedRectangle, { x: left, y: top, w: width, h: height, rectRadius: 0.07, fill: { color: fill }, line: { color: LINE, width: 1 }, shadow: makeShadow() });
  slide.addText([
    { text, options: { breakLine: true, bold: true, fontSize: 12.5, color: textColor } },
    ...(subtitle ? [{ text: subtitle, options: { fontSize: 9.5, color: textColor === WHITE ? ICE : MUTE } }] : []),
  ], { x: left + 0.06, y: top, w: width - 0.12, h: height, fontFace: bodyFont, align: "center", valign: "middle", margin: 0 });
}

export function arrow(slide: PptxGenJS.Slide, left: number, top: number, width: number, color?: string): void {
  slide.addShape(shapes.line, { x: left, y: top, w: width, h: 0, line: { color: color || "9DB0CC", width: 2, endArrowType: "triangle" } });
}

export class Deck {
  readonly presentation = new PptxGenJS();
  private readonly footerText: string;
  private readonly sections: string[];
  private pageNumber = 0;

  constructor(options: DeckOptions) {
    this.presentation.layout = "LAYOUT_WIDE";
    this.presentation.author = "Atlas Engineering";
    this.presentation.title = options.title;
    this.footerText = options.footerText;
    this.sections = options.sections;
  }

  newSlide(dark: boolean): PptxGenJS.Slide {
    this.pageNumber += 1;
    const slide = this.presentation.addSlide();
    slide.background = { color: dark ? NAVY : WHITE };
    return slide;
  }

  footer(slide: PptxGenJS.Slide, dark: boolean): void {
    const color = dark ? "6E83A8" : MUTE;
    slide.addText(this.footerText, {
      x: marginX, y: slideHeight - 0.42, w: 8, h: 0.3, fontFace: bodyFont, fontSize: 9, color, align: "left", margin: 0,
    });
    slide.addText(`${this.pageNumber}`, { x: slideWidth - 1.1, y: slideHeight - 0.42, w: 0.4, h: 0.3, fontFace: bodyFont, fontSize: 9, color, align: "right", margin: 0 });
  }

  divider(sectionNumber: number, title: string, activeIndex: number): void {
    const slide = this.newSlide(true);
    slide.addShape(shapes.rectangle, { x: marginX, y: 2.0, w: 0.9, h: 0.16, fill: { color: GREEN } });
    slide.addShape(shapes.rectangle, { x: marginX, y: 2.25, w: 0.42, h: 0.16, fill: { color: AMBER } });
    slide.addText(`SECTION 0${sectionNumber}`, {
      x: marginX, y: 2.62, w: 11, h: 0.4, fontFace: bodyFont, fontSize: 15, bold: true, color: GREEN, charSpacing: 4, margin: 0,
    });
    slide.addText(title, {
      x: marginX, y: 3.05, w: 11.8, h: 1.1, fontFace: headerFont, fontSize: 40, bold: true, color: WHITE, margin: 0,
    });
    slide.addShape(shapes.line, { x: marginX, y: 4.3, w: 5.0, h: 0, line: { color: GREEN, width: 2 } });
    const progressY = 6.35, sectionCount = this.sections.length, gap = 0.3;
    const cellWidth = (slideWidth - 2 * marginX - (sectionCount - 1) * gap) / sectionCount;
    this.sections.forEach((name, index) => {
      const cellX = marginX + index * (cellWidth + gap);
      const active = index === activeIndex;
      slide.addShape(shapes.rectangle, { x: cellX, y: progressY - 0.16, w: cellWidth, h: 0.06, fill: { color: active ? GREEN : "2B3F63" } });
      slide.addText(`${index + 1} · ${name}`, {
        x: cellX, y: progressY, w: cellWidth, h: 0.5, fontFace: bodyFont, fontSize: 11.5, bold: active,
        color: active ? WHITE : "6E83A8", align: "left", valign: "top", margin: 0,
      });
    });
  }

  async write(fileName: string): Promise<void> {
    const written = await this.presentation.writeFile({ fileName });
    console.log("WROTE", written);
  }
}
