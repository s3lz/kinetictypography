import {
  classifyCompositionFamily,
  type CompositionFamily,
} from "@/lib/directionFamilies";
import type { AudioFeatures } from "@/types/audio";
import type { CompositionDirection } from "@/types/designBrief";
import {
  MOTION_BEHAVIORS,
  type MotionBehavior,
  type MotionBehaviorBrief,
} from "@/types/motionBehavior";
import type { MotionDeformation, MotionLanguageBrief } from "@/types/motionLanguage";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function isHighEnergyFastTrack(audioFeatures: AudioFeatures): boolean {
  const energy = audioFeatures.emotionalVector.energy;
  const tempo =
    audioFeatures.tempoInterpretation?.normalizedTempo ?? audioFeatures.tempo;
  return energy > 0.7 && tempo > 120;
}

export function deriveMotionBehavior(
  audioFeatures: AudioFeatures,
  motionLanguage: MotionLanguageBrief,
  composition: CompositionDirection
): MotionBehaviorBrief {
  const {
    motionCharacter,
    rhythmicPersonality,
    performanceTexture,
    emotionalVector,
  } = audioFeatures;
  const { physicality, flow, elasticity, fragmentation } = motionCharacter;
  const compositionFamily = classifyCompositionFamily({
    composition,
    visualLanguage: {
      geometry: "",
      composition: "",
      spacing: "",
      symmetry: "",
      edgeTreatment: "",
      motionCharacter: "",
      depth: "",
      texture: "",
    },
    motionLanguage,
    artisticIntent: "",
    camera: { movement: "locked", zoomBehavior: "none" },
    palette: {
      background: "#f2efe6",
      textColor: "#243040",
      strategy: "light-dark",
      material: "paper texture",
      lightBehavior: "flat-graphic",
      paletteReasoning: "Flat graphic light on paper — background and typography only. Font had zero influence.",
    },
  });

  if (motionLanguage.deformation === "fragmentation" || fragmentation > 0.68) {
    return { primary: "collision", secondary: "impact" };
  }

  if (motionLanguage.timing === "staccato" && physicality > 0.55) {
    return { primary: "impact", secondary: "collision" };
  }

  if (flow > physicality + 0.1 && emotionalVector.organic > 0.5) {
    return { primary: "breathing", secondary: "orbit" };
  }

  if (elasticity > 0.55 && rhythmicPersonality.irregularity > 0.45) {
    return { primary: "stretch", secondary: "tension" };
  }

  if (motionLanguage.timing === "repetitive" && performanceTexture.mechanicalness > 0.5) {
    return { primary: "oscillation", secondary: "accumulation" };
  }

  if (audioFeatures.visualDna.sceneDensity === "dense" || composition.textDensity === "dense") {
    return { primary: "accumulation", secondary: "collision" };
  }

  if (motionLanguage.direction === "orbital" || motionLanguage.direction === "radial") {
    return { primary: "orbit", secondary: "breathing" };
  }

  if (emotionalVector.tension > 0.62 && physicality > flow) {
    return { primary: "tension", secondary: "stretch" };
  }

  if (compositionFamily === "offset-asymmetric" || compositionFamily === "edge-anchor") {
    return { primary: "tension", secondary: "reveal" };
  }

  if (motionLanguage.material === "fluid" && motionLanguage.timing === "smooth") {
    return { primary: "dissolve", secondary: "breathing" };
  }

  if (performanceTexture.humanity > 0.55) {
    return { primary: "reveal", secondary: "breathing" };
  }

  return { primary: "oscillation", secondary: "stretch" };
}

export function deformationForBehavior(behavior: MotionBehavior): MotionDeformation {
  switch (behavior) {
    case "impact":
    case "collision":
    case "accumulation":
    case "breathing":
    case "reveal":
      return "scale";
    case "stretch":
    case "tension":
    case "oscillation":
      return "stretch";
    case "orbit":
      return "rotation";
    case "dissolve":
      return "none";
    default:
      return "none";
  }
}

const BEHAVIOR_BY_COMPOSITION: Partial<Record<CompositionFamily, MotionBehavior>> = {
  "offset-asymmetric": "tension",
  "edge-anchor": "reveal",
  "left-rail": "breathing",
  "poster-stack": "accumulation",
  "radial-wide": "impact",
  "center-column": "oscillation",
};

export function pickAlternateBehavior(
  avoid: MotionBehavior,
  salt: number,
  compositionFamily?: CompositionFamily
): MotionBehavior {
  const preferred = compositionFamily
    ? BEHAVIOR_BY_COMPOSITION[compositionFamily]
    : undefined;

  const pool = MOTION_BEHAVIORS.filter((behavior) => behavior !== avoid);
  if (preferred && preferred !== avoid && pool.includes(preferred)) {
    return preferred;
  }

  return pool[salt % pool.length] ?? "breathing";
}

export function applyMotionBehaviorToDirection(
  direction: {
    motionLanguage: MotionLanguageBrief;
    motionBehavior: MotionBehaviorBrief;
  },
  behavior: MotionBehavior,
  secondary?: MotionBehavior
): {
  motionLanguage: MotionLanguageBrief;
  motionBehavior: MotionBehaviorBrief;
} {
  const deformation = deformationForBehavior(behavior);

  let material = direction.motionLanguage.material;
  if (behavior === "breathing" || behavior === "reveal") material = "organic";
  if (behavior === "oscillation" || behavior === "accumulation") material = "mechanical";
  if (behavior === "stretch" || behavior === "tension") material = "elastic";
  if (behavior === "dissolve") material = "fluid";
  if (behavior === "orbit") material = "fluid";

  let timing = direction.motionLanguage.timing;
  if (behavior === "breathing" || behavior === "dissolve") timing = "smooth";
  if (behavior === "impact" || behavior === "collision") timing = "staccato";
  if (behavior === "oscillation" || behavior === "accumulation") timing = "repetitive";
  if (behavior === "tension" || behavior === "stretch") timing = "irregular";

  let force = direction.motionLanguage.force;
  if (behavior === "impact" || behavior === "collision") {
    force = force === "subtle" ? "controlled" : force;
  } else if (behavior === "breathing" || behavior === "dissolve" || behavior === "reveal") {
    force = "subtle";
  }

  return {
    motionBehavior: {
      primary: behavior,
      secondary: secondary ?? direction.motionBehavior.secondary,
    },
    motionLanguage: {
      ...direction.motionLanguage,
      material,
      timing,
      deformation,
      force,
    },
  };
}

export function behaviorIntensity(behavior: MotionBehavior): number {
  const table: Record<MotionBehavior, number> = {
    impact: 0.92,
    collision: 0.88,
    accumulation: 0.78,
    tension: 0.74,
    stretch: 0.7,
    oscillation: 0.66,
    orbit: 0.58,
    reveal: 0.52,
    breathing: 0.48,
    dissolve: 0.42,
  };
  return clamp01(table[behavior]);
}
