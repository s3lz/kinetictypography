import { updateMotionMappingDebug, sampleMotionMapping } from "../motionMapping";
import type { CharMotionInput, CharTransform } from "../types";
import {
  emptyTransform,
  motionLevel,
  motionTime,
  resolveWaveParams,
} from "./shared";

/**
 * WAVE — connected field. Word rides a shared phase; glyphs get tiny
 * within-word wavelength offsets so letters stay attached.
 */
export function computeWaveMotion(input: CharMotionInput): CharTransform {
  if (input.level <= 0) return emptyTransform();

  const level = motionLevel(input);
  const elapsed = motionTime(input);
  const params = resolveWaveParams(input, input.level);
  const layer = input.layer ?? "glyph";
  const cohesion = input.cohesion ?? 0.85;

  const wordIndex = input.wordCharIndex ?? input.charIndex;
  // Word uses a single phase so the word moves as fabric; glyphs add small offset.
  const indexForPhase =
    layer === "word" || layer === "line"
      ? wordIndex
      : wordIndex + (input.charInGroup ?? 0) * params.wavelength * (1 - cohesion) * 0.35;

  if (input.charIndex === 0 && layer !== "line") {
    updateMotionMappingDebug(
      "wave",
      sampleMotionMapping(Math.round(input.level * 100), 0, 36, params.propagationSpeed, 1.4)
    );
  }

  const waveAmp = 7 + params.amplitude * 32;
  const phase = elapsed * params.propagationSpeed + indexForPhase * params.wavelength;
  const smooth = params.smoothness;

  const carrier = Math.sin(phase);
  const harmonics = Math.sin(phase * 0.5 + 0.3) * 0.14 * smooth;

  const y = (carrier + harmonics) * waveAmp;
  const x =
    Math.sin(phase * 0.48 + 0.25) * waveAmp * 0.14 * level * smooth *
    (layer === "glyph" ? 0.55 : 1);
  const rotation =
    Math.sin(phase - 0.4) *
    Math.min(
      input.fontPhysics?.maxRotation ?? 4,
      (0.8 + params.amplitude * 1.8) * level * (0.25 + smooth * 0.3)
    ) *
    (layer === "glyph" ? 0.6 : 1);

  return { x, y, scale: 1, rotation, skewX: 0, opacity: 1 };
}
