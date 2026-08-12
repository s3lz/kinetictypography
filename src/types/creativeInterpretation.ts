import type { MotionDimension } from "./CreativeState";
import type { MotionBehaviorBrief } from "./motionBehavior";
import type { MotionLanguageBrief } from "./motionLanguage";

/**
 * Kinetic typography ENGINE brief.
 * Metaphor is a thinking tool only — every field must become an animation rule.
 */

/** Step 1 — audio as physical forces acting on the letterforms. */
export interface PhysicalInterpretation {
  /** Physical phenomenon the letters enact (not a place/object decoration) */
  phenomenon: string;
  /** What pulls against what */
  forces: string;
  /** Executable rest condition */
  restState: string;
  /** What audio disruption does to the type */
  disruption: string;
  /** How type recovers after disruption */
  recovery: string;
}

/**
 * Step 2 — font as physical body (geometry only).
 * Does NOT determine color, genre, mood, or environment.
 */
export interface TypographyIdentity {
  weight: string;
  rigidity: string;
  flexibility: string;
  edgeBehavior: string;
  spacingBehavior: string;
  silhouetteBehavior: string;
  deformationTolerance: string;
  /** Thinking-only helpers; prefer executable rules elsewhere */
  metaphor?: string;
  behavior?: string;
  /** Legacy aliases */
  movementPersonality?: string;
  physicalMaterial?: string;
  structuralBehavior?: string;
}

/** Compat alias for older consumers expecting metaphor/behavior. */
export type TypographyConcept = {
  metaphor: string;
  behavior: string;
};

/** Color relationship — readable letter on a supporting field (not a scene). */
export interface ColorField {
  field: string;
  lighting: string;
  texture: string;
  material: string;
  description: string;
}

export type VisualWorld = ColorField;

/** Supporting audio axes — not the starring story. */
export interface SongAtmosphere {
  description: string;
  emotionalTemperature: string;
  tension: number;
  intimacy: number;
  movement: number;
  complexity: number;
  humanQuality: number;
}

/** Step 3 — ONE dominant physical action + consequence. */
export interface TypographyMotionAction {
  primaryAction: string;
  secondaryConsequence: string;
  explanation: string;
}

/**
 * Step 4 — executable animation rules (renderer can implement without guessing).
 */
export interface ExecutableAnimationRules {
  wordBehavior: string;
  glyphBehavior: string;
  scale: string;
  position: string;
  rotation: string;
  spacing: string;
  deformation: string;
  timing: string;
  intensityResponse: string;
}

export interface MotionConcept {
  /** Thinking summary — must be backed by executable rules */
  metaphor: string;
  primaryMotion: string;
  secondaryMotion: string;
  intensityBehavior: string;
  wordMovement: string;
  glyphMovement: string;
  cameraMovement: string;
  /** Preferred primary action vocabulary */
  primaryAction?: string;
  secondaryConsequence?: string;
}

export interface MotionSystem {
  motionAction: TypographyMotionAction;
  animationRules: ExecutableAnimationRules;
  motionConcept: MotionConcept;
  motionLanguage: MotionLanguageBrief;
  motionBehavior: MotionBehaviorBrief;
  primaryPrimitive?: MotionDimension;
  secondaryPrimitive?: MotionDimension;
}

export interface AnimationArc {
  entrance: string;
  development: string;
  peak: string;
  resolution: string;
}

/** Font-as-body treatment — mirrors TypographyIdentity for styling engines. */
export interface FontTreatment {
  role: string;
  deformation: string;
  spacing: string;
  contrast: string;
  rigidity: string;
  spacingBehavior: string;
  edgeBehavior: string;
  silhouettePreservation: string;
  flexibility?: string;
  deformationTolerance?: string;
}

export interface EnergyDistribution {
  word: number;
  glyph: number;
  camera: number;
}

export const DEFAULT_ENERGY_DISTRIBUTION: EnergyDistribution = {
  word: 0.8,
  glyph: 0.15,
  camera: 0.05,
};

/**
 * Step 8 — final executable renderer object.
 * A developer must be able to implement this without guessing.
 */
export interface RendererIdentity {
  primaryMotion: string;
  secondaryMotion: string;
  wordMovement: string;
  glyphMovement: string;
  scaleBehavior: string;
  positionBehavior: string;
  rotationBehavior: string;
  spacingBehavior: string;
  deformationBehavior: string;
  backgroundColor: string;
  textColor: string;
  composition: string;
  camera: string;
  /** Legacy mirrors */
  motionIntensityBehavior?: string;
  cameraMovement?: string;
}

export interface CreativeReasoning {
  creativeTranslation: string;
  whyThisSongNotAnother: string;
  hiddenIdentityCheck: string;
  selfCheck?: {
    hiddenIdentity: boolean;
    uniquePhysicalBehavior: boolean;
    developerImplementable: boolean;
    fontGeometryOnly: boolean;
    avoidedGenericVisuals: boolean;
  };
}

export function normalizeEnergyDistribution(
  value: Partial<EnergyDistribution> | null | undefined
): EnergyDistribution {
  const word = clamp01(value?.word ?? DEFAULT_ENERGY_DISTRIBUTION.word);
  const glyph = clamp01(value?.glyph ?? DEFAULT_ENERGY_DISTRIBUTION.glyph);
  const camera = clamp01(value?.camera ?? DEFAULT_ENERGY_DISTRIBUTION.camera);
  const sum = word + glyph + camera;
  if (sum <= 0.001) return { ...DEFAULT_ENERGY_DISTRIBUTION };
  return {
    word: word / sum,
    glyph: glyph / sum,
    camera: camera / sum,
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
