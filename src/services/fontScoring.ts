import fontLibrary from "@/data/fontLibrary.json";
import type { AudioFeatures } from "@/types/audio";
import type { EmotionalVector } from "@/types/emotionalVector";
import type { FontId } from "@/engine/fontSelector";
import {
  buildFontSelectionReasoning,
  scoreFontRepetition,
  scoreLetterformPersonality,
  scoreLiteralClicheMatch,
  scoreMotionPotential,
  scoreSongCharacterFit,
  scoreVisualTension,
} from "@/lib/fontSelectionPhilosophy";
import type {
  FontMetadata,
  FontRankingEntry,
  FontRecommendation,
  FontScoreBreakdown,
} from "@/types/fontMetadata";

const FONT_LIBRARY = fontLibrary as FontMetadata[];

/**
 * Rebalanced weights — song character fit must be able to change the winner
 * so different songs do not always pick the same high-motionPotential face.
 */
const WEIGHTS = {
  motionPotential: 0.26,
  songCharacterFit: 0.3,
  visualTension: 0.16,
  letterformPersonality: 0.12,
  repetitionScore: 0.16,
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function scoreFont(
  font: FontMetadata,
  vector: EmotionalVector,
  audioFeatures: AudioFeatures,
  fingerprint?: string
): FontScoreBreakdown & { songCharacterFit: number } {
  const motionPotential = scoreMotionPotential(font);
  const visualTension = scoreVisualTension(font, vector);
  const letterformPersonality = scoreLetterformPersonality(font);
  const repetitionScore = scoreFontRepetition(font, fingerprint, audioFeatures);
  const literalClicheMatch = scoreLiteralClicheMatch(font, vector);
  const songCharacterFit = scoreSongCharacterFit(font, audioFeatures.songCharacter);

  const total = clamp01(
    motionPotential * WEIGHTS.motionPotential +
      songCharacterFit * WEIGHTS.songCharacterFit +
      visualTension * WEIGHTS.visualTension +
      letterformPersonality * WEIGHTS.letterformPersonality +
      repetitionScore * WEIGHTS.repetitionScore
  );

  return {
    fontId: font.name,
    total,
    motionPotential,
    visualTension,
    letterformPersonality,
    repetitionScore,
    literalClicheMatch,
    songCharacterFit,
  };
}

export function rankFonts(
  vector: EmotionalVector,
  audioFeatures: AudioFeatures,
  fingerprint?: string
): FontRankingEntry[] {
  const scored = FONT_LIBRARY.map((font) =>
    scoreFont(font, vector, audioFeatures, fingerprint)
  ).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    // Tie-break by song fit, then motion potential, then name.
    if (b.songCharacterFit !== a.songCharacterFit) {
      return b.songCharacterFit - a.songCharacterFit;
    }
    if (b.motionPotential !== a.motionPotential) {
      return b.motionPotential - a.motionPotential;
    }
    return a.fontId.localeCompare(b.fontId);
  });

  return scored.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function buildFontRecommendation(
  rankings: FontRankingEntry[],
  reasoning = ""
): FontRecommendation {
  const primary = rankings[0]?.fontId ?? ("manrope" as FontId);
  const alternatives = rankings.slice(1, 3).map((entry) => entry.fontId);
  const top = rankings[0];

  const defaultReasoning =
    top && getFontLibrary().find((font) => font.name === top.fontId)
      ? buildFontSelectionReasoning(
          getFontLibrary().find((font) => font.name === top.fontId)!,
          {
            motionPotential: top.motionPotential,
            visualTension: top.visualTension,
            letterformPersonality: top.letterformPersonality,
            literalClicheMatch: top.literalClicheMatch,
            songCharacterFit: top.songCharacterFit,
          }
        )
      : "";

  return {
    primary,
    confidence: rankings[0]?.total ?? 0,
    alternatives,
    reasoning: reasoning || defaultReasoning,
  };
}

export function getFontLibrary(): FontMetadata[] {
  return FONT_LIBRARY;
}
