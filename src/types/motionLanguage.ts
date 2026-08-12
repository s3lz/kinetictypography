export type MotionForce = "subtle" | "controlled" | "aggressive" | "explosive";

export type MotionMaterial = "fluid" | "elastic" | "rigid" | "mechanical" | "organic";

export type MotionTiming = "smooth" | "staccato" | "irregular" | "repetitive";

export type MotionDeformation =
  | "none"
  | "scale"
  | "stretch"
  | "rotation"
  | "fragmentation";

export type MotionDirection =
  | "horizontal"
  | "vertical"
  | "radial"
  | "orbital"
  | "random";

export interface MotionLanguageBrief {
  force: MotionForce;
  material: MotionMaterial;
  timing: MotionTiming;
  deformation: MotionDeformation;
  direction: MotionDirection;
}

export const MOTION_FORCES: MotionForce[] = [
  "subtle",
  "controlled",
  "aggressive",
  "explosive",
];

export const MOTION_MATERIALS: MotionMaterial[] = [
  "fluid",
  "elastic",
  "rigid",
  "mechanical",
  "organic",
];

export const MOTION_TIMINGS: MotionTiming[] = [
  "smooth",
  "staccato",
  "irregular",
  "repetitive",
];

export const MOTION_DEFORMATIONS: MotionDeformation[] = [
  "none",
  "scale",
  "stretch",
  "rotation",
  "fragmentation",
];

export const MOTION_DIRECTIONS: MotionDirection[] = [
  "horizontal",
  "vertical",
  "radial",
  "orbital",
  "random",
];

export function motionDimensionKey(brief: MotionLanguageBrief): string {
  return `${brief.force}|${brief.material}|${brief.timing}|${brief.deformation}|${brief.direction}`;
}
