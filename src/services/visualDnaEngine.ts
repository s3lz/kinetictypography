/**
 * Visual DNA derivation engine.
 *
 * AUDIT — why songs collapsed into similar CreativeDirection inputs:
 *
 * 1. Only 5 scalars reached Gemini (tempo, energy, brightness, density, dynamics).
 *    Most songs cluster in 0.35–0.65 because features are blended averages.
 *
 * 2. Tempo defaults to 80 BPM when onset detection fails — a large share of tracks
 *    share the same fallback.
 *
 * 3. Semantic hints (mood/texture/motion) are derived from the same 5 scalars via
 *    correlated intermediates (soft=1-brightness, steady=1-dynamics, sparse=1-density),
 *    so different songs often pick the same top-4 labels.
 *
 * 4. emotionalVector largely mirrors energy/brightness/density/dynamics with small
 *    hint boosts — seven more correlated dimensions, not independent ones.
 *
 * 5. Rich frame-level signals (flux variance, onset clustering, stereo width,
 *    silence ratio, centroid drift, repetition) were computed internally but never
 *    exposed to the Creative Director.
 *
 * Visual DNA extracts discriminative visual axes from those hidden signals.
 */
import type {
  AudioAnalysisSignals,
  CameraEnergy,
  LayoutBias,
  MotionRhythm,
  MovementBias,
  SceneDensity,
  SpacingBehavior,
  VisualDNA,
  VisualWeight,
} from "@/types/visualDna";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function pickHighest<T extends string>(
  candidates: Array<{ value: T; score: number }>
): T {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return sorted[0]?.value ?? candidates[0].value;
}

function isVerticalMovement(signals: AudioAnalysisSignals): boolean {
  return signals.centroidVariance > 0.45 && signals.dynamics > 0.45;
}

function deriveMotionRhythm(signals: AudioAnalysisSignals): MotionRhythm {
  const {
    beatConsistency,
    fluxVariance,
    transientSharpness,
    silenceRatio,
    dynamics,
    onsetClustering,
    phraseCadence,
    density,
    energy,
  } = signals;

  return pickHighest<MotionRhythm>([
    {
      value: "burst",
      score:
        signals.fluxVariance * 0.32 +
        (1 - beatConsistency) * 0.28 +
        signals.onsetClustering * 0.2 +
        transientSharpness * 0.12 +
        dynamics * 0.08,
    },
    {
      value: "staggered",
      score:
        onsetClustering * 0.38 +
        phraseCadence * 0.28 +
        (1 - beatConsistency) * 0.2 +
        fluxVariance * 0.14,
    },
    {
      value: "cascading",
      score:
        phraseCadence * 0.35 +
        dynamics * 0.25 +
        fluxVariance * 0.2 +
        density * 0.2,
    },
    {
      value: "oscillating",
      score:
        fluxVariance * 0.34 +
        beatConsistency * 0.28 +
        phraseCadence * 0.2 +
        energy * 0.1 +
        transientSharpness * 0.08,
    },
    {
      value: "stop-start",
      score:
        silenceRatio * 0.45 +
        dynamics * 0.3 +
        (1 - beatConsistency) * 0.15 +
        onsetClustering * 0.1,
    },
    {
      value: "continuous",
      score:
        beatConsistency * 0.4 +
        (1 - fluxVariance) * 0.25 +
        (1 - silenceRatio) * 0.2 +
        (1 - onsetClustering) * 0.15,
    },
  ]);
}

function deriveVisualWeight(signals: AudioAnalysisSignals): VisualWeight {
  const airyScore =
    (1 - signals.density) * 0.35 +
    signals.brightness * 0.25 +
    signals.silenceRatio * 0.25 +
    (1 - signals.subEnergy) * 0.15;

  const heavyScore =
    signals.density * 0.3 +
    signals.subEnergy * 0.3 +
    (1 - signals.brightness) * 0.2 +
    signals.layerSpread * 0.2;

  if (airyScore > heavyScore + 0.12) return "airy";
  if (heavyScore > airyScore + 0.12) return "heavy";
  return "balanced";
}

function deriveSceneDensity(signals: AudioAnalysisSignals): SceneDensity {
  const layerCount = Math.round(1 + signals.layerSpread * 4);
  const denseScore =
    signals.density * 0.4 + signals.layerSpread * 0.35 + (1 - signals.silenceRatio) * 0.25;
  const minimalScore =
    signals.silenceRatio * 0.4 + (1 - signals.density) * 0.35 + (1 - signals.layerSpread) * 0.25;

  if (minimalScore > denseScore + 0.1) return "minimal";
  if (denseScore > minimalScore + 0.1) return "dense";
  return layerCount <= 2 ? "minimal" : layerCount >= 4 ? "dense" : "moderate";
}

function deriveLayoutBias(signals: AudioAnalysisSignals): LayoutBias {
  return pickHighest<LayoutBias>([
    {
      value: "center",
      score:
        signals.focalStability * 0.45 +
        signals.beatConsistency * 0.25 +
        (1 - signals.fluxVariance) * 0.2 +
        (1 - Math.abs(signals.stereoWidth - 0.5)) * 0.1,
    },
    {
      value: "left",
      score:
        signals.stereoWidth * 0.3 +
        (1 - signals.focalStability) * 0.25 +
        signals.phraseCadence * 0.2 +
        signals.density * 0.15 +
        (signals.brightness < 0.45 ? 0.1 : 0),
    },
    {
      value: "radial",
      score:
        signals.stereoWidth * 0.42 +
        signals.repetitionScore * 0.28 +
        signals.phraseCadence * 0.18 +
        signals.harmonicStability * 0.12,
    },
    {
      value: "asymmetric",
      score:
        signals.fluxVariance * 0.35 +
        (1 - signals.beatConsistency) * 0.25 +
        signals.onsetClustering * 0.2 +
        (1 - signals.focalStability) * 0.2,
    },
    {
      value: "stacked",
      score:
        signals.density * 0.35 +
        signals.layerSpread * 0.3 +
        signals.dynamics * 0.2 +
        (isVerticalMovement(signals) ? 0.15 : 0),
    },
    {
      value: "edge",
      score:
        signals.silenceRatio * 0.38 +
        (1 - signals.density) * 0.28 +
        (1 - signals.stereoWidth) * 0.2 +
        (1 - signals.focalStability) * 0.14,
    },
  ]);
}

function deriveMovementBias(signals: AudioAnalysisSignals): MovementBias {
  return pickHighest<MovementBias>([
    {
      value: "horizontal",
      score:
        signals.beatConsistency * 0.35 +
        (1 - signals.centroidVariance) * 0.25 +
        signals.phraseCadence * 0.2 +
        signals.harmonicStability * 0.2,
    },
    {
      value: "vertical",
      score:
        signals.centroidVariance * 0.4 +
        signals.dynamics * 0.3 +
        signals.layerSpread * 0.15 +
        (1 - signals.beatConsistency) * 0.15,
    },
    {
      value: "orbital",
      score:
        signals.stereoWidth * 0.4 +
        signals.repetitionScore * 0.25 +
        signals.harmonicStability * 0.2 +
        (1 - signals.transientSharpness) * 0.15,
    },
    {
      value: "radial",
      score:
        signals.stereoWidth * 0.38 +
        signals.phraseCadence * 0.24 +
        signals.repetitionScore * 0.2 +
        signals.fluxVariance * 0.18,
    },
  ]);
}

function deriveCameraEnergy(signals: AudioAnalysisSignals): CameraEnergy {
  return pickHighest<CameraEnergy>([
    {
      value: "locked",
      score:
        signals.focalStability * 0.45 +
        (1 - signals.dynamics) * 0.25 +
        signals.harmonicStability * 0.2 +
        (1 - signals.rmsVariance) * 0.1,
    },
    {
      value: "slow drift",
      score:
        (1 - signals.transientSharpness) * 0.3 +
        signals.harmonicStability * 0.25 +
        (1 - signals.silenceRatio) * 0.2 +
        signals.repetitionScore * 0.15 +
        (1 - signals.dynamics) * 0.1,
    },
    {
      value: "tracking",
      score:
        signals.dynamics * 0.35 +
        signals.phraseCadence * 0.25 +
        signals.beatConsistency * 0.2 +
        signals.energy * 0.2,
    },
    {
      value: "orbit",
      score:
        signals.stereoWidth * 0.35 +
        signals.fluxVariance * 0.25 +
        signals.repetitionScore * 0.2 +
        signals.centroidVariance * 0.2,
    },
  ]);
}

function deriveSpacingBehavior(signals: AudioAnalysisSignals): SpacingBehavior {
  const compressed =
    signals.density * 0.4 +
    (1 - signals.silenceRatio) * 0.3 +
    (1 - signals.phraseCadence) * 0.2 +
    signals.layerSpread * 0.1;

  const expanded =
    signals.silenceRatio * 0.4 +
    (1 - signals.density) * 0.3 +
    signals.phraseCadence * 0.2 +
    (1 - signals.layerSpread) * 0.1;

  if (compressed > expanded + 0.1) return "compressed";
  if (expanded > compressed + 0.1) return "expanded";
  return "balanced";
}

function deriveLayerCount(signals: AudioAnalysisSignals): number {
  return Math.max(1, Math.min(5, Math.round(1 + signals.layerSpread * 4)));
}

export function deriveVisualDNA(signals: AudioAnalysisSignals): VisualDNA {
  const transitionAggression = clamp01(
    signals.fluxVariance * 0.32 +
      signals.dynamics * 0.28 +
      (1 - signals.harmonicStability) * 0.2 +
      signals.transientSharpness * 0.12 +
      (1 - signals.phraseCadence) * 0.08
  );

  const visualComplexity = clamp01(
    signals.density * 0.25 +
      (deriveLayerCount(signals) / 5) * 0.2 +
      signals.fluxVariance * 0.2 +
      signals.dynamics * 0.15 +
      signals.layerSpread * 0.1 +
      signals.centroidVariance * 0.1
  );

  return {
    motionRhythm: deriveMotionRhythm(signals),
    visualWeight: deriveVisualWeight(signals),
    sceneDensity: deriveSceneDensity(signals),
    layoutBias: deriveLayoutBias(signals),
    movementBias: deriveMovementBias(signals),
    cameraEnergy: deriveCameraEnergy(signals),
    transitionAggression,
    phraseCadence: clamp01(signals.phraseCadence),
    harmonicStability: clamp01(signals.harmonicStability),
    transientSharpness: clamp01(signals.transientSharpness),
    stereoWidth: clamp01(signals.stereoWidth),
    repetitionScore: clamp01(signals.repetitionScore),
    visualComplexity,
    spacingBehavior: deriveSpacingBehavior(signals),
    layerCount: deriveLayerCount(signals),
    focalStability: clamp01(signals.focalStability),
  };
}
