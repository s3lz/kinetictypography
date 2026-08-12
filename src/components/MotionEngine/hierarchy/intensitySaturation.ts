/**
 * Intensity saturation — different properties grow at different rates.
 * Position can travel far; rotation / skew / opacity stay subtle.
 *
 * Increasing intensity should feel like more tension, weight, and
 * responsiveness — not proportional scaling of every property.
 */

export interface SaturatedAmplitudes {
  /** Position multiplier (maps toward ~50px feel at full intensity). */
  position: number;
  /** Rotation multiplier (maps toward ~4° at full intensity). */
  rotation: number;
  /** Scale deviation from 1 (maps toward ~0.08 at full intensity). */
  scale: number;
  /** Skew multiplier (maps toward ~1.5° at full intensity). */
  skew: number;
  /** Opacity deviation from 1 (maps toward ~0.08 at full intensity). */
  opacity: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Ease that rises quickly then softens — physical energy without runaway. */
function tensionCurve(level: number): number {
  const t = clamp01(level);
  return t * (2 - t);
}

/**
 * Map 0–1 intensity into per-property multipliers relative to a motion's
 * authored base amplitudes.
 */
export function saturateIntensity(level: number): SaturatedAmplitudes {
  const t = tensionCurve(level);
  const soft = t * t * (3 - 2 * t);

  return {
    position: 0.35 + t * 0.65,
    rotation: 0.45 + soft * 0.4,
    scale: 0.5 + soft * 0.5,
    skew: 0.4 + soft * 0.35,
    opacity: 0.55 + soft * 0.35,
  };
}

/**
 * Final post-compose glyph budget. Enforced after all glyph contributors
 * are summed — not before — so competing overlays cannot exceed this.
 */
export const GLYPH_BUDGET = {
  maxPosition: 3,
  maxRotation: 1.25,
  maxScaleDelta: 0.02,
  maxSkew: 0.6,
} as const;

/** Hard ceilings so glyph-/word-level motion stays readable. */
export const INTENSITY_CAPS = {
  word: {
    position: 50,
    rotation: 4,
    scaleDelta: 0.08,
    skew: 1.5,
    opacityDelta: 0.08,
  },
  /** Intermediate split cap; final local uses GLYPH_BUDGET after compose. */
  glyph: {
    position: GLYPH_BUDGET.maxPosition,
    rotation: GLYPH_BUDGET.maxRotation,
    scaleDelta: GLYPH_BUDGET.maxScaleDelta,
    skew: GLYPH_BUDGET.maxSkew,
    opacityDelta: 0.04,
  },
  /** Surface only — must not compete with locomotion. */
  material: {
    position: 0.5,
    rotation: 0,
    scaleDelta: 0.012,
    skew: 1.2,
    opacityDelta: 0.06,
  },
  line: {
    position: 18,
    rotation: 2,
    scaleDelta: 0.04,
    skew: 0.8,
    opacityDelta: 0.03,
  },
} as const;

/**
 * Constant life multipliers for glyph variation — intensity must not grow
 * glyph position/rotation. Word/line still use saturateIntensity(level).
 */
export const GLYPH_LIFE_SATURATION: SaturatedAmplitudes = {
  position: 0.55,
  rotation: 0.55,
  scale: 0.5,
  skew: 0.45,
  opacity: 0.6,
};
