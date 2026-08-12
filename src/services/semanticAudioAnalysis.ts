import type { SemanticAudioProfile } from "../types/audio";

export interface BandEnergies {
  sub: number;
  bass: number;
  mid: number;
  high: number;
}

export interface SemanticAnalysisInput {
  tempo: number;
  energy: number;
  brightness: number;
  density: number;
  dynamics: number;
  spectralFlatness: number;
  transient: number;
  fluxVariance: number;
  bands: BandEnergies;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function selectTopDescriptors(
  candidates: Array<{ label: string; score: number }>,
  minScore: number,
  maxCount: number
): string[] {
  return candidates
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    })
    .filter((candidate) => candidate.score >= minScore)
    .slice(0, maxCount)
    .map((candidate) => candidate.label);
}

function bandRatios(bands: BandEnergies) {
  const total = bands.sub + bands.bass + bands.mid + bands.high || 1;

  return {
    sub: bands.sub / total,
    bass: bands.bass / total,
    mid: bands.mid / total,
    high: bands.high / total,
  };
}

function inferMoodHints(input: SemanticAnalysisInput): string[] {
  const { tempo, energy, brightness, density, dynamics, transient, fluxVariance } =
    input;
  const soft = 1 - brightness;
  const sparse = 1 - density;
  const steady = 1 - dynamics;
  const slow = tempo < 95 ? 1 : tempo < 110 ? 0.45 : 0;
  const fast = tempo > 120 ? 1 : tempo > 105 ? 0.4 : 0;

  return selectTopDescriptors(
    [
      {
        label: "reflective",
        score: steady * 0.35 + soft * 0.3 + (1 - energy) * 0.25 + slow * 0.1,
      },
      {
        label: "yearning",
        score: dynamics * 0.35 + soft * 0.3 + energy * 0.2 + density * 0.1,
      },
      {
        label: "tender",
        score: (1 - energy) * 0.4 + steady * 0.25 + soft * 0.2 + sparse * 0.1,
      },
      {
        label: "buoyant",
        score: energy * 0.3 + brightness * 0.3 + fast * 0.25 + transient * 0.1,
      },
      {
        label: "restless",
        score: fluxVariance * 0.35 + energy * 0.3 + fast * 0.2 + dynamics * 0.1,
      },
      {
        label: "serene",
        score: (1 - energy) * 0.35 + steady * 0.3 + sparse * 0.2 + brightness * 0.1,
      },
      {
        label: "brooding",
        score: soft * 0.35 + density * 0.25 + dynamics * 0.2 + (1 - fast) * 0.1,
      },
      {
        label: "luminous",
        score: brightness * 0.45 + energy * 0.25 + (1 - soft) * 0.15 + dynamics * 0.1,
      },
      {
        label: "bittersweet",
        score: dynamics * 0.3 + soft * 0.25 + density * 0.2 + slow * 0.15,
      },
      {
        label: "euphoric",
        score: energy * 0.35 + brightness * 0.3 + dynamics * 0.2 + fast * 0.1,
      },
      {
        label: "weighted",
        score: soft * 0.3 + density * 0.3 + slow * 0.25 + (1 - brightness) * 0.1,
      },
      {
        label: "fragile",
        score: sparse * 0.3 + (1 - energy) * 0.25 + brightness * 0.2 + steady * 0.15,
      },
      {
        label: "hushed",
        score: (1 - energy) * 0.45 + steady * 0.3 + sparse * 0.15 + slow * 0.05,
      },
      {
        label: "radiant",
        score: brightness * 0.4 + energy * 0.3 + dynamics * 0.15 + fast * 0.1,
      },
      {
        label: "wistful",
        score: soft * 0.3 + slow * 0.25 + dynamics * 0.2 + (1 - energy) * 0.15,
      },
      {
        label: "playful",
        score: transient * 0.35 + brightness * 0.25 + energy * 0.2 + fluxVariance * 0.1,
      },
      {
        label: "solemn",
        score: slow * 0.35 + soft * 0.25 + steady * 0.2 + density * 0.1,
      },
      {
        label: "suspended",
        score: steady * 0.35 + (1 - transient) * 0.3 + sparse * 0.2 + (1 - fast) * 0.1,
      },
      {
        label: "wandering",
        score: fluxVariance * 0.3 + dynamics * 0.25 + slow * 0.2 + soft * 0.15,
      },
      {
        label: "commanding",
        score: energy * 0.35 + dynamics * 0.3 + density * 0.2 + fast * 0.1,
      },
    ],
    0.48,
    4
  );
}

function inferTextureHints(input: SemanticAnalysisInput): string[] {
  const { brightness, density, dynamics, spectralFlatness, transient, bands } =
    input;
  const { sub, bass, mid, high } = bandRatios(bands);
  const soft = 1 - brightness;
  const sparse = 1 - density;

  return selectTopDescriptors(
    [
      { label: "airy", score: brightness * 0.45 + sparse * 0.3 + (1 - density) * 0.15 },
      {
        label: "shimmering",
        score: brightness * 0.4 + high * 0.3 + transient * 0.15 + dynamics * 0.1,
      },
      { label: "hazy", score: soft * 0.4 + density * 0.25 + (1 - transient) * 0.2 },
      { label: "lush", score: density * 0.5 + soft * 0.2 + dynamics * 0.15 },
      {
        label: "grainy",
        score: spectralFlatness * 0.35 + soft * 0.25 + dynamics * 0.2 + transient * 0.1,
      },
      { label: "crisp", score: brightness * 0.45 + transient * 0.3 + (1 - spectralFlatness) * 0.15 },
      { label: "smooth", score: (1 - transient) * 0.4 + (1 - spectralFlatness) * 0.25 + soft * 0.15 },
      { label: "layered", score: density * 0.55 + dynamics * 0.2 + mid * 0.15 },
      { label: "intimate", score: sparse * 0.35 + soft * 0.25 + (1 - sub) * 0.2 + (1 - dynamics) * 0.1 },
      { label: "expansive", score: density * 0.35 + dynamics * 0.25 + sub * 0.15 + brightness * 0.1 },
      { label: "glassy", score: brightness * 0.45 + high * 0.25 + (1 - spectralFlatness) * 0.15 },
      {
        label: "warm analog",
        score: soft * 0.4 + (1 - spectralFlatness) * 0.25 + mid * 0.2 + (1 - sub) * 0.1,
      },
      {
        label: "synthetic",
        score: spectralFlatness * 0.4 + sub * 0.25 + brightness * 0.2 + transient * 0.1,
      },
      {
        label: "organic",
        score: (1 - spectralFlatness) * 0.35 + dynamics * 0.25 + mid * 0.2 + soft * 0.1,
      },
    ],
    0.46,
    4
  );
}

function inferSpaceHints(input: SemanticAnalysisInput): string[] {
  const { density, dynamics, brightness, energy, bands, transient } = input;
  const { sub, high } = bandRatios(bands);
  const sparse = 1 - density;
  const soft = 1 - brightness;

  return selectTopDescriptors(
    [
      { label: "intimate", score: sparse * 0.4 + (1 - sub) * 0.25 + (1 - energy) * 0.2 },
      { label: "spacious", score: sub * 0.3 + dynamics * 0.25 + density * 0.2 + sparse * 0.1 },
      { label: "cinematic", score: dynamics * 0.4 + density * 0.25 + sub * 0.15 + soft * 0.1 },
      { label: "floating", score: (1 - transient) * 0.35 + brightness * 0.25 + sparse * 0.2 + (1 - energy) * 0.1 },
      { label: "enclosed", score: density * 0.35 + soft * 0.3 + (1 - sub) * 0.15 + (1 - brightness) * 0.1 },
      { label: "wide", score: sub * 0.35 + dynamics * 0.25 + density * 0.2 + brightness * 0.1 },
      { label: "open", score: sparse * 0.4 + brightness * 0.25 + (1 - density) * 0.15 + dynamics * 0.1 },
      { label: "immersive", score: density * 0.4 + sub * 0.25 + dynamics * 0.2 + energy * 0.1 },
      {
        label: "atmospheric",
        score: density * 0.3 + soft * 0.25 + (1 - transient) * 0.2 + high * 0.15,
      },
    ],
    0.46,
    3
  );
}

function inferMotionHints(input: SemanticAnalysisInput): string[] {
  const {
    tempo,
    energy,
    dynamics,
    density,
    brightness,
    transient,
    fluxVariance,
  } = input;
  const steady = 1 - dynamics;
  const slow = tempo < 95 ? 1 : tempo < 110 ? 0.45 : 0;
  const fast = tempo > 115 ? 1 : tempo > 100 ? 0.35 : 0;

  return selectTopDescriptors(
    [
      {
        label: "drifting",
        score: slow * 0.35 + (1 - transient) * 0.3 + steady * 0.2 + (1 - energy) * 0.1,
      },
      {
        label: "gliding",
        score: (1 - transient) * 0.35 + brightness * 0.2 + steady * 0.2 + slow * 0.15,
      },
      {
        label: "pulsing",
        score: transient * 0.35 + fast * 0.25 + energy * 0.2 + (1 - fluxVariance) * 0.1,
      },
      {
        label: "swelling",
        score: dynamics * 0.4 + density * 0.25 + energy * 0.15 + slow * 0.1,
      },
      {
        label: "cascading",
        score: dynamics * 0.3 + fluxVariance * 0.25 + density * 0.2 + fast * 0.1,
      },
      {
        label: "suspended",
        score: steady * 0.4 + (1 - transient) * 0.3 + slow * 0.15 + (1 - fast) * 0.1,
      },
      {
        label: "oscillating",
        score: fluxVariance * 0.35 + transient * 0.25 + energy * 0.2 + fast * 0.1,
      },
      {
        label: "blooming",
        score: dynamics * 0.35 + density * 0.25 + energy * 0.2 + slow * 0.1,
      },
      {
        label: "flowing",
        score: (1 - fluxVariance) * 0.3 + density * 0.25 + (1 - transient) * 0.2 + slow * 0.15,
      },
      {
        label: "fragmented",
        score: fluxVariance * 0.45 + transient * 0.25 + dynamics * 0.15 + fast * 0.1,
      },
    ],
    0.46,
    4
  );
}

function inferInstrumentation(input: SemanticAnalysisInput): string[] {
  const { brightness, density, energy, dynamics, transient, bands } = input;
  const { sub, bass, mid, high } = bandRatios(bands);

  return selectTopDescriptors(
    [
      { label: "sub-bass", score: sub * 1.4 + energy * 0.15 },
      { label: "bass", score: bass * 1.1 + sub * 0.25 },
      { label: "drums", score: transient * 0.85 + bass * 0.35 + dynamics * 0.25 },
      { label: "percussion", score: transient * 0.75 + high * 0.45 },
      {
        label: "synth",
        score: density * 0.4 + brightness * 0.3 + high * 0.3 + transient * 0.15,
      },
      {
        label: "electronic",
        score: density * 0.3 + sub * 0.3 + brightness * 0.2 + transient * 0.2,
      },
      {
        label: "piano",
        score: mid * 0.75 + (1 - brightness) * 0.15 + (1 - transient) * 0.15 + dynamics * 0.1,
      },
      { label: "guitar", score: mid * 0.5 + brightness * 0.2 + dynamics * 0.2 },
      { label: "vocals", score: mid * 0.45 + brightness * 0.3 + dynamics * 0.15 },
      {
        label: "strings",
        score: mid * 0.3 + high * 0.3 + (1 - transient) * 0.2 + dynamics * 0.15,
      },
      {
        label: "ambient pads",
        score: (1 - transient) * 0.4 + density * 0.25 + (1 - energy) * 0.15 + softPad(brightness),
      },
      {
        label: "atmospheric texture",
        score: density * 0.3 + high * 0.25 + (1 - transient) * 0.2 + dynamics * 0.1,
      },
    ],
    0.3,
    4
  );
}

function softPad(brightness: number): number {
  return (1 - brightness) * 0.15;
}

export function buildSemanticAudioProfile(
  input: SemanticAnalysisInput
): SemanticAudioProfile {
  return {
    moodHints: inferMoodHints(input),
    textureHints: inferTextureHints(input),
    spaceHints: inferSpaceHints(input),
    motionHints: inferMotionHints(input),
    instrumentation: inferInstrumentation(input),
  };
}

export function computeSpectralFlatness(magnitudes: Float32Array): number {
  const significantMagnitudes = magnitudes.filter((value) => value > 1e-8);

  if (significantMagnitudes.length === 0) return 0;

  const arithmeticMean =
    significantMagnitudes.reduce((sum, value) => sum + value, 0) /
    significantMagnitudes.length;

  const geometricMean = Math.exp(
    significantMagnitudes.reduce((sum, value) => sum + Math.log(value), 0) /
      significantMagnitudes.length
  );

  return clamp01(arithmeticMean > 0 ? geometricMean / arithmeticMean : 0);
}

export function computeFluxVariance(spectralFlux: number[]): number {
  if (spectralFlux.length < 2) return 0;

  const mean =
    spectralFlux.reduce((sum, value) => sum + value, 0) / spectralFlux.length;
  const variance =
    spectralFlux.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    spectralFlux.length;
  const coefficientOfVariation =
    mean > 0 ? Math.sqrt(variance) / mean : 0;

  return clamp01(coefficientOfVariation / 1.2);
}
