import type { MotionDimension } from "@/types/CreativeState";
import type { MotionBehavior, MotionBehaviorBrief } from "@/types/motionBehavior";

export type BehaviorPrimitiveWeights = Record<MotionDimension, number>;

const BEHAVIOR_PRIMITIVE_MAP: Record<MotionBehavior, BehaviorPrimitiveWeights> = {
  impact: { float: 0.06, wave: 0.12, pulse: 0.1, elastic: 0.35, impact: 1, material: 0.25 },
  breathing: { float: 0.35, wave: 0.15, pulse: 1, elastic: 0.1, impact: 0.04, material: 0.08 },
  accumulation: { float: 0.12, wave: 0.85, pulse: 0.2, elastic: 0.15, impact: 0.5, material: 0.65 },
  collision: { float: 0.08, wave: 0.1, pulse: 0.15, elastic: 0.95, impact: 0.92, material: 0.18 },
  tension: { float: 0.1, wave: 0.2, pulse: 0.45, elastic: 1, impact: 0.3, material: 0.12 },
  stretch: { float: 0.08, wave: 0.12, pulse: 0.4, elastic: 1, impact: 0.18, material: 0.1 },
  orbit: { float: 0.95, wave: 0.25, pulse: 0.3, elastic: 0.5, impact: 0.06, material: 0.08 },
  dissolve: { float: 0.88, wave: 0.55, pulse: 0.55, elastic: 0.1, impact: 0.03, material: 0.15 },
  reveal: { float: 0.32, wave: 0.65, pulse: 0.85, elastic: 0.22, impact: 0.1, material: 0.12 },
  oscillation: { float: 0.18, wave: 0.92, pulse: 0.35, elastic: 0.28, impact: 0.22, material: 0.75 },
};

export function resolveBehaviorPrimitiveWeights(
  behavior: MotionBehaviorBrief
): BehaviorPrimitiveWeights {
  const primary = BEHAVIOR_PRIMITIVE_MAP[behavior.primary];
  if (!behavior.secondary) return primary;

  const secondary = BEHAVIOR_PRIMITIVE_MAP[behavior.secondary];
  const blend = 0.32;

  return {
    float: primary.float * (1 - blend) + secondary.float * blend,
    wave: primary.wave * (1 - blend) + secondary.wave * blend,
    pulse: primary.pulse * (1 - blend) + secondary.pulse * blend,
    elastic: primary.elastic * (1 - blend) + secondary.elastic * blend,
    impact: primary.impact * (1 - blend) + secondary.impact * blend,
    material: primary.material * (1 - blend) + secondary.material * blend,
  };
}

export function resolveBehaviorMotionProfile(
  behavior: MotionBehaviorBrief
): { primary: MotionDimension; secondary: MotionDimension[] } {
  const weights = resolveBehaviorPrimitiveWeights(behavior);
  const ranked = (Object.entries(weights) as Array<[MotionDimension, number]>).sort(
    (a, b) => b[1] - a[1]
  );

  const primary = ranked[0]?.[0] ?? "float";
  const secondary = ranked
    .slice(1, 3)
    .filter(([, weight]) => weight >= 0.35)
    .map(([dimension]) => dimension);

  return { primary, secondary };
}
