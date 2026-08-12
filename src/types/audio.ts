import type { EmotionalVector } from "./emotionalVector";
import type {
  AudioMotionCharacter,
  PerformanceTexture,
  RhythmicPersonality,
} from "./musicalPersonality";
import type { SongCharacter } from "./songCharacter";
import type { TempoInterpretation } from "./tempoAnalysis";
import type { AudioAnalysisSignals, VisualDNA } from "./visualDna";

export interface SemanticAudioProfile {
  moodHints: string[];
  textureHints: string[];
  spaceHints: string[];
  motionHints: string[];
  instrumentation: string[];
}

export interface AudioFeatures {
  /** Normalized BPM used for creative decisions. */
  tempo: number;

  tempoInterpretation: TempoInterpretation;

  rhythmicPersonality: RhythmicPersonality;

  performanceTexture: PerformanceTexture;

  /** Audio-level motion personality (not visual-language motionCharacter). */
  motionCharacter: AudioMotionCharacter;

  energy: number;
  // normalized 0-1

  brightness: number;
  // normalized 0-1

  density: number;
  // how layered/full the audio feels (0-1)

  dynamics: number;
  // difference between quiet and loud sections (0-1)

  semanticProfile: SemanticAudioProfile;

  emotionalVector: EmotionalVector;

  visualDna: VisualDNA;

  analysisSignals: AudioAnalysisSignals;

  songCharacter: SongCharacter;
}
