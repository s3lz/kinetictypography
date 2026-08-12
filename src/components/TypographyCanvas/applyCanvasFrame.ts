import type { RefObject } from "react";
import type { CreativeState } from "../../types/CreativeState";
import type { ScaleBehavior } from "../../types/designBrief";
import {
  sampleAudioAccent,
  ZERO_AUDIO_ACCENT,
  type AudioAccent,
} from "../MotionEngine/audioAccent";
import { glyphSeed, splitGlyphs } from "../MotionEngine/glyphUtils";
import { clampGlyphMotion } from "../MotionEngine/hierarchy";
import { buildGrammarContext } from "../MotionEngine/motionGrammarOrchestrator";
import { resolveMotionLayers } from "../MotionEngine/MotionResolver";
import { isGlobalAnimationEnabled } from "../MotionEngine/motionIntensity";
import { IDENTITY_TRANSFORM, type CharTransform } from "../MotionEngine/types";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface CanvasFrameRefs {
  stage: HTMLDivElement | null;
  chars: (HTMLSpanElement | null)[];
  words: (HTMLSpanElement | null)[];
  lines: (HTMLSpanElement | null)[];
}

export interface ApplyCanvasFrameInput {
  time: number;
  state: CreativeState;
  refs: CanvasFrameRefs;
  viewportSize: ViewportSize;
  audioRef?: RefObject<HTMLAudioElement | null>;
  /** When set, skips live analyser sampling (used for deterministic export). */
  audioAccent?: AudioAccent;
  clearAllMotionStyles: () => void;
}

const MAX_SPATIAL_AMPLITUDE = 56;
const MIN_OPACITY = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const MAX_TRANSLATION = 96;

const IDENTITY_CAMERA = { scale: 1, x: 0, y: 0 };

function isIdentityMotion(motion: CharTransform): boolean {
  return (
    Math.abs(motion.x) < 0.01 &&
    Math.abs(motion.y) < 0.01 &&
    Math.abs(motion.rotation) < 0.01 &&
    Math.abs(motion.skewX) < 0.01 &&
    Math.abs(motion.scale - 1) < 0.001 &&
    Math.abs(motion.opacity - 1) < 0.001
  );
}

function sanitizeMotionValue(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function sanitizeMotionTransform(
  motion: CharTransform,
  baseScale = 1,
  baseOpacity = 1
): CharTransform {
  const scale = Math.max(
    MIN_SCALE,
    Math.min(MAX_SCALE, sanitizeMotionValue(motion.scale * baseScale, 1))
  );
  const opacity = Math.max(
    MIN_OPACITY,
    Math.min(1, sanitizeMotionValue(motion.opacity * baseOpacity, 1))
  );

  return {
    x: Math.max(-MAX_TRANSLATION, Math.min(MAX_TRANSLATION, sanitizeMotionValue(motion.x))),
    y: Math.max(-MAX_TRANSLATION, Math.min(MAX_TRANSLATION, sanitizeMotionValue(motion.y))),
    rotation: sanitizeMotionValue(motion.rotation),
    skewX: sanitizeMotionValue(motion.skewX),
    scale,
    opacity,
  };
}

/** Apply a transform to any hierarchy node (line, word, or glyph). */
export function applyTransform(
  element: HTMLElement,
  motion: CharTransform,
  baseScale = 1,
  baseOpacity = 1,
  options: { quantize?: boolean } = {}
): void {
  const safe = sanitizeMotionTransform(motion, baseScale, baseOpacity);
  // Live preview uses floating-point transforms — half-px/deg rounding caused flicker.
  const quantize = options.quantize === true;
  const scale = quantize ? Math.round(safe.scale * 1000) / 1000 : safe.scale;
  const opacity = quantize ? Math.round(safe.opacity * 1000) / 1000 : safe.opacity;

  if (
    isIdentityMotion(safe) &&
    Math.abs(scale - 1) < 0.001 &&
    Math.abs(opacity - 1) < 0.001
  ) {
    element.style.removeProperty("transform");
    element.style.removeProperty("opacity");
    return;
  }

  const x = quantize ? Math.round(safe.x * 2) / 2 : safe.x;
  const y = quantize ? Math.round(safe.y * 2) / 2 : safe.y;
  const rotation = quantize ? Math.round(safe.rotation * 2) / 2 : safe.rotation;
  const skewX = quantize ? Math.round(safe.skewX * 2) / 2 : safe.skewX;

  element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) skewX(${skewX}deg) scale(${scale})`;
  element.style.opacity = String(opacity);
}

export function clearElementMotion(element: HTMLElement | null): void {
  if (!element) return;
  element.style.removeProperty("transform");
  element.style.removeProperty("opacity");
}

export function computeSpatialScale(viewport: ViewportSize): number {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }

  const minDim = Math.min(viewport.width, viewport.height);
  return Math.min(1, (minDim * 0.09) / MAX_SPATIAL_AMPLITUDE);
}

function computeGlyphScale(
  index: number,
  totalChars: number,
  behavior: ScaleBehavior,
  curve: number
): number {
  const t = totalChars <= 1 ? 0.5 : index / (totalChars - 1);

  switch (behavior) {
    case "expand-on-tension":
      return (0.9 + t * 0.16) * curve;
    case "crescendo":
      return (0.88 + t * 0.2) * curve;
    case "decrescendo":
      return (1.08 - t * 0.18) * curve;
    default:
      return curve;
  }
}

function computeGlyphOpacity(
  normalizedPosition: number,
  behavior: CreativeState["typography"]["opacityBehavior"]
): number {
  if (behavior !== "fade-edges") return 1;

  const edgeDistance = Math.min(normalizedPosition, 1 - normalizedPosition) * 2;
  return 0.62 + edgeDistance * 0.38;
}

export function computeCameraTransform(
  time: number,
  state: CreativeState,
  animationEnabled: boolean
): { scale: number; x: number; y: number } {
  if (!animationEnabled) {
    return IDENTITY_CAMERA;
  }

  const intensity = Math.max(0, Math.min(1, state.camera.intensity / 100));
  if (intensity <= 0) {
    return IDENTITY_CAMERA;
  }

  const { camera } = state;
  let scale = camera.zoomScale;

  if (camera.zoomBehavior === "pulse") {
    scale *= 1 + Math.sin(time * 0.8) * 0.025 * intensity;
  } else if (camera.zoomBehavior === "slow-push") {
    scale *= 1 + Math.min(time * 0.01, 0.05) * intensity;
  } else if (camera.zoomBehavior === "slow-pull") {
    scale *= 1 - Math.min(time * 0.008, 0.04) * intensity;
  }

  let x = 0;
  let y = 0;

  if (camera.movement === "slow-drift") {
    x = Math.sin(time * 0.35) * camera.driftAmplitude * intensity;
    y = Math.cos(time * 0.28) * camera.driftAmplitude * 0.6 * intensity;
  } else if (camera.movement === "orbit") {
    x = Math.sin(time * 0.5) * camera.driftAmplitude * intensity;
    y = Math.sin(time * 0.25) * camera.driftAmplitude * 0.5 * intensity;
  }

  scale = 1 + (scale - 1) * intensity;

  return { scale, x, y };
}

function computeTypographyGlyphScale(
  index: number,
  totalGroups: number,
  typography: CreativeState["typography"],
  emphasisWeight: number,
  motionActive: boolean
): number {
  const baseScale = computeGlyphScale(
    index,
    totalGroups,
    typography.scaleBehavior,
    typography.scaleCurve
  );
  return motionActive ? baseScale * emphasisWeight : baseScale;
}

function applyTypographyRotation(
  motion: CharTransform,
  glyphIndex: number,
  rotationAllowance: number,
  isSpace: boolean
): CharTransform {
  if (rotationAllowance <= 0 || isSpace) {
    return motion;
  }

  const seed = (((glyphSeed(glyphIndex, 11) % 1000) + 1000) % 1000) / 1000;
  return {
    ...motion,
    rotation: motion.rotation + (seed - 0.5) * rotationAllowance * 2,
  };
}

/**
 * Single shared frame applicator used by live RAF and MP4 export.
 * Mutates the live DOM hierarchy — no alternate animation path.
 */
export function applyCanvasFrame(input: ApplyCanvasFrameInput): void {
  const { time, state, refs, viewportSize, clearAllMotionStyles } = input;
  const animationEnabled = isGlobalAnimationEnabled(state);
  const motionActive = animationEnabled;
  const audioAccent =
    input.audioAccent ??
    (motionActive
      ? sampleAudioAccent(input.audioRef?.current ?? null, time)
      : ZERO_AUDIO_ACCENT);

  const currentGlyphs = splitGlyphs(state.text);
  const totalChars = currentGlyphs.length;
  const spatialScale = computeSpatialScale(viewportSize);

  const camera = computeCameraTransform(time, state, animationEnabled);
  const stage = refs.stage;
  if (stage) {
    if (
      !animationEnabled ||
      (camera.x === 0 && camera.y === 0 && Math.abs(camera.scale - 1) < 0.001)
    ) {
      stage.style.removeProperty("transform");
    } else {
      stage.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    }
  }

  if (!motionActive) {
    clearAllMotionStyles();
    return;
  }

  const wordCache = new Map<number, CharTransform>();
  const lineCache = new Map<number, CharTransform>();
  const appliedWords = new Set<number>();
  const appliedLines = new Set<number>();

  for (let index = 0; index < totalChars; index += 1) {
    const glyphEl = refs.chars[index];
    if (!glyphEl) continue;

    const grammarContext = buildGrammarContext(
      state.text,
      index,
      totalChars,
      state.motionGrammar
    );

    const layers = resolveMotionLayers({
      charIndex: index,
      totalChars,
      time,
      state,
      spatialScale,
      audioAccent,
    });

    if (!lineCache.has(layers.lineGroupIndex)) {
      lineCache.set(layers.lineGroupIndex, layers.line);
    }
    if (!wordCache.has(layers.wordGroupIndex)) {
      wordCache.set(layers.wordGroupIndex, layers.word);
    }

    if (!appliedLines.has(layers.lineGroupIndex)) {
      const lineEl = refs.lines[layers.lineGroupIndex];
      if (lineEl) {
        applyTransform(lineEl, lineCache.get(layers.lineGroupIndex) ?? IDENTITY_TRANSFORM);
      }
      appliedLines.add(layers.lineGroupIndex);
    }

    if (!appliedWords.has(layers.wordGroupIndex)) {
      const wordEl = refs.words[layers.wordGroupIndex];
      if (wordEl) {
        applyTransform(wordEl, wordCache.get(layers.wordGroupIndex) ?? IDENTITY_TRANSFORM);
      }
      appliedWords.add(layers.wordGroupIndex);
    }

    const glyphScale = computeTypographyGlyphScale(
      grammarContext.groupIndex,
      Math.max(1, grammarContext.totalGroups),
      state.typography,
      grammarContext.emphasisWeight,
      motionActive
    );

    const glyphOpacity = computeGlyphOpacity(
      grammarContext.normalizedPosition,
      state.typography.opacityBehavior
    );

    const styledLocal = clampGlyphMotion(
      applyTypographyRotation(
        layers.local,
        index,
        state.typography.rotationAllowance,
        currentGlyphs[index] === " "
      )
    );

    applyTransform(glyphEl, styledLocal, glyphScale, glyphOpacity);
  }
}
