import type { MotionDimension } from "@/types/CreativeState";
import type { MotionSystemFn } from "./types";
import { computeElasticMotion } from "./motions/elastic";
import { computeFloatMotion } from "./motions/float";
import { computeImpactMotion } from "./motions/impact";
import { computeMaterialMotion } from "./motions/material";
import { computePulseMotion } from "./motions/pulse";
import { computeWaveMotion } from "./motions/wave";

/** Material is capped when blended — it is a surface layer, not locomotion. */
export const MATERIAL_BLEND_WEIGHT = 0.62;

export const MOTION_REGISTRY: Record<MotionDimension, MotionSystemFn> = {
  float: computeFloatMotion,
  wave: computeWaveMotion,
  pulse: computePulseMotion,
  elastic: computeElasticMotion,
  impact: computeImpactMotion,
  material: computeMaterialMotion,
};

export function getRegisteredMotion(type: MotionDimension): MotionSystemFn {
  return MOTION_REGISTRY[type];
}

export function registerMotionSystem(
  type: MotionDimension,
  system: MotionSystemFn
): void {
  MOTION_REGISTRY[type] = system;
}
