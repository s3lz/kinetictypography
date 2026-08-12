import type { AudioFeatures } from "./audio";
import type { SelectedFontMetadata } from "./fontMetadata";
import type {
  CameraBrief,
  CompositionDirection,
  MotionLanguageBrief,
  VisualLanguage,
} from "./designBrief";
import type { MotionBehaviorBrief } from "./motionBehavior";
import type { PaletteBrief } from "./palette";
import type {
  AnimationArc,
  ColorField,
  CreativeReasoning,
  EnergyDistribution,
  FontTreatment,
  MotionSystem,
  PhysicalInterpretation,
  RendererIdentity,
  SongAtmosphere,
  TypographyConcept,
  TypographyIdentity,
} from "./creativeInterpretation";

export interface SpecificityReasoning {
  whyThisSongNotAnother: string;
}

/**
 * Kinetic typography ENGINE brief.
 *
 * Audio → Physical forces → Typography behavior → Animation mechanics → Color → Renderer
 *
 * Metaphor is a thinking tool only. Every decision must become an animation rule.
 */
export interface CreativeDirection {
  physicalInterpretation: PhysicalInterpretation;
  typographyIdentity: TypographyIdentity;
  typographyConcept: TypographyConcept;
  atmosphere: SongAtmosphere;
  /** Color relationship supporting readable type — not a scene */
  visualWorld: ColorField;
  composition: CompositionDirection;
  motionSystem: MotionSystem;
  animationArc: AnimationArc;
  palette: PaletteBrief;
  fontTreatment: FontTreatment;
  camera: CameraBrief;
  energyDistribution: EnergyDistribution;
  rendererIdentity: RendererIdentity;
  reasoning: CreativeReasoning;

  visualLanguage: VisualLanguage;
  artisticIntent: string;
  motionLanguage: MotionLanguageBrief;
  motionBehavior: MotionBehaviorBrief;
  specificityReasoning?: SpecificityReasoning;
}

export interface CreativeDirectorInput {
  audioFeatures: AudioFeatures;
  selectedFont: SelectedFontMetadata;
}
