import type { TempoInterpretation } from "@/types/tempoAnalysis";

const HOP_SIZE = 1024;
const REALISTIC_BPM_MIN = 50;
const REALISTIC_BPM_MAX = 200;
/** Prefer musical pulse range; extremes need stronger evidence. */
const COMMON_BPM_MIN = 60;
const COMMON_BPM_MAX = 180;

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

function bpmFromIntervalFrames(intervalFrames: number, secondsPerFrame: number): number {
  if (intervalFrames <= 0) return 0;
  return 60 / (intervalFrames * secondsPerFrame);
}

function distanceFromCommonBpm(bpm: number): number {
  if (bpm < COMMON_BPM_MIN) return COMMON_BPM_MIN - bpm;
  if (bpm > COMMON_BPM_MAX) return bpm - COMMON_BPM_MAX;
  return 0;
}

function wrapToMusicalBpm(bpm: number): number {
  let value = bpm;
  while (value > REALISTIC_BPM_MAX) value /= 2;
  while (value > 0 && value < REALISTIC_BPM_MIN) value *= 2;
  return value;
}

export interface TempoContext {
  organic: number;
  humanity: number;
  beatConsistency: number;
  repetitionScore: number;
  density: number;
  brightness: number;
  silenceRatio: number;
  dynamics: number;
}

interface TempoCandidate {
  bpm: number;
  correctionMultiplier: number;
  consistency: number;
  score: number;
  source: string;
}

function buildOnsetStrength(
  frameRms: number[],
  spectralFlux: number[]
): number[] {
  return frameRms.map((rms, index) => {
    const previous = index > 0 ? frameRms[index - 1] : rms;
    const flux = spectralFlux[index] ?? 0;
    const rise = Math.max(0, rms - previous);
    return rise * 0.55 + flux * 0.45;
  });
}

/**
 * Peak-pick onsets with a refractory period so sub-beat chatter
 * (heartbeat harmonics, hi-hat fizz) cannot invent 400–600 BPM.
 */
export function detectOnsetsDetailed(
  frameRms: number[],
  spectralFlux: number[],
  sampleRate: number
): { onsetIndices: number[]; intervals: number[]; detectedTempo: number; onsetSignal: number[] } {
  if (frameRms.length < 8) {
    return { onsetIndices: [], intervals: [], detectedTempo: 0, onsetSignal: [] };
  }

  const secondsPerFrame = HOP_SIZE / sampleRate;
  const onsetSignal = buildOnsetStrength(frameRms, spectralFlux);

  // Higher threshold + min gap ≈ 200 BPM max between accepted onsets.
  const onsetThreshold = Math.max(
    percentile(onsetSignal, 0.82) * 0.9,
    percentile(onsetSignal, 0.9) * 0.55
  );
  const minGapFrames = Math.max(3, Math.floor(0.28 / secondsPerFrame));

  const onsetIndices: number[] = [];
  for (let index = 2; index < onsetSignal.length - 2; index++) {
    const value = onsetSignal[index];
    if (
      value >= onsetThreshold &&
      value >= onsetSignal[index - 1] &&
      value >= onsetSignal[index - 2] &&
      value > onsetSignal[index + 1] &&
      value > onsetSignal[index + 2]
    ) {
      const lastOnset = onsetIndices[onsetIndices.length - 1];
      if (lastOnset === undefined || index - lastOnset >= minGapFrames) {
        onsetIndices.push(index);
      } else if (value > onsetSignal[lastOnset]) {
        // Keep the stronger peak inside the refractory window.
        onsetIndices[onsetIndices.length - 1] = index;
      }
    }
  }

  if (onsetIndices.length < 3) {
    return { onsetIndices, intervals: [], detectedTempo: 0, onsetSignal };
  }

  const intervals: number[] = [];
  for (let index = 1; index < onsetIndices.length; index++) {
    intervals.push(onsetIndices[index] - onsetIndices[index - 1]);
  }

  const medianInterval = percentile(intervals, 0.5);
  const detectedTempo = Math.round(bpmFromIntervalFrames(medianInterval, secondsPerFrame));

  return { onsetIndices, intervals, detectedTempo, onsetSignal };
}

/** Autocorrelation tempo estimate in a realistic BPM band. */
function estimateTempoFromAutocorr(
  onsetSignal: number[],
  sampleRate: number
): { bpm: number; confidence: number } {
  if (onsetSignal.length < 64) {
    return { bpm: 0, confidence: 0 };
  }

  const secondsPerFrame = HOP_SIZE / sampleRate;
  const minLag = Math.max(2, Math.floor((60 / REALISTIC_BPM_MAX) / secondsPerFrame));
  const maxLag = Math.min(
    onsetSignal.length - 2,
    Math.ceil((60 / REALISTIC_BPM_MIN) / secondsPerFrame)
  );

  const mean =
    onsetSignal.reduce((sum, value) => sum + value, 0) / onsetSignal.length;
  const centered = onsetSignal.map((value) => value - mean);
  const energy =
    centered.reduce((sum, value) => sum + value * value, 0) || 1;

  let bestLag = minLag;
  let bestCorr = -Infinity;
  let secondCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const limit = centered.length - lag;
    for (let i = 0; i < limit; i++) {
      corr += centered[i] * centered[i + lag];
    }
    corr /= energy;
    if (corr > bestCorr) {
      secondCorr = bestCorr;
      bestCorr = corr;
      bestLag = lag;
    } else if (corr > secondCorr) {
      secondCorr = corr;
    }
  }

  const bpm = bpmFromIntervalFrames(bestLag, secondsPerFrame);
  const peakDominance = bestCorr > 0 ? clamp01((bestCorr - Math.max(0, secondCorr)) / (bestCorr + 1e-6)) : 0;
  const confidence = clamp01(bestCorr * 2.2 * 0.55 + peakDominance * 0.45);

  return { bpm, confidence };
}

/** Histogram mode of inter-onset intervals → BPM. */
function estimateTempoFromIoiHistogram(
  intervals: number[],
  sampleRate: number
): { bpm: number; confidence: number } {
  if (intervals.length < 4) return { bpm: 0, confidence: 0 };

  const secondsPerFrame = HOP_SIZE / sampleRate;
  const buckets = new Map<number, number>();

  for (const interval of intervals) {
    const bpm = Math.round(bpmFromIntervalFrames(interval, secondsPerFrame));
    if (bpm < 40 || bpm > 320) continue;
    // Fold into musical range for voting.
    let folded = bpm;
    while (folded > REALISTIC_BPM_MAX) folded = Math.round(folded / 2);
    while (folded > 0 && folded < REALISTIC_BPM_MIN) folded *= 2;
    folded = Math.round(folded);
    buckets.set(folded, (buckets.get(folded) ?? 0) + 1);
    // Also vote for half/double neighbors lightly.
    buckets.set(Math.round(folded / 2), (buckets.get(Math.round(folded / 2)) ?? 0) + 0.25);
    buckets.set(folded * 2, (buckets.get(folded * 2) ?? 0) + 0.25);
  }

  let bestBpm = 0;
  let bestCount = 0;
  let total = 0;
  for (const [bpm, count] of buckets) {
    if (bpm < REALISTIC_BPM_MIN || bpm > REALISTIC_BPM_MAX) continue;
    total += count;
    if (count > bestCount) {
      bestCount = count;
      bestBpm = bpm;
    }
  }

  if (bestBpm <= 0 || total <= 0) return { bpm: 0, confidence: 0 };
  return {
    bpm: bestBpm,
    confidence: clamp01(bestCount / total),
  };
}

function buildCandidatesFromSeed(
  seedBpm: number,
  source: string
): Array<{ bpm: number; correctionMultiplier: number; source: string }> {
  if (seedBpm <= 0) return [];

  const divisors =
    seedBpm > 240 ? [2, 3, 4, 5, 6, 8] : seedBpm > 180 ? [1, 2, 3, 4] : [1, 2, 0.5];

  const out: Array<{ bpm: number; correctionMultiplier: number; source: string }> = [];
  for (const divisor of divisors) {
    const bpm = wrapToMusicalBpm(seedBpm / divisor);
    if (bpm < REALISTIC_BPM_MIN || bpm > REALISTIC_BPM_MAX) continue;
    out.push({
      bpm,
      correctionMultiplier: divisor >= 1 ? divisor : 1 / divisor,
      source,
    });
  }
  return out;
}

function scoreTempoCandidate(
  bpm: number,
  intervals: number[],
  correctionMultiplier: number,
  source: string,
  context: TempoContext,
  seedConfidence: number,
  sampleRate: number
): TempoCandidate {
  const secondsPerFrame = HOP_SIZE / sampleRate;
  const targetInterval = 60 / Math.max(bpm, 1) / secondsPerFrame;

  // Consistency: how well IOIs cluster near this tempo's beat interval (and 2x).
  let consistency = seedConfidence;
  if (intervals.length >= 3) {
    const errors = intervals.map((interval) => {
      const err1 = Math.abs(interval - targetInterval) / targetInterval;
      const err2 = Math.abs(interval - targetInterval * 2) / (targetInterval * 2);
      const errHalf = Math.abs(interval - targetInterval * 0.5) / Math.max(targetInterval * 0.5, 1);
      return Math.min(err1, err2, errHalf);
    });
    const medianError = percentile(errors, 0.5);
    consistency = clamp01(1 - medianError / 0.45);
  }

  const sparseDark = context.density < 0.22 && context.brightness < 0.2;
  const pulseSparse =
    sparseDark && context.dynamics > 0.45 && context.silenceRatio > 0.18;
  const likelyLiveOrOrganic = context.organic > 0.45 || context.humanity > 0.45;
  const likelyElectronic =
    context.repetitionScore > 0.55 && context.beatConsistency > 0.58;

  let score =
    consistency * 0.42 +
    seedConfidence * 0.22 -
    distanceFromCommonBpm(bpm) * 0.02 -
    Math.max(0, correctionMultiplier - 2) * 0.04;

  if (pulseSparse) {
    if (bpm >= 55 && bpm <= 95) score += 0.24;
    if (bpm > 110 && bpm < 155) score -= 0.2;
    if (bpm >= 155) score -= 0.14;
  }

  if (sparseDark && bpm >= 60 && bpm <= 100) score += 0.1;

  if (likelyLiveOrOrganic && !pulseSparse && bpm >= 90 && bpm <= 170) {
    score += 0.06;
  }
  if (likelyElectronic && bpm >= 118 && bpm <= 145) {
    score += 0.05;
  }
  if (bpm >= COMMON_BPM_MIN && bpm <= COMMON_BPM_MAX) {
    score += 0.08;
  }

  if (correctionMultiplier === 1) score += 0.05;
  if (correctionMultiplier >= 4 && !pulseSparse) score -= 0.06;

  return {
    bpm,
    correctionMultiplier,
    consistency,
    score,
    source,
  };
}

function selectBestCandidate(candidates: TempoCandidate[]): TempoCandidate {
  return [...candidates].sort((a, b) => b.score - a.score)[0] ?? candidates[0];
}

function clampNormalizedTempo(bpm: number): number {
  return Math.round(Math.min(REALISTIC_BPM_MAX, Math.max(REALISTIC_BPM_MIN, bpm)));
}

export function interpretTempo(
  frameRms: number[],
  spectralFlux: number[],
  sampleRate: number,
  context: TempoContext
): TempoInterpretation {
  const { intervals, detectedTempo, onsetSignal } = detectOnsetsDetailed(
    frameRms,
    spectralFlux,
    sampleRate
  );

  const autocorr = estimateTempoFromAutocorr(onsetSignal, sampleRate);
  const ioi = estimateTempoFromIoiHistogram(intervals, sampleRate);

  const seeds: Array<{ bpm: number; confidence: number; source: string }> = [];
  if (detectedTempo > 0) {
    seeds.push({ bpm: detectedTempo, confidence: 0.35, source: "onset-median" });
  }
  if (autocorr.bpm > 0) {
    seeds.push({
      bpm: autocorr.bpm,
      confidence: Math.max(0.25, autocorr.confidence),
      source: "autocorr",
    });
  }
  if (ioi.bpm > 0) {
    seeds.push({
      bpm: ioi.bpm,
      confidence: Math.max(0.25, ioi.confidence),
      source: "ioi-histogram",
    });
  }

  if (seeds.length === 0) {
    return {
      detectedTempo: 80,
      normalizedTempo: 80,
      tempoConfidence: 0.3,
      correctionMultiplier: 1,
    };
  }

  const candidateMap = new Map<string, TempoCandidate>();
  for (const seed of seeds) {
    for (const spec of buildCandidatesFromSeed(seed.bpm, seed.source)) {
      const scored = scoreTempoCandidate(
        spec.bpm,
        intervals,
        spec.correctionMultiplier,
        `${seed.source}:${spec.source}`,
        context,
        seed.confidence,
        sampleRate
      );
      const key = String(Math.round(scored.bpm));
      const existing = candidateMap.get(key);
      if (!existing || scored.score > existing.score) {
        candidateMap.set(key, scored);
      }
    }
  }

  let best = selectBestCandidate([...candidateMap.values()]);

  // Low-confidence mid-tempo on sparse/dark material → try half-tempo once.
  const sparseDark = context.density < 0.22 && context.brightness < 0.2;
  if (sparseDark && best.bpm > 110 && best.consistency < 0.55) {
    const half = clampNormalizedTempo(best.bpm / 2);
    const halfScored = scoreTempoCandidate(
      half,
      intervals,
      best.correctionMultiplier * 2,
      `${best.source}:half`,
      context,
      0.4,
      sampleRate
    );
    if (halfScored.score >= best.score - 0.02) {
      best = halfScored;
    }
  }

  const normalizedTempo = clampNormalizedTempo(best.bpm);
  const tempoConfidence = clamp01(
    best.consistency * 0.45 +
      Math.max(autocorr.confidence, ioi.confidence) * 0.35 +
      (distanceFromCommonBpm(normalizedTempo) === 0 ? 0.12 : 0.04) +
      (intervals.length > 10 ? 0.08 : 0.02) -
      (best.correctionMultiplier >= 4 ? 0.08 : 0)
  );

  const interpretation: TempoInterpretation = {
    detectedTempo: Math.round(detectedTempo || autocorr.bpm || ioi.bpm || 80),
    normalizedTempo,
    tempoConfidence,
    correctionMultiplier: best.correctionMultiplier,
  };

  console.group("[Tempo Analysis]");
  console.log("Raw onset tempo:", interpretation.detectedTempo);
  console.log("Autocorr tempo:", Math.round(autocorr.bpm), `(conf ${autocorr.confidence.toFixed(2)})`);
  console.log("IOI histogram tempo:", Math.round(ioi.bpm), `(conf ${ioi.confidence.toFixed(2)})`);
  console.log("Corrected tempo:", interpretation.normalizedTempo);
  console.log("Correction multiplier:", interpretation.correctionMultiplier);
  console.log("Confidence:", interpretation.tempoConfidence.toFixed(3));
  console.log("Winner source:", best.source);
  console.groupEnd();

  return interpretation;
}
