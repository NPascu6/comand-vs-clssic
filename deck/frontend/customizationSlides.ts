import { AMBER, bodyFont, bullets, card, codeCard, codeFont, Deck, GREEN, headerFont, INK, LINE, marginX, MUTE, NAVY, slideWidth, titleBlock, WHITE } from "../deck.ts";

const LEVELS = [
  ["Level 1 — props", NAVY, "variant · tone · size · state. The supported surface, proven by a story in 15 palettes. The answer almost every time; a missing shape is a prop here, not a style at the call site."],
  ["Level 2 — slots", GREEN, "30 components name their parts. Replace one, or compose the component into a domain one — FundActionButton passes slots to Button and never copies its source, so it keeps tracking the tokens."],
  ["Level 3 — className", AMBER, "On the root or on a named part, via slotProps. Deliberately exceptional: a print rule, a third-party anchor. A class name, never a style object."],
] as const;

export function customizationSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Customization", "Three levels — and no sx, on purpose", false);
  codeCard(slide, marginX, 2.0, 6.4, 4.35, [
    { text: "// 1 — the component API: what the system supports", kind: "comment" },
    { text: "<Button variant=\"soft\" tone=\"danger\" size=\"sm\" />", kind: "keyword" },
    { text: "" },
    { text: "// 2 — slots: replace a documented part, don't fork", kind: "comment" },
    { text: "<Panel title={title} slots={{", kind: "keyword" },
    { text: "  actions: <ToggleGroup … />," },
    { text: "  footer:  <Meter value={used} max={cap} tone=\"auto\" />," },
    { text: "}} />" },
    { text: "" },
    { text: "// 3 — className: the exceptional escape hatch", kind: "comment" },
    { text: "<Card className=\"print-page-break\"", kind: "keyword" },
    { text: "      slotProps={{ body: { className: 'scroll-region' } }} />" },
    { text: "" },
    { text: "// there is no level 4: sx is not on any public prop", kind: "comment" },
  ], "levels 1 → 3, in order of preference");
  const rightX = marginX + 6.4 + 0.4, rightWidth = slideWidth - marginX - rightX;
  const levelHeight = 1.35, levelGap = 0.15;
  LEVELS.forEach(([heading, edge, body], index) => {
    const levelY = 2.0 + index * (levelHeight + levelGap);
    card(slide, rightX, levelY, rightWidth, levelHeight, { edge });
    slide.addText(heading, { x: rightX + 0.28, y: levelY + 0.14, w: rightWidth - 0.5, h: 0.32, fontFace: headerFont, fontSize: 14, bold: true, color: INK, margin: 0 });
    slide.addText(body, { x: rightX + 0.28, y: levelY + 0.5, w: rightWidth - 0.5, h: levelHeight - 0.62, fontFace: bodyFont, fontSize: 11.5, color: "44516B", valign: "top", margin: 0 });
  });
  card(slide, marginX, 6.45, slideWidth - 2 * marginX, 0.58, { fill: NAVY, shadow: true });
  slide.addText([
    { text: "Why no sx:  ", options: { bold: true, color: GREEN } },
    { text: "it is MUI's styling language, so a call site using it is coupled to the library core exists to hide — and it lets any screen invent a colour or a spacing the tokens never approved. className says the same thing without either cost.", options: { color: WHITE } },
  ], { x: marginX + 0.3, y: 6.45, w: slideWidth - 2 * marginX - 0.6, h: 0.58, fontFace: bodyFont, fontSize: 12, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}

export function theRuleSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "The rule", "The app holds behaviour — core holds the pixels", false);
  slide.addText("A slice is business logic: a command, a client, rules, state, and its own domain components composed from core. Every visual decision it makes is a core prop, and every core prop is backed by a token.", {
    x: marginX, y: 1.68, w: slideWidth - 2 * marginX, h: 0.4, fontFace: bodyFont, fontSize: 13, italic: true, color: MUTE, margin: 0,
  });
  codeCard(slide, marginX, 2.1, 7.0, 4.1, [
    { text: "// BEFORE — presentation smeared through business code", kind: "comment" },
    { text: "<Box sx={{ minWidth: 0 }}>" },
    { text: "  <Stack direction=\"row\" sx={{ alignItems: 'center'," },
    { text: "      justifyContent: 'space-between', gap: 1.5 }}>" },
    { text: "    <Typography variant=\"caption\"" },
    { text: "        color=\"text.secondary\">{label}</Typography>" },
    { text: "    <Card edge=\"green\" sx={{ p: 2, height: '100%' }}>" },
    { text: "" },
    { text: "// AFTER — every visual decision is a core prop", kind: "comment" },
    { text: "<Split gap=\"sm\">", kind: "keyword" },
    { text: "  <Text variant=\"caption\" tone=\"muted\">{label}</Text>", kind: "keyword" },
    { text: "  <Card tone=\"success\" padding=\"md\" fill>", kind: "keyword" },
    { text: "" },
    { text: "// the only literals left in the file are business ones:", kind: "comment" },
    { text: "const outcome = await client.commitCapital(command);" },
  ], "the same screen, none of the styling");
  const rightX = marginX + 7.0 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.1, rightWidth, 4.1, { edge: GREEN });
  slide.addText("What a slice may contain", { x: rightX + 0.3, y: 2.26, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 15, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 2.78, rightWidth - 0.6, 3.2, [
    "Its command and query types, its mock and live clients, its hooks and pure domain modules.",
    "Its own src/components — domain components composed from core, with no styling of their own.",
    "Zero sx · zero style · zero @mui import · zero CSS file · zero colour, px or rem literal.",
    "Files under 150 lines, comments near zero, no util modules, unions over strings.",
    { text: "Re-skin — or re-implement — the design system without opening a slice.", bold: true },
  ], { fontSize: 12.5, gap: 9 });
  card(slide, marginX, 6.35, slideWidth - 2 * marginX, 0.6, { fill: "F4F7FB", shadow: false, border: LINE });
  slide.addText([
    { text: "The gate is one line:   ", options: { bold: true, color: INK, fontFace: bodyFont, fontSize: 12.5 } },
    { text: "git grep -nP \"sx=|from '@mui|style=\\{\\{\" web/apps web/slices", options: { fontFace: codeFont, color: "44516B", fontSize: 11.5 } },
    { text: "   →  no output", options: { bold: true, color: GREEN, fontFace: bodyFont, fontSize: 12.5 } },
  ], { x: marginX + 0.3, y: 6.35, w: slideWidth - 2 * marginX - 0.6, h: 0.6, valign: "middle", margin: 0 });
  deck.footer(slide, false);
}
