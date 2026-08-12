export type PerformanceStyle =
  | "live_band"
  | "atmospheric"
  | "synthetic"
  | "mechanical"
  | "intimate"
  | "hybrid";

export type EnergyType =
  | "restless"
  | "floating"
  | "controlled"
  | "surging"
  | "subdued";

export type RhythmFeel =
  | "staccato"
  | "slow"
  | "precise"
  | "swinging"
  | "loose"
  | "grid";

export type SongTexture =
  | "raw"
  | "smooth"
  | "clean"
  | "grainy"
  | "dissolved";

export type EmotionalTemperature =
  | "cool_tension"
  | "warm_space"
  | "cool"
  | "warm"
  | "hot"
  | "neutral";

export interface SongCharacter {
  performanceStyle: PerformanceStyle;
  energyType: EnergyType;
  rhythmFeel: RhythmFeel;
  texture: SongTexture;
  emotionalTemperature: EmotionalTemperature;
}
