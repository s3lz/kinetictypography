import type { AudioFeatures } from "@/types/audio";
import type { MotionDimension, MotionLevels } from "@/types/CreativeState";
import type { MotionBehaviorBrief } from "@/types/motionBehavior";
import type { MotionLanguageBrief } from "@/types/motionLanguage";
import {
  deriveMotionProfileFromBias,
  MOTION_PRIMITIVE_METADATA,
  pickSecondaryMotion,
  scoreMotionPrimitiveFit,
  type MotionBias,
  type MotionParamsMap,
  type MotionSelectionResult,
} from "@/types/motionMetadata";
import { resolveBehaviorMotionProfile } from "@/components/MotionEngine/motionBehaviorPrimitives";

const INACTIVE = 0;
const SECONDARY_LEVEL = 28;
const TERTIARY_LEVEL = 14;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function intensityFromForce(force: MotionLanguageBrief["force"]): number {
  if (force === "explosive") return 88;
  if (force === "aggressive") return 78;
  if (force === "controlled") return 65;
  return 50;
}

function buildAudioSignals(audioFeatures: AudioFeatures): Record<string, number> {
  const { emotionalVector, songCharacter, rhythmicPersonality, motionCharacter, performanceTexture, analysisSignals } =
    audioFeatures;

  return {
    energy: emotionalVector.energy,
    warmth: emotionalVector.warmth,
    organic: emotionalVector.organic,
    tension: emotionalVector.tension,
    darkness: emotionalVector.darkness,
    humanity: performanceTexture.humanity,
    dynamics: audioFeatures.dynamics,
    groove: rhythmicPersonality.groove,
    repetition: rhythmicPersonality.repetition,
    staccato: rhythmicPersonality.staccato,
    beatConsistency: analysisSignals.beatConsistency,
    transientSharpness: analysisSignals.transientSharpness,
    spectralFlatness: analysisSignals.spectralFlatness,
    silenceRatio: analysisSignals.silenceRatio,
    flow: motionCharacter.flow,
    elasticity: motionCharacter.elasticity,
    performanceStyle: songCharacter.performanceStyle === "live_band" ? 1 : 0,
  };
}

function buildSongTags(audioFeatures: AudioFeatures): string[] {
  const { songCharacter, emotionalVector } = audioFeatures;
  const tags = [
    songCharacter.performanceStyle,
    songCharacter.energyType,
    songCharacter.rhythmFeel,
    songCharacter.texture,
    songCharacter.emotionalTemperature,
    emotionalVector.energy > 0.65 ? "high energy" : emotionalVector.energy < 0.4 ? "slow" : "moderate",
    emotionalVector.organic > 0.55 ? "organic" : "synthetic",
    audioFeatures.analysisSignals.transientSharpness > 0.55 ? "transient spikes" : "continuous",
    audioFeatures.rhythmicPersonality.repetition > 0.55 ? "repetitive groove" : "irregular",
    songCharacter.performanceStyle === "atmospheric" ? "ambient" : "",
    songCharacter.performanceStyle === "live_band" ? "live_band" : "",
  ];
  return tags.filter(Boolean);
}

function applySelectionRules(
  scores: Record<MotionDimension, number>,
  audioFeatures: AudioFeatures
): Record<MotionDimension, number> {
  const next = { ...scores };
  const { songCharacter, emotionalVector, rhythmicPersonality, performanceTexture } =
    audioFeatures;
  const { performanceStyle, rhythmFeel, energyType } = songCharacter;
  const highEnergy = emotionalVector.energy > 0.65;
  const repetition = rhythmicPersonality.repetition;
  const transient = audioFeatures.analysisSignals.transientSharpness;
  const humanity = performanceTexture.humanity;

  // High energy does NOT always default away from impact when restless/staccato.
  if (highEnergy && repetition > 0.52 && energyType !== "restless") {
    next.elastic += 0.22;
    next.wave += 0.18;
    next.impact -= 0.15;
  }

  if (
    (highEnergy && transient > 0.58 && rhythmFeel === "staccato") ||
    energyType === "restless" ||
    energyType === "surging"
  ) {
    next.impact += 0.22;
    next.elastic += 0.12;
    next.float -= 0.12;
  } else if (highEnergy) {
    next.impact -= 0.04;
  }

  if (performanceStyle === "live_band") {
    next.elastic += 0.28;
    next.material += 0.08;
    if (energyType !== "restless" && energyType !== "surging") {
      next.impact -= 0.12;
    } else {
      next.impact += 0.1;
    }
  }

  if (performanceStyle === "synthetic" && highEnergy) {
    next.wave += 0.2;
    next.elastic -= 0.08;
  }

  if (performanceStyle === "mechanical" && highEnergy) {
    next.wave += 0.18;
    next.impact -= 0.1;
  }

  if (highEnergy && humanity > 0.5 && performanceStyle !== "synthetic") {
    next.elastic += 0.12;
  }

  if (performanceStyle === "atmospheric" || energyType === "floating") {
    next.float += 0.25;
    next.pulse += 0.18;
    next.impact -= 0.2;
    next.elastic -= 0.1;
  }

  if (songCharacter.emotionalTemperature === "warm_space" || emotionalVector.warmth > 0.55) {
    next.pulse += 0.2;
  }

  if (rhythmFeel === "swinging" || rhythmFeel === "loose" || rhythmicPersonality.groove > 0.55) {
    next.wave += 0.22;
  }

  // Avoid literal mistakes
  if (emotionalVector.darkness > 0.6) {
    next.impact -= 0.05;
  }

  return next;
}

export function deriveMotionBiasFromAudio(audioFeatures: AudioFeatures): MotionBias {
  const signals = buildAudioSignals(audioFeatures);
  return {
    flowing: clamp01(signals.organic * 0.4 + (1 - signals.tension) * 0.35 + signals.silenceRatio * 0.25),
    organic: clamp01(signals.warmth * 0.4 + signals.humanity * 0.35 + signals.organic * 0.25),
    connected: clamp01(signals.groove * 0.45 + signals.repetition * 0.3 + signals.flow * 0.25),
    physical: clamp01(signals.elasticity * 0.4 + signals.energy * 0.35 + signals.dynamics * 0.25),
    textural: clamp01(signals.spectralFlatness * 0.45 + signals.humanity * 0.25 + (1 - signals.flow) * 0.2),
    impact: clamp01(signals.transientSharpness * 0.45 + signals.staccato * 0.35 + signals.energy * 0.2),
  };
}

function deriveMotionParams(
  audioFeatures: AudioFeatures,
  primary: MotionDimension,
  primaryIntensity: number
): MotionParamsMap {
  const level = primaryIntensity / 100;
  const { emotionalVector, rhythmicPersonality, performanceTexture, analysisSignals, motionCharacter } =
    audioFeatures;
  const humanity = performanceTexture.humanity;
  const organic = emotionalVector.organic;

  return {
    pulse: {
      intensity: clamp01(0.35 + level * 0.55 + emotionalVector.warmth * 0.15),
      cycleDuration: 4.5 + (1 - level) * 4 + organic * 1.5,
      organicVariation: 0.04 + humanity * 0.08,
      expansionAmount: 0.04 + level * 0.09,
    },
    float: {
      amplitude: 0.35 + level * 0.55,
      buoyancy: 0.55 + organic * 0.35,
      driftSpeed: 0.05 + level * 0.07,
      independence: 0.45 + humanity * 0.35,
    },
    wave: {
      amplitude: 0.3 + level * 0.55,
      wavelength: 0.32 + rhythmicPersonality.groove * 0.28,
      propagationSpeed: 0.4 + level * 0.75,
      smoothness: 0.5 + rhythmicPersonality.groove * 0.35,
    },
    elastic: {
      stiffness: 1.8 + level * 2.2 + motionCharacter.physicality * 0.8,
      damping: 0.18 + (1 - level) * 0.15 + (1 - humanity) * 0.08,
      bounce: 0.45 + level * 0.4 + motionCharacter.elasticity * 0.2,
      energy: 0.6 + level * 0.35 + emotionalVector.energy * 0.25,
    },
    impact: {
      hitStrength: clamp01(0.25 + level * 0.55 + analysisSignals.transientSharpness * 0.25),
      decay: 0.45 + level * 0.35,
      anticipation: 0.08 + level * 0.06,
      randomness: humanity * 0.35,
    },
    material: {
      textureAmount: 0.25 + level * 0.45 + analysisSignals.spectralFlatness * 0.25,
      roughness: 0.35 + analysisSignals.spectralFlatness * 0.4,
      instability: 0.2 + (1 - rhythmicPersonality.groove) * 0.35,
    },
  };
}

export function selectMotionFromAudio(
  audioFeatures: AudioFeatures,
  brief: MotionLanguageBrief,
  motionBehavior?: MotionBehaviorBrief
): MotionSelectionResult {
  const signals = buildAudioSignals(audioFeatures);
  const tags = buildSongTags(audioFeatures);
  const bias = deriveMotionBiasFromAudio(audioFeatures);

  const dimensions: MotionDimension[] = [
    "pulse",
    "float",
    "wave",
    "elastic",
    "impact",
    "material",
  ];

  let scores = {} as Record<MotionDimension, number>;
  for (const dim of dimensions) {
    scores[dim] = scoreMotionPrimitiveFit(dim, signals, tags);
  }
  scores = applySelectionRules(scores, audioFeatures);

  if (motionBehavior) {
    const behaviorProfile = resolveBehaviorMotionProfile(motionBehavior);
    scores[behaviorProfile.primary] += 0.15;
    for (const sec of behaviorProfile.secondary) {
      scores[sec] += 0.08;
    }
  }

  const ranked = (Object.entries(scores) as Array<[MotionDimension, number]>).sort(
    (a, b) => b[1] - a[1]
  );

  let primary = ranked[0]?.[0] ?? "float";

  // Impact only when clearly warranted — never default high-energy pick.
  if (
    primary === "impact" &&
    signals.transientSharpness < 0.52 &&
    signals.staccato < 0.48
  ) {
    primary = ranked.find(([dim]) => dim !== "impact")?.[0] ?? "elastic";
  }

  const secondaryMotion =
    pickSecondaryMotion(primary, ranked) ??
    deriveMotionProfileFromBias(bias).secondaryMotion ??
    "material";

  const secondary = secondaryMotion !== primary ? [secondaryMotion] : [];

  const primaryIntensity = clamp(
    intensityFromForce(brief.force) * (brief.force === "subtle" ? 0.88 : 1),
    42,
    92
  );

  const levels: MotionLevels = {
    float: INACTIVE,
    wave: INACTIVE,
    pulse: INACTIVE,
    elastic: INACTIVE,
    impact: INACTIVE,
    material: INACTIVE,
  };

  levels[primary] = Math.round(primaryIntensity);

  if (secondary.length > 0) {
    levels[secondary[0]] = SECONDARY_LEVEL;
  }

  // Material as subtle tertiary when not already secondary
  if (primary !== "material" && !secondary.includes("material")) {
    levels.material = TERTIARY_LEVEL;
  }

  const motionParams = deriveMotionParams(audioFeatures, primary, levels[primary]);

  return { primary, secondary, levels, motionParams, bias };
}

export function describeMotionSelection(result: MotionSelectionResult): string {
  const primaryMeta = MOTION_PRIMITIVE_METADATA[result.primary];
  const secondary = result.secondary[0];
  const secondaryMeta = secondary ? MOTION_PRIMITIVE_METADATA[secondary] : null;
  return [
    `Primary: ${result.primary} — ${primaryMeta.physicalMetaphor}`,
    secondaryMeta
      ? `Secondary: ${secondary} — ${secondaryMeta.physicalMetaphor}`
      : "Secondary: none",
  ].join(". ");
}
