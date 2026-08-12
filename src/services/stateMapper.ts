import fontLibrary from "@/data/fontLibrary.json";
import { deriveDescriptors } from "@/engine/descriptorEngine";
import { computeLayout } from "@/engine/layoutEngine";
import { computeCamera, resolveMotionFromBrief } from "@/engine/motionLanguageEngine";
import { computeTypography } from "@/engine/typographyEngine";
import { ensureCreativeInterpretation } from "@/lib/deriveCreativeInterpretation";
import type { AudioFeatures } from "@/types/audio";
import { DEFAULT_BACKGROUND_STATE } from "@/types/background";
import type { CreativeState } from "@/types/CreativeState";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { FontRecommendation, FontMetadata, SelectedFontMetadata } from "@/types/fontMetadata";
import { normalizeEnergyDistribution } from "@/types/creativeInterpretation";

const FONT_LIBRARY = fontLibrary as FontMetadata[];

function resolveFontMetadata(selectedFont: SelectedFontMetadata): FontMetadata {
  return (
    FONT_LIBRARY.find((font) => font.name === selectedFont.name) ?? FONT_LIBRARY[0]
  );
}

function enforceSelectedFont(
  selectedFont: SelectedFontMetadata,
  fontRecommendation: FontRecommendation
): FontRecommendation {
  if (fontRecommendation.primary === selectedFont.name) {
    return fontRecommendation;
  }

  console.warn("[Font Pipeline] fontRecommendation.primary mismatch — overwriting with selected font", {
    selectedFont: selectedFont.name,
    stalePrimary: fontRecommendation.primary,
  });

  return {
    ...fontRecommendation,
    primary: selectedFont.name,
  };
}

export function mapCreativeDirectionToState(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata,
  fontRecommendation: FontRecommendation,
  text = "your motion typography"
): CreativeState {
  const fontMetadata = resolveFontMetadata(selectedFont);
  const resolvedRecommendation = enforceSelectedFont(selectedFont, fontRecommendation);
  const interpreted = ensureCreativeInterpretation(
    direction,
    audioFeatures,
    selectedFont.name
  );

  const layout = computeLayout(
    interpreted.composition,
    interpreted.visualLanguage,
    audioFeatures,
    text.length
  );

  const typography = computeTypography(
    interpreted.visualLanguage,
    audioFeatures,
    fontMetadata,
    layout,
    interpreted.fontTreatment
  );

  const motion = resolveMotionFromBrief(
    interpreted.motionLanguage,
    interpreted.visualLanguage,
    audioFeatures,
    interpreted.composition,
    interpreted.camera,
    interpreted.artisticIntent,
    interpreted.motionBehavior,
    {
      physicalInterpretation: interpreted.physicalInterpretation,
      typographyIdentity: interpreted.typographyIdentity,
      motionSystem: interpreted.motionSystem,
      rendererIdentity: interpreted.rendererIdentity,
      fontTreatment: interpreted.fontTreatment,
    },
    fontMetadata
  );

  let camera = computeCamera(
    interpreted.camera,
    interpreted.visualLanguage,
    audioFeatures
  );

  // Scale camera energy from creative budget — camera is secondary to word.
  const energy = normalizeEnergyDistribution(interpreted.energyDistribution);
  camera = {
    ...camera,
    intensity: camera.intensity * (0.35 + energy.camera * 2.5),
    driftAmplitude: camera.driftAmplitude * (0.4 + energy.camera * 2),
  };

  const descriptors = deriveDescriptors(
    interpreted.visualLanguage,
    interpreted.composition
  );

  return {
    font: selectedFont.name,
    fontRecommendation: resolvedRecommendation,
    visualLanguage: interpreted.visualLanguage,
    artisticIntent: interpreted.artisticIntent,
    physicalInterpretation: interpreted.physicalInterpretation,
    typographyIdentity: interpreted.typographyIdentity,
    atmosphere: interpreted.atmosphere,
    visualWorld: interpreted.visualWorld,
    typographyConcept: interpreted.typographyConcept,
    motionSystem: interpreted.motionSystem,
    animationArc: interpreted.animationArc,
    fontTreatment: interpreted.fontTreatment,
    energyDistribution: energy,
    rendererIdentity: interpreted.rendererIdentity,
    reasoning: interpreted.reasoning,
    descriptors,
    layout,
    typography,
    motionLanguage: interpreted.motionLanguage,
    motionBehavior: interpreted.motionBehavior,
    camera,
    fontWeight: typography.fontWeight,
    fontSize: typography.fontSize,
    tracking: typography.tracking,
    kerning: typography.kerningBias,
    palette: interpreted.palette,
    background: { ...DEFAULT_BACKGROUND_STATE },
    motionProfile: motion.motionProfile,
    motion: motion.motion,
    motionParams: motion.motionParams,
    physicalModel: motion.physicalModel,
    typographyBehavior: motion.typographyBehavior,
    fontPhysics: motion.fontPhysics,
    motionGrammar: motion.motionGrammar,
    motionPersonality: motion.motionPersonality,
    animationSpeed: motion.animationSpeed,
    text,
  };
}
