export type MotionPersonality =
  | "physical"
  | "chaotic"
  | "theatrical"
  | "mechanical"
  | "flowing"
  | "restrained";

export const MOTION_PERSONALITIES: MotionPersonality[] = [
  "physical",
  "chaotic",
  "theatrical",
  "mechanical",
  "flowing",
  "restrained",
];

export const DEFAULT_MOTION_PERSONALITY: MotionPersonality = "physical";
