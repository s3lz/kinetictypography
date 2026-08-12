import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  emptyTransform,
  glyphPhase,
  independenceSpread,
  motionLevel,
  motionTime,
  resolveFloatParams,
  seedUnit,
} from "./shared";

/** FLOAT — weightless vertical suspension. Word drifts as one; glyphs buoy slightly. */
export function computeFloatMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const level = motionLevel(input);
  const elapsed = motionTime(input);
  const params = resolveFloatParams(input, input.level);
  const layer = input.layer ?? "glyph";
  const seedIndex =
    layer === "word"
      ? (input.wordCharIndex ?? input.charIndex)
      : layer === "line"
        ? (input.lineCharIndex ?? input.charIndex)
        : input.charIndex;

  if (input.charIndex === 0 && layer !== "line") {
    updateMotionMappingDebug(
      "float",
      sampleMotionMapping(Math.round(input.level * 100), 0, 52, params.driftSpeed, 0.14)
    );
  }

  const sharedInput = { ...input, charIndex: seedIndex };
  const buoyancy =
    layer === "glyph"
      ? independenceSpread(sharedInput, params.buoyancy, 0.22)
      : params.buoyancy;
  const amp = 12 + params.amplitude * 42 * buoyancy;
  const phase = glyphPhase(sharedInput, layer === "glyph" ? 0.35 : 0.05);
  const unit = seedUnit(seedIndex, layer === "glyph" ? input.independence : 0);
  const delay = layer === "glyph" ? unit * 0.2 * (1 - (input.cohesion ?? 0.7)) : 0;

  const slowT = elapsed * params.driftSpeed * 0.52 + delay;
  const midT = elapsed * params.driftSpeed * 0.28 + phase * 0.6;
  const deepT = elapsed * params.driftSpeed * 0.14 + unit * 1.2;

  const y =
    Math.sin(slowT) * amp * 0.55 +
    Math.sin(midT + 0.9) * amp * 0.32 +
    Math.sin(deepT) * amp * 0.18;

  const xWeight = layer === "glyph" ? 0.08 : 0.04;
  const x =
    Math.sin(slowT * 0.31 + phase) * amp * xWeight * (params.independence * 0.5 + 0.5) +
    Math.sin(deepT * 0.47) * amp * 0.03;

  const rotation =
    Math.sin(midT * 0.73 + unit * 2.5) *
    (0.4 + params.amplitude * 1.6) *
    (layer === "glyph" ? params.independence * 0.5 : 0.35);

  return { x, y, scale: 1, rotation, skewX: 0, opacity: 1 };
}
