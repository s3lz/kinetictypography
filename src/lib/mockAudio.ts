import type { AudioFeatures } from "@/types/audio";
import { deriveMusicalPersonality } from "@/services/musicalPersonalityEngine";
import { attachSongCharacter } from "@/services/songCharacterEngine";

const mockBase = {
  tempo: 82,
  tempoInterpretation: {
    detectedTempo: 82,
    normalizedTempo: 82,
    tempoConfidence: 0.72,
    correctionMultiplier: 1,
  },
  energy: 0.35,
  brightness: 0.3,
  density: 0.45,
  dynamics: 0.5,
  semanticProfile: {
    moodHints: ["wistful", "reflective", "tender"],
    textureHints: ["hazy", "warm analog", "smooth"],
    spaceHints: ["intimate", "atmospheric"],
    motionHints: ["drifting", "swelling", "suspended"],
    instrumentation: ["piano", "ambient pads", "strings"],
  },
  emotionalVector: {
    energy: 0.35,
    warmth: 0.7,
    darkness: 0.3,
    organic: 0.8,
    nostalgia: 0.6,
    tension: 0.2,
    complexity: 0.5,
  },
  visualDna: {
    motionRhythm: "continuous" as const,
    visualWeight: "airy" as const,
    sceneDensity: "minimal" as const,
    layoutBias: "edge" as const,
    movementBias: "orbital" as const,
    cameraEnergy: "slow drift",
    transitionAggression: 0.28,
    phraseCadence: 0.62,
    harmonicStability: 0.74,
    transientSharpness: 0.22,
    stereoWidth: 0.58,
    repetitionScore: 0.41,
    visualComplexity: 0.36,
    spacingBehavior: "expanded" as const,
    layerCount: 2,
    focalStability: 0.71,
  },
  analysisSignals: {
    tempo: 82,
    energy: 0.35,
    brightness: 0.3,
    density: 0.45,
    dynamics: 0.5,
    spectralFlatness: 0.18,
    transientSharpness: 0.22,
    fluxVariance: 0.24,
    stereoWidth: 0.58,
    silenceRatio: 0.42,
    beatConsistency: 0.55,
    phraseCadence: 0.62,
    harmonicStability: 0.74,
    repetitionScore: 0.41,
    focalStability: 0.71,
    layerSpread: 0.35,
    onsetClustering: 0.18,
    centroidVariance: 0.21,
    rmsVariance: 0.28,
    subEnergy: 0.12,
    highEnergy: 0.18,
  },
};

const mockPersonality = deriveMusicalPersonality({
  analysisSignals: mockBase.analysisSignals,
  emotionalVector: mockBase.emotionalVector,
  semanticProfile: mockBase.semanticProfile,
  tempoInterpretation: mockBase.tempoInterpretation,
});

export const mockAudioFeatures: AudioFeatures = attachSongCharacter({
  ...mockBase,
  ...mockPersonality,
});
