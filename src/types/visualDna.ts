export type MotionRhythm =
  | "continuous"
  | "staggered"
  | "burst"
  | "cascading"
  | "oscillating"
  | "stop-start";

export type VisualWeight = "airy" | "balanced" | "heavy";

export type SceneDensity = "minimal" | "moderate" | "dense";

export type LayoutBias =
  | "center"
  | "left"
  | "radial"
  | "asymmetric"
  | "stacked"
  | "edge";

export type MovementBias = "horizontal" | "vertical" | "orbital" | "radial";

export type CameraEnergy = "locked" | "slow drift" | "tracking" | "orbit";

export type SpacingBehavior = "compressed" | "balanced" | "expanded";

export interface VisualDNA {
  motionRhythm: MotionRhythm;
  visualWeight: VisualWeight;
  sceneDensity: SceneDensity;
  layoutBias: LayoutBias;
  movementBias: MovementBias;
  cameraEnergy: CameraEnergy;
  transitionAggression: number;
  phraseCadence: number;
  harmonicStability: number;
  transientSharpness: number;
  stereoWidth: number;
  repetitionScore: number;
  visualComplexity: number;
  spacingBehavior: SpacingBehavior;
  layerCount: number;
  focalStability: number;
}

export interface AudioAnalysisSignals {
  tempo: number;
  energy: number;
  brightness: number;
  density: number;
  dynamics: number;
  spectralFlatness: number;
  transientSharpness: number;
  fluxVariance: number;
  stereoWidth: number;
  silenceRatio: number;
  beatConsistency: number;
  phraseCadence: number;
  harmonicStability: number;
  repetitionScore: number;
  focalStability: number;
  layerSpread: number;
  onsetClustering: number;
  centroidVariance: number;
  rmsVariance: number;
  subEnergy: number;
  highEnergy: number;
}
