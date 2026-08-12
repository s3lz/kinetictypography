import fontLibrary from "@/data/fontLibrary.json";
import { toSelectedFontMetadata } from "@/services/fontAnalysis";
import { mockAudioFeatures } from "./mockAudio";
import { generateCreativeDirection } from "@/services/creativeDirector";
import type { FontMetadata } from "@/types/fontMetadata";

const FONT_LIBRARY = fontLibrary as FontMetadata[];
const mockFont = FONT_LIBRARY.find((font) => font.name === "michroma") ?? FONT_LIBRARY[0];
const selectedFont = toSelectedFontMetadata(mockFont);

async function testCreativeDirector() {
  const result = await generateCreativeDirection(mockAudioFeatures, selectedFont);

  console.log(result);
}

testCreativeDirector();
