import type { AudioFeatures } from "@/types/audio";
import type { MotionDimension, MotionLevels } from "@/types/CreativeState";
import type {
  PhysicalModel,
  TypographyBehavior,
} from "@/types/physicalIdentity";
import type { MotionParamsMap } from "@/types/motionMetadata";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Bias which motion primitives carry energy from compiled physical identity.
 * Keeps the same 6 primitives — only primary/levels change so songs with
 * different materials don't all land on float+pulse.
 */
export function applyIdentityToMotionSelection(
  levels: MotionLevels,
  primary: MotionDimension,
  secondary: MotionDimension[],
  physical: PhysicalModel,
  typography: TypographyBehavior
): {
  levels: MotionLevels;
  primary: MotionDimension;
  secondary: MotionDimension[];
} {
  const scores: Record<MotionDimension, number> = {
    float: levels.float,
    wave: levels.wave,
    pulse: levels.pulse,
    elastic: levels.elastic,
    impact: levels.impact,
    material: levels.material,
  };

  // Lift identity-aligned primitives so they can become primary.
  if (physical.deformation === "fracture" || physical.material === "fragile") {
    scores.impact += 55;
    scores.elastic += 28;
    scores.float -= 20;
    scores.pulse -= 12;
  } else if (physical.deformation === "flow" || physical.material === "fluid") {
    scores.wave += 50;
    scores.float += 35;
    scores.impact -= 25;
    scores.elastic -= 10;
  } else if (physical.deformation === "stretch" || physical.material === "elastic") {
    scores.elastic += 52;
    scores.pulse += 18;
    scores.float -= 12;
  } else if (physical.deformation === "compress") {
    scores.pulse += 40;
    scores.elastic += 30;
    scores.impact += 15;
  } else if (physical.deformation === "vibrate") {
    scores.pulse += 35;
    scores.material += 25;
    scores.impact += 20;
  } else if (physical.deformation === "dissolve" || physical.material === "gaseous") {
    scores.float += 48;
    scores.wave += 22;
    scores.impact -= 30;
  } else if (physical.material === "rigid" || physical.material === "granular") {
    scores.impact += 30;
    scores.material += 28;
    scores.elastic += 18;
  }

  if (typography.wordBehavior === "fracture" || typography.wordBehavior === "collide") {
    scores.impact += 20;
  }
  if (typography.wordBehavior === "flow" || typography.wordBehavior === "drift") {
    scores.wave += 18;
    scores.float += 14;
  }
  if (typography.wordBehavior === "orbit") {
    scores.float += 30;
  }
  if (physical.recovery === "snap") {
    scores.impact += 12;
    scores.elastic += 10;
  }
  if (physical.recovery === "settle" && physical.material === "fluid") {
    scores.wave += 10;
    scores.float += 8;
  }

  const ranked = (Object.entries(scores) as Array<[MotionDimension, number]>)
    .filter(([dim]) => dim !== "material")
    .sort((a, b) => b[1] - a[1]);

  const nextPrimary = ranked[0]?.[0] ?? primary;
  const nextSecondary = ranked
    .slice(1)
    .map(([dim]) => dim)
    .filter((dim) => dim !== nextPrimary)
    .slice(0, 1);

  const primaryLevel = clamp(
    Math.max(levels[nextPrimary] || 0, 58) + Math.round(physical.tension * 22),
    48,
    94
  );

  const nextLevels: MotionLevels = {
    float: 0,
    wave: 0,
    pulse: 0,
    elastic: 0,
    impact: 0,
    material: levels.material > 0 ? Math.max(levels.material, 14) : 14,
  };
  nextLevels[nextPrimary] = primaryLevel;
  if (nextSecondary[0]) {
    nextLevels[nextSecondary[0]] = 30;
  }

  // Keep a whisper of the previous audio primary if different — doesn't dominate.
  if (primary !== nextPrimary && levels[primary] > 0) {
    nextLevels[primary] = Math.max(nextLevels[primary], 12);
  }

  return {
    levels: nextLevels,
    primary: nextPrimary,
    secondary: nextSecondary,
  };
}

/** Merge identity-seeded params after selection so uniqueness axes stay. */
export function mergeIdentityMotionParams(
  audioParams: MotionParamsMap,
  identityParams: MotionParamsMap
): MotionParamsMap {
  return {
    pulse: { ...audioParams.pulse, ...identityParams.pulse },
    float: { ...audioParams.float, ...identityParams.float },
    wave: { ...audioParams.wave, ...identityParams.wave },
    elastic: { ...audioParams.elastic, ...identityParams.elastic },
    impact: { ...audioParams.impact, ...identityParams.impact },
    material: { ...audioParams.material, ...identityParams.material },
  };
}
