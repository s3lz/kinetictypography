import type { AudioFeatures } from "@/types/audio";
import type { SongUniquenessVector } from "@/types/songUniqueness";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function bucket(value: number, steps = 10): number {
  return Math.round(clamp01(value) * steps);
}

export function computeSongUniquenessVector(
  audioFeatures: AudioFeatures
): SongUniquenessVector {
  const { analysisSignals, emotionalVector, brightness, density } = audioFeatures;

  const vector: SongUniquenessVector = {
    stereoWidth: analysisSignals.stereoWidth,
    brightness,
    silenceRatio: analysisSignals.silenceRatio,
    density,
    harmonicStability: analysisSignals.harmonicStability,
    repetitionScore: analysisSignals.repetitionScore,
    focalStability: analysisSignals.focalStability,
    organic: emotionalVector.organic,
    differentiationKey: "",
  };

  vector.differentiationKey = [
    bucket(vector.stereoWidth, 8),
    bucket(vector.brightness, 8),
    bucket(vector.silenceRatio, 8),
    bucket(vector.density, 8),
    bucket(vector.harmonicStability, 8),
    bucket(vector.repetitionScore, 8),
    bucket(vector.focalStability, 8),
    bucket(vector.organic, 8),
  ].join(":");

  return vector;
}

export function describeUniquenessVector(vector: SongUniquenessVector): string {
  return [
    `stereoWidth=${vector.stereoWidth.toFixed(2)}`,
    `brightness=${vector.brightness.toFixed(2)}`,
    `silenceRatio=${vector.silenceRatio.toFixed(2)}`,
    `density=${vector.density.toFixed(2)}`,
    `harmonicStability=${vector.harmonicStability.toFixed(2)}`,
    `repetitionScore=${vector.repetitionScore.toFixed(2)}`,
    `focalStability=${vector.focalStability.toFixed(2)}`,
    `organic=${vector.organic.toFixed(2)}`,
    `key=${vector.differentiationKey}`,
  ].join(", ");
}
