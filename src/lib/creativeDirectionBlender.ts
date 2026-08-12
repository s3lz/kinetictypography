import { deriveMotionBehavior } from "@/engine/motionBehaviorEngine";
import {
  deriveCamera,
  deriveComposition,
  deriveVisualLanguageFromAudio,
} from "@/engine/designBriefEngine";
import {
  deriveMotionDimensions,
  differentiateMotionDimensions,
  motionCharacterFromDimensions,
} from "@/engine/motionDimensionsEngine";
import { derivePalette } from "@/engine/paletteEngine";
import {
  applySpatialPersonalityRules,
  logCreativeFactors,
} from "@/lib/creativeFactors";
import {
  applyFontStylingModifier,
  getFontMetadata,
  stripFontLeaksFromDirection,
} from "@/lib/creativeInterpretation";
import {
  computeDirectionFamilies,
  type CompositionFamily,
  type DirectionFamilySignature,
} from "@/lib/directionFamilies";
import {
  computeSongUniquenessVector,
  describeUniquenessVector,
} from "@/lib/songUniquenessVector";
import { deriveCompositionFromSongCharacter } from "@/lib/songCharacterInterpretation";
import { ensureCreativeInterpretation } from "@/lib/deriveCreativeInterpretation";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection, SpecificityReasoning } from "@/types/creativeDirection";
import type { CompositionDirection } from "@/types/designBrief";
import type { FontMetadata } from "@/types/fontMetadata";
import type { SelectedFontMetadata } from "@/types/fontMetadata";
import type { MotionLanguageBrief } from "@/types/motionLanguage";
import type { SongUniquenessVector } from "@/types/songUniqueness";

const COMPOSITION_VARIANTS: Record<CompositionFamily, string[]> = {
  "center-column": ["center-column", "wide-banner", "center-stack"],
  "edge-anchor": ["edge-anchor", "bottom-anchor", "left-edge-crop"],
  "offset-asymmetric": ["offset-column", "diagonal-rail", "asymmetric-stack"],
  "poster-stack": ["poster-stack", "vertical-stack", "dense-poster"],
  "radial-wide": ["radial-burst", "orbital-spread", "wide-radial"],
  "left-rail": ["left-rail", "narrow-column", "left-anchor"],
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function deriveEmotionalComposition(audioFeatures: AudioFeatures): CompositionDirection {
  const { warmth, organic, tension } = audioFeatures.emotionalVector;
  const { stereoWidth } = audioFeatures.visualDna;
  const { humanity } = audioFeatures.performanceTexture;
  const silence = audioFeatures.analysisSignals.silenceRatio;

  if (stereoWidth > 0.28) {
    return {
      composition: "radial-burst",
      negativeSpace: clamp01(0.5 + silence * 0.15),
      alignment: "center",
      textDensity: "sparse",
    };
  }

  if (stereoWidth < 0.22) {
    return {
      composition: "center-column",
      negativeSpace: clamp01(0.32 + silence * 0.12),
      alignment: "center",
      textDensity: "dense",
    };
  }

  if (warmth > 0.6 && organic > 0.55 && humanity > 0.48) {
    return {
      composition: "left-rail",
      negativeSpace: clamp01(0.45 + silence * 0.2),
      alignment: "left",
      textDensity: "sparse",
    };
  }

  if (tension > 0.62 && audioFeatures.motionCharacter.physicality > 0.5) {
    return {
      composition: "offset-column",
      negativeSpace: clamp01(0.32 + silence * 0.15),
      alignment: "left",
      textDensity: "balanced",
    };
  }

  return {
    composition: "center-column",
    negativeSpace: clamp01(0.4 + silence * 0.18),
    alignment: "center",
    textDensity: "balanced",
  };
}

function applyUniquenessCompositionRules(
  composition: CompositionDirection,
  uniqueness: SongUniquenessVector,
  dna: AudioFeatures["visualDna"]
): CompositionDirection {
  let next = { ...composition };

  if (uniqueness.stereoWidth < 0.22) {
    next.composition = "edge-anchor";
    next.alignment = "left";
    next.negativeSpace = clamp01(Math.max(next.negativeSpace, 0.55));
  } else if (uniqueness.stereoWidth > 0.28) {
    if (
      next.composition === "edge-anchor" ||
      next.composition === "left-rail" ||
      next.composition === "center-column"
    ) {
      next.composition = "radial-burst";
      next.alignment = "center";
    }
    next.negativeSpace = clamp01(next.negativeSpace + 0.1);
  }

  if (dna.visualWeight === "airy") {
    next.negativeSpace = clamp01(Math.max(next.negativeSpace, 0.52));
  } else if (dna.visualWeight === "balanced") {
    next.negativeSpace = clamp01(Math.min(0.62, Math.max(0.3, next.negativeSpace)));
  }

  if (dna.sceneDensity === "dense") {
    next.textDensity = "dense";
  }

  return next;
}

function blendComposition(
  dnaComp: CompositionDirection,
  songComp: CompositionDirection,
  emotionalComp: CompositionDirection
): CompositionDirection {
  const composition =
    dnaComp.composition !== songComp.composition ? dnaComp.composition : emotionalComp.composition;

  return {
    composition,
    negativeSpace: clamp01(
      dnaComp.negativeSpace * 0.5 +
        songComp.negativeSpace * 0.3 +
        emotionalComp.negativeSpace * 0.15
    ),
    alignment: dnaComp.alignment,
    textDensity:
      dnaComp.textDensity === "dense" || songComp.textDensity === "dense"
        ? "dense"
        : dnaComp.textDensity,
  };
}

function variantIndex(key: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

export function differentiateDirectionFamilies(
  direction: CreativeDirection,
  uniqueness: SongUniquenessVector,
  families: DirectionFamilySignature,
  audioFeatures: AudioFeatures,
  collisionSalt: number
): CreativeDirection {
  const variants = COMPOSITION_VARIANTS[families.compositionFamily];
  const variant = variants[variantIndex(uniqueness.differentiationKey, variants.length)];

  const motionLanguage = differentiateMotionDimensions(
    direction.motionLanguage,
    uniqueness,
    collisionSalt,
    audioFeatures
  );

  const nextComposition = {
    ...direction.composition,
    composition: variant,
  };

  return {
    ...direction,
    composition: nextComposition,
    motionLanguage,
    motionBehavior: deriveMotionBehavior(
      audioFeatures,
      motionLanguage,
      nextComposition
    ),
    visualLanguage: {
      ...direction.visualLanguage,
      motionCharacter: motionCharacterFromDimensions(motionLanguage),
    },
  };
}

export function buildSpecificityReasoning(
  audioFeatures: AudioFeatures,
  uniqueness: SongUniquenessVector,
  families: DirectionFamilySignature,
  motionLanguage: MotionLanguageBrief
): SpecificityReasoning {
  return {
    whyThisSongNotAnother: [
      `Motion dimensions ${motionLanguage.force}/${motionLanguage.material}/${motionLanguage.timing}/${motionLanguage.deformation}/${motionLanguage.direction} differentiate this song from same-energy tracks.`,
      `Palette family ${families.paletteFamily} comes from visual environment, light behavior, and two-color relationship — not visualizer defaults.`,
      `Uniqueness key ${uniqueness.differentiationKey} (${describeUniquenessVector(uniqueness)}) drives composition family ${families.compositionFamily}.`,
    ].join(" "),
  };
}

export function buildWeightedCreativeDirection(
  audioFeatures: AudioFeatures,
  font: FontMetadata,
  options?: {
    incoming?: CreativeDirection;
    collisionSalt?: number;
  }
): CreativeDirection {
  const dna = audioFeatures.visualDna;
  const uniqueness = computeSongUniquenessVector(audioFeatures);
  logCreativeFactors(audioFeatures);
  const camera = deriveCamera(dna, audioFeatures);

  const visualLanguageBase = deriveVisualLanguageFromAudio(dna, audioFeatures);
  const motionLanguage = deriveMotionDimensions(audioFeatures, {
    incoming: options?.incoming?.motionLanguage,
    collisionSalt: options?.collisionSalt,
  });

  let visualLanguage = applyFontStylingModifier(
    {
      ...visualLanguageBase,
      motionCharacter: motionCharacterFromDimensions(motionLanguage),
    },
    font,
    audioFeatures
  );

  const composition = applyUniquenessCompositionRules(
    blendComposition(
      deriveComposition(dna, audioFeatures),
      deriveCompositionFromSongCharacter(audioFeatures.songCharacter, audioFeatures),
      deriveEmotionalComposition(audioFeatures)
    ),
    uniqueness,
    dna
  );

  const spatialAdjusted = applySpatialPersonalityRules(
    composition,
    visualLanguage,
    audioFeatures
  );

  const palette = derivePalette(audioFeatures);

  const motionBehavior =
    options?.incoming?.motionBehavior ??
    deriveMotionBehavior(audioFeatures, motionLanguage, spatialAdjusted.composition);

  let direction = {
    visualLanguage: spatialAdjusted.visualLanguage,
    artisticIntent:
      options?.incoming?.artisticIntent ??
      `Typography uses ${motionBehavior.primary} physical behavior with ${motionLanguage.material} motion inside a ${spatialAdjusted.composition.composition} layout.`,
    composition: spatialAdjusted.composition,
    motionLanguage,
    motionBehavior,
    camera,
    palette,
  } as CreativeDirection;

  direction = stripFontLeaksFromDirection(direction, audioFeatures, font);

  if (options?.collisionSalt && options.collisionSalt > 0) {
    direction = differentiateDirectionFamilies(
      direction,
      uniqueness,
      computeDirectionFamilies(direction),
      audioFeatures,
      options.collisionSalt
    );
  }

  direction.specificityReasoning =
    options?.incoming?.specificityReasoning ??
    buildSpecificityReasoning(
      audioFeatures,
      uniqueness,
      computeDirectionFamilies(direction),
      direction.motionLanguage
    );

  return ensureCreativeInterpretation(direction, audioFeatures, font.name);
}

export function buildWeightedCreativeDirectionFromSelection(
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata,
  options?: {
    incoming?: CreativeDirection;
    collisionSalt?: number;
  }
): CreativeDirection {
  return buildWeightedCreativeDirection(
    audioFeatures,
    getFontMetadata(selectedFont.name),
    options
  );
}
