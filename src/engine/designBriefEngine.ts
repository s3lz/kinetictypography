import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type {
  CameraBrief,
  CompositionDirection,
  MotionLanguageBrief,
  TextAlignment,
  TextDensity,
  VisualLanguage,
} from "@/types/designBrief";
import type { FontRecommendation, SelectedFontMetadata } from "@/types/fontMetadata";
import { buildWeightedCreativeDirectionFromSelection } from "@/lib/creativeDirectionBlender";
import {
  isHighIntensityPalette,
  isHighKineticAudio,
  isStronglyFuturisticSynthetic,
  isWarmOrganic,
} from "@/lib/creativeInterpretation";
import { isHighIntensityAudio } from "@/lib/creativeFactors";
import type {
  CameraEnergy,
  LayoutBias,
  MotionRhythm,
  MovementBias,
  SceneDensity,
  SpacingBehavior,
  VisualDNA,
} from "@/types/visualDna";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function mapSpacingBehavior(spacing: SpacingBehavior): string {
  if (spacing === "compressed") return "tight";
  if (spacing === "expanded") return "loose";
  return "balanced";
}

export function deriveVisualLanguageFromAudio(
  dna: VisualDNA,
  audioFeatures: AudioFeatures
): VisualLanguage {
  const { analysisSignals, emotionalVector, motionCharacter, performanceTexture, rhythmicPersonality } =
    audioFeatures;
  const warmOrganic = isWarmOrganic(audioFeatures);
  const futuristic = isStronglyFuturisticSynthetic(audioFeatures);
  const stereoWidth = dna.stereoWidth;

  let geometry = "rectilinear";
  if (warmOrganic || performanceTexture.humanity > 0.55) {
    geometry = "organic";
  } else if (stereoWidth > 0.28 || dna.layoutBias === "radial") {
    geometry = "modular";
  } else if (
    futuristic &&
    motionCharacter.fragmentation > 0.62 &&
    performanceTexture.humanity < 0.38
  ) {
    geometry = "angular";
  } else if (analysisSignals.harmonicStability > 0.7) {
    geometry = "rectilinear";
  }

  let composition = "expanded";
  if (stereoWidth < 0.22 || dna.spacingBehavior === "compressed") {
    composition = "compressed";
  } else if (dna.visualWeight === "heavy" || dna.sceneDensity === "dense") {
    composition = dna.layoutBias === "stacked" ? "oversized" : "compressed";
  } else if (dna.sceneDensity === "minimal" || stereoWidth > 0.28) {
    composition = "expanded";
  } else if (dna.layoutBias === "stacked") {
    composition = "stacked";
  } else if (dna.layoutBias === "edge") {
    composition = "cropped";
  }

  let symmetry = "symmetric";
  if (
    dna.layoutBias === "asymmetric" ||
    dna.layoutBias === "edge" ||
    dna.layoutBias === "left" ||
    stereoWidth > 0.28
  ) {
    symmetry = "asymmetric";
  } else if (dna.layoutBias === "radial") {
    symmetry = "offset";
  }

  let edgeTreatment = "soft";
  if (motionCharacter.physicality > 0.58 && rhythmicPersonality.irregularity > 0.45) {
    edgeTreatment = "hard";
  } else if (dna.layoutBias === "edge") {
    edgeTreatment = "cropped";
  } else if (dna.visualWeight === "airy" || warmOrganic) {
    edgeTreatment = "feathered";
  }

  const motionCharacterLabel = deriveMotionCharacter(
    dna.motionRhythm,
    dna.movementBias,
    audioFeatures
  );

  let depth = "flat";
  if (dna.layerCount >= 5) depth = "deep";
  else if (dna.layerCount >= 3) depth = "layered";

  let texture = "smooth";
  if (
    futuristic &&
    motionCharacter.fragmentation > 0.65 &&
    performanceTexture.humanity < 0.35
  ) {
    texture = "digital-noise";
  } else if (warmOrganic) {
    texture = analysisSignals.spectralFlatness > 0.4 ? "grain" : "smooth";
  } else if (performanceTexture.humanity > 0.52) {
    texture = "grain";
  } else if (dna.harmonicStability < 0.4) {
    texture = "dissolved";
  } else if (analysisSignals.spectralFlatness > 0.45) {
    texture = "grain";
  }

  return {
    geometry,
    composition,
    spacing: mapSpacingBehavior(dna.spacingBehavior),
    symmetry,
    edgeTreatment,
    motionCharacter: motionCharacterLabel,
    depth,
    texture,
  };
}

function deriveMotionCharacter(
  rhythm: MotionRhythm,
  movement: MovementBias,
  audioFeatures: AudioFeatures
): string {
  const { motionCharacter, rhythmicPersonality } = audioFeatures;

  if (motionCharacter.physicality > motionCharacter.flow + 0.08) {
    if (isHighKineticAudio(audioFeatures)) return "kinetic";
    return rhythmicPersonality.irregularity > 0.5 ? "kinetic" : "elastic";
  }

  if (motionCharacter.flow > motionCharacter.physicality + 0.08) {
    return movement === "orbital" || movement === "radial" ? "floating" : "elastic";
  }

  if (isHighKineticAudio(audioFeatures)) {
    if (rhythm === "burst" || rhythm === "staggered" || rhythm === "stop-start") {
      return "kinetic";
    }
    return "elastic";
  }

  if (
    motionCharacter.fragmentation > 0.62 &&
    isStronglyFuturisticSynthetic(audioFeatures)
  ) {
    return "fragmented";
  }

  const rhythmMap: Record<MotionRhythm, string> = {
    continuous: isWarmOrganic(audioFeatures) ? "elastic" : "elastic",
    staggered: movement === "horizontal" ? "mechanical" : "elastic",
    burst: rhythmicPersonality.irregularity > 0.55 ? "kinetic" : "elastic",
    cascading: "elastic",
    oscillating: "pulsing",
    "stop-start": isHighKineticAudio(audioFeatures) ? "kinetic" : "locked",
  };

  return rhythmMap[rhythm];
}

export function deriveComposition(dna: VisualDNA, audioFeatures: AudioFeatures): CompositionDirection {
  const silence = audioFeatures.analysisSignals.silenceRatio;

  const layoutMap: Record<
    LayoutBias,
    { composition: string; alignment: TextAlignment; density: TextDensity }
  > = {
    center: {
      composition: "center-column",
      alignment: "center",
      density: dna.sceneDensity === "dense" ? "dense" : "balanced",
    },
    left: {
      composition: "left-rail",
      alignment: "left",
      density: dna.sceneDensity === "minimal" ? "sparse" : "balanced",
    },
    radial: {
      composition: "radial-burst",
      alignment: "center",
      density: "sparse",
    },
    asymmetric: {
      composition: "offset-column",
      alignment: "left",
      density: "balanced",
    },
    stacked: {
      composition: "poster-stack",
      alignment: "center",
      density: "dense",
    },
    edge: {
      composition: "edge-anchor",
      alignment: "left",
      density: "sparse",
    },
  };

  const layout = layoutMap[dna.layoutBias];

  let negativeSpace = clamp01(0.35 + silence * 0.45 + (dna.sceneDensity === "minimal" ? 0.15 : 0));
  if (dna.layoutBias === "edge" || dna.layoutBias === "radial") {
    negativeSpace = clamp01(negativeSpace + 0.12);
  }
  if (dna.sceneDensity === "dense") {
    negativeSpace = clamp01(negativeSpace - 0.08);
  }

  return {
    composition: layout.composition,
    negativeSpace,
    alignment: layout.alignment,
    textDensity: layout.density,
  };
}

export function deriveMotionLanguage(
  dna: VisualDNA,
  audioFeatures: AudioFeatures,
  camera: CameraBrief
): MotionLanguageBrief {
  const direction = deriveDirectionPhrase(dna.movementBias);
  const highIntensity = isHighIntensityAudio(audioFeatures);
  const highKinetic = isHighKineticAudio(audioFeatures);
  const irregular =
    audioFeatures.rhythmicPersonality.irregularity >
    audioFeatures.rhythmicPersonality.groove + 0.08;
  const physical =
    audioFeatures.motionCharacter.physicality > audioFeatures.motionCharacter.flow;
  const lockedCamera = camera.movement === "locked";

  const aggression = highIntensity
    ? "hard"
    : dna.transitionAggression > 0.6
      ? "hard"
      : dna.transitionAggression > 0.35
        ? "firm"
        : "soft";

  const rhythmMap: Record<MotionRhythm, MotionLanguageBrief> = {
    continuous: {
      entrance: `${direction} fade-in with decisive settle`,
      idle: highIntensity
        ? "active internal rearrangement inside fixed frame"
        : "continuous flow with positional shifts",
      transition: `${aggression} crossfade morph`,
      exit: highIntensity ? "sharp crop exit" : "lateral dissolve",
    },
    staggered: {
      entrance: `stepped ${direction} reveal with offset timing`,
      idle: highKinetic
        ? "elastic displacement with overshoot rebound and asymmetric letter movement"
        : irregular
          ? "sharp displacement with tracking jumps and letter offsets"
          : "held offsets with rhythmic shifts",
      transition: `sequential ${direction} advance with scale jumps`,
      exit: "staggered displacement falloff",
    },
    burst: {
      entrance: `scatter ${direction} snap-assemble`,
      idle: highKinetic
        ? "physical push/pull with baseline wobble and imperfect timing"
        : physical
          ? "letter displacement with scale shifts and rapid rearrangement"
          : "impact hold with expressive jitter",
      transition: `${aggression} cut shift with positional tear`,
      exit: `${direction} impact scatter`,
    },
    cascading: {
      entrance: `top-down ${direction} cascade`,
      idle: physical ? "cascading positional changes with cropping" : "flowing trailing motion",
      transition: "waterfall reorder between phrases",
      exit: "cascade drip dissolve",
    },
    oscillating: {
      entrance: "pulse-scale entrance with rhythmic timing",
      idle: highIntensity ? "scale pulses with tracking changes" : "rhythmic swell and contract",
      transition: "oscillating morph between states",
      exit: "pulsed fade to silence",
    },
    "stop-start": {
      entrance: "freeze-frame then slam-in",
      idle: "held stillness punctuated by sharp internal bursts",
      transition: "start-stop jump cuts with displacement",
      exit: "hard cut to black",
    },
  };

  const motion = { ...rhythmMap[dna.motionRhythm] };

  if (lockedCamera) {
    motion.idle = highKinetic
      ? "viewport locked — elastic displacement and expressive letter movement inside frame"
      : irregular
        ? "viewport locked — typography shifts, scales, and rearranges inside frame"
        : highIntensity
          ? "viewport locked — bold internal displacement and tracking changes"
          : motion.idle;
    motion.entrance = motion.entrance.replace("gentle", "decisive");
  }

  if (highKinetic) {
    motion.idle = motion.idle
      .replace("gentle drift", "elastic displacement")
      .replace("micro-jitter", "overshoot rebound")
      .replace("steady mechanical pulse", "physical push/pull");
  }

  if (highIntensity) {
    motion.idle = motion.idle
      .replace("gentle", "decisive")
      .replace("subtle", "sharp");
  }

  return motion;
}

function deriveDirectionPhrase(movement: MovementBias): string {
  const map: Record<MovementBias, string> = {
    horizontal: "horizontal",
    vertical: "vertical",
    orbital: "orbital",
    radial: "radial",
  };
  return map[movement];
}

export function deriveCamera(dna: VisualDNA, audioFeatures: AudioFeatures): CameraBrief {
  const highIntensity = isHighIntensityAudio(audioFeatures);

  const map: Record<CameraEnergy, CameraBrief> = {
    locked: {
      movement: "locked",
      zoomBehavior: highIntensity ? "pulse" : "none",
    },
    "slow drift": { movement: "slow-drift", zoomBehavior: "slow-push" },
    tracking: { movement: "slow-drift", zoomBehavior: "slow-push" },
    orbit: {
      movement: "orbit",
      zoomBehavior: dna.transitionAggression > 0.5 ? "pulse" : "slow-pull",
    },
  };

  return map[dna.cameraEnergy];
}

function deriveArtisticIntent(
  songCharacter: AudioFeatures["songCharacter"],
  dna: VisualDNA,
  composition: CompositionDirection,
  motion: MotionLanguageBrief,
  camera: CameraBrief,
  audioFeatures: AudioFeatures
): string {
  const notes = [];
  notes.push(
    `Song character: ${songCharacter.performanceStyle} / ${songCharacter.energyType} / ${songCharacter.rhythmFeel} / ${songCharacter.texture} / ${songCharacter.emotionalTemperature}.`
  );
  if (camera.movement === "locked") {
    notes.push("Camera locked — motion happens inside the frame, not via viewport drift.");
  }
  if (isWarmOrganic(audioFeatures) && !isHighIntensityPalette(audioFeatures)) {
    notes.push("Warm/organic audio — palette follows emotional character, not font styling.");
  }
  if (isHighIntensityPalette(audioFeatures)) {
    notes.push("High-intensity audio — poster/editorial contrast with saturated accent, not subdued warm tones.");
  }
  if (isHighKineticAudio(audioFeatures)) {
    notes.push("High kinetic audio — prefer expressive displacement and imperfect timing over smooth floating or sterile mechanical pulses.");
  }
  if (isHighIntensityAudio(audioFeatures)) {
    notes.push("High-intensity audio — stronger contrast and force, not automatic fragmentation.");
  }

  return [
    `Text enters via ${motion.entrance}.`,
    `While visible: ${motion.idle}.`,
    `Between phrases: ${motion.transition}.`,
    `Exit: ${motion.exit}.`,
    `Layout: ${composition.composition} (${composition.alignment}, ${composition.textDensity}).`,
    `Camera: ${camera.movement}${camera.zoomBehavior !== "none" ? ` with ${camera.zoomBehavior}` : ""}.`,
    ...notes,
  ].join(" ");
}

export function generateDesignBrief(
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata
): CreativeDirection {
  return buildWeightedCreativeDirectionFromSelection(audioFeatures, selectedFont);
}
