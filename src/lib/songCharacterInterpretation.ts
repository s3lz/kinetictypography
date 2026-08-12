import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type {
  CompositionDirection,
  VisualLanguage,
} from "@/types/designBrief";
import type { SelectedFontMetadata } from "@/types/fontMetadata";
import type { SongCharacter } from "@/types/songCharacter";
import { computeEnergyBucket } from "@/lib/creativeFactors";
import {
  computeDirectionFamilies,
  computeSpatialBehaviorSignature,
  type SpatialBehaviorSignature,
} from "@/lib/directionFamilies";
import { deriveMotionBehavior } from "@/engine/motionBehaviorEngine";
import { derivePalette } from "@/engine/paletteEngine";
import {
  deriveMotionDimensionsFromSongCharacter,
  motionCharacterFromDimensions,
} from "@/engine/motionDimensionsEngine";
import {
  applyFontStylingModifier,
  getFontMetadata,
} from "@/lib/creativeInterpretation";
import { motionBehaviorKey } from "@/types/motionBehavior";
import { motionDimensionKey, type MotionLanguageBrief } from "@/types/motionLanguage";

const SIGNATURE_STORAGE_KEY = "creative-direction-signatures:v1";
const MAX_STORED_SIGNATURES = 12;

export interface DirectionSignature {
  paletteKey: string;
  composition: string;
  alignment: string;
  textDensity: string;
  motionCharacter: string;
  motionIdleKey: string;
  motionBehaviorKey: string;
  spatialBehavior: SpatialBehaviorSignature;
  families: ReturnType<typeof computeDirectionFamilies>;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);

  const toChannel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${toChannel(0)}${toChannel(8)}${toChannel(4)}`;
}

export function computeDirectionSignature(
  direction: CreativeDirection
): DirectionSignature {
  const { palette, composition, visualLanguage, motionLanguage, motionBehavior } = direction;
  return {
    paletteKey: `${palette.background}|${palette.textColor}`,
    composition: composition.composition,
    alignment: composition.alignment,
    textDensity: composition.textDensity,
    motionCharacter: visualLanguage.motionCharacter,
    motionIdleKey: motionDimensionKey(motionLanguage),
    motionBehaviorKey: motionBehaviorKey(motionBehavior),
    spatialBehavior: computeSpatialBehaviorSignature(direction),
    families: computeDirectionFamilies(direction),
  };
}

export function signaturesNearlyIdentical(
  a: DirectionSignature,
  b: DirectionSignature
): boolean {
  return (
    a.families.paletteFamily === b.families.paletteFamily &&
    a.families.motionFamily === b.families.motionFamily &&
    a.families.compositionFamily === b.families.compositionFamily
  );
}

export function songCharactersDistinct(
  a: SongCharacter,
  b: SongCharacter
): boolean {
  return (
    a.performanceStyle !== b.performanceStyle ||
    a.energyType !== b.energyType ||
    a.rhythmFeel !== b.rhythmFeel ||
    a.texture !== b.texture ||
    a.emotionalTemperature !== b.emotionalTemperature
  );
}

interface StoredSignature {
  fingerprint: string;
  songCharacter: SongCharacter;
  energyBucket: ReturnType<typeof computeEnergyBucket>;
  signature: DirectionSignature;
}

function readStoredSignatures(): StoredSignature[] {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      fingerprint: string;
      songCharacter: SongCharacter;
      energyBucket?: ReturnType<typeof computeEnergyBucket>;
      signature: DirectionSignature;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      fingerprint: entry.fingerprint,
      songCharacter: entry.songCharacter,
      energyBucket: entry.energyBucket ?? "mid",
      signature: entry.signature,
    }));
  } catch {
    return [];
  }
}

function writeStoredSignature(
  fingerprint: string,
  songCharacter: SongCharacter,
  energyBucket: ReturnType<typeof computeEnergyBucket>,
  signature: DirectionSignature
): void {
  try {
    const existing = readStoredSignatures().filter((entry) => entry.fingerprint !== fingerprint);
    existing.unshift({ fingerprint, songCharacter, energyBucket, signature });
    localStorage.setItem(
      SIGNATURE_STORAGE_KEY,
      JSON.stringify(existing.slice(0, MAX_STORED_SIGNATURES))
    );
  } catch {
    // ignore storage failures
  }
}

export function findCollidingSignature(
  fingerprint: string,
  songCharacter: SongCharacter,
  signature: DirectionSignature
): StoredSignature | null {
  for (const stored of readStoredSignatures()) {
    if (stored.fingerprint === fingerprint) continue;
    if (!songCharactersDistinct(songCharacter, stored.songCharacter)) continue;
    if (signaturesNearlyIdentical(signature, stored.signature)) {
      return stored;
    }
  }
  return null;
}

export function recordDirectionSignature(
  fingerprint: string,
  songCharacter: SongCharacter,
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): void {
  writeStoredSignature(
    fingerprint,
    songCharacter,
    computeEnergyBucket(audioFeatures),
    computeDirectionSignature(direction)
  );
}

export function derivePaletteFromSongCharacter(
  _songCharacter: SongCharacter,
  audioFeatures: AudioFeatures
): CreativeDirection["palette"] {
  return derivePalette(audioFeatures);
}

export function deriveCompositionFromSongCharacter(
  songCharacter: SongCharacter,
  audioFeatures: AudioFeatures
): CompositionDirection {
  const { performanceStyle, energyType, rhythmFeel } = songCharacter;
  const silence = audioFeatures.analysisSignals.silenceRatio;

  if (performanceStyle === "live_band") {
    return {
      composition: energyType === "restless" ? "offset-column" : "left-rail",
      negativeSpace: clamp01(0.28 + silence * 0.2),
      alignment: "left",
      textDensity: rhythmFeel === "staccato" ? "balanced" : "dense",
    };
  }

  if (performanceStyle === "atmospheric") {
    return {
      composition: "center-column",
      negativeSpace: clamp01(0.62 + silence * 0.25),
      alignment: "center",
      textDensity: "sparse",
    };
  }

  if (performanceStyle === "synthetic" || performanceStyle === "mechanical") {
    return {
      composition: rhythmFeel === "grid" ? "center-column" : "left-rail",
      negativeSpace: clamp01(0.4 + silence * 0.15),
      alignment: rhythmFeel === "grid" ? "center" : "left",
      textDensity: "balanced",
    };
  }

  if (performanceStyle === "intimate") {
    return {
      composition: "edge-anchor",
      negativeSpace: clamp01(0.55 + silence * 0.2),
      alignment: "left",
      textDensity: "sparse",
    };
  }

  return {
    composition: "poster-stack",
    negativeSpace: clamp01(0.42 + silence * 0.18),
    alignment: "center",
    textDensity: "balanced",
  };
}

export function deriveMotionLanguageFromSongCharacter(
  songCharacter: SongCharacter,
  audioFeatures: AudioFeatures
): MotionLanguageBrief {
  return deriveMotionDimensionsFromSongCharacter(songCharacter, audioFeatures);
}

export function deriveVisualLanguageFromSongCharacter(
  songCharacter: SongCharacter,
  base: VisualLanguage,
  audioFeatures: AudioFeatures
): VisualLanguage {
  const { performanceStyle, energyType, rhythmFeel, texture } = songCharacter;

  let motionCharacter = base.motionCharacter;
  let edgeTreatment = base.edgeTreatment;
  let visualTexture = base.texture;
  let geometry = base.geometry;

  if (performanceStyle === "live_band") {
    const physical = audioFeatures.motionCharacter.physicality > audioFeatures.motionCharacter.flow;
    motionCharacter = physical || energyType === "restless" ? "kinetic" : "elastic";
    edgeTreatment = physical ? "hard" : "soft";
    visualTexture = texture === "raw" ? "grain" : "grain";
    geometry = physical ? "angular" : "organic";
  } else if (performanceStyle === "atmospheric") {
    motionCharacter = "floating";
    edgeTreatment = "feathered";
    visualTexture = "smooth";
    geometry = "organic";
  } else if (performanceStyle === "synthetic") {
    motionCharacter = "mechanical";
    edgeTreatment = "hard";
    visualTexture = "smooth";
    geometry = "modular";
  } else if (performanceStyle === "mechanical") {
    motionCharacter = "mechanical";
    edgeTreatment = "hard";
    visualTexture = "grain";
    geometry = "rectilinear";
  }

  if (
    rhythmFeel === "staccato" &&
    audioFeatures.rhythmicPersonality.irregularity >
      audioFeatures.rhythmicPersonality.groove + 0.08
  ) {
    motionCharacter = "fragmented";
  }

  return {
    ...base,
    geometry,
    edgeTreatment,
    motionCharacter,
    texture: visualTexture,
  };
}

export function directionMatchesSongCharacter(
  direction: CreativeDirection,
  songCharacter: SongCharacter
): boolean {
  const { performanceStyle, energyType } = songCharacter;
  const motion = direction.motionLanguage;

  if (performanceStyle === "live_band") {
    if (motion.material === "mechanical" && energyType === "restless") {
      return false;
    }
    if (motion.material === "fluid") {
      return false;
    }
  }

  if (performanceStyle === "atmospheric") {
    if (direction.composition.textDensity === "dense" && direction.composition.negativeSpace < 0.45) {
      return false;
    }
    if (motion.force === "explosive" || motion.deformation === "fragmentation") {
      return false;
    }
  }

  if (performanceStyle === "synthetic") {
    if (direction.visualLanguage.texture === "digital-noise" && songCharacter.texture === "clean") {
      return false;
    }
    if (motion.material === "elastic" && motion.timing === "irregular") {
      return false;
    }
  }

  return true;
}

export function refineDirectionFromSongCharacter(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata
): CreativeDirection {
  const songCharacter = audioFeatures.songCharacter;
  const font = getFontMetadata(selectedFont.name);

  const visualLanguage = applyFontStylingModifier(
    {
      ...deriveVisualLanguageFromSongCharacter(
        songCharacter,
        direction.visualLanguage,
        audioFeatures
      ),
      motionCharacter: motionCharacterFromDimensions(
        deriveMotionLanguageFromSongCharacter(songCharacter, audioFeatures)
      ),
    },
    font,
    audioFeatures
  );

  return {
    ...direction,
    palette: derivePaletteFromSongCharacter(songCharacter, audioFeatures),
    composition: deriveCompositionFromSongCharacter(songCharacter, audioFeatures),
    motionLanguage: deriveMotionLanguageFromSongCharacter(songCharacter, audioFeatures),
    motionBehavior: deriveMotionBehavior(
      audioFeatures,
      deriveMotionLanguageFromSongCharacter(songCharacter, audioFeatures),
      deriveCompositionFromSongCharacter(songCharacter, audioFeatures)
    ),
    visualLanguage,
    artisticIntent: [
      `Song character: ${songCharacter.performanceStyle} / ${songCharacter.energyType} / ${songCharacter.rhythmFeel}.`,
      direction.artisticIntent,
    ].join(" "),
  };
}

export function validateSongCharacterDirection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string
): string[] {
  const errors: string[] = [];
  const songCharacter = audioFeatures.songCharacter;
  const signature = computeDirectionSignature(direction);

  if (!directionMatchesSongCharacter(direction, songCharacter)) {
    errors.push(
      "creative direction does not reflect songCharacter — palette/motion/composition mismatch"
    );
  }

  const collision = findCollidingSignature(fingerprint, songCharacter, signature);
  if (collision) {
    errors.push(
      `direction shares palette/motion/composition family with another song (${collision.songCharacter.performanceStyle}) — must differentiate using uniqueness vector`
    );
  }

  return errors;
}
