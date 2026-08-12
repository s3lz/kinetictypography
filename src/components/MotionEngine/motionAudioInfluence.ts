import type { MotionDimension } from "@/types/CreativeState";
import type { AudioAccent } from "./audioAccent";
import type { CharTransform } from "./types";

/** Max share of motion driven by live audio (0–1). */
export const MOTION_AUDIO_INFLUENCE: Record<MotionDimension, number> = {
  float: 0.06,
  wave: 0.1,
  pulse: 0.12,
  elastic: 0.2,
  impact: 0.62,
  material: 0.16,
};

export interface MotionAudioDebug {
  float: number;
  wave: number;
  pulse: number;
  elastic: number;
  impact: number;
  material: number;
  audioInfluence: AudioAccent;
  appliedInfluence: Record<MotionDimension, number>;
}

let lastMotionAudioDebug: MotionAudioDebug | null = null;

export function getLastMotionAudioDebug(): MotionAudioDebug | null {
  return lastMotionAudioDebug;
}

export function resolveCreativeSpeed(animationSpeed: number): number {
  return Math.max(0.65, Math.min(1.35, animationSpeed));
}

export function applyAudioAccentLayer(
  transform: CharTransform,
  dimension: MotionDimension,
  accent: AudioAccent,
  sliderLevel: number
): CharTransform {
  const influence = MOTION_AUDIO_INFLUENCE[dimension] * sliderLevel;
  if (influence <= 0) {
    return transform;
  }

  const hasAccentSignal =
    dimension === "impact"
      ? accent.beat > 0 || accent.transient > 0
      : accent.energy > 0 || accent.transient > 0;

  if (!hasAccentSignal) {
    return transform;
  }

  const accentStrength =
    dimension === "impact"
      ? accent.beat * 0.75 + accent.transient * 0.55
      : accent.energy * 0.35 + accent.transient * 0.15;

  const amount = accentStrength * influence;
  if (amount <= 0.001) return transform;

  switch (dimension) {
    case "impact":
      return {
        ...transform,
        x: transform.x + amount * 10,
        y: transform.y + amount * 5,
        scale: transform.scale + amount * 0.1,
        rotation: transform.rotation + amount * 6,
      };
    case "float":
      return {
        ...transform,
        x: transform.x + amount * 2,
        y: transform.y + amount * 1.2,
      };
    case "wave":
      return {
        ...transform,
        y: transform.y + amount * 2.5,
        rotation: transform.rotation + amount * 1.2,
      };
    case "pulse":
      return {
        ...transform,
        scale: transform.scale + amount * 0.03,
        opacity: transform.opacity - amount * 0.02,
      };
    case "material":
      return {
        ...transform,
        rotation: transform.rotation + amount * 1.2,
        skewX: transform.skewX + amount * 0.6,
        opacity: transform.opacity - amount * 0.015,
      };
    case "elastic":
      return {
        ...transform,
        x: transform.x + amount * 4,
        y: transform.y + amount * 2.5,
        rotation: transform.rotation + amount * 2,
      };
    default:
      return transform;
  }
}

export function updateMotionAudioDebug(
  motion: Record<MotionDimension, number>,
  accent: AudioAccent,
  sliderLevels: Record<MotionDimension, number>
): void {
  const appliedInfluence = {} as Record<MotionDimension, number>;
  for (const dimension of Object.keys(MOTION_AUDIO_INFLUENCE) as MotionDimension[]) {
    appliedInfluence[dimension] =
      MOTION_AUDIO_INFLUENCE[dimension] * sliderLevels[dimension];
  }

  lastMotionAudioDebug = {
    float: motion.float,
    wave: motion.wave,
    pulse: motion.pulse,
    elastic: motion.elastic,
    impact: motion.impact,
    material: motion.material,
    audioInfluence: accent,
    appliedInfluence,
  };
}
