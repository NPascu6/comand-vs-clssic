import { AMBER, arrow, bodyFont, box, bullets, card, codeCard, Deck, GREEN, headerFont, INK, marginX, MUTE, NAVY, shapes, slideWidth, titleBlock, WHITE } from "../deck.ts";

export function runtimeCompositionSlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Runtime composition", "Each slice deploys on its own; the shell composes by URL", false);
  codeCard(slide, marginX, 2.0, 6.7, 4.3, [
    { text: "// config.json — written per environment next to the shell", kind: "comment" },
    { text: "{ \"apiBaseUrl\": \"https://api.atlas.example/api\"," },
    { text: "  \"slices\": [" },
    { text: "    { \"id\": \"commit-capital\", \"url\": \"https://…slice-commit-capital…\" }," },
    { text: "    { \"id\": \"appetite\",       \"url\": \"https://…slice-appetite…\" }" },
    { text: "  ] }" },
    { text: "" },
    { text: "// each slice site: manifest.json + slice.js (4–30 kB)", kind: "comment" },
    { text: "// React, MUI and @atlas/core come from the shell's import map", kind: "comment" },
    { text: "// the shell: fetch manifest.json → check sharedApi", kind: "comment" },
    { text: "//            → import(slice.js) → read `manifest`", kind: "comment" },
  ], "the shell only consumes the manifest");
  const rightX = marginX + 6.7 + 0.4, rightWidth = slideWidth - marginX - rightX;
  card(slide, rightX, 2.0, rightWidth, 4.3, { edge: GREEN });
  slide.addText("Add a business domain", { x: rightX + 0.3, y: 2.16, w: rightWidth - 0.55, h: 0.4, fontFace: headerFont, fontSize: 16, bold: true, color: INK, margin: 0 });
  bullets(slide, rightX + 0.3, 2.7, rightWidth - 0.6, 3.4, [
    "Build the package — UI, data client, manifest.",
    "Ship it alone: its own bundle, Static Web App, pipeline and Terraform stack.",
    "The shell lists it in config.json and renders nav from the manifest; it never reads a slice's internals.",
    "Shared singletons — React, @atlas/core, i18n — come from the shell's import map: one instance, tiny bundles.",
    { text: "No shell rebuild, no shared file to edit — a slice team deploys on its own.", bold: true },
  ], { fontSize: 13, gap: 11 });
  deck.footer(slide, false);
}

export function anatomySlide(deck: Deck): void {
  const slide = deck.newSlide(false);
  titleBlock(slide, "Anatomy", "A slice, end to end — it mirrors the backend", false);
  const boxWidth = 2.3, boxHeight = 1.0, labelX = marginX, firstBoxX = marginX + 1.6;
  const gap = (slideWidth - marginX - firstBoxX - 4 * boxWidth) / 3;
  const backendY = 2.65, frontendY = 4.6;
  slide.addText("Backend\n(.NET)", { x: labelX, y: backendY, w: 1.5, h: boxHeight, fontFace: bodyFont, fontSize: 12, bold: true, color: NAVY, valign: "middle", margin: 0 });
  const backendSteps = [["Command", "immutable record"], ["Rules", "named, async"], ["Handler", "validate → execute"], ["Result + Trace", "DecisionTrace"]];
  backendSteps.forEach((step, index) => {
    const boxX = firstBoxX + index * (boxWidth + gap);
    box(slide, boxX, backendY, boxWidth, boxHeight, step[0], index === 3 ? AMBER : NAVY, index === 3 ? NAVY : WHITE, step[1]);
    if (index < 3) arrow(slide, boxX + boxWidth, backendY + boxHeight / 2, gap);
  });
  slide.addText("Frontend\n(React)", { x: labelX, y: frontendY, w: 1.5, h: boxHeight, fontFace: bodyFont, fontSize: 12, bold: true, color: GREEN, valign: "middle", margin: 0 });
  const frontendSteps = [["Form", "command state"], ["Client", "mock | live API"], ["Slice", "owns the use case"], ["Outcome + Trace", "same JSON, rendered"]];
  frontendSteps.forEach((step, index) => {
    const boxX = firstBoxX + index * (boxWidth + gap);
    box(slide, boxX, frontendY, boxWidth, boxHeight, step[0], index === 3 ? AMBER : GREEN, index === 3 ? NAVY : WHITE, step[1]);
    if (index < 3) arrow(slide, boxX + boxWidth, frontendY + boxHeight / 2, gap);
    slide.addShape(shapes.line, { x: boxX + boxWidth / 2, y: backendY + boxHeight, w: 0, h: frontendY - (backendY + boxHeight), line: { color: "C9D4E5", width: 1.2, dashType: "dash" } });
  });
  slide.addText("The DecisionTrace shape is the contract — the same JSON renders in the UI whether it came from the mock or the live API.", { x: marginX, y: 6.0, w: slideWidth - 2 * marginX, h: 0.5, fontFace: bodyFont, fontSize: 13, italic: true, color: MUTE, align: "center", margin: 0 });
  deck.footer(slide, false);
}
