import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  breathEnvelope,
  emptyTransform,
  glyphPhase,
  motionLevel,
  motionTime,
  resolvePulseParams,
  seedUnit,
} from "./shared";

/** PULSE — word breathes together; glyphs only get tiny organic timing offsets. */
export function computePulseMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const level = motionLevel(input);
  const elapsed = motionTime(input);
  const params = resolvePulseParams(input, input.level);
  const layer = input.layer ?? "glyph";
  const seedIndex =
    layer === "glyph" ? input.charIndex : (input.wordCharIndex ?? input.charIndex);

  if (input.charIndex === 0 && layer !== "line") {
    updateMotionMappingDebug(
      "pulse",
      sampleMotionMapping(Math.round(input.level * 100), 0, params.expansionAmount, 0.08, 0.22)
    );
  }

  const unit = seedUnit(seedIndex, layer === "glyph" ? input.independence : 0);
  const variation =
    layer === "glyph"
      ? params.organicVariation * 0.45 + glyphPhase({ ...input, charIndex: seedIndex }, 0.1) * 0.004
      : params.organicVariation * 0.08;

  const breath = breathEnvelope(elapsed, params.cycleDuration, variation);
  const scale = 1 + breath * params.expansionAmount * params.intensity;
  const tracking = breath * (2.2 + params.expansionAmount * 40) * params.intensity;
  const rotation =
    (breath - 0.48) *
    -0.7 *
    params.intensity *
    (layer === "glyph" ? 0.25 + input.independence * 0.2 : 0.35);

  return {
    x: tracking * (layer === "glyph" ? 0.04 : 0.07),
    y: breath * 1.2 * params.intensity * level,
    scale,
    rotation,
    skewX: layer === "glyph" ? (breath - 0.5) * 0.08 * params.intensity * (unit - 0.5) : 0,
    opacity: 1 - breath * 0.02 * params.intensity,
  };
}
