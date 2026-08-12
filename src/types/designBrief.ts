export const RENDERER_DESCRIPTORS = [
  "fragmented",
  "stacked",
  "offset-baseline",
  "compressed",
  "elastic",
  "modular",
  "noisy",
  "angular",
  "dense",
  "sparse",
  "oversized",
  "cropped",
  "columnar",
  "rectilinear",
  "asymmetric",
  "hard-edge",
  "flat",
  "layered",
  "tight",
  "expanded",
] as const;

export type RendererDescriptor = (typeof RENDERER_DESCRIPTORS)[number];

export type TextAlignment = "left" | "center" | "right";
export type TextDensity = "sparse" | "balanced" | "dense";
export type ScaleBehavior =
  | "uniform"
  | "expand-on-tension"
  | "crescendo"
  | "decrescendo";
export type WeightBehavior = "constant" | "emphasis-peaks";
export type OpacityBehavior = "constant" | "pulse" | "fade-edges";
export type CameraMovement = "locked" | "slow-drift" | "orbit";
export type ZoomBehavior = "none" | "slow-push" | "slow-pull" | "pulse";

export interface VisualLanguage {
  geometry: string;
  composition: string;
  spacing: string;
  symmetry: string;
  edgeTreatment: string;
  motionCharacter: string;
  depth: string;
  texture: string;
}

export interface CompositionDirection {
  composition: string;
  negativeSpace: number;
  alignment: TextAlignment;
  textDensity: TextDensity;
}

export type {
  MotionLanguageBrief,
  MotionForce,
  MotionMaterial,
  MotionTiming,
  MotionDeformation,
  MotionDirection,
} from "./motionLanguage";
export type { PaletteBrief, PaletteStrategy, LightBehavior } from "./palette";

export interface CameraBrief {
  movement: CameraMovement;
  zoomBehavior: ZoomBehavior;
}

export interface LayoutConfig {
  composition: string;
  alignment: TextAlignment;
  negativeSpace: number;
  textDensity: TextDensity;
  maxTextWidth: number;
  marginX: number;
  marginY: number;
  anchorX: number;
  anchorY: number;
  lineHeight: number;
  scaleProgression: ScaleBehavior;
}

export interface TypographyConfig {
  tracking: number;
  kerningBias: number;
  lineHeight: number;
  scaleCurve: number;
  rotationAllowance: number;
  opacityBehavior: OpacityBehavior;
  weightBehavior: WeightBehavior;
  scaleBehavior: ScaleBehavior;
  fontWeight: number;
  fontSize: number;
}

export interface CameraConfig {
  movement: CameraMovement;
  zoomBehavior: ZoomBehavior;
  zoomScale: number;
  driftAmplitude: number;
  /** 0–100. AI-generated cinematic strength; not user-editable. */
  intensity: number;
}
