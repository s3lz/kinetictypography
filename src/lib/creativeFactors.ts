import type { AudioFeatures } from "@/types/audio";
import type {
  CompositionDirection,
  VisualLanguage,
} from "@/types/designBrief";
import type { MotionLanguageBrief } from "@/types/motionLanguage";

export interface CreativeFactorSources {
  intensitySource: string;
  spatialSource: string;
  rhythmSource: string;
  materialSource: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Intensity-only signal — does not drive artistic personality. */
export function computeAudioIntensity(audioFeatures: AudioFeatures): number {
  const { energy } = audioFeatures.emotionalVector;
  const { transientSharpness } = audioFeatures.visualDna;
  const { dynamics, brightness, density } = audioFeatures;
  const silenceRatio = audioFeatures.analysisSignals.silenceRatio;
  const tempo =
    audioFeatures.tempoInterpretation?.normalizedTempo ?? audioFeatures.tempo;
  const tempoConfidence =
    audioFeatures.tempoInterpretation?.tempoConfidence ?? 0.5;

  const sparseDark = density < 0.22 && brightness < 0.2;
  const pulseSparse =
    sparseDark && dynamics > 0.45 && silenceRatio > 0.18;

  // Sparse/dark pulse material: transients/dynamics describe attacks, not song energy.
  const transientWeight = pulseSparse ? 0.06 : sparseDark ? 0.1 : 0.22;
  const dynamicsWeight = pulseSparse ? 0.08 : sparseDark ? 0.12 : 0.18;
  const energyWeight = pulseSparse ? 0.28 : 0.34;

  const liveBand =
    !pulseSparse && audioFeatures.songCharacter.performanceStyle === "live_band"
      ? 0.1
      : 0;

  // Only boost tempo when the detector is reasonably confident.
  const tempoBoost =
    tempoConfidence >= 0.45
      ? tempo > 150
        ? 0.1
        : tempo > 130
          ? 0.05
          : 0
      : 0;

  // Sustained quietness pulls intensity down for ambient/heartbeat-like tracks.
  const sparsePenalty = pulseSparse
    ? 0.22
    : sparseDark
      ? 0.12
      : silenceRatio > 0.4
        ? 0.08
        : 0;

  return clamp01(
    energy * energyWeight +
      transientSharpness * transientWeight +
      dynamics * dynamicsWeight +
      tempoBoost +
      liveBand -
      sparsePenalty
  );
}

export function isHighIntensityAudio(audioFeatures: AudioFeatures): boolean {
  return computeAudioIntensity(audioFeatures) > 0.62;
}

export type EnergyBucket = "low" | "mid" | "high";

export function computeEnergyBucket(audioFeatures: AudioFeatures): EnergyBucket {
  const intensity = computeAudioIntensity(audioFeatures);
  if (intensity > 0.62) return "high";
  if (intensity < 0.45) return "low";
  return "mid";
}

export function deriveCreativeFactorSources(
  audioFeatures: AudioFeatures
): CreativeFactorSources {
  const {
    rhythmicPersonality,
    motionCharacter,
    performanceTexture,
    analysisSignals,
    visualDna,
    songCharacter,
  } = audioFeatures;
  const intensity = computeAudioIntensity(audioFeatures);
  const tempo =
    audioFeatures.tempoInterpretation?.normalizedTempo ?? audioFeatures.tempo;
  const tempoConfidence =
    audioFeatures.tempoInterpretation?.tempoConfidence ?? 0.5;

  const intensitySource = [
    `energy=${audioFeatures.emotionalVector.energy.toFixed(2)}`,
    `transient=${visualDna.transientSharpness.toFixed(2)}`,
    `tempo=${Math.round(tempo)}`,
    `tempoConf=${tempoConfidence.toFixed(2)}`,
    `density=${audioFeatures.density.toFixed(2)}`,
    `brightness=${audioFeatures.brightness.toFixed(2)}`,
    `live_band=${songCharacter.performanceStyle === "live_band"}`,
    `intensity=${intensity.toFixed(2)}`,
  ].join(", ");

  const stereoWidth = visualDna.stereoWidth;
  const phraseCadence = analysisSignals.phraseCadence;
  let spatialSource: string;

  if (stereoWidth > 0.28) {
    spatialSource = `stereoWidth=${stereoWidth.toFixed(2)}>0.28 → expansive/radial/asymmetric`;
  } else if (stereoWidth < 0.22) {
    spatialSource = `stereoWidth=${stereoWidth.toFixed(2)}<0.22 → contained/compressed`;
  } else {
    spatialSource = `stereoWidth=${stereoWidth.toFixed(2)}, phraseCadence=${phraseCadence.toFixed(2)}`;
  }

  const grooveScore =
    rhythmicPersonality.groove * 0.55 + rhythmicPersonality.repetition * 0.45;
  const irregularityScore = rhythmicPersonality.irregularity;

  const rhythmSource =
    grooveScore > irregularityScore
      ? `groove/repetition=${grooveScore.toFixed(2)}>${irregularityScore.toFixed(2)} → structured rhythm`
      : `irregularity=${irregularityScore.toFixed(2)}>${grooveScore.toFixed(2)} → unstable rhythm`;

  const materialSource =
    motionCharacter.physicality > motionCharacter.flow
      ? `physicality=${motionCharacter.physicality.toFixed(2)}>flow=${motionCharacter.flow.toFixed(2)} → push/pull`
      : `flow=${motionCharacter.flow.toFixed(2)}≥physicality=${motionCharacter.physicality.toFixed(2)} → continuous drift`;

  const humanityNote =
    performanceTexture.humanity > 0.5
      ? `, humanity=${performanceTexture.humanity.toFixed(2)}`
      : "";
  const fragmentationNote =
    motionCharacter.fragmentation > 0.55
      ? `, fragmentation=${motionCharacter.fragmentation.toFixed(2)}`
      : "";

  return {
    intensitySource,
    spatialSource,
    rhythmSource,
    materialSource: materialSource + humanityNote + fragmentationNote,
  };
}

export function logCreativeFactors(audioFeatures: AudioFeatures): CreativeFactorSources {
  const factors = deriveCreativeFactorSources(audioFeatures);
  console.log("creativeFactors:", factors);
  return factors;
}

export function applySpatialPersonalityRules(
  composition: CompositionDirection,
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures
): { composition: CompositionDirection; visualLanguage: VisualLanguage } {
  const stereoWidth = audioFeatures.visualDna.stereoWidth;
  const phraseCadence = audioFeatures.analysisSignals.phraseCadence;
  let nextComposition = { ...composition };
  let nextVisual = { ...visualLanguage };

  if (stereoWidth > 0.28) {
    if (
      nextComposition.composition === "edge-anchor" ||
      nextComposition.composition === "left-rail" ||
      nextComposition.composition === "narrow-column"
    ) {
      nextComposition.composition = "radial-burst";
      nextComposition.alignment = "center";
    }
    nextComposition.negativeSpace = clamp01(
      Math.max(nextComposition.negativeSpace, 0.48 + phraseCadence * 0.08)
    );
    if (nextComposition.textDensity === "dense") {
      nextComposition.textDensity = "balanced";
    }
    nextVisual.composition =
      nextVisual.composition === "compressed" ? "expanded" : nextVisual.composition;
    nextVisual.symmetry =
      nextVisual.symmetry === "symmetric" ? "asymmetric" : nextVisual.symmetry;
  } else if (stereoWidth < 0.22) {
    if (
      nextComposition.composition === "radial-burst" ||
      nextComposition.composition === "wide-radial"
    ) {
      nextComposition.composition = "center-column";
      nextComposition.alignment = "center";
    }
    nextComposition.negativeSpace = clamp01(
      Math.min(nextComposition.negativeSpace, 0.42)
    );
    nextVisual.composition = "compressed";
    nextVisual.spacing = "tight";
  }

  return { composition: nextComposition, visualLanguage: nextVisual };
}

export function applyPersonalityMotionRules(
  motion: MotionLanguageBrief,
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  const { rhythmicPersonality, motionCharacter } = audioFeatures;
  const { groove, irregularity, repetition } = rhythmicPersonality;
  const { physicality, flow } = motionCharacter;
  let next = { ...motion };

  const grooveScore = groove * 0.55 + repetition * 0.45;

  if (physicality > flow + 0.06) {
    next = {
      ...next,
      material: next.material === "fluid" ? "elastic" : next.material,
      deformation:
        next.deformation === "none" || next.deformation === "rotation"
          ? "scale"
          : next.deformation,
      timing: irregularity > 0.45 ? "irregular" : next.timing,
    };
  } else if (flow > physicality + 0.06) {
    next = {
      ...next,
      material: "fluid",
      deformation:
        next.deformation === "fragmentation" ? "stretch" : next.deformation,
      direction:
        next.direction === "horizontal" ? "orbital" : next.direction,
      timing: next.timing === "staccato" ? "smooth" : next.timing,
    };
  }

  if (grooveScore > irregularity + 0.08) {
    next.timing =
      next.timing === "irregular" ? "repetitive" : next.timing;
  } else if (irregularity > grooveScore + 0.08) {
    next.timing = "irregular";
    next.force =
      next.force === "subtle" ? "controlled" : next.force;
  }

  return next;
}

export function intensityScaledForce(
  base: MotionLanguageBrief["force"],
  audioFeatures: AudioFeatures
): MotionLanguageBrief["force"] {
  const intensity = computeAudioIntensity(audioFeatures);
  if (intensity < 0.45) return base;
  if (intensity > 0.78 && base === "subtle") return "controlled";
  if (intensity > 0.85 && base === "controlled") return "aggressive";
  return base;
}
