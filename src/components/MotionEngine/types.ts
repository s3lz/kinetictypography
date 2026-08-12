import type { AudioAccent } from "./audioAccent";
import type { MotionParamsMap } from "@/types/motionMetadata";
import type {
  FontPhysics,
  PhysicalModel,
  TypographyBehavior,
} from "@/types/physicalIdentity";

export type MotionHierarchyLayer = "word" | "line" | "glyph" | "material";

export interface CharMotionInput {
  charIndex: number;
  totalChars: number;
  time: number;
  speed: number;
  /** Normalized motion intensity for this system (0–1). */
  level: number;
  /**
   * How independently this glyph moves (0 = locked with group, 1 = fully independent).
   * Derived from cohesion: independence ≈ 1 - cohesion.
   */
  independence: number;
  /**
   * 0–1 word unity. High values make the word move as one object.
   * Defaults come from MOTION_COHESION_DEFAULTS per primitive.
   */
  cohesion?: number;
  /** Word / line group seeds for hierarchical sampling. */
  wordCharIndex?: number;
  lineCharIndex?: number;
  groupIndex?: number;
  charInGroup?: number;
  groupSize?: number;
  /** Which hierarchy layer this sample represents. */
  layer?: MotionHierarchyLayer;
  /** Live audio accent — only impact should rely on this heavily. */
  audioAccent?: AudioAccent;
  /** AI / pipeline-tuned primitive parameters. */
  motionParams?: MotionParamsMap;
  /** Compiled physical identity — constrains / shapes primitives. */
  physicalModel?: PhysicalModel;
  typographyBehavior?: TypographyBehavior;
  fontPhysics?: FontPhysics;
}

export interface CharTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  skewX: number;
  opacity: number;
}

export const IDENTITY_TRANSFORM: CharTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  skewX: 0,
  opacity: 1,
};

export type MotionSystemFn = (input: CharMotionInput) => CharTransform;
