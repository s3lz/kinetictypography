export type GenerationStage =
  | "decoding-audio"
  | "analyzing-audio"
  | "scoring-fonts"
  | "creative-direction"
  | "mapping-state";

export interface GenerationProgress {
  stage: GenerationStage;
  detail?: string;
}
