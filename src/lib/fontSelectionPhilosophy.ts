import type { FontId } from "@/engine/fontSelector";
import type { AudioFeatures } from "@/types/audio";
import type { EmotionalVector } from "@/types/emotionalVector";
import type { FontMetadata } from "@/types/fontMetadata";
import { computeEnergyBucket } from "@/lib/creativeFactors";
import type { SongCharacter } from "@/types/songCharacter";

/**
 * Font Selection Philosophy
 *
 * The font is the physical material of the typography animation.
 * Song character should steer which materials win so different songs
 * do not always crown the same high-motionPotential typeface.
 *
 * Font must never determine palette, motion, composition, camera, or aesthetic world.
 */

const FONT_SELECTION_STORAGE_KEY = "font-selection-history:v1";
const MAX_STORED_FONT_SELECTIONS = 16;

interface StoredFontSelection {
  fingerprint: string;
  fontId: FontId;
  category: string;
  energyBucket: ReturnType<typeof computeEnergyBucket>;
  performanceStyle?: string;
  energyType?: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function hasVisualTag(font: FontMetadata, fragments: string[]): boolean {
  const tags = font.visualIdentity.map((tag) => tag.toLowerCase());
  return fragments.some((fragment) => tags.some((tag) => tag.includes(fragment)));
}

/** How well letterforms can stretch, fragment, silhouette, and read as memorable shapes. */
export function scoreMotionPotential(font: FontMetadata): number {
  const { structure, experimental, contrastPotential } = font;

  const stretchScore = clamp01(
    (1 - structure.density / 5) * 0.4 +
      (structure.strokeContrast / 5) * 0.25 +
      (structure.complexity / 5) * 0.35
  );

  const fragmentScore = clamp01(
    (structure.sharpness / 5) * 0.35 +
      (structure.complexity / 5) * 0.35 +
      (hasVisualTag(font, ["pixel", "grid", "fragment", "modular"]) ? 0.3 : 0)
  );

  const silhouetteScore = clamp01(
    (structure.strokeContrast / 5) * 0.4 +
      (1 - Math.abs(structure.complexity - 3) / 2) * 0.35 +
      (structure.sharpness / 5) * 0.25
  );

  const memorableScore = clamp01(
    (experimental / 5) * 0.35 +
      (contrastPotential / 5) * 0.35 +
      (structure.strokeContrast / 5) * 0.15 +
      (structure.complexity / 5) * 0.15
  );

  const materialBonus = hasVisualTag(font, [
    "calligraphic",
    "condensed",
    "geometric",
    "pixel",
    "swash",
    "monospaced",
    "angular",
  ])
    ? 0.08
    : 0;

  return clamp01(
    stretchScore * 0.28 +
      fragmentScore * 0.22 +
      silhouetteScore * 0.28 +
      memorableScore * 0.22 +
      materialBonus
  );
}

interface LiteralClicheProfile {
  elegant: number;
  aggressive: number;
  gothic: number;
  futuristic: number;
  vintage: number;
}

function deriveLiteralClicheProfile(vector: EmotionalVector): LiteralClicheProfile {
  return {
    elegant: clamp01(
      vector.warmth * 0.4 + (1 - vector.energy) * 0.35 + vector.organic * 0.25
    ),
    aggressive: clamp01(vector.energy * 0.5 + vector.tension * 0.5),
    gothic: clamp01(
      vector.darkness * 0.55 + vector.tension * 0.25 + (1 - vector.warmth) * 0.2
    ),
    futuristic: clamp01(
      (1 - vector.warmth) * 0.35 +
        vector.tension * 0.25 +
        vector.energy * 0.2 +
        (1 - vector.organic) * 0.2
    ),
    vintage: clamp01(
      vector.nostalgia * 0.6 + vector.warmth * 0.25 + (1 - vector.energy) * 0.15
    ),
  };
}

function deriveFontStructureProfile(font: FontMetadata): LiteralClicheProfile {
  const { structure, energy } = font;
  const roundness = structure.roundness / 5;
  const sharpness = structure.sharpness / 5;
  const density = structure.density / 5;
  const contrast = structure.strokeContrast / 5;

  return {
    elegant: clamp01(roundness * 0.55 + (1 - sharpness) * 0.25 + (1 - density) * 0.2),
    aggressive: clamp01(sharpness * 0.35 + density * 0.35 + (energy / 5) * 0.3),
    gothic: clamp01(sharpness * 0.45 + density * 0.35 + (1 - roundness) * 0.2),
    futuristic: clamp01(sharpness * 0.4 + (1 - roundness) * 0.35 + contrast * 0.25),
    vintage: clamp01(roundness * 0.35 + (structure.complexity / 5) * 0.35 + contrast * 0.3),
  };
}

function similarity(a: number, b: number): number {
  return clamp01(1 - Math.abs(a - b));
}

export function scoreLiteralClicheMatch(
  font: FontMetadata,
  vector: EmotionalVector
): number {
  const cliche = deriveLiteralClicheProfile(vector);
  const fontProfile = deriveFontStructureProfile(font);

  return average([
    similarity(cliche.elegant, fontProfile.elegant),
    similarity(cliche.aggressive, fontProfile.aggressive),
    similarity(cliche.gothic, fontProfile.gothic),
    similarity(cliche.futuristic, fontProfile.futuristic),
    similarity(cliche.vintage, fontProfile.vintage),
  ]);
}

export function scoreVisualTension(
  font: FontMetadata,
  vector: EmotionalVector
): number {
  const fontProfile = deriveFontStructureProfile(font);
  const cliche = deriveLiteralClicheProfile(vector);
  const literalMatch = scoreLiteralClicheMatch(font, vector);

  const structuralDelta = average([
    Math.abs(fontProfile.elegant - cliche.elegant),
    Math.abs(fontProfile.aggressive - cliche.aggressive),
    Math.abs(fontProfile.gothic - cliche.gothic),
    Math.abs(fontProfile.futuristic - cliche.futuristic),
    Math.abs(fontProfile.vintage - cliche.vintage),
  ]);

  const tensionReward = clamp01(
    structuralDelta * 0.45 + (font.contrastPotential / 5) * 0.55
  );

  return clamp01(tensionReward * 0.6 + (1 - literalMatch) * 0.4);
}

export function scoreLetterformPersonality(font: FontMetadata): number {
  const { structure, visualIdentity } = font;

  const distinctiveness = average([
    structure.complexity / 5,
    structure.strokeContrast / 5,
    Math.abs(structure.sharpness - structure.roundness) / 5,
    Math.abs(structure.density - 3) / 2,
  ]);

  const identityClarity = visualIdentity.length >= 2 ? 0.85 : 0.55;

  return clamp01(distinctiveness * 0.7 + identityClarity * 0.3);
}

/**
 * Song character → letterform structure affinity.
 * Differentiates fonts across songs without hardcoding track titles.
 */
export function scoreSongCharacterFit(
  font: FontMetadata,
  songCharacter: SongCharacter
): number {
  const { structure, energy } = font;
  const sharp = structure.sharpness / 5;
  const round = structure.roundness / 5;
  const density = structure.density / 5;
  const contrast = structure.strokeContrast / 5;
  const airy = 1 - density;
  const fontEnergy = energy / 5;

  let targetSharp = 0.45;
  let targetRound = 0.45;
  let targetDensity = 0.45;
  let targetEnergy = 0.5;
  let targetContrast = 0.45;

  switch (songCharacter.energyType) {
    case "restless":
    case "surging":
      targetSharp = 0.75;
      targetRound = 0.25;
      targetDensity = 0.6;
      targetEnergy = 0.8;
      targetContrast = 0.7;
      break;
    case "floating":
      targetSharp = 0.25;
      targetRound = 0.7;
      targetDensity = 0.3;
      targetEnergy = 0.35;
      targetContrast = 0.4;
      break;
    case "controlled":
      targetSharp = 0.55;
      targetRound = 0.35;
      targetDensity = 0.5;
      targetEnergy = 0.55;
      targetContrast = 0.6;
      break;
    case "subdued":
      targetSharp = 0.3;
      targetRound = 0.6;
      targetDensity = 0.35;
      targetEnergy = 0.3;
      targetContrast = 0.35;
      break;
  }

  switch (songCharacter.performanceStyle) {
    case "live_band":
      targetSharp = Math.max(targetSharp, 0.55);
      targetEnergy = Math.max(targetEnergy, 0.6);
      break;
    case "synthetic":
    case "mechanical":
      targetSharp = Math.max(targetSharp, 0.6);
      targetRound = Math.min(targetRound, 0.35);
      break;
    case "atmospheric":
    case "intimate":
      targetRound = Math.max(targetRound, 0.55);
      targetDensity = Math.min(targetDensity, 0.4);
      break;
    default:
      break;
  }

  if (songCharacter.rhythmFeel === "staccato") {
    targetSharp += 0.1;
    targetContrast += 0.08;
  }
  if (songCharacter.rhythmFeel === "slow" || songCharacter.rhythmFeel === "loose") {
    targetRound += 0.08;
    targetEnergy -= 0.08;
  }
  if (songCharacter.texture === "raw" || songCharacter.texture === "grainy") {
    targetContrast += 0.1;
    targetSharp += 0.05;
  }
  if (songCharacter.texture === "smooth" || songCharacter.texture === "dissolved") {
    targetRound += 0.1;
    targetSharp -= 0.05;
  }

  targetSharp = clamp01(targetSharp);
  targetRound = clamp01(targetRound);
  targetDensity = clamp01(targetDensity);
  targetEnergy = clamp01(targetEnergy);
  targetContrast = clamp01(targetContrast);

  const fit = average([
    similarity(sharp, targetSharp),
    similarity(round, targetRound),
    similarity(density, targetDensity),
    similarity(fontEnergy, targetEnergy),
    similarity(contrast, targetContrast),
    similarity(airy, 1 - targetDensity),
  ]);

  let tagBonus = 0;
  if (
    (songCharacter.energyType === "restless" || songCharacter.energyType === "surging") &&
    hasVisualTag(font, ["angular", "condensed", "display", "brutal", "sharp"])
  ) {
    tagBonus += 0.08;
  }
  if (
    (songCharacter.energyType === "floating" ||
      songCharacter.performanceStyle === "atmospheric") &&
    hasVisualTag(font, ["script", "soft", "light", "calligraphic", "fluid"])
  ) {
    tagBonus += 0.08;
  }
  if (
    (songCharacter.performanceStyle === "synthetic" ||
      songCharacter.performanceStyle === "mechanical") &&
    hasVisualTag(font, ["geometric", "modular", "pixel", "mono", "technical"])
  ) {
    tagBonus += 0.08;
  }

  return clamp01(fit + tagBonus);
}

function readStoredFontSelections(): StoredFontSelection[] {
  try {
    const raw = localStorage.getItem(FONT_SELECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredFontSelection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Penalize fonts recently used for similar songs. Returns 0–1 (1 = no penalty). */
export function scoreFontRepetition(
  font: FontMetadata,
  fingerprint: string | undefined,
  audioFeatures: AudioFeatures
): number {
  const energyBucket = computeEnergyBucket(audioFeatures);
  const history = readStoredFontSelections().filter(
    (entry) => entry.fingerprint !== fingerprint
  );

  if (history.length === 0) return 1;

  let score = 1;
  const { performanceStyle, energyType } = audioFeatures.songCharacter;

  for (const entry of history) {
    if (entry.fontId === font.name) {
      score *= 0.22;
      if (
        entry.performanceStyle === performanceStyle ||
        entry.energyType === energyType ||
        entry.energyBucket === energyBucket
      ) {
        score *= 0.7;
      }
    } else if (
      entry.category === font.category &&
      (entry.energyBucket === energyBucket || entry.energyType === energyType)
    ) {
      score *= 0.55;
    }
  }

  return clamp01(score);
}

export function recordFontSelection(
  fingerprint: string,
  font: FontMetadata,
  audioFeatures: AudioFeatures
): void {
  try {
    const energyBucket = computeEnergyBucket(audioFeatures);
    const existing = readStoredFontSelections().filter(
      (entry) => entry.fingerprint !== fingerprint
    );
    existing.unshift({
      fingerprint,
      fontId: font.name,
      category: font.category,
      energyBucket,
      performanceStyle: audioFeatures.songCharacter.performanceStyle,
      energyType: audioFeatures.songCharacter.energyType,
    });
    localStorage.setItem(
      FONT_SELECTION_STORAGE_KEY,
      JSON.stringify(existing.slice(0, MAX_STORED_FONT_SELECTIONS))
    );
  } catch {
    // ignore storage failures
  }
}

export function buildFontSelectionReasoning(
  font: FontMetadata,
  scores: {
    motionPotential: number;
    visualTension: number;
    letterformPersonality: number;
    literalClicheMatch: number;
    songCharacterFit?: number;
  }
): string {
  const material = font.visualIdentity.slice(0, 3).join(", ") || "distinct letterforms";
  const motionNote =
    scores.motionPotential >= 0.65
      ? "strong animation material"
      : "usable animation material";

  return [
    `Selected as physical typography material (${motionNote}) — ${material}.`,
    "Would this letterform create an interesting animated object without color or audio? Yes.",
    `Motion potential ${(scores.motionPotential * 100).toFixed(0)}%, song-character fit ${((scores.songCharacterFit ?? 0) * 100).toFixed(0)}%, visual tension ${(scores.visualTension * 100).toFixed(0)}%, letterform personality ${(scores.letterformPersonality * 100).toFixed(0)}%.`,
    scores.literalClicheMatch > 0.72
      ? "Literal genre costume avoided — font chosen for letterform physics matching song character."
      : "Font chosen for letterform character aligned to song energy/structure.",
    "Font does not determine palette, composition, or camera.",
  ].join(" ");
}
