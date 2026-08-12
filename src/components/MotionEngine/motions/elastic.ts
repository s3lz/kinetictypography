import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  emptyTransform,
  motionTime,
  resolveElasticParams,
  seedUnit,
  springImpulse,
  glyphPhase,
} from "./shared";

/** ELASTIC — stretch/rebound shaped by identity (stretchAmount, recoil, direction). */
export function computeElasticMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const elapsed = motionTime(input);
  const params = resolveElasticParams(input, input.level);
  const layer = input.layer ?? "glyph";
  const seedIndex =
    layer === "glyph" ? input.charIndex : (input.wordCharIndex ?? input.charIndex);

  if (input.charIndex === 0 && layer !== "line") {
    updateMotionMappingDebug(
      "elastic",
      sampleMotionMapping(Math.round(input.level * 100), 0, 44, params.stiffness, params.energy)
    );
  }

  const unit = seedUnit(seedIndex, layer === "glyph" ? input.independence : 0);
  const phase = glyphPhase({ ...input, charIndex: seedIndex }, layer === "glyph" ? 0.5 : 0.1);
  const recoil = params.recoilStrength ?? params.bounce;
  const resist = params.resistance ?? 0.45;
  const stretch = params.stretchAmount ?? 0.1;
  const impulsePeriod = 2.0 + (1 - recoil) * 1.8 + resist * 0.6 + (layer === "glyph" ? unit * 0.2 : 0);
  const timingOffset = layer === "glyph" ? unit * 0.25 * (1 - (input.cohesion ?? 0.75)) : 0;

  const springX = springImpulse(
    elapsed + timingOffset,
    params.stiffness,
    params.damping,
    impulsePeriod,
    phase,
    params.energy * (0.7 + recoil * 0.5)
  );
  const springY = springImpulse(
    elapsed * 0.88 + timingOffset * 0.7,
    params.stiffness * 0.9,
    params.damping + 0.03,
    impulsePeriod * 1.08,
    phase * 0.75,
    params.energy * 0.85
  );

  const dir = params.forceDirection ?? "horizontal";
  const amp = 8 + recoil * 34 + stretch * 40;
  let x = springX * amp;
  let y = springY * amp * 0.4;
  if (dir === "vertical") {
    x *= 0.25;
    y = springY * amp;
  } else if (dir === "radial" || dir === "outward") {
    const sign = unit > 0.5 ? 1 : -1;
    x = springX * amp * 0.75 * sign;
    y = springY * amp * 0.75;
  } else if (dir === "inward") {
    x = -springX * amp * 0.55;
    y = -Math.abs(springY) * amp * 0.25;
  }

  const scale = 1 + Math.abs(springX) * (stretch * 1.4 + recoil * 0.05);
  const maxRot = input.fontPhysics?.maxRotation ?? 4;
  const rotation =
    springX *
    Math.min(maxRot, 1.4 + params.energy * 2.2) *
    (layer === "glyph" ? input.independence * 0.45 : 0.4) *
    (1 - resist * 0.35);
  const skewX =
    springY *
    (0.2 + recoil * 0.5) *
    (layer === "glyph" ? input.independence * 0.4 : 0.35) *
    (1 - resist * 0.4);

  return { x, y, scale, rotation, skewX, opacity: 1 };
}
