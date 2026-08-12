import {
  applyPersonalityMotionRules,
  applySpatialPersonalityRules,
  intensityScaledForce,
} from "@/lib/creativeFactors";
import {
  isHighKineticAudio,
  isStronglyFuturisticSynthetic,
} from "@/lib/creativeInterpretation";
import { computeSongUniquenessVector } from "@/lib/songUniquenessVector";
import {
  shouldAllowGlitchMotion,
} from "@/services/musicalPersonalityEngine";
import type { AudioFeatures } from "@/types/audio";
import type {
  MotionDeformation,
  MotionDirection,
  MotionForce,
  MotionLanguageBrief,
  MotionMaterial,
  MotionTiming,
} from "@/types/motionLanguage";
export { deriveMotionBiasFromAudio } from "@/engine/motionSelectionEngine";
import type { SongCharacter } from "@/types/songCharacter";
import type { SongUniquenessVector } from "@/types/songUniqueness";
import type { MotionRhythm, MovementBias } from "@/types/visualDna";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function bucket(value: number, steps = 8): number {
  return Math.round(clamp01(value) * steps);
}

function pickForce(
  personality: AudioFeatures["performanceTexture"],
  rhythmic: AudioFeatures["rhythmicPersonality"],
  motionChar: AudioFeatures["motionCharacter"]
): MotionForce {
  const grooveScore = rhythmic.groove * 0.45 + rhythmic.repetition * 0.25;
  const drive =
    motionChar.physicality * 0.3 +
    personality.rawness * 0.22 +
    rhythmic.irregularity * 0.18 +
    grooveScore * 0.15 +
    motionChar.fragmentation * 0.15;

  if (drive > 0.72) return "explosive";
  if (drive > 0.55) return "aggressive";
  if (drive > 0.35) return "controlled";
  return "subtle";
}

function rhythmToTiming(rhythm: MotionRhythm, rhythmic: AudioFeatures["rhythmicPersonality"]): MotionTiming {
  const grooveScore = rhythmic.groove * 0.55 + rhythmic.repetition * 0.45;
  if (rhythmic.irregularity > grooveScore + 0.1) return "irregular";
  if (grooveScore > 0.58) return "repetitive";
  if (rhythmic.staccato > 0.62 && grooveScore < 0.45) return "staccato";

  const map: Record<MotionRhythm, MotionTiming> = {
    continuous: "smooth",
    staggered: grooveScore > 0.5 ? "repetitive" : "staccato",
    burst: rhythmic.irregularity > 0.5 ? "irregular" : "staccato",
    cascading: "smooth",
    oscillating: "repetitive",
    "stop-start": "irregular",
  };
  return map[rhythm];
}

function movementToDirection(movement: MovementBias): MotionDirection {
  const map: Record<MovementBias, MotionDirection> = {
    horizontal: "horizontal",
    vertical: "vertical",
    orbital: "orbital",
    radial: "radial",
  };
  return map[movement];
}

function transientToDeformation(
  audioFeatures: AudioFeatures
): MotionDeformation {
  const { motionCharacter, performanceTexture, rhythmicPersonality } = audioFeatures;
  const synthetic = isStronglyFuturisticSynthetic(audioFeatures);
  const allowGlitch = shouldAllowGlitchMotion(
    { rhythmicPersonality, performanceTexture, motionCharacter },
    synthetic
  );

  if (allowGlitch && motionCharacter.fragmentation > 0.72) {
    return "fragmentation";
  }

  if (motionCharacter.physicality > motionCharacter.flow + 0.08) {
    return rhythmicPersonality.irregularity > 0.45 ? "scale" : "stretch";
  }
  if (motionCharacter.flow > motionCharacter.physicality + 0.08) {
    return "stretch";
  }
  if (motionCharacter.elasticity > 0.52) {
    return "stretch";
  }
  if (rhythmicPersonality.swing > 0.48) {
    return "rotation";
  }
  return "none";
}

export function deriveMotionDimensionsFromVisualDna(
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  const dna = audioFeatures.visualDna;
  const { performanceTexture, motionCharacter, rhythmicPersonality } = audioFeatures;
  const synthetic = isStronglyFuturisticSynthetic(audioFeatures);
  const highKinetic = isHighKineticAudio(audioFeatures);

  let material: MotionMaterial = "rigid";
  if (highKinetic || motionCharacter.elasticity > 0.52) {
    material = "elastic";
  } else if (motionCharacter.flow > motionCharacter.physicality + 0.06) {
    material = "fluid";
  } else if (performanceTexture.humanity > 0.55) {
    material = "organic";
  } else if (motionCharacter.physicality > motionCharacter.flow + 0.06) {
    material = "elastic";
  } else if (
    synthetic &&
    performanceTexture.mechanicalness > 0.55 &&
    performanceTexture.humanity < 0.4
  ) {
    material = "mechanical";
  }

  return {
    force: pickForce(performanceTexture, rhythmicPersonality, motionCharacter),
    material,
    timing: rhythmToTiming(dna.motionRhythm, rhythmicPersonality),
    deformation: transientToDeformation(audioFeatures),
    direction: movementToDirection(dna.movementBias),
  };
}

export function deriveMotionDimensionsFromSongCharacter(
  songCharacter: SongCharacter,
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  const { performanceStyle, rhythmFeel } = songCharacter;
  const { performanceTexture, motionCharacter, rhythmicPersonality } = audioFeatures;

  const base: MotionLanguageBrief = {
    force: pickForce(performanceTexture, rhythmicPersonality, motionCharacter),
    material:
      motionCharacter.elasticity > 0.5
        ? "elastic"
        : performanceTexture.humanity > 0.5
          ? "organic"
          : motionCharacter.flow > 0.5
            ? "fluid"
            : "rigid",
    timing:
      rhythmFeel === "staccato" || rhythmicPersonality.staccato > 0.55
        ? "staccato"
        : rhythmicPersonality.irregularity > 0.5
          ? "irregular"
          : "smooth",
    deformation: transientToDeformation(audioFeatures),
    direction: rhythmicPersonality.groove > 0.5 ? "horizontal" : "orbital",
  };

  if (performanceStyle === "atmospheric") {
    return {
      ...base,
      force: "subtle",
      material: "fluid",
      timing: "smooth",
      deformation: "none",
      direction: "orbital",
    };
  }

  if (
    performanceStyle === "synthetic" &&
    performanceTexture.mechanicalness > 0.55 &&
    performanceTexture.humanity < 0.38
  ) {
    return {
      ...base,
      material: "mechanical",
      timing: rhythmFeel === "grid" ? "repetitive" : base.timing,
    };
  }

  return base;
}

function deriveMotionDimensionsFromEmotionalVector(
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  const { performanceTexture, motionCharacter, rhythmicPersonality } = audioFeatures;

  return {
    force: pickForce(performanceTexture, rhythmicPersonality, motionCharacter),
    material:
      performanceTexture.humanity > 0.55
        ? "organic"
        : motionCharacter.elasticity > 0.5
          ? "elastic"
          : "rigid",
    timing: rhythmicPersonality.staccato > 0.55 ? "staccato" : "smooth",
    deformation: transientToDeformation(audioFeatures),
    direction: "horizontal",
  };
}

function scorePick<T extends string>(
  candidates: Array<{ value: T; score: number }>
): T {
  return [...candidates].sort((a, b) => b.score - a.score)[0]?.value ?? candidates[0].value;
}

export function blendMotionDimensions(
  dna: MotionLanguageBrief,
  song: MotionLanguageBrief,
  emotional: MotionLanguageBrief
): MotionLanguageBrief {
  return {
    force: scorePick([
      { value: dna.force, score: 0.5 },
      { value: song.force, score: 0.3 },
      { value: emotional.force, score: 0.15 },
    ]),
    material: scorePick([
      { value: dna.material, score: 0.5 },
      { value: song.material, score: 0.3 },
      { value: emotional.material, score: 0.15 },
    ]),
    timing: scorePick([
      { value: dna.timing, score: 0.5 },
      { value: song.timing, score: 0.3 },
      { value: emotional.timing, score: 0.15 },
    ]),
    deformation: scorePick([
      { value: dna.deformation, score: 0.5 },
      { value: song.deformation, score: 0.3 },
      { value: emotional.deformation, score: 0.15 },
    ]),
    direction: scorePick([
      { value: dna.direction, score: 0.5 },
      { value: song.direction, score: 0.3 },
      { value: emotional.direction, score: 0.15 },
    ]),
  };
}

const MATERIAL_CYCLE: MotionMaterial[] = [
  "fluid",
  "elastic",
  "rigid",
  "mechanical",
  "organic",
];

const TIMING_CYCLE: MotionTiming[] = ["smooth", "staccato", "irregular", "repetitive"];

const DEFORMATION_CYCLE: MotionDeformation[] = [
  "none",
  "scale",
  "stretch",
  "rotation",
  "fragmentation",
];

export function differentiateMotionDimensions(
  brief: MotionLanguageBrief,
  uniqueness: SongUniquenessVector,
  salt: number,
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  const materialIndex =
    (MATERIAL_CYCLE.indexOf(brief.material) + salt + uniqueness.differentiationKey.length) %
    MATERIAL_CYCLE.length;
  const timingIndex =
    (TIMING_CYCLE.indexOf(brief.timing) + salt + bucket(uniqueness.density)) %
    TIMING_CYCLE.length;

  let deformation = brief.deformation;
  const deformationIndex =
    (DEFORMATION_CYCLE.indexOf(brief.deformation) + salt + bucket(uniqueness.repetitionScore)) %
    DEFORMATION_CYCLE.length;
  const candidateDeformation = DEFORMATION_CYCLE[deformationIndex] ?? brief.deformation;

  if (
    candidateDeformation === "fragmentation" &&
    !shouldAllowGlitchMotion(
      {
        rhythmicPersonality: audioFeatures.rhythmicPersonality,
        performanceTexture: audioFeatures.performanceTexture,
        motionCharacter: audioFeatures.motionCharacter,
      },
      isStronglyFuturisticSynthetic(audioFeatures)
    )
  ) {
    deformation = "stretch";
  } else {
    deformation = candidateDeformation;
  }

  let direction = brief.direction;
  if (uniqueness.stereoWidth < 0.22) direction = "horizontal";
  if (uniqueness.stereoWidth > 0.28) direction = "radial";

  return {
    ...brief,
    material: MATERIAL_CYCLE[materialIndex] ?? brief.material,
    timing: TIMING_CYCLE[timingIndex] ?? brief.timing,
    deformation,
    direction,
  };
}

export function deriveMotionDimensions(
  audioFeatures: AudioFeatures,
  options?: { incoming?: MotionLanguageBrief; collisionSalt?: number }
): MotionLanguageBrief {
  const dna = deriveMotionDimensionsFromVisualDna(audioFeatures);
  const song = deriveMotionDimensionsFromSongCharacter(
    audioFeatures.songCharacter,
    audioFeatures
  );
  const emotional = deriveMotionDimensionsFromEmotionalVector(audioFeatures);

  let blended = options?.incoming
    ? blendMotionDimensions(options.incoming, song, emotional)
    : blendMotionDimensions(dna, song, emotional);

  blended = applyPersonalityMotionRules(blended, audioFeatures);
  blended = {
    ...blended,
    force: intensityScaledForce(blended.force, audioFeatures),
  };

  if (options?.collisionSalt && options.collisionSalt > 0) {
    blended = differentiateMotionDimensions(
      blended,
      computeSongUniquenessVector(audioFeatures),
      options.collisionSalt,
      audioFeatures
    );
  }

  return blended;
}

export function motionCharacterFromDimensions(brief: MotionLanguageBrief): string {
  if (brief.material === "fluid") return "floating";
  if (brief.material === "elastic") return "kinetic";
  if (brief.material === "mechanical") return "mechanical";
  if (brief.deformation === "fragmentation") return "fragmented";
  if (brief.material === "organic") return "elastic";
  return "locked";
}
