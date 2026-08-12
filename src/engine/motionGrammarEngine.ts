import type {
  CameraBrief,
  CompositionDirection,
  VisualLanguage,
} from "@/types/designBrief";
import type { MotionLanguageBrief } from "@/types/motionLanguage";
import type {
  EmphasisPattern,
  EntrancePattern,
  ExitPattern,
  IdlePattern,
  MotionGrammar,
  MotionGrouping,
  SpatialDistribution,
  TimingModel,
  TransitionPattern,
} from "@/types/motionGrammar";
import { DEFAULT_MOTION_GRAMMAR } from "@/types/motionGrammar";

function deriveGrouping(
  brief: MotionLanguageBrief,
  composition: CompositionDirection,
  visualLanguage: VisualLanguage
): MotionGrouping {
  const comp = composition.composition.toLowerCase();

  if (comp.includes("burst") || brief.direction === "radial") return "glyph";
  if (comp.includes("column") || comp.includes("stack")) return "line";
  if (comp.includes("linear") || comp.includes("horizontal")) return "word";
  if (composition.textDensity === "dense") return "line";
  if (composition.textDensity === "sparse") return "glyph";

  if (brief.material === "mechanical" || visualLanguage.composition === "compressed") {
    return "word";
  }
  if (brief.material === "organic" || visualLanguage.composition === "expanded") {
    return "glyph";
  }

  return "word";
}

function deriveEntrancePattern(
  brief: MotionLanguageBrief,
  composition: CompositionDirection,
  camera: CameraBrief
): EntrancePattern {
  const comp = composition.composition.toLowerCase();

  if (brief.force === "explosive" || comp.includes("burst")) return "burst";
  if (brief.deformation === "fragmentation") return "burst";
  if (brief.timing === "staccato") return "stagger";
  if (brief.timing === "repetitive") return "assemble";
  if (camera.movement === "slow-drift" || brief.timing === "smooth") return "cascade";
  if (brief.force === "aggressive") return "stagger";

  return "cascade";
}

function deriveIdlePattern(
  brief: MotionLanguageBrief,
  camera: CameraBrief,
  visualLanguage: VisualLanguage
): IdlePattern {
  if (camera.movement === "locked" && brief.force === "subtle") return "freeze";
  if (brief.timing === "staccato" || brief.timing === "irregular") return "jitter";
  if (
    brief.material === "organic" ||
    brief.material === "elastic" ||
    visualLanguage.motionCharacter === "breathing"
  ) {
    return "breathing";
  }
  if (brief.material === "fluid" || visualLanguage.motionCharacter === "floating") {
    return "drift";
  }

  return "drift";
}

function deriveTransitionPattern(brief: MotionLanguageBrief): TransitionPattern {
  switch (brief.deformation) {
    case "fragmentation":
      return "fragment";
    case "stretch":
      return "stretch";
    case "scale":
      return "collapse";
    case "rotation":
      return "swap";
    default:
      if (brief.timing === "staccato") return "fragment";
      if (brief.material === "rigid") return "collapse";
      return "stretch";
  }
}

function deriveExitPattern(
  brief: MotionLanguageBrief,
  visualLanguage: VisualLanguage
): ExitPattern {
  if (brief.force === "explosive" || brief.deformation === "fragmentation") {
    return "scatter";
  }
  if (visualLanguage.edgeTreatment.includes("hard")) return "compress";
  if (visualLanguage.edgeTreatment.includes("soft")) return "dissolve";
  if (brief.force === "subtle") return "fade";

  return "fade";
}

function deriveSpatialDistribution(
  brief: MotionLanguageBrief,
  composition: CompositionDirection
): SpatialDistribution {
  const comp = composition.composition.toLowerCase();

  if (comp.includes("burst") || brief.direction === "radial") return "radial";
  if (comp.includes("edge") || comp.includes("margin")) return "edge";

  switch (brief.direction) {
    case "horizontal":
    case "vertical":
      return "linear";
    case "orbital":
      return "spiral";
    case "random":
      return "random";
    case "radial":
      return "radial";
    default:
      return "linear";
  }
}

function deriveTimingModel(brief: MotionLanguageBrief): TimingModel {
  if (brief.material === "elastic") return "elastic";
  if (brief.force === "explosive") return "overshoot";

  switch (brief.timing) {
    case "staccato":
      return "staccato";
    case "irregular":
      return "elastic";
    case "repetitive":
      return "constant";
    case "smooth":
      return "continuous";
    default:
      return "continuous";
  }
}

function deriveEmphasis(
  composition: CompositionDirection,
  visualLanguage: VisualLanguage
): EmphasisPattern {
  if (composition.composition.toLowerCase().includes("burst")) return "center";
  if (composition.alignment === "left") return "leading";
  if (composition.alignment === "right") return "trailing";
  if (visualLanguage.symmetry === "asymmetric") return "random";

  return "center";
}

export function deriveMotionGrammar(
  brief: MotionLanguageBrief,
  visualLanguage: VisualLanguage,
  composition: CompositionDirection = {
    composition: "center-column",
    negativeSpace: 0.7,
    alignment: "center",
    textDensity: "balanced",
  },
  camera: CameraBrief = { movement: "locked", zoomBehavior: "none" }
): MotionGrammar {
  return {
    grouping: deriveGrouping(brief, composition, visualLanguage),
    entrancePattern: deriveEntrancePattern(brief, composition, camera),
    idlePattern: deriveIdlePattern(brief, camera, visualLanguage),
    transitionPattern: deriveTransitionPattern(brief),
    exitPattern: deriveExitPattern(brief, visualLanguage),
    spatialDistribution: deriveSpatialDistribution(brief, composition),
    timingModel: deriveTimingModel(brief),
    emphasis: deriveEmphasis(composition, visualLanguage),
  };
}

export function mergeMotionGrammar(
  grammar: Partial<MotionGrammar> | undefined
): MotionGrammar {
  return {
    ...DEFAULT_MOTION_GRAMMAR,
    ...grammar,
  };
}
