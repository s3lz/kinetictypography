import { glyphSeed } from "./glyphUtils";
import type { GrammarContext } from "./motionGrammarOrchestrator";
import type { CharTransform } from "./types";
import type { MotionPersonality } from "../../types/motionPersonality";

export interface MotionPersonalityModifiers {
  speedScale: number;
  independenceScale: number;
  amplitudeScale: number;
}

export function getMotionPersonalityModifiers(
  personality: MotionPersonality
): MotionPersonalityModifiers {
  switch (personality) {
    case "physical":
      return { speedScale: 1.08, independenceScale: 1.15, amplitudeScale: 1.2 };
    case "chaotic":
      return { speedScale: 1.22, independenceScale: 1.35, amplitudeScale: 1.15 };
    case "theatrical":
      return { speedScale: 0.78, independenceScale: 0.85, amplitudeScale: 1.35 };
    case "mechanical":
      return { speedScale: 1, independenceScale: 0.45, amplitudeScale: 0.85 };
    case "flowing":
      return { speedScale: 0.88, independenceScale: 0.7, amplitudeScale: 1.05 };
    case "restrained":
      return { speedScale: 0.72, independenceScale: 0.35, amplitudeScale: 0.55 };
    default:
      return { speedScale: 1, independenceScale: 1, amplitudeScale: 1 };
  }
}

function snapToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

export function applyMotionPersonality(
  transform: CharTransform,
  time: number,
  personality: MotionPersonality,
  context: GrammarContext,
  speed: number
): CharTransform {
  const phase = context.groupIndex * 0.61 + context.charInGroup * 0.23;
  const seed = glyphSeed(context.groupIndex, context.charInGroup);

  switch (personality) {
    case "physical": {
      const push = Math.sin(time * speed * 1.35 + phase);
      // Avoid `neg ** fraction` → NaN in JS.
      const overshoot =
        push >= 0 ? push ** 0.62 : -((-push) ** 1.4);
      const rebound = overshoot * (1 + Math.sin(time * 2.1 + seed * 0.02) * 0.22);
      const wobble = Math.sin(time * 0.95 + phase * 1.7) * 3.5;

      return {
        ...transform,
        x: transform.x + rebound * 9 + wobble * 0.55,
        y: transform.y + rebound * 4.5 + Math.cos(time * 1.15 + phase) * 2.8,
        rotation: transform.rotation + rebound * 5.5,
        skewX: transform.skewX + rebound * 1.8,
        scale: transform.scale * (1 + Math.abs(rebound) * 0.05),
      };
    }
    case "theatrical": {
      const anticipation = Math.sin(time * speed * 0.55 + phase * 0.4);
      const holdGate = time % 3.2 < 0.55 ? 0.42 : 1;
      const reveal = (1 - Math.cos(time * speed * 0.42 + phase)) * 0.5;

      return {
        ...transform,
        x: transform.x * holdGate,
        y: transform.y * holdGate + anticipation * 2.5,
        scale: transform.scale * (0.94 + reveal * 0.14 + Math.max(0, anticipation) * 0.06),
        rotation: transform.rotation * holdGate + anticipation * 2.2,
        opacity: transform.opacity * (0.92 + reveal * 0.08),
      };
    }
    case "chaotic": {
      const tick = time * (1.2 + (seed % 3) * 0.15) + phase;
      const jumpX = Math.sin(tick * 1.9 + seed * 0.03) * 4;
      const jumpY = Math.cos(tick * 2.3 + seed * 0.05) * 3;
      const fragment = (context.charInGroup - (context.groupSize - 1) / 2) * 2.2;

      return {
        ...transform,
        x: transform.x + jumpX + fragment,
        y: transform.y + jumpY,
        rotation: transform.rotation + jumpX * 0.55,
        skewX: transform.skewX + jumpY * 0.35,
        scale: transform.scale * (1 + Math.sin(tick + seed) * 0.04),
      };
    }
    case "mechanical": {
      const gridX = snapToGrid(transform.x, 4);
      const gridY = snapToGrid(transform.y, 4);

      return {
        ...transform,
        x: gridX,
        y: gridY,
        rotation: snapToGrid(transform.rotation, 2),
        skewX: snapToGrid(transform.skewX, 1),
      };
    }
    case "flowing": {
      const driftX = Math.sin(time * speed * 0.62 + phase) * 5.5;
      const driftY = Math.cos(time * speed * 0.48 + phase * 1.2) * 3.8;
      const breath = (1 - Math.cos(time * 0.75 + phase)) * 0.5;

      return {
        ...transform,
        x: transform.x + driftX,
        y: transform.y + driftY,
        scale: transform.scale * (1 + breath * 0.04),
        opacity: transform.opacity * (1 - breath * 0.03),
      };
    }
    case "restrained":
      return {
        ...transform,
        x: transform.x * 0.38,
        y: transform.y * 0.38,
        rotation: transform.rotation * 0.45,
        skewX: transform.skewX * 0.4,
        scale: 1 + (transform.scale - 1) * 0.35,
      };
    default:
      return transform;
  }
}
