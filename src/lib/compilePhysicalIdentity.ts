import type { CreativeDirection } from "@/types/creativeDirection";
import type { FontMetadata } from "@/types/fontMetadata";
import type { MotionParamsMap } from "@/types/motionMetadata";
import type { AudioFeatures } from "@/types/audio";
import type {
  ExecutableAnimationRules,
  FontTreatment,
  MotionSystem,
  PhysicalInterpretation,
  RendererIdentity,
  TypographyIdentity,
} from "@/types/creativeInterpretation";
import {
  clampPhysicalModel,
  DEFAULT_FONT_PHYSICS,
  DEFAULT_PHYSICAL_MODEL,
  DEFAULT_TYPOGRAPHY_BEHAVIOR,
  type FontPhysics,
  type ForceDirection,
  type GlyphBehavior,
  type PhysicalDeformation,
  type PhysicalMaterial,
  type PhysicalModel,
  type RecoveryMode,
  type SilhouetteBehavior,
  type SpacingBehavior,
  type TypographyBehavior,
  type WordBehavior,
} from "@/types/physicalIdentity";
import type { SongCharacter } from "@/types/songCharacter";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

function parseScalePeak(scaleText: string | undefined): number | null {
  if (!scaleText) return null;
  const matches = scaleText.match(/1\.\d{1,2}|\d\.\d{1,2}/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map(Number).filter((n) => n > 0.5 && n < 2);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

function compileMaterial(
  physical: PhysicalInterpretation | undefined,
  identity: TypographyIdentity | undefined,
  action: string,
  treatment: FontTreatment | undefined
): PhysicalMaterial {
  const blob = [
    physical?.phenomenon,
    physical?.forces,
    identity?.rigidity,
    identity?.flexibility,
    identity?.deformationTolerance,
    identity?.physicalMaterial,
    identity?.metaphor,
    treatment?.rigidity,
    treatment?.flexibility,
    action,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (includesAny(blob, ["brittle", "fragile", "shatter", "obsidian", "glass break", "jagged", "angular snap", "crack"])) {
    return "fragile";
  }
  if (includesAny(blob, ["fluid", "liquid", "ink", "water", "flow", "dreamy", "haze", "wash", "pour"])) return "fluid";
  if (includesAny(blob, ["gas", "smoke", "vapor", "air", "mist"])) return "gaseous";
  if (includesAny(blob, ["granular", "sand", "grain", "particle"])) return "granular";
  if (includesAny(blob, ["soft", "fabric", "paper", "cushion", "velvet"])) return "soft";
  if (includesAny(blob, ["rigid", "stone", "metal", "hard", "locked", "steel"])) return "rigid";
  if (includesAny(blob, ["elastic", "rubber", "spring", "stretch", "recoil", "snap back"])) {
    return "elastic";
  }
  if (includesAny(blob, ["dense", "heavy"])) return "rigid";
  return DEFAULT_PHYSICAL_MODEL.material;
}

function compileDeformation(
  physical: PhysicalInterpretation | undefined,
  action: string,
  identity: TypographyIdentity | undefined
): PhysicalDeformation {
  const blob = [
    physical?.disruption,
    physical?.phenomenon,
    action,
    identity?.structuralBehavior,
    identity?.deformationTolerance,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (includesAny(blob, ["fracture", "split", "shatter", "fragment", "separate", "break apart", "jagged"])) {
    return "fracture";
  }
  if (includesAny(blob, ["dissolve", "melt", "fade", "erod", "haze"])) return "dissolve";
  if (includesAny(blob, ["compress", "squeeze", "contract", "crush"])) return "compress";
  if (includesAny(blob, ["flow", "drift", "wave", "liquid", "swim", "pour", "cascade"])) return "flow";
  if (includesAny(blob, ["bend", "warp"])) return "bend";
  if (includesAny(blob, ["rotat", "spin", "orbit", "twist"])) return "rotate";
  if (includesAny(blob, ["vibrat", "oscillat", "tremor", "staccato pulse"])) return "vibrate";
  if (includesAny(blob, ["stretch", "elongat", "elastic"])) return "stretch";
  return DEFAULT_PHYSICAL_MODEL.deformation;
}

function compileForceDirection(
  physical: PhysicalInterpretation | undefined,
  rules: ExecutableAnimationRules | undefined,
  renderer: RendererIdentity | undefined
): ForceDirection {
  const blob = [
    physical?.forces,
    physical?.disruption,
    rules?.position,
    renderer?.positionBehavior,
    renderer?.wordMovement,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (includesAny(blob, ["radial", "outward in all", "scatter"])) return "radial";
  if (includesAny(blob, ["vertical", "up", "down", "y "])) return "vertical";
  if (includesAny(blob, ["inward", "compress toward", "pull in"])) return "inward";
  if (includesAny(blob, ["outward", "push out", "expand out"])) return "outward";
  if (includesAny(blob, ["horizontal", "left", "right", "x ", "tracking"])) {
    return "horizontal";
  }
  return DEFAULT_PHYSICAL_MODEL.forceDirection;
}

function compileRecovery(
  physical: PhysicalInterpretation | undefined,
  actionSecondary: string
): RecoveryMode {
  const blob = [physical?.recovery, actionSecondary].filter(Boolean).join(" ").toLowerCase();
  if (includesAny(blob, ["snap", "recoil", "overshoot"])) return "snap";
  if (includesAny(blob, ["reform", "reconnect", "reunit", "magnet"])) return "reform";
  if (includesAny(blob, ["fade", "dissolv"])) return "fade";
  if (includesAny(blob, ["none", "hold"])) return "none";
  if (includesAny(blob, ["settle", "damp", "ease", "soft return"])) return "settle";
  return DEFAULT_PHYSICAL_MODEL.recovery;
}

function physicalDefaultsFromSongCharacter(
  songCharacter: SongCharacter | undefined
): Partial<PhysicalModel> | null {
  if (!songCharacter) return null;

  const { energyType, performanceStyle, rhythmFeel, texture } = songCharacter;

  if (energyType === "restless" || energyType === "surging") {
    return {
      material: texture === "raw" || texture === "grainy" ? "fragile" : "elastic",
      deformation: rhythmFeel === "staccato" ? "fracture" : "vibrate",
      forceDirection: "horizontal",
      recovery: "snap",
      resistance: 0.72,
      elasticity: 0.35,
      fragmentation: rhythmFeel === "staccato" ? 0.62 : 0.35,
      tension: 0.72,
    };
  }

  if (energyType === "floating" || performanceStyle === "atmospheric") {
    return {
      material: "fluid",
      deformation: "flow",
      forceDirection: "vertical",
      recovery: "settle",
      resistance: 0.22,
      elasticity: 0.4,
      fragmentation: 0.08,
      tension: 0.32,
    };
  }

  if (performanceStyle === "synthetic" || performanceStyle === "mechanical") {
    return {
      material: "rigid",
      deformation: "compress",
      forceDirection: "horizontal",
      recovery: "reform",
      resistance: 0.68,
      elasticity: 0.28,
      fragmentation: 0.2,
      tension: 0.55,
    };
  }

  if (performanceStyle === "intimate" || energyType === "subdued") {
    return {
      material: "soft",
      deformation: "stretch",
      forceDirection: "inward",
      recovery: "settle",
      resistance: 0.3,
      elasticity: 0.55,
      fragmentation: 0.1,
      tension: 0.28,
    };
  }

  return null;
}

function compilePhysicalModel(
  direction: Pick<
    CreativeDirection,
    | "physicalInterpretation"
    | "typographyIdentity"
    | "motionSystem"
    | "rendererIdentity"
    | "fontTreatment"
  >,
  songCharacter?: SongCharacter
): PhysicalModel {
  const physical = direction.physicalInterpretation;
  const identity = direction.typographyIdentity;
  const action = direction.motionSystem?.motionAction?.primaryAction ?? "";
  const secondary = direction.motionSystem?.motionAction?.secondaryConsequence ?? "";
  const rules = direction.motionSystem?.animationRules;
  const treatment = direction.fontTreatment;

  let material = compileMaterial(physical, identity, action, treatment);
  let deformation = compileDeformation(physical, action, identity);
  let forceDirection = compileForceDirection(
    physical,
    rules,
    direction.rendererIdentity
  );
  let recovery = compileRecovery(physical, secondary);

  const usedKeywordDefaults =
    material === DEFAULT_PHYSICAL_MODEL.material &&
    deformation === DEFAULT_PHYSICAL_MODEL.deformation &&
    recovery === DEFAULT_PHYSICAL_MODEL.recovery;

  const characterDefaults = physicalDefaultsFromSongCharacter(songCharacter);
  if (usedKeywordDefaults && characterDefaults) {
    material = characterDefaults.material ?? material;
    deformation = characterDefaults.deformation ?? deformation;
    forceDirection = characterDefaults.forceDirection ?? forceDirection;
    recovery = characterDefaults.recovery ?? recovery;
  }

  const rigidityBlob = `${identity?.rigidity ?? ""} ${treatment?.rigidity ?? ""}`.toLowerCase();
  const flexBlob = `${identity?.flexibility ?? ""} ${treatment?.flexibility ?? ""}`.toLowerCase();

  let resistance =
    characterDefaults && usedKeywordDefaults
      ? (characterDefaults.resistance ?? 0.45)
      : 0.45;
  if (includesAny(rigidityBlob, ["high", "rigid", "dense"])) resistance = 0.78;
  if (includesAny(rigidityBlob, ["low", "soft", "flexible"])) resistance = 0.25;
  if (material === "rigid" || material === "fragile") resistance = Math.max(resistance, 0.7);
  if (material === "fluid" || material === "gaseous" || material === "soft") {
    resistance = Math.min(resistance, 0.35);
  }

  let elasticity =
    characterDefaults && usedKeywordDefaults
      ? (characterDefaults.elasticity ?? 0.5)
      : 0.5;
  if (material === "elastic") elasticity = 0.85;
  if (material === "fluid") elasticity = 0.35;
  if (material === "fragile" || material === "rigid") elasticity = 0.25;
  if (includesAny(flexBlob, ["high"])) elasticity = Math.max(elasticity, 0.7);
  if (includesAny(flexBlob, ["low"])) elasticity = Math.min(elasticity, 0.35);

  let fragmentation =
    characterDefaults && usedKeywordDefaults
      ? (characterDefaults.fragmentation ?? 0.15)
      : 0.15;
  if (deformation === "fracture") fragmentation = 0.72;
  if (material === "fragile") fragmentation = Math.max(fragmentation, 0.65);
  if (material === "fluid" || material === "soft") fragmentation = Math.min(fragmentation, 0.12);
  if (includesAny(`${identity?.deformationTolerance ?? ""}`, ["fracture"])) {
    fragmentation = Math.max(fragmentation, 0.55);
  }

  let tension =
    characterDefaults && usedKeywordDefaults
      ? (characterDefaults.tension ?? 0.4)
      : 0.4;
  const scalePeak = parseScalePeak(rules?.scale ?? direction.rendererIdentity?.scaleBehavior);
  if (scalePeak !== null) {
    tension = clamp01((scalePeak - 1) / 0.25);
  }
  if (deformation === "compress" || deformation === "stretch") {
    tension = Math.max(tension, 0.55);
  }
  if (material === "fragile") tension = Math.max(tension, 0.6);

  return clampPhysicalModel({
    material,
    deformation,
    forceDirection,
    recovery,
    resistance,
    elasticity,
    fragmentation,
    tension,
  });
}

function compileTypographyBehavior(
  direction: Pick<
    CreativeDirection,
    "typographyIdentity" | "motionSystem" | "rendererIdentity" | "fontTreatment"
  >,
  physicalModel: PhysicalModel
): TypographyBehavior {
  const action = (
    direction.motionSystem?.motionAction?.primaryAction ??
    direction.motionSystem?.motionConcept?.primaryMotion ??
    ""
  ).toLowerCase();
  const rules = direction.motionSystem?.animationRules;
  const identity = direction.typographyIdentity;
  const treatment = direction.fontTreatment;
  const blob = [
    action,
    rules?.wordBehavior,
    direction.rendererIdentity?.wordMovement,
    identity?.behavior,
    identity?.structuralBehavior,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let wordBehavior: WordBehavior = DEFAULT_TYPOGRAPHY_BEHAVIOR.wordBehavior;
  if (includesAny(blob, ["fracture", "split", "shatter"])) wordBehavior = "fracture";
  else if (includesAny(blob, ["collid", "impact", "hit"])) wordBehavior = "collide";
  else if (includesAny(blob, ["orbit", "circular"])) wordBehavior = "orbit";
  else if (includesAny(blob, ["drift", "float"])) wordBehavior = "drift";
  else if (includesAny(blob, ["flow", "wave", "liquid"])) wordBehavior = "flow";
  else if (includesAny(blob, ["contract", "compress"])) wordBehavior = "contract";
  else if (includesAny(blob, ["expand", "stretch", "breath", "release"])) {
    wordBehavior = "expand";
  } else if (physicalModel.deformation === "fracture") wordBehavior = "fracture";
  else if (physicalModel.deformation === "flow") wordBehavior = "flow";

  const glyphBlob = [
    rules?.glyphBehavior,
    direction.rendererIdentity?.glyphMovement,
    identity?.deformationTolerance,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let glyphBehavior: GlyphBehavior = "stable";
  if (includesAny(glyphBlob, ["fragment", "shard", "split"])) glyphBehavior = "fragment";
  else if (includesAny(glyphBlob, ["jitter", "shake", "twitch"])) glyphBehavior = "jitter";
  else if (includesAny(glyphBlob, ["distort", "warp", "skew"])) glyphBehavior = "distort";
  else if (includesAny(glyphBlob, ["breath", "subtle life", "pulse"])) glyphBehavior = "breathe";
  else if (physicalModel.fragmentation > 0.55) glyphBehavior = "fragment";
  else if (physicalModel.material === "fluid") glyphBehavior = "breathe";

  const spacingBlob = [
    rules?.spacing,
    direction.rendererIdentity?.spacingBehavior,
    identity?.spacingBehavior,
    treatment?.spacingBehavior,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let spacingBehavior: SpacingBehavior = "compress";
  if (includesAny(spacingBlob, ["unstable", "gap", "open", "split"])) {
    spacingBehavior = "unstable";
  } else if (includesAny(spacingBlob, ["expand", "tracking increase", "widen"])) {
    spacingBehavior = "expand";
  } else if (includesAny(spacingBlob, ["compress", "tight", "contract"])) {
    spacingBehavior = "compress";
  } else if (physicalModel.deformation === "fracture") {
    spacingBehavior = "unstable";
  } else if (physicalModel.deformation === "flow") {
    spacingBehavior = "expand";
  }

  const silBlob = [
    identity?.silhouetteBehavior,
    treatment?.silhouettePreservation,
    direction.rendererIdentity?.deformationBehavior,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let silhouetteBehavior: SilhouetteBehavior = "preserve";
  if (includesAny(silBlob, ["break", "shatter", "lose"])) silhouetteBehavior = "break";
  else if (includesAny(silBlob, ["deform", "melt", "warp"])) silhouetteBehavior = "deform";
  else if (physicalModel.fragmentation > 0.7) silhouetteBehavior = "break";
  else if (physicalModel.material === "fluid") silhouetteBehavior = "deform";

  return {
    wordBehavior,
    glyphBehavior,
    spacingBehavior,
    silhouetteBehavior,
  };
}

export function compileFontPhysics(font: FontMetadata): FontPhysics {
  const { density, sharpness, roundness, complexity } = font.structure;
  // structure fields are typically 1–5
  const d = clamp01(density / 5);
  const s = clamp01(sharpness / 5);
  const r = clamp01(roundness / 5);
  const c = clamp01(complexity / 5);

  return {
    maxStretch: clamp01(0.28 - d * 0.14 - s * 0.08 + r * 0.1),
    maxRotation: 2 + r * 4 + (1 - s) * 2 - d * 1.2,
    compressionTolerance: clamp01(0.08 + d * 0.18 + s * 0.08),
    fragmentationTolerance: clamp01(0.15 + s * 0.35 + d * 0.15 - r * 0.2),
    silhouetteStrength: clamp01(0.35 + d * 0.35 + s * 0.2 + c * 0.1 - r * 0.15),
  };
}

/**
 * Seed / override MotionParamsMap from compiled identity.
 * Primitives stay the same; parameters diverge so two "impact" songs can look different.
 */
export function applyIdentityToMotionParams(
  base: MotionParamsMap,
  physical: PhysicalModel,
  typography: TypographyBehavior,
  fontPhysics: FontPhysics
): MotionParamsMap {
  const stretchAmp = Math.min(
    fontPhysics.maxStretch * (0.6 + physical.elasticity),
    fontPhysics.maxStretch
  );
  const frag = Math.min(physical.fragmentation, fontPhysics.fragmentationTolerance);
  const resist = physical.resistance;

  const elastic = {
    stiffness: 1.4 + resist * 2.2 + (1 - physical.elasticity) * 0.8,
    damping:
      physical.recovery === "snap"
        ? 0.14 + resist * 0.08
        : physical.recovery === "settle"
          ? 0.28 + resist * 0.18
          : 0.22 + resist * 0.12,
    bounce: clamp01(physical.elasticity * 0.85 + (physical.deformation === "stretch" ? 0.15 : 0)),
    energy: clamp01(0.45 + physical.tension * 0.45 + physical.elasticity * 0.2),
    stretchAmount: stretchAmp,
    recoilStrength: clamp01(
      physical.recovery === "snap" ? 0.85 + physical.elasticity * 0.15 : 0.4 + physical.elasticity * 0.3
    ),
    resistance: resist,
    forceDirection: physical.forceDirection,
    ...base.elastic,
  };

  // Identity wins over audio defaults for key uniqueness axes
  elastic.stiffness = 1.4 + resist * 2.2 + (1 - physical.elasticity) * 0.8;
  elastic.damping =
    physical.recovery === "snap"
      ? 0.12 + resist * 0.1
      : physical.recovery === "settle" || physical.material === "fluid"
        ? 0.32 + resist * 0.2
        : 0.2 + resist * 0.14;
  elastic.bounce = clamp01(
    physical.material === "fluid"
      ? 0.15
      : physical.elasticity * 0.9 + (physical.deformation === "stretch" ? 0.12 : 0)
  );
  elastic.energy = clamp01(0.4 + physical.tension * 0.5);
  elastic.stretchAmount = stretchAmp;
  elastic.recoilStrength = clamp01(
    physical.recovery === "snap" ? 0.9 : physical.recovery === "reform" ? 0.7 : 0.45
  );
  elastic.resistance = resist;
  elastic.forceDirection = physical.forceDirection;

  const impact = {
    hitStrength: clamp01(0.25 + physical.tension * 0.55 + (physical.deformation === "fracture" ? 0.15 : 0)),
    decay:
      physical.recovery === "snap"
        ? 0.75
        : physical.recovery === "settle"
          ? 0.4
          : physical.recovery === "reform"
            ? 0.55
            : 0.5,
    anticipation: clamp01(0.05 + resist * 0.08 + physical.tension * 0.06),
    randomness:
      typography.glyphBehavior === "jitter"
        ? 0.45
        : typography.glyphBehavior === "stable"
          ? 0.08
          : 0.22,
    force: clamp01(physical.tension * 0.7 + frag * 0.3),
    compressionBeforeImpact: clamp01(
      fontPhysics.compressionTolerance * (0.7 + physical.tension * 0.5)
    ),
    releaseSpeed: clamp01(
      physical.recovery === "snap" ? 0.9 : physical.material === "fluid" ? 0.35 : 0.55
    ),
    recovery: physical.recovery === "none" ? "settle" : physical.recovery === "fade" ? "settle" : physical.recovery,
    deformationAmount: clamp01(
      physical.deformation === "fracture"
        ? frag
        : physical.deformation === "stretch"
          ? stretchAmp * 2
          : physical.tension * 0.4
    ),
    direction:
      physical.forceDirection === "inward" || physical.forceDirection === "outward"
        ? "radial"
        : physical.forceDirection === "vertical"
          ? "vertical"
          : physical.forceDirection === "radial"
            ? "radial"
            : "horizontal",
    fragmentationAmount: frag,
    shardSpread: clamp01(frag * (physical.forceDirection === "radial" ? 1 : 0.7)),
    silhouettePreservation: fontPhysics.silhouetteStrength,
    ...base.impact,
  };

  // Re-assert identity-critical impact fields after spread
  impact.hitStrength = clamp01(
    0.25 + physical.tension * 0.55 + (physical.deformation === "fracture" ? 0.2 : 0)
  );
  impact.decay =
    physical.recovery === "snap"
      ? 0.8
      : physical.recovery === "settle" || physical.material === "fluid"
        ? 0.35
        : 0.55;
  impact.fragmentationAmount = frag;
  impact.shardSpread = clamp01(frag * (physical.forceDirection === "radial" ? 1.1 : 0.65));
  impact.deformationAmount = clamp01(
    physical.deformation === "fracture" ? Math.max(frag, 0.45) : impact.deformationAmount
  );
  impact.direction =
    physical.forceDirection === "vertical"
      ? "vertical"
      : physical.forceDirection === "radial" || physical.forceDirection === "outward"
        ? "radial"
        : "horizontal";
  impact.releaseSpeed = clamp01(
    physical.recovery === "snap" ? 0.92 : physical.material === "fluid" ? 0.32 : 0.55
  );
  impact.compressionBeforeImpact = clamp01(
    fontPhysics.compressionTolerance * (0.75 + physical.tension * 0.4)
  );
  impact.silhouettePreservation = fontPhysics.silhouetteStrength;
  impact.recovery =
    physical.recovery === "snap" || physical.recovery === "reform" || physical.recovery === "settle"
      ? physical.recovery
      : "settle";

  const wave = {
    amplitude: clamp01(
      physical.material === "fluid" ? 0.55 + physical.tension * 0.3 : 0.3 + physical.tension * 0.25
    ),
    wavelength: physical.material === "fluid" ? 0.55 : 0.38,
    propagationSpeed: physical.material === "fluid" ? 0.85 : 0.55,
    smoothness: physical.material === "fluid" || physical.recovery === "settle" ? 0.85 : 0.5,
    ...base.wave,
  };
  wave.amplitude = clamp01(
    physical.material === "fluid" ? 0.6 + physical.tension * 0.25 : 0.28 + physical.tension * 0.3
  );
  wave.smoothness =
    physical.material === "fluid" || physical.deformation === "flow" ? 0.88 : 0.48;
  wave.propagationSpeed =
    physical.deformation === "flow" ? 0.9 : physical.recovery === "snap" ? 1.1 : 0.55;

  const float = {
    amplitude: clamp01(
      physical.material === "gaseous" || typography.wordBehavior === "drift"
        ? 0.55
        : 0.3 + (1 - resist) * 0.25
    ),
    buoyancy: clamp01(physical.material === "fluid" || physical.material === "gaseous" ? 0.85 : 0.5),
    driftSpeed: physical.deformation === "flow" ? 0.12 : 0.06,
    independence:
      typography.glyphBehavior === "stable"
        ? 0.15
        : typography.glyphBehavior === "fragment"
          ? 0.7
          : 0.4,
    ...base.float,
  };
  float.amplitude = clamp01(
    physical.material === "fluid" || typography.wordBehavior === "drift"
      ? 0.58
      : 0.28 + (1 - resist) * 0.22
  );
  float.independence =
    typography.glyphBehavior === "stable"
      ? 0.12
      : typography.glyphBehavior === "fragment"
        ? 0.72
        : 0.38;

  const pulse = {
    intensity: clamp01(0.3 + physical.tension * 0.4),
    cycleDuration:
      physical.recovery === "snap" ? 2.4 : physical.material === "fluid" ? 6.5 : 4.2,
    organicVariation: physical.material === "fluid" || physical.material === "soft" ? 0.12 : 0.04,
    expansionAmount: Math.min(stretchAmp, fontPhysics.maxStretch),
    ...base.pulse,
  };
  pulse.cycleDuration =
    physical.recovery === "snap" ? 2.2 : physical.material === "fluid" ? 6.8 : 4.0;
  pulse.expansionAmount = Math.min(
    fontPhysics.maxStretch,
    physical.deformation === "compress" || physical.deformation === "stretch"
      ? stretchAmp
      : stretchAmp * 0.6
  );

  const material = {
    textureAmount: clamp01(
      physical.material === "granular" || physical.material === "soft" ? 0.7 : 0.3
    ),
    roughness: clamp01(physical.material === "granular" ? 0.75 : resist * 0.5),
    instability: clamp01(
      typography.spacingBehavior === "unstable" ? 0.55 : physical.fragmentation * 0.35
    ),
    ...base.material,
  };
  material.instability = clamp01(
    typography.spacingBehavior === "unstable" ? 0.6 : physical.fragmentation * 0.4
  );

  return { pulse, float, wave, elastic, impact, material };
}

export interface CompiledPhysicalIdentity {
  physicalModel: PhysicalModel;
  typographyBehavior: TypographyBehavior;
  fontPhysics: FontPhysics;
  motionParams: MotionParamsMap;
}

export function compilePhysicalIdentity(
  direction: Pick<
    CreativeDirection,
    | "physicalInterpretation"
    | "typographyIdentity"
    | "motionSystem"
    | "rendererIdentity"
    | "fontTreatment"
  >,
  font: FontMetadata,
  baseMotionParams: MotionParamsMap = {},
  songCharacter?: SongCharacter | AudioFeatures["songCharacter"]
): CompiledPhysicalIdentity {
  const physicalModel = compilePhysicalModel(direction, songCharacter);
  const typographyBehavior = compileTypographyBehavior(direction, physicalModel);
  const fontPhysics = compileFontPhysics(font);
  const motionParams = applyIdentityToMotionParams(
    baseMotionParams,
    physicalModel,
    typographyBehavior,
    fontPhysics
  );

  console.log("[Physical Identity] Compiled", {
    physicalModel,
    typographyBehavior,
    fontPhysics,
    songCharacter: songCharacter ?? null,
    elastic: motionParams.elastic,
    impact: motionParams.impact,
  });

  return { physicalModel, typographyBehavior, fontPhysics, motionParams };
}

export function synthesizeIdentityFixtures(): {
  fragileFracture: CompiledPhysicalIdentity;
  fluidFlow: CompiledPhysicalIdentity;
} {
  const fragileModel: PhysicalModel = {
    material: "fragile",
    deformation: "fracture",
    forceDirection: "horizontal",
    recovery: "snap",
    resistance: 0.82,
    elasticity: 0.22,
    fragmentation: 0.78,
    tension: 0.75,
  };
  const fluidModel: PhysicalModel = {
    material: "fluid",
    deformation: "flow",
    forceDirection: "vertical",
    recovery: "settle",
    resistance: 0.22,
    elasticity: 0.38,
    fragmentation: 0.08,
    tension: 0.35,
  };

  const fragileTypography: TypographyBehavior = {
    wordBehavior: "fracture",
    glyphBehavior: "fragment",
    spacingBehavior: "unstable",
    silhouetteBehavior: "break",
  };
  const fluidTypography: TypographyBehavior = {
    wordBehavior: "flow",
    glyphBehavior: "breathe",
    spacingBehavior: "expand",
    silhouetteBehavior: "deform",
  };

  const denseFont: FontPhysics = {
    maxStretch: 0.08,
    maxRotation: 2,
    compressionTolerance: 0.22,
    fragmentationTolerance: 0.7,
    silhouetteStrength: 0.85,
  };
  const softFont: FontPhysics = {
    maxStretch: 0.24,
    maxRotation: 6,
    compressionTolerance: 0.1,
    fragmentationTolerance: 0.15,
    silhouetteStrength: 0.4,
  };

  return {
    fragileFracture: {
      physicalModel: fragileModel,
      typographyBehavior: fragileTypography,
      fontPhysics: denseFont,
      motionParams: applyIdentityToMotionParams({}, fragileModel, fragileTypography, denseFont),
    },
    fluidFlow: {
      physicalModel: fluidModel,
      typographyBehavior: fluidTypography,
      fontPhysics: softFont,
      motionParams: applyIdentityToMotionParams({}, fluidModel, fluidTypography, softFont),
    },
  };
}
