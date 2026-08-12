import type { MotionDimension } from "@/types/CreativeState";
import type { CharMotionInput } from "../types";
import { impactEnvelope, motionTime, resolveImpactParams } from "../motions/shared";

/**
 * Base cohesion — how much motion belongs to the word vs individual glyphs.
 * 0 = fully independent glyphs, 1 = word acts as one object.
 */
export const MOTION_COHESION_DEFAULTS: Record<MotionDimension, number> = {
  pulse: 0.95,
  wave: 0.85,
  elastic: 0.75,
  float: 0.7,
  impact: 0.9,
  material: 1,
};

/**
 * Impact cohesion: high during anticipation/recovery, briefly lower at hit
 * so glyphs can scatter for a moment without destroying word identity.
 */
export function resolveImpactCohesion(input: CharMotionInput): number {
  const params = resolveImpactParams(input, input.level);
  const elapsed = motionTime(input);
  const unit = ((input.charIndex * 2654435761) % 1000) / 1000;
  const cycleDuration = 2.8 + (1 - params.hitStrength) * 2.2 + unit * 0.4;
  const phase = (elapsed / cycleDuration) % 1;

  if (phase < 0.1) return 0.92;
  if (phase < 0.2) return 0.72;
  return 0.9;
}

export function resolveMotionCohesion(
  dimension: MotionDimension,
  input: CharMotionInput
): number {
  if (dimension === "impact") {
    return resolveImpactCohesion(input);
  }
  return MOTION_COHESION_DEFAULTS[dimension];
}

/** Blend active motion cohesions weighted by slider levels. */
export function blendCohesion(
  contributions: Array<{ dimension: MotionDimension; level: number; cohesion: number }>
): number {
  let weightSum = 0;
  let cohesionSum = 0;
  for (const entry of contributions) {
    if (entry.level <= 0) continue;
    weightSum += entry.level;
    cohesionSum += entry.cohesion * entry.level;
  }
  if (weightSum <= 0) return 0.8;
  return Math.min(1, Math.max(0, cohesionSum / weightSum));
}

/**
 * Bias cohesion from CreativeDirector energyDistribution.
 * High word share → word acts as one object; glyph stays detail.
 */
export function applyEnergyDistributionCohesion(
  baseCohesion: number,
  wordShare: number
): number {
  const word = Math.min(1, Math.max(0, wordShare));
  // Word-dominant budgets pull cohesion up; never drop below a readable floor.
  const biased = baseCohesion * 0.35 + word * 0.65;
  return Math.min(0.96, Math.max(0.7, biased));
}
