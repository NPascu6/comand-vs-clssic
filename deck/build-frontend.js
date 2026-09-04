// Builds "Atlas-Frontend.pptx" — a ~18-slide standalone FRONTEND-architecture deck:
// an owned design system (@atlas/core) + one vertical slice per business domain.
// Run: node deck/build-frontend.js   (from repo root, with pptxgenjs installed in deck/)
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Atlas Engineering";
pres.title = "Designing the Atlas frontend";

const W = 13.33, H = 7.5, MX = 0.7;

// ---- Palette (content-informed: trading desk / private capital) -------------
const NAVY = "0F2143";   // dominant dark
const NAVY2 = "1B3460";  // panel on dark
const ICE = "CFE0F5";    // soft light on dark
const WHITE = "FFFFFF";
const INK = "16223A";    // body on light
const MUTE = "6B7A95";   // captions
const LINE = "E3E9F2";   // hairline / card border
const GREEN = "1FA97A";  // functional / pass
const AMBER = "E0A33B";  // caution / classic
const RED = "D9534F";    // breach / loss
const CODEBG = "0C1A30"; // code card
const CODETX = "DCE7FB"; // code text
const CODEDIM = "7E93B6"; // code comment
const CODEKEY = "7FD1B9"; // code keyword/accent

const HF = "Georgia";    // header font
const BF = "Calibri";    // body font
const CF = "Consolas";   // code font

const mkShadow = () => ({ type: "outer", color: "0B1830", blur: 9, offset: 3, angle: 135, opacity: 0.16 });
let PAGE = 0;

// ---- helpers ----------------------------------------------------------------
function footer(slide, dark) {
  const c = dark ? "6E83A8" : MUTE;
  slide.addText("Atlas · Frontend architecture — owned core + vertical slices", {
    x: MX, y: H - 0.42, w: 8, h: 0.3, fontFace: BF, fontSize: 9, color: c, align: "left", margin: 0,
  });
  slide.addText(`${PAGE}`, { x: W - 1.1, y: H - 0.42, w: 0.4, h: 0.3, fontFace: BF, fontSize: 9, color: c, align: "right", margin: 0 });
}

function titleBlock(slide, kicker, title, dark) {
  const accent = dark ? GREEN : NAVY;
  // motif: small accent square to the left of the kicker
  slide.addShape(pres.shapes.RECTANGLE, { x: MX, y: 0.62, w: 0.16, h: 0.16, fill: { color: accent } });
  slide.addText(kicker.toUpperCase(), {
    x: MX + 0.28, y: 0.5, w: W - 2 * MX - 0.28, h: 0.36, fontFace: BF, fontSize: 12.5, bold: true,
    color: dark ? GREEN : "3C6FB5", charSpacing: 2, align: "left", valign: "middle", margin: 0,
  });
  slide.addText(title, {
    x: MX, y: 0.92, w: W - 2 * MX, h: 0.85, fontFace: HF, fontSize: 30, bold: true,
    color: dark ? WHITE : INK, align: "left", valign: "middle", margin: 0,
  });
}

function newSlide(dark) {
  PAGE += 1;
  const s = pres.addSlide();
  s.background = { color: dark ? NAVY : WHITE };
  return s;
}

// card with a thick single-side (left) colored edge — the repeated motif
function card(slide, x, y, w, h, opts = {}) {
  const fill = opts.fill || WHITE;
  const edge = opts.edge || null;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: fill },
    line: opts.border ? { color: opts.border, width: 1 } : { color: LINE, width: 1 },
    shadow: opts.shadow === false ? undefined : mkShadow(),
  });
  if (edge) slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.09, h, fill: { color: edge } });
}

function chip(slide, x, y, w, text, color, txtColor) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color } });
  slide.addText(text, { x, y, w, h: 0.34, fontFace: CF, fontSize: 10.5, bold: true, color: txtColor || WHITE, align: "center", valign: "middle", margin: 0 });
}

// dark code card; lines = [{t, k}] where k in 'c'(comment) 'k'(keyword) undefined(code)
function codeCard(slide, x, y, w, h, lines, label) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: CODEBG }, line: { color: "20355C", width: 1 }, shadow: mkShadow() });
  if (label) {
    slide.addText(label, { x: x + 0.18, y: y + 0.12, w: w - 0.36, h: 0.28, fontFace: CF, fontSize: 9.5, italic: true, color: CODEDIM, align: "left", margin: 0 });
  }
  const runs = lines.map((ln, i) => ({
    text: ln.t,
    options: { breakLine: true, color: ln.k === "c" ? CODEDIM : ln.k === "k" ? CODEKEY : CODETX, italic: ln.k === "c", bold: ln.k === "k" },
  }));
  slide.addText(runs, {
    x: x + 0.18, y: y + (label ? 0.42 : 0.16), w: w - 0.36, h: h - (label ? 0.56 : 0.3),
    fontFace: CF, fontSize: 10.5, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.06,
  });
}

function bullets(slide, x, y, w, h, items, opts = {}) {
  slide.addText(items.map((it, i) => ({
    text: typeof it === "string" ? it : it.t,
    options: { bullet: { code: "2022", indent: 14 }, breakLine: true, color: (typeof it === "object" && it.c) || INK,
      bold: typeof it === "object" && it.b, paraSpaceAfter: opts.gap ?? 8, fontSize: opts.fs || 14 },
  })), { x, y, w, h, fontFace: BF, valign: "top", margin: 0 });
}

// small labeled box for diagrams
function box(slide, x, y, w, h, text, fill, txt, sub) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.07, fill: { color: fill }, line: { color: LINE, width: 1 }, shadow: mkShadow() });
  slide.addText([
    { text: text, options: { breakLine: true, bold: true, fontSize: 12.5, color: txt } },
    ...(sub ? [{ text: sub, options: { fontSize: 9.5, color: txt === WHITE ? ICE : MUTE } }] : []),
  ], { x: x + 0.06, y, w: w - 0.12, h, fontFace: BF, align: "center", valign: "middle", margin: 0 });
}

function arrow(slide, x, y, w, color) {
  slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color: color || "9DB0CC", width: 2, endArrowType: "triangle" } });
}

// =============================================================================
// NEW HELPER 1 — agenda(): the three sections of the talk (light)
// =============================================================================
const SECTIONS = ["Own the core", "Pluggable composition", "Scale & configure"];

function agenda(s) {
  const rows = [
    ["1", "Own the core", "Why UIs bloat, the monorepo shape, and the design system you own."],
    ["2", "Pluggable composition", "Slices & panels register themselves; views are data; one frame does the chrome."],
    ["3", "Scale & configure", "New domains drop in, config is data, and i18n comes from the backend."],
  ];
  const cw = W - 2 * MX, rh = 0.92, y0 = 2.1, gy = 0.22;
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + gy);
    card(s, MX, y, cw, rh, { edge: NAVY });
    // number chip — small navy square with the digit
    s.addShape(pres.shapes.RECTANGLE, { x: MX + 0.3, y: y + (rh - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: NAVY } });
    s.addText(r[0], { x: MX + 0.3, y: y + (rh - 0.5) / 2, w: 0.5, h: 0.5, fontFace: HF, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    // section name (HF bold) + gloss (BF mute) on one line
    s.addText([
      { text: r[1] + "    ", options: { fontFace: HF, fontSize: 18, bold: true, color: INK } },
      { text: r[2], options: { fontFace: BF, fontSize: 13.5, color: MUTE } },
    ], { x: MX + 1.1, y: y, w: cw - 1.4, h: rh, valign: "middle", margin: 0 });
  });
  // closing "the ask" line
  const yA = y0 + 3 * (rh + gy) + 0.12;
  card(s, MX, yA, cw, 0.66, { fill: NAVY, shadow: true });
  s.addText([
    { text: "The ask:  ", options: { bold: true, color: GREEN } },
    { text: "build the Atlas UI as owned core + vertical slices.", options: { color: WHITE } },
  ], { x: MX + 0.3, y: yA, w: cw - 0.6, h: 0.66, fontFace: BF, fontSize: 15, valign: "middle", margin: 0 });
}

// =============================================================================
// NEW HELPER 2 — divider(num, title, activeIndex): dark section divider
// =============================================================================
function divider(num, title, activeIndex) {
  const s = newSlide(true);
  // motif accents: stacked squares top-left (echo the title slide)
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 2.0, w: 0.9, h: 0.16, fill: { color: GREEN } });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 2.25, w: 0.42, h: 0.16, fill: { color: AMBER } });
  // kicker
  s.addText(`SECTION 0${num}`, {
    x: MX, y: 2.62, w: 11, h: 0.4, fontFace: BF, fontSize: 15, bold: true, color: GREEN, charSpacing: 4, margin: 0,
  });
  // big serif title
  s.addText(title, {
    x: MX, y: 3.05, w: 11.8, h: 1.1, fontFace: HF, fontSize: 40, bold: true, color: WHITE, margin: 0,
  });
  // thin green accent rule
  s.addShape(pres.shapes.LINE, { x: MX, y: 4.3, w: 5.0, h: 0, line: { color: GREEN, width: 2 } });
  // bottom progress row of the section names
  const py = 6.35, n = SECTIONS.length, gap = 0.3;
  const cw = (W - 2 * MX - (n - 1) * gap) / n;
  SECTIONS.forEach((name, i) => {
    const x = MX + i * (cw + gap);
    const active = i === activeIndex;
    s.addShape(pres.shapes.RECTANGLE, { x, y: py - 0.16, w: cw, h: 0.06, fill: { color: active ? GREEN : "2B3F63" } });
    s.addText(`${i + 1} · ${name}`, {
      x, y: py, w: cw, h: 0.5, fontFace: BF, fontSize: 11.5, bold: active,
      color: active ? WHITE : "6E83A8", align: "left", valign: "top", margin: 0,
    });
  });
}

// =============================================================================
// SLIDE 1 — Title (dark)
// =============================================================================
{
  const s = newSlide(true);
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.75, w: 0.9, h: 0.16, fill: { color: GREEN } });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 2.0, w: 0.42, h: 0.16, fill: { color: AMBER } });
  s.addText("Atlas · FRONTEND ARCHITECTURE", {
    x: MX, y: 2.35, w: 11, h: 0.4, fontFace: BF, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  s.addText("Designing the Atlas frontend", {
    x: MX, y: 2.75, w: 11.8, h: 1.1, fontFace: HF, fontSize: 50, bold: true, color: WHITE, margin: 0,
  });
  s.addText("A pluggable, scalable UI — owned core + one vertical slice per domain", {
    x: MX, y: 3.95, w: 11.5, h: 0.6, fontFace: BF, fontSize: 19, color: ICE, margin: 0,
  });
  s.addShape(pres.shapes.LINE, { x: MX, y: 4.95, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  s.addText(
    [
      { text: "React 18 · TypeScript · Vite · Tailwind v3", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "pnpm workspace · @atlas/core · vertical slices · backend-served i18n", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Engineering design review · June 2026", options: { color: "8AA0C6", fontSize: 11.5 } },
    ],
    { x: MX, y: 5.1, w: 9, h: 1.1, fontFace: BF, valign: "top", margin: 0, paraSpaceAfter: 4 }
  );
  footer(s, true);
}

// =============================================================================
// SLIDE 2 — Agenda (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Agenda", "How this runs", false);
  agenda(s);
  footer(s, false);
}

// =============================================================================
// SLIDE 3 — DIVIDER 01 · Foundation
// =============================================================================
divider(1, "Own the core", 0);

// =============================================================================
// SLIDE 4 — UI apps bloat too (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The problem", "UI apps bloat too — the same rot, in the browser", false);
  s.addText("A single Vite app plus a bought UI kit starts fast — then accretes the familiar weight as domains and teams pile on.", {
    x: MX, y: 1.72, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const colW = (W - 2 * MX - 0.5) / 2;
  card(s, MX, 2.35, colW, 4.0, { edge: RED });
  s.addText("How a UI accretes weight", { x: MX + 0.3, y: 2.5, w: colW - 0.55, h: 0.4, fontFace: HF, fontSize: 17, bold: true, color: RED, margin: 0 });
  bullets(s, MX + 0.3, 3.05, colW - 0.6, 3.2, [
    "God components — one screen owns fetch, state, layout & rules",
    "Deep inheritance (BaseWidget → …) nobody dares touch",
    "Layout hard-coded inside components — no reuse, no config",
    "Prop-drilling and sprawling shared state across the tree",
    "Cross-cutting chrome (title, resize, i18n) copied per widget",
  ], { fs: 13, gap: 10 });
  const x2 = MX + colW + 0.5;
  card(s, x2, 2.35, colW, 4.0, { edge: AMBER });
  s.addText("Why it compounds", { x: x2 + 0.3, y: 2.5, w: colW - 0.55, h: 0.4, fontFace: HF, fontSize: 17, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.3, 3.05, colW - 0.6, 3.2, [
    "A bought UI kit is a dependency you don't fully control",
    "Every new domain edits the same shell — merge pain",
    "No seam to migrate a component without a big-bang rewrite",
    "Adding a screen means a branch, not an entry in a registry",
    "The 10th domain costs far more than the 1st",
  ], { fs: 13, gap: 10 });
  footer(s, false);
}

// =============================================================================
// SLIDE 5 — The shape: a pnpm monorepo (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The shape", "A pnpm monorepo — shared core + one package per domain", false);
  s.addText("Each business domain is a vertical slice: a package owning its UI, data client, and manifest. A thin app shell composes them.", {
    x: MX, y: 1.72, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const colY = 2.55, colH = 3.4;
  // shared
  const c1x = MX, c1w = 3.7;
  card(s, c1x, colY, c1w, colH, { edge: NAVY });
  s.addText("Shared packages", { x: c1x + 0.25, y: colY + 0.18, w: c1w - 0.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: INK, margin: 0 });
  ["@atlas/core — design system", "@atlas/contracts — types + seed", "@atlas/i18n — backend-served"].forEach((t, i) => {
    const yy = colY + 0.65 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: c1x + 0.25, y: yy, w: c1w - 0.5, h: 0.68, rectRadius: 0.06, fill: { color: "F4F7FB" }, line: { color: LINE, width: 1 } });
    s.addText(t, { x: c1x + 0.4, y: yy, w: c1w - 0.8, h: 0.68, fontFace: CF, fontSize: 10.5, color: INK, valign: "middle", margin: 0 });
  });
  // slices
  const c2x = c1x + c1w + 0.5, c2w = 3.9;
  card(s, c2x, colY, c2w, colH, { edge: GREEN });
  s.addText("Vertical slices", { x: c2x + 0.25, y: colY + 0.18, w: c2w - 0.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: GREEN, margin: 0 });
  ["slices/commit-capital", "slices/coinvestment · appetite", "slices/workspace · deal-pipeline"].forEach((t, i) => {
    const yy = colY + 0.65 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: c2x + 0.25, y: yy, w: c2w - 0.5, h: 0.68, rectRadius: 0.06, fill: { color: "ECF7F1" }, line: { color: "CBE8DC", width: 1 } });
    s.addText(t, { x: c2x + 0.4, y: yy, w: c2w - 0.8, h: 0.68, fontFace: CF, fontSize: 10.5, bold: true, color: INK, valign: "middle", margin: 0 });
  });
  // app
  const c3x = c2x + c2w + 0.5, c3w = W - MX - c3x;
  card(s, c3x, colY, c3w, colH, { edge: AMBER });
  s.addText("Shell app", { x: c3x + 0.25, y: colY + 0.18, w: c3w - 0.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: INK, margin: 0 });
  s.addText("apps/atlas", { x: c3x + 0.25, y: colY + 0.62, w: c3w - 0.5, h: 0.4, fontFace: CF, fontSize: 12, bold: true, color: INK, margin: 0 });
  s.addText("Registers slices, renders the nav, toggles Mock vs. Live data. Adding a domain is one line in slices.ts.", { x: c3x + 0.25, y: colY + 1.12, w: c3w - 0.5, h: 1.8, fontFace: BF, fontSize: 12, color: "44516B", valign: "top", margin: 0 });
  arrow(s, c1x + c1w + 0.06, colY + colH / 2, 0.38);
  arrow(s, c2x + c2w + 0.06, colY + colH / 2, 0.38);
  s.addText("slices depend on the shared packages  →  the app shell composes the slices", { x: MX, y: colY + colH + 0.22, w: W - 2 * MX, h: 0.4, fontFace: BF, fontSize: 12.5, italic: true, color: MUTE, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 6 — core: MUI -> Tailwind decoupling (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Design system", "core = the design system you OWN — MUI → Tailwind", false);
  codeCard(s, MX, 2.0, 6.5, 4.3, [
    { t: "// every slice imports only the stable API:", k: "c" },
    { t: "import { Button, Meter } from '@atlas/core';", k: "k" },
    { t: "" },
    { t: "// core/index.ts — migrate underneath it:", k: "c" },
    { t: "export * from './components/Button'; // Tailwind", k: "" },
    { t: "//      was: export * from './legacy'  (MUI)", k: "c" },
    { t: "" },
    { t: "// @atlas/core/legacy keeps the MUI originals", k: "c" },
    { t: "// importable for a 1:1 before/after compare.", k: "c" },
  ], "same props, swappable implementation");
  const x2 = MX + 6.5 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.0, w2, 2.05, { edge: AMBER });
  s.addText("Before — MUI", { x: x2 + 0.28, y: 2.16, w: w2 - 0.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.28, 2.58, w2 - 0.55, 1.4, ["Heavy custom styling layered on MUI", "A dependency we don't fully control", "sx / emotion overrides everywhere"], { fs: 12, gap: 5 });
  card(s, x2, 4.25, w2, 2.05, { edge: GREEN });
  s.addText("After — Tailwind (owned)", { x: x2 + 0.28, y: 4.41, w: w2 - 0.5, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: GREEN, margin: 0 });
  bullets(s, x2 + 0.28, 4.83, w2 - 0.55, 1.4, ["Tokens + preset owned by core", "No runtime UI dependency", "Migrated component-by-component"], { fs: 12, gap: 5 });
  card(s, MX, 6.05, W - 2 * MX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  s.addText([
    { text: "Slices import @atlas/core, never MUI — ", options: { bold: true, color: INK } },
    { text: "the migration is contained behind the API.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.05, w: W - 2 * MX - 0.6, h: 0.62, fontFace: BF, fontSize: 12.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 7 — DIVIDER 02 · Composition
// =============================================================================
divider(2, "Pluggable composition", 1);

// =============================================================================
// SLIDE 8 — The slice registry (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The slice registry", "The shell knows nothing about a slice", false);
  codeCard(s, MX, 2.0, 6.7, 4.3, [
    { t: "// apps/atlas/src/slices.ts", k: "c" },
    { t: "import type { SliceManifest } from '@atlas/platform';", k: "k" },
    { t: "import { manifest as commitCapital }" },
    { t: "  from '@atlas/slice-commit-capital';" },
    { t: "import { manifest as appetite }" },
    { t: "  from '@atlas/slice-appetite';" },
    { t: "// …deal-pipeline, coinvestment, workspace" },
    { t: "" },
    { t: "// the registry: add a domain = +1 line", k: "c" },
    { t: "export const slices: SliceManifest[] = [", k: "k" },
    { t: "  commitCapital, appetite, dealPipeline," },
    { t: "  coinvestment, workspace,", k: "" },
    { t: "];" },
  ], "the shell only consumes the manifest");
  const x2 = MX + 6.7 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.0, w2, 4.3, { edge: GREEN });
  s.addText("Add a business domain", { x: x2 + 0.3, y: 2.16, w: w2 - 0.55, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.3, 2.7, w2 - 0.6, 3.4, [
    "Build the package — UI, data client, manifest.",
    "Add one import + one entry in slices.ts.",
    "The shell renders nav from the manifest; it never reads a slice's internals.",
    "Order in the array drives nav grouping by domain.",
    { t: "No branch in the shell, no shared file to edit — just a new package.", b: true },
  ], { fs: 13, gap: 11 });
  footer(s, false);
}

// =============================================================================
// SLIDE 9 — A slice, end to end (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Anatomy", "A slice, end to end — it mirrors the backend", false);
  const bw = 2.3, bh = 1.0, lx = MX, bx0 = MX + 1.6;
  const gap = (W - MX - bx0 - 4 * bw) / 3;
  const yBE = 2.65, yFE = 4.6;
  s.addText("Backend\n(.NET)", { x: lx, y: yBE, w: 1.5, h: bh, fontFace: BF, fontSize: 12, bold: true, color: NAVY, valign: "middle", margin: 0 });
  const be = [["Command", "immutable record"], ["Rules", "named, async"], ["Handler", "validate → execute"], ["Result + Trace", "DecisionTrace"]];
  be.forEach((b, i) => {
    const x = bx0 + i * (bw + gap);
    box(s, x, yBE, bw, bh, b[0], i === 3 ? AMBER : NAVY, i === 3 ? NAVY : WHITE, b[1]);
    if (i < 3) arrow(s, x + bw, yBE + bh / 2, gap);
  });
  s.addText("Frontend\n(React)", { x: lx, y: yFE, w: 1.5, h: bh, fontFace: BF, fontSize: 12, bold: true, color: GREEN, valign: "middle", margin: 0 });
  const fe = [["Form", "command state"], ["Client", "mock | live API"], ["Slice", "owns the use case"], ["Outcome + Trace", "same JSON, rendered"]];
  fe.forEach((b, i) => {
    const x = bx0 + i * (bw + gap);
    box(s, x, yFE, bw, bh, b[0], i === 3 ? AMBER : GREEN, i === 3 ? NAVY : WHITE, b[1]);
    if (i < 3) arrow(s, x + bw, yFE + bh / 2, gap);
    // vertical mapping connector
    s.addShape(pres.shapes.LINE, { x: x + bw / 2, y: yBE + bh, w: 0, h: yFE - (yBE + bh), line: { color: "C9D4E5", width: 1.2, dashType: "dash" } });
  });
  s.addText("The DecisionTrace shape is the contract — the same JSON renders in the UI whether it came from the mock or the live API.", { x: MX, y: 6.0, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 13, italic: true, color: MUTE, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 10 — Composable, resizable views (Workspace) (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Composable UI", "Composable, resizable views — panels are values", false);
  codeCard(s, MX, 2.05, 6.7, 4.4, [
    { t: "// panels.tsx — each panel is a pluggable VALUE", k: "c" },
    { t: "export const panels: PanelDef[] = [", k: "k" },
    { t: "  { id:'headroom',  render: () => <Stat … /> }," },
    { t: "  { id:'appetite',  render: () => <Meter … /> }," },
    { t: "  { id:'hierarchy', render: () => <…/> }," },
    { t: "  { id:'deals',     render: () => <…/> }," },
    { t: "];" },
    { t: "" },
    { t: "// a VIEW is DATA — the layout a user customizes:", k: "c" },
    { t: "const layout = [" },
    { t: "  { panelId:'headroom', w:4 }, { panelId:'appetite', w:8 }," },
    { t: "  { panelId:'hierarchy', w:6 }, { panelId:'deals', w:6 }," },
    { t: "];" },
  ], "panel registry + view-as-data");
  const x2 = MX + 6.7 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.05, w2, 4.4, { edge: GREEN });
  s.addText("Pluggable · resizable · customizable", { x: x2 + 0.3, y: 2.2, w: w2 - 0.55, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.3, 2.72, w2 - 0.6, 3.5, [
    "Pluggable — register a panel; the shell never changes.",
    "Resizable — drag the edge or ± the width; size is just data.",
    "Customizable — add/remove panels per user; the view persists as config.",
    "One generic PanelFrame does title + resize + remove for ALL panels — chrome written once.",
    { t: "No god component, no per-widget boilerplate, no layout library.", b: true },
  ], { fs: 12.5, gap: 10 });
  footer(s, false);
}

// =============================================================================
// SLIDE 11 — OOP-UI bloat → the compositional antidote (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Anti-bloat", "OOP-UI bloat → the compositional antidote", false);
  const head = (txt) => ({ text: txt, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const bad = (txt) => ({ text: txt, options: { color: "9A3B36", fontSize: 12, align: "left", valign: "middle" } });
  const good = (txt) => ({ text: txt, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("Cause of bloat (classic OOP UI)"), head("Compositional / functional antidote")],
    [bad("God components / fat view-controllers"), good("Small panels & slices as values in a registry")],
    [bad("Inheritance trees (BaseWidget → …)"), good("Composition — plain functions / records, no base classes")],
    [bad("Layout hardcoded inside components"), good("Layout & views are DATA the shell renders generically")],
    [bad("Cross-cutting chrome copied per widget"), good("One generic frame: resize · title · remove · i18n, once")],
    [bad("Conditional sprawl (ifs for which view)"), good("Registry lookup — add an entry, not a branch")],
    [bad("State sprawl / prop drilling"), good("Scoped state per slice / panel; data via small hooks")],
  ];
  s.addTable(rows, {
    x: MX, y: 2.15, w: W - 2 * MX, colW: [5.96, 5.97],
    rowH: [0.5, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  s.addText("Same lesson as the backend: small, named, composable pieces + data-driven wiring. The shell stays tiny while the app grows.", {
    x: MX, y: 6.55, w: W - 2 * MX, h: 0.4, fontFace: BF, fontSize: 11.5, italic: true, color: MUTE, margin: 0,
  });
  footer(s, false);
}

// =============================================================================
// SLIDE 12 — DIVIDER 03 · Scale & config
// =============================================================================
divider(3, "Scale & configure", 2);

// =============================================================================
// SLIDE 13 — New functionality drops in (Deal Pipeline + Stepper) (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Scales the same way", "New functionality drops in — the Deal Pipeline", false);
  const stages = ["Pipeline", "Investable", "Closed"];
  const sbw = 2.2, sgap = 0.5, sy = 1.98, sbh = 0.7;
  stages.forEach((st, i) => {
    const x = MX + i * (sbw + sgap);
    box(s, x, sy, sbw, sbh, st, i === 2 ? "5B6B85" : NAVY, WHITE);
    if (i < 2) arrow(s, x + sbw, sy + sbh / 2, sgap);
  });
  s.addText("a board by stage · + a new reusable Stepper in core", { x: MX + 3 * (sbw + sgap), y: sy, w: 3.7, h: sbh, fontFace: BF, fontSize: 11, italic: true, color: MUTE, valign: "middle", margin: 0 });
  codeCard(s, MX, 3.0, 6.4, 3.4, [
    { t: "// a new slice — board by stage:", k: "c" },
    { t: "slices/deal-pipeline  → +1 manifest, +1 line", k: "" },
    { t: "" },
    { t: "// a new reusable element added to the core:", k: "c" },
    { t: "import { Stepper } from '@atlas/core';", k: "k" },
    { t: "<Stepper steps={stages} active={deal.stage} />", k: "" },
    { t: "" },
    { t: "// the UI grows additively:", k: "c" },
    { t: "//   +1 slice  /  +1 component", k: "c" },
  ], "Stepper · Storybook story + design tokens");
  const x2 = MX + 6.4 + 0.4, w2 = W - MX - x2;
  card(s, x2, 3.0, w2, 3.4, { edge: GREEN });
  s.addText("What it cost to add", { x: x2 + 0.3, y: 3.15, w: w2 - 0.55, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.3, 3.65, w2 - 0.6, 2.6, [
    "+1 slice (deal-pipeline) — a board by stage, registered in one line.",
    "+1 reusable core element — a Stepper, with its own Storybook story.",
    "Both reuse the owned tokens; no shell change, no new dependency.",
    { t: "UI grows additively: +1 slice / +1 component.", b: true },
  ], { fs: 12.5, gap: 10 });
  footer(s, false);
}

// =============================================================================
// SLIDE 14 — Configure by data, not code (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Configurable", "Configure by data, not code — own every layer", false);
  const items = [
    ["Theme & tokens", "Owned Tailwind preset (one file) — rebrand without touching a component.", NAVY],
    ["Feature surface", "The slice registry — add or remove a business domain by editing one array.", GREEN],
    ["Policy & wiring", "Which client backs each slice — Mock or Live — is a toggle, not a code change.", AMBER],
    ["Language", "Translations are served by the backend — add one as data (next slide).", NAVY],
  ];
  const cw = (W - 2 * MX - 0.4) / 2, chh = 1.75, gx = 0.4, gy = 0.35;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = MX + col * (cw + gx), yy = 2.05 + row * (chh + gy);
    card(s, x, yy, cw, chh, { edge: it[2] });
    s.addText(it[0], { x: x + 0.3, y: yy + 0.22, w: cw - 0.55, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: INK, margin: 0 });
    s.addText(it[1], { x: x + 0.3, y: yy + 0.72, w: cw - 0.55, h: chh - 0.9, fontFace: BF, fontSize: 13, color: "44516B", valign: "top", margin: 0 });
  });
  card(s, MX, 6.05, W - 2 * MX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  s.addText([
    { text: "Every knob is one we own — ", options: { bold: true, color: INK } },
    { text: "no package lock-in: no Redux · react-query · axios · clsx · UI kit.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.05, w: W - 2 * MX - 0.6, h: 0.62, fontFace: BF, fontSize: 12.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 15 — Backend-served i18n (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Configurable", "Backend-served i18n — add a language with zero FE change", false);
  codeCard(s, MX, 2.05, 6.6, 4.4, [
    { t: "// GET /api/i18n/locales  -> [{code,name}, …]", k: "c" },
    { t: "// GET /api/i18n/{code}   -> {code,name,entries}", k: "c" },
    { t: "//   (missing keys fall back to en)", k: "c" },
    { t: "" },
    { t: "// drop a JSON on the backend = a new language", k: "c" },
    { t: "{" },
    { t: '  "name": "Deutsch",' },
    { t: '  "entries": {' },
    { t: '    "nav.commitCapital": "Kapital zusagen",' },
    { t: '    "commit.title": "Kapital zusagen",' },
    { t: '    "hier.headroom": "Spielraum"' },
    { t: "  }" },
    { t: "}" },
  ], "the backend is the source of truth");
  const x2 = MX + 6.6 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.05, w2, 4.4, { edge: GREEN });
  s.addText("The FE just renders keys", { x: x2 + 0.3, y: 2.2, w: w2 - 0.55, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.3, 2.72, w2 - 0.6, 3.5, [
    "@atlas/i18n fetches the locale list + catalog from the backend.",
    "The LocaleSwitcher lists whatever the backend offers — no language list in the FE.",
    "Components call useT() / t(\"key\"); strings are never hardcoded.",
    "Ships only English as an offline fallback.",
    { t: "Drop a new locale JSON on the backend → picked up live — no rebuild, zero FE change.", b: true },
  ], { fs: 12.5, gap: 9 });
  footer(s, false);
}

// =============================================================================
// SLIDE 16 — Honest trade-offs (frontend) (light)
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Balanced view", "Honest trade-offs — what this costs", false);
  const head = (txt) => ({ text: txt, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12.5, align: "left", valign: "middle" } });
  const cost = (txt) => ({ text: txt, options: { color: "9A3B36", bold: true, fontSize: 12, align: "left", valign: "middle" } });
  const why = (txt) => ({ text: txt, options: { color: "1A7A57", fontSize: 12, align: "left", valign: "middle" } });
  const rows = [
    [head("The cost"), head("Why it's worth it")],
    [cost("Owning the design system (vs buying a UI kit)"), why("You control a11y + theming, with no lock-in to a vendor")],
    [cost("The MUI → Tailwind migration is real work"), why("But incremental, component-by-component, behind the API")],
    [cost("pnpm + monorepo tooling to learn"), why("Standard for serious frontend — workspaces, one install")],
    [cost("Tailwind is a build dependency"), why("Utility CSS, owned tokens — no runtime UI dependency")],
  ];
  s.addTable(rows, {
    x: MX, y: 2.2, w: W - 2 * MX, colW: [5.96, 5.97],
    rowH: [0.55, 0.85, 0.85, 0.85, 0.85], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  card(s, MX, 6.35, W - 2 * MX, 0.62, { fill: "F4F7FB", shadow: false, border: LINE });
  s.addText([
    { text: "When it's overkill:  ", options: { bold: true, color: INK } },
    { text: "for a tiny app, a single Vite app + a UI kit is fine.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.35, w: W - 2 * MX - 0.6, h: 0.62, fontFace: BF, fontSize: 12.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 17 — The blueprint (dark)
// =============================================================================
{
  const s = newSlide(true);
  titleBlock(s, "The blueprint", "A UI that grows for years — without coupling", true);
  const flow = [
    ["Owned core", "@atlas/core · tokens"],
    ["Vertical slices", "one package / domain"],
    ["Thin shell", "registry composes"],
    ["Data-driven config", "views · tokens · i18n"],
    ["Mirrors backend", "command → trace"],
  ];
  const n = flow.length, fbw = 2.16, fgap = (W - 2 * MX - n * fbw) / (n - 1), fy = 2.75, fbh = 1.15;
  flow.forEach((f, i) => {
    const x = MX + i * (fbw + fgap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: fy, w: fbw, h: fbh, rectRadius: 0.07, fill: { color: i === 0 ? GREEN : NAVY2 }, line: { color: "27406E", width: 1 } });
    s.addText([
      { text: f[0], options: { breakLine: true, bold: true, fontSize: 13, color: WHITE } },
      { text: f[1], options: { fontSize: 9, color: i === 0 ? "E6FFF5" : ICE } },
    ], { x: x + 0.06, y: fy, w: fbw - 0.12, h: fbh, fontFace: BF, align: "center", valign: "middle", margin: 0 });
    if (i < n - 1) s.addShape(pres.shapes.LINE, { x: x + fbw, y: fy + fbh / 2, w: fgap, h: 0, line: { color: "6E83A8", width: 2, endArrowType: "triangle" } });
  });
  const badges = ["Configurable", "Composable", "Ownable", "Scalable"];
  const jbw = 2.6, jgap = (W - 2 * MX - 4 * jbw) / 3, by = 4.55;
  badges.forEach((b, i) => {
    const x = MX + i * (jbw + jgap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: by, w: jbw, h: 0.72, rectRadius: 0.36, fill: { color: NAVY2 }, line: { color: GREEN, width: 1.2 } });
    s.addText(b, { x, y: by, w: jbw, h: 0.72, fontFace: HF, fontSize: 15, bold: true, color: GREEN, align: "center", valign: "middle", margin: 0 });
  });
  s.addText([
    { text: "Owned core + vertical slices + data-driven config. ", options: { bold: true, color: WHITE } },
    { text: "Change is contained behind the core API, the slice registry, tokens and backend config — so new domains, components and languages all land without a rewrite. It mirrors the backend.", options: { color: ICE } },
  ], { x: MX, y: 5.65, w: W - 2 * MX, h: 0.9, fontFace: BF, fontSize: 14, align: "center", valign: "middle", margin: 0 });
  footer(s, true);
}

// =============================================================================
// SLIDE 18 — Recommendation / close (dark)
// =============================================================================
{
  const s = newSlide(true);
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.7, w: 0.9, h: 0.16, fill: { color: GREEN } });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.95, w: 0.42, h: 0.16, fill: { color: AMBER } });
  s.addText("RECOMMENDATION", {
    x: MX, y: 2.3, w: 11, h: 0.4, fontFace: BF, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  s.addText("Build the Atlas UI as an owned core + one slice per domain.", {
    x: MX, y: 2.75, w: 11.9, h: 1.5, fontFace: HF, fontSize: 33, bold: true, color: WHITE, margin: 0,
  });
  s.addShape(pres.shapes.LINE, { x: MX, y: 4.55, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  s.addText("An owned design system, vertical slices, and data-driven config: a frontend that grows for years and mirrors the backend.", {
    x: MX, y: 4.75, w: 11.5, h: 0.8, fontFace: BF, fontSize: 15, color: ICE, valign: "top", margin: 0,
  });
  // "Run it" panel
  card(s, MX, 5.75, W - 2 * MX, 1.0, { fill: NAVY2, shadow: true, border: "27406E" });
  s.addText([
    { text: "Run it:   ", options: { bold: true, color: GREEN, fontFace: BF, fontSize: 13 } },
    { text: "cd web && pnpm dev", options: { fontFace: CF, color: WHITE, fontSize: 13 } },
    { text: "      Storybook:   ", options: { bold: true, color: GREEN, fontFace: BF, fontSize: 13 } },
    { text: "pnpm -C web --filter @atlas/core storybook", options: { fontFace: CF, color: WHITE, fontSize: 13 } },
  ], { x: MX + 0.35, y: 5.75, w: W - 2 * MX - 0.7, h: 1.0, fontFace: BF, valign: "middle", margin: 0 });
  footer(s, true);
}

pres.writeFile({ fileName: "Atlas-Frontend.pptx" }).then((f)=>console.log("WROTE",f)).catch((e)=>{console.error(e);process.exit(1);});
