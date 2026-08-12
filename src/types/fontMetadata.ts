import type { FontId } from "@/engine/fontSelector";

export interface FontStructure {
  strokeContrast: number;
  complexity: number;
  density: number;
  sharpness: number;
  roundness: number;
}

export interface FontMotionAffinity {
  floating: number;
  organic: number;
  mechanical: number;
  dissolve: number;
  impact: number;
  glitch: number;
  kinetic: number;
}

export interface FontEmotionalAffinities {
  dreamy: number;
  melancholic: number;
  energetic: number;
  dark: number;
  warm: number;
  nostalgic: number;
  futuristic: number;
}

export interface FontMotionPersonality {
  preferredEntrance: string;
  preferredIdle: string;
  preferredTransition: string;
  preferredExit: string;
}

export interface FontMetadata {
  name: FontId;
  category: string;
  personality: string[];
  visualIdentity: string[];
  creativeUseCases: string[];
  contrastPotential: number;
  structure: FontStructure;
  energy: number;
  experimental: number;
  motionAffinity: FontMotionAffinity;
  emotionalAffinities: FontEmotionalAffinities;
  motionPersonality: FontMotionPersonality;
}

export interface FontScoreBreakdown {
  fontId: FontId;
  total: number;
  motionPotential: number;
  visualTension: number;
  letterformPersonality: number;
  repetitionScore: number;
  /** How closely font literally maps song mood/genre — lower is preferred. */
  literalClicheMatch: number;
  /** Affinity between song character structure and letterform structure. */
  songCharacterFit?: number;
}

export interface FontRankingEntry extends FontScoreBreakdown {
  rank: number;
}

export interface FontRecommendation {
  primary: FontId;
  confidence: number;
  alternatives: FontId[];
  reasoning: string;
}

/** Font context for creative direction — styling only; no motionAffinity. */
export type FontStylingContext = Pick<
  FontMetadata,
  "name" | "category" | "visualIdentity" | "structure"
>;

/** Font context for creative direction — styling only; no motion/emotion metadata. */
export type SelectedFontMetadata = FontStylingContext;

export function toFontStylingContext(font: FontMetadata): FontStylingContext {
  return {
    name: font.name,
    category: font.category,
    visualIdentity: font.visualIdentity,
    structure: font.structure,
  };
}
