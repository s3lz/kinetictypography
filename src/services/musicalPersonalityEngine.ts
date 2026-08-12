import type {
  AudioMotionCharacter,
  MusicalPersonality,
  PerformanceTexture,
  RhythmicPersonality,
} from "@/types/musicalPersonality";
import type { AudioFeatures } from "@/types/audio";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function deriveRhythmicPersonality(
  signals: AudioFeatures["analysisSignals"],
  tempoConfidence: number
): RhythmicPersonality {
  const groove = clamp01(
    signals.beatConsistency * 0.45 +
      signals.phraseCadence * 0.25 +
      (1 - signals.onsetClustering) * 0.15 +
      tempoConfidence * 0.15
  );

  const staccato = clamp01(
    signals.onsetClustering * 0.28 +
      (1 - signals.phraseCadence) * 0.22 +
      signals.fluxVariance * 0.18 +
      signals.transientSharpness * 0.12
  );

  const swing = clamp01(
    signals.phraseCadence * 0.35 +
      (1 - signals.beatConsistency) * 0.25 +
      signals.centroidVariance * 0.2 +
      signals.rmsVariance * 0.2
  );

  const repetition = clamp01(
    signals.repetitionScore * 0.55 +
      signals.beatConsistency * 0.25 +
      signals.harmonicStability * 0.2
  );

  const irregularity = clamp01(
    (1 - signals.beatConsistency) * 0.35 +
      signals.onsetClustering * 0.25 +
      signals.fluxVariance * 0.2 +
      signals.centroidVariance * 0.2
  );

  return { groove, staccato, swing, repetition, irregularity };
}

function derivePerformanceTexture(
  signals: AudioFeatures["analysisSignals"],
  emotional: AudioFeatures["emotionalVector"],
  semantic: AudioFeatures["semanticProfile"]
): PerformanceTexture {
  const liveHints = semantic.instrumentation.some((hint) =>
    ["acoustic", "guitar", "drums", "live", "bass", "piano", "percussion"].some((key) =>
      hint.includes(key)
    )
  );

  const humanity = clamp01(
    emotional.organic * 0.45 +
      (liveHints ? 0.25 : 0) +
      signals.harmonicStability * 0.15 +
      (1 - signals.repetitionScore) * 0.15
  );

  const imperfection = clamp01(
    signals.rmsVariance * 0.3 +
      signals.centroidVariance * 0.25 +
      (1 - signals.beatConsistency) * 0.2 +
      emotional.organic * 0.25
  );

  const rawness = clamp01(
    signals.spectralFlatness * 0.28 +
      emotional.organic * 0.24 +
      signals.centroidVariance * 0.22 +
      signals.transientSharpness * 0.14 +
      (1 - signals.harmonicStability) * 0.12
  );

  const mechanicalness = clamp01(
    signals.repetitionScore * 0.35 +
      signals.beatConsistency * 0.25 +
      (1 - emotional.organic) * 0.2 +
      signals.harmonicStability * 0.2
  );

  return { humanity, imperfection, rawness, mechanicalness };
}

function deriveAudioMotionCharacter(
  rhythmic: RhythmicPersonality,
  texture: PerformanceTexture,
  signals: AudioFeatures["analysisSignals"]
): AudioMotionCharacter {
  const elasticity = clamp01(
    texture.humanity * 0.35 +
      rhythmic.swing * 0.25 +
      rhythmic.irregularity * 0.2 +
      texture.imperfection * 0.2
  );

  const physicality = clamp01(
    texture.rawness * 0.32 +
      rhythmic.swing * 0.24 +
      rhythmic.irregularity * 0.2 +
      texture.imperfection * 0.16 +
      signals.transientSharpness * 0.08
  );

  const flow = clamp01(
    rhythmic.groove * 0.42 +
      (1 - rhythmic.staccato) * 0.28 +
      texture.humanity * 0.2 +
      signals.phraseCadence * 0.1
  );

  const fragmentation = clamp01(
    rhythmic.irregularity * 0.32 +
      elasticity * 0.2 +
      (1 - texture.humanity) * 0.22 +
      rhythmic.staccato * 0.16 +
      signals.transientSharpness * 0.1
  );

  return { elasticity, physicality, flow, fragmentation };
}

export function deriveMusicalPersonality(
  partial: Pick<
    AudioFeatures,
    "analysisSignals" | "emotionalVector" | "semanticProfile" | "tempoInterpretation"
  >
): MusicalPersonality {
  const tempoConfidence = partial.tempoInterpretation?.tempoConfidence ?? 0.5;
  const rhythmicPersonality = deriveRhythmicPersonality(
    partial.analysisSignals,
    tempoConfidence
  );
  const performanceTexture = derivePerformanceTexture(
    partial.analysisSignals,
    partial.emotionalVector,
    partial.semanticProfile
  );
  const motionCharacter = deriveAudioMotionCharacter(
    rhythmicPersonality,
    performanceTexture,
    partial.analysisSignals
  );

  return { rhythmicPersonality, performanceTexture, motionCharacter };
}

export function computeGlitchScore(
  personality: MusicalPersonality,
  syntheticSignals: boolean
): number {
  if (!syntheticSignals) return 0;

  const { motionCharacter, performanceTexture } = personality;
  return clamp01(
    motionCharacter.fragmentation * 0.4 +
      (1 - performanceTexture.humanity) * 0.35 +
      performanceTexture.mechanicalness * 0.25
  );
}

export function shouldAllowGlitchMotion(
  personality: MusicalPersonality,
  syntheticSignals: boolean
): boolean {
  return computeGlitchScore(personality, syntheticSignals) > 0.62;
}
