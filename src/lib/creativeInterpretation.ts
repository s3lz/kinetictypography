import fontLibrary from "@/data/fontLibrary.json";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { VisualLanguage } from "@/types/designBrief";
import type { FontId } from "@/engine/fontSelector";
import type { FontMetadata } from "@/types/fontMetadata";
import type { SelectedFontMetadata } from "@/types/fontMetadata";
import { derivePaletteFromAudio as derivePaletteFromEngine, shouldUseGrayscalePalette } from "@/engine/paletteEngine";
import { resolveTextColor } from "@/types/palette";
import { derivePaletteFromSongCharacter } from "@/lib/songCharacterInterpretation";
import {
  computeAudioIntensity,
  isHighIntensityAudio,
} from "@/lib/creativeFactors";

const FONT_LIBRARY = fontLibrary as FontMetadata[];

const NEON_HEX_PATTERNS = [
  /^#00ffff$/i,
  /^#00ccff$/i,
  /^#33ff00$/i,
  /^#00ff99$/i,
  /^#0ff$/i,
  /^#0cf$/i,
  /^#3f0$/i,
];

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

export function getFontMetadata(fontId: FontId): FontMetadata {
  return FONT_LIBRARY.find((font) => font.name === fontId) ?? FONT_LIBRARY[0];
}

export function isStronglyFuturisticSynthetic(audioFeatures: AudioFeatures): boolean {
  const { emotionalVector, semanticProfile, performanceTexture, motionCharacter } =
    audioFeatures;
  const syntheticTexture = semanticProfile.textureHints.some((hint) =>
    ["synthetic", "glassy", "digital"].some((key) => hint.includes(key))
  );
  const electronicInstrumentation = semanticProfile.instrumentation.some((hint) =>
    ["electronic", "synth", "sub-bass"].some((key) => hint.includes(key))
  );

  return (
    emotionalVector.organic < 0.42 &&
    emotionalVector.warmth < 0.48 &&
    audioFeatures.motionCharacter.fragmentation > 0.58 &&
    audioFeatures.performanceTexture.humanity < 0.4 &&
    (syntheticTexture || electronicInstrumentation)
  );
}

export function isWarmOrganic(audioFeatures: AudioFeatures): boolean {
  const { warmth, organic } = audioFeatures.emotionalVector;
  return warmth > 0.52 && organic > 0.48;
}

export function isHighEnergyAggressive(audioFeatures: AudioFeatures): boolean {
  return isHighIntensityAudio(audioFeatures);
}

export { isHighIntensityAudio, computeAudioIntensity };

function hasLiveInstrumentation(audioFeatures: AudioFeatures): boolean {
  return audioFeatures.semanticProfile.instrumentation.some((hint) =>
    ["acoustic", "guitar", "drums", "live", "bass", "piano", "percussion"].some(
      (key) => hint.includes(key)
    )
  );
}

function hasSyntheticElectronicSignals(audioFeatures: AudioFeatures): boolean {
  const { textureHints, instrumentation } = audioFeatures.semanticProfile;
  return (
    textureHints.some((hint) =>
      ["synthetic", "glassy", "digital", "electronic"].some((key) =>
        hint.includes(key)
      )
    ) ||
    instrumentation.some((hint) =>
      ["electronic", "synth", "sub-bass"].some((key) => hint.includes(key))
    )
  );
}

function hasIrregularRhythm(audioFeatures: AudioFeatures): boolean {
  const rhythm = audioFeatures.visualDna.motionRhythm;
  return rhythm === "staggered" || rhythm === "stop-start" || rhythm === "burst";
}

function phraseCadenceVariation(audioFeatures: AudioFeatures): number {
  const { phraseCadence, repetitionScore, beatConsistency, rmsVariance } =
    audioFeatures.analysisSignals;

  return clamp01(
    phraseCadence * 0.4 +
      (1 - repetitionScore) * 0.28 +
      (1 - beatConsistency) * 0.2 +
      rmsVariance * 0.12
  );
}

function rhythmIrregularity(audioFeatures: AudioFeatures): number {
  const { beatConsistency, onsetClustering, fluxVariance } =
    audioFeatures.analysisSignals;

  return clamp01(
    (1 - beatConsistency) * 0.45 + onsetClustering * 0.35 + fluxVariance * 0.2
  );
}

function isPreciseRepetitive(audioFeatures: AudioFeatures): boolean {
  const { beatConsistency, repetitionScore, harmonicStability } =
    audioFeatures.analysisSignals;

  return (
    beatConsistency > 0.6 &&
    repetitionScore > 0.52 &&
    harmonicStability > 0.52
  );
}

function expressiveTimingScore(audioFeatures: AudioFeatures): number {
  const { rmsVariance, centroidVariance } = audioFeatures.analysisSignals;

  return clamp01(
    phraseCadenceVariation(audioFeatures) * 0.42 +
      rhythmIrregularity(audioFeatures) * 0.33 +
      rmsVariance * 0.15 +
      centroidVariance * 0.1
  );
}

function physicalDisplacementScore(audioFeatures: AudioFeatures): number {
  const { fluxVariance, onsetClustering, beatConsistency } =
    audioFeatures.analysisSignals;
  const { dynamics } = audioFeatures;

  return clamp01(
    fluxVariance * 0.34 +
      onsetClustering * 0.28 +
      dynamics * 0.18 +
      (1 - beatConsistency) * 0.2
  );
}

export function computeKineticScore(audioFeatures: AudioFeatures): number {
  const { performanceTexture, motionCharacter, rhythmicPersonality } = audioFeatures;
  const { organic } = audioFeatures.emotionalVector;
  const live = hasLiveInstrumentation(audioFeatures);
  const irregular = hasIrregularRhythm(audioFeatures);
  const synthetic = hasSyntheticElectronicSignals(audioFeatures);
  const precise = isPreciseRepetitive(audioFeatures);

  let kinetic = clamp01(
    motionCharacter.elasticity * 0.35 +
      performanceTexture.humanity * 0.3 +
      motionCharacter.physicality * 0.2 +
      rhythmicPersonality.swing * 0.15
  );

  if (live) {
    kinetic = clamp01(kinetic + 0.08);
  }
  if (irregular) {
    kinetic = clamp01(kinetic + 0.05);
  }
  if (organic > 0.55) {
    kinetic = clamp01(kinetic + organic * 0.06);
  }

  if (precise) {
    kinetic = clamp01(kinetic * 0.5);
  }
  if (synthetic) {
    kinetic = clamp01(kinetic * 0.62);
  }
  if (synthetic && precise) {
    kinetic = clamp01(Math.min(kinetic, 0.35));
  }

  if (
    audioFeatures.analysisSignals.transientSharpness > 0.75 &&
    !live &&
    performanceTexture.humanity < 0.45
  ) {
    kinetic = clamp01(kinetic * 0.82);
  }

  if (
    audioFeatures.analysisSignals.repetitionScore > 0.65 &&
    !live &&
    !irregular
  ) {
    kinetic = clamp01(Math.min(kinetic, 0.4));
  }

  return kinetic;
}

export function isHighKineticAudio(audioFeatures: AudioFeatures): boolean {
  const kineticScore = computeKineticScore(audioFeatures);
  const { organic } = audioFeatures.emotionalVector;
  const { density, brightness } = audioFeatures;
  const live = hasLiveInstrumentation(audioFeatures);
  const irregular = hasIrregularRhythm(audioFeatures);
  const synthetic = hasSyntheticElectronicSignals(audioFeatures);
  const precise = isPreciseRepetitive(audioFeatures);
  const expressive = expressiveTimingScore(audioFeatures);

  // Sparse/dark pulse beds are not high-kinetic performances.
  if (density < 0.22 && brightness < 0.2) {
    return false;
  }

  if (kineticScore < 0.58 || expressive < 0.38) {
    return false;
  }

  if (precise && synthetic && !live) {
    return false;
  }

  if (precise && !live && expressive < 0.52) {
    return false;
  }

  return (
    live ||
    irregular ||
    (organic > 0.5 && !precise && expressive > 0.45)
  );
}

export function paletteContainsNeon(palette: CreativeDirection["palette"]): boolean {
  const colors = [palette.background, resolveTextColor(palette)];
  return colors.some((color) =>
    NEON_HEX_PATTERNS.some((pattern) => pattern.test(color.trim()))
  );
}

export function isHighIntensityPalette(audioFeatures: AudioFeatures): boolean {
  return computeAudioIntensity(audioFeatures) > 0.68;
}

function isSubduedWarmColor(h: number, s: number, l: number): boolean {
  return h >= 18 && h <= 55 && s >= 8 && s <= 48 && l >= 62 && l <= 93;
}

export function paletteContainsSubduedWarm(
  palette: CreativeDirection["palette"]
): boolean {
  return [palette.background, resolveTextColor(palette)].some((color) => {
    const { h, s, l } = hexToHsl(color.trim());
    return isSubduedWarmColor(h, s, l);
  });
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const r = parseInt(expanded.slice(0, 2), 16) / 255;
  const g = parseInt(expanded.slice(2, 4), 16) / 255;
  const b = parseInt(expanded.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const light = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(light * 100) };
  }

  const sat =
    light > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    hue = ((b - r) / delta + 2) * 60;
  } else {
    hue = ((r - g) / delta + 4) * 60;
  }

  return {
    h: Math.round(hue),
    s: Math.round(sat * 100),
    l: Math.round(light * 100),
  };
}

function deriveAccentHue(
  warmth: number,
  organic: number,
  tension: number,
  energy: number,
  highIntensity: boolean
): number {
  if (highIntensity) {
    if (organic > 0.5 && energy > 0.55) {
      return tension > 0.5 ? 4 : 48;
    }
    if (warmth > 0.5) {
      return 8 + tension * 12;
    }
    return 220;
  }

  if (warmth > 0.6 && energy < 0.5) {
    return 32 + warmth * 10;
  }
  if (warmth > 0.5) {
    return 18 + warmth * 8;
  }
  if (organic > 0.55) {
    return 145 + organic * 20;
  }
  return 210 + tension * 25;
}

export function derivePaletteFromAudio(
  audioFeatures: AudioFeatures
): CreativeDirection["palette"] {
  return derivePaletteFromEngine(audioFeatures);
}

export function applyFontStylingModifier(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  _audioFeatures: AudioFeatures
): VisualLanguage {
  const identity = font.visualIdentity;
  const FONT_WEIGHT = 0.05;

  let geometry = visualLanguage.geometry;
  if (identity.some((tag) => tag.includes("pixel") || tag.includes("modular"))) {
    geometry = FONT_WEIGHT >= 0.05 ? "modular" : visualLanguage.geometry;
  } else if (identity.some((tag) => tag.includes("angular") || tag.includes("monospaced"))) {
    geometry = "rectilinear";
  } else if (identity.some((tag) => tag.includes("calligraphic") || tag.includes("ornamental"))) {
    geometry = "calligraphic";
  }

  let edgeTreatment = visualLanguage.edgeTreatment;
  if (font.structure.sharpness >= 4) {
    edgeTreatment =
      visualLanguage.edgeTreatment === "feathered" ? "soft" : "hard";
  } else if (font.structure.roundness >= 4) {
    edgeTreatment = "soft";
  }

  let spacing = visualLanguage.spacing;
  if (font.structure.density >= 4) {
    spacing = "tight";
  } else if (font.structure.density <= 2) {
    spacing = "loose";
  }

  let texture = visualLanguage.texture;
  if (identity.some((tag) => tag.includes("pixel") || tag.includes("grid"))) {
    if (texture === "smooth" && _audioFeatures.motionCharacter.fragmentation > 0.65) {
      texture = "grain";
    }
  } else if (font.structure.sharpness >= 4 && texture === "smooth") {
    texture = "grain";
  }

  return {
    ...visualLanguage,
    geometry,
    edgeTreatment,
    spacing,
    texture,
    motionCharacter: visualLanguage.motionCharacter,
    depth: visualLanguage.depth,
    composition: visualLanguage.composition,
    symmetry: visualLanguage.symmetry,
  };
}

const CYBER_TEXTURE_PATTERN = /digital-noise|chromatic/i;

function paletteIsNearGrayscale(palette: CreativeDirection["palette"]): boolean {
  return [palette.background, resolveTextColor(palette)].every((hex) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return false;
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) < 18;
  });
}

export function stripFontLeaksFromDirection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  font: FontMetadata
): CreativeDirection {
  const futuristic = isStronglyFuturisticSynthetic(audioFeatures);
  const warmOrganic = isWarmOrganic(audioFeatures);
  let next = { ...direction };

  const technicalFont = font.visualIdentity.some((tag) =>
    ["pixel", "modular", "monospaced", "digital", "technical"].some((key) =>
      tag.includes(key)
    )
  );

  if (technicalFont && !futuristic) {
    if (paletteContainsNeon(next.palette)) {
      next = {
        ...next,
        palette: derivePaletteFromAudio(audioFeatures),
      };
    }

    if (next.visualLanguage.texture === "digital-noise") {
      next = {
        ...next,
        visualLanguage: {
          ...next.visualLanguage,
          texture: warmOrganic ? "grain" : "smooth",
        },
      };
    }

    if (
      technicalFont &&
      !futuristic &&
      next.motionLanguage.material === "mechanical" &&
      warmOrganic
    ) {
      next = {
        ...next,
        motionLanguage: {
          ...next.motionLanguage,
          material: "elastic",
          timing: "irregular",
          deformation: "stretch",
        },
        visualLanguage: {
          ...next.visualLanguage,
          motionCharacter: "kinetic",
        },
      };
    }
  }

  if (
    CYBER_TEXTURE_PATTERN.test(next.visualLanguage.texture) &&
    !futuristic
  ) {
    next = {
      ...next,
      visualLanguage: {
        ...next.visualLanguage,
        texture: "grain",
      },
    };
  }

  if (
    next.visualLanguage.motionCharacter === "mechanical" &&
    isHighKineticAudio(audioFeatures)
  ) {
    next = {
      ...next,
      visualLanguage: {
        ...next.visualLanguage,
        motionCharacter: "kinetic",
      },
    };
  }

  return next;
}

export function validateFontLeakage(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  font: FontMetadata
): string[] {
  const errors: string[] = [];
  const futuristic = isStronglyFuturisticSynthetic(audioFeatures);
  const technicalFont = font.visualIdentity.some((tag) =>
    ["pixel", "modular", "digital", "bitcount", "lekton"].some((key) =>
      tag.toLowerCase().includes(key)
    )
  );

  if (technicalFont && !futuristic && paletteContainsNeon(direction.palette)) {
    errors.push("technical font leaked neon/cyber palette — palette must come from audio");
  }

  if (
    technicalFont &&
    !futuristic &&
    direction.motionLanguage.material === "mechanical" &&
    isWarmOrganic(audioFeatures)
  ) {
    errors.push("technical font leaked mechanical motion on warm/organic audio");
  }

  if (
    direction.visualLanguage.texture === "digital-noise" &&
    !futuristic &&
    audioFeatures.songCharacter.texture === "clean"
  ) {
    errors.push("font/audio mismatch: digital-noise texture without synthetic audio support");
  }

  return errors;
}

export function validateCreativeInterpretation(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): string[] {
  const errors: string[] = [];

  if (
    direction.visualLanguage.texture === "digital-noise" &&
    !isStronglyFuturisticSynthetic(audioFeatures)
  ) {
    errors.push(
      "digital-noise texture without strong futuristic/synthetic audio support"
    );
  }

  if (
    isHighIntensityAudio(audioFeatures) &&
    (direction.motionLanguage.force === "subtle" ||
      (direction.motionLanguage.material === "fluid" &&
        direction.motionLanguage.deformation === "none"))
  ) {
    errors.push("high-intensity audio paired with very subdued motion force — consider controlled force only");
  }

  return errors;
}

export function applyAudioMotionCorrections(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): CreativeDirection {
  const intensity = computeAudioIntensity(audioFeatures);
  if (intensity < 0.55) {
    return direction;
  }

  let motion = { ...direction.motionLanguage };

  if (motion.force === "subtle") {
    motion = {
      ...motion,
      force: intensity > 0.78 ? "controlled" : motion.force,
    };
  }

  return {
    ...direction,
    motionLanguage: motion,
  };
}

export function refineCreativeDirection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata
): CreativeDirection {
  const font = getFontMetadata(selectedFont.name);
  const next = stripFontLeaksFromDirection(
    {
      ...direction,
      palette: derivePaletteFromSongCharacter(audioFeatures.songCharacter, audioFeatures),
      visualLanguage: applyFontStylingModifier(direction.visualLanguage, font, audioFeatures),
    },
    audioFeatures,
    font
  );

  return applyAudioMotionCorrections(next, audioFeatures);
}
