import { computeAudioFingerprint } from "@/lib/audioFingerprint";
import {
  getCachedCreativeDirection,
  isCreativeDirectionCacheSkipped,
  setCachedCreativeDirection,
} from "@/lib/creativeDirectionCache";
import { generateDesignBrief } from "@/engine/designBriefEngine";
import {
  getFontMetadata,
  validateFontLeakage,
  validateCreativeInterpretation,
} from "@/lib/creativeInterpretation";
import { enforceAntiTemplateRule } from "@/lib/antiTemplateEngine";
import { enforcePaletteQuality } from "@/lib/paletteValidation";
import { preserveIncomingCreativeDirection } from "@/lib/preserveCreativeDirection";
import {
  recordDirectionSignature,
  validateSongCharacterDirection,
} from "@/lib/songCharacterInterpretation";
import {
  analyzeFontPipeline,
  selectFontFromRankings,
} from "@/services/fontAnalysis";
import { generateCreativeDirection } from "@/services/creativeDirector";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { ResolvedCreativePipeline } from "@/types/creativePipeline";
import type { FontRecommendation, SelectedFontMetadata } from "@/types/fontMetadata";

import { recordFontSelection } from "@/lib/fontSelectionPhilosophy";
import { logCreativeFactors } from "@/lib/creativeFactors";
import {
  computeSongUniquenessVector,
  describeUniquenessVector,
} from "@/lib/songUniquenessVector";
import type { GenerationProgress } from "@/types/generationProgress";

function useGeminiCreativeDirection(): boolean {
  return import.meta.env.VITE_USE_GEMINI_CREATIVE_DIRECTION === "true";
}

function stripFontFields(direction: CreativeDirection): CreativeDirection {
  const raw = direction as CreativeDirection & {
    fontRecommendation?: unknown;
    font?: unknown;
    selectedFont?: unknown;
  };

  const { fontRecommendation: _fontRecommendation, font: _font, selectedFont: _selectedFont, ...rest } =
    raw;

  return rest;
}

function applySelectedFontStyling(
  direction: CreativeDirection,
  _selectedFont: SelectedFontMetadata,
  _audioFeatures: AudioFeatures
): CreativeDirection {
  return stripFontFields(direction);
}

function finalizeCreativeDirection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata,
  fingerprint: string
): CreativeDirection {
  const font = getFontMetadata(selectedFont.name);
  let finalized = preserveIncomingCreativeDirection(
    stripFontFields(direction),
    audioFeatures,
    font
  );

  const antiTemplate = enforceAntiTemplateRule(finalized, audioFeatures, fingerprint);
  finalized = antiTemplate.direction;

  const paletteResult = enforcePaletteQuality(
    finalized,
    audioFeatures,
    fingerprint,
    font
  );
  finalized = paletteResult.direction;

  const warnings = [
    ...paletteResult.warnings,
    ...validateSongCharacterDirection(finalized, audioFeatures, fingerprint),
    ...validateFontLeakage(finalized, audioFeatures, font),
    ...validateCreativeInterpretation(finalized, audioFeatures),
  ];

  if (warnings.length > 0) {
    console.warn(
      "[CreativeDirector] Validation warnings — Gemini direction preserved",
      warnings
    );
  }

  recordDirectionSignature(
    fingerprint,
    audioFeatures.songCharacter,
    finalized,
    audioFeatures
  );

  return finalized;
}

async function buildCreativeDirection(
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata
): Promise<CreativeDirection> {
  if (useGeminiCreativeDirection()) {
    console.log("SONG SIGNATURE", {
      tempo: audioFeatures.tempo,
      energy: audioFeatures.energy,
      brightness: audioFeatures.brightness,
      density: audioFeatures.density,
      dynamics: audioFeatures.dynamics,
      stereoWidth: audioFeatures.analysisSignals.stereoWidth,
      spectralFlatness: audioFeatures.analysisSignals.spectralFlatness,
      transientSharpness: audioFeatures.analysisSignals.transientSharpness,
    });
    console.log("[CreativeDirector] Gemini enabled — preserving LLM brief with validation-only constraints");
    return generateCreativeDirection(audioFeatures, selectedFont);
  }

  const direction = generateDesignBrief(audioFeatures, selectedFont);
  console.log("[CreativeDirector] Deterministic design brief from songCharacter + Visual DNA", {
    songCharacter: audioFeatures.songCharacter,
    layoutBias: audioFeatures.visualDna.layoutBias,
    motionRhythm: audioFeatures.visualDna.motionRhythm,
    cameraEnergy: audioFeatures.visualDna.cameraEnergy,
    font: selectedFont.name,
  });
  return direction;
}

function attachFontRecommendationReasoning(
  fontRecommendation: FontRecommendation,
  direction: CreativeDirection
): FontRecommendation {
  return {
    ...fontRecommendation,
    reasoning: fontRecommendation.reasoning || direction.artisticIntent,
  };
}

export async function resolveCreativeDirection(
  file: File,
  onProgress?: (progress: GenerationProgress) => void
): Promise<ResolvedCreativePipeline> {
  onProgress?.({ stage: "decoding-audio", detail: "Reading audio file" });

  const fingerprint = await computeAudioFingerprint(file);
  const skipCache = isCreativeDirectionCacheSkipped();

  console.log("[CreativeDirector] Cache mode", {
    skipCache,
    env: import.meta.env.VITE_SKIP_CREATIVE_DIRECTION_CACHE ?? "(unset)",
  });

  onProgress?.({ stage: "analyzing-audio", detail: "Analyzing full song" });
  const analyzeStartedAt = performance.now();
  const { audioFeatures, rankings } = await analyzeFontPipeline(file, fingerprint);
  const analyzeMs = Math.round(performance.now() - analyzeStartedAt);

  onProgress?.({ stage: "scoring-fonts", detail: "Selecting typography" });
  const { selectedFont, fontRecommendation } = selectFontFromRankings(rankings);
  recordFontSelection(fingerprint, getFontMetadata(selectedFont.name), audioFeatures);

  console.group("[Audio Analysis]");
  console.log({ durationMs: analyzeMs, fileSizeMb: (file.size / 1024 / 1024).toFixed(2) });
  console.log(audioFeatures);
  console.groupEnd();

  console.group("[Song Uniqueness Vector]");
  console.log(describeUniquenessVector(computeSongUniquenessVector(audioFeatures)));
  console.groupEnd();

  console.group("[Song Character]");
  console.log(audioFeatures.songCharacter);
  console.groupEnd();

  console.group("[Visual DNA]");
  console.log(audioFeatures.visualDna);
  console.groupEnd();

  logCreativeFactors(audioFeatures);

  console.group("[Font Scoring]");
  console.log(rankings);
  console.groupEnd();

  console.log("[Font Selection] Selected font", {
    name: selectedFont.name,
    confidence: fontRecommendation.confidence,
  });

  const geminiEnabled = useGeminiCreativeDirection();
  onProgress?.({
    stage: "creative-direction",
    detail: geminiEnabled
      ? "Calling Gemini API"
      : "Building design brief locally",
  });

  const directionStartedAt = performance.now();
  let direction: CreativeDirection;

  if (!skipCache) {
    const cached = getCachedCreativeDirection(fingerprint);

    if (cached) {
      console.log("[CreativeDirector] Using cached CreativeDirection — re-applying selected font", {
        fingerprint,
        selectedFont: selectedFont.name,
      });
      direction = applySelectedFontStyling(cached, selectedFont, audioFeatures);
    } else {
      direction = await buildCreativeDirection(audioFeatures, selectedFont);
      setCachedCreativeDirection(fingerprint, direction);
      console.log("[CreativeDirector] Cached new CreativeDirection", { fingerprint });
    }
  } else {
    console.log("[CreativeDirector] Cache skipped (debug)", { fingerprint, geminiEnabled });
    direction = await buildCreativeDirection(audioFeatures, selectedFont);
  }

  console.log("[CreativeDirector] Direction built", {
    source: geminiEnabled ? "gemini" : "deterministic",
    durationMs: Math.round(performance.now() - directionStartedAt),
  });

  direction = finalizeCreativeDirection(direction, audioFeatures, selectedFont, fingerprint);

  console.group("[CreativeDirector] Resolved direction");
  console.log(direction);
  console.groupEnd();

  return {
    direction,
    audioFeatures,
    selectedFont,
    fontRecommendation: attachFontRecommendationReasoning(fontRecommendation, direction),
  };
}
