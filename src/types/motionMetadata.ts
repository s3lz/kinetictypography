import type { MotionDimension } from "./CreativeState";

/** Normalized 0–1 range for an audio signal. */
export interface AudioSignalRange {
  min: number;
  max: number;
}

export interface ElasticParams {
  stiffness: number;
  damping: number;
  bounce: number;
  energy: number;
  /** Identity-driven: peak stretch budget (0–1-ish → mapped to scale). */
  stretchAmount?: number;
  recoilStrength?: number;
  resistance?: number;
  forceDirection?: "inward" | "outward" | "vertical" | "horizontal" | "radial";
}

export interface ImpactParams {
  hitStrength: number;
  decay: number;
  anticipation: number;
  randomness: number;
  force?: number;
  compressionBeforeImpact?: number;
  releaseSpeed?: number;
  recovery?: "snap" | "settle" | "reform";
  deformationAmount?: number;
  direction?: "vertical" | "horizontal" | "radial";
  fragmentationAmount?: number;
  shardSpread?: number;
  silhouettePreservation?: number;
}

export interface WaveParams {
  amplitude: number;
  wavelength: number;
  propagationSpeed: number;
  smoothness: number;
}

export interface FloatParams {
  amplitude: number;
  buoyancy: number;
  driftSpeed: number;
  independence: number;
}

export interface PulseParams {
  intensity: number;
  cycleDuration: number;
  organicVariation: number;
  expansionAmount: number;
}

export interface MaterialParams {
  textureAmount: number;
  roughness: number;
  instability: number;
}

export type MotionPrimitiveParams =
  | PulseParams
  | FloatParams
  | WaveParams
  | ElasticParams
  | ImpactParams
  | MaterialParams;

export type MotionParamsMap = Partial<{
  pulse: PulseParams;
  float: FloatParams;
  wave: WaveParams;
  elastic: ElasticParams;
  impact: ImpactParams;
  material: MaterialParams;
}>;

export interface MotionPrimitiveMetadata {
  name: MotionDimension;
  physicalMetaphor: string;
  bestFor: string[];
  avoidWhen: string[];
  parameters: string[];
  audioSignals: Record<string, AudioSignalRange>;
}

export const MOTION_PRIMITIVE_METADATA: Record<MotionDimension, MotionPrimitiveMetadata> = {
  pulse: {
    name: "pulse",
    physicalMetaphor: "a living organism breathing — inhale, hold, exhale",
    bestFor: ["emotional", "organic", "atmospheric", "intimate", "warm_space", "reveal"],
    avoidWhen: ["staccato", "explosive", "grid", "high transient", "collision"],
    parameters: ["intensity", "cycleDuration", "organicVariation", "expansionAmount"],
    audioSignals: {
      warmth: { min: 0.45, max: 1 },
      organic: { min: 0.4, max: 1 },
      energy: { min: 0.15, max: 0.65 },
      humanity: { min: 0.4, max: 1 },
    },
  },
  float: {
    name: "float",
    physicalMetaphor: "letters suspended in air or underwater — weightless buoyancy",
    bestFor: ["dreamy", "spacious", "ambient", "flowing", "atmospheric", "floating"],
    avoidWhen: ["staccato", "collision", "dense", "explosive", "restless"],
    parameters: ["amplitude", "buoyancy", "driftSpeed", "independence"],
    audioSignals: {
      organic: { min: 0.35, max: 1 },
      energy: { min: 0, max: 0.55 },
      tension: { min: 0, max: 0.5 },
      silenceRatio: { min: 0.25, max: 1 },
    },
  },
  wave: {
    name: "wave",
    physicalMetaphor: "typography as fabric, water, or a propagating field",
    bestFor: ["melodic", "rhythmic", "flowing vocals", "groove", "swinging", "connected"],
    avoidWhen: ["sparse", "isolated hits", "minimal", "locked"],
    parameters: ["amplitude", "wavelength", "propagationSpeed", "smoothness"],
    audioSignals: {
      groove: { min: 0.4, max: 1 },
      repetition: { min: 0.35, max: 1 },
      beatConsistency: { min: 0.45, max: 1 },
      flow: { min: 0.4, max: 1 },
    },
  },
  elastic: {
    name: "elastic",
    physicalMetaphor: "rubber tension, stretch, overshoot, and rebound",
    bestFor: ["live_band", "restless", "high dynamics", "human performance", "stretch", "tension"],
    avoidWhen: ["ambient", "slow", "minimal", "atmospheric", "locked grid"],
    parameters: ["stiffness", "damping", "bounce", "energy"],
    audioSignals: {
      energy: { min: 0.55, max: 1 },
      dynamics: { min: 0.45, max: 1 },
      humanity: { min: 0.4, max: 1 },
      elasticity: { min: 0.4, max: 1 },
    },
  },
  impact: {
    name: "impact",
    physicalMetaphor: "collision or sudden force — anticipation, burst, recovery",
    bestFor: ["transient spikes", "isolated hits", "staccato", "explosive punctuation"],
    avoidWhen: ["ambient", "slow", "continuous", "repetitive groove", "atmospheric"],
    parameters: ["hitStrength", "decay", "anticipation", "randomness"],
    audioSignals: {
      transientSharpness: { min: 0.55, max: 1 },
      staccato: { min: 0.5, max: 1 },
      energy: { min: 0.6, max: 1 },
    },
  },
  material: {
    name: "material",
    physicalMetaphor: "surface behavior — ink bleed, paper vibration, glass distortion",
    bestFor: ["grainy", "raw", "textural", "secondary accent", "live_band surface"],
    avoidWhen: ["primary locomotion", "large displacement"],
    parameters: ["textureAmount", "roughness", "instability"],
    audioSignals: {
      spectralFlatness: { min: 0.25, max: 1 },
      humanity: { min: 0.2, max: 0.85 },
    },
  },
};

/** Complementary secondary pairings. */
export const MOTION_SECONDARY_PAIRINGS: Partial<
  Record<MotionDimension, MotionDimension[]>
> = {
  elastic: ["material", "pulse"],
  wave: ["pulse", "material"],
  float: ["pulse", "material"],
  pulse: ["material", "float"],
  impact: ["material"],
  material: ["pulse"],
};

export interface MotionBias {
  flowing: number;
  organic: number;
  connected: number;
  physical: number;
  textural: number;
  impact: number;
}

export interface MotionProfileSelection {
  motionProfile: MotionDimension;
  secondaryMotion?: MotionDimension;
  motionBias: MotionBias;
}

export interface MotionSelectionResult {
  primary: MotionDimension;
  secondary: MotionDimension[];
  levels: import("./CreativeState").MotionLevels;
  motionParams: MotionParamsMap;
  bias: MotionBias;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function inRange(value: number, range: AudioSignalRange): number {
  if (value < range.min) return clamp01(1 - (range.min - value) / Math.max(range.min, 0.01));
  if (value > range.max) return clamp01(1 - (value - range.max) / Math.max(1 - range.max, 0.01));
  return 1;
}

export function scoreMotionPrimitiveFit(
  dimension: MotionDimension,
  signals: Record<string, number>,
  songTags: string[]
): number {
  const meta = MOTION_PRIMITIVE_METADATA[dimension];
  let score = 0;
  let count = 0;

  for (const [key, range] of Object.entries(meta.audioSignals)) {
    if (signals[key] === undefined) continue;
    score += inRange(signals[key], range);
    count += 1;
  }

  const signalScore = count > 0 ? score / count : 0.35;

  const bestHits = meta.bestFor.filter((tag) =>
    songTags.some((t) => t.includes(tag) || tag.includes(t))
  ).length;
  const avoidHits = meta.avoidWhen.filter((tag) =>
    songTags.some((t) => t.includes(tag) || tag.includes(t))
  ).length;

  return clamp01(signalScore * 0.65 + bestHits * 0.12 - avoidHits * 0.18);
}

export function motionBiasToLevels(bias: MotionBias): Record<MotionDimension, number> {
  const raw: Record<MotionDimension, number> = {
    float: bias.flowing,
    wave: bias.connected,
    pulse: bias.organic,
    elastic: bias.physical,
    impact: bias.impact,
    material: bias.textural,
  };

  const max = Math.max(...Object.values(raw), 0.001);
  const scaled = {} as Record<MotionDimension, number>;
  for (const [key, value] of Object.entries(raw) as Array<[MotionDimension, number]>) {
    scaled[key] = Math.round(clamp01(value / max) * 100);
  }
  return scaled;
}

export function deriveMotionProfileFromBias(
  bias: MotionBias,
  secondaryMotion: MotionDimension = "material"
): MotionProfileSelection {
  const levels = motionBiasToLevels(bias);
  const ranked = (Object.entries(levels) as Array<[MotionDimension, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const motionProfile = ranked[0]?.[0] ?? "float";
  const secondaryCandidate = ranked[1]?.[0];

  return {
    motionProfile,
    secondaryMotion:
      secondaryCandidate && secondaryCandidate !== motionProfile
        ? secondaryCandidate
        : secondaryMotion !== motionProfile
          ? secondaryMotion
          : undefined,
    motionBias: bias,
  };
}

export function pickSecondaryMotion(
  primary: MotionDimension,
  ranked: Array<[MotionDimension, number]>
): MotionDimension | undefined {
  const pairings = MOTION_SECONDARY_PAIRINGS[primary] ?? ["material"];
  for (const candidate of pairings) {
    if (candidate !== primary) return candidate;
  }
  return ranked.find(([dim]) => dim !== primary)?.[0];
}
