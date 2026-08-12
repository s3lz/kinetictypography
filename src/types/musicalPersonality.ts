export interface RhythmicPersonality {
  groove: number;
  staccato: number;
  swing: number;
  repetition: number;
  irregularity: number;
}

export interface PerformanceTexture {
  humanity: number;
  imperfection: number;
  rawness: number;
  mechanicalness: number;
}

export interface AudioMotionCharacter {
  elasticity: number;
  physicality: number;
  flow: number;
  fragmentation: number;
}

export interface MusicalPersonality {
  rhythmicPersonality: RhythmicPersonality;
  performanceTexture: PerformanceTexture;
  motionCharacter: AudioMotionCharacter;
}

export type PaletteColorFamily =
  | "colorful-editorial"
  | "muted-cinematic"
  | "raw-poster"
  | "warm-analog"
  | "cool-technical"
  | "neon-synthetic";

export interface PaletteModel {
  baseTone: number;
  contrast: number;
  saturation: number;
  colorFamily: PaletteColorFamily;
}
