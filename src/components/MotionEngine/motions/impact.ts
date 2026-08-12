import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  emptyTransform,
  impactEnvelope,
  motionTime,
  resolveImpactParams,
  seedUnit,
} from "./shared";

/**
 * IMPACT — anticipation / hit / recovery shaped by identity
 * (compression, releaseSpeed, fragmentation, force direction).
 */
export function computeImpactMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const elapsed = motionTime(input);
  const params = resolveImpactParams(input, input.level);
  const layer = input.layer ?? "glyph";
  const seedIndex =
    layer === "glyph" ? input.charIndex : (input.wordCharIndex ?? input.charIndex);

  if (input.charIndex === 0 && layer !== "line") {
    updateMotionMappingDebug(
      "impact",
      sampleMotionMapping(Math.round(input.level * 100), 0, 14, params.hitStrength, params.decay)
    );
  }

  const unit = seedUnit(seedIndex, layer === "glyph" ? input.independence : 0.1);
  const forceDir = params.direction ?? "horizontal";
  const direction = unit > 0.5 ? 1 : -1;
  const release = params.releaseSpeed ?? 0.55;
  const cycleDuration =
    2.2 + (1 - params.hitStrength) * 2.4 + (1 - release) * 1.2 + unit * 0.2;

  const env = impactEnvelope(elapsed, cycleDuration, {
    ...params,
    randomness: layer === "glyph" ? params.randomness : params.randomness * 0.2,
  });

  const frag = params.fragmentationAmount ?? 0;
  const spread = params.shardSpread ?? frag * 0.6;
  const force = params.force ?? params.hitStrength;
  const displacement = 5 + force * 20 + spread * 14;
  const sil = params.silhouettePreservation ?? 0.7;

  const scale =
    1 +
    env.compression * (1 + (params.compressionBeforeImpact ?? 0) * 0.8) +
    env.burst * (0.05 + force * 0.1) * (1 - sil * 0.25);

  const scatter =
    layer === "glyph"
      ? 0.25 + input.independence * 0.35 + frag * 0.55
      : 0.5 + spread * 0.35;

  let x = env.displacement * displacement * scatter;
  let y = env.displacement * displacement * 0.3 * params.decay;

  if (forceDir === "horizontal") {
    x *= direction;
    y *= 0.35;
  } else if (forceDir === "vertical") {
    x *= 0.2 * direction;
    y = env.displacement * displacement * (layer === "glyph" ? scatter : 0.7);
  } else {
    // radial
    x *= direction * (0.7 + spread);
    y *= (unit - 0.5) * 2 * (0.7 + spread);
  }

  // Fracture: push glyphs apart during burst; reform pulls back via lower recovery displacement
  if (layer === "glyph" && frag > 0.35) {
    const charSpread = (unit - 0.5) * spread * 22 * Math.abs(env.burst);
    x += charSpread;
  }

  const maxRot = input.fontPhysics?.maxRotation ?? 4;
  const rotation =
    env.displacement *
    Math.min(maxRot, 1.6 + force * 3.0) *
    direction *
    (layer === "glyph" ? input.independence * 0.5 : 0.4) *
    (1 - sil * 0.3);

  return {
    x,
    y,
    scale,
    rotation,
    skewX: env.burst * frag * 1.2 * direction * (layer === "glyph" ? 0.6 : 0.25),
    opacity: 1 - Math.abs(env.burst) * 0.04 * (1 - sil),
  };
}
