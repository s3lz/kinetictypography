import type { MotionDimension, MotionLevels } from "../../types/CreativeState";
import { MOTION_COHESION_DEFAULTS } from "./hierarchy/cohesion";

/**
 * Cohesion 0–100 for Unity / independence helpers.
 * Driven by active motion primitives' defaults, weighted by slider levels.
 */
export function computeCohesionLevel(motion: MotionLevels): number {
  let weightSum = 0;
  let cohesionSum = 0;

  for (const dimension of Object.keys(MOTION_COHESION_DEFAULTS) as MotionDimension[]) {
    const level = Math.max(0, motion[dimension] ?? 0);
    if (level <= 0) continue;
    const defaults = MOTION_COHESION_DEFAULTS[dimension];
    weightSum += level;
    cohesionSum += defaults * level;
  }

  if (weightSum <= 0) {
    return 80;
  }

  return Math.round(Math.min(100, Math.max(0, (cohesionSum / weightSum) * 100)));
}

export function computeSpatialProfileModifier(
  motion: MotionLevels,
  primary: MotionDimension
): number {
  const primaryLevel = motion[primary] / 100;
  const waveLevel = motion.wave / 100;
  const materialLevel = motion.material / 100;

  if (primary === "wave") return 0.85 + waveLevel * 0.25;
  if (primary === "float") return 0.72 + primaryLevel * 0.18;
  if (primary === "elastic") return 0.95 + primaryLevel * 0.35;
  if (primary === "impact") return 1.05 + primaryLevel * 0.4;
  if (primary === "pulse") return 0.78 + primaryLevel * 0.12;
  return 0.8 + materialLevel * 0.1;
}
