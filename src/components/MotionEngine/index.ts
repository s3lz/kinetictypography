export { computeIndependence, normalizeLevel } from "./Unity";
export {
  computeCohesionLevel,
  computeSpatialProfileModifier,
} from "./motionProfileWeights";
export {
  MOTION_COHESION_DEFAULTS,
  blendCohesion,
  resolveMotionCohesion,
  saturateIntensity,
  composeHierarchy,
  clampGlyphMotion,
  GLYPH_BUDGET,
  INTENSITY_CAPS,
} from "./hierarchy";
export {
  MOTION_REGISTRY,
  MATERIAL_BLEND_WEIGHT,
  getRegisteredMotion,
  registerMotionSystem,
} from "./motionRegistry";
export {
  getMotionSystem,
  resolveCharMotion,
  resolveMotionLayers,
} from "./MotionResolver";
export type { ResolvedMotionLayers, ResolveMotionInput } from "./MotionResolver";
export {
  applyMotionGrammar,
  applyTimingModel,
  buildGrammarContext,
  buildTextGroups,
} from "./motionGrammarOrchestrator";
export type { GrammarContext, TextGroup } from "./motionGrammarOrchestrator";
export {
  applyMotionPersonality,
  getMotionPersonalityModifiers,
} from "./motionPersonalityOrchestrator";
export {
  computeMotionIntensity,
  isAllMotionSlidersZero,
  isGlobalAnimationEnabled,
  isGlyphMotionInactive,
  isStaticPreviewMode,
} from "./motionIntensity";
export { sampleAudioAccent, ZERO_AUDIO_ACCENT, AUDIO_ACCENT_SMOOTHING } from "./audioAccent";
export type { AudioAccent } from "./audioAccent";
export {
  applyAudioAccentLayer,
  getLastMotionAudioDebug,
  MOTION_AUDIO_INFLUENCE,
} from "./motionAudioInfluence";
export type { MotionAudioDebug } from "./motionAudioInfluence";
export {
  getLastMotionMappingDebug,
  lerp,
  mapMotionAmplitude,
  mapMotionSpeed,
  smoothLevel,
} from "./motionMapping";
export type {
  CharMotionInput,
  CharTransform,
  MotionSystemFn,
  MotionHierarchyLayer,
} from "./types";
export { computeFloatMotion } from "./motions/float";
export { computeWaveMotion } from "./motions/wave";
export { computePulseMotion } from "./motions/pulse";
export { computeElasticMotion } from "./motions/elastic";
export { computeImpactMotion } from "./motions/impact";
export { computeMaterialMotion } from "./motions/material";
