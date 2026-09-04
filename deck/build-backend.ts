import type PptxGenJS from "pptxgenjs";
import { AMBER, bodyFont, box, bullets, card, chip, codeCard, codeFont, Deck, GREEN, headerFont, ICE, INK, LINE, marginX, MUTE, NAVY, NAVY2, RED, shapes, slideWidth, titleBlock, WHITE } from "./deck.ts";

const SECTIONS = ["The problem", "The classic stack", "The functional core", "Pluggable & scalable", "Proof & trade-offs"];

const deck = new Deck({
  title: "Designing Atlas Validation — Lean Cut",
  footerText: "Atlas · Functional commands over classic validation chains",
  sections: SECTIONS,
});

function agenda(slide: PptxGenJS.Slide): void {
  const rows = [
    ["1", "The problem", "Downstream of upstreams that change; the async hinge; built for 5+ years."],
    ["2", "The classic stack", "Three familiar styles + the N-tier cake — and why they stop scaling."],
    ["3", "The functional core", "Command → rules → validator → handler: a small owned core."],
    ["4", "Pluggable & scalable", "Ports & adapters, the one-line upstream swap, a 2nd feature on the same core."],
    ["5", "Proof & trade-offs", "The numbers, the right tool per job, operability, honest costs."],
  ];
  const cardWidth = slideWidth - 2 * marginX, rowHeight = 0.62, firstRowY = 1.8, rowGap = 0.1;
  rows.forEach((row, index) => {
    const rowY = firstRowY + index * (rowHeight + rowGap);
    card(slide, marginX, rowY, cardWidth, rowHeight, { edge: NAVY });
    slide.addShape(shapes.rectangle, { x: marginX + 0.26, y: rowY + (rowHeight - 0.44) / 2, w: 0.44, h: 0.44, fill: { color: NAVY } });
    slide.addText(row[0], { x: marginX + 0.26, y: rowY + (rowHeight - 0.44) / 2, w: 0.44, h: 0.44, fontFace: headerFont, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    slide.addText([
      { text: row[1] + "    ", options: { fontFace: headerFont, fontSize: 16, bold: true, color: INK } },
      { text: row[2], options: { fontFace: bodyFont, fontSize: 13, color: MUTE } },
    ], { x: marginX + 1.0, y: rowY, w: cardWidth - 1.3, h: rowHeight, valign: "middle", margin: 0 });
  });
  const askY = firstRowY + 5 * (rowHeight + rowGap) + 0.06;
  card(slide, marginX, askY, cardWidth, 0.58, { fill: NAVY, shadow: true });
  slide.addText([
    { text: "The ask:  ", options: { bold: true, color: GREEN } },
    { text: "build Atlas on functional commands.", options: { color: WHITE } },
  ], { x: marginX + 0.3, y: askY, w: cardWidth - 0.6, h: 0.58, fontFace: bodyFont, fontSize: 15, valign: "middle", margin: 0 });
}

{
  const slide = deck.newSlide(true);
  slide.addShape(shapes.rectangle, { x: marginX, y: 1.75, w: 0.9, h: 0.16, fill: { color: GREEN } });
  slide.addShape(shapes.rectangle, { x: marginX, y: 2.0, w: 0.42, h: 0.16, fill: { color: AMBER } });
  slide.addText("Atlas · BACKEND ARCHITECTURE", {
    x: marginX, y: 2.35, w: 11, h: 0.4, fontFace: bodyFont, fontSize: 15, bold: true, color: GREEN, charSpacing: 3, margin: 0,
  });
  slide.addText("Designing Atlas Validation", {
    x: marginX, y: 2.75, w: 11.8, h: 1.1, fontFace: headerFont, fontSize: 50, bold: true, color: WHITE, margin: 0,
  });
  slide.addText("Building a pluggable, scalable system — functional commands & async validation", {
    x: marginX, y: 3.95, w: 11.5, h: 0.6, fontFace: bodyFont, fontSize: 19, color: ICE, margin: 0,
  });
  slide.addShape(shapes.line, { x: marginX, y: 4.95, w: 6.3, h: 0, line: { color: NAVY2, width: 1.5 } });
  slide.addText(
    [
      { text: "Private equity · private credit · liquid ETFs", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Multi-region · illiquid + liquid · downstream of upstream", options: { breakLine: true, color: ICE, fontSize: 12.5 } },
      { text: "Engineering design review · June 2026", options: { color: "8AA0C6", fontSize: 11.5 } },
    ],
    { x: marginX, y: 5.1, w: 9, h: 1.1, fontFace: bodyFont, valign: "top", margin: 0, paraSpaceAfter: 4 }
  );
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Agenda", "How this hour runs", false);
  agenda(slide);
  deck.footer(slide, false);
}

deck.divider(1, "The problem", 0);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The system & the stakes", "What Atlas must do — and why structure is not a detail", false);
  slide.addText("One application to construct and govern funds across the full liquidity spectrum — and keep every decision auditable.", {
    x: marginX, y: 1.72, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 13.5, italic: true, color: MUTE, margin: 0,
  });
  const cardX = marginX, cardWidth = 5.7;
  card(slide, cardX, 2.35, cardWidth, 4.0, { edge: NAVY });
  slide.addText("What Atlas has to do", { x: cardX + 0.3, y: 2.5, w: cardWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
  const scope = [
    ["Span both worlds", "PE & private credit alongside liquid ETFs.", NAVY],
    ["Across regions", "NA, EMEA, APAC, LATAM — each its own appetite.", NAVY],
    ["Construct & govern", "Build books, enforce headroom, appetite, deal-state.", GREEN],
    ["Downstream of upstream", "Owns no source data; composes upstream answers.", AMBER],
  ];
  scope.forEach((item, index) => {
    const rowY = 3.0 + index * 0.82;
    slide.addShape(shapes.rectangle, { x: cardX + 0.3, y: rowY, w: 0.07, h: 0.66, fill: { color: item[2] } });
    slide.addText([
      { text: item[0] + "  ", options: { bold: true, fontSize: 13.5, color: INK } },
      { text: item[1], options: { fontSize: 12, color: "44516B" } },
    ], { x: cardX + 0.5, y: rowY, w: cardWidth - 0.8, h: 0.66, fontFace: bodyFont, valign: "middle", margin: 0 });
  });
  const rightX = cardX + cardWidth + 0.5, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.35, rightWidth, 4.0, { edge: GREEN });
  slide.addText("Why code structure decides it", { x: rightX + 0.3, y: 2.5, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: GREEN, margin: 0 });
  bullets(slide, rightX + 0.3, 3.0, rightWidth - 0.6, 2.2, [
    { text: "Traceability is first-class — answer not just “pass/fail” but “why, against what.”" },
    { text: "Validation is mostly async — rules read upstream exposure, appetite, deal & fund state." },
    { text: "The rule set only grows — new asset classes, regions and policies arrive continuously." },
  ], { fontSize: 13, gap: 11 });
  slide.addShape(shapes.line, { x: rightX + 0.3, y: 5.35, w: rightWidth - 0.6, h: 0, line: { color: LINE, width: 1 } });
  slide.addText([
    { text: "The risk we design against:  ", options: { bold: true, color: INK } },
    { text: "scattered async logic, rules that can’t be tested alone, and no record of why a commitment was accepted or rejected — the “Frankenstein” Atlas cannot afford.", options: { color: "44516B" } },
  ], { x: rightX + 0.3, y: 5.5, w: rightWidth - 0.6, h: 0.8, fontFace: bodyFont, fontSize: 12, valign: "top", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(true);
  titleBlock(slide, "The hinge", "Atlas validation is async and business-heavy", true);
  slide.addText("Take one operation — commit capital to a co-investment. Five of its six rules must read upstream state. That single fact decides the architecture.", {
    x: marginX, y: 1.7, w: slideWidth - 2 * marginX, h: 0.55, fontFace: bodyFont, fontSize: 14.5, color: ICE, margin: 0,
  });
  const rows = [
    ["1 · Structural shape", "No", "amount > 0, currency code, date, ids present", "808"],
    ["2 · Fund is Open", "Yes", "fund book of record", "up"],
    ["3 · Currency permitted", "Yes", "fund’s permitted-currency list", "up"],
    ["4 · Deal investable & matches", "Yes", "deal pipeline state + investable window", "up"],
    ["5 · Co-investment headroom", "Yes", "hierarchy node cap vs. already committed", "up"],
    ["6 · Within appetite", "Yes", "exposure engine + appetite policy store", "up"],
  ];
  const tableX = marginX, tableWidth = slideWidth - 2 * marginX, firstRowY = 2.28, rowHeight = 0.575;
  rows.forEach((row, index) => {
    const rowY = firstRowY + index * (rowHeight + 0.055);
    const isUpstream = row[3] === "up";
    slide.addShape(shapes.rectangle, { x: tableX, y: rowY, w: tableWidth, h: rowHeight, fill: { color: NAVY2 }, line: { color: "27406E", width: 1 } });
    slide.addText(row[0], { x: tableX + 0.25, y: rowY, w: 4.2, h: rowHeight, fontFace: bodyFont, fontSize: 14, bold: true, color: WHITE, valign: "middle", margin: 0 });
    chip(slide, tableX + 4.7, rowY + (rowHeight - 0.34) / 2, 1.55, isUpstream ? "ASYNC I/O" : "PURE", isUpstream ? AMBER : "44607F", isUpstream ? NAVY : WHITE);
    slide.addText(row[2], { x: tableX + 6.55, y: rowY, w: tableWidth - 6.8, h: rowHeight, fontFace: bodyFont, fontSize: 12.5, color: ICE, valign: "middle", margin: 0 });
  });
  slide.addText([
    { text: "DataAnnotations / IValidatableObject are synchronous. ", options: { bold: true, color: WHITE } },
    { text: "They cannot await any of rules 2–6 — so business validation cannot live there.", options: { color: GREEN } },
  ], { x: marginX, y: 6.5, w: slideWidth - 2 * marginX, h: 0.38, fontFace: bodyFont, fontSize: 13.5, align: "center", margin: 0 });
  deck.footer(slide, true);
}

deck.divider(2, "The classic ways", 1);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Classic approach 1 of 3", "Data Annotations + a fat async service", false);
  codeCard(slide, marginX, 2.0, 6.05, 4.3, [
    { text: "public sealed class CommitCapitalRequest {", kind: "keyword" },
    { text: "  [Required] public string FundId {get;set;}" },
    { text: "  [Range(1, max)] public decimal Amount {...}" },
    { text: "  [CurrencyCode] public string Currency {...}" },
    { text: "  [NotPastDate] public DateOnly Date {...}" },
    { text: "}" },
    { text: "" },
    { text: "// shape only. rules 2-6 need upstream, so:", kind: "comment" },
    { text: "await service.ValidateAndCommitAsync(req);", kind: "keyword" },
    { text: "//  -> Validator.TryValidateObject(...)", kind: "comment" },
    { text: "//  -> then a long if-chain of awaits", kind: "comment" },
  ], "Model/CommitCapitalRequest.cs + Validation/CommitCapitalService.cs");
  const rightX = marginX + 6.05 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 4.3, { edge: AMBER });
  slide.addText("The tell", { x: rightX + 0.28, y: 2.15, w: rightWidth - 0.5, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.28, 2.65, rightWidth - 0.55, 3.5, [
    "Split brain: shape in attributes, real rules in a service",
    "Attributes can’t await — business logic moves out anyway",
    "Attributes can’t take runtime context (the “today” hack)",
    "Business rules buried in an if-chain are hard to test alone",
    "No structured per-rule audit record",
  ], { fontSize: 12.5, gap: 8 });
  slide.addText("Scenario B: 2 / 2 errors · Scenario C: 10 / 10 — aggregates well, but only because the service was hand-written to.", { x: rightX + 0.28, y: 5.95, w: rightWidth - 0.55, h: 0.4, fontFace: bodyFont, fontSize: 10.5, italic: true, color: MUTE, valign: "top", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Classic approach 2 of 3", "Facade + adapter chaining (the DMS style)", false);
  codeCard(slide, marginX, 2.0, 6.05, 4.3, [
    { text: "// CommitmentFacade.SubmitCommitmentAsync", kind: "comment" },
    { text: "var pf  = await _funds.LoadAsync(id);" },
    { text: "_funds.EnsureOpen(pf);        // rule 2" },
    { text: "_funds.EnsureCurrency(pf, cur);// rule 3" },
    { text: "var deal = await _deals.LoadAsync(id);" },
    { text: "_deals.EnsureInvestable(deal, ...); // rule 4" },
    { text: "var node = await _coInv.LoadAsync(id);" },
    { text: "_coInv.EnsureHeadroom(node, ...);   // rule 5" },
    { text: "var ap = await _appetite             " },
    { text: "    .LoadForBucketAsync(...);  // -> ExposureGw" },
    { text: "_appetite.EnsureWithinLimit(ap, ...);// rule 6" },
  ], "856 lines · 12 files · for one operation");
  const rightX = marginX + 6.05 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 4.3, { edge: RED });
  slide.addText("The tell", { x: rightX + 0.28, y: 2.15, w: rightWidth - 0.5, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.28, 2.65, rightWidth - 0.55, 3.5, [
    "Deep chains: facade → gateway → gateway → client",
    "Six rules scattered across five files",
    "An upstream change ripples through the gateways",
    "First breach throws → you never see the rest",
    "Mock 3–4 layers just to test one rule",
  ], { fontSize: 12.5, gap: 8 });
  slide.addText("Scenario B: 1 / 2 errors — the appetite breach is lost to the short-circuit.", { x: rightX + 0.28, y: 5.95, w: rightWidth - 0.55, h: 0.4, fontFace: bodyFont, fontSize: 10.5, italic: true, color: RED, valign: "top", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The bloat", "One feature, two worlds — the layer cake", false);
  const leftX = marginX, leftWidth = 5.4, firstBarY = 2.35, barHeight = 0.4, barGap = 0.05;
  slide.addText("Classic N-tier — every feature pays the full tax", { x: leftX, y: 1.92, w: leftWidth, h: 0.32, fontFace: headerFont, fontSize: 13, bold: true, color: "9A3B36", margin: 0 });
  const classic = [
    "Controller (+ model binding)", "Request DTO + DataAnnotations", "Mapper  (DTO → domain)",
    "Service  (god orchestration)", "ValidatorFactory → Validator", "Repository ×4 (+ Entities + mappers)",
    "JSON config + config factory", "Adapter → upstream", "Mapper  (domain → response DTO)",
  ];
  classic.forEach((label, index) => {
    const barY = firstBarY + index * (barHeight + barGap);
    slide.addShape(shapes.rectangle, { x: leftX, y: barY, w: leftWidth, h: barHeight, fill: { color: "F4E4DB" }, line: { color: "E0C4B6", width: 0.75 } });
    slide.addText(label, { x: leftX + 0.16, y: barY, w: leftWidth - 0.3, h: barHeight, fontFace: bodyFont, fontSize: 11.5, color: "7A3B2E", valign: "middle", margin: 0 });
  });
  const rightX = marginX + leftWidth + 0.95, rightWidth = slideWidth - marginX - rightX;
  slide.addText("Functional — a command on a shared core", { x: rightX, y: 1.92, w: rightWidth, h: 0.32, fontFace: headerFont, fontSize: 13, bold: true, color: "1A7A57", margin: 0 });
  const functionalLayers = ["Command  (immutable record)", "Rules / Spec  (the business logic)", "Handler  (thin: validate → execute)", "Ports + owned Core  (written once)"];
  const firstBoxY = 2.5, boxHeight = 0.66, boxGap = 0.26;
  functionalLayers.forEach((label, index) => box(slide, rightX, firstBoxY + index * (boxHeight + boxGap), rightWidth, boxHeight, label, index === 3 ? NAVY : GREEN, WHITE));
  slide.addText([
    { text: "8 layers · 29 files per feature", options: { bold: true, color: "9A3B36" } },
    { text: "   vs   ", options: { color: MUTE } },
    { text: "3 files (command · spec · handler) on a core written once.", options: { bold: true, color: "1A7A57" } },
  ], { x: marginX, y: 6.55, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 11.5, align: "center", margin: 0 });
  deck.footer(slide, false);
}

deck.divider(3, "The functional core", 2);

{
  const slide = deck.newSlide(true);
  titleBlock(slide, "Zero libraries", "A functional core the team owns outright", true);
  slide.addText("Six core pieces + a declarative Spec — ~300 lines of plain C#. No FluentValidation. No MediatR. No Serilog. Nothing to be coupled to.", {
    x: marginX, y: 1.7, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 14.5, color: GREEN, margin: 0,
  });
  const pieces = [
    ["Result / Result<T>", "success, or a set of errors; Combine aggregates"],
    ["Error", "an error is data (code, message, field) — not an exception"],
    ["Rule<T>", "a named async rule as a value you can test & compose"],
    ["Validator<T>", "runs the rules, aggregates every error, builds the trace"],
    ["DecisionTrace", "trading-grade audit record → System.Text.Json"],
    ["CommandHandler<,>", "the pipeline: validate → (if approved) execute"],
  ];
  const cardWidth = (slideWidth - 2 * marginX - 0.4) / 2, cardHeight = 1.18, rowGap = 0.18;
  pieces.forEach((piece, index) => {
    const column = index % 2, row = Math.floor(index / 2);
    const cardX = marginX + column * (cardWidth + 0.4), cardY = 2.35 + row * (cardHeight + rowGap);
    slide.addShape(shapes.rectangle, { x: cardX, y: cardY, w: cardWidth, h: cardHeight, fill: { color: NAVY2 }, line: { color: "27406E", width: 1 } });
    slide.addShape(shapes.rectangle, { x: cardX, y: cardY, w: 0.09, h: cardHeight, fill: { color: GREEN } });
    slide.addText(piece[0], { x: cardX + 0.3, y: cardY + 0.16, w: cardWidth - 0.55, h: 0.4, fontFace: codeFont, fontSize: 15, bold: true, color: WHITE, margin: 0 });
    slide.addText(piece[1], { x: cardX + 0.3, y: cardY + 0.6, w: cardWidth - 0.55, h: 0.5, fontFace: bodyFont, fontSize: 12.5, color: ICE, valign: "top", margin: 0 });
  });
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Cleaner", "The same rule — buried vs. owned; errors are data", false);
  codeCard(slide, marginX, 1.9, 5.9, 3.95, [
    { text: "// rule 6 of 6, deep inside one Validate(),", kind: "comment" },
    { text: "// after 5 rules, on a prefetched _ctx:", kind: "comment" },
    { text: "var limit = _ctx.Limits.FirstOrDefault(l =>" },
    { text: "    l.AssetClass == input.AssetClass &&" },
    { text: "    l.Region == input.Region);" },
    { text: "if (limit is null)" },
    { text: '    result.AddError("No appetite configured…");' },
    { text: "else {" },
    { text: "  var c = _ctx.Exposure.CommittedIn(" },
    { text: "      input.AssetClass, input.Region);" },
    { text: "  if (c + input.Amount > limit.MaxAmount)" },
    { text: '    result.AddError("Appetite breach…"); }' },
  ], "Classic · a fragment in a ~180-line method");
  codeCard(slide, marginX + 5.9 + 0.35, 1.9, slideWidth - marginX - (marginX + 5.9 + 0.35), 3.95, [
    { text: "public static Rule<CommitCapitalCommand>", kind: "keyword" },
    { text: "CommitmentMustBeWithinAppetite(" },
    { text: "  IAppetiteClient appetite," },
    { text: "  IExposureClient exposure) => new(" },
    { text: '  Name: "CommitmentMustBeWithinAppetite",' },
    { text: "  Kind: RuleKind.Upstream," },
    { text: "  Check: async (cmd, ct) => {" },
    { text: "    var lim = (await appetite.GetLimitsAsync(" },
    { text: "      cmd.FundId, ct)).FirstOrDefault(…);" },
    { text: "    var c = (await exposure.GetExposureAsync(" },
    { text: "      cmd.FundId, ct)).CommittedIn(…);" },
    { text: "    return c + cmd.Amount > lim.MaxAmount" },
    { text: '      ? new Error("APPETITE_BREACH", …)' },
    { text: "      : Result.Success(); }));" },
  ], "Functional · its own file, fetches its own data");
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.95, { edge: GREEN });
  slide.addText([
    { text: "Identical logic. ", options: { bold: true, color: INK } },
    { text: "The functional rule is a named value you open, test, and reason about alone — and ", options: { color: "44516B" } },
    { text: "errors are values you aggregate", options: { bold: true, color: INK } },
    { text: ": Result / Error / Combine collect ALL of them — routable to a UI field, serializable into the audit record, never thrown, never swallowed.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.13, w: slideWidth - 2 * marginX - 0.6, h: 0.8, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Why it’s better", "Same request, same breaches — two different answers", false);
  codeCard(slide, marginX, 1.9, 5.95, 3.95, [
    { text: "// AdapterChaining · rules 2–6 share one try", kind: "comment" },
    { text: "try {", kind: "keyword" },
    { text: "  _funds.EnsureOpen(pf);          // rule 2" },
    { text: "  _coInv.EnsureHeadroom(node, amt);    // rule 5" },
    { text: "  //  headroom short → throws → STOP", kind: "comment" },
    { text: "  _appetite.EnsureWithinLimit(ap, …);  // rule 6" },
    { text: "  //  never runs → appetite breach unseen", kind: "comment" },
    { text: "}" },
    { text: "catch (CommitmentValidationException e) {", kind: "keyword" },
    { text: "  return Fail(e.Message);    // ONE message out" },
    { text: "}" },
  ], "Classic · first throw wins");
  codeCard(slide, marginX + 5.95 + 0.35, 1.9, slideWidth - marginX - (marginX + 5.95 + 0.35), 3.95, [
    { text: "// Validator · run every rule, then combine", kind: "comment" },
    { text: "var done = await Task.WhenAll(", kind: "keyword" },
    { text: "    _rules.Select(r => RunAsync(r, cmd, ct)));" },
    { text: "var result = Result.Combine(     // ALL errors" },
    { text: "    done.Select(e => e.Result));" },
    { text: "" },
    { text: "// a throwing rule becomes data — never a", kind: "comment" },
    { text: "// short-circuit that hides the others:", kind: "comment" },
    { text: "catch (Exception ex) =>", kind: "keyword" },
    { text: '    Result.Fail(new Error("RULE_THREW", …));' },
  ], "Functional · aggregate, never hide");
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.95, { edge: GREEN });
  slide.addText([
    { text: "Scenario B — headroom AND appetite breached:  ", options: { bold: true, color: INK } },
    { text: "the chain reports ", options: { color: "44516B" } },
    { text: "1 of 2", options: { bold: true, color: RED } },
    { text: "; the validator reports ", options: { color: "44516B" } },
    { text: "2 of 2", options: { bold: true, color: GREEN } },
    { text: " + a per-rule trace. Same inputs — `dotnet run` each sample to measure it.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.13, w: slideWidth - 2 * marginX - 0.6, h: 0.78, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(true);
  titleBlock(slide, "Traceability", "A decision trail, without a logging library", true);
  codeCard(slide, marginX, 2.0, 6.7, 4.3, [
    { text: "{" },
    { text: '  "CorrelationId": "SCN-B",' },
    { text: '  "Command": "CommitCapitalCommand",' },
    { text: '  "Entries": [' },
    { text: '    { "Rule": "CoInvestmentMustHaveHeadroom",' },
    { text: '      "Outcome": "Failed", "ElapsedMs": 5.9,' },
    { text: '      "Messages": ["[COINVEST_NO_HEADROOM] ..."] },' },
    { text: '    { "Rule": "CommitmentMustBeWithinAppetite",' },
    { text: '      "Outcome": "Failed", ... } ],' },
    { text: '  "Passed": 4, "Failed": 2, "Approved": false' },
    { text: "}" },
  ], "Core/DecisionTrace.cs · in-box System.Text.Json");
  const rightX = marginX + 6.7 + 0.4, rightWidth = slideWidth - marginX - rightX;
  slide.addText("For a trading audit", { x: rightX, y: 2.05, w: rightWidth, h: 0.4, fontFace: headerFont, fontSize: 17, bold: true, color: WHITE, margin: 0 });
  bullets(slide, rightX, 2.6, rightWidth, 3.6, [
    { text: "Every rule, its outcome, its timing, its messages", color: ICE },
    { text: "Answers “why was this accepted / rejected?”", color: ICE },
    { text: "Plain data — write it to a file, DB, event, or topic", color: ICE },
    { text: "You own the shape; no Serilog, no sink lock-in", color: ICE },
    { text: "Both breaches captured — nothing short-circuited", color: GREEN },
  ], { fontSize: 13.5, gap: 12 });
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The write", "After approval — ExecuteAsync is the only place that writes", false);
  codeCard(slide, marginX, 1.95, 6.2, 4.15, [
    { text: "// Core/CommandHandler.cs — execute runs ONLY if approved", kind: "comment" },
    { text: "var (validation, trace) = await", kind: "keyword" },
    { text: "    new Validator<T>(Rules(cmd))" },
    { text: "      .ValidateAsync(cmd, correlationId, ct);" },
    { text: "if (validation.IsFailure)" },
    { text: "    return Fail(validation.Errors, trace);  // no write" },
    { text: "var executed = await ExecuteAsync(cmd, ct); // ← the write" },
    { text: "return Ok(executed, trace);" },
  ], "validate → (only if approved) → execute");
  codeCard(slide, marginX + 6.2 + 0.35, 1.95, slideWidth - marginX - (marginX + 6.2 + 0.35), 4.15, [
    { text: "// CommitCapitalHandler.ExecuteAsync — the shape", kind: "comment" },
    { text: "protected override async Task<Result<Receipt>>", kind: "keyword" },
    { text: "ExecuteAsync(CommitCapitalCommand cmd, …) {" },
    { text: "  var key = cmd.IdempotencyKey();   // safe retries" },
    { text: "  var receipt = await commitments.RecordAsync(" },
    { text: "      cmd, key, expectedVersion, ct); // 409 → reject" },
    { text: "  await events.PublishAsync(" },
    { text: "      new CapitalCommitted(receipt), ct);" },
    { text: "  return Result.Success(receipt);" },
    { text: "}" },
  ], "one port write · idempotent · concurrency-checked · event");
  card(slide, marginX, 6.2, slideWidth - 2 * marginX, 0.82, { edge: AMBER });
  slide.addText([
    { text: "Validation + trace are the hard part — and they're proven. ", options: { bold: true, color: INK } },
    { text: "The demo upstream is read-only, so ExecuteAsync returns a receipt; in production it's a thin write behind a port (idempotency key, optimistic-concurrency check, emitted event). The rules and trace above don't change.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.28, w: slideWidth - 2 * marginX - 0.6, h: 0.66, fontFace: bodyFont, fontSize: 11, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

deck.divider(4, "Pluggable & scalable", 3);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "The seam", "Ports & adapters — the upstream is pluggable by design", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const port = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A4E8A", bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const adapter = (text: string): PptxGenJS.TableCell => ({ text, options: { color: INK, fontSize: 11, align: "left", valign: "middle" } });
  const upstream = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "44516B", fontSize: 11, align: "left", valign: "middle" } });
  const rows = [
    [head("Port — the stable contract"), head("Adapter today (swap me)"), head("Upstream")],
    [port("IFundClient"), adapter("DmsFundClient"), upstream("DMS")],
    [port("IDealClient"), adapter("CrmDealClient"), upstream("CRM")],
    [port("ICoInvestmentClient"), adapter("CrmCoInvestmentClient"), upstream("CRM")],
    [port("IAppetiteClient"), adapter("PolicyHubAppetiteClient"), upstream("PolicyHub")],
    [port("IExposureClient"), adapter("LedgerExposureClient"), upstream("Ledger")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 2.0, w: slideWidth - 2 * marginX, colW: [3.95, 4.7, 3.28],
    rowH: [0.46, 0.6, 0.6, 0.6, 0.6, 0.6], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.95, { edge: GREEN });
  slide.addText([
    { text: "Rules & handlers depend on the LEFT column only. ", options: { bold: true, color: INK } },
    { text: "Each adapter is the one file that knows its upstream's shape. Replace the CRM → X: a new adapter + one line at the composition root — the ports, rules and handlers never move.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.13, w: slideWidth - 2 * marginX - 0.6, h: 0.78, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Pluggable", "Swap an upstream in one line — nothing else moves", false);
  codeCard(slide, marginX, 1.95, 6.35, 4.15, [
    { text: "// Composition/ — the ONE place a source is named", kind: "comment" },
    { text: "public sealed class InMemoryUpstream : IUpstream {", kind: "keyword" },
    { text: "  public InMemoryUpstream() {" },
    { text: "    var data = SeedData.Build();" },
    { text: "    Funds    = new DmsFundClient(data);" },
    { text: "    Deals         = new CrmDealClient(data);" },
    { text: "    CoInvestments = new CrmCoInvestmentClient(data);" },
    { text: "    Appetite      = new PolicyHubAppetiteClient(data);" },
    { text: "    Exposure      = new LedgerExposureClient(data);" },
    { text: "    // tomorrow: Deals = new NextGenDealsClient(…);", kind: "comment" },
    { text: "  }                //          ↑ one line, done" },
    { text: "}" },
  ], "bind PORT ← SOURCE, in one place");
  codeCard(slide, marginX + 6.35 + 0.35, 1.95, slideWidth - marginX - (marginX + 6.35 + 0.35), 4.15, [
    { text: "// the stable contract a rule depends on:", kind: "comment" },
    { text: "public interface IFundClient {", kind: "keyword" },
    { text: "  Task<FundSnapshot?> GetFundAsync(" },
    { text: "    string id, CancellationToken ct = default);" },
    { text: "}" },
    { text: "" },
    { text: "// the ONLY file that knows the DMS shape:", kind: "comment" },
    { text: "public sealed class DmsFundClient(SeedData d)", kind: "keyword" },
    { text: "    : IFundClient {" },
    { text: "  public Task<FundSnapshot?> GetFundAsync(…)" },
    { text: "    // map DMS record → FundSnapshot (here)", kind: "comment" },
    { text: "    => …;" },
    { text: "}" },
  ], "port = contract · adapter = the only mapper");
  card(slide, marginX, 6.2, slideWidth - 2 * marginX, 0.82, { edge: GREEN });
  slide.addText([
    { text: "The port is the contract; the adapter is the only place that knows the upstream. ", options: { color: "44516B" } },
    { text: "Swap a source — one line. Rules and handlers compile unchanged.", options: { bold: true, color: INK } },
  ], { x: marginX + 0.3, y: 6.28, w: slideWidth - 2 * marginX - 0.6, h: 0.66, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Scalable", "A new feature reuses the whole core — add, don't rebuild", false);
  codeCard(slide, marginX, 1.95, 6.55, 4.15, [
    { text: "// a brand-new feature: deal-stage lifecycle", kind: "comment" },
    { text: "public sealed class AdvanceDealStageHandler(IUpstream up)", kind: "keyword" },
    { text: "  : CommandHandler<AdvanceDealStageCommand," },
    { text: "                   DealStageReceipt> {" },
    { text: "  protected override IEnumerable<Rule<…>> Rules(cmd) =>", kind: "keyword" },
    { text: "  [" },
    { text: "    AdvanceDealStageRules.Structural()," },
    { text: "    AdvanceDealStageRules.TransitionMustBeValid(up.Deals)," },
    { text: "  ];" },
    { text: "  protected override Task<Result<…>> ExecuteAsync(…)" },
    { text: "    => /* record the transition */;" },
    { text: "}" },
  ], "same CommandHandler<,>, Validator, DecisionTrace");
  codeCard(slide, marginX + 6.55 + 0.35, 1.95, slideWidth - marginX - (marginX + 6.55 + 0.35), 4.15, [
    { text: "// the lifecycle is DATA, not a switch tangle:", kind: "comment" },
    { text: "public static readonly IReadOnlyDictionary<", kind: "keyword" },
    { text: "  DealStatus, DealStatus[]> Allowed = new() {" },
    { text: "    [Pipeline]   = [Investable, Withdrawn]," },
    { text: "    [Investable] = [Closed, Withdrawn]," },
    { text: "    [Closed]     = []," },
    { text: "    [Withdrawn]  = []," },
    { text: "  };" },
    { text: "// add a stage or an edge here —", kind: "comment" },
    { text: "// command, rule and handler don't change.", kind: "comment" },
  ], "DealStageMachine — state machine as data");
  card(slide, marginX, 6.2, slideWidth - 2 * marginX, 0.82, { edge: GREEN });
  slide.addText([
    { text: "Second feature = +1 command, +2 rules, +1 handler. ", options: { bold: true, color: INK } },
    { text: "Zero changes to the Core, the Validator or the DecisionTrace. The pattern scales by adding pieces, never by editing shared ones.", options: { color: "44516B" } },
  ], { x: marginX + 0.3, y: 6.28, w: slideWidth - 2 * marginX - 0.6, h: 0.66, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Scalable", "One generic pipeline — adding a rule is +1 file, +1 line", false);
  codeCard(slide, marginX, 1.98, 6.6, 4.5, [
    { text: "public abstract class", kind: "keyword" },
    { text: "CommandHandler<TCommand, TResult>" },
    { text: "{" },
    { text: "  // a feature implements exactly these two:", kind: "comment" },
    { text: "  protected abstract IEnumerable<Rule<TCommand>>" },
    { text: "      Rules(TCommand command);" },
    { text: "  protected abstract Task<Result<TResult>>" },
    { text: "      ExecuteAsync(TCommand cmd, CancellationToken ct);" },
    { text: "" },
    { text: "  public async Task<HandlerOutcome<TResult>>" },
    { text: "  HandleAsync(TCommand cmd, string? cid = null, …) {" },
    { text: "    var (result, trace) = await" },
    { text: "      new Validator<TCommand>(Rules(cmd))" },
    { text: "        .ValidateAsync(cmd, cid ??= NewId(), ct);" },
    { text: "    if (result.IsFailure) return Fail(result, trace);" },
    { text: "    return Ok(await ExecuteAsync(cmd, ct), trace);" },
    { text: "  }" },
    { text: "}" },
  ], "Core/CommandHandler.cs — written once, reused by every command");
  const rightX = marginX + 6.6 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 1.98, rightWidth, 2.55, { edge: GREEN });
  slide.addText("Written once. Reused everywhere.", { x: rightX + 0.28, y: 2.12, w: rightWidth - 0.5, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.28, 2.6, rightWidth - 0.55, 1.85, [
    "Generic over <TCommand, TResult> — feature-agnostic",
    "A new command = a record + its rules + the two methods",
    "validate → aggregate → trace is amortized across the app",
  ], { fontSize: 12, gap: 7 });
  card(slide, rightX, 4.7, rightWidth, 1.78, { edge: AMBER });
  slide.addText("Adding a rule scales linearly", { x: rightX + 0.28, y: 4.84, w: rightWidth - 0.5, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  slide.addText([
    { text: "Functional: +1 file, +1 line. ", options: { bold: true, color: GREEN } },
    { text: "The classic styles edit shared code — a new attribute + service branch, a new gateway + facade edit, or another branch in the ~180-line method. ", options: { color: "44516B" } },
    { text: "Additive (O(1)) vs. editing shared code (O(n) risk)", options: { bold: true, color: INK } },
    { text: " — the gap compounds as the rule set grows.", options: { color: "44516B" } },
  ], { x: rightX + 0.28, y: 5.3, w: rightWidth - 0.56, h: 1.1, fontFace: bodyFont, fontSize: 11.5, valign: "top", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Scalable · 5-year", "Adding anything stays contained — the axes of change", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12, align: "left", valign: "middle" } });
  const change = (text: string): PptxGenJS.TableCell => ({ text, options: { color: INK, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const good = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A7A57", fontSize: 11, align: "left", valign: "middle" } });
  const bad = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", fontSize: 11, align: "left", valign: "middle" } });
  const rows = [
    [head("When you need to…"), head("Functional — additive (one seam)"), head("Classic — rippling (many places)")],
    [change("Add an upstream source (CRM → X)"), good("one adapter behind the port"), bad("rewire gateways + facade + mappers")],
    [change("Change a model / contract field"), good("one record — compiler finds every use"), bad("hunt across DTOs, mappers, adapters")],
    [change("Add or change a business rule"), good("+1 rule file, +1 line in the handler"), bad("edit the ~180-line method / the facade")],
    [change("Add a whole new command / feature"), good("command + rules + handler, reuse Core"), bad("new orchestration, copy the plumbing")],
    [change("Add a UI view or element"), good("register a slice / panel (data)"), bad("edit god components & layouts")],
    [change("Add a policy / language / limit"), good("change data (tokens · i18n · appetite)"), bad("change code + redeploy")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 1.95, w: slideWidth - 2 * marginX, colW: [3.7, 4.2, 4.03],
    rowH: [0.42, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  slide.addText([
    { text: "Functional growth is additive — touch one seam. ", options: { bold: true, color: INK } },
    { text: "Classic growth is multiplicative — touch many. Repeated across five years of changes, that gap is what keeps the app shipping fast.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.45, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 11.5, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Flexibility", "A common agreement on structure — not a cage", false);
  card(slide, marginX, 1.98, 5.5, 4.4, { edge: GREEN });
  slide.addText("The whole agreement (the seams)", { x: marginX + 0.3, y: 2.14, w: 5.0, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, marginX + 0.3, 2.66, 4.95, 3.6, [
    "A command is just data in.",
    "A rule returns Result — pass, or errors (as values).",
    "A handler = which rules + what to do on success.",
    "Errors aggregate; the decision trace is automatic.",
    "~300 lines you own — change it if it doesn't fit.",
  ], { fontSize: 12.5, gap: 11 });
  codeCard(slide, marginX + 5.5 + 0.4, 1.98, slideWidth - marginX - (marginX + 5.5 + 0.4), 4.4, [
    { text: "// inside a rule: any algorithm, any shape,", kind: "comment" },
    { text: "// sync or async, 0..N upstreams — your call.", kind: "comment" },
    { text: "Check: async (cmd, ct) =>" },
    { text: "{" },
    { text: "  var book = await exposure" },
    { text: "      .GetExposureAsync(cmd.FundId, ct);" },
    { text: "  var tier = cmd.Amount switch {     // branch freely" },
    { text: "    <  5_000_000m => Tier.Small," },
    { text: "    < 25_000_000m => Tier.Mid," },
    { text: "    _             => Tier.Large };" },
    { text: "  var cap = Policy.Cap(tier, cmd.AssetClass);" },
    { text: "  return book.CommittedIn(…) + cmd.Amount <= cap" },
    { text: "    ? Result.Success()" },
    { text: '    : new Error("CONCENTRATION", …);' },
    { text: "}" },
  ], "Inside a rule — your logic, your way");
  slide.addText([
    { text: "The agreement is the shape, not the logic. ", options: { bold: true, color: INK } },
    { text: "Inside a rule (and inside ExecuteAsync) you write whatever the domain needs — same freedom as today, with a structure the team shares and owns.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.5, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 11.5, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Not a silver bullet", "Right tool for the job — what each pattern does best", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11, align: "left", valign: "middle" } });
  const job = (text: string): PptxGenJS.TableCell => ({ text, options: { color: INK, bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const pattern = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "1A4E8A", bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const why = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "44516B", fontSize: 9.5, align: "left", valign: "middle" } });
  const rows = [
    [head("The job"), head("Best handled by"), head("Why"), head("In Atlas")],
    [job("Wire-format shape (required, range, length, regex)"), pattern("Data Annotations"), why("declarative, auto-run on model binding, shows in OpenAPI"), why("API DTOs")],
    [job("Isolate a volatile upstream API"), pattern("Adapter (ports & adapters)"), why("one seam absorbs a supplier’s change"), why("Sources/ adapters")],
    [job("An immutable message / intent"), pattern("record"), why("value equality, pattern-match, trivial to construct & test"), why("every Command")],
    [job("Async business policy (aggregate + audit)"), pattern("Functional command + Rule<T>"), why("errors as values, all in one pass, per-rule trace"), why("CommitCapital")],
    [job("A lifecycle / legal transitions"), pattern("Command + transition map as data"), why("moves are data, not scattered if/else"), why("deal-stage machine")],
    [job("Simple CRUD, no real policy"), pattern("Classic layered + annotations"), why("don’t over-engineer; the team already knows it"), why("shape-only endpoints")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 1.95, w: slideWidth - 2 * marginX, colW: [3.5, 2.95, 3.6, 1.88],
    rowH: [0.42, 0.68, 0.68, 0.6, 0.64, 0.64, 0.58], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  slide.addText([
    { text: "We’re not proposing “functional everywhere.” ", options: { bold: true, color: INK } },
    { text: "Keep Data Annotations and adapters where they’re strong; add the command pattern only where async policy + audit demand it — that judgement is the point.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.55, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 11.5, align: "center", margin: 0 });
  deck.footer(slide, false);
}

deck.divider(5, "Proof & trade-offs", 4);

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "By the numbers", "Soft adjectives replaced with figures you can re-measure", false);
  const stats = [
    ["2", "files to add a rule — 1 new + 1 line; the classic styles edit shared code", GREEN],
    ["1 vs 3", "stubs to unit-test a rule vs a chained adapter (rule 6 needs 3 collaborators)", GREEN],
    ["183 → 30", "LOC: the one validator method vs one rule — 23 branches → ≤5, depth 3 → 1", NAVY],
    ["2·10 / 1·4", "errors surfaced per request (scenarios B·C): functional vs the classic chain", GREEN],
    ["469", "LOC of owned core · 7 files · 0 third-party deps", NAVY],
    ["23", "tests green — each rule in isolation, end-to-end & traced", GREEN],
  ];
  const columns = 3, gap = 0.3, cardWidth = (slideWidth - 2 * marginX - (columns - 1) * gap) / columns, cardHeight = 1.78;
  stats.forEach((stat, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    const cardX = marginX + column * (cardWidth + gap), cardY = 2.05 + row * (cardHeight + 0.28);
    card(slide, cardX, cardY, cardWidth, cardHeight, { edge: stat[2] });
    slide.addText(stat[0], { x: cardX + 0.25, y: cardY + 0.16, w: cardWidth - 0.5, h: 0.72, fontFace: headerFont, fontSize: 29, bold: true, color: stat[2], margin: 0 });
    slide.addText(stat[1], { x: cardX + 0.25, y: cardY + 0.9, w: cardWidth - 0.5, h: cardHeight - 1.0, fontFace: bodyFont, fontSize: 11, color: "44516B", valign: "top", margin: 0 });
  });
  slide.addText([
    { text: "Re-measurable on the spot: ", options: { bold: true, color: INK } },
    { text: "`dotnet test` · `wc -l` · the four sample runs. The headline is completeness: every breach, every time.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.2, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 12, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Operability", "Will it survive production? — the questions before sign-off", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 12, valign: "middle" } });
  const concern = (text: string): PptxGenJS.TableCell => ({ text, options: { color: INK, bold: true, fontSize: 11.5, valign: "middle" } });
  const answer = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "44516B", fontSize: 11, valign: "middle" } });
  const rows = [
    [head("Production concern"), head("How it is answered — and where it lives")],
    [concern("Partial upstream failure"), answer("Fail-closed; a throwing rule becomes a recorded RULE_THREW error (never hides the others). Retry / circuit-breaker live behind the port.")],
    [concern("Per-command deadline"), answer("Wrap validation in a linked CancellationTokenSource(timeout) — the token is already threaded into every rule.")],
    [concern("Validate-then-execute race"), answer("The write is the source of truth: ExecuteAsync commits under optimistic concurrency (version check) and rejects on conflict. Validation is the pre-check.")],
    [concern("Authorization"), answer("An early rule (or a pre-handler step) rejects a forbidden caller before the upstream fan-out.")],
    [concern("Observability"), answer("Emit Activity spans + Meter counters — in-box BCL, not Serilog. DecisionTrace is the audit record; OpenTelemetry is the live telemetry.")],
    [concern("Command & contract versioning"), answer("Records evolve additively (add fields); old DecisionTraces stay readable; nothing breaks on the wire.")],
  ];
  slide.addTable(rows, {
    x: marginX, y: 1.95, w: slideWidth - 2 * marginX, colW: [3.3, 8.63],
    rowH: [0.42, 0.66, 0.6, 0.74, 0.56, 0.66, 0.66], border: { type: "solid", pt: 0.5, color: LINE },
    fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false,
  });
  slide.addText([
    { text: "When NOT to reach for this: ", options: { bold: true, color: AMBER } },
    { text: "shape-only CRUD / document metadata — keep DataAnnotations. This pattern earns its keep when validation is async business policy.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.5, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 11.5, italic: true, margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Two styles, one core", "Declarative validators — without a library", false);
  codeCard(slide, marginX, 1.98, 5.9, 4.3, [
    { text: "// ValidatorFactory: one big Validate(...)", kind: "comment" },
    { text: "public ValidationResult Validate(Input x) {" },
    { text: "  var r = new ValidationResult();" },
    { text: "  if (string.IsNullOrWhiteSpace(x.FundId))" },
    { text: "    r.AddError(\"FundId required\");" },
    { text: "  if (x.Amount <= 0)" },
    { text: "    r.AddError(\"Amount must be > 0\");" },
    { text: "  // …+ 6 more rules, nested ifs, ordering traps…", kind: "comment" },
    { text: "  return r;" },
    { text: "}" },
  ], "Classic · one imperative method");
  codeCard(slide, marginX + 5.9 + 0.35, 1.98, slideWidth - marginX - (marginX + 5.9 + 0.35), 4.3, [
    { text: "using …Commands.Core;  // yours, ~470 LOC", kind: "comment" },
    { text: "public sealed class CommitCapitalSpec" },
    { text: "  : Spec<CommitCapitalCommand> {" },
    { text: "  public CommitCapitalSpec(IUpstream up," },
    { text: "                           DateOnly today) {" },
    { text: "    RuleFor(x => x.Currency).Length(3);" },
    { text: "    RuleFor(x => x.Amount).GreaterThan(0m);" },
    { text: "    RuleFor(x => x.CommitmentDate)" },
    { text: "      .Must(d => d >= today, \"DATE_IN_PAST\", …);" },
    { text: "    // async is first-class — and every rule is traced:", kind: "comment" },
    { text: "    Add(CommitCapitalRules" },
    { text: "        .FundMustBeOpen(up.Funds));" },
    { text: "  }" },
    { text: "}" },
  ], "Atlas · owned Spec<T> — no library, async-native");
  slide.addText([
    { text: "Same declarative readability — on the owned ~470-line core.", options: { bold: true, color: INK } },
    { text: " Async-native, and every rule still flows into the Validator + DecisionTrace. No FluentValidation, no library.", options: { color: "44516B" } },
  ], { x: marginX, y: 6.45, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 12, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Testability", "Test one rule — fake five clients, or write four lines", false);
  codeCard(slide, marginX, 1.9, 5.95, 3.95, [
    { text: "// Classic: rule 5 isn’t a unit — you build", kind: "comment" },
    { text: "// the service over a full fake upstream:", kind: "comment" },
    { text: "var up = new FakeUpstream {", kind: "keyword" },
    { text: "  Funds = open, Deals = ok," },
    { text: "  CoInvestments = noHeadroom,        // the one" },
    { text: "  Appetite = lim, Exposure = ex };   // under test" },
    { text: "var svc = new CommitCapitalService(up);", kind: "keyword" },
    { text: "var r = await svc.ValidateAndCommitAsync(req);" },
    { text: "// then dig through a List<string>:", kind: "comment" },
    { text: "Assert.Contains(r.Errors, m =>", kind: "keyword" },
    { text: '  m.Contains("headroom"));' },
  ], "Classic · whole service, full fake upstream");
  codeCard(slide, marginX + 5.95 + 0.35, 1.9, slideWidth - marginX - (marginX + 5.95 + 0.35), 3.95, [
    { text: "// Functional: the entire “mock” — no Moq", kind: "comment" },
    { text: "sealed class StubCoInv(CoInvestmentNode? n)", kind: "keyword" },
    { text: "  : ICoInvestmentClient {" },
    { text: "  public Task<CoInvestmentNode?> GetNodeAsync(" },
    { text: "    string id, CancellationToken ct = default)" },
    { text: "      => Task.FromResult(n); }" },
    { text: "" },
    { text: "[Fact] public async Task Fails_no_headroom(){", kind: "keyword" },
    { text: "  var rule = CoInvestmentMustHaveHeadroom(" },
    { text: "      new StubCoInv(shortNode));" },
    { text: "  var r = await rule.Check(Cmd(), default);" },
    { text: '  Assert.Equal("COINVEST_NO_HEADROOM",' },
    { text: "    r.Errors[0].Code); }" },
  ], "Functional · one rule, one 4-line stub");
  card(slide, marginX, 6.05, slideWidth - 2 * marginX, 0.95, { edge: GREEN });
  slide.addText([
    { text: "A rule needs only its own port → its stub is four lines. ", options: { bold: true, color: INK } },
    { text: "No mock library, no layered fixtures — the same anti-coupling principle, applied to tests. ", options: { color: "44516B" } },
    { text: "23 green.", options: { bold: true, color: GREEN } },
  ], { x: marginX + 0.3, y: 6.13, w: slideWidth - 2 * marginX - 0.6, h: 0.78, fontFace: bodyFont, fontSize: 11.5, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, 'Industry backing', 'Microsoft — and Uncle Bob — back this', false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: 'left', valign: 'middle' } });
  const guidance = (text: string): PptxGenJS.TableCell => ({ text, options: { color: INK, fontSize: 10, italic: true, align: 'left', valign: 'middle' } });
  const atlas = (text: string): PptxGenJS.TableCell => ({ text, options: { color: '1A7A57', fontSize: 10.5, align: 'left', valign: 'middle' } });
  const rows = [
    [head('Microsoft Learn guidance (verbatim)'), head('How Atlas does it')],
    [guidance('"infrastructure and implementation details depend on the Application Core … the Application Core has no dependencies … very easy to write automated unit tests."  — Clean Architecture'), atlas('the owned Core + Ports / Sources / Composition; a rule is tested with a one-line stub')],
    [guidance('Traditional N-layer: "the BLL … is dependent on data access implementation details … Testing business logic … is often difficult, requiring a test database."'), atlas('inverted: rules depend on ports, never on CRM or a database')],
    [guidance('"new behavior [implemented] as new classes, rather than … adding responsibility … Adding new classes is always safer than changing existing classes."  — Single Responsibility'), atlas('add a rule = +1 file, +1 line; nothing existing changes')],
    [guidance('"a specific command handler class for each command … the application layer must only coordinate … must not hold … domain state."  — CQRS / DDD'), atlas('CommandHandler<,>: validate → execute; the logic lives in rules')],
  ];
  slide.addTable(rows, { x: marginX, y: 1.92, w: slideWidth - 2 * marginX, colW: [7.55, 4.38], rowH: [0.4, 0.95, 0.95, 0.95, 0.95], border: { type: 'solid', pt: 0.5, color: LINE }, fill: { color: 'FFFFFF' }, fontFace: bodyFont, valign: 'middle', autoPage: false });
  slide.addText([
    { text: 'This is Microsoft’s documented recommendation for maintainable .NET ', options: { bold: true, color: INK } },
    { text: '(records over attribute-decorated DTOs, too — "persistence ignorance"). Same shapes, no libraries — and R.C. Martin’s “Functional Design” + “The Clean Coder” argue the same: FP + SOLID + TDD scale.', options: { color: '44516B' } },
  ], { x: marginX, y: 6.4, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 11, align: 'center', margin: 0 });
  slide.addNotes('Sources (Microsoft Learn): "Common web application architectures" — learn.microsoft.com/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures (N-layer critique + Clean Architecture; cites Robert C. Martin, "The Clean Architecture"). "Architectural principles" — .../modern-web-apps-azure/architectural-principles. "Implementing the microservice application layer using the Web API" — .../microservices/microservice-ddd-cqrs-patterns/microservice-application-layer-implementation-web-api. Also: R.C. Martin, "Functional Design" (2023) — FP + SOLID + patterns = more scalable systems; "The Clean Coder" (2011) — TDD as a minimum discipline.');
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(false);
  titleBlock(slide, "Honest trade-offs", "What adopting this costs — and why we think it's worth it", false);
  const head = (text: string): PptxGenJS.TableCell => ({ text, options: { fill: { color: NAVY }, color: WHITE, bold: true, fontSize: 11.5, align: "left", valign: "middle" } });
  const cost = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "9A3B36", bold: true, fontSize: 10.5, align: "left", valign: "middle" } });
  const mitigation = (text: string): PptxGenJS.TableCell => ({ text, options: { color: "44516B", fontSize: 10.5, align: "left", valign: "middle" } });
  const rows = [
    [head("The cost (real)"), head("Why we think it's worth it")],
    [cost("Learning curve — Result / rules is new to an OO team; smaller hiring pool"), mitigation("still plain C#; the core is ~300 lines read in an afternoon; a rule is simpler than the ~180-line method it replaces")],
    [cost("You own the framework — no vendor to file bugs against"), mitigation("~300 lines, fully tested; you'd own a FluentValidation / MediatR wrapper anyway — and carry zero new CVE / supply-chain surface")],
    [cost("More concepts up front — Command · Result · Rule · Spec"), mitigation("overkill for shape-only CRUD — keep DataAnnotations there; this earns its keep on async business policy")],
    [cost("Up-front structure — you design the seams first"), mitigation("a little more ceremony for the first slice; it pays back on every slice after, as the app grows")],
    [cost("Fewer ready examples than mainstream MVC + EF + FluentValidation"), mitigation("the pattern itself is mainstream (Microsoft + Clean Architecture); this repo is the team's worked template")],
    [cost("Discipline required — two rule styles can fragment; no silver bullet"), mitigation("one agreed style per area, enforced in review; the DecisionTrace makes drift visible")],
  ];
  slide.addTable(rows, { x: marginX, y: 1.92, w: slideWidth - 2 * marginX, colW: [5.4, 6.53], rowH: [0.4, 0.72, 0.72, 0.66, 0.66, 0.66, 0.66], border: { type: "solid", pt: 0.5, color: LINE }, fill: { color: "FFFFFF" }, fontFace: bodyFont, valign: "middle", autoPage: false });
  slide.addText("We're not selling a silver bullet — these are the real costs. For shape-only CRUD the classic stack is fine; for Atlas's async, ever-changing policy the flexibility, traceability and modularity outweigh them.", { x: marginX, y: 6.55, w: slideWidth - 2 * marginX, h: 0.45, fontFace: bodyFont, fontSize: 11, italic: true, color: MUTE, align: "center", margin: 0 });
  deck.footer(slide, false);
}

{
  const slide = deck.newSlide(true);
  titleBlock(slide, "The blueprint", "Built to grow for 5+ years — without coupling to a single package", true);
  const flow = [
    ["Upstreams", "CRM·DMS·Ledger·PolicyHub"],
    ["Ports", "stable contracts"],
    ["Commands + Rules", "owned core, no libs"],
    ["API", "thin, result-based"],
  ];
  const stepCount = flow.length, boxWidth = 2.16, boxGap = (slideWidth - 2 * marginX - stepCount * boxWidth) / (stepCount - 1), boxY = 2.4, boxHeight = 1.05;
  flow.forEach((step, index) => {
    const boxX = marginX + index * (boxWidth + boxGap);
    slide.addShape(shapes.roundedRectangle, { x: boxX, y: boxY, w: boxWidth, h: boxHeight, rectRadius: 0.07, fill: { color: index === 2 ? GREEN : NAVY2 }, line: { color: "27406E", width: 1 } });
    slide.addText([
      { text: step[0], options: { breakLine: true, bold: true, fontSize: 13, color: WHITE } },
      { text: step[1], options: { fontSize: 9, color: index === 2 ? "E6FFF5" : ICE } },
    ], { x: boxX + 0.06, y: boxY, w: boxWidth - 0.12, h: boxHeight, fontFace: bodyFont, align: "center", valign: "middle", margin: 0 });
    if (index < stepCount - 1) slide.addShape(shapes.line, { x: boxX + boxWidth, y: boxY + boxHeight / 2, w: boxGap, h: 0, line: { color: "6E83A8", width: 2, endArrowType: "triangle" } });
  });
  const badges = ["Configurable", "Testable", "Loggable", "Scalable"];
  const badgeWidth = 2.6, badgeGap = (slideWidth - 2 * marginX - 4 * badgeWidth) / 3, badgeY = 3.85;
  badges.forEach((badge, index) => {
    const badgeX = marginX + index * (badgeWidth + badgeGap);
    slide.addShape(shapes.roundedRectangle, { x: badgeX, y: badgeY, w: badgeWidth, h: 0.62, rectRadius: 0.31, fill: { color: NAVY2 }, line: { color: GREEN, width: 1.2 } });
    slide.addText(badge, { x: badgeX, y: badgeY, w: badgeWidth, h: 0.62, fontFace: headerFont, fontSize: 14, bold: true, color: GREEN, align: "center", valign: "middle", margin: 0 });
  });
  const pillars = [
    ["Result-based returns", "outcomes are values aggregated into one response — nothing thrown, nothing swallowed."],
    ["Asynchronous processing", "rules are async by design — they call upstream directly; no sync-over-async contortions."],
    ["Scoped logic", "one rule = one file = one concern; every change is contained, never rippled."],
    ["Better testing", "each rule a pure unit, one stub, no mocking library — 23 tests, each rule alone."],
    ["Better logging", "every command emits a structured DecisionTrace — trading-grade audit, no Serilog."],
  ];
  const firstPillarY = 4.75, rowHeight = 0.43;
  pillars.forEach((pillar, index) => {
    const rowY = firstPillarY + index * rowHeight;
    slide.addShape(shapes.rectangle, { x: marginX, y: rowY + 0.07, w: 0.28, h: 0.28, fill: { color: GREEN } });
    slide.addText(String(index + 1), { x: marginX, y: rowY + 0.07, w: 0.28, h: 0.28, fontFace: headerFont, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    slide.addText([
      { text: pillar[0] + "   ", options: { bold: true, fontSize: 12.5, color: WHITE, fontFace: headerFont } },
      { text: pillar[1], options: { fontSize: 11.5, color: ICE } },
    ], { x: marginX + 0.45, y: rowY, w: slideWidth - 2 * marginX - 0.45, h: rowHeight, fontFace: bodyFont, valign: "middle", margin: 0 });
  });
  deck.footer(slide, true);
}

{
  const slide = deck.newSlide(true);
  slide.addShape(shapes.rectangle, { x: marginX, y: 1.5, w: 0.9, h: 0.16, fill: { color: GREEN } });
  slide.addText("The recommendation", { x: marginX, y: 1.85, w: 11, h: 0.4, fontFace: bodyFont, fontSize: 14, bold: true, color: GREEN, charSpacing: 2, margin: 0 });
  slide.addText("Build Atlas on functional commands\nwith async validation.", { x: marginX, y: 2.3, w: 11.8, h: 1.6, fontFace: headerFont, fontSize: 36, bold: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.0 });
  slide.addText("Atlas becomes our reference app for shipping in an ever-changing data world — built on flexibility, traceability and modularity. Spend our attention on business logic, not on chaining code and nested ifs. Same .NET, no new libraries, fully testable, audit-ready.", {
    x: marginX, y: 4.05, w: 11.2, h: 0.9, fontFace: bodyFont, fontSize: 16, color: ICE, margin: 0,
  });
  card(slide, marginX, 5.15, slideWidth - 2 * marginX, 1.15, { fill: NAVY2, border: "27406E", shadow: true });
  slide.addText([
    { text: "Run the proof:  ", options: { bold: true, color: GREEN } },
    { text: "dotnet test  ·  dotnet run --project src/Atlas.Functional.Commands.Demo", options: { fontFace: codeFont, color: ICE } },
    { text: "   — four samples, one operation, 23 green tests.", options: { color: "8AA0C6" } },
  ], { x: marginX + 0.3, y: 5.3, w: slideWidth - 2 * marginX - 0.6, h: 0.85, fontFace: bodyFont, fontSize: 13.5, valign: "middle", margin: 0 });
  deck.footer(slide, true);
}

await deck.write("Atlas-Backend.pptx");
