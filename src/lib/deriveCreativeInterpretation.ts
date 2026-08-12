import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type {
  AnimationArc,
  ColorField,
  CreativeReasoning,
  EnergyDistribution,
  ExecutableAnimationRules,
  FontTreatment,
  MotionConcept,
  PhysicalInterpretation,
  RendererIdentity,
  SongAtmosphere,
  TypographyConcept,
  TypographyIdentity,
  TypographyMotionAction,
} from "@/types/creativeInterpretation";
import {
  DEFAULT_ENERGY_DISTRIBUTION,
  normalizeEnergyDistribution,
} from "@/types/creativeInterpretation";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function deriveSongAtmosphere(audioFeatures: AudioFeatures): SongAtmosphere {
  const { emotionalVector: e, songCharacter, energy, dynamics } = audioFeatures;
  const tension = clamp01(e.tension);
  const intimacy = clamp01(
    1 - energy * 0.55 + (songCharacter.performanceStyle === "intimate" ? 0.35 : 0)
  );
  const movement = clamp01(energy * 0.55 + dynamics * 0.45);
  const complexity = clamp01(
    (audioFeatures.visualDna?.visualComplexity ?? audioFeatures.density) * 0.7 +
      dynamics * 0.3
  );
  const humanQuality = clamp01(
    e.organic * 0.55 +
      (songCharacter.performanceStyle === "live_band" ||
      songCharacter.performanceStyle === "intimate"
        ? 0.35
        : 0.1)
  );

  let emotionalTemperature = "neutral restraint";
  if (e.warmth > 0.55 && tension < 0.45) emotionalTemperature = "warm openness with soft edges";
  else if (e.warmth < 0.4 && tension > 0.55) emotionalTemperature = "cool compression";
  else if (tension > 0.65) emotionalTemperature = "tightheld pressure";

  let description = "quiet presence with measured expansion";
  if (movement > 0.7 && tension > 0.55) {
    description = "compressed letter mass under irregular release pressure";
  } else if (intimacy > 0.6 && movement < 0.45) {
    description = "slow expansion with soft recovery";
  } else if (humanQuality > 0.6 && movement > 0.55) {
    description = "flow interrupted by discrete impact events";
  }

  return {
    description,
    emotionalTemperature,
    tension,
    intimacy: clamp01(intimacy),
    movement,
    complexity,
    humanQuality,
  };
}

export function derivePhysicalInterpretation(
  atmosphere: SongAtmosphere,
  audioFeatures: AudioFeatures
): PhysicalInterpretation {
  const sharp = audioFeatures.visualDna?.transientSharpness ?? audioFeatures.dynamics;

  if (sharp > 0.65 && atmosphere.tension > 0.55) {
    return {
      phenomenon: "compressed letter mass that repeatedly separates and reforms",
      forces: "binding cohesion opposed by sudden outward release",
      restState: "word held as one compressed block at ~0.9 scale",
      disruption: "on peaks, block splits horizontally up to 12–18px gaps",
      recovery: "gaps close with elastic snap within 180–280ms",
    };
  }
  if (atmosphere.intimacy > 0.6 && atmosphere.movement < 0.45) {
    return {
      phenomenon: "slow expansion and collapse of a single word mass",
      forces: "outward breath opposed by soft return",
      restState: "word at resting scale 1.0 with tight tracking",
      disruption: "scale rises to ~1.12 and tracking opens during crests",
      recovery: "scale and tracking ease back over 600–900ms",
    };
  }
  if (atmosphere.movement > 0.65) {
    return {
      phenomenon: "elastic stretch beyond resting bounds then recoil",
      forces: "outward surge opposed by snap-back tension",
      restState: "word at 0.92–1.0 scale, no shear",
      disruption: "horizontal stretch to ~1.18 scale with mild skew",
      recovery: "overshoot then settle within 2–3 frames after peak",
    };
  }
  return {
    phenomenon: "a single object vibrating internally while silhouette holds",
    forces: "internal oscillation contained by outer cohesion",
    restState: "word locked; glyphs have <1px life",
    disruption: "low-amplitude word vertical shift (2–4px) on accents",
    recovery: "damping to rest within 300ms",
  };
}

export function deriveVisualWorld(
  _audioFeatures: AudioFeatures,
  atmosphere: SongAtmosphere,
  existingMaterial?: string
): ColorField {
  let field = "quiet matte wash";
  let lighting = "soft-diffused";
  let texture = "flat pigment";
  let material = "paper";

  if (atmosphere.tension > 0.65) {
    field = "high-contrast matte field";
    lighting = "flat-graphic";
    texture = "hard edge plane";
    material = "dense ink on quiet ground";
  } else if (atmosphere.intimacy > 0.55) {
    field = "soft low-contrast wash";
    lighting = "muted-daylight";
    texture = "soft fiber";
    material = "paper";
  } else if (existingMaterial?.trim()) {
    field = `${existingMaterial.trim()} supporting field`;
    material = existingMaterial.trim();
  }

  return {
    field,
    lighting,
    texture,
    material,
    description: `Readable field for type: ${field}. Not a scene.`,
  };
}

export function deriveTypographyIdentity(
  atmosphere: SongAtmosphere,
  motionPrimary: string,
  fontGeometry?: string
): TypographyIdentity {
  const dense = fontGeometry?.includes("modular") || fontGeometry?.includes("angular");
  const soft = fontGeometry?.includes("calligraphic") || fontGeometry?.includes("organic");

  if (motionPrimary.includes("fracture") || motionPrimary.includes("collision")) {
    return {
      weight: dense ? "dense" : "sharp",
      rigidity: "high — prefers break over melt",
      flexibility: "low continuous bend; allows split gaps",
      edgeBehavior: "keep edges hard during separation",
      spacingBehavior: "gaps open on disruption, close on recovery",
      silhouetteBehavior: "word silhouette restores after reconnection",
      deformationTolerance: "fracture-tolerant; stretch-limited",
      metaphor: "compressed letter mass separating and reforming",
      behavior: "splits on peaks, magnetically reconnects",
    };
  }
  if (motionPrimary.includes("stretch") || motionPrimary.includes("elastic")) {
    return {
      weight: "dense",
      rigidity: "medium — can elongate then recoil",
      flexibility: "high along primary axis",
      edgeBehavior: soft ? "edges may soften after release" : "edges stay crisp during stretch",
      spacingBehavior: "tracking increases with elongation",
      silhouetteBehavior: "preserve overall word outline while stretching",
      deformationTolerance: "stretch up to ~15–20% then recoil",
      metaphor: "elastic word mass stretching under load",
      behavior: "elongates on peaks, snaps back",
    };
  }
  if (atmosphere.intimacy > 0.55 || motionPrimary.includes("flow") || motionPrimary.includes("breath")) {
    return {
      weight: "airy",
      rigidity: "low",
      flexibility: "high — gentle bend and breath",
      edgeBehavior: "soft edges allowed",
      spacingBehavior: "tracking breathes with scale",
      silhouetteBehavior: "soft outline holds",
      deformationTolerance: "scale ±12%; avoid fragmentation",
      metaphor: "breathing word mass",
      behavior: "slow expand/contract as one object",
    };
  }
  return {
    weight: dense ? "dense" : "balanced",
    rigidity: "medium",
    flexibility: soft ? "medium-high" : "medium",
    edgeBehavior: "stable edges",
    spacingBehavior: "spacing follows word scale",
    silhouetteBehavior: "preserve silhouette under word motion",
    deformationTolerance: "moderate scale/position; limited glyph drift",
    metaphor: "single vibrating word object",
    behavior: "holds form while absorbing force at word level",
  };
}

export function deriveTypographyConcept(
  atmosphere: SongAtmosphere,
  motionPrimary: string
): TypographyConcept {
  const id = deriveTypographyIdentity(atmosphere, motionPrimary);
  return {
    metaphor: id.metaphor || id.behavior || motionPrimary,
    behavior: id.behavior || id.metaphor || motionPrimary,
  };
}

export function deriveMotionAction(
  primary: string,
  physical: PhysicalInterpretation
): TypographyMotionAction {
  const key = primary.toLowerCase();
  if (key.includes("fracture") || key.includes("collision") || key.includes("impact")) {
    return {
      primaryAction: "fracture",
      secondaryConsequence: "pieces magnetically reconnect into the word",
      explanation: physical.disruption,
    };
  }
  if (key.includes("stretch") || key.includes("elastic") || key.includes("shear")) {
    return {
      primaryAction: "stretch",
      secondaryConsequence: "edges settle after elastic recoil",
      explanation: physical.disruption,
    };
  }
  if (key.includes("breath") || key.includes("expand") || key.includes("pulse")) {
    return {
      primaryAction: "expansion",
      secondaryConsequence: "soft collapse back to rest scale",
      explanation: physical.disruption,
    };
  }
  if (key.includes("flow") || key.includes("drift") || key.includes("wave")) {
    return {
      primaryAction: "flow",
      secondaryConsequence: "wave settles to alignment",
      explanation: physical.disruption,
    };
  }
  return {
    primaryAction: "compression",
    secondaryConsequence: "release expands then returns to rest",
    explanation: physical.disruption,
  };
}

export function deriveAnimationRules(
  action: TypographyMotionAction,
  physical: PhysicalInterpretation
): ExecutableAnimationRules {
  switch (action.primaryAction) {
    case "fracture":
      return {
        wordBehavior:
          "word holds as one mass at rest; on peaks, opens horizontal gaps then reunites",
        glyphBehavior: "glyphs inherit split offsets only during disruption (<8px); quiet otherwise",
        scale: "rest 0.92–1.0; peaks up to 1.08",
        position: "word X split ±6–14px during disruption; Y quiet",
        rotation: "≤2° word rotation; glyphs ≤0.5°",
        spacing: "tracking opens with split; restores on reconnection",
        deformation: "prefer gap/separation over melt; mild skew ≤2°",
        timing: "sudden disruption on transients; 180–280ms elastic recovery",
        intensityResponse:
          "higher intensity widens peak gaps and shortens recovery — not more glyph noise",
      };
    case "stretch":
      return {
        wordBehavior: "word elongates on peaks and snaps back as one object",
        glyphBehavior: "subtle edge life after release only",
        scale: "rest 0.9–1.0; peaks to 1.15–1.2 along primary axis",
        position: "minimal translation; stretch is scale-dominant",
        rotation: "≤1.5°",
        spacing: "tracking increases during elongation; returns on recoil",
        deformation: "horizontal stretch + mild skew; no fragmentation",
        timing: "fast attack on peaks; 2–3 frame overshoot then settle",
        intensityResponse: "higher intensity increases peak scale and recoil energy",
      };
    case "expansion":
      return {
        wordBehavior: "word compresses on tension, expands on release",
        glyphBehavior: "almost none — life <1px",
        scale: "0.85 resting during tension; up to 1.15 on release",
        position: "slight vertical settle on release (2–4px)",
        rotation: "0–1°",
        spacing: "tracking increases during expansion; returns during recovery",
        deformation: "uniform scale; deformationTolerance low for glyphs",
        timing: "slow buildup, sudden release",
        intensityResponse: "higher intensity deepens rest↔peak scale contrast",
      };
    case "flow":
      return {
        wordBehavior: "word drifts as connected mass with slow phase",
        glyphBehavior: "tiny connected phase offsets only",
        scale: "0.98–1.05 soft",
        position: "slow vertical/horizontal drift 4–10px",
        rotation: "≤2° orbital",
        spacing: "mostly constant; subtle tracking breathe",
        deformation: "minimal; prefer position over warp",
        timing: "smooth continuous; avoid staccato unless audio demands",
        intensityResponse: "higher intensity increases drift amplitude, not glyph chaos",
      };
    default:
      return {
        wordBehavior: physical.disruption,
        glyphBehavior: "subtle life only — no competing locomotion",
        scale: "rest ~1.0; peaks ±8–15%",
        position: "word-level translation preferred",
        rotation: "≤2°",
        spacing: "follows word scale",
        deformation: "word-dominant",
        timing: physical.recovery,
        intensityResponse:
          "higher intensity increases word displacement/spring — glyph stays nearly constant",
      };
  }
}

export function deriveMotionConcept(
  action: TypographyMotionAction,
  rules: ExecutableAnimationRules
): MotionConcept {
  return {
    metaphor: `${action.primaryAction}: ${action.explanation}`,
    primaryMotion: action.primaryAction,
    secondaryMotion: action.secondaryConsequence,
    intensityBehavior: rules.intensityResponse,
    wordMovement: rules.wordBehavior,
    glyphMovement: rules.glyphBehavior,
    cameraMovement: "locked",
    primaryAction: action.primaryAction,
    secondaryConsequence: action.secondaryConsequence,
  };
}

export function deriveAnimationArc(physical: PhysicalInterpretation): AnimationArc {
  return {
    entrance: physical.restState,
    development: physical.disruption,
    peak: `maximum ${physical.forces}`,
    resolution: physical.recovery,
  };
}

export function deriveFontTreatment(
  fontName: string,
  visualGeometry: string,
  identity?: TypographyIdentity
): FontTreatment {
  if (identity) {
    return {
      role: `font body: ${identity.weight}, ${identity.rigidity}`,
      deformation: identity.deformationTolerance,
      spacing: identity.spacingBehavior,
      contrast: identity.silhouetteBehavior,
      rigidity: identity.rigidity,
      spacingBehavior: identity.spacingBehavior,
      edgeBehavior: identity.edgeBehavior,
      silhouettePreservation: identity.silhouetteBehavior,
      flexibility: identity.flexibility,
      deformationTolerance: identity.deformationTolerance,
    };
  }

  const name = fontName.toLowerCase();
  const dense = name.includes("bitcount") || visualGeometry.includes("modular");
  return {
    role: dense
      ? "modular body — compress/separate/reform"
      : "word-level physical body",
    deformation: dense
      ? "prefer scale and gap over melt"
      : "word transform first; glyph life only as detail",
    spacing: dense ? "controlled gaps between modules" : "match composition density",
    contrast: "preserve silhouette against field",
    rigidity: dense ? "modular-rigid" : "medium",
    spacingBehavior: "follows word scale",
    edgeBehavior: "stable unless action is flow",
    silhouettePreservation: "preserve silhouette under word motion",
    flexibility: dense ? "gap-flexible" : "medium",
    deformationTolerance: "word ±15%; glyph life subtle",
  };
}

export function deriveCreativeReasoning(
  physical: PhysicalInterpretation,
  action: TypographyMotionAction,
  whyThisSongNotAnother: string
): CreativeReasoning {
  return {
    creativeTranslation: [
      `Forces: ${physical.forces}.`,
      `Action: ${action.primaryAction} → ${action.secondaryConsequence}.`,
      `Rest→disrupt→recover: ${physical.restState} / ${physical.disruption} / ${physical.recovery}.`,
    ].join(" "),
    whyThisSongNotAnother,
    hiddenIdentityCheck:
      "Yes — driven by executable letter physics, not title/artist/genre scenery.",
    selfCheck: {
      hiddenIdentity: true,
      uniquePhysicalBehavior: true,
      developerImplementable: true,
      fontGeometryOnly: true,
      avoidedGenericVisuals: true,
    },
  };
}

export function ensureEnergyDistribution(
  value?: Partial<EnergyDistribution> | null
): EnergyDistribution {
  return normalizeEnergyDistribution(value ?? DEFAULT_ENERGY_DISTRIBUTION);
}

function deriveRendererIdentity(
  direction: CreativeDirection,
  action: TypographyMotionAction,
  rules: ExecutableAnimationRules
): RendererIdentity {
  const existing = direction.rendererIdentity;
  return {
    primaryMotion: existing?.primaryMotion || action.primaryAction,
    secondaryMotion: existing?.secondaryMotion || action.secondaryConsequence,
    wordMovement: existing?.wordMovement || rules.wordBehavior,
    glyphMovement: existing?.glyphMovement || rules.glyphBehavior,
    scaleBehavior: existing?.scaleBehavior || rules.scale,
    positionBehavior: existing?.positionBehavior || rules.position,
    rotationBehavior: existing?.rotationBehavior || rules.rotation,
    spacingBehavior: existing?.spacingBehavior || rules.spacing,
    deformationBehavior: existing?.deformationBehavior || rules.deformation,
    backgroundColor: existing?.backgroundColor || direction.palette.background,
    textColor: existing?.textColor || direction.palette.textColor,
    composition: existing?.composition || direction.composition.composition,
    camera: existing?.camera || direction.camera?.movement || "locked",
    motionIntensityBehavior: rules.intensityResponse,
    cameraMovement: existing?.camera || "locked",
  };
}

export function ensureCreativeInterpretation(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fontName: string
): CreativeDirection {
  const atmosphere =
    direction.atmosphere?.description?.trim()
      ? direction.atmosphere
      : deriveSongAtmosphere(audioFeatures);

  const physicalInterpretation =
    direction.physicalInterpretation?.restState?.trim() ||
    direction.physicalInterpretation?.phenomenon?.trim()
      ? {
          restState: "word at resting cohesion",
          disruption: "peak force event",
          recovery: "return to rest",
          ...direction.physicalInterpretation,
          phenomenon: direction.physicalInterpretation.phenomenon,
          forces: direction.physicalInterpretation.forces || "opposing physical forces",
        }
      : derivePhysicalInterpretation(atmosphere, audioFeatures);

  const primary =
    direction.motionSystem?.motionAction?.primaryAction ||
    direction.motionSystem?.motionConcept?.primaryMotion ||
    direction.motionBehavior?.primary ||
    "compression";

  const typographyIdentity =
    direction.typographyIdentity?.rigidity?.trim() ||
    direction.typographyIdentity?.weight?.trim()
      ? direction.typographyIdentity
      : deriveTypographyIdentity(
          atmosphere,
          primary,
          direction.visualLanguage?.geometry
        );

  const typographyConcept = {
    metaphor:
      direction.typographyConcept?.metaphor ||
      typographyIdentity.metaphor ||
      physicalInterpretation.phenomenon,
    behavior:
      direction.typographyConcept?.behavior ||
      typographyIdentity.behavior ||
      physicalInterpretation.disruption,
  };

  const visualWorld =
    direction.visualWorld?.field?.trim()
      ? direction.visualWorld
      : deriveVisualWorld(audioFeatures, atmosphere, direction.palette?.material);

  const motionAction =
    direction.motionSystem?.motionAction?.primaryAction?.trim()
      ? direction.motionSystem.motionAction
      : deriveMotionAction(primary, physicalInterpretation);

  const animationRules =
    direction.motionSystem?.animationRules?.wordBehavior?.trim()
      ? direction.motionSystem.animationRules
      : deriveAnimationRules(motionAction, physicalInterpretation);

  const motionConcept =
    direction.motionSystem?.motionConcept?.wordMovement?.trim()
      ? {
          cameraMovement: "locked",
          ...direction.motionSystem.motionConcept,
        }
      : deriveMotionConcept(motionAction, animationRules);

  const motionSystem = {
    motionAction,
    animationRules,
    motionConcept,
    motionLanguage: direction.motionSystem?.motionLanguage ?? direction.motionLanguage,
    motionBehavior: direction.motionSystem?.motionBehavior ?? direction.motionBehavior,
    primaryPrimitive: direction.motionSystem?.primaryPrimitive,
    secondaryPrimitive: direction.motionSystem?.secondaryPrimitive,
  };

  const animationArc =
    direction.animationArc?.entrance?.trim()
      ? direction.animationArc
      : deriveAnimationArc(physicalInterpretation);

  const fontTreatment = deriveFontTreatment(
    fontName,
    direction.visualLanguage?.geometry ?? "",
    typographyIdentity
  );

  const energyDistribution = ensureEnergyDistribution(direction.energyDistribution);

  const why =
    direction.reasoning?.whyThisSongNotAnother?.trim() ||
    direction.specificityReasoning?.whyThisSongNotAnother?.trim() ||
    direction.artisticIntent ||
    physicalInterpretation.phenomenon;

  const reasoning =
    direction.reasoning?.creativeTranslation?.trim()
      ? {
          ...deriveCreativeReasoning(physicalInterpretation, motionAction, why),
          ...direction.reasoning,
          whyThisSongNotAnother: why,
        }
      : deriveCreativeReasoning(physicalInterpretation, motionAction, why);

  const artisticIntent =
    direction.artisticIntent?.trim() ||
    `${motionAction.primaryAction}: ${animationRules.wordBehavior}`;

  const palette = {
    ...direction.palette,
    material:
      direction.palette.material?.trim() && direction.palette.material !== "matte surface"
        ? direction.palette.material
        : visualWorld.material,
  };

  const camera = {
    movement: direction.camera?.movement || "locked",
    zoomBehavior: direction.camera?.zoomBehavior || "none",
  };

  const withBase = {
    ...direction,
    palette,
    composition: direction.composition,
    camera,
  } as CreativeDirection;

  const rendererIdentity = deriveRendererIdentity(withBase, motionAction, animationRules);

  return {
    ...direction,
    physicalInterpretation,
    typographyIdentity,
    typographyConcept,
    atmosphere,
    visualWorld,
    motionSystem,
    animationArc,
    fontTreatment: {
      ...fontTreatment,
      ...(direction.fontTreatment?.role
        ? {
            role: direction.fontTreatment.role,
            deformation: direction.fontTreatment.deformation || fontTreatment.deformation,
            spacing: direction.fontTreatment.spacing || fontTreatment.spacing,
            contrast: direction.fontTreatment.contrast || fontTreatment.contrast,
          }
        : {}),
    },
    energyDistribution,
    rendererIdentity: {
      ...rendererIdentity,
      backgroundColor: palette.background,
      textColor: palette.textColor,
      camera: camera.movement,
    },
    reasoning,
    artisticIntent,
    camera,
    motionLanguage: motionSystem.motionLanguage,
    motionBehavior: motionSystem.motionBehavior,
    palette,
    specificityReasoning: {
      whyThisSongNotAnother: reasoning.whyThisSongNotAnother,
    },
  };
}
