import type {
  FontPhysics,
  PhysicalModel,
  TypographyBehavior,
} from "@/types/physicalIdentity";
import {
  DEFAULT_FONT_PHYSICS,
  DEFAULT_PHYSICAL_MODEL,
  DEFAULT_TYPOGRAPHY_BEHAVIOR,
} from "@/types/physicalIdentity";
import type { CharTransform } from "./types";
import { IDENTITY_TRANSFORM } from "./types";

/**
 * Post-compose word modulation from compiled physical identity.
 * Makes fragile/fracture vs fluid/flow read as different objects without new primitives.
 */
export function applyPhysicalIdentityToWord(
  word: CharTransform,
  time: number,
  physical: PhysicalModel = DEFAULT_PHYSICAL_MODEL,
  typography: TypographyBehavior = DEFAULT_TYPOGRAPHY_BEHAVIOR,
  fontPhysics: FontPhysics = DEFAULT_FONT_PHYSICS
): CharTransform {
  const cycle =
    physical.recovery === "snap"
      ? 1.6
      : physical.material === "fluid"
        ? 4.8
        : 2.8;
  const phase = (time / cycle) % 1;

  let scale = word.scale;
  let x = word.x;
  let y = word.y;
  let rotation = word.rotation;

  // Spacing / silhouette as scale breathing (word-level stand-in for tracking)
  if (typography.spacingBehavior === "unstable" || physical.deformation === "fracture") {
    const burst = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
    const recover =
      physical.recovery === "snap"
        ? Math.exp(-Math.max(0, phase - 0.18) * 14)
        : Math.exp(-Math.max(0, phase - 0.18) * 4);
    const open =
      burst * (0.06 + physical.fragmentation * 0.1) * (1 - fontPhysics.silhouetteStrength * 0.35);
    scale *= 1 + open * recover;
    x += burst * physical.fragmentation * 4 * recover;
  } else if (
    typography.spacingBehavior === "expand" ||
    physical.deformation === "flow" ||
    typography.wordBehavior === "flow"
  ) {
    const drift = Math.sin(time * 0.55) * 0.5 + 0.5;
    scale *= 1 + drift * (0.035 + (1 - physical.resistance) * 0.04);
    y += Math.sin(time * 0.7) * (2.5 + physical.tension * 3);
    x += Math.sin(time * 0.35 + 0.4) * (1.2 + (1 - physical.resistance) * 2);
  } else if (typography.wordBehavior === "contract" || physical.deformation === "compress") {
    const squeeze = 0.5 + 0.5 * Math.sin(time * (physical.recovery === "snap" ? 2.2 : 1.1));
    scale *= 1 - squeeze * fontPhysics.compressionTolerance * 0.9;
  } else if (typography.wordBehavior === "expand") {
    const swell = 0.5 + 0.5 * Math.sin(time * 1.1);
    scale *= 1 + swell * Math.min(fontPhysics.maxStretch, 0.12);
  }

  // Recovery character on rotation settle
  if (physical.recovery === "snap") {
    const kick = Math.exp(-(phase % 1) * 8) * Math.sin(phase * Math.PI * 6);
    rotation += kick * Math.min(fontPhysics.maxRotation, 2.2) * physical.tension;
  } else if (physical.material === "fluid") {
    rotation *= 0.55;
    rotation += Math.sin(time * 0.4) * 0.35;
  }

  // Cap stretch by font physics
  const maxScaleUp = 1 + fontPhysics.maxStretch;
  const maxScaleDown = 1 - fontPhysics.compressionTolerance;
  scale = Math.min(maxScaleUp, Math.max(maxScaleDown, scale));
  rotation = Math.max(
    -fontPhysics.maxRotation,
    Math.min(fontPhysics.maxRotation, rotation)
  );

  return { ...word, x, y, scale, rotation };
}

/**
 * Glyph-local modulation — fragment scatter vs fluid breathe (life-scale only).
 */
export function applyPhysicalIdentityToGlyph(
  glyph: CharTransform,
  time: number,
  charInGroup: number,
  groupSize: number,
  physical: PhysicalModel = DEFAULT_PHYSICAL_MODEL,
  typography: TypographyBehavior = DEFAULT_TYPOGRAPHY_BEHAVIOR,
  fontPhysics: FontPhysics = DEFAULT_FONT_PHYSICS
): CharTransform {
  if (glyph === IDENTITY_TRANSFORM && physical.fragmentation < 0.2) {
    // Still allow slight fluid life
    if (physical.material !== "fluid" && typography.glyphBehavior === "stable") {
      return glyph;
    }
  }

  const u = groupSize <= 1 ? 0 : (charInGroup / Math.max(1, groupSize - 1)) * 2 - 1;
  let x = glyph.x;
  let y = glyph.y;
  let scale = glyph.scale;
  let skewX = glyph.skewX;
  let rotation = glyph.rotation;

  if (
    typography.glyphBehavior === "fragment" ||
    (physical.deformation === "fracture" && physical.fragmentation > 0.4)
  ) {
    const cycle = physical.recovery === "snap" ? 1.6 : 2.4;
    const phase = (time / cycle) % 1;
    const burst = phase < 0.2 ? Math.sin((phase / 0.2) * Math.PI) : 0;
    const recover =
      physical.recovery === "snap"
        ? Math.exp(-Math.max(0, phase - 0.2) * 12)
        : Math.exp(-Math.max(0, phase - 0.2) * 3.5);
    const spread =
      Math.min(physical.fragmentation, fontPhysics.fragmentationTolerance) *
      burst *
      recover *
      (1 - fontPhysics.silhouetteStrength * 0.4);
    x += u * spread * 3.2;
    y += (u * u - 0.3) * spread * 1.4;
    skewX += u * spread * 0.8;
  } else if (
    physical.material === "fluid" ||
    typography.glyphBehavior === "breathe" ||
    physical.deformation === "flow"
  ) {
    const breathe = Math.sin(time * 0.65 + charInGroup * 0.15) * 0.5 + 0.5;
    scale *= 1 + breathe * 0.012;
    y += Math.sin(time * 0.5 + charInGroup * 0.2) * 0.35;
    rotation *= 0.7;
  } else if (typography.glyphBehavior === "jitter") {
    const j = Math.sin(time * 6.5 + charInGroup * 1.7) * 0.2;
    x += j;
    y += Math.cos(time * 7.5 + charInGroup) * 0.16;
  } else if (typography.glyphBehavior === "distort") {
    skewX += Math.sin(time * 1.4 + charInGroup * 0.3) * 0.45;
  }

  rotation = Math.max(
    -fontPhysics.maxRotation * 0.35,
    Math.min(fontPhysics.maxRotation * 0.35, rotation)
  );

  return { ...glyph, x, y, scale, skewX, rotation };
}
