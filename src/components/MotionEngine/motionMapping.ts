import type { MotionDimension } from "@/types/CreativeState";

export interface MotionMappingSample {
  sliderValue: number;
  normalizedValue: number;
  finalAmplitude: number;
  finalSpeed: number;
}

export type MotionMappingDebug = Partial<Record<MotionDimension, MotionMappingSample>>;

let lastMotionMappingDebug: MotionMappingDebug = {};

export function getLastMotionMappingDebug(): MotionMappingDebug {
  return lastMotionMappingDebug;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(min: number, max: number, t: number): number {
  const normalized = clamp01(t);
  return min + (max - min) * normalized;
}

/** Subtle ease-in — exponent kept between 1.0 and 1.3 for continuity. */
export function smoothLevel(level: number, exponent = 1.12): number {
  const clamped = clamp01(level);
  if (clamped <= 0) return 0;
  return Math.pow(clamped, Math.max(1, Math.min(1.3, exponent)));
}

export function mapMotionAmplitude(
  level: number,
  minAmplitude: number,
  maxAmplitude: number,
  exponent = 1.12
): number {
  return lerp(minAmplitude, maxAmplitude, smoothLevel(level, exponent));
}

export function mapMotionSpeed(
  level: number,
  minSpeed: number,
  maxSpeed: number,
  exponent = 1.08
): number {
  return lerp(minSpeed, maxSpeed, smoothLevel(level, exponent));
}

export function sampleMotionMapping(
  sliderValue: number,
  minAmplitude: number,
  maxAmplitude: number,
  minSpeed: number,
  maxSpeed: number
): MotionMappingSample {
  const normalizedValue = clamp01(sliderValue / 100);
  return {
    sliderValue,
    normalizedValue,
    finalAmplitude: mapMotionAmplitude(normalizedValue, minAmplitude, maxAmplitude),
    finalSpeed: mapMotionSpeed(normalizedValue, minSpeed, maxSpeed),
  };
}

export function updateMotionMappingDebug(
  dimension: MotionDimension,
  sample: MotionMappingSample
): void {
  lastMotionMappingDebug = {
    ...lastMotionMappingDebug,
    [dimension]: sample,
  };
}

export function resetMotionMappingDebug(): void {
  lastMotionMappingDebug = {};
}
