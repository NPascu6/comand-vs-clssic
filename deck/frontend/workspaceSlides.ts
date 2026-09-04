import type PptxGenJS from "pptxgenjs";
import { bodyFont, bullets, card, codeCard, Deck, GREEN, headerFont, INK, LINE, marginX, MUTE, NAVY, slideWidth, titleBlock, WHITE } from "../deck.ts";

export function composableUiSlide(deck: Deck): void {
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

export function antiBloatSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Anti-bloat", "OOP-UI bloat → the compositional antidote", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const bad = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", fontSize: 12, align: "left", valign: "middle" } });
  const good = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("Cause of bloat (classic OOP UI)"), head("Compositional / functional antidote")],
    [bad("God components / fat view-controllers"), good("Small panels & slices as values in a registry")],
    [bad("Inheritance trees (BaseWidget → …)"), good("Composition — plain functions / records, no base classes")],
    [bad("Forking a shared component to tweak it"), good("Slots: replace a named part, keep the tokens and the fixes")],
    [bad("Layout hardcoded inside components"), good("Layout & views are DATA the shell renders generically")],
    [bad("Cross-cutting chrome copied per widget"), good("One generic frame: resize · title · remove · i18n, once")],
    [bad("Conditional sprawl (ifs for which view)"), good("Registry lookup — add an entry, not a branch")],
    [bad("State sprawl / prop drilling"), good("Scoped state per slice / panel; data via small hooks")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 2.15, w: slideWidth - 2 * marginX, colW: [5.96, 5.97],
    rowH: [0.46, 0.56, 0.56, 0.56, 0.56, 0.56, 0.56, 0.56], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  slide.addText("Same lesson as the backend: small, named, composable pieces + data-driven wiring. The shell stays tiny while the app grows.", {
    x: marginX, y: 6.6, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 11.5, italic: true, color: MUTE, margin: 0,
  });
  deck.footer(slide, false);
}
