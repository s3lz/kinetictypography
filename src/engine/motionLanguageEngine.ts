import type { MotionDimension, MotionLevels } from "@/types/CreativeState";
import { deriveMotionGrammar } from "@/engine/motionGrammarEngine";
import { deriveMotionPersonality } from "@/engine/motionPersonalityEngine";
import {
  describeMotionSelection,
  selectMotionFromAudio,
} from "@/engine/motionSelectionEngine";
import { resolveBehaviorMotionProfile } from "@/components/MotionEngine/motionBehaviorPrimitives";
import { compilePhysicalIdentity } from "@/lib/compilePhysicalIdentity";
import {
  applyIdentityToMotionSelection,
} from "@/lib/identityMotionBias";
import type { MotionParamsMap } from "@/types/motionMetadata";
import type { AudioFeatures } from "@/types/audio";
import type {
  CameraBrief,
  CameraConfig,
  CompositionDirection,
  VisualLanguage,
} from "@/types/designBrief";
import type { FontMetadata } from "@/types/fontMetadata";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { MotionBehaviorBrief } from "@/types/motionBehavior";
import type { MotionLanguageBrief } from "@/types/motionLanguage";
import type { MotionPersonality } from "@/types/motionPersonality";
import type { MotionGrammar } from "@/types/motionGrammar";
import type {
  FontPhysics,
  PhysicalModel,
  TypographyBehavior,
} from "@/types/physicalIdentity";
import {
  DEFAULT_FONT_PHYSICS,
  DEFAULT_PHYSICAL_MODEL,
  DEFAULT_TYPOGRAPHY_BEHAVIOR,
} from "@/types/physicalIdentity";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveAnimationSpeed(
  brief: MotionLanguageBrief,
  physical?: PhysicalModel
): number {
  let speed = 1;

  if (brief.timing === "staccato") speed += 0.06;
  if (brief.timing === "irregular") speed += 0.04;
  if (brief.timing === "repetitive") speed += 0.02;
  if (brief.timing === "smooth") speed -= 0.1;

  if (brief.force === "explosive") speed += 0.08;
  if (brief.force === "aggressive") speed += 0.04;
  if (brief.force === "subtle") speed -= 0.12;

  if (brief.material === "fluid") speed -= 0.08;
  if (brief.material === "elastic") speed += 0.03;

  if (physical) {
    if (physical.recovery === "snap") speed += 0.08;
    if (physical.material === "fluid" || physical.deformation === "flow") {
      speed -= 0.1;
    }
    if (physical.recovery === "settle") speed -= 0.05;
  }

  return clamp(speed, 0.72, 1.2);
}

type IdentityDirection = Pick<
  CreativeDirection,
  | "physicalInterpretation"
  | "typographyIdentity"
  | "motionSystem"
  | "rendererIdentity"
  | "fontTreatment"
>;

export function resolveMotionFromBrief(
  brief: MotionLanguageBrief,
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures,
  composition?: CompositionDirection,
  camera?: CameraBrief,
  artisticIntent = "",
  motionBehavior?: MotionBehaviorBrief,
  direction?: IdentityDirection,
  fontMetadata?: FontMetadata
): {
  motionProfile: { primary: MotionDimension; secondary: MotionDimension[] };
  motion: MotionLevels;
  motionParams: MotionParamsMap;
  physicalModel: PhysicalModel;
  typographyBehavior: TypographyBehavior;
  fontPhysics: FontPhysics;
  motionGrammar: MotionGrammar;
  motionPersonality: MotionPersonality;
  animationSpeed: number;
} {
  const selection = selectMotionFromAudio(audioFeatures, brief, motionBehavior);

  const behaviorProfile = motionBehavior
    ? resolveBehaviorMotionProfile(motionBehavior)
    : { primary: selection.primary, secondary: selection.secondary };

  const profile = {
    primary: behaviorProfile.primary,
    secondary: [
      ...new Set([
        ...selection.secondary,
        ...behaviorProfile.secondary.filter((d) => d !== behaviorProfile.primary),
      ]),
    ],
  };

  console.log("[Motion Selection]", describeMotionSelection(selection));

  let physicalModel: PhysicalModel = { ...DEFAULT_PHYSICAL_MODEL };
  let typographyBehavior: TypographyBehavior = { ...DEFAULT_TYPOGRAPHY_BEHAVIOR };
  let fontPhysics: FontPhysics = { ...DEFAULT_FONT_PHYSICS };
  let motionParams = selection.motionParams;
  let motionLevels = selection.levels;
  let resolvedProfile = profile;

  if (direction && fontMetadata) {
    const compiled = compilePhysicalIdentity(
      direction,
      fontMetadata,
      selection.motionParams,
      audioFeatures.songCharacter
    );
    physicalModel = compiled.physicalModel;
    typographyBehavior = compiled.typographyBehavior;
    fontPhysics = compiled.fontPhysics;
    motionParams = compiled.motionParams;

    const identityMotion = applyIdentityToMotionSelection(
      selection.levels,
      profile.primary,
      profile.secondary,
      physicalModel,
      typographyBehavior
    );
    motionLevels = identityMotion.levels;
    resolvedProfile = {
      primary: identityMotion.primary,
      secondary: identityMotion.secondary,
    };

    console.log("[Motion Identity Bias]", {
      audioPrimary: selection.primary,
      identityPrimary: identityMotion.primary,
      physicalModel: {
        material: physicalModel.material,
        deformation: physicalModel.deformation,
        recovery: physicalModel.recovery,
      },
      levels: motionLevels,
    });
  }

  const motionGrammar = deriveMotionGrammar(
    brief,
    visualLanguage,
    composition,
    camera
  );
  const motionPersonality = deriveMotionPersonality(
    visualLanguage,
    composition ?? {
      composition: "center-column",
      negativeSpace: 0.7,
      alignment: "center",
      textDensity: "balanced",
    },
    camera ?? { movement: "locked", zoomBehavior: "none" },
    artisticIntent
  );

  return {
    motionProfile: resolvedProfile,
    motion: motionLevels,
    motionParams,
    physicalModel,
    typographyBehavior,
    fontPhysics,
    motionGrammar,
    motionPersonality,
    animationSpeed: resolveAnimationSpeed(brief, physicalModel),
  };
}

export function computeCamera(
  brief: CameraBrief,
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures
): CameraConfig {
  const energy = audioFeatures.energy;
  const tension = audioFeatures.emotionalVector.tension;

  let zoomScale = 1;
  if (brief.zoomBehavior === "slow-push") zoomScale = 1.06 + energy * 0.06;
  if (brief.zoomBehavior === "slow-pull") zoomScale = 0.94 - energy * 0.03;
  if (brief.zoomBehavior === "pulse") zoomScale = 1.03 + tension * 0.05;

  let driftAmplitude = 0;
  if (brief.movement === "slow-drift") driftAmplitude = 6 + energy * 10;
  if (brief.movement === "orbit") driftAmplitude = 10 + tension * 12;

  if (visualLanguage.depth.includes("flat")) {
    driftAmplitude *= 0.65;
  }

  const hasCameraMotion =
    brief.movement !== "locked" || brief.zoomBehavior !== "none";
  const intensity = hasCameraMotion
    ? clamp(Math.round(50 + energy * 35 + tension * 15), 0, 100)
    : 0;

  return {
    movement: brief.movement,
    zoomBehavior: brief.zoomBehavior,
    zoomScale: clamp(zoomScale, 0.88, 1.18),
    driftAmplitude: clamp(driftAmplitude, 0, 24),
    intensity,
  };
}
