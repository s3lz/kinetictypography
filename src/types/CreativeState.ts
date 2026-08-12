import type { FontId } from "../engine/fontSelector";
import type { FontRecommendation } from "./fontMetadata";
import {
  DEFAULT_BACKGROUND_STATE,
  type BackgroundState,
} from "./background";
import type {
  CameraConfig,
  LayoutConfig,
  MotionLanguageBrief,
  RendererDescriptor,
  TypographyConfig,
  VisualLanguage,
} from "./designBrief";
import type { MotionBehaviorBrief } from "./motionBehavior";
import type { PaletteBrief } from "./palette";
import {
  DEFAULT_MOTION_GRAMMAR,
  type MotionGrammar,
} from "./motionGrammar";
import type { MotionParamsMap } from "./motionMetadata";
import {
  DEFAULT_MOTION_PERSONALITY,
  type MotionPersonality,
} from "./motionPersonality";
import type {
  AnimationArc,
  CreativeReasoning,
  EnergyDistribution,
  FontTreatment,
  MotionSystem,
  PhysicalInterpretation,
  RendererIdentity,
  SongAtmosphere,
  TypographyConcept,
  TypographyIdentity,
  VisualWorld,
} from "./creativeInterpretation";
import { DEFAULT_ENERGY_DISTRIBUTION } from "./creativeInterpretation";
import {
  DEFAULT_FONT_PHYSICS,
  DEFAULT_PHYSICAL_MODEL,
  DEFAULT_TYPOGRAPHY_BEHAVIOR,
  type FontPhysics,
  type PhysicalModel,
  type TypographyBehavior,
} from "./physicalIdentity";

export type MotionDimension =
  | "float"
  | "wave"
  | "pulse"
  | "elastic"
  | "impact"
  | "material";

export const MOTION_DIMENSIONS: MotionDimension[] = [
  "float",
  "wave",
  "pulse",
  "elastic",
  "impact",
  "material",
];

export const MOTION_DIMENSION_LABELS: Record<MotionDimension, string> = {
  float: "Float",
  wave: "Wave",
  pulse: "Pulse",
  elastic: "Elastic",
  impact: "Impact",
  material: "Material",
};

export const MOTION_DIMENSION_DESCRIPTIONS: Record<MotionDimension, string> = {
  float:
    "Suspended underwater — slow vertical drift, weightless buoyancy, subtle rotation.",
  wave:
    "Fabric or water — movement propagates across glyphs as a connected field.",
  pulse:
    "Living breath — inhale, hold, exhale with organic scale and spacing swell.",
  elastic:
    "Rubber and springs — stretch, overshoot, and settle with physical energy.",
  impact:
    "Collision — anticipation, burst, and recovery driven by an envelope.",
  material:
    "Surface texture — ink bleed, paper vibration, subtle skew and opacity.",
};

export interface MotionLevels {
  float: number;
  wave: number;
  pulse: number;
  elastic: number;
  impact: number;
  material: number;
}

export const DEFAULT_MOTION_LEVELS: MotionLevels = {
  float: 62,
  wave: 0,
  pulse: 28,
  elastic: 0,
  impact: 0,
  material: 14,
};

/** Map legacy slider keys from older builds. */
export function normalizeMotionLevels(
  motion: Partial<MotionLevels> & Record<string, number | undefined>
): MotionLevels {
  return {
    float: motion.float ?? motion.floating ?? DEFAULT_MOTION_LEVELS.float,
    wave: motion.wave ?? DEFAULT_MOTION_LEVELS.wave,
    pulse: motion.pulse ?? motion.organic ?? DEFAULT_MOTION_LEVELS.pulse,
    elastic: motion.elastic ?? motion.kinetic ?? DEFAULT_MOTION_LEVELS.elastic,
    impact: motion.impact ?? DEFAULT_MOTION_LEVELS.impact,
    material: motion.material ?? motion.mechanical ?? DEFAULT_MOTION_LEVELS.material,
  };
}

export interface CreativeState {
  font: FontId;
  fontRecommendation: FontRecommendation;
  visualLanguage: VisualLanguage;
  artisticIntent: string;
  /** Creative interpretation layer — typography is the subject */
  physicalInterpretation: PhysicalInterpretation;
  typographyIdentity: TypographyIdentity;
  atmosphere: SongAtmosphere;
  visualWorld: VisualWorld;
  typographyConcept: TypographyConcept;
  motionSystem: MotionSystem;
  animationArc: AnimationArc;
  fontTreatment: FontTreatment;
  energyDistribution: EnergyDistribution;
  rendererIdentity: RendererIdentity;
  reasoning: CreativeReasoning;
  descriptors: RendererDescriptor[];
  layout: LayoutConfig;
  typography: TypographyConfig;
  motionLanguage: MotionLanguageBrief;
  motionBehavior: MotionBehaviorBrief;
  camera: CameraConfig;
  fontWeight: number;
  fontSize: number;
  tracking: number;
  kerning: number;
  palette: PaletteBrief;
  /**
   * Background renderer input. AI_COLOR uses palette.background;
   * UPLOADED_IMAGE ignores palette.background while active.
   */
  background: BackgroundState;
  motionProfile: {
    primary: MotionDimension;
    secondary: MotionDimension[];
  };
  motion: MotionLevels;
  motionParams: MotionParamsMap;
  /** Compiled from creative identity strings — drives executable motion uniqueness. */
  physicalModel: PhysicalModel;
  typographyBehavior: TypographyBehavior;
  fontPhysics: FontPhysics;
  motionGrammar: MotionGrammar;
  motionPersonality: MotionPersonality;
  animationSpeed: number;
  text: string;
}

export const defaultCreativeState: CreativeState = {
  font: "ballet",
  fontRecommendation: {
    primary: "ballet",
    confidence: 0,
    alternatives: [],
    reasoning: "",
  },
  visualLanguage: {
    geometry: "organic",
    composition: "expanded",
    spacing: "loose",
    symmetry: "asymmetric",
    edgeTreatment: "soft",
    motionCharacter: "floating",
    depth: "layered",
    texture: "smooth",
  },
  artisticIntent:
    "Word compresses to 0.9 at rest, expands to 1.12 on crests, tracking opens then recovers in 700ms.",
  physicalInterpretation: {
    phenomenon: "slow expansion and collapse of a single word mass",
    forces: "outward breath opposed by soft return",
    restState: "word at resting scale 1.0 with tight tracking",
    disruption: "scale rises to ~1.12 and tracking opens during crests",
    recovery: "scale and tracking ease back over 600–900ms",
  },
  typographyIdentity: {
    weight: "airy",
    rigidity: "low",
    flexibility: "high — gentle bend and breath",
    edgeBehavior: "soft edges allowed",
    spacingBehavior: "tracking breathes with scale",
    silhouetteBehavior: "soft outline holds",
    deformationTolerance: "scale ±12%; avoid fragmentation",
    metaphor: "breathing word mass",
    behavior: "slow expand/contract as one object",
  },
  atmosphere: {
    description: "slow expansion with soft recovery",
    emotionalTemperature: "warm openness with soft edges",
    tension: 0.35,
    intimacy: 0.6,
    movement: 0.4,
    complexity: 0.35,
    humanQuality: 0.55,
  },
  visualWorld: {
    field: "soft low-contrast wash",
    lighting: "muted-daylight",
    texture: "soft fiber",
    material: "paper",
    description: "Readable field for type: soft low-contrast wash. Not a scene.",
  },
  typographyConcept: {
    metaphor: "breathing word mass",
    behavior: "slow expand/contract as one object",
  },
  motionSystem: {
    motionAction: {
      primaryAction: "expansion",
      secondaryConsequence: "soft collapse back to rest scale",
      explanation: "scale rises to ~1.12 and tracking opens during crests",
    },
    animationRules: {
      wordBehavior: "word compresses on tension, expands on release",
      glyphBehavior: "almost none — life <1px",
      scale: "0.85 resting during tension; up to 1.15 on release",
      position: "slight vertical settle on release (2–4px)",
      rotation: "0–1°",
      spacing: "tracking increases during expansion; returns during recovery",
      deformation: "uniform scale; deformationTolerance low for glyphs",
      timing: "slow buildup, sudden release",
      intensityResponse: "higher intensity deepens rest↔peak scale contrast",
    },
    motionConcept: {
      metaphor: "expansion: scale rises to ~1.12 and tracking opens during crests",
      primaryMotion: "expansion",
      secondaryMotion: "soft collapse back to rest scale",
      intensityBehavior: "higher intensity deepens rest↔peak scale contrast",
      wordMovement: "word compresses on tension, expands on release",
      glyphMovement: "almost none — life <1px",
      cameraMovement: "locked",
    },
    motionLanguage: {
      force: "subtle",
      material: "fluid",
      timing: "smooth",
      deformation: "scale",
      direction: "vertical",
    },
    motionBehavior: {
      primary: "breathing",
      secondary: "reveal",
    },
    primaryPrimitive: "pulse",
    secondaryPrimitive: "float",
  },
  animationArc: {
    entrance: "word at resting scale 1.0 with tight tracking",
    development: "scale rises to ~1.12 and tracking opens during crests",
    peak: "maximum outward breath opposed by soft return",
    resolution: "scale and tracking ease back over 600–900ms",
  },
  fontTreatment: {
    role: "font body: airy, low rigidity",
    deformation: "scale ±12%; avoid fragmentation",
    spacing: "tracking breathes with scale",
    contrast: "soft outline holds",
    rigidity: "low",
    spacingBehavior: "tracking breathes with scale",
    edgeBehavior: "soft edges allowed",
    silhouettePreservation: "soft outline holds",
    flexibility: "high — gentle bend and breath",
    deformationTolerance: "scale ±12%; avoid fragmentation",
  },
  energyDistribution: { ...DEFAULT_ENERGY_DISTRIBUTION },
  rendererIdentity: {
    primaryMotion: "expansion",
    secondaryMotion: "soft collapse back to rest scale",
    wordMovement: "word compresses on tension, expands on release",
    glyphMovement: "almost none — life <1px",
    scaleBehavior: "0.85 resting during tension; up to 1.15 on release",
    positionBehavior: "slight vertical settle on release (2–4px)",
    rotationBehavior: "0–1°",
    spacingBehavior: "tracking increases during expansion; returns during recovery",
    deformationBehavior: "uniform scale; deformationTolerance low for glyphs",
    backgroundColor: "#f4f0e8",
    textColor: "#2a3d4f",
    composition: "center-column",
    camera: "locked",
  },
  reasoning: {
    creativeTranslation:
      "Forces: breath vs return. Action: expansion → soft collapse. Executable rest/disrupt/recover on the word.",
    whyThisSongNotAnother: "Expansion/contraction word physics — not genre floating or pulse defaults.",
    hiddenIdentityCheck:
      "Yes — driven by executable letter physics rather than genre labels.",
    selfCheck: {
      hiddenIdentity: true,
      uniquePhysicalBehavior: true,
      developerImplementable: true,
      fontGeometryOnly: true,
      avoidedGenericVisuals: true,
    },
  },
  descriptors: ["sparse", "elastic", "layered"],
  layout: {
    composition: "center-column",
    alignment: "center",
    negativeSpace: 0.72,
    textDensity: "sparse",
    maxTextWidth: 0.62,
    marginX: 0.12,
    marginY: 0.14,
    anchorX: 0.5,
    anchorY: 0.46,
    lineHeight: 1.28,
    scaleProgression: "uniform",
  },
  typography: {
    tracking: 0.8,
    kerningBias: 0.6,
    lineHeight: 1.28,
    scaleCurve: 1,
    rotationAllowance: 2,
    opacityBehavior: "constant",
    weightBehavior: "constant",
    scaleBehavior: "uniform",
    fontWeight: 300,
    fontSize: 56,
  },
  motionLanguage: {
    force: "subtle",
    material: "fluid",
    timing: "smooth",
    deformation: "none",
    direction: "orbital",
  },
  motionBehavior: {
    primary: "breathing",
    secondary: "orbit",
  },
  camera: {
    movement: "locked",
    zoomBehavior: "none",
    zoomScale: 1,
    driftAmplitude: 0,
    intensity: 0,
  },
  fontWeight: 300,
  fontSize: 56,
  tracking: 0,
  kerning: 0,
  palette: {
    background: "#f4f0e8",
    textColor: "#2a3d4f",
    strategy: "light-dark",
    material: "paper texture",
    lightBehavior: "soft-diffused",
    paletteReasoning:
      "Paper texture under soft diffused light — light field with dark typography, not warmth→beige mapping. Font had zero influence on palette.",
  },
  background: { ...DEFAULT_BACKGROUND_STATE },
  motionProfile: {
    primary: "float",
    secondary: ["pulse"],
  },
  motion: { ...DEFAULT_MOTION_LEVELS },
  motionParams: {},
  physicalModel: { ...DEFAULT_PHYSICAL_MODEL },
  typographyBehavior: { ...DEFAULT_TYPOGRAPHY_BEHAVIOR },
  fontPhysics: { ...DEFAULT_FONT_PHYSICS },
  motionGrammar: { ...DEFAULT_MOTION_GRAMMAR },
  motionPersonality: DEFAULT_MOTION_PERSONALITY,
  animationSpeed: 1,
  text: "your motion typography",
};
