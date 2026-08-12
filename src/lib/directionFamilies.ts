import type { CreativeDirection } from "@/types/creativeDirection";
import type { PaletteBrief } from "@/types/palette";
import { resolveTextColor } from "@/types/palette";
import type { MotionLanguageBrief } from "@/types/motionLanguage";
import { motionDimensionKey } from "@/types/motionLanguage";

export type PaletteFamily =
  | "mono-accent"
  | "warm-soft"
  | "cool-dark"
  | "neon-cyber"
  | "neutral-light"
  | "high-contrast"
  | "warm-saturated"
  | "nostalgic-film"
  | "print-ink";

export type MotionFamily =
  | "kinetic-elastic"
  | "floating"
  | "mechanical"
  | "fragmented-impact"
  | "locked-steady"
  | "organic-flow";

export type CompositionFamily =
  | "center-column"
  | "edge-anchor"
  | "offset-asymmetric"
  | "poster-stack"
  | "radial-wide"
  | "left-rail";

export type DeformationFamily =
  | "none"
  | "scale-stretch"
  | "rotation"
  | "fragmentation";

export interface SpatialBehaviorSignature {
  compositionFamily: CompositionFamily;
  deformationFamily: DeformationFamily;
  motionBehavior: MotionBehavior;
}

export interface DirectionFamilySignature {
  paletteFamily: PaletteFamily;
  motionFamily: MotionFamily;
  compositionFamily: CompositionFamily;
  deformationFamily: DeformationFamily;
  motionBehavior: MotionBehavior;
}

const NEON_HEX = [/^#0ff$/i, /^#0cf$/i, /^#00ffff$/i, /^#00ccff$/i, /^#33ff00$/i];

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (expanded.length !== 6) return null;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

function isNearGrayscale(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const spread = Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2]);
  return spread < 18;
}

export function classifyPaletteFamily(palette: PaletteBrief): PaletteFamily {
  const textColor = resolveTextColor(palette);
  if (NEON_HEX.some((pattern) => pattern.test(textColor.toLowerCase()))) {
    return "neon-cyber";
  }

  if (palette.strategy === "faded-cinematic" || palette.lightBehavior === "faded-film") {
    return "nostalgic-film";
  }
  if (
    palette.strategy === "complementary-surprise" ||
    palette.strategy === "muted-contrast"
  ) {
    return "high-contrast";
  }
  if (palette.strategy === "monochromatic" || palette.lightBehavior === "flat-graphic") {
    return palette.strategy === "monochromatic" ? "mono-accent" : "neutral-light";
  }
  if (palette.strategy === "light-dark") return "neutral-light";

  const bg = parseHex(palette.background);
  const text = parseHex(textColor);
  if (!bg || !text) return "neutral-light";

  if (bg[0] > 180 && bg[1] > 120 && bg[0] - bg[1] < 40 && bg[2] < 120) {
    return "warm-saturated";
  }

  if (bg[1] > bg[0] && bg[1] > 100 && bg[2] < 120) {
    return "nostalgic-film";
  }

  if (bg[0] > 200 && text[2] < 80 && !isNearGrayscale(textColor)) {
    return "print-ink";
  }

  const bgLight = (bg[0] + bg[1] + bg[2]) / 3 > 170;
  const textLight = (text[0] + text[1] + text[2]) / 3 > 170;

  if (Math.abs((bgLight ? 1 : 0) - (textLight ? 1 : 0)) > 0.6) {
    return isNearGrayscale(palette.background) && isNearGrayscale(textColor)
      ? "mono-accent"
      : "high-contrast";
  }

  if (bg[0] > 200 && bg[1] > 180 && bg[2] > 150) return "warm-soft";
  if ((bg[0] + bg[1] + bg[2]) / 3 < 60) return "cool-dark";

  return "neutral-light";
}

export function classifyMotionFamily(direction: CreativeDirection): MotionFamily {
  const brief = direction.motionLanguage as MotionLanguageBrief;

  if (brief.material === "fluid") return "floating";
  if (brief.material === "elastic") return "kinetic-elastic";
  if (brief.material === "organic") return "organic-flow";
  if (brief.material === "mechanical" || brief.material === "rigid") {
    return brief.timing === "repetitive" ? "mechanical" : "locked-steady";
  }
  if (brief.deformation === "fragmentation" || brief.timing === "staccato") {
    return "fragmented-impact";
  }

  return "organic-flow";
}

export function classifyCompositionFamily(
  direction: CreativeDirection
): CompositionFamily {
  const name = direction.composition.composition.toLowerCase();

  if (name.includes("edge")) return "edge-anchor";
  if (name.includes("offset") || name.includes("asymmetric")) return "offset-asymmetric";
  if (name.includes("poster") || name.includes("stack")) return "poster-stack";
  if (name.includes("radial") || name.includes("burst")) return "radial-wide";
  if (name.includes("left") || name.includes("rail")) return "left-rail";

  return "center-column";
}

export function classifyDeformationFamily(
  brief: MotionLanguageBrief
): DeformationFamily {
  if (brief.deformation === "fragmentation") return "fragmentation";
  if (brief.deformation === "rotation") return "rotation";
  if (brief.deformation === "scale" || brief.deformation === "stretch") {
    return "scale-stretch";
  }
  return "none";
}

export function computeSpatialBehaviorSignature(
  direction: CreativeDirection
): SpatialBehaviorSignature {
  return {
    compositionFamily: classifyCompositionFamily(direction),
    deformationFamily: classifyDeformationFamily(direction.motionLanguage),
    motionBehavior: direction.motionBehavior?.primary ?? "oscillation",
  };
}

export function spatialBehaviorCollides(
  a: SpatialBehaviorSignature,
  b: SpatialBehaviorSignature
): boolean {
  return (
    a.compositionFamily === b.compositionFamily ||
    a.deformationFamily === b.deformationFamily ||
    a.motionBehavior === b.motionBehavior
  );
}

export function computeDirectionFamilies(
  direction: CreativeDirection
): DirectionFamilySignature {
  const spatial = computeSpatialBehaviorSignature(direction);
  return {
    paletteFamily: classifyPaletteFamily(direction.palette),
    motionFamily: classifyMotionFamily(direction),
    compositionFamily: spatial.compositionFamily,
    deformationFamily: spatial.deformationFamily,
    motionBehavior: spatial.motionBehavior,
  };
}

export function motionSignatureKey(brief: MotionLanguageBrief): string {
  return motionDimensionKey(brief);
}

export function familiesNearlyIdentical(
  a: DirectionFamilySignature,
  b: DirectionFamilySignature
): boolean {
  return (
    a.paletteFamily === b.paletteFamily &&
    a.motionFamily === b.motionFamily &&
    a.compositionFamily === b.compositionFamily
  );
}

export function highEnergySpatialCollides(
  a: SpatialBehaviorSignature,
  b: SpatialBehaviorSignature
): boolean {
  return spatialBehaviorCollides(a, b);
}
