import type { CharTransform } from "../types";
import { IDENTITY_TRANSFORM } from "../types";
import {
  GLYPH_BUDGET,
  GLYPH_LIFE_SATURATION,
  INTENSITY_CAPS,
  saturateIntensity,
  type SaturatedAmplitudes,
} from "./intensitySaturation";

export type HierarchyLayer = "word" | "line" | "glyph" | "material";

export function addTransforms(a: CharTransform, b: CharTransform): CharTransform {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    rotation: a.rotation + b.rotation,
    skewX: a.skewX + b.skewX,
    scale: a.scale + (b.scale - 1),
    opacity: a.opacity + (b.opacity - 1),
  };
}

export function subtractTransforms(a: CharTransform, b: CharTransform): CharTransform {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    rotation: a.rotation - b.rotation,
    skewX: a.skewX - b.skewX,
    scale: 1 + (a.scale - b.scale),
    opacity: 1 + (a.opacity - b.opacity),
  };
}

export function scaleTransform(transform: CharTransform, weight: number): CharTransform {
  return {
    x: transform.x * weight,
    y: transform.y * weight,
    rotation: transform.rotation * weight,
    skewX: transform.skewX * weight,
    scale: 1 + (transform.scale - 1) * weight,
    opacity: 1 + (transform.opacity - 1) * weight,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applySaturation(
  transform: CharTransform,
  sat: SaturatedAmplitudes
): CharTransform {
  return {
    x: transform.x * sat.position,
    y: transform.y * sat.position,
    rotation: transform.rotation * sat.rotation,
    skewX: transform.skewX * sat.skew,
    scale: 1 + (transform.scale - 1) * sat.scale,
    opacity: 1 + (transform.opacity - 1) * sat.opacity,
  };
}

export function clampLayer(
  transform: CharTransform,
  layer: HierarchyLayer
): CharTransform {
  const caps = INTENSITY_CAPS[layer];
  return {
    x: clamp(transform.x, -caps.position, caps.position),
    y: clamp(transform.y, -caps.position, caps.position),
    rotation: clamp(transform.rotation, -caps.rotation, caps.rotation),
    skewX: clamp(transform.skewX, -caps.skew, caps.skew),
    scale: clamp(transform.scale, 1 - caps.scaleDelta, 1 + caps.scaleDelta),
    opacity: clamp(transform.opacity, 1 - caps.opacityDelta, 1),
  };
}

/**
 * Split a raw motion sample into word-shared motion and glyph variation.
 *
 * wordAmplitude = base * cohesion  (grows with intensity)
 * glyphAmplitude = delta(lifeLevel) * (1 - cohesion)  (constant life)
 *
 * Pass optional `wordAtLife` when glyph/word life samples are taken at a
 * fixed level so intensity does not enlarge glyph deltas.
 */
export function splitWordAndGlyph(
  wordSample: CharTransform,
  glyphSample: CharTransform,
  cohesion: number,
  level: number,
  wordAtLife?: CharTransform
): { word: CharTransform; glyph: CharTransform } {
  const wordSat = saturateIntensity(level);
  const c = clamp(cohesion, 0, 1);
  const glyphWeight = 1 - c;

  const shared = applySaturation(wordSample, wordSat);
  const lifeBasis = wordAtLife ?? wordSample;
  const delta = subtractTransforms(glyphSample, lifeBasis);
  // Intensity grows word locomotion only — glyph life stays nearly constant.
  const lifeDelta = applySaturation(delta, GLYPH_LIFE_SATURATION);

  return {
    word: clampLayer(scaleTransform(shared, c), "word"),
    glyph: clampLayer(scaleTransform(lifeDelta, glyphWeight), "glyph"),
  };
}

/**
 * Final glyph clamp after all contributors are composed.
 * Enforces GLYPH_BUDGET regardless of how many systems fed the glyph.
 */
export function clampGlyphMotion(transform: CharTransform): CharTransform {
  return {
    x: clamp(transform.x, -GLYPH_BUDGET.maxPosition, GLYPH_BUDGET.maxPosition),
    y: clamp(transform.y, -GLYPH_BUDGET.maxPosition, GLYPH_BUDGET.maxPosition),
    rotation: clamp(
      transform.rotation,
      -GLYPH_BUDGET.maxRotation,
      GLYPH_BUDGET.maxRotation
    ),
    skewX: clamp(transform.skewX, -GLYPH_BUDGET.maxSkew, GLYPH_BUDGET.maxSkew),
    scale: clamp(
      transform.scale,
      1 - GLYPH_BUDGET.maxScaleDelta,
      1 + GLYPH_BUDGET.maxScaleDelta
    ),
    opacity: transform.opacity,
  };
}

/**
 * Grammar / personality overlays on glyphs: keep surface life
 * (scale, opacity, mild skew) and kill locomotion / rotation so they
 * cannot compete with word motion or induce jitter.
 */
export function glyphOverlayLifeOnly(transform: CharTransform): CharTransform {
  const skewX = Number.isFinite(transform.skewX) ? transform.skewX * 0.25 : 0;
  const scale = Number.isFinite(transform.scale)
    ? 1 + (transform.scale - 1) * 0.35
    : 1;
  return {
    x: 0,
    y: 0,
    rotation: 0,
    skewX,
    scale,
    opacity: Number.isFinite(transform.opacity) ? transform.opacity : 1,
  };
}

export function prepareMaterialLayer(
  material: CharTransform,
  level: number
): CharTransform {
  if (level <= 0) return IDENTITY_TRANSFORM;
  const sat = saturateIntensity(level);
  // Surface behavior only — opacity / skew / tiny distortion; no rotation locomotion.
  const surface: CharTransform = {
    x: material.x * 0.2,
    y: material.y * 0.2,
    rotation: 0,
    skewX: material.skewX,
    scale: material.scale,
    opacity: material.opacity,
  };
  // Position must not grow with intensity; keep ≤ 0.5px via material caps.
  const textured = applySaturation(surface, {
    position: 0.45,
    rotation: 0,
    scale: sat.scale,
    skew: sat.skew,
    opacity: sat.opacity,
  });
  return clampLayer(textured, "material");
}

export function prepareLineLayer(
  lineSample: CharTransform,
  cohesion: number,
  level: number
): CharTransform {
  if (level <= 0) return IDENTITY_TRANSFORM;
  const sat = saturateIntensity(level);
  // Line contributes a quiet shared breathe under word motion.
  const weight = 0.18 * clamp(cohesion, 0, 1);
  return clampLayer(scaleTransform(applySaturation(lineSample, sat), weight), "line");
}

export function composeHierarchy(layers: {
  word: CharTransform;
  line?: CharTransform;
  glyph: CharTransform;
  material?: CharTransform;
}): CharTransform {
  let composed = IDENTITY_TRANSFORM;
  composed = addTransforms(composed, layers.word);
  if (layers.line) composed = addTransforms(composed, layers.line);
  composed = addTransforms(composed, layers.glyph);
  if (layers.material) composed = addTransforms(composed, layers.material);
  return composed;
}
