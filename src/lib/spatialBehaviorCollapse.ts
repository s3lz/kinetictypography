import { motionCharacterFromDimensions } from "@/engine/motionDimensionsEngine";
import {
  applyMotionBehaviorToDirection,
  pickAlternateBehavior,
} from "@/engine/motionBehaviorEngine";
import {
  classifyCompositionFamily,
  type CompositionFamily,
  type DeformationFamily,
  computeSpatialBehaviorSignature,
  highEnergySpatialCollides,
} from "@/lib/directionFamilies";
import { computeDirectionSignature, type DirectionSignature } from "@/lib/songCharacterInterpretation";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { MotionDeformation } from "@/types/motionLanguage";
import type { MotionBehavior } from "@/types/motionBehavior";

const SIGNATURE_STORAGE_KEY = "creative-direction-signatures:v1";

const COMPOSITION_LAYOUT: Record<CompositionFamily, string[]> = {
  "center-column": ["center-column", "wide-banner", "center-stack"],
  "edge-anchor": ["edge-anchor", "bottom-anchor", "left-edge-crop"],
  "offset-asymmetric": ["offset-column", "diagonal-rail", "asymmetric-stack"],
  "poster-stack": ["poster-stack", "vertical-stack", "dense-poster"],
  "radial-wide": ["radial-burst", "orbital-spread", "wide-radial"],
  "left-rail": ["left-rail", "narrow-column", "left-anchor"],
};

const COMPOSITION_ALTERNATES: Record<CompositionFamily, CompositionFamily[]> = {
  "center-column": ["offset-asymmetric", "edge-anchor", "left-rail", "poster-stack"],
  "radial-wide": ["offset-asymmetric", "edge-anchor", "left-rail", "poster-stack"],
  "edge-anchor": ["offset-asymmetric", "left-rail", "poster-stack", "center-column"],
  "offset-asymmetric": ["edge-anchor", "left-rail", "poster-stack", "center-column"],
  "poster-stack": ["offset-asymmetric", "edge-anchor", "left-rail", "center-column"],
  "left-rail": ["offset-asymmetric", "edge-anchor", "poster-stack", "center-column"],
};

const DEFORMATION_ALTERNATES: Record<DeformationFamily, DeformationFamily[]> = {
  fragmentation: ["scale-stretch", "rotation", "none"],
  "scale-stretch": ["rotation", "none", "fragmentation"],
  rotation: ["scale-stretch", "none", "fragmentation"],
  none: ["scale-stretch", "rotation", "fragmentation"],
};

const DEFORMATION_VALUES: Record<DeformationFamily, MotionDeformation> = {
  none: "none",
  "scale-stretch": "stretch",
  rotation: "rotation",
  fragmentation: "fragmentation",
};

interface StoredEntry {
  fingerprint: string;
  signature: DirectionSignature;
}

function readStored(): StoredEntry[] {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function findHighEnergyFastSpatialCollision(
  fingerprint: string,
  audioFeatures: AudioFeatures,
  signature: DirectionSignature
): StoredEntry | null {
  const energy = audioFeatures.emotionalVector.energy;
  const tempo =
    audioFeatures.tempoInterpretation?.normalizedTempo ?? audioFeatures.tempo;
  if (energy <= 0.7 || tempo <= 120) return null;

  for (const stored of readStored()) {
    if (stored.fingerprint === fingerprint) continue;
    if (highEnergySpatialCollides(signature.spatialBehavior, stored.signature.spatialBehavior)) {
      return stored;
    }
  }

  return null;
}

function pickAlternateFamily<T extends string>(
  current: T,
  alternates: Record<string, T[]>,
  avoid: T,
  salt: number
): T {
  const options = (alternates[current] ?? []).filter((option) => option !== avoid);
  if (options.length === 0) return current;
  return options[salt % options.length] ?? options[0];
}

function applyCompositionFamily(
  direction: CreativeDirection,
  targetFamily: CompositionFamily,
  salt: number
): CreativeDirection {
  const layouts = COMPOSITION_LAYOUT[targetFamily];
  const layout = layouts[salt % layouts.length] ?? layouts[0];

  let alignment = direction.composition.alignment;
  if (targetFamily === "offset-asymmetric" || targetFamily === "left-rail" || targetFamily === "edge-anchor") {
    alignment = "left";
  } else if (targetFamily === "center-column" || targetFamily === "radial-wide") {
    alignment = "center";
  }

  let visualLanguage = { ...direction.visualLanguage };
  if (targetFamily === "offset-asymmetric" || targetFamily === "edge-anchor") {
    visualLanguage = {
      ...visualLanguage,
      symmetry: "asymmetric",
      composition: "cropped",
    };
  } else if (targetFamily === "poster-stack") {
    visualLanguage = {
      ...visualLanguage,
      composition: "stacked",
      depth: "layered",
    };
  } else if (targetFamily === "radial-wide") {
    visualLanguage = {
      ...visualLanguage,
      composition: "expanded",
      symmetry: "offset",
    };
  }

  return {
    ...direction,
    composition: {
      ...direction.composition,
      composition: layout,
      alignment,
      textDensity:
        targetFamily === "poster-stack" || targetFamily === "left-rail"
          ? "sparse"
          : targetFamily === "center-column"
            ? "dense"
            : "balanced",
    },
    visualLanguage,
  };
}

function applyDeformationFamily(
  direction: CreativeDirection,
  targetFamily: DeformationFamily
): CreativeDirection {
  return {
    ...direction,
    motionLanguage: {
      ...direction.motionLanguage,
      deformation: DEFORMATION_VALUES[targetFamily],
    },
  };
}

function applyBehaviorFamily(
  direction: CreativeDirection,
  behavior: MotionBehavior
): CreativeDirection {
  const compositionFamily = classifyCompositionFamily(direction);
  const applied = applyMotionBehaviorToDirection(direction, behavior);

  let visualLanguage = { ...direction.visualLanguage };
  if (behavior === "breathing" || behavior === "tension") {
    visualLanguage = {
      ...visualLanguage,
      motionCharacter: "elastic",
      symmetry: "asymmetric",
    };
  } else if (behavior === "stretch") {
    visualLanguage = {
      ...visualLanguage,
      motionCharacter: "kinetic",
    };
  } else if (behavior === "accumulation") {
    visualLanguage = {
      ...visualLanguage,
      depth: "layered",
      motionCharacter: "fragmented",
    };
  }

  return {
    ...direction,
    ...applied,
    visualLanguage: {
      ...visualLanguage,
      motionCharacter: motionCharacterFromDimensions(applied.motionLanguage),
    },
    artisticIntent: [
      `Anti-collapse: physical behavior ${behavior} replaces prior high-energy kinetic burst family.`,
      direction.artisticIntent,
    ].join(" "),
  };
}

export function enforceSpatialBehaviorAntiCollapse(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string,
  salt: number
): { direction: CreativeDirection; applied: boolean; reasons: string[] } {
  const signature = computeDirectionSignature(direction);
  const collision = findHighEnergyFastSpatialCollision(
    fingerprint,
    audioFeatures,
    signature
  );

  if (!collision) {
    return { direction, applied: false, reasons: [] };
  }

  const stored = collision.signature.spatialBehavior;
  const current = signature.spatialBehavior;
  const reasons: string[] = [];
  let next = { ...direction };

  if (current.compositionFamily === stored.compositionFamily) {
    const alternate = pickAlternateFamily(
      current.compositionFamily,
      COMPOSITION_ALTERNATES,
      stored.compositionFamily,
      salt
    );
    next = applyCompositionFamily(next, alternate, salt);
    reasons.push(
      `composition family ${stored.compositionFamily} → ${alternate}`
    );
  }

  const nextSpatial = computeSpatialBehaviorSignature(next);
  if (nextSpatial.deformationFamily === stored.deformationFamily) {
    const alternate = pickAlternateFamily(
      nextSpatial.deformationFamily,
      DEFORMATION_ALTERNATES,
      stored.deformationFamily,
      salt + 1
    );
    next = applyDeformationFamily(next, alternate);
    reasons.push(`deformation family ${stored.deformationFamily} → ${alternate}`);
  }

  const nextSpatial2 = computeSpatialBehaviorSignature(next);
  if (nextSpatial2.motionBehavior === stored.motionBehavior) {
    const alternate = pickAlternateBehavior(
      stored.motionBehavior,
      salt + 2,
      nextSpatial2.compositionFamily
    );
    next = applyBehaviorFamily(next, alternate);
    reasons.push(`motionBehavior ${stored.motionBehavior} → ${alternate}`);
  }

  return {
    direction: next,
    applied: reasons.length > 0,
    reasons,
  };
}

export function needsSpatialBehaviorSeparation(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string
): boolean {
  const signature = computeDirectionSignature(direction);
  return findHighEnergyFastSpatialCollision(fingerprint, audioFeatures, signature) !== null;
}
