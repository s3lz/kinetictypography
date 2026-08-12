export const MOTION_BEHAVIORS = [
  "impact",
  "breathing",
  "accumulation",
  "collision",
  "tension",
  "stretch",
  "orbit",
  "dissolve",
  "reveal",
  "oscillation",
] as const;

export type MotionBehavior = (typeof MOTION_BEHAVIORS)[number];

export interface MotionBehaviorBrief {
  /** Physical metaphor driving animation primitive selection. */
  primary: MotionBehavior;
  /** Optional supporting metaphor — blended at lower weight in renderer. */
  secondary?: MotionBehavior;
}

export function motionBehaviorKey(brief: MotionBehaviorBrief): string {
  return brief.secondary
    ? `${brief.primary}|${brief.secondary}`
    : brief.primary;
}
