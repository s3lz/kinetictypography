export type MotionGrouping = "glyph" | "word" | "line";

export type EntrancePattern = "stagger" | "burst" | "cascade" | "assemble";

export type IdlePattern = "drift" | "breathing" | "jitter" | "freeze";

export type TransitionPattern = "fragment" | "stretch" | "collapse" | "swap";

export type ExitPattern = "scatter" | "fade" | "dissolve" | "compress";

export type SpatialDistribution =
  | "radial"
  | "linear"
  | "edge"
  | "spiral"
  | "random";

export type TimingModel =
  | "constant"
  | "elastic"
  | "overshoot"
  | "staccato"
  | "continuous";

export type EmphasisPattern = "leading" | "trailing" | "center" | "random";

export const PREVIEW_MIN_OPACITY = 0.2;

export interface MotionGrammarOptions {
  /** When false (default), exit patterns are skipped so preview text stays visible. */
  enableExit?: boolean;
}

export interface MotionGrammar {
  grouping: MotionGrouping;
  entrancePattern: EntrancePattern;
  idlePattern: IdlePattern;
  transitionPattern: TransitionPattern;
  exitPattern: ExitPattern;
  spatialDistribution: SpatialDistribution;
  timingModel: TimingModel;
  emphasis: EmphasisPattern;
}

export const DEFAULT_MOTION_GRAMMAR: MotionGrammar = {
  grouping: "word",
  entrancePattern: "cascade",
  idlePattern: "drift",
  transitionPattern: "stretch",
  exitPattern: "fade",
  spatialDistribution: "linear",
  timingModel: "continuous",
  emphasis: "center",
};
