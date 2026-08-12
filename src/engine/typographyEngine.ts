import { computeSongUniquenessVector } from "@/lib/songUniquenessVector";
import type { AudioFeatures } from "@/types/audio";
import type {
  LayoutConfig,
  OpacityBehavior,
  TypographyConfig,
  VisualLanguage,
  WeightBehavior,
} from "@/types/designBrief";
import type { FontMetadata } from "@/types/fontMetadata";
import type { FontTreatment } from "@/types/creativeInterpretation";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Stable -1…1 offset from song identity so mid songs don’t clone. */
function songTypographySalt(audioFeatures: AudioFeatures): number {
  const key = computeSongUniquenessVector(audioFeatures).differentiationKey;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return (hash % 2001) / 1000 - 1;
}

function resolveTracking(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  audioFeatures: AudioFeatures,
  layout: LayoutConfig,
  salt: number
): number {
  const spacing = visualLanguage.spacing.toLowerCase();
  const sc = audioFeatures.songCharacter;
  const { density, dynamics } = audioFeatures;
  const fontDensity = font.structure.density / 5;

  let tracking = 0.4 + salt * 1.8;

  // Song character — primary variety driver.
  switch (sc.energyType) {
    case "floating":
      tracking += 3.2;
      break;
    case "subdued":
      tracking += 1.6;
      break;
    case "controlled":
      tracking -= 0.4;
      break;
    case "restless":
      tracking -= 2.8;
      break;
    case "surging":
      tracking -= 3.4;
      break;
  }

  switch (sc.performanceStyle) {
    case "atmospheric":
    case "intimate":
      tracking += 2.2;
      break;
    case "live_band":
      tracking -= 1.2;
      break;
    case "synthetic":
    case "mechanical":
      tracking -= 0.6;
      break;
  }

  if (sc.rhythmFeel === "staccato") tracking -= 1.4;
  if (sc.rhythmFeel === "slow" || sc.rhythmFeel === "loose") tracking += 1.1;
  if (sc.rhythmFeel === "grid" || sc.rhythmFeel === "precise") tracking -= 0.5;

  // Audio continuous signals.
  tracking += (1 - density) * 3.5;
  tracking -= dynamics * 1.8;
  tracking -= fontDensity * 2.2;

  if (layout.textDensity === "sparse") tracking += 1.8;
  if (layout.textDensity === "dense") tracking -= 1.6;
  tracking += layout.negativeSpace * 2.4;

  // Visual-language keywords still apply as accents.
  if (spacing.includes("tight") || spacing.includes("compress")) tracking -= 2.2;
  if (spacing.includes("loose") || spacing.includes("expand")) tracking += 2.8;
  if (visualLanguage.composition.includes("poster")) tracking += 1.2;

  return round1(clamp(tracking, -6.5, 8.5));
}

function resolveKerningBias(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  audioFeatures: AudioFeatures,
  salt: number
): number {
  const sc = audioFeatures.songCharacter;
  const { tension, organic } = audioFeatures.emotionalVector;
  const irregularity = audioFeatures.rhythmicPersonality.irregularity;
  const symmetry = visualLanguage.symmetry.toLowerCase();

  let bias =
    font.structure.strokeContrast * 0.35 +
    salt * 1.4 +
    irregularity * 2.2 +
    tension * 1.1 -
    organic * 0.6;

  switch (sc.texture) {
    case "raw":
    case "grainy":
      bias += 1.3;
      break;
    case "dissolved":
      bias += 0.9;
      break;
    case "smooth":
    case "clean":
      bias -= 0.8;
      break;
  }

  if (sc.energyType === "restless" || sc.energyType === "surging") bias += 0.9;
  if (sc.energyType === "floating" || sc.energyType === "subdued") bias -= 0.5;
  if (sc.rhythmFeel === "staccato" || sc.rhythmFeel === "loose") bias += 0.8;
  if (sc.rhythmFeel === "precise" || sc.rhythmFeel === "grid") bias -= 0.7;

  if (symmetry.includes("asymmetric")) bias += 1.4;
  if (visualLanguage.motionCharacter.includes("fragment")) bias += 1.1;
  if (visualLanguage.edgeTreatment.includes("hard")) bias += 0.6;

  return round1(clamp(bias, -2.5, 5.5));
}

function resolveFontSize(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  layout: LayoutConfig,
  audioFeatures: AudioFeatures,
  salt: number
): number {
  let size = 52 + salt * 8;

  if (visualLanguage.composition.includes("oversized") || layout.textDensity === "sparse") {
    size += 18;
  }
  if (visualLanguage.composition.includes("compress") || layout.textDensity === "dense") {
    size -= 12;
  }

  switch (audioFeatures.songCharacter.energyType) {
    case "surging":
    case "restless":
      size += 10;
      break;
    case "floating":
    case "subdued":
      size -= 4;
      break;
  }

  size += font.energy * 2.5;
  size += audioFeatures.energy * 14;
  size -= layout.negativeSpace * 8;

  if (font.structure.complexity >= 4) size -= 4;

  return Math.round(clamp(size, 28, 112));
}

function resolveFontWeight(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  audioFeatures: AudioFeatures,
  salt: number
): number {
  const { tension, energy, warmth } = audioFeatures.emotionalVector;
  const sc = audioFeatures.songCharacter;
  const edge = visualLanguage.edgeTreatment.toLowerCase();
  const visualWeight = audioFeatures.visualDna.visualWeight;

  // Continuous score → discrete weight stops for real variety.
  let score =
    energy * 0.35 +
    tension * 0.3 +
    (1 - warmth) * 0.1 +
    font.structure.density * 0.06 +
    salt * 0.12;

  if (sc.energyType === "surging" || sc.energyType === "restless") score += 0.18;
  if (sc.energyType === "floating" || sc.energyType === "subdued") score -= 0.16;
  if (sc.performanceStyle === "intimate" || sc.performanceStyle === "atmospheric") {
    score -= 0.12;
  }
  if (sc.performanceStyle === "live_band") score += 0.1;
  if (visualWeight === "heavy") score += 0.14;
  if (visualWeight === "airy") score -= 0.12;
  if (edge.includes("hard")) score += 0.1;
  if (font.structure.roundness >= 4) score -= 0.1;

  if (score >= 0.72) return 700;
  if (score >= 0.58) return 600;
  if (score >= 0.42) return 500;
  if (score >= 0.28) return 400;
  return 300;
}

function resolveOpacityBehavior(
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures
): OpacityBehavior {
  if (
    visualLanguage.motionCharacter.includes("pulse") ||
    visualLanguage.motionCharacter.includes("breath")
  ) {
    return "pulse";
  }
  if (visualLanguage.depth.includes("layer") || audioFeatures.dynamics > 0.65) {
    return "fade-edges";
  }
  return "constant";
}

function resolveWeightBehavior(audioFeatures: AudioFeatures): WeightBehavior {
  return audioFeatures.dynamics > 0.6 ? "emphasis-peaks" : "constant";
}

function resolveRotationAllowance(
  visualLanguage: VisualLanguage,
  font: FontMetadata,
  audioFeatures: AudioFeatures,
  salt: number
): number {
  let allowance = font.structure.sharpness * 0.35 + salt * 1.2;

  if (visualLanguage.geometry.includes("angular")) allowance += 2.5;
  if (visualLanguage.motionCharacter.includes("fragment")) allowance += 3;
  if (visualLanguage.symmetry.includes("asymmetric")) allowance += 1.5;
  if (visualLanguage.edgeTreatment.includes("hard")) allowance += 0.5;
  if (
    audioFeatures.songCharacter.energyType === "restless" ||
    audioFeatures.songCharacter.rhythmFeel === "staccato"
  ) {
    allowance += 1.4;
  }

  return clamp(allowance, 0, 8);
}

function resolveScaleCurve(
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures
): number {
  let curve = 1;

  if (visualLanguage.composition.includes("oversized")) curve += 0.12;
  if (visualLanguage.composition.includes("compress")) curve -= 0.08;
  curve += audioFeatures.emotionalVector.tension * 0.1;
  curve += fontExperimentalBias(visualLanguage) * 0.05;

  return clamp(curve, 0.85, 1.25);
}

function fontExperimentalBias(visualLanguage: VisualLanguage): number {
  if (visualLanguage.texture.includes("noise")) return 0.8;
  if (visualLanguage.motionCharacter.includes("fragment")) return 0.6;
  return 0.2;
}

export function computeTypography(
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures,
  font: FontMetadata,
  layout: LayoutConfig,
  fontTreatment?: FontTreatment
): TypographyConfig {
  const salt = songTypographySalt(audioFeatures);

  let fontSize = resolveFontSize(visualLanguage, font, layout, audioFeatures, salt);
  let tracking = resolveTracking(visualLanguage, font, audioFeatures, layout, salt);
  let kerningBias = resolveKerningBias(visualLanguage, font, audioFeatures, salt);
  let rotationAllowance = resolveRotationAllowance(
    visualLanguage,
    font,
    audioFeatures,
    salt
  );

  // Font as material — treatment guides deformation/spacing, not mood.
  if (fontTreatment) {
    const spacing = fontTreatment.spacing.toLowerCase();
    const deformation = fontTreatment.deformation.toLowerCase();
    const contrast = fontTreatment.contrast.toLowerCase();

    if (spacing.includes("gap") || spacing.includes("open") || spacing.includes("loose")) {
      tracking += 1.2;
    }
    if (spacing.includes("dense") || spacing.includes("tight") || spacing.includes("intact")) {
      tracking -= 1.0;
    }
    if (
      deformation.includes("minimal") ||
      deformation.includes("preserve") ||
      deformation.includes("silhouette")
    ) {
      rotationAllowance = clamp(rotationAllowance * 0.45, 0, 3);
    }
    if (deformation.includes("tracking") || deformation.includes("scale")) {
      rotationAllowance = clamp(rotationAllowance * 0.7, 0, 4);
    }
    if (contrast.includes("silhouette") || contrast.includes("readable")) {
      kerningBias = clamp(kerningBias * 0.85, -2.5, 5);
    }
  }

  return {
    tracking: round1(clamp(tracking, -6.5, 8.5)),
    kerningBias: round1(clamp(kerningBias, -2.5, 5.5)),
    lineHeight: layout.lineHeight,
    scaleCurve: resolveScaleCurve(visualLanguage, audioFeatures),
    rotationAllowance,
    opacityBehavior: resolveOpacityBehavior(visualLanguage, audioFeatures),
    weightBehavior: resolveWeightBehavior(audioFeatures),
    scaleBehavior: layout.scaleProgression,
    fontWeight: resolveFontWeight(visualLanguage, font, audioFeatures, salt),
    fontSize,
  };
}
