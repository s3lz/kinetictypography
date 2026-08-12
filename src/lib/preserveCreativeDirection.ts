import { deriveMotionBehavior } from "@/engine/motionBehaviorEngine";
import { fillPaletteMetadata } from "@/lib/paletteValidation";
import { stripFontLeaksFromDirection } from "@/lib/creativeInterpretation";
import { ensureCreativeInterpretation } from "@/lib/deriveCreativeInterpretation";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { FontMetadata } from "@/types/fontMetadata";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampComposition(direction: CreativeDirection): CreativeDirection {
  const negativeSpace = clamp01(direction.composition.negativeSpace);

  return {
    ...direction,
    composition: {
      ...direction.composition,
      negativeSpace,
    },
  };
}

function fillMissingSpecificity(direction: CreativeDirection): CreativeDirection {
  const why =
    direction.reasoning?.whyThisSongNotAnother?.trim() ||
    direction.specificityReasoning?.whyThisSongNotAnother?.trim() ||
    direction.artisticIntent.trim() ||
    "Song-specific artistic interpretation.";

  return {
    ...direction,
    reasoning: {
      creativeTranslation:
        direction.reasoning?.creativeTranslation?.trim() ||
        direction.artisticIntent.trim() ||
        why,
      whyThisSongNotAnother: why,
      hiddenIdentityCheck:
        direction.reasoning?.hiddenIdentityCheck?.trim() ||
        "Direction is executable letter physics — not title, artist, or genre scenery.",
      selfCheck: direction.reasoning?.selfCheck,
    },
    specificityReasoning: { whyThisSongNotAnother: why },
  };
}

function ensureMotionBehavior(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): CreativeDirection {
  const baseConcept = {
    metaphor: direction.artisticIntent,
    primaryMotion: direction.motionBehavior?.primary || "compression",
    secondaryMotion: direction.motionBehavior?.secondary || "release",
    intensityBehavior:
      "Higher intensity increases word displacement and rebound; glyph motion stays nearly constant.",
    wordMovement: "Word acts as one physical object under the primary action.",
    glyphMovement: "Subtle life only — no competing locomotion.",
    cameraMovement: "locked" as const,
  };

  if (direction.motionBehavior?.primary) {
    return {
      ...direction,
      motionSystem: {
        ...direction.motionSystem,
        motionLanguage: direction.motionLanguage,
        motionBehavior: direction.motionBehavior,
        motionConcept: direction.motionSystem?.motionConcept ?? baseConcept,
      },
    };
  }

  const motionBehavior = deriveMotionBehavior(
    audioFeatures,
    direction.motionLanguage,
    direction.composition
  );

  return {
    ...direction,
    motionBehavior,
    motionSystem: {
      ...direction.motionSystem,
      motionLanguage: direction.motionLanguage,
      motionBehavior,
      motionConcept: direction.motionSystem?.motionConcept ?? {
        ...baseConcept,
        primaryMotion: motionBehavior.primary,
        secondaryMotion: motionBehavior.secondary ?? "release",
      },
    },
  };
}

/**
 * Keeps Gemini (or design-brief) creative choices intact.
 * Audio is used only to fix contradictions and clamp invalid values — never to replace fields.
 */
export function preserveIncomingCreativeDirection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  font: FontMetadata
): CreativeDirection {
  let preserved = clampComposition(direction);
  preserved = ensureMotionBehavior(preserved, audioFeatures);
  preserved = {
    ...preserved,
    palette: fillPaletteMetadata(preserved.palette, audioFeatures),
  };
  preserved = stripFontLeaksFromDirection(preserved, audioFeatures, font);
  preserved = fillMissingSpecificity(preserved);
  preserved = ensureCreativeInterpretation(preserved, audioFeatures, font.name);
  return preserved;
}
