import type {
  CameraBrief,
  CameraMovement,
  CompositionDirection,
  TextAlignment,
  TextDensity,
  VisualLanguage,
  ZoomBehavior,
} from "../types/designBrief";
import {
  MOTION_DEFORMATIONS,
  MOTION_DIRECTIONS,
  MOTION_FORCES,
  MOTION_MATERIALS,
  MOTION_TIMINGS,
  type MotionDeformation,
  type MotionDirection,
  type MotionForce,
  type MotionLanguageBrief,
  type MotionMaterial,
  type MotionTiming,
} from "../types/motionLanguage";
import {
  MOTION_BEHAVIORS,
  type MotionBehaviorBrief,
} from "../types/motionBehavior";
import {
  LIGHT_BEHAVIORS,
  PALETTE_STRATEGIES,
  type LightBehavior,
  type PaletteBrief,
  type PaletteStrategy,
} from "../types/palette";
import type {
  AnimationArc,
  CreativeReasoning,
  EnergyDistribution,
  FontTreatment,
  MotionConcept,
  MotionSystem,
  PhysicalInterpretation,
  RendererIdentity,
  SongAtmosphere,
  TypographyConcept,
  TypographyIdentity,
  VisualWorld,
} from "../types/creativeInterpretation";
import {
  DEFAULT_ENERGY_DISTRIBUTION,
  normalizeEnergyDistribution,
} from "../types/creativeInterpretation";
import { MOTION_DIMENSIONS, type MotionDimension } from "../types/CreativeState";

function pickString(
  source: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "string"
      ? Number.parseFloat(value)
      : typeof value === "number"
        ? value
        : NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAlignment(value: unknown): TextAlignment {
  if (typeof value !== "string") return "center";
  const key = value.toLowerCase();
  if (key.includes("left")) return "left";
  if (key.includes("right")) return "right";
  return "center";
}

function normalizeDensity(value: unknown): TextDensity {
  if (typeof value !== "string") return "balanced";
  const key = value.toLowerCase();
  if (key.includes("sparse")) return "sparse";
  if (key.includes("dense")) return "dense";
  return "balanced";
}

function normalizeCameraMovement(value: unknown): CameraMovement {
  if (typeof value !== "string") return "locked";
  const key = value.toLowerCase();
  if (key.includes("orbit")) return "orbit";
  if (key.includes("drift")) return "slow-drift";
  return "locked";
}

function normalizeZoomBehavior(value: unknown): ZoomBehavior {
  if (typeof value !== "string") return "none";
  const key = value.toLowerCase();
  if (key.includes("pull")) return "slow-pull";
  if (key.includes("push")) return "slow-push";
  if (key.includes("pulse")) return "pulse";
  return "none";
}

function normalizeVisualLanguage(value: unknown): VisualLanguage | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const geometry = pickString(source, "geometry");
  const composition = pickString(source, "composition");
  const spacing = pickString(source, "spacing");
  const symmetry = pickString(source, "symmetry");
  const edgeTreatment = pickString(source, "edgeTreatment", "edge_treatment");
  const motionCharacter = pickString(source, "motionCharacter", "motion_character");
  const depth = pickString(source, "depth");
  const texture = pickString(source, "texture");

  if (
    !geometry ||
    !composition ||
    !spacing ||
    !symmetry ||
    !edgeTreatment ||
    !motionCharacter ||
    !depth ||
    !texture
  ) {
    return null;
  }

  return {
    geometry,
    composition,
    spacing,
    symmetry,
    edgeTreatment,
    motionCharacter,
    depth,
    texture,
  };
}

function normalizeComposition(value: unknown): CompositionDirection | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const composition = pickString(source, "composition");
  if (!composition) return null;

  let negativeSpace = normalizeNumber(source.negativeSpace ?? source.negative_space, 0.6);
  if (negativeSpace > 1 && negativeSpace <= 100) negativeSpace /= 100;
  negativeSpace = clamp01(negativeSpace);

  return {
    composition,
    negativeSpace,
    alignment: normalizeAlignment(source.alignment),
    textDensity: normalizeDensity(source.textDensity ?? source.text_density),
  };
}

function normalizeEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof value !== "string") return null;
  const key = value.toLowerCase().trim();
  return allowed.find((option) => option === key) ?? null;
}

function normalizeMotionForce(value: unknown): MotionForce {
  const direct = normalizeEnum(value, MOTION_FORCES);
  if (direct) return direct;
  if (typeof value !== "string") return "controlled";

  const key = value.toLowerCase();
  if (key.includes("explosive") || key.includes("extreme")) return "explosive";
  if (key.includes("aggressive") || key.includes("strong") || key.includes("heavy")) {
    return "aggressive";
  }
  if (key.includes("subtle") || key.includes("gentle") || key.includes("soft") || key.includes("low")) {
    return "subtle";
  }
  return "controlled";
}

function normalizeMotionMaterial(value: unknown): MotionMaterial {
  const direct = normalizeEnum(value, MOTION_MATERIALS);
  if (direct) return direct;
  if (typeof value !== "string") return "rigid";

  const key = value.toLowerCase();
  if (key.includes("kinetic") || key.includes("elastic")) return "elastic";
  if (key.includes("float") || key.includes("fluid") || key.includes("drift")) return "fluid";
  if (key.includes("organic") || key.includes("human") || key.includes("live")) return "organic";
  if (key.includes("mechanical") || key.includes("digital") || key.includes("robot")) {
    return "mechanical";
  }
  if (key.includes("rigid") || key.includes("solid") || key.includes("locked")) return "rigid";
  return "rigid";
}

function normalizeMotionTiming(value: unknown): MotionTiming {
  const direct = normalizeEnum(value, MOTION_TIMINGS);
  if (direct) return direct;
  if (typeof value !== "string") return "smooth";

  const key = value.toLowerCase();
  if (key.includes("staccato") || key.includes("burst") || key.includes("snap")) return "staccato";
  if (key.includes("irregular") || key.includes("chaotic") || key.includes("syncop")) {
    return "irregular";
  }
  if (key.includes("repetitive") || key.includes("grid") || key.includes("loop")) {
    return "repetitive";
  }
  return "smooth";
}

function normalizeMotionDeformation(value: unknown): MotionDeformation {
  const direct = normalizeEnum(value, MOTION_DEFORMATIONS);
  if (direct) return direct;
  if (typeof value !== "string") return "none";

  const key = value.toLowerCase();
  if (key.includes("fragment") || key.includes("glitch") || key.includes("shatter")) {
    return "fragmentation";
  }
  if (key.includes("stretch") || key.includes("warp")) return "stretch";
  if (key.includes("scale") || key.includes("pulse") || key.includes("bounce")) return "scale";
  if (key.includes("rotation") || key.includes("rotate") || key.includes("spin")) {
    return "rotation";
  }
  return "none";
}

function normalizeMotionDirection(value: unknown): MotionDirection {
  const direct = normalizeEnum(value, MOTION_DIRECTIONS);
  if (direct) return direct;
  if (typeof value !== "string") return "horizontal";

  const key = value.toLowerCase();
  if (
    key.includes("horizontal") ||
    key.includes("tear") ||
    key.includes("left") ||
    key.includes("right") ||
    key.includes("slide")
  ) {
    return "horizontal";
  }
  if (key.includes("vertical") || key.includes("rise") || key.includes("drop") || key.includes("up")) {
    return "vertical";
  }
  if (key.includes("radial") || key.includes("scatter") || key.includes("burst") || key.includes("explode")) {
    return "radial";
  }
  if (key.includes("orbital") || key.includes("drift") || key.includes("circular") || key.includes("orbit")) {
    return "orbital";
  }
  if (key.includes("random") || key.includes("chaos")) return "random";
  return "horizontal";
}

function normalizeMotionLanguageFromLegacy(
  source: Record<string, unknown>
): MotionLanguageBrief | null {
  const combined = [
    pickString(source, "entrance"),
    pickString(source, "idle"),
    pickString(source, "transition"),
    pickString(source, "exit"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!combined) return null;

  return {
    force: normalizeMotionForce(combined),
    material: normalizeMotionMaterial(combined),
    timing: normalizeMotionTiming(combined),
    deformation: normalizeMotionDeformation(combined),
    direction: normalizeMotionDirection(combined),
  };
}

function normalizeMotionLanguage(value: unknown): MotionLanguageBrief | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;

  if (
    pickString(source, "entrance") ||
    pickString(source, "idle") ||
    pickString(source, "transition") ||
    pickString(source, "exit")
  ) {
    return normalizeMotionLanguageFromLegacy(source);
  }

  const force = normalizeMotionForce(source.force);
  const material = normalizeMotionMaterial(source.material);
  const timing = normalizeMotionTiming(source.timing);
  const deformation = normalizeMotionDeformation(source.deformation);
  const direction = normalizeMotionDirection(source.direction);

  return { force, material, timing, deformation, direction };
}

function normalizeMotionBehavior(
  value: unknown,
  motionLanguage: MotionLanguageBrief
): MotionBehaviorBrief {
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const primaryRaw = pickString(source, "primary");
    const secondaryRaw = pickString(source, "secondary");
    const primary = MOTION_BEHAVIORS.find((b) => b === primaryRaw?.toLowerCase());
    const secondary = MOTION_BEHAVIORS.find((b) => b === secondaryRaw?.toLowerCase());
    if (primary) {
      return { primary, ...(secondary ? { secondary } : {}) };
    }
  }

  if (motionLanguage.deformation === "fragmentation") {
    return { primary: "collision", secondary: "impact" };
  }
  if (motionLanguage.timing === "staccato") {
    return { primary: "impact" };
  }
  if (motionLanguage.material === "fluid") {
    return { primary: "breathing", secondary: "dissolve" };
  }
  if (motionLanguage.material === "elastic") {
    return { primary: "stretch", secondary: "tension" };
  }
  if (motionLanguage.timing === "repetitive") {
    return { primary: "oscillation" };
  }
  return { primary: "breathing" };
}

function normalizeCamera(value: unknown): CameraBrief | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;

  return {
    movement: normalizeCameraMovement(source.movement),
    zoomBehavior: normalizeZoomBehavior(
      source.zoomBehavior ?? source.zoom_behavior
    ),
  };
}

const LEGACY_LIGHT_BEHAVIOR: Record<string, LightBehavior> = {
  "soft-haze": "soft-diffused",
  "bright-daylight": "bright-natural",
  "deep-shadow": "dramatic-shadows",
  "dramatic-contrast": "dramatic-shadows",
  "artificial-glow": "glowing-atmosphere",
  muted: "muted-daylight",
  luminous: "glowing-atmosphere",
};

const LEGACY_PALETTE_STRATEGY: Record<string, PaletteStrategy> = {
  atmospheric: "light-dark",
  editorial: "muted-contrast",
  "high-contrast": "muted-contrast",
  "vibrant-editorial": "complementary-surprise",
  "pastel-contrast": "muted-contrast",
  "atmospheric-gradient": "faded-cinematic",
  minimal: "monochromatic",
  analogous: "muted-contrast",
  complementary: "complementary-surprise",
};

function normalizeLightBehavior(value: unknown): LightBehavior {
  if (typeof value !== "string") return "soft-diffused";
  const key = value.toLowerCase().trim().replace(/\s+/g, "-");
  if (LEGACY_LIGHT_BEHAVIOR[key]) return LEGACY_LIGHT_BEHAVIOR[key];
  return (
    LIGHT_BEHAVIORS.find(
      (behavior) => key === behavior || key.includes(behavior.replace(/-/g, ""))
    ) ?? "soft-diffused"
  );
}

function normalizePaletteStrategy(value: unknown): PaletteStrategy {
  if (typeof value !== "string") return "light-dark";
  const key = value.toLowerCase().trim().replace(/\s+/g, "-");
  if (LEGACY_PALETTE_STRATEGY[key]) return LEGACY_PALETTE_STRATEGY[key];
  return (
    PALETTE_STRATEGIES.find(
      (strategy) => key === strategy || key.includes(strategy.replace(/-/g, ""))
    ) ?? "light-dark"
  );
}

function normalizePalette(value: unknown): PaletteBrief | null {
  if (!value || typeof value !== "object") return null;

  const palette = value as Record<string, unknown>;

  if (typeof palette.background !== "string") {
    return null;
  }

  const textColor =
    typeof palette.textColor === "string"
      ? palette.textColor
      : typeof palette.text_color === "string"
        ? palette.text_color
        : typeof palette.primary === "string"
          ? palette.primary
          : null;

  if (!textColor) {
    return null;
  }

  return {
    background: palette.background,
    textColor,
    strategy: normalizePaletteStrategy(palette.strategy),
    material:
      typeof palette.material === "string" && palette.material.trim()
        ? palette.material.trim()
        : "matte surface",
    lightBehavior: normalizeLightBehavior(palette.lightBehavior ?? palette.light_behavior),
    paletteReasoning:
      typeof palette.paletteReasoning === "string"
        ? palette.paletteReasoning.trim()
        : typeof palette.palette_reasoning === "string"
          ? palette.palette_reasoning.trim()
          : "",
  };
}

function normalizeSpecificityReasoning(value: unknown): { whyThisSongNotAnother: string } | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const why =
    typeof source.whyThisSongNotAnother === "string"
      ? source.whyThisSongNotAnother.trim()
      : typeof source.why_this_song_not_another === "string"
        ? source.why_this_song_not_another.trim()
        : "";
  if (!why) return null;
  return { whyThisSongNotAnother: why };
}

function normalizeAtmosphere(value: unknown): SongAtmosphere | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const description = pickString(source, "description", "summary");
  const emotionalTemperature = pickString(
    source,
    "emotionalTemperature",
    "emotional_temperature",
    "temperature"
  );
  if (!description || !emotionalTemperature) return null;
  return {
    description,
    emotionalTemperature,
    tension: clamp01(normalizeNumber(source.tension, 0.5)),
    intimacy: clamp01(normalizeNumber(source.intimacy, 0.5)),
    movement: clamp01(normalizeNumber(source.movement, 0.5)),
    complexity: clamp01(normalizeNumber(source.complexity, 0.5)),
    humanQuality: clamp01(
      normalizeNumber(source.humanQuality ?? source.human_quality, 0.5)
    ),
  };
}

function normalizeVisualWorld(value: unknown): VisualWorld | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const field = pickString(source, "field", "environment", "world", "place");
  const lighting = pickString(source, "lighting", "light");
  const texture = pickString(source, "texture");
  const material = pickString(source, "material") ?? texture ?? field;
  const description =
    pickString(source, "description") ??
    (field ? `Color field: ${field}` : undefined);
  if (!field || !lighting || !texture || !material || !description) return null;
  return { field, lighting, texture, material, description };
}

function normalizePhysicalInterpretation(value: unknown): PhysicalInterpretation | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const phenomenon = pickString(source, "phenomenon", "physical", "interpretation");
  const forces = pickString(source, "forces", "force") ?? "opposing physical forces";
  if (!phenomenon) return null;
  return {
    phenomenon,
    forces,
    restState:
      pickString(source, "restState", "rest_state", "rest") ??
      "word held as one cohesive mass at resting scale",
    disruption:
      pickString(source, "disruption", "peak", "event") ??
      "peak force deforms the word mass",
    recovery:
      pickString(source, "recovery", "return") ??
      "returns to rest with damping",
  };
}

function normalizeTypographyIdentity(
  value: unknown,
  fallbackConcept: TypographyConcept
): TypographyIdentity {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    weight: pickString(source, "weight") ?? "dense",
    rigidity: pickString(source, "rigidity") ?? "medium",
    flexibility: pickString(source, "flexibility") ?? "medium",
    edgeBehavior:
      pickString(source, "edgeBehavior", "edge_behavior") ?? "stable edges",
    spacingBehavior:
      pickString(source, "spacingBehavior", "spacing_behavior") ??
      "spacing follows word scale",
    silhouetteBehavior:
      pickString(source, "silhouetteBehavior", "silhouette_behavior", "silhouettePreservation") ??
      "preserve word silhouette",
    deformationTolerance:
      pickString(source, "deformationTolerance", "deformation_tolerance") ??
      "word ±15%; glyph life subtle",
    metaphor:
      pickString(source, "metaphor") ?? fallbackConcept.metaphor,
    behavior:
      pickString(source, "behavior") ?? fallbackConcept.behavior,
    movementPersonality: pickString(source, "movementPersonality", "movement_personality"),
    physicalMaterial: pickString(source, "physicalMaterial", "physical_material", "material"),
    structuralBehavior: pickString(source, "structuralBehavior", "structural_behavior"),
  };
}

function normalizeTypographyConcept(value: unknown): TypographyConcept | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const metaphor = pickString(source, "metaphor", "concept", "identity");
  const behavior = pickString(source, "behavior", "motion", "action");
  if (!metaphor || !behavior) return null;
  return { metaphor, behavior };
}

function normalizeMotionAction(
  value: unknown,
  fallbackPrimary: string,
  fallbackSecondary: string
): { primaryAction: string; secondaryConsequence: string; explanation: string } {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    primaryAction:
      pickString(source, "primaryAction", "primary_action", "primary") ?? fallbackPrimary,
    secondaryConsequence:
      pickString(source, "secondaryConsequence", "secondary_consequence", "secondary") ??
      fallbackSecondary,
    explanation:
      pickString(source, "explanation") ??
      `${fallbackPrimary} with consequence ${fallbackSecondary}`,
  };
}

function normalizeAnimationRules(
  value: unknown,
  wordFallback: string,
  glyphFallback: string
): {
  wordBehavior: string;
  glyphBehavior: string;
  scale: string;
  position: string;
  rotation: string;
  spacing: string;
  deformation: string;
  timing: string;
  intensityResponse: string;
} {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    wordBehavior: pickString(source, "wordBehavior", "word_behavior") ?? wordFallback,
    glyphBehavior: pickString(source, "glyphBehavior", "glyph_behavior") ?? glyphFallback,
    scale: pickString(source, "scale") ?? "rest ~1.0; peaks ±10–15%",
    position: pickString(source, "position") ?? "word-level translation preferred",
    rotation: pickString(source, "rotation") ?? "≤2°",
    spacing: pickString(source, "spacing") ?? "follows word scale",
    deformation: pickString(source, "deformation") ?? "word-dominant deformation",
    timing: pickString(source, "timing") ?? "attack on peaks; damped recovery",
    intensityResponse:
      pickString(source, "intensityResponse", "intensity_response") ??
      "higher intensity increases word displacement/spring — glyph stays nearly constant",
  };
}

function normalizeMotionConcept(value: unknown): MotionConcept | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const metaphor = pickString(source, "metaphor");
  const primaryMotion = pickString(source, "primaryMotion", "primary_motion", "primary");
  const secondaryMotion =
    pickString(source, "secondaryMotion", "secondary_motion", "secondary") ?? "release";
  const intensityBehavior =
    pickString(source, "intensityBehavior", "intensity_behavior") ??
    "Higher intensity increases word displacement and rebound; glyph motion stays nearly constant.";
  if (!metaphor || !primaryMotion) return null;
  return {
    metaphor,
    primaryMotion,
    secondaryMotion,
    intensityBehavior,
    wordMovement:
      pickString(source, "wordMovement", "word_movement") ??
      "Word acts as one physical object under the primary action.",
    glyphMovement:
      pickString(source, "glyphMovement", "glyph_movement") ??
      "Subtle life only — no competing locomotion.",
    cameraMovement:
      pickString(source, "cameraMovement", "camera_movement") ?? "locked",
    primaryAction: pickString(source, "primaryAction", "primary_action"),
    secondaryConsequence: pickString(
      source,
      "secondaryConsequence",
      "secondary_consequence"
    ),
  };
}

function normalizePrimitive(value: unknown): MotionDimension | undefined {
  if (typeof value !== "string") return undefined;
  const key = value.toLowerCase().trim();
  return MOTION_DIMENSIONS.find((dim) => dim === key);
}

function normalizeMotionSystem(
  value: unknown,
  fallbackLanguage: MotionLanguageBrief,
  fallbackBehavior: MotionBehaviorBrief
): MotionSystem {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const motionLanguage =
    normalizeMotionLanguage(source.motionLanguage ?? source.motion_language) ??
    fallbackLanguage;

  const motionBehavior = normalizeMotionBehavior(
    source.motionBehavior ?? source.motion_behavior,
    motionLanguage
  );

  const motionConcept =
    normalizeMotionConcept(source.motionConcept ?? source.motion_concept) ??
    ({
      metaphor: `The text performs ${motionBehavior.primary} as a single word object.`,
      primaryMotion: motionBehavior.primary,
      secondaryMotion: motionBehavior.secondary ?? "release",
      intensityBehavior:
        "Higher intensity increases word displacement, scale anticipation, and rebound — glyph motion stays nearly constant.",
      wordMovement: "Word acts as one physical object under the primary action.",
      glyphMovement: "Subtle life only — no competing locomotion.",
      cameraMovement: "locked",
    } satisfies MotionConcept);

  const motionAction = normalizeMotionAction(
    source.motionAction ?? source.motion_action,
    motionConcept.primaryAction || motionConcept.primaryMotion,
    motionConcept.secondaryConsequence || motionConcept.secondaryMotion
  );

  const animationRules = normalizeAnimationRules(
    source.animationRules ?? source.animation_rules,
    motionConcept.wordMovement,
    motionConcept.glyphMovement
  );

  return {
    motionAction,
    animationRules,
    motionConcept: {
      ...motionConcept,
      primaryMotion: motionAction.primaryAction,
      secondaryMotion: motionAction.secondaryConsequence,
      primaryAction: motionAction.primaryAction,
      secondaryConsequence: motionAction.secondaryConsequence,
    },
    motionLanguage,
    motionBehavior: motionBehavior.primary ? motionBehavior : fallbackBehavior,
    primaryPrimitive: normalizePrimitive(
      source.primaryPrimitive ?? source.primary_primitive
    ),
    secondaryPrimitive: normalizePrimitive(
      source.secondaryPrimitive ?? source.secondary_primitive
    ),
  };
}

function normalizeAnimationArc(value: unknown): AnimationArc | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const entrance = pickString(source, "entrance");
  const development = pickString(source, "development", "body");
  const peak = pickString(source, "peak", "climax");
  const resolution = pickString(source, "resolution", "exit", "settle");
  if (!entrance || !development || !peak || !resolution) return null;
  return { entrance, development, peak, resolution };
}

function normalizeFontTreatment(value: unknown): FontTreatment | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const role = pickString(source, "role", "materialRole", "material_role");
  const deformation = pickString(source, "deformation");
  const spacing = pickString(source, "spacing");
  const contrast = pickString(source, "contrast");
  if (!role || !deformation || !spacing || !contrast) return null;
  return {
    role,
    deformation,
    spacing,
    contrast,
    rigidity: pickString(source, "rigidity") ?? "medium",
    spacingBehavior:
      pickString(source, "spacingBehavior", "spacing_behavior") ??
      "compress or expand with word scale",
    edgeBehavior:
      pickString(source, "edgeBehavior", "edge_behavior") ?? "keep edges stable",
    silhouettePreservation:
      pickString(source, "silhouettePreservation", "silhouette_preservation") ??
      "preserve silhouette as the object moves",
    flexibility: pickString(source, "flexibility"),
    deformationTolerance: pickString(
      source,
      "deformationTolerance",
      "deformation_tolerance"
    ),
  };
}

function normalizeRendererIdentity(
  value: unknown,
  motionConcept: MotionConcept,
  animationRules: {
    scale: string;
    position: string;
    rotation: string;
    spacing: string;
    deformation: string;
  },
  composition: string,
  backgroundColor: string,
  textColor: string,
  cameraMovement: string
): RendererIdentity {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    primaryMotion:
      pickString(source, "primaryMotion", "primary_motion") ?? motionConcept.primaryMotion,
    secondaryMotion:
      pickString(source, "secondaryMotion", "secondary_motion") ??
      motionConcept.secondaryMotion,
    wordMovement:
      pickString(source, "wordMovement", "word_movement") ?? motionConcept.wordMovement,
    glyphMovement:
      pickString(source, "glyphMovement", "glyph_movement") ?? motionConcept.glyphMovement,
    scaleBehavior: pickString(source, "scaleBehavior", "scale_behavior") ?? animationRules.scale,
    positionBehavior:
      pickString(source, "positionBehavior", "position_behavior") ?? animationRules.position,
    rotationBehavior:
      pickString(source, "rotationBehavior", "rotation_behavior") ?? animationRules.rotation,
    spacingBehavior:
      pickString(source, "spacingBehavior", "spacing_behavior") ?? animationRules.spacing,
    deformationBehavior:
      pickString(source, "deformationBehavior", "deformation_behavior") ??
      animationRules.deformation,
    backgroundColor:
      pickString(source, "backgroundColor", "background_color") ?? backgroundColor,
    textColor: pickString(source, "textColor", "text_color") ?? textColor,
    composition: pickString(source, "composition") ?? composition,
    camera:
      pickString(source, "camera", "cameraMovement", "camera_movement") ?? cameraMovement,
    motionIntensityBehavior:
      pickString(source, "motionIntensityBehavior", "motion_intensity_behavior") ??
      motionConcept.intensityBehavior,
    cameraMovement:
      pickString(source, "cameraMovement", "camera_movement") ?? cameraMovement,
  };
}

function normalizeReasoning(
  value: unknown,
  artisticIntent: string,
  specificity?: { whyThisSongNotAnother: string } | null
): CreativeReasoning {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const why =
    pickString(source, "whyThisSongNotAnother", "why_this_song_not_another") ??
    specificity?.whyThisSongNotAnother ??
    artisticIntent;

  return {
    creativeTranslation:
      pickString(source, "creativeTranslation", "creative_translation") ??
      artisticIntent,
    whyThisSongNotAnother: why,
    hiddenIdentityCheck:
      pickString(source, "hiddenIdentityCheck", "hidden_identity_check") ??
      "Direction is based on physical letter behavior and material color, not title, artist, or genre scenery.",
  };
}

function normalizeEnergyDist(value: unknown): EnergyDistribution {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ENERGY_DISTRIBUTION };
  }
  const source = value as Record<string, unknown>;
  return normalizeEnergyDistribution({
    word: normalizeNumber(source.word, DEFAULT_ENERGY_DISTRIBUTION.word),
    glyph: normalizeNumber(source.glyph, DEFAULT_ENERGY_DISTRIBUTION.glyph),
    camera: normalizeNumber(source.camera, DEFAULT_ENERGY_DISTRIBUTION.camera),
  });
}

function unwrapCreativeDirection(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const nested =
    record.creativeDirection ??
    record.designBrief ??
    record.design_brief ??
    record.direction ??
    record.result;

  if (nested && typeof nested === "object") {
    return nested as Record<string, unknown>;
  }

  return record;
}

export function normalizeCreativeDirection(
  value: unknown
): Record<string, unknown> | null {
  const unwrapped = unwrapCreativeDirection(value);
  if (!unwrapped) return null;

  const direction = { ...unwrapped };
  delete direction.fontRecommendation;
  delete direction.font;
  delete direction.selectedFont;
  delete direction.error;
  delete direction.stage;
  delete direction.validationErrors;

  const motionSystemSource =
    direction.motionSystem ?? direction.motion_system ?? {};

  const motionLanguage =
    normalizeMotionLanguage(
      (motionSystemSource as Record<string, unknown>).motionLanguage ??
        (motionSystemSource as Record<string, unknown>).motion_language ??
        direction.motionLanguage ??
        direction.motion_language
    ) ?? null;
  if (!motionLanguage) return null;

  const motionBehavior = normalizeMotionBehavior(
    (motionSystemSource as Record<string, unknown>).motionBehavior ??
      (motionSystemSource as Record<string, unknown>).motion_behavior ??
      direction.motionBehavior ??
      direction.motion_behavior,
    motionLanguage
  );

  const motionSystem = normalizeMotionSystem(
    motionSystemSource,
    motionLanguage,
    motionBehavior
  );

  const typographyConcept =
    normalizeTypographyConcept(
      direction.typographyConcept ?? direction.typography_concept
    ) ??
    ({
      metaphor: motionSystem.motionConcept.metaphor,
      behavior: motionSystem.motionConcept.metaphor,
    } satisfies TypographyConcept);

  const typographyIdentity = normalizeTypographyIdentity(
    direction.typographyIdentity ?? direction.typography_identity,
    typographyConcept
  );

  const physicalInterpretation =
    normalizePhysicalInterpretation(
      direction.physicalInterpretation ?? direction.physical_interpretation
    ) ??
    ({
      phenomenon: typographyIdentity.metaphor || typographyConcept.metaphor,
      forces: "opposing physical forces on the word mass",
      restState: "word held as one cohesive mass at resting scale",
      disruption: typographyConcept.behavior,
      recovery: "returns to rest with damping",
    } satisfies PhysicalInterpretation);

  const artisticIntent =
    pickString(direction, "artisticIntent", "artistic_intent", "intent") ??
    motionSystem.motionConcept.metaphor ??
    typographyConcept.behavior;

  const visualLanguage = normalizeVisualLanguage(
    direction.visualLanguage ?? direction.visual_language
  );
  if (!visualLanguage) return null;

  const composition = normalizeComposition(direction.composition ?? direction.layout);
  if (!composition) return null;

  const camera = normalizeCamera(direction.camera);
  if (!camera) return null;

  const palette = normalizePalette(direction.palette);
  if (!palette) return null;

  const atmosphere = normalizeAtmosphere(direction.atmosphere);
  const visualWorld =
    normalizeVisualWorld(direction.visualWorld ?? direction.visual_world) ??
    ({
      field: palette.material || "quiet matte wash",
      lighting: palette.lightBehavior,
      texture: palette.material || "flat pigment",
      material: palette.material || "paper",
      description: palette.paletteReasoning || `Color field: ${palette.material}`,
    } satisfies VisualWorld);

  const animationArc =
    normalizeAnimationArc(direction.animationArc ?? direction.animation_arc) ??
    ({
      entrance: "type settles into composition",
      development: "word-level locomotion follows the song body",
      peak: "maximum word energy",
      resolution: "motion decays while silhouette remains readable",
    } satisfies AnimationArc);

  const fontTreatment =
    normalizeFontTreatment(direction.fontTreatment ?? direction.font_treatment) ??
    ({
      role: `font body: ${typographyIdentity.weight}`,
      deformation: typographyIdentity.deformationTolerance,
      spacing: typographyIdentity.spacingBehavior,
      contrast: typographyIdentity.silhouetteBehavior,
      rigidity: typographyIdentity.rigidity,
      spacingBehavior: typographyIdentity.spacingBehavior,
      edgeBehavior: typographyIdentity.edgeBehavior,
      silhouettePreservation: typographyIdentity.silhouetteBehavior,
      flexibility: typographyIdentity.flexibility,
      deformationTolerance: typographyIdentity.deformationTolerance,
    } satisfies FontTreatment);

  const specificityReasoning = normalizeSpecificityReasoning(
    direction.specificityReasoning ?? direction.specificity_reasoning
  );

  const reasoning = normalizeReasoning(
    direction.reasoning,
    artisticIntent,
    specificityReasoning
  );

  const energyDistribution = normalizeEnergyDist(
    direction.energyDistribution ?? direction.energy_distribution
  );

  const resolvedAtmosphere: SongAtmosphere = atmosphere ?? {
    description: typographyConcept.metaphor,
    emotionalTemperature: "interpreted from audio",
    tension: 0.5,
    intimacy: 0.5,
    movement: 0.5,
    complexity: 0.5,
    humanQuality: 0.5,
  };

  const syncedPalette = {
    ...palette,
    material: palette.material || visualWorld.material,
  };

  const rendererIdentity = normalizeRendererIdentity(
    direction.rendererIdentity ?? direction.renderer_identity,
    motionSystem.motionConcept,
    motionSystem.animationRules,
    composition.composition,
    syncedPalette.background,
    syncedPalette.textColor,
    camera.movement
  );

  return {
    physicalInterpretation,
    typographyIdentity,
    typographyConcept: {
      metaphor:
        typographyIdentity.metaphor ||
        typographyConcept.metaphor ||
        physicalInterpretation.phenomenon,
      behavior:
        typographyIdentity.behavior ||
        typographyConcept.behavior ||
        physicalInterpretation.disruption,
    },
    atmosphere: resolvedAtmosphere,
    visualWorld,
    composition,
    motionSystem,
    animationArc,
    palette: syncedPalette,
    fontTreatment,
    camera,
    energyDistribution,
    rendererIdentity,
    visualLanguage,
    artisticIntent,
    motionLanguage: motionSystem.motionLanguage,
    motionBehavior: motionSystem.motionBehavior,
    reasoning,
    specificityReasoning: {
      whyThisSongNotAnother: reasoning.whyThisSongNotAnother,
    },
  };
}

export function describeValidationFailure(value: unknown): string {
  const direction = unwrapCreativeDirection(value);
  if (!direction) {
    return "response was not a JSON object";
  }

  if (!pickString(direction, "artisticIntent", "artistic_intent", "intent")) {
    const motionSystem = direction.motionSystem ?? direction.motion_system;
    if (
      !motionSystem ||
      typeof motionSystem !== "object" ||
      !normalizeMotionConcept(
        (motionSystem as Record<string, unknown>).motionConcept ??
          (motionSystem as Record<string, unknown>).motion_concept
      )
    ) {
      return "missing artisticIntent and motionSystem.motionConcept";
    }
  }
  if (!normalizeVisualLanguage(direction.visualLanguage ?? direction.visual_language)) {
    return "missing or invalid visualLanguage (all string fields required)";
  }
  if (!normalizeComposition(direction.composition ?? direction.layout)) {
    return "missing or invalid composition";
  }
  const motionSource = direction.motionSystem ?? direction.motion_system ?? direction;
  const motionLang =
    typeof motionSource === "object"
      ? (motionSource as Record<string, unknown>).motionLanguage ??
        (motionSource as Record<string, unknown>).motion_language ??
        direction.motionLanguage ??
        direction.motion_language
      : direction.motionLanguage ?? direction.motion_language;
  if (!normalizeMotionLanguage(motionLang)) {
    if (!motionLang || typeof motionLang !== "object") {
      return "missing motionLanguage (inside motionSystem or top-level)";
    }
    return `invalid motionLanguage — got ${JSON.stringify(motionLang)}; expected force/material/timing/deformation/direction enums`;
  }
  if (!normalizeCamera(direction.camera)) return "missing or invalid camera";
  if (!normalizePalette(direction.palette)) return "missing or invalid palette";

  return "unknown normalization failure";
}
