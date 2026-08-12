import {
  MOTION_DIMENSIONS,
  type CreativeState,
  type MotionLevels,
} from "../../types/CreativeState";
import { normalizeLevel } from "./Unity";

export function isAllMotionSlidersZero(motion: MotionLevels): boolean {
  return MOTION_DIMENSIONS.every((dimension) => motion[dimension] <= 0);
}

export function computeMotionIntensity(motion: MotionLevels): number {
  let peak = 0;
  for (const dimension of MOTION_DIMENSIONS) {
    peak = Math.max(peak, normalizeLevel(motion[dimension]));
  }
  return peak;
}

export function isGlyphMotionInactive(state: CreativeState): boolean {
  return isAllMotionSlidersZero(state.motion);
}

/** Static preview: all motion sliders at zero — no glyph or camera animation. */
export function isStaticPreviewMode(motion: MotionLevels): boolean {
  return isAllMotionSlidersZero(motion);
}

export function isGlobalAnimationEnabled(state: CreativeState): boolean {
  return !isStaticPreviewMode(state.motion);
}
