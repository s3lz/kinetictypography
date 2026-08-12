import fontLibrary from "@/data/fontLibrary.json";
import { toSelectedFontMetadata } from "@/services/fontAnalysis";
import { mockAudioFeatures } from "./mockAudio";
import { mockCreativeDirection } from "./mockCreativeDirection";
import { generateCreativeDirection } from "@/services/creativeDirector";
import { mapCreativeDirectionToState } from "@/services/stateMapper";
import type { FontMetadata } from "@/types/fontMetadata";
import { createScoredFontRecommendation } from "@/services/fontAnalysis";

const FONT_LIBRARY = fontLibrary as FontMetadata[];
const mockFont = FONT_LIBRARY.find((font) => font.name === "michroma") ?? FONT_LIBRARY[0];
const selectedFont = toSelectedFontMetadata(mockFont);
const fontRecommendation = createScoredFontRecommendation([
  {
    fontId: mockFont.name,
    rank: 1,
    total: 0.82,
    motionPotential: 0.78,
    visualTension: 0.72,
    letterformPersonality: 0.68,
    repetitionScore: 1,
    literalClicheMatch: 0.41,
  },
]);

async function testMapper() {
  const creativeDirection = await generateCreativeDirection(
    mockAudioFeatures,
    selectedFont
  );

  const creativeState = mapCreativeDirectionToState(
    creativeDirection,
    mockAudioFeatures,
    selectedFont,
    fontRecommendation
  );

  console.log(creativeState);
}

testMapper();
