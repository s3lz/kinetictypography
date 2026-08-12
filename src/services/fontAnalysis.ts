import fontLibrary from "@/data/fontLibrary.json";
import { analyzeAudio } from "@/services/audioAnalyzer";
import {
  buildFontRecommendation,
  rankFonts,
} from "@/services/fontScoring";
import type { FontId } from "@/engine/fontSelector";
import type { AudioFeatures } from "@/types/audio";
import {
  toFontStylingContext,
  type FontMetadata,
  type FontRankingEntry,
  type FontRecommendation,
  type SelectedFontMetadata,
} from "@/types/fontMetadata";

const FONT_LIBRARY = fontLibrary as FontMetadata[];

export interface FontAnalysisResult {
  audioFeatures: AudioFeatures;
  rankings: FontRankingEntry[];
}

export interface FontSelectionResult {
  selectedFont: SelectedFontMetadata;
  fontRecommendation: FontRecommendation;
}

function getFontById(fontId: FontId): FontMetadata {
  return FONT_LIBRARY.find((font) => font.name === fontId) ?? FONT_LIBRARY[0];
}

export function toSelectedFontMetadata(font: FontMetadata): SelectedFontMetadata {
  return toFontStylingContext(font);
}

export async function analyzeFontPipeline(
  file: File,
  fingerprint?: string
): Promise<FontAnalysisResult> {
  const audioFeatures = await analyzeAudio(file);
  const rankings = rankFonts(audioFeatures.emotionalVector, audioFeatures, fingerprint);

  return {
    audioFeatures,
    rankings,
  };
}

export function createScoredFontRecommendation(
  rankings: FontRankingEntry[],
  reasoning = "",
  alternativeNotes = ""
) {
  const recommendation = buildFontRecommendation(rankings, reasoning);

  if (alternativeNotes) {
    recommendation.reasoning = [recommendation.reasoning, alternativeNotes]
      .filter(Boolean)
      .join(" ");
  }

  return recommendation;
}

export function selectFontFromRankings(rankings: FontRankingEntry[]): FontSelectionResult {
  const fontRecommendation = createScoredFontRecommendation(rankings);
  const selectedFont = toSelectedFontMetadata(getFontById(fontRecommendation.primary));

  return {
    selectedFont,
    fontRecommendation,
  };
}
