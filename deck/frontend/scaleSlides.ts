import { AMBER, arrow, bodyFont, box, bullets, card, codeCard, Deck, GREEN, headerFont, INK, LINE, marginX, MUTE, NAVY, slideWidth, titleBlock, WHITE } from "../deck.ts";

const CONFIGURABLE = [
  ["Theme", "Five colour schemes × light / dark / high contrast — 15 palettes, plus 16 component-token groups, all Figma variables. Every component reads them, so a switcher restyles the whole app.", NAVY],
  ["Feature surface", "Each slice is its own deployable — the shell composes whatever config.json lists.", GREEN],
  ["Policy & wiring", "Which client backs each slice — Mock or Live — is a toggle, not a code change.", AMBER],
  ["Language", "Translations are served, versioned and audited by the backend — add or edit one as data (next slide).", NAVY],
];

export function dealPipelineSlide(deck: Deck): void {
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
    { text: "// its domain components compose core, never fork it:", kind: "comment" },
    { text: "components/DealCard.tsx   StageColumn.tsx  dealTones.ts", kind: "keyword" },
    { text: "" },
    { text: "// a new reusable element added to the core:", kind: "comment" },
    { text: "import { Stepper } from '@atlas/core';", kind: "keyword" },
    { text: "<Stepper steps={stages} active={deal.stage} />" },
  ], "Stepper · Storybook story · styled by the theme");
  const rightX = marginX + 6.4 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 3.0, rightWidth, 3.4, { edge: GREEN });
  slide.addText("What it cost to add", { x: rightX + 0.3, y: 3.15, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 3.65, rightWidth - 0.6, 2.6, [
    "+1 slice (deal-pipeline) — a board by stage, registered in one line.",
    "+1 reusable core element — a Stepper, with its own Storybook story.",
    "Its cards are slice-local compositions of core; no core source was copied.",
    { text: "UI grows additively: +1 slice / +1 component.", bold: true },
  ], { fontSize: 12.5, gap: 10 });
  deck.footer(slide, false);
}

export function configurableSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Configurable", "Configure by data, not code — own every layer", false);
  const cardWidth = (slideWidth - 2 * marginX - 0.4) / 2, cardHeight = 1.75, columnGap = 0.4, rowGap = 0.35;
  CONFIGURABLE.forEach((item, index) => {
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

export function i18nSlide(deck: Deck): void {
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
    "Components call const translate = useT(); strings are never hardcoded. Only English ships offline.",
    "Versioned: every edit is a new version in an append-only history; rollback is another version.",
    "Configurable + audited: enable/disable locales, set the fallback chain; who · when · what · before · after · reason.",
    { text: "The Translations slice administers it all — catalog, versions, audit, locales — from the same core API.", bold: true },
  ], { fontSize: 12, gap: 8 });
  deck.footer(slide, false);
}
