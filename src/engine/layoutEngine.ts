import type { AudioFeatures } from "@/types/audio";
import type {
  CompositionDirection,
  LayoutConfig,
  ScaleBehavior,
  TextAlignment,
  TextDensity,
  VisualLanguage,
} from "@/types/designBrief";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeAlignment(value: string | undefined): TextAlignment {
  const key = (value ?? "center").toLowerCase();
  if (key === "left" || key.startsWith("left")) return "left";
  if (key === "right" || key.startsWith("right")) return "right";
  return "center";
}

function normalizeDensity(value: string | undefined): TextDensity {
  const key = (value ?? "balanced").toLowerCase();
  if (key.includes("sparse")) return "sparse";
  if (key.includes("dense") || key.includes("compressed")) return "dense";
  return "balanced";
}

function resolveScaleProgression(
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures
): ScaleBehavior {
  const tension = audioFeatures.emotionalVector.tension;
  const energy = audioFeatures.energy;

  if (
    visualLanguage.motionCharacter.includes("fragment") ||
    visualLanguage.composition.includes("compress")
  ) {
    return tension > 0.55 ? "expand-on-tension" : "crescendo";
  }

  if (energy > 0.7) return "crescendo";
  if (energy < 0.35) return "decrescendo";
  return "uniform";
}

function resolveAnchor(
  composition: string,
  alignment: TextAlignment,
  negativeSpace: number
): { anchorX: number; anchorY: number } {
  const key = composition.toLowerCase();

  if (key.includes("bottom") || key.includes("lower")) {
    return { anchorX: 0.5, anchorY: 0.72 };
  }

  if (key.includes("top") || key.includes("upper")) {
    return { anchorX: 0.5, anchorY: 0.28 };
  }

  if (key.includes("column") || key.includes("sidebar")) {
    return {
      anchorX: alignment === "left" ? 0.22 : alignment === "right" ? 0.78 : 0.5,
      anchorY: 0.5,
    };
  }

  if (negativeSpace > 0.75) {
    return { anchorX: 0.5, anchorY: 0.46 };
  }

  return { anchorX: 0.5, anchorY: 0.5 };
}

function resolveMaxTextWidth(
  composition: CompositionDirection,
  visualLanguage: VisualLanguage,
  textLength: number
): number {
  const compositionKey = composition.composition.toLowerCase();
  let width = 0.82;

  if (compositionKey.includes("column")) width = 0.42;
  if (compositionKey.includes("poster") || compositionKey.includes("stacked")) {
    width = 0.68;
  }
  if (compositionKey.includes("wide") || compositionKey.includes("banner")) {
    width = 0.94;
  }

  if (visualLanguage.composition.includes("compress")) width -= 0.12;
  if (composition.textDensity === "sparse") width -= 0.08;
  if (composition.textDensity === "dense") width += 0.06;
  if (textLength > 48) width += 0.08;

  return clamp01(width);
}

function resolveLineHeight(
  visualLanguage: VisualLanguage,
  density: TextDensity
): number {
  const spacing = visualLanguage.spacing.toLowerCase();

  if (spacing.includes("tight") || spacing.includes("compress")) return 0.92;
  if (spacing.includes("loose") || spacing.includes("expand")) return 1.38;
  if (density === "dense") return 1.02;
  if (density === "sparse") return 1.28;
  return 1.14;
}

export function computeLayout(
  composition: CompositionDirection,
  visualLanguage: VisualLanguage,
  audioFeatures: AudioFeatures,
  textLength = 24
): LayoutConfig {
  const alignment = normalizeAlignment(composition.alignment);
  const textDensity = normalizeDensity(composition.textDensity);
  const negativeSpace = clamp01(composition.negativeSpace);
  const { anchorX, anchorY } = resolveAnchor(
    composition.composition,
    alignment,
    negativeSpace
  );

  const marginBase = 0.04 + negativeSpace * 0.14;
  const marginX = marginBase + (alignment === "center" ? 0.02 : 0.06);
  const marginY = marginBase + (textDensity === "sparse" ? 0.08 : 0.03);

  return {
    composition: composition.composition,
    alignment,
    negativeSpace,
    textDensity,
    maxTextWidth: resolveMaxTextWidth(composition, visualLanguage, textLength),
    marginX,
    marginY,
    anchorX,
    anchorY,
    lineHeight: resolveLineHeight(visualLanguage, textDensity),
    scaleProgression: resolveScaleProgression(visualLanguage, audioFeatures),
  };
}
