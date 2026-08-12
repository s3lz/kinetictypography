import {
  differentiateDirectionFamilies,
} from "@/lib/creativeDirectionBlender";
import {
  computeDirectionFamilies,
  type DirectionFamilySignature,
  familiesNearlyIdentical,
} from "@/lib/directionFamilies";
import { computeEnergyBucket, isHighIntensityAudio } from "@/lib/creativeFactors";
import type { EnergyBucket } from "@/lib/creativeFactors";
import {
  computeDirectionSignature,
  type DirectionSignature,
} from "@/lib/songCharacterInterpretation";
import {
  computeSongUniquenessVector,
} from "@/lib/songUniquenessVector";
import { motionCharacterFromDimensions } from "@/engine/motionDimensionsEngine";
import {
  enforceSpatialBehaviorAntiCollapse,
  needsSpatialBehaviorSeparation,
} from "@/lib/spatialBehaviorCollapse";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { MotionBehavior, MotionBehaviorBrief } from "@/types/motionBehavior";

const SIGNATURE_STORAGE_KEY = "creative-direction-signatures:v1";

export type HighEnergyStrategy =
  | "organic-push-pull"
  | "mechanical-grid"
  | "emotional-expansion"
  | "dense-layering"
  | "asymmetric-offset";

export type EnergyBucket = import("@/lib/creativeFactors").EnergyBucket;

export interface AntiTemplateAudit {
  applied: boolean;
  reason: string[];
  strategy?: HighEnergyStrategy;
  collisionSalt: number;
  beforeFamilies: DirectionFamilySignature;
  afterFamilies: DirectionFamilySignature;
}

interface StoredSignature {
  fingerprint: string;
  energyBucket: EnergyBucket;
  signature: DirectionSignature;
}

function readStoredSignatures(): StoredSignature[] {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      fingerprint: string;
      energyBucket?: EnergyBucket;
      signature: DirectionSignature;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => ({
      fingerprint: entry.fingerprint,
      energyBucket: entry.energyBucket ?? "mid",
      signature: entry.signature,
    }));
  } catch {
    return [];
  }
}

function hashSalt(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 6) + 1;
}

export function resolveHighEnergyStrategy(audioFeatures: AudioFeatures): HighEnergyStrategy {
  const sc = audioFeatures.songCharacter;
  const dna = audioFeatures.visualDna;

  if (
    sc.performanceStyle === "synthetic" ||
    sc.performanceStyle === "mechanical" ||
    sc.rhythmFeel === "grid"
  ) {
    return "mechanical-grid";
  }

  if (
    dna.sceneDensity === "dense" ||
    sc.texture === "raw" ||
    dna.layerCount >= 4
  ) {
    return "dense-layering";
  }

  if (
    audioFeatures.emotionalVector.organic > 0.52 ||
    sc.performanceStyle === "live_band"
  ) {
    return "organic-push-pull";
  }

  if (
    sc.emotionalTemperature === "warm" ||
    sc.emotionalTemperature === "warm_space" ||
    sc.emotionalTemperature === "hot"
  ) {
    return "emotional-expansion";
  }

  return "asymmetric-offset";
}

function compositionUsesCenterBurst(direction: CreativeDirection): boolean {
  const name = direction.composition.composition.toLowerCase();
  return name.includes("radial") || name.includes("burst") || name.includes("orbital");
}

function motionUsesFragmentation(brief: MotionLanguageBrief): boolean {
  return brief.deformation === "fragmentation" || brief.timing === "staccato";
}

function motionUsesAggressiveElastic(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): boolean {
  const brief = direction.motionLanguage;
  const families = computeDirectionFamilies(direction);
  return (
    families.motionFamily === "kinetic-elastic" ||
    (brief.material === "elastic" &&
      (brief.force === "aggressive" || brief.force === "explosive")) ||
    (direction.visualLanguage.motionCharacter === "kinetic" &&
      isHighIntensityAudio(audioFeatures) &&
      brief.material === "elastic")
  );
}

function layoutIsCompressed(direction: CreativeDirection): boolean {
  return (
    direction.visualLanguage.composition === "compressed" ||
    direction.visualLanguage.spacing === "tight" ||
    (direction.composition.textDensity === "dense" &&
      direction.composition.negativeSpace < 0.38)
  );
}

/** High-energy songs that collapsed into the default visualizer template. */
export function isHighEnergyDefaultTemplate(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures
): boolean {
  if (!isHighIntensityAudio(audioFeatures)) return false;

  const centerBurst = compositionUsesCenterBurst(direction);
  const fragmentation = motionUsesFragmentation(direction.motionLanguage);
  const aggressiveElastic = motionUsesAggressiveElastic(direction, audioFeatures);
  const compressed = layoutIsCompressed(direction);

  const templateHits = [centerBurst, fragmentation, aggressiveElastic, compressed].filter(
    Boolean
  ).length;

  return templateHits >= 2;
}

export function findSimilarEnergyFamilyCollision(
  fingerprint: string,
  audioFeatures: AudioFeatures,
  signature: DirectionSignature
): StoredSignature | null {
  const bucket = computeEnergyBucket(audioFeatures);

  for (const stored of readStoredSignatures()) {
    if (stored.fingerprint === fingerprint) continue;
    if (stored.energyBucket !== bucket) continue;
    if (familiesNearlyIdentical(signature.families, stored.signature.families)) {
      return stored;
    }
  }

  return null;
}

const STRATEGY_BEHAVIOR: Record<HighEnergyStrategy, MotionBehavior> = {
  "organic-push-pull": "tension",
  "mechanical-grid": "oscillation",
  "emotional-expansion": "breathing",
  "dense-layering": "accumulation",
  "asymmetric-offset": "stretch",
};

function strategyMotionBehavior(strategy: HighEnergyStrategy): MotionBehaviorBrief {
  const primary = STRATEGY_BEHAVIOR[strategy];
  return { primary, secondary: primary === "tension" ? "breathing" : "stretch" };
}

function strategyMotionLanguage(
  strategy: HighEnergyStrategy,
  base: MotionLanguageBrief
): MotionLanguageBrief {
  switch (strategy) {
    case "organic-push-pull":
      return {
        ...base,
        force: base.force === "explosive" ? "aggressive" : "controlled",
        material: "organic",
        timing: "irregular",
        deformation: "scale",
        direction: "horizontal",
      };
    case "mechanical-grid":
      return {
        ...base,
        force: "controlled",
        material: "mechanical",
        timing: "repetitive",
        deformation: "none",
        direction: "horizontal",
      };
    case "emotional-expansion":
      return {
        ...base,
        force: "controlled",
        material: "organic",
        timing: "smooth",
        deformation: "scale",
        direction: "orbital",
      };
    case "dense-layering":
      return {
        ...base,
        force: base.force === "subtle" ? "controlled" : base.force,
        material: base.material === "fluid" ? "rigid" : base.material,
        timing: "repetitive",
        deformation: base.deformation === "fragmentation" ? "scale" : base.deformation,
        direction: "vertical",
      };
    case "asymmetric-offset":
    default:
      return {
        ...base,
        force: "controlled",
        material: base.material === "elastic" ? "organic" : base.material,
        timing: "irregular",
        deformation: base.deformation === "fragmentation" ? "stretch" : base.deformation,
        direction: "horizontal",
      };
  }
}

function strategyComposition(
  strategy: HighEnergyStrategy,
  direction: CreativeDirection
): CreativeDirection["composition"] {
  const base = direction.composition;

  switch (strategy) {
    case "organic-push-pull":
      return {
        ...base,
        composition: "offset-column",
        alignment: "left",
        negativeSpace: Math.max(base.negativeSpace, 0.36),
        textDensity: "balanced",
      };
    case "mechanical-grid":
      return {
        ...base,
        composition: "center-column",
        alignment: "center",
        negativeSpace: Math.min(base.negativeSpace, 0.42),
        textDensity: "dense",
      };
    case "emotional-expansion":
      return {
        ...base,
        composition: "poster-stack",
        alignment: "center",
        negativeSpace: Math.max(base.negativeSpace, 0.44),
        textDensity: "sparse",
      };
    case "dense-layering":
      return {
        ...base,
        composition: "vertical-stack",
        alignment: "center",
        negativeSpace: Math.min(base.negativeSpace, 0.32),
        textDensity: "dense",
      };
    case "asymmetric-offset":
    default:
      return {
        ...base,
        composition: "diagonal-rail",
        alignment: "left",
        negativeSpace: Math.max(base.negativeSpace, 0.4),
        textDensity: "balanced",
      };
  }
}

function applyHighEnergyStrategy(
  direction: CreativeDirection,
  strategy: HighEnergyStrategy
): CreativeDirection {
  const motionLanguage = strategyMotionLanguage(strategy, direction.motionLanguage);
  const composition = strategyComposition(strategy, direction);

  let visualLanguage = { ...direction.visualLanguage };

  switch (strategy) {
    case "organic-push-pull":
      visualLanguage = {
        ...visualLanguage,
        motionCharacter: "elastic",
        geometry: "organic",
        symmetry: "asymmetric",
        composition: "expanded",
        spacing: "balanced",
      };
      break;
    case "mechanical-grid":
      visualLanguage = {
        ...visualLanguage,
        motionCharacter: "mechanical",
        geometry: "modular",
        symmetry: "symmetric",
        composition: "stacked",
        spacing: "tight",
      };
      break;
    case "emotional-expansion":
      visualLanguage = {
        ...visualLanguage,
        motionCharacter: "elastic",
        geometry: "organic",
        symmetry: "offset",
        composition: "expanded",
        spacing: "loose",
      };
      break;
    case "dense-layering":
      visualLanguage = {
        ...visualLanguage,
        motionCharacter: "fragmented",
        geometry: "angular",
        symmetry: "asymmetric",
        composition: "oversized",
        depth: "layered",
      };
      break;
    case "asymmetric-offset":
      visualLanguage = {
        ...visualLanguage,
        motionCharacter: "kinetic",
        geometry: "angular",
        symmetry: "asymmetric",
        composition: "cropped",
      };
      break;
  }

  return {
    ...direction,
    composition,
    motionLanguage,
    motionBehavior: strategyMotionBehavior(strategy),
    visualLanguage: {
      ...visualLanguage,
      motionCharacter: motionCharacterFromDimensions(motionLanguage),
    },
    artisticIntent: [
      `Anti-template: high-energy ${strategy.replace(/-/g, " ")} — not center-burst/fragmentation/elastic default.`,
      direction.artisticIntent,
    ].join(" "),
  };
}

function needsAntiTemplateCorrection(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string
): { needed: boolean; reasons: string[] } {
  const signature = computeDirectionSignature(direction);
  const reasons: string[] = [];

  if (isHighEnergyDefaultTemplate(direction, audioFeatures)) {
    reasons.push("high-energy default template (burst/fragmentation/elastic/compressed)");
  }

  const energyCollision = findSimilarEnergyFamilyCollision(
    fingerprint,
    audioFeatures,
    signature
  );
  if (energyCollision) {
    reasons.push(
      `composition+motion+palette family matches prior ${energyCollision.energyBucket}-energy song`
    );
  }

  if (needsSpatialBehaviorSeparation(direction, audioFeatures, fingerprint)) {
    reasons.push(
      "high-energy fast track shares composition/deformation/motionBehavior with prior song"
    );
  }

  return { needed: reasons.length > 0, reasons };
}

export function enforceAntiTemplateRule(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string
): { direction: CreativeDirection; audit: AntiTemplateAudit } {
  const beforeFamilies = computeDirectionFamilies(direction);
  let current = direction;
  const reasons: string[] = [];
  let collisionSalt = 0;
  let strategy: HighEnergyStrategy | undefined;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const check = needsAntiTemplateCorrection(current, audioFeatures, fingerprint);
    if (!check.needed) break;

    reasons.push(...check.reasons);
    collisionSalt = hashSalt(`${fingerprint}:${attempt}:${check.reasons.join("|")}`);
    strategy = resolveHighEnergyStrategy(audioFeatures);

    if (isHighIntensityAudio(audioFeatures)) {
      current = applyHighEnergyStrategy(current, strategy);
    }

    const uniqueness = computeSongUniquenessVector(audioFeatures);
    current = differentiateDirectionFamilies(
      current,
      uniqueness,
      computeDirectionFamilies(current),
      audioFeatures,
      collisionSalt
    );

    const spatialCollapse = enforceSpatialBehaviorAntiCollapse(
      current,
      audioFeatures,
      fingerprint,
      collisionSalt
    );
    if (spatialCollapse.applied) {
      current = spatialCollapse.direction;
      reasons.push(...spatialCollapse.reasons);
    }
  }

  const afterFamilies = computeDirectionFamilies(current);
  const applied = !familiesNearlyIdentical(beforeFamilies, afterFamilies) || reasons.length > 0;

  if (applied) {
    console.log("[Anti-Template] Applied alternative interpretation", {
      reasons,
      strategy,
      collisionSalt,
      beforeFamilies,
      afterFamilies,
    });
  }

  return {
    direction: current,
    audit: {
      applied,
      reason: [...new Set(reasons)],
      strategy,
      collisionSalt,
      beforeFamilies,
      afterFamilies,
    },
  };
}
