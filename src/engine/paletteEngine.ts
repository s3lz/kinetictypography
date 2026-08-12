import { computeSongUniquenessVector } from "@/lib/songUniquenessVector";
import type { AudioFeatures } from "@/types/audio";
import type {
  LightBehavior,
  PaletteBrief,
  PaletteStrategy,
} from "@/types/palette";
import type { SongCharacter } from "@/types/songCharacter";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);

  const toChannel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${toChannel(0)}${toChannel(8)}${toChannel(4)}`;
}

export interface VisualAtmosphere {
  lightBehavior: LightBehavior;
  material: string;
  strategy: PaletteStrategy;
  hueAnchor: number;
  preferLightBackground: boolean;
  softness: number;
  contrast: number;
}

/** Wider hue set so differentiation key can land farther apart. */
const HUE_ANCHORS = [
  12, 28, 48, 72, 98, 128, 152, 172, 188, 205, 222, 238, 258, 278, 298, 318, 338,
];

const ENVIRONMENT_MATERIALS = [
  "rehearsal room",
  "sunlight through glass",
  "old film",
  "painted wall",
  "stage lighting",
  "paper texture",
  "empty architectural space",
  "colorful street scene",
  "underwater atmosphere",
  "industrial surface",
  "matte plaster",
  "printed poster",
  "night window",
  "wet asphalt",
  "cold LED wash",
];

function hashSeed(audioFeatures: AudioFeatures): number {
  const uniqueness = computeSongUniquenessVector(audioFeatures);
  const { warmth, organic, tension, nostalgia, energy, darkness } =
    audioFeatures.emotionalVector;
  const sc = audioFeatures.songCharacter;
  const seed = [
    uniqueness.differentiationKey,
    sc.performanceStyle,
    sc.energyType,
    sc.rhythmFeel,
    sc.texture,
    sc.emotionalTemperature,
    audioFeatures.visualDna.layoutBias,
    audioFeatures.visualDna.sceneDensity,
    String(Math.round(warmth * 100)),
    String(Math.round(organic * 100)),
    String(Math.round(tension * 100)),
    String(Math.round(nostalgia * 100)),
    String(Math.round(energy * 100)),
    String(Math.round(darkness * 100)),
    String(Math.round(audioFeatures.tempo)),
    String(Math.round(audioFeatures.brightness * 100)),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Small secondary nudge only — never the primary hue driver. */
function characterHueBias(sc: SongCharacter): number {
  switch (sc.emotionalTemperature) {
    case "hot":
      return 18;
    case "warm":
    case "warm_space":
      return 42;
    case "cool_tension":
      return 210;
    case "cool":
      return 195;
    default:
      return 168;
  }
}

/** Hue implied by the imagined material environment (primary driver). */
function materialHueBias(material: string): number {
  const key = material.toLowerCase();
  if (key.includes("stage lighting")) return 312; // magenta/gel stage wash
  if (key.includes("cold led")) return 198;
  if (key.includes("underwater")) return 188;
  if (key.includes("industrial")) return 215;
  if (key.includes("wet asphalt")) return 210;
  if (key.includes("night window")) return 228;
  if (key.includes("architectural")) return 205;
  if (key.includes("street")) return 355; // poster/street chroma
  if (key.includes("printed poster")) return 348;
  if (key.includes("painted wall")) return 18;
  if (key.includes("old film")) return 36;
  if (key.includes("paper")) return 48;
  if (key.includes("plaster")) return 52;
  if (key.includes("sunlight") || key.includes("glass")) return 55;
  if (key.includes("rehearsal")) return 42;
  return 168;
}

/** Hue implied by lighting behavior in that environment. */
function lightHueBias(lightBehavior: LightBehavior): number {
  switch (lightBehavior) {
    case "bright-natural":
      return 52;
    case "soft-diffused":
      return 45;
    case "muted-daylight":
      return 58;
    case "glowing-atmosphere":
      return 32;
    case "faded-film":
      return 38;
    case "flat-graphic":
      return 340;
    case "artificial-stage":
      return 285; // cyan–magenta gel, not warm metal
    case "dramatic-shadows":
      return 232; // cool shadow field — not bronze/orange
    default:
      return 168;
  }
}

/**
 * Hue from imagined visual environment (material + light), with song-hash
 * differentiation. Emotional temperature is only a light nudge.
 */
function deriveEnvironmentHueAnchor(
  material: string,
  lightBehavior: LightBehavior,
  sc: SongCharacter,
  hash: number
): number {
  const envHue =
    (materialHueBias(material) * 0.58 + lightHueBias(lightBehavior) * 0.42) % 360;
  const diffHue = HUE_ANCHORS[hash % HUE_ANCHORS.length];
  const tempNudge = characterHueBias(sc);

  return Math.round(
    (envHue * 0.68 + diffHue * 0.22 + tempNudge * 0.1 + (hash % 23)) % 360
  );
}

export function deriveLightBehavior(audioFeatures: AudioFeatures): LightBehavior {
  const { darkness, warmth, organic, tension, energy } = audioFeatures.emotionalVector;
  const { visualWeight, focalStability, sceneDensity } = audioFeatures.visualDna;
  const { humanity, mechanicalness, rawness, imperfection } =
    audioFeatures.performanceTexture;
  const { energyType, performanceStyle, texture } = audioFeatures.songCharacter;

  if (imperfection > 0.52 || audioFeatures.emotionalVector.nostalgia > 0.52) {
    return "faded-film";
  }

  if (sceneDensity === "minimal" && focalStability > 0.55) {
    return "flat-graphic";
  }

  if (
    (energyType === "restless" || energyType === "surging") &&
    energy > 0.55 &&
    tension > 0.42
  ) {
    return mechanicalness > 0.45 || performanceStyle === "synthetic"
      ? "artificial-stage"
      : "dramatic-shadows";
  }

  if (performanceStyle === "atmospheric" || energyType === "floating") {
    return warmth > 0.5 ? "glowing-atmosphere" : "muted-daylight";
  }

  if (warmth > 0.52 && organic > 0.48 && humanity > 0.5 && darkness < 0.5) {
    return "bright-natural";
  }

  if (warmth > 0.48 && tension < 0.5 && organic > 0.45 && energyType === "subdued") {
    return "soft-diffused";
  }

  if (visualWeight === "airy" || sceneDensity === "sparse") {
    return "muted-daylight";
  }

  if (
    darkness > 0.68 &&
    mechanicalness > 0.55 &&
    organic < 0.38 &&
    humanity < 0.42
  ) {
    return "dramatic-shadows";
  }

  if (mechanicalness > 0.55 && tension > 0.48) {
    return "artificial-stage";
  }

  if (rawness > 0.52 && tension > 0.5) {
    return "dramatic-shadows";
  }

  if (texture === "raw" && energy > 0.5) {
    return "artificial-stage";
  }

  if (organic > 0.5 && humanity > 0.52) {
    return "glowing-atmosphere";
  }

  return "soft-diffused";
}

export function deriveMaterialWorld(audioFeatures: AudioFeatures): string {
  const index = hashSeed(audioFeatures) % ENVIRONMENT_MATERIALS.length;
  const { performanceTexture, visualDna, songCharacter } = audioFeatures;
  const { nostalgia, organic } = audioFeatures.emotionalVector;

  if (nostalgia > 0.52) return "old film";
  if (songCharacter.energyType === "restless" || songCharacter.energyType === "surging") {
    // Always stage gel world for restless/surging — avoid "painted wall" mustard fields.
    return "stage lighting";
  }
  if (songCharacter.performanceStyle === "atmospheric") return "underwater atmosphere";
  if (songCharacter.performanceStyle === "synthetic") return "cold LED wash";
  if (performanceTexture.rawness > 0.55) return "painted wall";
  if (visualDna.sceneDensity === "minimal") return "empty architectural space";
  if (organic > 0.55 && performanceTexture.humanity > 0.5) return "paper texture";
  if (performanceTexture.mechanicalness > 0.55) return "industrial surface";
  if (visualDna.stereoWidth > 0.28) return "colorful street scene";
  return ENVIRONMENT_MATERIALS[index] ?? "sunlight through glass";
}

export function deriveColorRelationship(audioFeatures: AudioFeatures): PaletteStrategy {
  const { tension, nostalgia, organic, warmth, energy } = audioFeatures.emotionalVector;
  const { visualDna, performanceTexture, songCharacter } = audioFeatures;

  if (nostalgia > 0.52 || performanceTexture.imperfection > 0.48) {
    return "faded-cinematic";
  }

  if (
    songCharacter.energyType === "restless" ||
    songCharacter.energyType === "surging" ||
    (tension > 0.5 && energy > 0.55)
  ) {
    return "complementary-surprise";
  }

  if (songCharacter.performanceStyle === "atmospheric" || energy < 0.4) {
    return warmth > 0.5 ? "faded-cinematic" : "muted-contrast";
  }

  if (tension > 0.58 && organic < 0.45) {
    return "complementary-surprise";
  }

  if (visualDna.harmonicStability > 0.62 && songCharacter.energyType === "controlled") {
    return "monochromatic";
  }

  if (visualDna.visualWeight === "balanced" || tension > 0.45) {
    return "muted-contrast";
  }

  if (prefersLightAtmosphere(audioFeatures) || warmth > 0.48) {
    return "light-dark";
  }

  if (allowsDarkBackground(audioFeatures, deriveLightBehavior(audioFeatures))) {
    return "dark-light";
  }

  return "light-dark";
}

export function derivePaletteSoftness(audioFeatures: AudioFeatures): number {
  const { warmth, organic, tension, energy } = audioFeatures.emotionalVector;
  const { humanity, imperfection } = audioFeatures.performanceTexture;
  const restless =
    audioFeatures.songCharacter.energyType === "restless" ||
    audioFeatures.songCharacter.energyType === "surging";

  return clamp01(
    warmth * 0.2 +
      organic * 0.22 +
      humanity * 0.24 +
      imperfection * 0.12 -
      tension * 0.2 -
      (restless ? energy * 0.22 : 0) +
      0.2
  );
}

export function derivePaletteContrast(audioFeatures: AudioFeatures): number {
  const { tension, energy } = audioFeatures.emotionalVector;
  const { dynamics } = audioFeatures;
  const { transientSharpness, visualWeight } = audioFeatures.visualDna;
  const restless =
    audioFeatures.songCharacter.energyType === "restless" ||
    audioFeatures.songCharacter.energyType === "surging";

  return clamp01(
    tension * 0.24 +
      dynamics * 0.2 +
      transientSharpness * 0.18 +
      (restless ? energy * 0.22 : 0) +
      (visualWeight === "heavy" ? 0.12 : visualWeight === "airy" ? -0.1 : 0.04)
  );
}

export function allowsDarkBackground(
  audioFeatures: AudioFeatures,
  lightBehavior: LightBehavior
): boolean {
  const { darkness, energy } = audioFeatures.emotionalVector;
  const { mechanicalness, humanity } = audioFeatures.performanceTexture;
  const { energyType, performanceStyle } = audioFeatures.songCharacter;

  // Live band: near-black only when the song is actually dark — not for restless energy alone.
  if (performanceStyle === "live_band") {
    return (
      darkness > 0.7 &&
      (lightBehavior === "dramatic-shadows" || lightBehavior === "artificial-stage")
    );
  }

  // Synthetic restless/stage may still use dark fields.
  if (
    (energyType === "restless" || energyType === "surging") &&
    energy > 0.55 &&
    performanceStyle === "synthetic" &&
    (lightBehavior === "dramatic-shadows" || lightBehavior === "artificial-stage")
  ) {
    return true;
  }

  if (performanceStyle === "synthetic" && darkness > 0.45) {
    return true;
  }

  return (
    darkness > 0.65 &&
    (lightBehavior === "dramatic-shadows" ||
      lightBehavior === "artificial-stage") &&
    mechanicalness > 0.48 &&
    humanity < 0.55
  );
}

export function prefersLightAtmosphere(audioFeatures: AudioFeatures): boolean {
  const { warmth, organic, darkness, energy } = audioFeatures.emotionalVector;
  const { humanity } = audioFeatures.performanceTexture;
  const { energyType, performanceStyle } = audioFeatures.songCharacter;

  // Live-band restless/surging → living chromatic field (poster/stage wash), not a void.
  if (
    performanceStyle === "live_band" &&
    (energyType === "restless" || energyType === "surging")
  ) {
    return darkness < 0.7;
  }

  // Non-synthetic restless may still prefer mid/light chromatic fields.
  if (energyType === "restless" || energyType === "surging") {
    if (performanceStyle === "synthetic" && energy > 0.5) {
      return false;
    }
    return darkness < 0.62;
  }

  if (performanceStyle === "synthetic" && energy > 0.5) {
    return false;
  }

  return (warmth > 0.48 || organic > 0.48 || humanity > 0.52) && darkness < 0.62;
}

export function deriveVisualAtmosphere(audioFeatures: AudioFeatures): VisualAtmosphere {
  const lightBehavior = deriveLightBehavior(audioFeatures);
  const material = deriveMaterialWorld(audioFeatures);
  const strategy = deriveColorRelationship(audioFeatures);
  const hash = hashSeed(audioFeatures);
  const hueAnchor = deriveEnvironmentHueAnchor(
    material,
    lightBehavior,
    audioFeatures.songCharacter,
    hash
  );

  return {
    lightBehavior,
    material,
    strategy,
    hueAnchor,
    preferLightBackground:
      prefersLightAtmosphere(audioFeatures) &&
      !allowsDarkBackground(audioFeatures, lightBehavior),
    softness: derivePaletteSoftness(audioFeatures),
    contrast: derivePaletteContrast(audioFeatures),
  };
}

function backgroundLightness(atmosphere: VisualAtmosphere): number {
  const { lightBehavior, preferLightBackground, contrast, softness } = atmosphere;

  if (preferLightBackground || atmosphere.strategy === "light-dark") {
    switch (lightBehavior) {
      case "bright-natural":
        return clamp(88 + softness * 4, 82, 94);
      case "soft-diffused":
      case "glowing-atmosphere":
        return clamp(82 + softness * 6, 74, 91);
      case "muted-daylight":
        return clamp(78 + softness * 5, 70, 88);
      case "flat-graphic":
        return clamp(90 - contrast * 6, 84, 95);
      case "faded-film":
        return clamp(80 + softness * 4, 72, 88);
      case "dramatic-shadows":
      case "artificial-stage":
        // Mid chromatic stage/poster field — not near-black, not washed white.
        return clamp(44 + contrast * 10 + softness * 6, 38, 58);
      default:
        return clamp(76 + softness * 8, 68, 90);
    }
  }

  switch (lightBehavior) {
    case "dramatic-shadows":
      return clamp(22 + (1 - softness) * 10, 18, 34);
    case "artificial-stage":
      return clamp(28 + contrast * 10, 24, 44);
    default:
      return clamp(48 + softness * 12, 40, 68);
  }
}

function colorsFromAtmosphere(
  atmosphere: VisualAtmosphere
): Pick<PaletteBrief, "background" | "textColor"> {
  const { strategy, contrast, softness, preferLightBackground, lightBehavior, material } =
    atmosphere;
  let fieldHue = atmosphere.hueAnchor;
  const bgLight = backgroundLightness(atmosphere);
  const useLightBackground =
    preferLightBackground ||
    strategy === "light-dark" ||
    strategy === "faded-cinematic" ||
    bgLight > 54;

  const stageChroma =
    lightBehavior === "artificial-stage" ||
    lightBehavior === "dramatic-shadows" ||
    /stage lighting|cold led|street|poster/i.test(material);

  const satBg = Math.round(
    14 +
      softness * 22 +
      contrast * 18 +
      (strategy === "complementary-surprise" ? 16 : 8) +
      (stageChroma ? 14 : 0)
  );
  const satText = Math.round(18 + contrast * 38 + (stageChroma ? 10 : 0));

  let textHue = fieldHue;

  if (strategy === "complementary-surprise") {
    // Keep song hueAnchor; only escape mustard/ochre clash zone into nearby cool gels.
    if (stageChroma) {
      const normalized = ((fieldHue % 360) + 360) % 360;
      if (normalized >= 25 && normalized <= 100) {
        const coolGels = [168, 185, 192, 205, 218, 248, 280, 305, 318];
        fieldHue = coolGels[Math.round(normalized) % coolGels.length];
      }
      // Complementary of THIS song's field (offset varies slightly with contrast).
      textHue = (fieldHue + 140 + Math.round(contrast * 16)) % 360;
    } else {
      textHue = (fieldHue + 140 + Math.round(contrast * 40)) % 360;
    }
  } else if (strategy === "monochromatic") {
    textHue = fieldHue;
  } else if (strategy === "muted-contrast") {
    textHue = (fieldHue + 28) % 360;
  }

  if (useLightBackground) {
    const midStageGel =
      stageChroma &&
      strategy === "complementary-surprise" &&
      bgLight >= 36 &&
      bgLight <= 62;

    if (midStageGel) {
      // Mid chromatic field + bright gel text (not dark navy on mustard).
      const gelBgLight = clamp(bgLight, 44, 52);
      const gelBgSat = clamp(Math.max(satBg, 52), 50, 58);
      const gelTextSat = clamp(Math.max(satText, gelBgSat + 6), 58, 68);
      return {
        background: hslToHex(fieldHue, gelBgSat, gelBgLight),
        textColor: hslToHex(textHue, gelTextSat, clamp(58 + softness * 4, 56, 64)),
      };
    }

    const textLight = clamp(12 + contrast * 18, 10, 28);
    const bgSatCap = stageChroma ? 56 : 48;
    return {
      background: hslToHex(fieldHue, Math.min(bgSatCap, satBg), bgLight),
      textColor: hslToHex(textHue, Math.min(62, satText), textLight),
    };
  }

  const textLight = clamp(82 + softness * 8, 74, 94);
  const darkBgSatCap = stageChroma ? 58 : 42;
  const darkTextSatCap = stageChroma ? 62 : 48;
  const darkTextSatFloor = stageChroma ? 28 : 8;
  return {
    background: hslToHex(
      fieldHue,
      Math.max(10, Math.min(darkBgSatCap, satBg)),
      bgLight
    ),
    textColor: hslToHex(
      (textHue + 12) % 360,
      Math.max(darkTextSatFloor, Math.min(darkTextSatCap, satText - 4)),
      textLight
    ),
  };
}

export function derivePaletteReasoning(
  audioFeatures: AudioFeatures,
  atmosphere: VisualAtmosphere
): string {
  const { energy, warmth, darkness, tension } = audioFeatures.emotionalVector;
  const sc = audioFeatures.songCharacter;

  return [
    `Visual world: ${atmosphere.material} under ${atmosphere.lightBehavior.replace(/-/g, " ")}.`,
    `${atmosphere.strategy.replace(/-/g, " ")} relationship — background and typography only (no accent color).`,
    `Hue anchored in the visual environment (${atmosphere.material} + ${atmosphere.lightBehavior.replace(/-/g, " ")}), not emotional temperature alone (${sc.emotionalTemperature} is only a light nudge).`,
    atmosphere.preferLightBackground
      ? "Light or mid-tone background chosen for this atmosphere."
      : "Darker or stage-lit background supported by song energy / shadow world.",
    `Avoids literal visualizer clichés while still differentiating songs (energy ${energy.toFixed(2)}, warmth ${warmth.toFixed(2)}, tension ${tension.toFixed(2)}, darkness ${darkness.toFixed(2)}).`,
    "Font metadata had zero influence on this palette — typeface did not choose colors.",
  ].join(" ");
}

export function derivePalette(audioFeatures: AudioFeatures): PaletteBrief {
  const atmosphere = deriveVisualAtmosphere(audioFeatures);
  const colors = colorsFromAtmosphere(atmosphere);

  return {
    ...colors,
    strategy: atmosphere.strategy,
    lightBehavior: atmosphere.lightBehavior,
    material: atmosphere.material,
    paletteReasoning: derivePaletteReasoning(audioFeatures, atmosphere),
  };
}

/** Alternate palette for regeneration so we do not replay the same soft pair. */
export function deriveAlternatePalette(
  audioFeatures: AudioFeatures,
  salt: number
): PaletteBrief {
  const base = deriveVisualAtmosphere(audioFeatures);
  const liveBandRestless =
    audioFeatures.songCharacter.performanceStyle === "live_band" &&
    (audioFeatures.songCharacter.energyType === "restless" ||
      audioFeatures.songCharacter.energyType === "surging");

  const shifted: VisualAtmosphere = {
    ...base,
    hueAnchor: (base.hueAnchor + 47 + (salt % 120)) % 360,
    strategy:
      liveBandRestless || base.strategy === "complementary-surprise"
        ? "complementary-surprise"
        : base.strategy === "light-dark"
          ? "complementary-surprise"
          : base.strategy === "faded-cinematic"
            ? "dark-light"
            : "complementary-surprise",
    // Keep mid chromatic fields for live-band restless — don't flip back to a void.
    preferLightBackground: liveBandRestless
      ? true
      : salt % 2 === 0
        ? base.preferLightBackground
        : !base.preferLightBackground,
    contrast: clamp01(base.contrast + 0.15),
    softness: clamp01(base.softness - 0.08),
  };

  if (shifted.preferLightBackground === false) {
    shifted.lightBehavior =
      salt % 2 === 0 ? "dramatic-shadows" : "artificial-stage";
  } else if (liveBandRestless) {
    shifted.lightBehavior =
      salt % 2 === 0 ? "artificial-stage" : base.lightBehavior;
  }

  const colors = colorsFromAtmosphere(shifted);
  return {
    ...colors,
    strategy: shifted.strategy,
    lightBehavior: shifted.lightBehavior,
    material: shifted.material,
    paletteReasoning: [
      derivePaletteReasoning(audioFeatures, shifted),
      "Alternate regeneration — differentiated from rejected candidate.",
    ].join(" "),
  };
}

export function derivePaletteFromAudio(audioFeatures: AudioFeatures): PaletteBrief {
  return derivePalette(audioFeatures);
}

export function derivePaletteProperties(audioFeatures: AudioFeatures): VisualAtmosphere {
  return deriveVisualAtmosphere(audioFeatures);
}

export function shouldUseGrayscalePalette(audioFeatures: AudioFeatures): boolean {
  const atmosphere = deriveVisualAtmosphere(audioFeatures);
  return atmosphere.strategy === "monochromatic";
}
