import {
  MOTION_DIMENSIONS,
  type CreativeState,
  type MotionDimension,
} from "../../types/CreativeState";
import type { AudioAccent } from "./audioAccent";
import {
  applyAudioAccentLayer,
  resolveCreativeSpeed,
  updateMotionAudioDebug,
} from "./motionAudioInfluence";
import {
  applyMotionGrammar,
  applyTimingModel,
  buildGrammarContext,
  buildTextGroups,
} from "./motionGrammarOrchestrator";
import {
  resetMotionMappingDebug,
} from "./motionMapping";
import {
  isAllMotionSlidersZero,
} from "./motionIntensity";
import {
  applyMotionPersonality,
  getMotionPersonalityModifiers,
} from "./motionPersonalityOrchestrator";
import { resolveBehaviorPrimitiveWeights } from "./motionBehaviorPrimitives";
import {
  getRegisteredMotion,
  MATERIAL_BLEND_WEIGHT,
  registerMotionSystem,
} from "./motionRegistry";
import { normalizeLevel } from "./Unity";
import {
  IDENTITY_TRANSFORM,
  type CharMotionInput,
  type CharTransform,
} from "./types";
import {
  addTransforms,
  applyEnergyDistributionCohesion,
  blendCohesion,
  clampGlyphMotion,
  composeHierarchy,
  glyphOverlayLifeOnly,
  prepareLineLayer,
  prepareMaterialLayer,
  resolveMotionCohesion,
  scaleTransform,
  splitWordAndGlyph,
} from "./hierarchy";
import {
  applyPhysicalIdentityToGlyph,
  applyPhysicalIdentityToWord,
} from "./physicalIdentityMotion";
import { DEFAULT_ENERGY_DISTRIBUTION } from "../../types/creativeInterpretation";
import {
  DEFAULT_FONT_PHYSICS,
  DEFAULT_PHYSICAL_MODEL,
  DEFAULT_TYPOGRAPHY_BEHAVIOR,
} from "../../types/physicalIdentity";

export { registerMotionSystem, getRegisteredMotion as getMotionSystem };

function effectiveSliderLevel(
  motionType: MotionDimension,
  sliderLevel: number,
  profile: CreativeState["motionProfile"]
): number {
  if (sliderLevel <= 0) return 0;
  if (motionType === profile.primary) return sliderLevel;
  if (profile.secondary.includes(motionType)) return sliderLevel;
  return sliderLevel * 0.12;
}

function motionBlendWeight(
  motionType: MotionDimension,
  behaviorWeight: number,
  profile: CreativeState["motionProfile"]
): number {
  let weight = behaviorWeight;
  if (motionType === "material") {
    weight *= MATERIAL_BLEND_WEIGHT;
  }
  if (motionType === profile.primary) {
    weight *= 1.08;
  } else if (profile.secondary.includes(motionType)) {
    weight *= 1.04;
  }
  return weight;
}

function wordSeedIndex(start: number, end: number): number {
  if (end <= start) return start;
  return start + Math.floor((end - start) / 2);
}

function scaleSpatial(transform: CharTransform, spatialScale: number): CharTransform {
  return {
    ...transform,
    x: transform.x * spatialScale,
    y: transform.y * spatialScale,
    opacity: Math.max(0.2, transform.opacity),
  };
}

export interface ResolveMotionInput {
  charIndex: number;
  totalChars: number;
  time: number;
  state: CreativeState;
  spatialScale?: number;
  audioAccent?: AudioAccent;
}

/**
 * Layered motion for real DOM hierarchy:
 *   line wrapper ← line
 *   word wrapper ← word + 100% audio accent
 *   glyph span   ← variation + material + life-only overlays → clampGlyphMotion
 */
export interface ResolvedMotionLayers {
  word: CharTransform;
  line: CharTransform;
  glyph: CharTransform;
  material: CharTransform;
  /** Local glyph transform after compose + clampGlyphMotion (DOM-facing life). */
  local: CharTransform;
  cohesion: number;
  wordGroupIndex: number;
  lineGroupIndex: number;
}

const EMPTY_LAYERS: ResolvedMotionLayers = {
  word: IDENTITY_TRANSFORM,
  line: IDENTITY_TRANSFORM,
  glyph: IDENTITY_TRANSFORM,
  material: IDENTITY_TRANSFORM,
  local: IDENTITY_TRANSFORM,
  cohesion: 1,
  wordGroupIndex: 0,
  lineGroupIndex: 0,
};

/**
 * Hierarchical motion:
 *   CreativeState → Word Transform → Line Transform → Glyph Variation → Material
 *
 * Cohesion controls the split:
 *   wordAmplitude = base * cohesion
 *   glyphAmplitude = base * (1 - cohesion)
 */
export function resolveMotionLayers(input: ResolveMotionInput): ResolvedMotionLayers {
  const {
    charIndex,
    totalChars,
    time,
    state,
    spatialScale = 1,
    audioAccent,
  } = input;

  if (isAllMotionSlidersZero(state.motion)) {
    return EMPTY_LAYERS;
  }

  const accent = audioAccent ?? { beat: 0, energy: 0, transient: 0 };
  resetMotionMappingDebug();
  const grammar = state.motionGrammar;
  const personality = state.motionPersonality;
  const personalityModifiers = getMotionPersonalityModifiers(personality);

  const grammarContext = buildGrammarContext(
    state.text,
    charIndex,
    totalChars,
    grammar
  );

  const wordGroups = buildTextGroups(state.text, "word");
  const lineGroups = buildTextGroups(state.text, "line");
  const wordGroup =
    wordGroups.find((g) => charIndex >= g.startIndex && charIndex < g.endIndex) ??
    wordGroups[0];
  const lineGroup =
    lineGroups.find((g) => charIndex >= g.startIndex && charIndex < g.endIndex) ??
    lineGroups[0];

  const wordCharIndex = wordSeedIndex(wordGroup.startIndex, wordGroup.endIndex);
  const lineCharIndex = wordSeedIndex(lineGroup.startIndex, lineGroup.endIndex);
  const groupSize = Math.max(1, wordGroup.endIndex - wordGroup.startIndex);
  const charInGroup = charIndex - wordGroup.startIndex;

  const grammarTime = applyTimingModel(time, grammar);
  const creativeSpeed = resolveCreativeSpeed(state.animationSpeed);
  const behaviorWeights = resolveBehaviorPrimitiveWeights(state.motionBehavior);

  const baseFields = {
    totalChars: Math.max(1, totalChars),
    time,
    speed: creativeSpeed,
    audioAccent: accent,
    motionParams: state.motionParams,
    physicalModel: state.physicalModel ?? DEFAULT_PHYSICAL_MODEL,
    typographyBehavior: state.typographyBehavior ?? DEFAULT_TYPOGRAPHY_BEHAVIOR,
    fontPhysics: state.fontPhysics ?? DEFAULT_FONT_PHYSICS,
    wordCharIndex,
    lineCharIndex,
    groupIndex: wordGroup.groupIndex,
    charInGroup,
    groupSize,
  };

  const sliderLevels = {} as Record<MotionDimension, number>;
  const cohesionContributions: Array<{
    dimension: MotionDimension;
    level: number;
    cohesion: number;
  }> = [];

  let wordLayer = IDENTITY_TRANSFORM;
  let lineLayer = IDENTITY_TRANSFORM;
  let glyphLayer = IDENTITY_TRANSFORM;
  let materialLayer = IDENTITY_TRANSFORM;

  for (const motionType of MOTION_DIMENSIONS) {
    const rawLevel = normalizeLevel(state.motion[motionType]);
    const sliderLevel = effectiveSliderLevel(
      motionType,
      rawLevel,
      state.motionProfile
    );
    sliderLevels[motionType] = sliderLevel;
    if (sliderLevel <= 0) continue;

    const behaviorWeight = motionBlendWeight(
      motionType,
      behaviorWeights[motionType],
      state.motionProfile
    );
    if (behaviorWeight <= 0.01) continue;

    const system = getRegisteredMotion(motionType);

    const probeInput: CharMotionInput = {
      ...baseFields,
      charIndex,
      level: sliderLevel,
      independence: 0.2,
    };
    const cohesion = resolveMotionCohesion(motionType, probeInput);
    cohesionContributions.push({
      dimension: motionType,
      level: sliderLevel * behaviorWeight,
      cohesion,
    });

    if (motionType === "material") {
      const materialSample = system({
        ...baseFields,
        charIndex,
        level: sliderLevel,
        independence: 0.15,
        cohesion: 1,
        layer: "material",
      });
      materialLayer = addTransforms(
        materialLayer,
        scaleTransform(prepareMaterialLayer(materialSample, sliderLevel), behaviorWeight)
      );
      continue;
    }

    const glyphIndependence = Math.min(
      0.85,
      Math.max(0.05, (1 - cohesion) * personalityModifiers.independenceScale)
    );

    const wordSample = system({
      ...baseFields,
      charIndex: wordCharIndex,
      level: sliderLevel,
      independence: 0.06,
      cohesion,
      layer: "word",
    });

    // Glyph life is sampled at a fixed level so intensity grows word
    // locomotion only — not per-letter position/rotation.
    const glyphLifeLevel = Math.min(sliderLevel, 0.45);
    const glyphSample = system({
      ...baseFields,
      charIndex,
      level: glyphLifeLevel,
      independence: glyphIndependence,
      cohesion,
      layer: "glyph",
    });
    const wordAtLife = system({
      ...baseFields,
      charIndex: wordCharIndex,
      level: glyphLifeLevel,
      independence: 0.06,
      cohesion,
      layer: "word",
    });

    const lineSample = system({
      ...baseFields,
      charIndex: lineCharIndex,
      level: sliderLevel,
      independence: 0.02,
      cohesion,
      layer: "line",
    });

    const { word, glyph } = splitWordAndGlyph(
      wordSample,
      glyphSample,
      cohesion,
      sliderLevel,
      wordAtLife
    );

    wordLayer = addTransforms(wordLayer, scaleTransform(word, behaviorWeight));
    glyphLayer = addTransforms(glyphLayer, scaleTransform(glyph, behaviorWeight));
    lineLayer = addTransforms(
      lineLayer,
      scaleTransform(prepareLineLayer(lineSample, cohesion, sliderLevel), behaviorWeight)
    );
  }

  const overallCohesion = applyEnergyDistributionCohesion(
    blendCohesion(cohesionContributions),
    state.energyDistribution?.word ?? DEFAULT_ENERGY_DISTRIBUTION.word
  );
  // Overlay life is cohesion-damped only — intensity must not grow glyph motion.
  const overlayLife = 1 - overallCohesion * 0.75;

  let accentMotion = IDENTITY_TRANSFORM;
  for (const motionType of MOTION_DIMENSIONS) {
    const sliderLevel = sliderLevels[motionType];
    if (sliderLevel <= 0) continue;
    accentMotion = addTransforms(
      accentMotion,
      applyAudioAccentLayer(IDENTITY_TRANSFORM, motionType, accent, sliderLevel)
    );
  }

  // Audio accents: 100% word wrapper, 0% glyph.
  const physical = state.physicalModel ?? DEFAULT_PHYSICAL_MODEL;
  const typography = state.typographyBehavior ?? DEFAULT_TYPOGRAPHY_BEHAVIOR;
  const fontPhysics = state.fontPhysics ?? DEFAULT_FONT_PHYSICS;

  const wordWithIdentity = applyPhysicalIdentityToWord(
    addTransforms(wordLayer, accentMotion),
    grammarTime * creativeSpeed,
    physical,
    typography,
    fontPhysics
  );

  const grammarMotion = applyMotionGrammar(
    IDENTITY_TRANSFORM,
    grammarTime,
    grammar,
    grammarContext,
    spatialScale,
    { enableExit: false }
  );
  const personalityMotion = applyMotionPersonality(
    IDENTITY_TRANSFORM,
    grammarTime,
    personality,
    grammarContext,
    creativeSpeed
  );

  // Grammar/personality: strip continuous locomotion (jitter, fragment, xy/θ)
  // so glyphs keep subtle scale/opacity life only.
  let local = applyPhysicalIdentityToGlyph(
    addTransforms(glyphLayer, materialLayer),
    grammarTime * creativeSpeed,
    charInGroup,
    groupSize,
    physical,
    typography,
    fontPhysics
  );
  local = addTransforms(
    local,
    scaleTransform(glyphOverlayLifeOnly(grammarMotion), overlayLife * 0.35)
  );
  local = addTransforms(
    local,
    scaleTransform(glyphOverlayLifeOnly(personalityMotion), overlayLife * 0.12)
  );

  updateMotionAudioDebug(state.motion, accent, sliderLevels);

  const layers: ResolvedMotionLayers = {
    word: scaleSpatial(wordWithIdentity, spatialScale),
    line: scaleSpatial(lineLayer, spatialScale),
    glyph: scaleSpatial(glyphLayer, spatialScale),
    material: scaleSpatial(materialLayer, spatialScale),
    // Budget enforced after compose + spatial scale (what DOM receives).
    local: clampGlyphMotion(scaleSpatial(local, spatialScale)),
    cohesion: overallCohesion,
    wordGroupIndex: wordGroup.groupIndex,
    lineGroupIndex: lineGroup.groupIndex,
  };

  return layers;
}

/** Legacy flattened transform — composes layers for any remaining callers. */
export function resolveCharMotion(input: ResolveMotionInput): CharTransform {
  const layers = resolveMotionLayers(input);
  if (
    layers.word === IDENTITY_TRANSFORM &&
    layers.line === IDENTITY_TRANSFORM &&
    layers.local === IDENTITY_TRANSFORM
  ) {
    return IDENTITY_TRANSFORM;
  }

  return composeHierarchy({
    word: layers.word,
    line: layers.line,
    glyph: layers.local,
  });
}
