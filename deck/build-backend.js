// Builds "Atlas-Backend.pptx" — the backend design-review deck (32 slides), with an
// agenda and section dividers. Self-contained.
// Run: node deck/build-backend.js   (from repo root, with pptxgenjs installed in deck/)
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Atlas Engineering";
pres.title = "Designing Atlas Validation — Lean Cut";

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
  slide.addText("Atlas · Functional commands over classic validation chains", {
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
// NEW HELPER 1 — agenda(): the five sections of the hour (light)
// =============================================================================
const SECTIONS = ["The problem", "The classic stack", "The functional core", "Pluggable & scalable", "Proof & trade-offs"];

function agenda(s) {
  const rows = [
    ["1", "The problem", "Downstream of upstreams that change; the async hinge; built for 5+ years."],
    ["2", "The classic stack", "Three familiar styles + the N-tier cake — and why they stop scaling."],
    ["3", "The functional core", "Command → rules → validator → handler: a small owned core."],
    ["4", "Pluggable & scalable", "Ports & adapters, the one-line upstream swap, a 2nd feature on the same core."],
    ["5", "Proof & trade-offs", "The numbers, the right tool per job, operability, honest costs."],
  ];
  const cw = W - 2 * MX, rh = 0.62, y0 = 1.8, gy = 0.1;
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + gy);
    card(s, MX, y, cw, rh, { edge: NAVY });
    // number chip — small navy square with the digit
    s.addShape(pres.shapes.RECTANGLE, { x: MX + 0.26, y: y + (rh - 0.44) / 2, w: 0.44, h: 0.44, fill: { color: NAVY } });
    s.addText(r[0], { x: MX + 0.26, y: y + (rh - 0.44) / 2, w: 0.44, h: 0.44, fontFace: HF, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    // section name (HF bold) + gloss (BF mute) on one line
    s.addText([
      { text: r[1] + "    ", options: { fontFace: HF, fontSize: 16, bold: true, color: INK } },
      { text: r[2], options: { fontFace: BF, fontSize: 13, color: MUTE } },
    ], { x: MX + 1.0, y: y, w: cw - 1.3, h: rh, valign: "middle", margin: 0 });
  });
  // closing "the ask" line
  const yA = y0 + 5 * (rh + gy) + 0.06;
  card(s, MX, yA, cw, 0.58, { fill: NAVY, shadow: true });
  s.addText([
    { text: "The ask:  ", options: { bold: true, color: GREEN } },
    { text: "build Atlas on functional commands.", options: { color: WHITE } },
  ], { x: MX + 0.3, y: yA, w: cw - 0.6, h: 0.58, fontFace: BF, fontSize: 15, valign: "middle", margin: 0 });
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
  // bottom progress row of the five section names
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
// SLIDE 1 — Title (dark)  [F1]
// =============================================================================
{
  const s = newSlide(true);
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.75, w: 0.9, h: 0.16, fill: { color: GREEN } });
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 2.0, w: 0.42, h: 0.16, fill: { color: AMBER } });
  s.addText("Atlas · BACKEND ARCHITECTURE", {
    x: MX, y: 2.35, w: 11, h: 0.4, fontFace: BF, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  s.addText("Designing Atlas Validation", {
    x: MX, y: 2.75, w: 11.8, h: 1.1, fontFace: HF, fontSize: 50, bold: true, color: WHITE, margin: 0,
  });
  s.addText("Building a pluggable, scalable system — functional commands & async validation", {
    x: MX, y: 3.95, w: 11.5, h: 0.6, fontFace: BF, fontSize: 19, color: ICE, margin: 0,
  });
  s.addShape(pres.shapes.LINE, { x: MX, y: 4.95, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  s.addText(
    [
      { text: "Private equity · private credit · liquid ETFs", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Multi-region · illiquid + liquid · downstream of upstream", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Engineering design review · June 2026", options: { color: "8AA0C6", fontSize: 11.5 } },
    ],
    { x: MX, y: 5.1, w: 9, h: 1.1, fontFace: BF, valign: "top", margin: 0, paraSpaceAfter: 4 }
  );
  footer(s, true);
}

// =============================================================================
// SLIDE 2 — Agenda (light)  [new agenda()]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Agenda", "How this hour runs", false);
  agenda(s);
  footer(s, false);
}

// =============================================================================
// SLIDE 3 — DIVIDER 01 · The problem
// =============================================================================
divider(1, "The problem", 0);

// =============================================================================
// SLIDE 4 — What Atlas must do + why structure matters (light)  [F2]+[F3]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The system & the stakes", "What Atlas must do — and why structure is not a detail", false);
  s.addText("One application to construct and govern funds across the full liquidity spectrum — and keep every decision auditable.", {
    x: MX, y: 1.72, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  // left: Atlas scope chips (condensed from F2's six cards → compact rows)
  const cx = MX, cw = 5.7;
  card(s, cx, 2.35, cw, 4.0, { edge: NAVY });
  s.addText("What Atlas has to do", { x: cx + 0.3, y: 2.5, w: cw - 0.55, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: INK, margin: 0 });
  const scope = [
    ["Span both worlds", "PE & private credit alongside liquid ETFs.", NAVY],
    ["Across regions", "NA, EMEA, APAC, LATAM — each its own appetite.", NAVY],
    ["Construct & govern", "Build books, enforce headroom, appetite, deal-state.", GREEN],
    ["Downstream of upstream", "Owns no source data; composes upstream answers.", AMBER],
  ];
  scope.forEach((it, i) => {
    const yy = 3.0 + i * 0.82;
    s.addShape(pres.shapes.RECTANGLE, { x: cx + 0.3, y: yy, w: 0.07, h: 0.66, fill: { color: it[2] } });
    s.addText([
      { text: it[0] + "  ", options: { bold: true, fontSize: 13.5, color: INK } },
      { text: it[1], options: { fontSize: 12, color: "44516B" } },
    ], { x: cx + 0.5, y: yy, w: cw - 0.8, h: 0.66, fontFace: BF, valign: "middle", margin: 0 });
  });
  // right: the stakes (F3 stat cards → trimmed bullets)
  const x2 = cx + cw + 0.5, w2 = W - MX - x2;
  card(s, x2, 2.35, w2, 4.0, { edge: GREEN });
  s.addText("Why code structure decides it", { x: x2 + 0.3, y: 2.5, w: w2 - 0.55, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: GREEN, margin: 0 });
  bullets(s, x2 + 0.3, 3.0, w2 - 0.6, 2.2, [
    { t: "Traceability is first-class — answer not just “pass/fail” but “why, against what.”" },
    { t: "Validation is mostly async — rules read upstream exposure, appetite, deal & fund state." },
    { t: "The rule set only grows — new asset classes, regions and policies arrive continuously." },
  ], { fs: 13, gap: 11 });
  s.addShape(pres.shapes.LINE, { x: x2 + 0.3, y: 5.35, w: w2 - 0.6, h: 0, line: { color: LINE, width: 1 } });
  s.addText([
    { text: "The risk we design against:  ", options: { bold: true, color: INK } },
    { text: "scattered async logic, rules that can’t be tested alone, and no record of why a commitment was accepted or rejected — the “Frankenstein” Atlas cannot afford.", options: { color: "44516B" } },
  ], { x: x2 + 0.3, y: 5.5, w: w2 - 0.6, h: 0.8, fontFace: BF, fontSize: 12, valign: "top", margin: 0 });
  footer(s, false);
}


// =============================================================================
// SLIDE 6 — The hinge: validation is async (dark)  [F6]
// =============================================================================
{
  const s = newSlide(true);
  titleBlock(s, "The hinge", "Atlas validation is async and business-heavy", true);
  s.addText("Take one operation — commit capital to a co-investment. Five of its six rules must read upstream state. That single fact decides the architecture.", {
    x: MX, y: 1.7, w: W - 2 * MX, h: 0.55, fontFace: BF, fontSize: 14.5, color: ICE, margin: 0,
  });
  const rows = [
    ["1 · Structural shape", "No", "amount > 0, currency code, date, ids present", "808"],
    ["2 · Fund is Open", "Yes", "fund book of record", "up"],
    ["3 · Currency permitted", "Yes", "fund’s permitted-currency list", "up"],
    ["4 · Deal investable & matches", "Yes", "deal pipeline state + investable window", "up"],
    ["5 · Co-investment headroom", "Yes", "hierarchy node cap vs. already committed", "up"],
    ["6 · Within appetite", "Yes", "exposure engine + appetite policy store", "up"],
  ];
  const tx = MX, tw = W - 2 * MX, ry = 2.28, rh = 0.575;
  rows.forEach((r, i) => {
    const y = ry + i * (rh + 0.055);
    const up = r[3] === "up";
    s.addShape(pres.shapes.RECTANGLE, { x: tx, y, w: tw, h: rh, fill: { color: NAVY2 }, line: { color: "27406E", width: 1 } });
    s.addText(r[0], { x: tx + 0.25, y, w: 4.2, h: rh, fontFace: BF, fontSize: 14, bold: true, color: WHITE, valign: "middle", margin: 0 });
    chip(s, tx + 4.7, y + (rh - 0.34) / 2, 1.55, up ? "ASYNC I/O" : "PURE", up ? AMBER : "44607F", up ? NAVY : WHITE);
    s.addText(r[2], { x: tx + 6.55, y, w: tw - 6.8, h: rh, fontFace: BF, fontSize: 12.5, color: ICE, valign: "middle", margin: 0 });
  });
  s.addText([
    { text: "DataAnnotations / IValidatableObject are synchronous. ", options: { bold: true, color: WHITE } },
    { text: "They cannot await any of rules 2–6 — so business validation cannot live there.", options: { color: GREEN } },
  ], { x: MX, y: 6.5, w: W - 2 * MX, h: 0.38, fontFace: BF, fontSize: 13.5, align: "center", margin: 0 });
  footer(s, true);
}


// =============================================================================
// SLIDE 8 — DIVIDER 02 · The classic ways
// =============================================================================
divider(2, "The classic ways", 1);

// =============================================================================
// SLIDE 9 — Classic 1: DataAnnotations + a fat service (light)  [F9]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Classic approach 1 of 3", "Data Annotations + a fat async service", false);
  codeCard(s, MX, 2.0, 6.05, 4.3, [
    { t: "public sealed class CommitCapitalRequest {", k: "k" },
    { t: "  [Required] public string FundId {get;set;}" },
    { t: "  [Range(1, max)] public decimal Amount {...}" },
    { t: "  [CurrencyCode] public string Currency {...}" },
    { t: "  [NotPastDate] public DateOnly Date {...}" },
    { t: "}" },
    { t: "" },
    { t: "// shape only. rules 2-6 need upstream, so:", k: "c" },
    { t: "await service.ValidateAndCommitAsync(req);", k: "k" },
    { t: "//  -> Validator.TryValidateObject(...)", k: "c" },
    { t: "//  -> then a long if-chain of awaits", k: "c" },
  ], "Model/CommitCapitalRequest.cs + Validation/CommitCapitalService.cs");
  const x2 = MX + 6.05 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.0, w2, 4.3, { edge: AMBER });
  s.addText("The tell", { x: x2 + 0.28, y: 2.15, w: w2 - 0.5, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.28, 2.65, w2 - 0.55, 3.5, [
    "Split brain: shape in attributes, real rules in a service",
    "Attributes can’t await — business logic moves out anyway",
    "Attributes can’t take runtime context (the “today” hack)",
    "Business rules buried in an if-chain are hard to test alone",
    "No structured per-rule audit record",
  ], { fs: 12.5, gap: 8 });
  s.addText("Scenario B: 2 / 2 errors · Scenario C: 10 / 10 — aggregates well, but only because the service was hand-written to.", { x: x2 + 0.28, y: 5.95, w: w2 - 0.55, h: 0.4, fontFace: BF, fontSize: 10.5, italic: true, color: MUTE, valign: "top", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 10 — Classic 2: facade + adapter chaining (light)  [F10]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Classic approach 2 of 3", "Facade + adapter chaining (the DMS style)", false);
  codeCard(s, MX, 2.0, 6.05, 4.3, [
    { t: "// CommitmentFacade.SubmitCommitmentAsync", k: "c" },
    { t: "var pf  = await _funds.LoadAsync(id);" },
    { t: "_funds.EnsureOpen(pf);        // rule 2" },
    { t: "_funds.EnsureCurrency(pf, cur);// rule 3" },
    { t: "var deal = await _deals.LoadAsync(id);" },
    { t: "_deals.EnsureInvestable(deal, ...); // rule 4" },
    { t: "var node = await _coInv.LoadAsync(id);" },
    { t: "_coInv.EnsureHeadroom(node, ...);   // rule 5" },
    { t: "var ap = await _appetite             " },
    { t: "    .LoadForBucketAsync(...);  // -> ExposureGw" },
    { t: "_appetite.EnsureWithinLimit(ap, ...);// rule 6" },
  ], "856 lines · 12 files · for one operation");
  const x2 = MX + 6.05 + 0.4, w2 = W - MX - x2;
  card(s, x2, 2.0, w2, 4.3, { edge: RED });
  s.addText("The tell", { x: x2 + 0.28, y: 2.15, w: w2 - 0.5, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.28, 2.65, w2 - 0.55, 3.5, [
    "Deep chains: facade → gateway → gateway → client",
    "Six rules scattered across five files",
    "An upstream change ripples through the gateways",
    "First breach throws → you never see the rest",
    "Mock 3–4 layers just to test one rule",
  ], { fs: 12.5, gap: 8 });
  s.addText("Scenario B: 1 / 2 errors — the appetite breach is lost to the short-circuit.", { x: x2 + 0.28, y: 5.95, w: w2 - 0.55, h: 0.4, fontFace: BF, fontSize: 10.5, italic: true, color: RED, valign: "top", margin: 0 });
  footer(s, false);
}


// =============================================================================
// SLIDE 13 — DIVIDER 03 · The functional approach
// =============================================================================
// =============================================================================
// SLIDE 12b — One feature, the whole layer cake (the bloat) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The bloat", "One feature, two worlds — the layer cake", false);
  const lx = MX, lw = 5.4, ly = 2.35, bh = 0.4, bg = 0.05;
  s.addText("Classic N-tier — every feature pays the full tax", { x: lx, y: 1.92, w: lw, h: 0.32, fontFace: HF, fontSize: 13, bold: true, color: "9A3B36", margin: 0 });
  const classic = [
    "Controller (+ model binding)", "Request DTO + DataAnnotations", "Mapper  (DTO → domain)",
    "Service  (god orchestration)", "ValidatorFactory → Validator", "Repository ×4 (+ Entities + mappers)",
    "JSON config + config factory", "Adapter → upstream", "Mapper  (domain → response DTO)",
  ];
  classic.forEach((t, i) => {
    const y = ly + i * (bh + bg);
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y, w: lw, h: bh, fill: { color: "F4E4DB" }, line: { color: "E0C4B6", width: 0.75 } });
    s.addText(t, { x: lx + 0.16, y, w: lw - 0.3, h: bh, fontFace: BF, fontSize: 11.5, color: "7A3B2E", valign: "middle", margin: 0 });
  });
  const rx = MX + lw + 0.95, rw = W - MX - rx;
  s.addText("Functional — a command on a shared core", { x: rx, y: 1.92, w: rw, h: 0.32, fontFace: HF, fontSize: 13, bold: true, color: "1A7A57", margin: 0 });
  const fn = ["Command  (immutable record)", "Rules / Spec  (the business logic)", "Handler  (thin: validate → execute)", "Ports + owned Core  (written once)"];
  const rby = 2.5, rbh = 0.66, rbg = 0.26;
  fn.forEach((t, i) => box(s, rx, rby + i * (rbh + rbg), rw, rbh, t, i === 3 ? NAVY : GREEN, WHITE));
  s.addText([
    { text: "8 layers · 29 files per feature", options: { bold: true, color: "9A3B36" } },
    { text: "   vs   ", options: { color: MUTE } },
    { text: "3 files (command · spec · handler) on a core written once.", options: { bold: true, color: "1A7A57" } },
  ], { x: MX, y: 6.55, w: W - 2 * MX, h: 0.4, fontFace: BF, fontSize: 11.5, align: "center", margin: 0 });
  footer(s, false);
}

divider(3, "The functional core", 2);

// =============================================================================
// SLIDE 15 — The core you own (dark)  [F14]
// =============================================================================
{
  const s = newSlide(true);
  titleBlock(s, "Zero libraries", "A functional core the team owns outright", true);
  s.addText("Six core pieces + a declarative Spec — ~470 lines of plain C#. No FluentValidation. No MediatR. No Serilog. Nothing to be coupled to.", {
    x: MX, y: 1.7, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 14.5, color: GREEN, margin: 0,
  });
  const pieces = [
    ["Result / Result<T>", "success, or a set of errors; Combine aggregates"],
    ["Error", "an error is data (code, message, field) — not an exception"],
    ["Rule<T>", "a named async rule as a value you can test & compose"],
    ["Validator<T>", "runs the rules, aggregates every error, builds the trace"],
    ["DecisionTrace", "trading-grade audit record → System.Text.Json"],
    ["CommandHandler<,>", "the pipeline: validate → (if approved) execute"],
  ];
  const cw = (W - 2 * MX - 0.4) / 2, ch = 1.18, gy = 0.18;
  pieces.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = MX + col * (cw + 0.4), y = 2.35 + row * (ch + gy);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: ch, fill: { color: NAVY2 }, line: { color: "27406E", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.09, h: ch, fill: { color: GREEN } });
    s.addText(p[0], { x: x + 0.3, y: y + 0.16, w: cw - 0.55, h: 0.4, fontFace: CF, fontSize: 15, bold: true, color: WHITE, margin: 0 });
    s.addText(p[1], { x: x + 0.3, y: y + 0.6, w: cw - 0.55, h: 0.5, fontFace: BF, fontSize: 12.5, color: ICE, valign: "top", margin: 0 });
  });
  footer(s, true);
}

// =============================================================================
// SLIDE 16 — A rule: owned vs buried — and errors are data (light)  [F18]+[F19]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Cleaner", "The same rule — buried vs. owned; errors are data", false);
  codeCard(s, MX, 1.9, 5.9, 3.95, [
    { t: "// rule 6 of 6, deep inside one Validate(),", k: "c" },
    { t: "// after 5 rules, on a prefetched _ctx:", k: "c" },
    { t: "var limit = _ctx.Limits.FirstOrDefault(l =>" },
    { t: "    l.AssetClass == input.AssetClass &&" },
    { t: "    l.Region == input.Region);" },
    { t: "if (limit is null)" },
    { t: '    result.AddError("No appetite configured…");' },
    { t: "else {" },
    { t: "  var c = _ctx.Exposure.CommittedIn(" },
    { t: "      input.AssetClass, input.Region);" },
    { t: "  if (c + input.Amount > limit.MaxAmount)" },
    { t: '    result.AddError("Appetite breach…"); }' },
  ], "Classic · a fragment in a ~180-line method");
  codeCard(s, MX + 5.9 + 0.35, 1.9, W - MX - (MX + 5.9 + 0.35), 3.95, [
    { t: "public static Rule<CommitCapitalCommand>", k: "k" },
    { t: "CommitmentMustBeWithinAppetite(" },
    { t: "  IAppetiteClient appetite," },
    { t: "  IExposureClient exposure) => new(" },
    { t: '  Name: "CommitmentMustBeWithinAppetite",' },
    { t: "  Kind: RuleKind.Upstream," },
    { t: "  Check: async (cmd, ct) => {" },
    { t: "    var lim = (await appetite.GetLimitsAsync(" },
    { t: "      cmd.FundId, ct)).FirstOrDefault(…);" },
    { t: "    var c = (await exposure.GetExposureAsync(" },
    { t: "      cmd.FundId, ct)).CommittedIn(…);" },
    { t: "    return c + cmd.Amount > lim.MaxAmount" },
    { t: '      ? new Error("APPETITE_BREACH", …)' },
    { t: "      : Result.Success(); }));" },
  ], "Functional · its own file, fetches its own data");
  card(s, MX, 6.05, W - 2 * MX, 0.95, { edge: GREEN });
  s.addText([
    { text: "Identical logic. ", options: { bold: true, color: INK } },
    { text: "The functional rule is a named value you open, test, and reason about alone — and ", options: { color: "44516B" } },
    { text: "errors are values you aggregate", options: { bold: true, color: INK } },
    { text: ": Result / Error / Combine collect ALL of them — routable to a UI field, serializable into the audit record, never thrown, never swallowed.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.13, w: W - 2 * MX - 0.6, h: 0.8, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 16b — Same breach, two outcomes: short-circuit vs aggregate [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Why it’s better", "Same request, same breaches — two different answers", false);
  codeCard(s, MX, 1.9, 5.95, 3.95, [
    { t: "// AdapterChaining · rules 2–6 share one try", k: "c" },
    { t: "try {", k: "k" },
    { t: "  _funds.EnsureOpen(pf);          // rule 2" },
    { t: "  _coInv.EnsureHeadroom(node, amt);    // rule 5" },
    { t: "  //  headroom short → throws → STOP", k: "c" },
    { t: "  _appetite.EnsureWithinLimit(ap, …);  // rule 6" },
    { t: "  //  never runs → appetite breach unseen", k: "c" },
    { t: "}" },
    { t: "catch (CommitmentValidationException e) {", k: "k" },
    { t: "  return Fail(e.Message);    // ONE message out" },
    { t: "}" },
  ], "Classic · first throw wins");
  codeCard(s, MX + 5.95 + 0.35, 1.9, W - MX - (MX + 5.95 + 0.35), 3.95, [
    { t: "// Validator · run every rule, then combine", k: "c" },
    { t: "var done = await Task.WhenAll(", k: "k" },
    { t: "    _rules.Select(r => RunAsync(r, cmd, ct)));" },
    { t: "var result = Result.Combine(     // ALL errors" },
    { t: "    done.Select(e => e.Result));" },
    { t: "" },
    { t: "// a throwing rule becomes data — never a", k: "c" },
    { t: "// short-circuit that hides the others:", k: "c" },
    { t: "catch (Exception ex) =>", k: "k" },
    { t: '    Result.Fail(new Error("RULE_THREW", …));' },
  ], "Functional · aggregate, never hide");
  card(s, MX, 6.05, W - 2 * MX, 0.95, { edge: GREEN });
  s.addText([
    { text: "Scenario B — headroom AND appetite breached:  ", options: { bold: true, color: INK } },
    { text: "the chain reports ", options: { color: "44516B" } },
    { text: "1 of 2", options: { bold: true, color: RED } },
    { text: "; the validator reports ", options: { color: "44516B" } },
    { text: "2 of 2", options: { bold: true, color: GREEN } },
    { text: " + a per-rule trace. Same inputs — `dotnet run` each sample to measure it.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.13, w: W - 2 * MX - 0.6, h: 0.78, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}


// =============================================================================
// SLIDE 18 — Traceability without a logging library (dark)  [F17]
// =============================================================================
{
  const s = newSlide(true);
  titleBlock(s, "Traceability", "A decision trail, without a logging library", true);
  codeCard(s, MX, 2.0, 6.7, 4.3, [
    { t: "{", k: "" },
    { t: '  "CorrelationId": "SCN-B",' },
    { t: '  "Command": "CommitCapitalCommand",' },
    { t: '  "Entries": [' },
    { t: '    { "Rule": "CoInvestmentMustHaveHeadroom",' },
    { t: '      "Outcome": "Failed", "ElapsedMs": 5.9,' },
    { t: '      "Messages": ["[COINVEST_NO_HEADROOM] ..."] },' },
    { t: '    { "Rule": "CommitmentMustBeWithinAppetite",' },
    { t: '      "Outcome": "Failed", ... } ],' },
    { t: '  "Passed": 4, "Failed": 2, "Approved": false' },
    { t: "}" },
  ], "Core/DecisionTrace.cs · in-box System.Text.Json");
  const x2 = MX + 6.7 + 0.4, w2 = W - MX - x2;
  s.addText("For a trading audit", { x: x2, y: 2.05, w: w2, h: 0.4, fontFace: HF, fontSize: 17, bold: true, color: WHITE, margin: 0 });
  bullets(s, x2, 2.6, w2, 3.6, [
    { t: "Every rule, its outcome, its timing, its messages", c: ICE },
    { t: "Answers “why was this accepted / rejected?”", c: ICE },
    { t: "Plain data — write it to a file, DB, event, or topic", c: ICE },
    { t: "You own the shape; no Serilog, no sink lock-in", c: ICE },
    { t: "Both breaches captured — nothing short-circuited", c: GREEN },
  ], { fs: 13.5, gap: 12 });
  footer(s, true);
}

// =============================================================================
// SLIDE 18f — After approval: the write path [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The write", "After approval — ExecuteAsync is the only place that writes", false);
  codeCard(s, MX, 1.95, 6.2, 4.15, [
    { t: "// Core/CommandHandler.cs — execute runs ONLY if approved", k: "c" },
    { t: "var (validation, trace) = await", k: "k" },
    { t: "    new Validator<T>(Rules(cmd))" },
    { t: "      .ValidateAsync(cmd, correlationId, ct);" },
    { t: "if (validation.IsFailure)" },
    { t: "    return Fail(validation.Errors, trace);  // no write" },
    { t: "var executed = await ExecuteAsync(cmd, ct); // ← the write" },
    { t: "return Ok(executed, trace);" },
  ], "validate → (only if approved) → execute");
  codeCard(s, MX + 6.2 + 0.35, 1.95, W - MX - (MX + 6.2 + 0.35), 4.15, [
    { t: "// CommitCapitalHandler.ExecuteAsync — the shape", k: "c" },
    { t: "protected override async Task<Result<Receipt>>", k: "k" },
    { t: "ExecuteAsync(CommitCapitalCommand cmd, …) {" },
    { t: "  var key = cmd.IdempotencyKey();   // safe retries" },
    { t: "  var receipt = await commitments.RecordAsync(" },
    { t: "      cmd, key, expectedVersion, ct); // 409 → reject" },
    { t: "  await events.PublishAsync(" },
    { t: "      new CapitalCommitted(receipt), ct);" },
    { t: "  return Result.Success(receipt);" },
    { t: "}" },
  ], "one port write · idempotent · concurrency-checked · event");
  card(s, MX, 6.2, W - 2 * MX, 0.82, { edge: AMBER });
  s.addText([
    { text: "Validation + trace are the hard part — and they're proven. ", options: { bold: true, color: INK } },
    { text: "The demo upstream is read-only, so ExecuteAsync returns a receipt; in production it's a thin write behind a port (idempotency key, optimistic-concurrency check, emitted event). The rules and trace above don't change.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.28, w: W - 2 * MX - 0.6, h: 0.66, fontFace: BF, fontSize: 11, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 18b — DIVIDER 04 · Pluggable & scalable
// =============================================================================
divider(4, "Pluggable & scalable", 3);

// =============================================================================
// SLIDE 18c — Ports & adapters: the seam (pluggable upstreams) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "The seam", "Ports & adapters — the upstream is pluggable by design", false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const port = (t) => ({ text: t, options: { color: "1A4E8A", bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const adp = (t) => ({ text: t, options: { color: INK, fontSize: 11, align: "left", valign: "middle" } });
  const up = (t) => ({ text: t, options: { color: "44516B", fontSize: 11, align: "left", valign: "middle" } });
  const rows = [
    [head("Port — the stable contract"), head("Adapter today (swap me)"), head("Upstream")],
    [port("IFundClient"), adp("DmsFundClient"), up("DMS")],
    [port("IDealClient"), adp("CrmDealClient"), up("CRM")],
    [port("ICoInvestmentClient"), adp("CrmCoInvestmentClient"), up("CRM")],
    [port("IAppetiteClient"), adp("PolicyHubAppetiteClient"), up("PolicyHub")],
    [port("IExposureClient"), adp("LedgerExposureClient"), up("Ledger")],
  ];
  s.addTable(rows, {
    x: MX, y: 2.0, w: W - 2 * MX, colW: [3.95, 4.7, 3.28],
    rowH: [0.46, 0.6, 0.6, 0.6, 0.6, 0.6], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  card(s, MX, 6.05, W - 2 * MX, 0.95, { edge: GREEN });
  s.addText([
    { text: "Rules & handlers depend on the LEFT column only. ", options: { bold: true, color: INK } },
    { text: "Each adapter is the one file that knows its upstream's shape. Replace the CRM → X: a new adapter + one line at the composition root — the ports, rules and handlers never move.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.13, w: W - 2 * MX - 0.6, h: 0.78, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 18d — Plug in a new upstream — one line (the swap) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Pluggable", "Swap an upstream in one line — nothing else moves", false);
  codeCard(s, MX, 1.95, 6.35, 4.15, [
    { t: "// Composition/ — the ONE place a source is named", k: "c" },
    { t: "public sealed class InMemoryUpstream : IUpstream {", k: "k" },
    { t: "  public InMemoryUpstream() {" },
    { t: "    var data = SeedData.Build();" },
    { t: "    Funds    = new DmsFundClient(data);" },
    { t: "    Deals         = new CrmDealClient(data);" },
    { t: "    CoInvestments = new CrmCoInvestmentClient(data);" },
    { t: "    Appetite      = new PolicyHubAppetiteClient(data);" },
    { t: "    Exposure      = new LedgerExposureClient(data);" },
    { t: "    // tomorrow: Deals = new NextGenDealsClient(…);", k: "c" },
    { t: "  }                //          ↑ one line, done" },
    { t: "}" },
  ], "bind PORT ← SOURCE, in one place");
  codeCard(s, MX + 6.35 + 0.35, 1.95, W - MX - (MX + 6.35 + 0.35), 4.15, [
    { t: "// the stable contract a rule depends on:", k: "c" },
    { t: "public interface IFundClient {", k: "k" },
    { t: "  Task<FundSnapshot?> GetFundAsync(" },
    { t: "    string id, CancellationToken ct = default);" },
    { t: "}" },
    { t: "" },
    { t: "// the ONLY file that knows the DMS shape:", k: "c" },
    { t: "public sealed class DmsFundClient(SeedData d)", k: "k" },
    { t: "    : IFundClient {" },
    { t: "  public Task<FundSnapshot?> GetFundAsync(…)" },
    { t: "    // map DMS record → FundSnapshot (here)", k: "c" },
    { t: "    => …;" },
    { t: "}" },
  ], "port = contract · adapter = the only mapper");
  card(s, MX, 6.2, W - 2 * MX, 0.82, { edge: GREEN });
  s.addText([
    { text: "The port is the contract; the adapter is the only place that knows the upstream. ", options: { color: "44516B" } },
    { text: "Swap a source — one line. Rules and handlers compile unchanged.", options: { bold: true, color: INK } },
  ], { x: MX + 0.3, y: 6.28, w: W - 2 * MX - 0.6, h: 0.66, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 18e — Plug in a new feature — same core (scalable) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Scalable", "A new feature reuses the whole core — add, don't rebuild", false);
  codeCard(s, MX, 1.95, 6.55, 4.15, [
    { t: "// a brand-new feature: deal-stage lifecycle", k: "c" },
    { t: "public sealed class AdvanceDealStageHandler(IUpstream up)", k: "k" },
    { t: "  : CommandHandler<AdvanceDealStageCommand," },
    { t: "                   DealStageReceipt> {" },
    { t: "  protected override IEnumerable<Rule<…>> Rules(cmd) =>", k: "k" },
    { t: "  [" },
    { t: "    AdvanceDealStageRules.Structural()," },
    { t: "    AdvanceDealStageRules.TransitionMustBeValid(up.Deals)," },
    { t: "  ];" },
    { t: "  protected override Task<Result<…>> ExecuteAsync(…)" },
    { t: "    => /* record the transition */;" },
    { t: "}" },
  ], "same CommandHandler<,>, Validator, DecisionTrace");
  codeCard(s, MX + 6.55 + 0.35, 1.95, W - MX - (MX + 6.55 + 0.35), 4.15, [
    { t: "// the lifecycle is DATA, not a switch tangle:", k: "c" },
    { t: "public static readonly IReadOnlyDictionary<", k: "k" },
    { t: "  DealStatus, DealStatus[]> Allowed = new() {" },
    { t: "    [Pipeline]   = [Investable, Withdrawn]," },
    { t: "    [Investable] = [Closed, Withdrawn]," },
    { t: "    [Closed]     = []," },
    { t: "    [Withdrawn]  = []," },
    { t: "  };" },
    { t: "// add a stage or an edge here —", k: "c" },
    { t: "// command, rule and handler don't change.", k: "c" },
  ], "DealStageMachine — state machine as data");
  card(s, MX, 6.2, W - 2 * MX, 0.82, { edge: GREEN });
  s.addText([
    { text: "Second feature = +1 command, +2 rules, +1 handler. ", options: { bold: true, color: INK } },
    { text: "Zero changes to the Core, the Validator or the DecisionTrace. The pattern scales by adding pieces, never by editing shared ones.", options: { color: "44516B" } },
  ], { x: MX + 0.3, y: 6.28, w: W - 2 * MX - 0.6, h: 0.66, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 19 — It scales: one generic pipeline + adding a rule (light)  [F20]+[F21]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Scalable", "One generic pipeline — adding a rule is +1 file, +1 line", false);
  codeCard(s, MX, 1.98, 6.6, 4.5, [
    { t: "public abstract class", k: "k" },
    { t: "CommandHandler<TCommand, TResult>" },
    { t: "{" },
    { t: "  // a feature implements exactly these two:", k: "c" },
    { t: "  protected abstract IEnumerable<Rule<TCommand>>" },
    { t: "      Rules(TCommand command);" },
    { t: "  protected abstract Task<Result<TResult>>" },
    { t: "      ExecuteAsync(TCommand cmd, CancellationToken ct);" },
    { t: "" },
    { t: "  public async Task<HandlerOutcome<TResult>>" },
    { t: "  HandleAsync(TCommand cmd, string? cid = null, …) {" },
    { t: "    var (result, trace) = await" },
    { t: "      new Validator<TCommand>(Rules(cmd))" },
    { t: "        .ValidateAsync(cmd, cid ??= NewId(), ct);" },
    { t: "    if (result.IsFailure) return Fail(result, trace);" },
    { t: "    return Ok(await ExecuteAsync(cmd, ct), trace);" },
    { t: "  }" },
    { t: "}" },
  ], "Core/CommandHandler.cs — written once, reused by every command");
  const x2 = MX + 6.6 + 0.4, w2 = W - MX - x2;
  card(s, x2, 1.98, w2, 2.55, { edge: GREEN });
  s.addText("Written once. Reused everywhere.", { x: x2 + 0.28, y: 2.12, w: w2 - 0.5, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(s, x2 + 0.28, 2.6, w2 - 0.55, 1.85, [
    "Generic over <TCommand, TResult> — feature-agnostic",
    "A new command = a record + its rules + the two methods",
    "validate → aggregate → trace is amortized across the app",
  ], { fs: 12, gap: 7 });
  card(s, x2, 4.7, w2, 1.78, { edge: AMBER });
  s.addText("Adding a rule scales linearly", { x: x2 + 0.28, y: 4.84, w: w2 - 0.5, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  s.addText([
    { text: "Functional: +1 file, +1 line. ", options: { bold: true, color: GREEN } },
    { text: "The classic styles edit shared code — a new attribute + service branch, a new gateway + facade edit, or another branch in the ~180-line method. ", options: { color: "44516B" } },
    { text: "Additive (O(1)) vs. editing shared code (O(n) risk)", options: { bold: true, color: INK } },
    { text: " — the gap compounds as the rule set grows.", options: { color: "44516B" } },
  ], { x: x2 + 0.28, y: 5.3, w: w2 - 0.56, h: 1.1, fontFace: BF, fontSize: 11.5, valign: "top", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 20 — Pluggable upstreams: a swap, not a rewrite (light)  [F22]+[F23]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Scalable · 5-year", "Adding anything stays contained — the axes of change", false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12, align: "left", valign: "middle" } });
  const ch = (t) => ({ text: t, options: { color: INK, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const good = (t) => ({ text: t, options: { color: "1A7A57", fontSize: 11, align: "left", valign: "middle" } });
  const bad = (t) => ({ text: t, options: { color: "9A3B36", fontSize: 11, align: "left", valign: "middle" } });
  const rows = [
    [head("When you need to…"), head("Functional — additive (one seam)"), head("Classic — rippling (many places)")],
    [ch("Add an upstream source (CRM → X)"), good("one adapter behind the port"), bad("rewire gateways + facade + mappers")],
    [ch("Change a model / contract field"), good("one record — compiler finds every use"), bad("hunt across DTOs, mappers, adapters")],
    [ch("Add or change a business rule"), good("+1 rule file, +1 line in the handler"), bad("edit the ~180-line method / the facade")],
    [ch("Add a whole new command / feature"), good("command + rules + handler, reuse Core"), bad("new orchestration, copy the plumbing")],
    [ch("Add a UI view or element"), good("register a slice / panel (data)"), bad("edit god components & layouts")],
    [ch("Add a policy / language / limit"), good("change data (tokens · i18n · appetite)"), bad("change code + redeploy")],
  ];
  s.addTable(rows, {
    x: MX, y: 1.95, w: W - 2 * MX, colW: [3.7, 4.2, 4.03],
    rowH: [0.42, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  s.addText([
    { text: "Functional growth is additive — touch one seam. ", options: { bold: true, color: INK } },
    { text: "Classic growth is multiplicative — touch many. Repeated across five years of changes, that gap is what keeps the app shipping fast.", options: { color: "44516B" } },
  ], { x: MX, y: 6.45, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 11.5, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE — A common agreement on structure, not a cage [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Flexibility", "A common agreement on structure — not a cage", false);
  card(s, MX, 1.98, 5.5, 4.4, { edge: GREEN });
  s.addText("The whole agreement (the seams)", { x: MX + 0.3, y: 2.14, w: 5.0, h: 0.4, fontFace: HF, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(s, MX + 0.3, 2.66, 4.95, 3.6, [
    "A command is just data in.",
    "A rule returns Result — pass, or errors (as values).",
    "A handler = which rules + what to do on success.",
    "Errors aggregate; the decision trace is automatic.",
    "~470 lines you own — change it if it doesn't fit.",
  ], { fs: 12.5, gap: 11 });
  codeCard(s, MX + 5.5 + 0.4, 1.98, W - MX - (MX + 5.5 + 0.4), 4.4, [
    { t: "// inside a rule: any algorithm, any shape,", k: "c" },
    { t: "// sync or async, 0..N upstreams — your call.", k: "c" },
    { t: "Check: async (cmd, ct) =>" },
    { t: "{" },
    { t: "  var book = await exposure" },
    { t: "      .GetExposureAsync(cmd.FundId, ct);" },
    { t: "  var tier = cmd.Amount switch {     // branch freely" },
    { t: "    <  5_000_000m => Tier.Small," },
    { t: "    < 25_000_000m => Tier.Mid," },
    { t: "    _             => Tier.Large };" },
    { t: "  var cap = Policy.Cap(tier, cmd.AssetClass);" },
    { t: "  return book.CommittedIn(…) + cmd.Amount <= cap" },
    { t: "    ? Result.Success()" },
    { t: '    : new Error("CONCENTRATION", …);' },
    { t: "}" },
  ], "Inside a rule — your logic, your way");
  s.addText([
    { text: "The agreement is the shape, not the logic. ", options: { bold: true, color: INK } },
    { text: "Inside a rule (and inside ExecuteAsync) you write whatever the domain needs — same freedom as today, with a structure the team shares and owns.", options: { color: "44516B" } },
  ], { x: MX, y: 6.5, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 11.5, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 20b — Right tool for the job (not functional everywhere) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Not a silver bullet", "Right tool for the job — what each pattern does best", false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11, align: "left", valign: "middle" } });
  const job = (t) => ({ text: t, options: { color: INK, bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const pat = (t) => ({ text: t, options: { color: "1A4E8A", bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const why = (t) => ({ text: t, options: { color: "44516B", fontSize: 9.5, align: "left", valign: "middle" } });
  const rows = [
    [head("The job"), head("Best handled by"), head("Why"), head("In Atlas")],
    [job("Wire-format shape (required, range, length, regex)"), pat("Data Annotations"), why("declarative, auto-run on model binding, shows in OpenAPI"), why("API DTOs")],
    [job("Isolate a volatile upstream API"), pat("Adapter (ports & adapters)"), why("one seam absorbs a supplier’s change"), why("Sources/ adapters")],
    [job("An immutable message / intent"), pat("record"), why("value equality, pattern-match, trivial to construct & test"), why("every Command")],
    [job("Async business policy (aggregate + audit)"), pat("Functional command + Rule<T>"), why("errors as values, all in one pass, per-rule trace"), why("CommitCapital")],
    [job("A lifecycle / legal transitions"), pat("Command + transition map as data"), why("moves are data, not scattered if/else"), why("deal-stage machine")],
    [job("Simple CRUD, no real policy"), pat("Classic layered + annotations"), why("don’t over-engineer; the team already knows it"), why("shape-only endpoints")],
  ];
  s.addTable(rows, {
    x: MX, y: 1.95, w: W - 2 * MX, colW: [3.5, 2.95, 3.6, 1.88],
    rowH: [0.42, 0.68, 0.68, 0.6, 0.64, 0.64, 0.58], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  s.addText([
    { text: "We’re not proposing “functional everywhere.” ", options: { bold: true, color: INK } },
    { text: "Keep Data Annotations and adapters where they’re strong; add the command pattern only where async policy + audit demand it — that judgement is the point.", options: { color: "44516B" } },
  ], { x: MX, y: 6.55, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 11.5, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 21 — DIVIDER 04 · Proof & trade-offs
// =============================================================================
divider(5, "Proof & trade-offs", 4);

// =============================================================================
// SLIDE 23 — By the numbers (light)  [F27]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "By the numbers", "Soft adjectives replaced with figures you can re-measure", false);
  const stats = [
    ["2", "files to add a rule — 1 new + 1 line; the classic styles edit shared code", GREEN],
    ["1 vs 3", "stubs to unit-test a rule vs a chained adapter (rule 6 needs 3 collaborators)", GREEN],
    ["183 → 30", "LOC: the one validator method vs one rule — 23 branches → ≤5, depth 3 → 1", NAVY],
    ["2·10 / 1·4", "errors surfaced per request (scenarios B·C): functional vs the classic chain", GREEN],
    ["469", "LOC of owned core · 7 files · 0 third-party deps", NAVY],
    ["23", "tests green — each rule in isolation, end-to-end & traced", GREEN],
  ];
  const cols = 3, gap = 0.3, cw = (W - 2 * MX - (cols - 1) * gap) / cols, ch = 1.78;
  stats.forEach((st, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = MX + c * (cw + gap), y = 2.05 + r * (ch + 0.28);
    card(s, x, y, cw, ch, { edge: st[2] });
    s.addText(st[0], { x: x + 0.25, y: y + 0.16, w: cw - 0.5, h: 0.72, fontFace: HF, fontSize: 29, bold: true, color: st[2], margin: 0 });
    s.addText(st[1], { x: x + 0.25, y: y + 0.9, w: cw - 0.5, h: ch - 1.0, fontFace: BF, fontSize: 11, color: "44516B", valign: "top", margin: 0 });
  });
  s.addText([
    { text: "Re-measurable on the spot: ", options: { bold: true, color: INK } },
    { text: "`dotnet test` · `wc -l` · the four sample runs. The headline is completeness: every breach, every time.", options: { color: "44516B" } },
  ], { x: MX, y: 6.2, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 12, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 24 — Operability — will it survive production? (light)  [F28]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Operability", "Will it survive production? — the questions before sign-off", false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12, valign: "middle" } });
  const lhs = (t) => ({ text: t, options: { color: INK, bold: true, fontSize: 11.5, valign: "middle" } });
  const rhs = (t) => ({ text: t, options: { color: "44516B", fontSize: 11, valign: "middle" } });
  const rows = [
    [head("Production concern"), head("How it is answered — and where it lives")],
    [lhs("Partial upstream failure"), rhs("Fail-closed; a throwing rule becomes a recorded RULE_THREW error (never hides the others). Retry / circuit-breaker live behind the port.")],
    [lhs("Per-command deadline"), rhs("Wrap validation in a linked CancellationTokenSource(timeout) — the token is already threaded into every rule.")],
    [lhs("Validate-then-execute race"), rhs("The write is the source of truth: ExecuteAsync commits under optimistic concurrency (version check) and rejects on conflict. Validation is the pre-check.")],
    [lhs("Authorization"), rhs("An early rule (or a pre-handler step) rejects a forbidden caller before the upstream fan-out.")],
    [lhs("Observability"), rhs("Emit Activity spans + Meter counters — in-box BCL, not Serilog. DecisionTrace is the audit record; OpenTelemetry is the live telemetry.")],
    [lhs("Command & contract versioning"), rhs("Records evolve additively (add fields); old DecisionTraces stay readable; nothing breaks on the wire.")],
  ];
  s.addTable(rows, {
    x: MX, y: 1.95, w: W - 2 * MX, colW: [3.3, 8.63],
    rowH: [0.42, 0.66, 0.6, 0.74, 0.56, 0.66, 0.66], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false,
  });
  s.addText([
    { text: "When NOT to reach for this: ", options: { bold: true, color: AMBER } },
    { text: "shape-only CRUD / document metadata — keep DataAnnotations. This pattern earns its keep when validation is async business policy.", options: { color: "44516B" } },
  ], { x: MX, y: 6.5, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 11.5, italic: true, margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 24b — Two styles, one core: declarative validators, without a library [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Two styles, one core", "Declarative validators — without a library", false);
  codeCard(s, MX, 1.98, 5.9, 4.3, [
    { t: "// ValidatorFactory: one big Validate(...)", k: "c" },
    { t: "public ValidationResult Validate(Input x) {" },
    { t: "  var r = new ValidationResult();" },
    { t: "  if (string.IsNullOrWhiteSpace(x.FundId))" },
    { t: "    r.AddError(\"FundId required\");" },
    { t: "  if (x.Amount <= 0)" },
    { t: "    r.AddError(\"Amount must be > 0\");" },
    { t: "  // …+ 6 more rules, nested ifs, ordering traps…", k: "c" },
    { t: "  return r;" },
    { t: "}" },
  ], "Classic · one imperative method");
  codeCard(s, MX + 5.9 + 0.35, 1.98, W - MX - (MX + 5.9 + 0.35), 4.3, [
    { t: "using …Commands.Core;  // yours, ~470 LOC", k: "c" },
    { t: "public sealed class CommitCapitalSpec" },
    { t: "  : Spec<CommitCapitalCommand> {" },
    { t: "  public CommitCapitalSpec(IUpstream up," },
    { t: "                           DateOnly today) {" },
    { t: "    RuleFor(x => x.Currency).Length(3);" },
    { t: "    RuleFor(x => x.Amount).GreaterThan(0m);" },
    { t: "    RuleFor(x => x.CommitmentDate)" },
    { t: "      .Must(d => d >= today, \"DATE_IN_PAST\", …);" },
    { t: "    // async is first-class — and every rule is traced:", k: "c" },
    { t: "    Add(CommitCapitalRules" },
    { t: "        .FundMustBeOpen(up.Funds));" },
    { t: "  }" },
    { t: "}" },
  ], "Atlas · owned Spec<T> — no library, async-native");
  s.addText([
    { text: "Same declarative readability — on the owned ~470-line core.", options: { bold: true, color: INK } },
    { text: " Async-native, and every rule still flows into the Validator + DecisionTrace. No FluentValidation, no library.", options: { color: "44516B" } },
  ], { x: MX, y: 6.45, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 12, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 25 — Testability — fake five clients, or write four lines (light)  [F29]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Testability", "Test one rule — fake five clients, or write four lines", false);
  codeCard(s, MX, 1.9, 5.95, 3.95, [
    { t: "// Classic: rule 5 isn’t a unit — you build", k: "c" },
    { t: "// the service over a full fake upstream:", k: "c" },
    { t: "var up = new FakeUpstream {", k: "k" },
    { t: "  Funds = open, Deals = ok," },
    { t: "  CoInvestments = noHeadroom,        // the one" },
    { t: "  Appetite = lim, Exposure = ex };   // under test" },
    { t: "var svc = new CommitCapitalService(up);", k: "k" },
    { t: "var r = await svc.ValidateAndCommitAsync(req);" },
    { t: "// then dig through a List<string>:", k: "c" },
    { t: "Assert.Contains(r.Errors, m =>", k: "k" },
    { t: '  m.Contains("headroom"));' },
  ], "Classic · whole service, full fake upstream");
  codeCard(s, MX + 5.95 + 0.35, 1.9, W - MX - (MX + 5.95 + 0.35), 3.95, [
    { t: "// Functional: the entire “mock” — no Moq", k: "c" },
    { t: "sealed class StubCoInv(CoInvestmentNode? n)", k: "k" },
    { t: "  : ICoInvestmentClient {" },
    { t: "  public Task<CoInvestmentNode?> GetNodeAsync(" },
    { t: "    string id, CancellationToken ct = default)" },
    { t: "      => Task.FromResult(n); }" },
    { t: "" },
    { t: "[Fact] public async Task Fails_no_headroom(){", k: "k" },
    { t: "  var rule = CoInvestmentMustHaveHeadroom(" },
    { t: "      new StubCoInv(shortNode));" },
    { t: "  var r = await rule.Check(Cmd(), default);" },
    { t: '  Assert.Equal("COINVEST_NO_HEADROOM",' },
    { t: "    r.Errors[0].Code); }" },
  ], "Functional · one rule, one 4-line stub");
  card(s, MX, 6.05, W - 2 * MX, 0.95, { edge: GREEN });
  s.addText([
    { text: "A rule needs only its own port → its stub is four lines. ", options: { bold: true, color: INK } },
    { text: "No mock library, no layered fixtures — the same anti-coupling principle, applied to tests. ", options: { color: "44516B" } },
    { text: "23 green.", options: { bold: true, color: GREEN } },
  ], { x: MX + 0.3, y: 6.13, w: W - 2 * MX - 0.6, h: 0.78, fontFace: BF, fontSize: 11.5, valign: "middle", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 25b — Microsoft's own architecture guidance backs this (light) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, 'Industry backing', 'Microsoft — and Uncle Bob — back this', false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: 'left', valign: 'middle' } });
  const ms = (t) => ({ text: t, options: { color: INK, fontSize: 10, italic: true, align: 'left', valign: 'middle' } });
  const fn = (t) => ({ text: t, options: { color: '1A7A57', fontSize: 10.5, align: 'left', valign: 'middle' } });
  const rows = [
    [head('Microsoft Learn guidance (verbatim)'), head('How Atlas does it')],
    [ms('"infrastructure and implementation details depend on the Application Core … the Application Core has no dependencies … very easy to write automated unit tests."  — Clean Architecture'), fn('the owned Core + Ports / Sources / Composition; a rule is tested with a one-line stub')],
    [ms('Traditional N-layer: "the BLL … is dependent on data access implementation details … Testing business logic … is often difficult, requiring a test database."'), fn('inverted: rules depend on ports, never on CRM or a database')],
    [ms('"new behavior [implemented] as new classes, rather than … adding responsibility … Adding new classes is always safer than changing existing classes."  — Single Responsibility'), fn('add a rule = +1 file, +1 line; nothing existing changes')],
    [ms('"a specific command handler class for each command … the application layer must only coordinate … must not hold … domain state."  — CQRS / DDD'), fn('CommandHandler<,>: validate → execute; the logic lives in rules')],
  ];
  s.addTable(rows, { x: MX, y: 1.92, w: W - 2 * MX, colW: [7.55, 4.38], rowH: [0.4, 0.95, 0.95, 0.95, 0.95], border: { type: 'solid', pt: 0.5, color: LINE }, fill: { color: 'FFFFFF' }, fontFace: BF, valign: 'middle', autoPage: false });
  s.addText([
    { text: 'This is Microsoft’s documented recommendation for maintainable .NET ', options: { bold: true, color: INK } },
    { text: '(records over attribute-decorated DTOs, too — "persistence ignorance"). Same shapes, no libraries — and R.C. Martin’s “Functional Design” + “The Clean Coder” argue the same: FP + SOLID + TDD scale.', options: { color: '44516B' } },
  ], { x: MX, y: 6.4, w: W - 2 * MX, h: 0.5, fontFace: BF, fontSize: 11, align: 'center', margin: 0 });
  s.addNotes('Sources (Microsoft Learn): "Common web application architectures" — learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures (N-layer critique + Clean Architecture; cites Robert C. Martin, "The Clean Architecture"). "Architectural principles" — .../modern-web-apps-azure/architectural-principles. "Implementing the microservice application layer using the Web API" — .../microservices/microservice-ddd-cqrs-patterns/microservice-application-layer-implementation-web-api. Also: R.C. Martin, "Functional Design" (2023) — FP + SOLID + patterns = more scalable systems; "The Clean Coder" (2011) — TDD as a minimum discipline.');
  footer(s, false);
}


// =============================================================================
// SLIDE — Honest trade-offs (cons) [NEW]
// =============================================================================
{
  const s = newSlide(false);
  titleBlock(s, "Honest trade-offs", "What adopting this costs — and why we think it's worth it", false);
  const head = (t) => ({ text: t, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const cost = (t) => ({ text: t, options: { color: "9A3B36", bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const mit = (t) => ({ text: t, options: { color: "44516B", fontSize: 10.5, align: "left", valign: "middle" } });
  const rows = [
    [head("The cost (real)"), head("Why we think it's worth it")],
    [cost("Learning curve — Result / rules is new to an OO team; smaller hiring pool"), mit("still plain C#; the core is ~470 lines read in an afternoon; a rule is simpler than the ~180-line method it replaces")],
    [cost("You own the framework — no vendor to file bugs against"), mit("~470 lines, fully tested; you'd own a FluentValidation / MediatR wrapper anyway — and carry zero new CVE / supply-chain surface")],
    [cost("More concepts up front — Command · Result · Rule · Spec"), mit("overkill for shape-only CRUD — keep DataAnnotations there; this earns its keep on async business policy")],
    [cost("Up-front structure — you design the seams first"), mit("a little more ceremony for the first slice; it pays back on every slice after, as the app grows")],
    [cost("Fewer ready examples than mainstream MVC + EF + FluentValidation"), mit("the pattern itself is mainstream (Microsoft + Clean Architecture); this repo is the team's worked template")],
    [cost("Discipline required — two rule styles can fragment; no silver bullet"), mit("one agreed style per area, enforced in review; the DecisionTrace makes drift visible")],
  ];
  s.addTable(rows, { x: MX, y: 1.92, w: W - 2 * MX, colW: [5.4, 6.53], rowH: [0.4, 0.72, 0.72, 0.66, 0.66, 0.66, 0.66], border: { type: "solid", pt: 0.5, color: LINE }, fill: { color: "FFFFFF" }, fontFace: BF, valign: "middle", autoPage: false });
  s.addText("We're not selling a silver bullet — these are the real costs. For shape-only CRUD the classic stack is fine; for Atlas's async, ever-changing policy the flexibility, traceability and modularity outweigh them.", { x: MX, y: 6.55, w: W - 2 * MX, h: 0.45, fontFace: BF, fontSize: 11, italic: true, color: MUTE, align: "center", margin: 0 });
  footer(s, false);
}

// =============================================================================
// SLIDE 30 — The long-term blueprint + why it scales (dark)  [F43]+[F24]
// =============================================================================
{
  const s = newSlide(true);
  titleBlock(s, "The blueprint", "Built to grow for 5+ years — without coupling to a single package", true);
  const flow = [
    ["Upstreams", "CRM·DMS·Ledger·PolicyHub"],
    ["Ports", "stable contracts"],
    ["Commands + Rules", "owned core, no libs"],
    ["API", "thin, result-based"],
  ];
  const n = flow.length, fbw = 2.16, fgap = (W - 2 * MX - n * fbw) / (n - 1), fy = 2.4, fbh = 1.05;
  flow.forEach((f, i) => {
    const x = MX + i * (fbw + fgap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: fy, w: fbw, h: fbh, rectRadius: 0.07, fill: { color: i === 2 ? GREEN : NAVY2 }, line: { color: "27406E", width: 1 } });
    s.addText([
      { text: f[0], options: { breakLine: true, bold: true, fontSize: 13, color: WHITE } },
      { text: f[1], options: { fontSize: 9, color: i === 2 ? "E6FFF5" : ICE } },
    ], { x: x + 0.06, y: fy, w: fbw - 0.12, h: fbh, fontFace: BF, align: "center", valign: "middle", margin: 0 });
    if (i < n - 1) s.addShape(pres.shapes.LINE, { x: x + fbw, y: fy + fbh / 2, w: fgap, h: 0, line: { color: "6E83A8", width: 2, endArrowType: "triangle" } });
  });
  const badges = ["Configurable", "Testable", "Loggable", "Scalable"];
  const jbw = 2.6, jgap = (W - 2 * MX - 4 * jbw) / 3, by = 3.85;
  badges.forEach((b, i) => {
    const x = MX + i * (jbw + jgap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: by, w: jbw, h: 0.62, rectRadius: 0.31, fill: { color: NAVY2 }, line: { color: GREEN, width: 1.2 } });
    s.addText(b, { x, y: by, w: jbw, h: 0.62, fontFace: HF, fontSize: 14, bold: true, color: GREEN, align: "center", valign: "middle", margin: 0 });
  });
  // five pillars (from F24) — compact rows
  const pillars = [
    ["Result-based returns", "outcomes are values aggregated into one response — nothing thrown, nothing swallowed."],
    ["Asynchronous processing", "rules are async by design — they call upstream directly; no sync-over-async contortions."],
    ["Scoped logic", "one rule = one file = one concern; every change is contained, never rippled."],
    ["Better testing", "each rule a pure unit, one stub, no mocking library — 23 tests, each rule alone."],
    ["Better logging", "every command emits a structured DecisionTrace — trading-grade audit, no Serilog."],
  ];
  const py = 4.75, rh = 0.43;
  pillars.forEach((p, i) => {
    const y = py + i * rh;
    s.addShape(pres.shapes.RECTANGLE, { x: MX, y: y + 0.07, w: 0.28, h: 0.28, fill: { color: GREEN } });
    s.addText(String(i + 1), { x: MX, y: y + 0.07, w: 0.28, h: 0.28, fontFace: HF, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText([
      { text: p[0] + "   ", options: { bold: true, fontSize: 12.5, color: WHITE, fontFace: HF } },
      { text: p[1], options: { fontSize: 11.5, color: ICE } },
    ], { x: MX + 0.45, y: y, w: W - 2 * MX - 0.45, h: rh, fontFace: BF, valign: "middle", margin: 0 });
  });
  footer(s, true);
}

// =============================================================================
// SLIDE 31 — Recommendation — the ask (dark)  [F45]
// =============================================================================
{
  const s = newSlide(true);
  s.addShape(pres.shapes.RECTANGLE, { x: MX, y: 1.5, w: 0.9, h: 0.16, fill: { color: GREEN } });
  s.addText("The recommendation", { x: MX, y: 1.85, w: 11, h: 0.4, fontFace: BF, fontSize: 14, bold: true, color: GREEN, charSpacing: 2, margin: 0 });
  s.addText("Build Atlas on functional commands\nwith async validation.", { x: MX, y: 2.3, w: 11.8, h: 1.6, fontFace: HF, fontSize: 36, bold: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.0 });
  s.addText("Atlas becomes our reference app for shipping in an ever-changing data world — built on flexibility, traceability and modularity. Spend our attention on business logic, not on chaining code and nested ifs. Same .NET, no new libraries, fully testable, audit-ready.", {
    x: MX, y: 4.05, w: 11.2, h: 0.9, fontFace: BF, fontSize: 16, color: ICE, margin: 0,
  });
  card(s, MX, 5.15, W - 2 * MX, 1.15, { fill: NAVY2, border: "27406E", shadow: true });
  s.addText([
    { text: "Run the proof:  ", options: { bold: true, color: GREEN } },
    { text: "dotnet test  ·  dotnet run --project src/Atlas.Functional.Commands", options: { fontFace: CF, color: ICE } },
    { text: "   — four samples, one operation, 23 green tests.", options: { color: "8AA0C6" } },
  ], { x: MX + 0.3, y: 5.3, w: W - 2 * MX - 0.6, h: 0.85, fontFace: BF, fontSize: 13.5, valign: "middle", margin: 0 });
  footer(s, true);
}

pres.writeFile({ fileName: "Atlas-Backend.pptx" }).then((f) => console.log("WROTE", f)).catch((e) => { console.error(e); process.exit(1); });
