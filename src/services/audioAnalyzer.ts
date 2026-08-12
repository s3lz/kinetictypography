import type { AudioFeatures } from "../types/audio";
import {
  buildSemanticAudioProfile,
  computeFluxVariance,
  computeSpectralFlatness,
} from "./semanticAudioAnalysis";
import { deriveEmotionalVector } from "./emotionalVector";
import { deriveMusicalPersonality } from "./musicalPersonalityEngine";
import { attachSongCharacter } from "./songCharacterEngine";
import { interpretTempo } from "./tempoAnalysis";
import {
  averageBandEnergies,
  buildAnalysisSignals,
  computeFrameCentroid,
  computeStereoWidthFrames,
  detectOnsets,
  normalizeFlux,
} from "./audioSignalExtractor";
import { deriveVisualDNA } from "./visualDnaEngine";

const FFT_SIZE = 2048;
const HOP_SIZE = 1024;
const DYNAMICS_WINDOW_SECONDS = 0.25;

interface BandEnergies {
  sub: number;
  bass: number;
  mid: number;
  high: number;
}

interface FrameAnalysis {
  averagedMagnitudes: Float32Array;
  frameRms: number[];
  frameBandEnergies: BandEnergies[];
  spectralFlux: number[];
  frameCentroids: number[];
  stereoWidthFrames: number[];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hannWindow(index: number, size: number): number {
  return 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)));
}

function fftInPlace(real: Float32Array, imag: Float32Array): void {
  const n = real.length;

  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }

    let bit = n >> 1;
    while (bit <= j) {
      j -= bit;
      bit >>= 1;
    }
    j += bit;
  }

  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size;
    const stepRe = Math.cos(angle);
    const stepIm = Math.sin(angle);

    for (let i = 0; i < n; i += size) {
      let wRe = 1;
      let wIm = 0;

      for (let k = 0; k < size / 2; k++) {
        const evenIndex = i + k;
        const oddIndex = i + k + size / 2;

        const oddRe = real[oddIndex] * wRe - imag[oddIndex] * wIm;
        const oddIm = real[oddIndex] * wIm + imag[oddIndex] * wRe;

        real[oddIndex] = real[evenIndex] - oddRe;
        imag[oddIndex] = imag[evenIndex] - oddIm;
        real[evenIndex] += oddRe;
        imag[evenIndex] += oddIm;

        const nextWRe = wRe * stepRe - wIm * stepIm;
        wIm = wRe * stepIm + wIm * stepRe;
        wRe = nextWRe;
      }
    }
  }
}

function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;

  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / samples.length);
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

function frequencyToBin(frequency: number, sampleRate: number): number {
  return Math.floor((frequency * FFT_SIZE) / sampleRate);
}

function sumBandEnergy(
  magnitudes: Float32Array,
  sampleRate: number,
  lowHz: number,
  highHz: number
): number {
  const lowBin = Math.max(0, frequencyToBin(lowHz, sampleRate));
  const highBin = Math.min(
    magnitudes.length - 1,
    frequencyToBin(highHz, sampleRate)
  );

  if (highBin <= lowBin) return 0;

  let sum = 0;
  for (let bin = lowBin; bin <= highBin; bin++) {
    sum += magnitudes[bin];
  }

  return sum;
}

function computeFrameBandEnergies(
  magnitudes: Float32Array,
  sampleRate: number
): BandEnergies {
  return {
    sub: sumBandEnergy(magnitudes, sampleRate, 20, 80),
    bass: sumBandEnergy(magnitudes, sampleRate, 80, 250),
    mid: sumBandEnergy(magnitudes, sampleRate, 250, 2500),
    high: sumBandEnergy(magnitudes, sampleRate, 2500, 12000),
  };
}

function analyzeFrames(
  channelData: Float32Array,
  sampleRate: number,
  rightChannel?: Float32Array
): FrameAnalysis {
  const binCount = FFT_SIZE / 2;
  const averagedMagnitudes = new Float32Array(binCount);
  const frameRms: number[] = [];
  const frameBandEnergies: BandEnergies[] = [];
  const spectralFlux: number[] = [];
  const frameCentroids: number[] = [];
  let frameCount = 0;
  let previousMagnitudes: Float32Array | null = null;

  const analyzeFrame = (offset: number) => {
    const real = new Float32Array(FFT_SIZE);
    const imag = new Float32Array(FFT_SIZE);
    const frameSamples = channelData.subarray(
      offset,
      Math.min(offset + FFT_SIZE, channelData.length)
    );

    for (let i = 0; i < FFT_SIZE; i++) {
      const sample = i < frameSamples.length ? frameSamples[i] : 0;
      real[i] = sample * hannWindow(i, FFT_SIZE);
    }

    frameRms.push(computeRms(frameSamples));

    fftInPlace(real, imag);

    const frameMagnitudes = new Float32Array(binCount);
    let flux = 0;

    for (let bin = 0; bin < binCount; bin++) {
      const magnitude = Math.hypot(real[bin], imag[bin]);
      frameMagnitudes[bin] = magnitude;
      averagedMagnitudes[bin] += magnitude;

      if (previousMagnitudes) {
        const delta = magnitude - previousMagnitudes[bin];
        if (delta > 0) flux += delta;
      }
    }

    frameBandEnergies.push(computeFrameBandEnergies(frameMagnitudes, sampleRate));
    spectralFlux.push(flux);
    frameCentroids.push(computeFrameCentroid(frameMagnitudes, sampleRate));
    previousMagnitudes = frameMagnitudes;
    frameCount += 1;
  };

  if (channelData.length >= FFT_SIZE) {
    for (let offset = 0; offset + FFT_SIZE <= channelData.length; offset += HOP_SIZE) {
      analyzeFrame(offset);
    }
  } else {
    analyzeFrame(0);
  }

  if (frameCount > 0) {
    for (let bin = 0; bin < binCount; bin++) {
      averagedMagnitudes[bin] /= frameCount;
    }
  }

  const stereoWidthFrames =
    rightChannel && rightChannel.length > 0
      ? computeStereoWidthFrames(
          channelData,
          rightChannel,
          sampleRate,
          frameRms.length
        )
      : [];

  return {
    averagedMagnitudes,
    frameRms,
    frameBandEnergies,
    spectralFlux,
    frameCentroids,
    stereoWidthFrames,
  };
}

function computeBrightness(
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

  const centroid = weightedSum / magnitudeSum;
  return clamp01(centroid / (sampleRate / 2));
}

function computeDensity(magnitudes: Float32Array): number {
  const spectralFlatness = computeSpectralFlatness(magnitudes);
  const peakMagnitude = Math.max(...magnitudes);
  const activeThreshold = peakMagnitude * 0.02;
  const activeBinRatio =
    magnitudes.filter((value) => value >= activeThreshold).length /
    magnitudes.length;

  return clamp01(activeBinRatio * 0.65 + spectralFlatness * 0.35);
}

function computeDynamics(frameRms: number[], sampleRate: number): number {
  if (frameRms.length < 2) return 0;

  const windowSize = Math.max(
    1,
    Math.floor((DYNAMICS_WINDOW_SECONDS * sampleRate) / HOP_SIZE)
  );

  const sectionRmsValues: number[] = [];
  for (let offset = 0; offset < frameRms.length; offset += windowSize) {
    const section = frameRms.slice(offset, offset + windowSize);
    const mean =
      section.reduce((sum, value) => sum + value, 0) / section.length;
    sectionRmsValues.push(mean);
  }

  if (sectionRmsValues.length < 2) return 0;

  const loudestSection = Math.max(...sectionRmsValues);
  const quietestSection = Math.min(...sectionRmsValues);

  if (loudestSection === 0) return 0;

  const peakToTrough = (loudestSection - quietestSection) / loudestSection;

  const meanSectionRms =
    sectionRmsValues.reduce((sum, value) => sum + value, 0) /
    sectionRmsValues.length;

  const sectionVariance =
    sectionRmsValues.reduce(
      (sum, value) => sum + (value - meanSectionRms) ** 2,
      0
    ) / sectionRmsValues.length;

  const coefficientOfVariation =
    meanSectionRms > 0 ? Math.sqrt(sectionVariance) / meanSectionRms : 0;

  return clamp01(peakToTrough * 0.6 + clamp01(coefficientOfVariation / 1.25) * 0.4);
}

function normalizeLogRms(rms: number, quietLog: number, loudLog: number): number {
  const logRms = Math.log10(Math.max(rms, 1e-6));
  return clamp01((logRms - quietLog) / (loudLog - quietLog));
}

function computeEnergy(
  frameRms: number[],
  spectralFlux: number[]
): number {
  if (frameRms.length === 0) return 0;

  const typicalLoudness = percentile(frameRms, 0.75);
  const loudness = normalizeLogRms(typicalLoudness, -2.4, -0.45);

  const meanFlux =
    spectralFlux.length > 0
      ? spectralFlux.reduce((sum, value) => sum + value, 0) / spectralFlux.length
      : 0;
  const activity = normalizeFlux(meanFlux);

  const meanRms =
    frameRms.reduce((sum, value) => sum + value, 0) / frameRms.length;
  const rmsVariance =
    frameRms.reduce((sum, value) => sum + (value - meanRms) ** 2, 0) /
    frameRms.length;
  const variation =
    meanRms > 0
      ? clamp01(Math.sqrt(rmsVariance) / meanRms / 0.85)
      : 0;

  return clamp01(loudness * 0.45 + activity * 0.35 + variation * 0.2);
}

function roughTempo(
  frameRms: number[],
  spectralFlux: number[],
  sampleRate: number
): number {
  const { tempo } = detectOnsets(frameRms, spectralFlux, sampleRate);
  return tempo > 0 ? tempo : 80;
}

function averageBandEnergiesFromFrames(frameBandEnergies: BandEnergies[]): BandEnergies {
  return averageBandEnergies(frameBandEnergies);
}

export async function analyzeAudio(
  file: File
): Promise<AudioFeatures> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  const rightChannel =
    audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : channelData;

  const frameAnalysis = analyzeFrames(channelData, audioBuffer.sampleRate, rightChannel);
  const {
    averagedMagnitudes,
    frameRms,
    frameBandEnergies,
    spectralFlux,
  } = frameAnalysis;

  const brightness = computeBrightness(
    averagedMagnitudes,
    audioBuffer.sampleRate
  );
  const spectralFlatness = computeSpectralFlatness(averagedMagnitudes);
  const density = computeDensity(averagedMagnitudes);
  const dynamics = computeDynamics(frameRms, audioBuffer.sampleRate);
  const energy = computeEnergy(frameRms, spectralFlux);
  const detectedTempo = roughTempo(frameRms, spectralFlux, audioBuffer.sampleRate);
  const bands = averageBandEnergiesFromFrames(frameBandEnergies);
  const meanFlux =
    spectralFlux.length > 0
      ? spectralFlux.reduce((sum, value) => sum + value, 0) / spectralFlux.length
      : 0;
  const transient = normalizeFlux(meanFlux);
  const fluxVariance = computeFluxVariance(spectralFlux);

  const preliminarySignals = buildAnalysisSignals({
    tempo: detectedTempo,
    energy,
    brightness,
    density,
    dynamics,
    spectralFlatness,
    frameAnalysis,
    bands,
    leftChannel: channelData,
    rightChannel,
    sampleRate: audioBuffer.sampleRate,
  });

  const preliminaryBase = {
    tempo: detectedTempo,
    energy,
    brightness,
    density,
    dynamics,
    semanticProfile: buildSemanticAudioProfile({
      tempo: detectedTempo,
      energy,
      brightness,
      density,
      dynamics,
      spectralFlatness,
      transient,
      fluxVariance,
      bands,
    }),
    analysisSignals: preliminarySignals,
    visualDna: deriveVisualDNA(preliminarySignals),
  };

  const emotionalVector = deriveEmotionalVector(preliminaryBase);
  const liveHints = preliminaryBase.semanticProfile.instrumentation.some((hint) =>
    ["acoustic", "guitar", "drums", "live", "bass", "piano", "percussion"].some((key) =>
      hint.includes(key)
    )
  );

  const tempoInterpretation = interpretTempo(
    frameRms,
    spectralFlux,
    audioBuffer.sampleRate,
    {
      organic: emotionalVector.organic,
      humanity: clamp01(emotionalVector.organic * 0.65 + (liveHints ? 0.25 : 0)),
      beatConsistency: preliminarySignals.beatConsistency,
      repetitionScore: preliminarySignals.repetitionScore,
      density,
      brightness,
      silenceRatio: preliminarySignals.silenceRatio,
      dynamics,
    }
  );

  const tempo = tempoInterpretation.normalizedTempo;

  const semanticProfile = buildSemanticAudioProfile({
    tempo,
    energy,
    brightness,
    density,
    dynamics,
    spectralFlatness,
    transient,
    fluxVariance,
    bands,
  });

  const analysisSignals = buildAnalysisSignals({
    tempo,
    energy,
    brightness,
    density,
    dynamics,
    spectralFlatness,
    frameAnalysis,
    bands,
    leftChannel: channelData,
    rightChannel,
    sampleRate: audioBuffer.sampleRate,
  });

  const visualDna = deriveVisualDNA(analysisSignals);

  await audioContext.close();

  const baseFeatures = {
    tempo,
    tempoInterpretation,
    energy,
    brightness,
    density,
    dynamics,
    semanticProfile,
    analysisSignals,
    visualDna,
    emotionalVector,
  };

  const personality = deriveMusicalPersonality(baseFeatures);

  return attachSongCharacter({
    ...baseFeatures,
    ...personality,
  });
}
