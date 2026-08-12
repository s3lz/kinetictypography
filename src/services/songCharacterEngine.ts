import {
  isHighKineticAudio,
  isStronglyFuturisticSynthetic,
} from "@/lib/creativeInterpretation";
import type { AudioFeatures } from "@/types/audio";
import type {
  EmotionalTemperature,
  EnergyType,
  PerformanceStyle,
  RhythmFeel,
  SongCharacter,
  SongTexture,
} from "@/types/songCharacter";

type AudioFeaturesWithoutCharacter = Omit<AudioFeatures, "songCharacter">;

function isSparseDarkPulse(audioFeatures: AudioFeaturesWithoutCharacter): boolean {
  const { density, brightness, dynamics } = audioFeatures;
  const { silenceRatio } = audioFeatures.analysisSignals;
  return (
    density < 0.22 &&
    brightness < 0.2 &&
    dynamics > 0.4 &&
    silenceRatio > 0.18
  );
}

function hasLiveInstrumentation(audioFeatures: AudioFeaturesWithoutCharacter): boolean {
  return audioFeatures.semanticProfile.instrumentation.some((hint) =>
    ["acoustic", "guitar", "drums", "live", "bass", "piano", "percussion"].some(
      (key) => hint.includes(key)
    )
  );
}

function isPreciseRepetitive(audioFeatures: AudioFeaturesWithoutCharacter): boolean {
  const { beatConsistency, repetitionScore, harmonicStability } =
    audioFeatures.analysisSignals;
  return (
    beatConsistency > 0.6 &&
    repetitionScore > 0.52 &&
    harmonicStability > 0.52
  );
}

function derivePerformanceStyle(audioFeatures: AudioFeaturesWithoutCharacter): PerformanceStyle {
  const { energy, organic } = audioFeatures.emotionalVector;
  const { tempo, analysisSignals, density, brightness } = audioFeatures;
  const live = hasLiveInstrumentation(audioFeatures);
  const synthetic = isStronglyFuturisticSynthetic(
    audioFeatures as AudioFeatures
  );
  const precise = isPreciseRepetitive(audioFeatures);
  const sparseDarkPulse = isSparseDarkPulse(audioFeatures);
  const tempoConfidence =
    audioFeatures.tempoInterpretation?.tempoConfidence ?? 0.5;

  // Sparse/dark pulse beds are intimate/atmospheric — not live_band from percussion hints.
  if (sparseDarkPulse) {
    if (organic > 0.5 || analysisSignals.silenceRatio > 0.25) {
      return density < 0.12 ? "atmospheric" : "intimate";
    }
  }

  if (
    live &&
    organic > 0.42 &&
    !synthetic &&
    density > 0.25 &&
    brightness > 0.12
  ) {
    return "live_band";
  }
  if (
    (energy < 0.42 && tempo < 105 && analysisSignals.silenceRatio > 0.35) ||
    (density < 0.18 && brightness < 0.15 && tempoConfidence < 0.45 && tempo < 110)
  ) {
    return "atmospheric";
  }
  if (synthetic || audioFeatures.semanticProfile.textureHints.some((h) =>
    ["synthetic", "glassy", "digital"].some((k) => h.includes(k))
  )) {
    return "synthetic";
  }
  if (precise && energy > 0.45 && !sparseDarkPulse) {
    return "mechanical";
  }
  if (energy < 0.48 && organic > 0.55 && analysisSignals.density < 0.55) {
    return "intimate";
  }
  if (density < 0.2 && brightness < 0.18 && organic > 0.5) {
    return "intimate";
  }
  return "hybrid";
}

function deriveEnergyType(
  audioFeatures: AudioFeaturesWithoutCharacter,
  performanceStyle: PerformanceStyle
): EnergyType {
  const { energy } = audioFeatures.emotionalVector;
  const { density, brightness } = audioFeatures;
  const highKinetic = isHighKineticAudio(audioFeatures as AudioFeatures);
  const sparseDarkPulse = isSparseDarkPulse(audioFeatures);

  if (sparseDarkPulse || (density < 0.18 && brightness < 0.15)) {
    if (energy < 0.55) return "floating";
    return "subdued";
  }

  if (
    highKinetic ||
    (performanceStyle === "live_band" && energy > 0.55 && density > 0.3)
  ) {
    return "restless";
  }
  if (performanceStyle === "atmospheric" || energy < 0.38) {
    return "floating";
  }
  if (
    performanceStyle === "synthetic" ||
    performanceStyle === "mechanical"
  ) {
    return "controlled";
  }
  if (energy > 0.62 && density > 0.35) {
    return "surging";
  }
  return "subdued";
}

function deriveRhythmFeel(
  audioFeatures: AudioFeaturesWithoutCharacter,
  performanceStyle: PerformanceStyle
): RhythmFeel {
  const { tempo } = audioFeatures;
  const { beatConsistency, onsetClustering } = audioFeatures.analysisSignals;
  const rhythm = audioFeatures.visualDna.motionRhythm;
  const sparseDarkPulse = isSparseDarkPulse(audioFeatures);

  if (
    tempo < 92 ||
    performanceStyle === "atmospheric" ||
    performanceStyle === "intimate" ||
    sparseDarkPulse
  ) {
    return "slow";
  }
  if (
    performanceStyle === "synthetic" ||
    performanceStyle === "mechanical" ||
    (beatConsistency > 0.62 && onsetClustering < 0.35)
  ) {
    return performanceStyle === "synthetic" ? "grid" : "precise";
  }
  // Don't treat sparse pulse attacks as staccato performance energy.
  if (
    !sparseDarkPulse &&
    (rhythm === "burst" || rhythm === "staggered" || rhythm === "stop-start")
  ) {
    return "staccato";
  }
  if (beatConsistency < 0.48 && performanceStyle === "live_band") {
    return "loose";
  }
  if (performanceStyle === "live_band" && tempo > 108 && tempo < 150) {
    return "swinging";
  }
  return beatConsistency > 0.55 ? "precise" : "loose";
}

function deriveSongTexture(
  audioFeatures: AudioFeaturesWithoutCharacter,
  performanceStyle: PerformanceStyle
): SongTexture {
  const { spectralFlatness } = audioFeatures.analysisSignals;

  if (performanceStyle === "live_band") return "raw";
  if (performanceStyle === "atmospheric" || performanceStyle === "intimate") {
    return "smooth";
  }
  if (performanceStyle === "synthetic" || performanceStyle === "mechanical") {
    return "clean";
  }
  if (spectralFlatness > 0.42) return "grainy";
  if (audioFeatures.visualDna.harmonicStability < 0.4) return "dissolved";
  return "grainy";
}

function deriveEmotionalTemperature(
  audioFeatures: AudioFeaturesWithoutCharacter,
  performanceStyle: PerformanceStyle
): EmotionalTemperature {
  const { warmth, darkness, tension, energy } = audioFeatures.emotionalVector;
  const sparseDarkPulse = isSparseDarkPulse(audioFeatures);

  if (sparseDarkPulse) {
    if (warmth > 0.52) return "warm_space";
    return darkness > 0.5 ? "cool_tension" : "warm";
  }

  if (performanceStyle === "live_band" && tension > 0.45 && warmth < 0.58) {
    return "cool_tension";
  }
  if (performanceStyle === "atmospheric" && warmth > 0.52) {
    return "warm_space";
  }
  if (performanceStyle === "synthetic" || (warmth < 0.45 && tension < 0.5)) {
    return "cool";
  }
  // Hot requires real sustained energy + density, not pulse spikes alone.
  if (warmth > 0.58 && energy > 0.55 && audioFeatures.density > 0.3) {
    return "hot";
  }
  if (warmth > 0.52) {
    return "warm";
  }
  if (tension > 0.55 && darkness > 0.5) {
    return "cool_tension";
  }
  return "neutral";
}

export function deriveSongCharacter(
  audioFeatures: AudioFeaturesWithoutCharacter
): SongCharacter {
  const performanceStyle = derivePerformanceStyle(audioFeatures);
  return {
    performanceStyle,
    energyType: deriveEnergyType(audioFeatures, performanceStyle),
    rhythmFeel: deriveRhythmFeel(audioFeatures, performanceStyle),
    texture: deriveSongTexture(audioFeatures, performanceStyle),
    emotionalTemperature: deriveEmotionalTemperature(
      audioFeatures,
      performanceStyle
    ),
  };
}

export function attachSongCharacter(
  audioFeatures: AudioFeaturesWithoutCharacter
): AudioFeatures {
  return {
    ...audioFeatures,
    songCharacter: deriveSongCharacter(audioFeatures),
  };
}
