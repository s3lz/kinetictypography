import type { AudioAnalysisSignals } from "@/types/visualDna";
import type { BandEnergies } from "./semanticAudioAnalysis";

const HOP_SIZE = 1024;
const FFT_SIZE = 2048;

export interface ExtendedFrameAnalysis {
  frameRms: number[];
  frameBandEnergies: BandEnergies[];
  spectralFlux: number[];
  frameCentroids: number[];
  stereoWidthFrames: number[];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function normalizeFlux(flux: number): number {
  return clamp01(Math.log10(flux + 1) / 3.2);
}

function computeFrameCentroid(
  magnitudes: Float32Array,
  sampleRate: number
): number {
  const binWidth = sampleRate / FFT_SIZE;
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let bin = 0; bin < magnitudes.length; bin++) {
    const magnitude = magnitudes[bin];
    weightedSum += bin * binWidth * magnitude;
    magnitudeSum += magnitude;
  }

  if (magnitudeSum === 0) return 0;
  return (weightedSum / magnitudeSum) / (sampleRate / 2);
}

function detectOnsets(
  frameRms: number[],
  spectralFlux: number[],
  sampleRate: number
): { onsetIndices: number[]; tempo: number } {
  if (frameRms.length < 8) {
    return { onsetIndices: [], tempo: 0 };
  }

  const secondsPerFrame = HOP_SIZE / sampleRate;
  const onsetSignal = frameRms.map((rms, index) => {
    const previous = index > 0 ? frameRms[index - 1] : rms;
    const flux = spectralFlux[index] ?? 0;
    const rise = Math.max(0, rms - previous);
    return rise * 0.6 + flux * 0.4;
  });

  const onsetThreshold = percentile(onsetSignal, 0.7) * 0.85;
  const onsetIndices: number[] = [];

  for (let index = 1; index < onsetSignal.length - 1; index++) {
    const value = onsetSignal[index];
    if (
      value >= onsetThreshold &&
      value >= onsetSignal[index - 1] &&
      value > onsetSignal[index + 1]
    ) {
      const lastOnset = onsetIndices[onsetIndices.length - 1];
      if (lastOnset === undefined || index - lastOnset > 2) {
        onsetIndices.push(index);
      }
    }
  }

  if (onsetIndices.length < 3) {
    return { onsetIndices, tempo: 0 };
  }

  const intervals: number[] = [];
  for (let index = 1; index < onsetIndices.length; index++) {
    intervals.push(onsetIndices[index] - onsetIndices[index - 1]);
  }

  const medianInterval = percentile(intervals, 0.5);
  if (medianInterval <= 0) {
    return { onsetIndices, tempo: 0 };
  }

  const beatSeconds = medianInterval * secondsPerFrame;
  const bpm = Math.round(60 / beatSeconds);

  return {
    onsetIndices,
    tempo: Math.min(180, Math.max(60, bpm)),
  };
}

function computeBeatConsistency(intervals: number[]): number {
  if (intervals.length < 2) return 0;

  const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  if (mean <= 0) return 0;

  const variance =
    intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) / intervals.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;

  return clamp01(1 - coefficientOfVariation / 0.85);
}

function computeOnsetClustering(onsetIndices: number[]): number {
  if (onsetIndices.length < 4) return 0;

  const gaps: number[] = [];
  for (let index = 1; index < onsetIndices.length; index++) {
    gaps.push(onsetIndices[index] - onsetIndices[index - 1]);
  }

  const shortGaps = gaps.filter((gap) => gap <= 3).length;
  const longGaps = gaps.filter((gap) => gap >= 8).length;

  return clamp01(shortGaps / gaps.length + longGaps / gaps.length / 2);
}

function computePhraseCadence(intervals: number[]): number {
  if (intervals.length < 2) return 0.5;

  const median = percentile(intervals, 0.5);
  const spread = percentile(intervals, 0.75) - percentile(intervals, 0.25);
  const normalizedMedian = clamp01(median / 24);
  const normalizedSpread = clamp01(spread / 16);

  return clamp01(normalizedSpread * 0.55 + normalizedMedian * 0.45);
}

function computeSilenceRatio(frameRms: number[]): number {
  if (frameRms.length === 0) return 0;

  const threshold = percentile(frameRms, 0.2) * 1.15;
  const silentFrames = frameRms.filter((rms) => rms <= threshold).length;
  return clamp01(silentFrames / frameRms.length);
}

function computeStereoWidth(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): number {
  const step = Math.max(1, Math.floor(sampleRate / 200));
  let correlation = 0;
  let leftEnergy = 0;
  let rightEnergy = 0;
  let count = 0;

  for (let index = 0; index < Math.min(left.length, right.length); index += step) {
    const l = left[index];
    const r = right[index];
    correlation += l * r;
    leftEnergy += l * l;
    rightEnergy += r * r;
    count += 1;
  }

  if (count === 0 || leftEnergy === 0 || rightEnergy === 0) return 0.5;

  const normalizedCorrelation = correlation / Math.sqrt(leftEnergy * rightEnergy);
  return clamp01(1 - Math.abs(normalizedCorrelation));
}

function computeStereoWidthFrames(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  frameCount: number
): number[] {
  const frames: number[] = [];
  const framesPerWindow = Math.max(1, Math.floor((0.1 * sampleRate) / HOP_SIZE));

  for (let frame = 0; frame < frameCount; frame++) {
    const offset = frame * HOP_SIZE;
    const end = Math.min(offset + HOP_SIZE, Math.min(left.length, right.length));
    if (offset >= end) {
      frames.push(frames[frames.length - 1] ?? 0.5);
      continue;
    }

    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;

    for (let index = offset; index < end; index++) {
      const l = left[index];
      const r = right[index];
      correlation += l * r;
      leftEnergy += l * l;
      rightEnergy += r * r;
    }

    if (leftEnergy === 0 || rightEnergy === 0) {
      frames.push(0.5);
      continue;
    }

    const normalizedCorrelation = correlation / Math.sqrt(leftEnergy * rightEnergy);
    frames.push(clamp01(1 - Math.abs(normalizedCorrelation)));
  }

  if (frames.length === 0) return [0.5];
  return frames;
}

function computeCentroidVariance(frameCentroids: number[]): number {
  if (frameCentroids.length < 2) return 0;

  const mean =
    frameCentroids.reduce((sum, value) => sum + value, 0) / frameCentroids.length;
  const variance =
    frameCentroids.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    frameCentroids.length;

  return clamp01(Math.sqrt(variance) / 0.18);
}

function computeTransientSharpness(spectralFlux: number[]): number {
  if (spectralFlux.length === 0) return 0;

  const mean = spectralFlux.reduce((sum, value) => sum + value, 0) / spectralFlux.length;
  const peak = Math.max(...spectralFlux);

  if (mean <= 0) return 0;
  return clamp01((peak / mean - 1) / 6);
}

function computeRmsVariance(frameRms: number[]): number {
  if (frameRms.length < 2) return 0;

  const mean = frameRms.reduce((sum, value) => sum + value, 0) / frameRms.length;
  if (mean <= 0) return 0;

  const variance =
    frameRms.reduce((sum, value) => sum + (value - mean) ** 2, 0) / frameRms.length;

  return clamp01(Math.sqrt(variance) / mean / 0.85);
}

function computeLayerSpread(bands: BandEnergies): number {
  const values = [bands.sub, bands.bass, bands.mid, bands.high];
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const normalized = values.map((value) => value / total);
  const activeLayers = normalized.filter((value) => value >= 0.12).length;

  return clamp01(activeLayers / 4);
}

function computeRepetitionScore(
  frameRms: number[],
  tempo: number,
  sampleRate: number
): number {
  if (frameRms.length < 16 || tempo <= 0) return 0;

  const secondsPerBeat = 60 / tempo;
  const lag = Math.max(1, Math.round((secondsPerBeat * sampleRate) / HOP_SIZE));
  if (lag >= frameRms.length) return 0;

  const mean = frameRms.reduce((sum, value) => sum + value, 0) / frameRms.length;
  if (mean <= 0) return 0;

  let correlation = 0;
  let count = 0;

  for (let index = lag; index < frameRms.length; index++) {
    correlation += (frameRms[index] - mean) * (frameRms[index - lag] - mean);
    count += 1;
  }

  if (count === 0) return 0;

  let variance = 0;
  for (const value of frameRms) {
    variance += (value - mean) ** 2;
  }
  variance /= frameRms.length;

  if (variance <= 0) return 0;

  return clamp01(correlation / count / variance);
}

function averageBandEnergies(frameBandEnergies: BandEnergies[]): BandEnergies {
  const totals = { sub: 0, bass: 0, mid: 0, high: 0 };

  for (const bands of frameBandEnergies) {
    totals.sub += bands.sub;
    totals.bass += bands.bass;
    totals.mid += bands.mid;
    totals.high += bands.high;
  }

  const count = Math.max(frameBandEnergies.length, 1);
  return {
    sub: totals.sub / count,
    bass: totals.bass / count,
    mid: totals.mid / count,
    high: totals.high / count,
  };
}

export function buildAnalysisSignals(input: {
  tempo: number;
  energy: number;
  brightness: number;
  density: number;
  dynamics: number;
  spectralFlatness: number;
  frameAnalysis: ExtendedFrameAnalysis;
  bands: BandEnergies;
  leftChannel: Float32Array;
  rightChannel: Float32Array;
  sampleRate: number;
}): AudioAnalysisSignals {
  const { frameRms, spectralFlux, frameCentroids } = input.frameAnalysis;
  const { onsetIndices, tempo: detectedTempo } = detectOnsets(
    frameRms,
    spectralFlux,
    input.sampleRate
  );

  const intervals: number[] = [];
  for (let index = 1; index < onsetIndices.length; index++) {
    intervals.push(onsetIndices[index] - onsetIndices[index - 1]);
  }

  const tempo = detectedTempo > 0 ? detectedTempo : input.tempo;
  const transientSharpness = computeTransientSharpness(spectralFlux);
  const centroidVariance = computeCentroidVariance(frameCentroids);
  const beatConsistency = computeBeatConsistency(intervals);
  const silenceRatio = computeSilenceRatio(frameRms);
  const stereoWidth =
    input.frameAnalysis.stereoWidthFrames.length > 0
      ? input.frameAnalysis.stereoWidthFrames.reduce((sum, value) => sum + value, 0) /
        input.frameAnalysis.stereoWidthFrames.length
      : computeStereoWidth(input.leftChannel, input.rightChannel, input.sampleRate);
  const harmonicStability = clamp01(
    (1 - centroidVariance) * 0.55 + (1 - input.dynamics * 0.35) * 0.25 + beatConsistency * 0.2
  );
  const repetitionScore = computeRepetitionScore(frameRms, tempo, input.sampleRate);
  const layerSpread = computeLayerSpread(input.bands);
  const totalBandEnergy =
    input.bands.sub + input.bands.bass + input.bands.mid + input.bands.high || 1;

  return {
    tempo,
    energy: input.energy,
    brightness: input.brightness,
    density: input.density,
    dynamics: input.dynamics,
    spectralFlatness: input.spectralFlatness,
    transientSharpness,
    fluxVariance: computeFluxVariance(spectralFlux),
    stereoWidth,
    silenceRatio,
    beatConsistency,
    phraseCadence: computePhraseCadence(intervals),
    harmonicStability,
    repetitionScore,
    focalStability: clamp01(1 - centroidVariance * 0.75 - input.dynamics * 0.15),
    layerSpread,
    onsetClustering: computeOnsetClustering(onsetIndices),
    centroidVariance,
    rmsVariance: computeRmsVariance(frameRms),
    subEnergy: input.bands.sub / totalBandEnergy,
    highEnergy: input.bands.high / totalBandEnergy,
  };
}

function computeFluxVariance(spectralFlux: number[]): number {
  if (spectralFlux.length < 2) return 0;

  const mean =
    spectralFlux.reduce((sum, value) => sum + value, 0) / spectralFlux.length;
  const variance =
    spectralFlux.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    spectralFlux.length;
  const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;

  return clamp01(coefficientOfVariation / 1.2);
}

export {
  computeFrameCentroid,
  computeStereoWidthFrames,
  averageBandEnergies,
  detectOnsets,
  normalizeFlux,
};
