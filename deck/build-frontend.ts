import { Deck } from "./deck.ts";
import { agendaSlide, titleSlide } from "./frontend/openingSlides.ts";
import { problemSlide, shapeSlide } from "./frontend/problemSlides.ts";
import { boundarySlide, designSystemSlide } from "./frontend/designSystemSlides.ts";
import { tokensSlide } from "./frontend/tokenSlides.ts";
import { customizationSlide, theRuleSlide } from "./frontend/customizationSlides.ts";
import { anatomySlide, runtimeCompositionSlide } from "./frontend/compositionSlides.ts";
import { antiBloatSlide, composableUiSlide } from "./frontend/workspaceSlides.ts";
import { configurableSlide, dealPipelineSlide, i18nSlide } from "./frontend/scaleSlides.ts";
import { blueprintSlide, recommendationSlide, tradeOffsSlide } from "./frontend/closingSlides.ts";

const SECTIONS = ["Own the core", "Pluggable composition", "Scale & configure"];

const deck = new Deck({
  title: "Designing the Atlas frontend",
  footerText: "Atlas · Frontend architecture — owned core + vertical slices",
  sections: SECTIONS,
});

titleSlide(deck);
agendaSlide(deck);

deck.divider(1, "Own the core", 0);
problemSlide(deck);
shapeSlide(deck);
designSystemSlide(deck);
boundarySlide(deck);
tokensSlide(deck);
customizationSlide(deck);
theRuleSlide(deck);

deck.divider(2, "Pluggable composition", 1);
runtimeCompositionSlide(deck);
anatomySlide(deck);
composableUiSlide(deck);
antiBloatSlide(deck);

deck.divider(3, "Scale & configure", 2);
dealPipelineSlide(deck);
configurableSlide(deck);
i18nSlide(deck);
tradeOffsSlide(deck);
blueprintSlide(deck);
recommendationSlide(deck);

await deck.write("Atlas-Frontend.pptx");
