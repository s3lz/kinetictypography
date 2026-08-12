import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  emptyTransform,
  motionLevel,
  motionTime,
  resolveMaterialParams,
  seedUnit,
} from "./shared";

function materialNoise(seed: number, t: number, roughness: number): number {
  return (
    (Math.sin(t * 1.6 + seed) * 0.5 +
      Math.sin(t * 2.7 + seed * 1.14) * 0.3 +
      Math.sin(t * 4.1 + seed * 0.67) * 0.2) *
    roughness
  );
}

/** MATERIAL — secondary surface layer. No large locomotion. */
export function computeMaterialMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const level = motionLevel(input);
  const elapsed = motionTime(input);
  const params = resolveMaterialParams(input, input.level);

  if (input.charIndex === 0) {
    updateMotionMappingDebug(
      "material",
      sampleMotionMapping(Math.round(input.level * 100), 0, 2.2, params.textureAmount, 0.42)
    );
  }

  const unit = seedUnit(input.charIndex, input.independence);
  const cap = params.textureAmount * (0.5 + params.instability * 0.35);
  const t = elapsed * (0.14 + params.textureAmount * 0.12) + input.charIndex * 0.035;

  const noiseA = materialNoise(unit * 40, t, params.roughness);
  const noiseB = materialNoise(unit * 40 + 19, t * 0.86, params.roughness);
  const noiseC = materialNoise(unit * 40 + 33, t * 1.02, params.roughness);

  return {
    x: noiseA * 0.75 * cap,
    y: noiseB * 0.45 * cap,
    scale: 1 + Math.abs(noiseC) * 0.006 * cap,
    rotation: noiseA * 0.85 * cap,
    skewX: noiseB * 0.7 * cap,
    opacity: 1 - Math.abs(noiseC) * 0.028 * cap * params.instability,
  };
}
