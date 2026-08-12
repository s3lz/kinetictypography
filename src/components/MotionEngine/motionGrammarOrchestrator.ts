import { glyphSeed } from "./glyphUtils";
import type { CharTransform } from "./types";
import type { MotionGrammar, MotionGrammarOptions } from "../../types/motionGrammar";
import { PREVIEW_MIN_OPACITY } from "../../types/motionGrammar";

export interface GrammarContext {
  groupIndex: number;
  totalGroups: number;
  charInGroup: number;
  groupSize: number;
  normalizedPosition: number;
  emphasisWeight: number;
  effectiveCharIndex: number;
}

export interface TextGroup {
  startIndex: number;
  endIndex: number;
  groupIndex: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampPreviewOpacity(opacity: number): number {
  return Math.max(PREVIEW_MIN_OPACITY, Math.min(1, opacity));
}

function withPreviewOpacity(transform: CharTransform): CharTransform {
  return {
    ...transform,
    opacity: clampPreviewOpacity(transform.opacity),
  };
}

export function buildTextGroups(text: string, grouping: MotionGrammar["grouping"]): TextGroup[] {
  if (grouping === "line") {
    return [{ startIndex: 0, endIndex: text.length, groupIndex: 0 }];
  }

  if (grouping === "glyph") {
    return [...text].map((_, index) => ({
      startIndex: index,
      endIndex: index + 1,
      groupIndex: index,
    }));
  }

  const groups: TextGroup[] = [];
  let groupIndex = 0;
  let start = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const isBoundary = char === " " || char === "\n" || char === "\t";
    const isLast = index === text.length - 1;

    if (isBoundary) {
      if (index > start) {
        groups.push({ startIndex: start, endIndex: index, groupIndex });
        groupIndex += 1;
      }
      groups.push({ startIndex: index, endIndex: index + 1, groupIndex });
      groupIndex += 1;
      start = index + 1;
      continue;
    }

    if (start === index) {
      start = index;
    }

    if (isLast) {
      groups.push({ startIndex: start, endIndex: index + 1, groupIndex });
    }
  }

  if (groups.length === 0) {
    return [{ startIndex: 0, endIndex: text.length, groupIndex: 0 }];
  }

  return groups;
}

function findGroupForChar(groups: TextGroup[], charIndex: number): TextGroup {
  const match = groups.find(
    (group) => charIndex >= group.startIndex && charIndex < group.endIndex
  );
  return match ?? groups[0];
}

function computeEmphasisWeight(
  normalizedPosition: number,
  emphasis: MotionGrammar["emphasis"],
  charIndex: number
): number {
  switch (emphasis) {
    case "leading":
      return 1 - normalizedPosition * 0.55;
    case "trailing":
      return 0.45 + normalizedPosition * 0.55;
    case "center": {
      const centerDistance = Math.abs(normalizedPosition - 0.5) * 2;
      return 1 - centerDistance * 0.45;
    }
    case "random": {
      const seed = ((glyphSeed(charIndex, 17) % 1000) + 1000) % 1000 / 1000;
      return 0.55 + seed * 0.45;
    }
    default:
      return 1;
  }
}

export function buildGrammarContext(
  text: string,
  charIndex: number,
  totalChars: number,
  grammar: MotionGrammar
): GrammarContext {
  const groups = buildTextGroups(text, grammar.grouping);
  const group = findGroupForChar(groups, charIndex);
  const normalizedPosition = totalChars <= 1 ? 0.5 : charIndex / (totalChars - 1);

  return {
    groupIndex: group.groupIndex,
    totalGroups: groups.length,
    charInGroup: charIndex - group.startIndex,
    groupSize: Math.max(1, group.endIndex - group.startIndex),
    normalizedPosition,
    emphasisWeight: computeEmphasisWeight(normalizedPosition, grammar.emphasis, charIndex),
    effectiveCharIndex: group.groupIndex,
  };
}

export function resolveGroupIndependence(
  grammar: MotionGrammar,
  baseIndependence: number,
  groupSize = 1
): number {
  if (groupSize <= 1) return baseIndependence;
  if (grammar.grouping === "line") return 0;
  if (grammar.grouping === "word") return baseIndependence * 0.18;
  return baseIndependence;
}

export function applyTimingModel(time: number, grammar: MotionGrammar): number {
  switch (grammar.timingModel) {
    case "elastic":
      return time * (0.92 + Math.sin(time * 1.4) * 0.12);
    case "overshoot":
      return time * (1 + Math.sin(time * 0.85) * 0.18);
    case "staccato":
      return time * (0.98 + Math.sin(time * 0.6) * 0.04);
    case "constant":
      return time;
    case "continuous":
      return time * (0.96 + Math.sin(time * 0.35) * 0.04);
    default:
      return time;
  }
}

function radialOrigin(context: GrammarContext): { x: number; y: number } {
  const angle = (context.normalizedPosition - 0.5) * Math.PI * 1.6;
  const radius = 0.35 + context.emphasisWeight * 0.25;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function spatialVector(
  grammar: MotionGrammar,
  context: GrammarContext
): { x: number; y: number; scale: number } {
  switch (grammar.spatialDistribution) {
    case "radial": {
      const origin = radialOrigin(context);
      return { x: origin.x, y: origin.y, scale: 1 };
    }
    case "linear":
      return {
        x: (context.normalizedPosition - 0.5) * 1.4,
        y: 0,
        scale: 1,
      };
    case "edge": {
      const edgePull = context.normalizedPosition < 0.5 ? -1 : 1;
      return { x: edgePull * 0.85, y: (context.groupIndex % 2 === 0 ? -1 : 1) * 0.25, scale: 1 };
    }
    case "spiral": {
      const t = context.normalizedPosition * Math.PI * 3;
      return {
        x: Math.cos(t) * 0.55,
        y: Math.sin(t) * 0.55,
        scale: 1,
      };
    }
    case "random": {
      const seed = glyphSeed(context.groupIndex, context.charInGroup);
      return {
        x: Math.sin(seed * 0.013) * 0.65,
        y: Math.cos(seed * 0.017) * 0.65,
        scale: 1,
      };
    }
    default:
      return { x: 0, y: 0, scale: 1 };
  }
}

export function applySpatialDistribution(
  transform: CharTransform,
  grammar: MotionGrammar,
  context: GrammarContext,
  spatialScale: number
): CharTransform {
  const vector = spatialVector(grammar, context);
  const emphasis = context.emphasisWeight;

  return {
    ...transform,
    x: transform.x + vector.x * spatialScale * 14 * emphasis,
    y: transform.y + vector.y * spatialScale * 14 * emphasis,
    rotation: transform.rotation + vector.x * 3 * emphasis,
  };
}

export function applyEntrancePattern(
  transform: CharTransform,
  time: number,
  grammar: MotionGrammar,
  context: GrammarContext
): CharTransform {
  const groupT =
    context.totalGroups <= 1 ? 0 : context.groupIndex / (context.totalGroups - 1);

  let envelope = 1;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let opacity = 1;

  switch (grammar.entrancePattern) {
    case "burst": {
      const burstWindow = 1.2;
      const burst = clamp01(1 - Math.abs(time - 0.35) / burstWindow);
      envelope = 0.35 + burst * 0.65;
      scale = 0.82 + burst * 0.18;
      break;
    }
    case "stagger": {
      const delay = groupT * 0.55;
      const progress = clamp01((time - delay) / 0.9);
      envelope = progress;
      offsetY = (1 - progress) * 18;
      opacity = PREVIEW_MIN_OPACITY + progress * (1 - PREVIEW_MIN_OPACITY);
      break;
    }
    case "cascade": {
      const wave = Math.sin(time * 1.6 - groupT * Math.PI * 1.4);
      envelope = 0.72 + wave * 0.28;
      offsetX = wave * 6 * context.emphasisWeight;
      break;
    }
    case "assemble": {
      const converge = clamp01(time / 1.4);
      const spread = (1 - converge) * (context.charInGroup - (context.groupSize - 1) / 2) * 10;
      offsetX = spread;
      scale = 0.88 + converge * 0.12;
      envelope = 0.6 + converge * 0.4;
      break;
    }
    default:
      break;
  }

  return withPreviewOpacity({
    x: transform.x * envelope + offsetX,
    y: transform.y * envelope + offsetY,
    scale: transform.scale * scale,
    rotation: transform.rotation * envelope,
    skewX: transform.skewX * envelope,
    opacity: Math.min(transform.opacity, opacity),
  });
}

export function applyIdlePattern(
  transform: CharTransform,
  time: number,
  grammar: MotionGrammar,
  context: GrammarContext
): CharTransform {
  const phase = context.groupIndex * 0.7 + context.charInGroup * 0.15;

  switch (grammar.idlePattern) {
    case "breathing": {
      const breath = (1 - Math.cos(time * 0.9 + phase)) * 0.5;
      return withPreviewOpacity({
        ...transform,
        scale: transform.scale * (1 + breath * 0.05),
        opacity: transform.opacity * (1 - breath * 0.03),
      });
    }
    case "jitter": {
      const jitterX = Math.sin(time * 1.7 + phase) * 1.8;
      const jitterY = Math.cos(time * 2.1 + phase * 0.8) * 1.2;
      return {
        ...transform,
        x: transform.x + jitterX,
        y: transform.y + jitterY,
      };
    }
    case "freeze": {
      const gate = time % 2.4 < 0.15 ? 1 : 0.12;
      return {
        ...transform,
        x: transform.x * gate,
        y: transform.y * gate,
        rotation: transform.rotation * gate,
        skewX: transform.skewX * gate,
        scale: 1 + (transform.scale - 1) * gate,
      };
    }
    case "drift":
    default:
      return transform;
  }
}

export function applyTransitionPattern(
  transform: CharTransform,
  time: number,
  grammar: MotionGrammar,
  context: GrammarContext
): CharTransform {
  const cycle = (time * 0.55 + context.groupIndex * 0.11) % 1;
  const active = cycle > 0.62 && cycle < 0.88;
  if (!active) return transform;

  const peak = Math.sin(((cycle - 0.62) / 0.26) * Math.PI);
  const split = context.charInGroup - (context.groupSize - 1) / 2;

  switch (grammar.transitionPattern) {
    case "fragment":
      return withPreviewOpacity({
        ...transform,
        x: transform.x + split * peak * 14,
        y: transform.y + peak * 4,
        opacity: transform.opacity * (1 - peak * 0.12),
      });
    case "stretch":
      return {
        ...transform,
        skewX: transform.skewX + peak * 8 * Math.sign(split || 1),
        scale: transform.scale * (1 + peak * 0.08),
      };
    case "collapse":
      return {
        ...transform,
        scale: transform.scale * (1 - peak * 0.22),
        y: transform.y + peak * 6,
      };
    case "swap": {
      const swapDirection = context.groupIndex % 2 === 0 ? 1 : -1;
      return {
        ...transform,
        x: transform.x + peak * 12 * swapDirection,
        rotation: transform.rotation + peak * 10 * swapDirection,
      };
    }
    default:
      return transform;
  }
}

export function applyExitPattern(
  transform: CharTransform,
  time: number,
  grammar: MotionGrammar,
  context: GrammarContext
): CharTransform {
  const exitStart = 8 + context.normalizedPosition * 2.5;
  if (time < exitStart) return transform;

  const progress = clamp01((time - exitStart) / 2.2);
  const emphasis = context.emphasisWeight;

  switch (grammar.exitPattern) {
    case "scatter":
      return {
        ...transform,
        x: transform.x + progress * 40 * (context.charInGroup - context.groupSize / 2),
        y: transform.y + progress * 22,
        opacity: transform.opacity * (1 - progress),
        rotation: transform.rotation + progress * 18,
      };
    case "dissolve":
      return {
        ...transform,
        opacity: transform.opacity * (1 - progress * 0.95),
        scale: transform.scale * (1 - progress * 0.08 * emphasis),
      };
    case "compress":
      return {
        ...transform,
        x: transform.x * (1 - progress * 0.75),
        scale: transform.scale * (1 - progress * 0.28),
      };
    case "fade":
    default:
      return {
        ...transform,
        opacity: transform.opacity * (1 - progress * 0.9),
      };
  }
}

export function applyMotionGrammar(
  transform: CharTransform,
  time: number,
  grammar: MotionGrammar,
  context: GrammarContext,
  spatialScale: number,
  options: MotionGrammarOptions = {}
): CharTransform {
  const enableExit = options.enableExit === true;

  let result = applyEntrancePattern(transform, time, grammar, context);
  result = applyIdlePattern(result, time, grammar, context);
  result = applyTransitionPattern(result, time, grammar, context);
  result = applySpatialDistribution(result, grammar, context, spatialScale);

  if (enableExit) {
    result = applyExitPattern(result, time, grammar, context);
  }

  return withPreviewOpacity(result);
}
