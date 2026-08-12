import { glyphPhaseOffset, glyphSeed } from "../glyphUtils";
import { lerp, mapMotionAmplitude, mapMotionSpeed, smoothLevel } from "../motionMapping";
import type { CharMotionInput } from "../types";
import type {
  ElasticParams,
  FloatParams,
  ImpactParams,
  MaterialParams,
  MotionParamsMap,
  PulseParams,
  WaveParams,
} from "@/types/motionMetadata";

export function emptyTransform() {
  return { x: 0, y: 0, scale: 1, rotation: 0, skewX: 0, opacity: 1 };
}

export function seedUnit(charIndex: number, salt: number): number {
  return (((glyphSeed(charIndex, salt) % 1000) + 1000) % 1000) / 1000;
}

export function motionLevel(input: CharMotionInput) {
  return smoothLevel(input.level, 1.08);
}

export function motionTime(input: CharMotionInput): number {
  return input.time * (input.speed ?? 1);
}

export function mapParams(level: number) {
  return {
    amplitude: mapMotionAmplitude(level, 0, 1, 1.1),
    speed: mapMotionSpeed(level, 0.35, 1.15, 1.05),
    subtle: mapMotionAmplitude(level, 0, 1, 1.05),
  };
}

export function resolvePulseParams(
  input: CharMotionInput,
  level: number
): PulseParams {
  const { amplitude, subtle } = mapParams(level);
  const unit = seedUnit(input.charIndex, input.independence);
  const defaults: PulseParams = {
    intensity: 0.35 + amplitude * 0.55,
    cycleDuration: 5 + (1 - level) * 3.5 + unit * 0.8,
    organicVariation: 0.04 + unit * 0.07 + subtle * 0.03,
    expansionAmount: 0.04 + amplitude * 0.08,
  };
  return { ...defaults, ...input.motionParams?.pulse };
}

export function resolveFloatParams(
  input: CharMotionInput,
  level: number
): FloatParams {
  const { amplitude, speed } = mapParams(level);
  const defaults: FloatParams = {
    amplitude: 0.35 + amplitude * 0.55,
    buoyancy: 0.55 + input.independence * 0.35,
    driftSpeed: 0.05 + speed * 0.07,
    independence: 0.4 + input.independence * 0.5,
  };
  return { ...defaults, ...input.motionParams?.float };
}

export function resolveWaveParams(input: CharMotionInput, level: number): WaveParams {
  const { amplitude, speed } = mapParams(level);
  const defaults: WaveParams = {
    amplitude: 0.3 + amplitude * 0.55,
    wavelength: 0.35 + (1 - level) * 0.15,
    propagationSpeed: 0.4 + speed * 0.8,
    smoothness: 0.55 + level * 0.3,
  };
  return { ...defaults, ...input.motionParams?.wave };
}

export function resolveElasticParams(
  input: CharMotionInput,
  level: number
): ElasticParams {
  const { amplitude, speed } = mapParams(level);
  const unit = seedUnit(input.charIndex, input.independence);
  const defaults: ElasticParams = {
    stiffness: 1.9 + speed * 2 + unit * 0.3,
    damping: 0.2 + (1 - level) * 0.16,
    bounce: 0.45 + level * 0.38,
    energy: 0.65 + amplitude * 0.85,
  };
  return { ...defaults, ...input.motionParams?.elastic };
}

export function resolveImpactParams(
  input: CharMotionInput,
  level: number
): ImpactParams {
  const { amplitude, speed } = mapParams(level);
  const unit = seedUnit(input.charIndex, input.independence);
  const defaults: ImpactParams = {
    hitStrength: 0.3 + amplitude * 0.65,
    decay: 0.45 + level * 0.35,
    anticipation: 0.07 + level * 0.05,
    randomness: unit * 0.4,
  };
  return { ...defaults, ...input.motionParams?.impact };
}

export function resolveMaterialParams(
  input: CharMotionInput,
  level: number
): MaterialParams {
  const { subtle, speed } = mapParams(level);
  const unit = seedUnit(input.charIndex, input.independence);
  const defaults: MaterialParams = {
    textureAmount: 0.25 + subtle * 0.55,
    roughness: 0.35 + level * 0.45,
    instability: 0.2 + unit * 0.35,
  };
  return { ...defaults, ...input.motionParams?.material };
}

/** Piecewise breath — inhale, hold, exhale with ease curves (not sine). */
export function breathEnvelope(
  t: number,
  cycleDuration: number,
  variation: number
): number {
  const phase = (t / cycleDuration + variation) % 1;
  if (phase < 0.32) {
    const p = phase / 0.32;
    return p * p * (3 - 2 * p);
  }
  if (phase < 0.44) return 1;
  const p = (phase - 0.44) / 0.56;
  const eased = p * p * (3 - 2 * p);
  return 1 - eased;
}

/** ADSR impact: compression → burst → recovery shaped by identity. */
export function impactEnvelope(
  t: number,
  cycleDuration: number,
  params: ImpactParams
): { compression: number; burst: number; displacement: number } {
  const phase = (t / cycleDuration) % 1;
  const jitter = params.randomness * 0.035;
  const release = params.releaseSpeed ?? 0.55;
  const compressAmt = params.compressionBeforeImpact ?? params.anticipation;
  const deform = params.deformationAmount ?? params.hitStrength;

  if (phase < 0.12) {
    const p = phase / 0.12;
    const eased = p * p * (3 - 2 * p);
    return {
      compression: -lerp(0, compressAmt + jitter, eased),
      burst: 0,
      displacement: 0,
    };
  }

  if (phase < 0.24) {
    const p = (phase - 0.12) / 0.12;
    const attack = Math.pow(Math.sin(p * Math.PI), Math.max(0.45, 1.15 - release));
    const burst = attack * params.hitStrength * (0.7 + deform * 0.5);
    // Ease compression out so the hit doesn't hard-cut from squeeze to burst.
    const compressionFade = (1 - p) * (1 - p);
    return {
      compression: -compressAmt * compressionFade * 0.35,
      burst,
      displacement: burst,
    };
  }

  const p = (phase - 0.24) / 0.76;
  const recoveryMode = params.recovery ?? "settle";
  const decayBoost =
    recoveryMode === "snap" ? 6.2 : recoveryMode === "reform" ? 4.4 : 2.8;
  const ring =
    recoveryMode === "snap"
      ? Math.cos(p * Math.PI * 1.05)
      : recoveryMode === "reform"
        ? Math.cos(p * Math.PI * 0.65)
        : Math.cos(p * Math.PI * 0.3);
  const recovery =
    params.hitStrength *
    0.28 *
    params.decay *
    Math.exp(-p * decayBoost) *
    ring;
  return { compression: 0, burst: recovery, displacement: recovery * 0.5 };
}

/** Damped spring impulse — stretch, overshoot, settle. */
export function springImpulse(
  t: number,
  stiffness: number,
  damping: number,
  impulsePeriod: number,
  phase: number,
  energy: number
): number {
  const localT = t % impulsePeriod;
  const w0 = stiffness;
  const zeta = Math.min(0.92, damping);
  const wd = w0 * Math.sqrt(Math.max(0.04, 1 - zeta * zeta));
  const envelope = Math.exp(-zeta * w0 * localT);
  // Soft fade instead of a hard 80ms on/off step.
  const impulseWindow = 0.12;
  const impulse =
    localT < impulseWindow
      ? energy * (1 - localT / impulseWindow) * (1 - localT / impulseWindow)
      : 0;
  return envelope * (Math.cos(wd * localT + phase) + impulse * 0.55);
}

export function glyphIndependence(input: CharMotionInput): number {
  return lerp(0.35, 1, input.independence);
}

export function glyphPhase(input: CharMotionInput, salt = 0): number {
  return glyphPhaseOffset(input.charIndex, salt + input.independence * 1.2);
}

export function independenceSpread(input: CharMotionInput, base: number, spread: number): number {
  const unit = seedUnit(input.charIndex, input.independence);
  return base + (unit - 0.5) * spread * glyphIndependence(input);
}

export type { MotionParamsMap };
