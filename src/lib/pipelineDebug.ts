import type { CreativeFactorSources } from "@/lib/creativeFactors";
import { deriveCreativeFactorSources } from "@/lib/creativeFactors";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeState } from "@/types/CreativeState";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { PaletteBrief } from "@/types/palette";

export interface PipelineDebugSnapshot {
  creativeFactors: CreativeFactorSources;
  creativeDirection: {
    palette: CreativeDirection["palette"];
    composition: CreativeDirection["composition"];
    camera: CreativeDirection["camera"];
    motionLanguage: CreativeDirection["motionLanguage"];
    motionBehavior: CreativeDirection["motionBehavior"];
    lightBehavior: PaletteBrief["lightBehavior"];
    paletteReasoning: string;
    visualLanguage: CreativeDirection["visualLanguage"];
    artisticIntent: string;
  };
  creativeState: {
    motion: CreativeState["motion"];
    motionProfile: CreativeState["motionProfile"];
    motionBehavior: CreativeState["motionBehavior"];
    motionGrammar: CreativeState["motionGrammar"];
    motionPersonality: CreativeState["motionPersonality"];
    motionParams: CreativeState["motionParams"];
    physicalModel: CreativeState["physicalModel"];
    typographyBehavior: CreativeState["typographyBehavior"];
    fontPhysics: CreativeState["fontPhysics"];
    animationSpeed: CreativeState["animationSpeed"];
    palette: CreativeState["palette"];
    camera: CreativeState["camera"];
    layout: CreativeState["layout"];
    typography: Pick<
      CreativeState["typography"],
      "tracking" | "lineHeight" | "rotationAllowance"
    >;
    visualLanguage: Pick<
      CreativeState["visualLanguage"],
      "geometry" | "edgeTreatment" | "spacing" | "texture"
    >;
  };
  fontInfluence?: {
    topFontAffinity: string;
    topMotionSlider: string;
    affinityMirrorsSlider: boolean;
    passed: boolean;
  };
}

export function buildPipelineDebugSnapshot(
  direction: CreativeDirection,
  state: CreativeState,
  audioFeatures?: AudioFeatures
): PipelineDebugSnapshot {
  const creativeFactors = audioFeatures
    ? deriveCreativeFactorSources(audioFeatures)
    : {
        intensitySource: "unavailable",
        spatialSource: "unavailable",
        rhythmSource: "unavailable",
        materialSource: "unavailable",
      };

  return {
    creativeFactors,
    creativeDirection: {
      palette: direction.palette,
      composition: direction.composition,
      camera: direction.camera,
      motionLanguage: direction.motionLanguage,
      motionBehavior: direction.motionBehavior,
      lightBehavior: direction.palette.lightBehavior,
      paletteReasoning: direction.palette.paletteReasoning,
      visualLanguage: direction.visualLanguage,
      artisticIntent: direction.artisticIntent,
    },
    creativeState: {
      motion: state.motion,
      motionProfile: state.motionProfile,
      motionBehavior: state.motionBehavior,
      motionGrammar: state.motionGrammar,
      motionPersonality: state.motionPersonality,
      motionParams: state.motionParams,
      physicalModel: state.physicalModel,
      typographyBehavior: state.typographyBehavior,
      fontPhysics: state.fontPhysics,
      animationSpeed: state.animationSpeed,
      palette: state.palette,
      camera: state.camera,
      layout: state.layout,
      typography: {
        tracking: state.tracking,
        lineHeight: state.typography.lineHeight,
        rotationAllowance: state.typography.rotationAllowance,
      },
      visualLanguage: {
        geometry: state.visualLanguage.geometry,
        edgeTreatment: state.visualLanguage.edgeTreatment,
        spacing: state.visualLanguage.spacing,
        texture: state.visualLanguage.texture,
      },
    },
  };
}

export function logPipelineDebugSnapshot(
  direction: CreativeDirection,
  state: CreativeState,
  meta?: Record<string, unknown>,
  audioFeatures?: AudioFeatures
): void {
  const snapshot = buildPipelineDebugSnapshot(direction, state, audioFeatures);

  console.group("[Pipeline Debug] CreativeDirection → CreativeState");
  if (meta) {
    console.log("meta:", meta);
  }
  console.log("creativeFactors:", snapshot.creativeFactors);
  console.log("CreativeDirection:", snapshot.creativeDirection);
  console.log("CreativeState:", snapshot.creativeState);
  console.groupEnd();
}
