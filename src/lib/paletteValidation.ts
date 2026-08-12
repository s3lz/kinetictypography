import { classifyPaletteFamily } from "@/lib/directionFamilies";
import { computeEnergyBucket, isHighIntensityAudio } from "@/lib/creativeFactors";
import {
  allowsDarkBackground,
  deriveAlternatePalette,
  derivePalette,
  derivePaletteReasoning,
  deriveVisualAtmosphere,
} from "@/engine/paletteEngine";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { PaletteBrief } from "@/types/palette";
import { resolveTextColor } from "@/types/palette";
import type { FontMetadata } from "@/types/fontMetadata";

const SIGNATURE_STORAGE_KEY = "creative-direction-signatures:v1";

const NEON_HEX_PATTERNS = [
  /^#00ffff$/i,
  /^#00ccff$/i,
  /^#33ff00$/i,
  /^#00ff99$/i,
  /^#0ff$/i,
  /^#0cf$/i,
  /^#3f0$/i,
];

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (expanded.length !== 6) return null;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const light = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: light * 100 };

  const sat = light > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) hue = ((bn - rn) / delta + 2) * 60;
  else hue = ((rn - gn) / delta + 4) * 60;

  return { h: hue, s: sat * 100, l: light * 100 };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb[0], rgb[1], rgb[2]);
}

function paletteColors(palette: PaletteBrief & { primary?: string }): string[] {
  return [palette.background, resolveTextColor(palette)];
}

function paletteContainsNeon(palette: PaletteBrief & { primary?: string }): boolean {
  return paletteColors(palette).some((color) =>
    NEON_HEX_PATTERNS.some((pattern) => pattern.test(color.trim()))
  );
}

function isNearBlack(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.l < 16 && hsl.s < 24;
}

function isCharcoalBackground(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.l < 28 && hsl.s < 20;
}

/** Dark field with only a faint hue tint — muddy stage "teal" that reads as slate. */
function isMuddyLowChroma(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.l < 32 && hsl.s < 24;
}

function isVeryDarkBackground(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.l < 18;
}

function isHighChromaColor(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.s > 45 && hsl.l > 35 && hsl.l < 75;
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

function clampRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function songHueSalt(audioFeatures: AudioFeatures): number {
  const { tempo, energy, brightness } = audioFeatures;
  const sc = audioFeatures.songCharacter;
  const seed = [
    sc.performanceStyle,
    sc.energyType,
    sc.rhythmFeel,
    sc.texture,
    sc.emotionalTemperature,
    String(Math.round(tempo)),
    String(Math.round(energy * 100)),
    String(Math.round(brightness * 100)),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Mustard/ochre/olive → song-specific cool gel, not one global cyan. */
function avoidMustardHue(h: number, salt: number): number {
  const normalized = ((h % 360) + 360) % 360;
  if (normalized >= 25 && normalized <= 100) {
    const coolGels = [168, 185, 192, 205, 218, 248, 280, 305, 318];
    return coolGels[salt % coolGels.length];
  }
  return normalized;
}

function complementaryHue(fieldHue: number, salt: number): number {
  const offset = 140 + (salt % 16);
  return (fieldHue + offset) % 360;
}

function isStageLikePalette(
  palette: PaletteBrief,
  audioFeatures: AudioFeatures
): boolean {
  const liveBandRestless =
    audioFeatures.songCharacter.performanceStyle === "live_band" &&
    (audioFeatures.songCharacter.energyType === "restless" ||
      audioFeatures.songCharacter.energyType === "surging");

  return (
    liveBandRestless ||
    palette.lightBehavior === "artificial-stage" ||
    palette.lightBehavior === "dramatic-shadows" ||
    /stage|led|gel|poster/i.test(palette.material ?? "")
  );
}

/**
 * Song-specific complementary polish: keep creative/song hue family,
 * match chroma + value, only nudge mustard clash zones.
 */
function polishComplementaryStagePair(
  palette: PaletteBrief,
  audioFeatures: AudioFeatures
): PaletteBrief {
  if (!isStageLikePalette(palette, audioFeatures)) return palette;
  if (
    palette.strategy !== "complementary-surprise" &&
    palette.strategy !== "muted-contrast"
  ) {
    return palette;
  }

  const bg = hexToHsl(palette.background);
  const textHsl = hexToHsl(resolveTextColor(palette));
  if (!bg || !textHsl) return palette;

  const salt = songHueSalt(audioFeatures);
  const bgH = avoidMustardHue(bg.h, salt);
  const bgS = clampRange(Math.max(bg.s, 50), 48, 58);
  const bgL = clampRange(bg.l < 40 ? 46 : bg.l, 42, 54);

  // Prefer complementary of THIS song's field; keep creative text hue if already near it.
  const targetTextH = complementaryHue(bgH, salt);
  const textDist = Math.min(
    Math.abs(textHsl.h - targetTextH),
    360 - Math.abs(textHsl.h - targetTextH)
  );
  const textH = textDist < 35 ? textHsl.h : targetTextH;
  const textS = clampRange(Math.max(textHsl.s, bgS + 4), 56, 68);
  const textL = clampRange(textHsl.l < 40 ? 58 : textHsl.l, 54, 66);

  return {
    ...palette,
    background: hslToHex(bgH, bgS, bgL),
    textColor: hslToHex(textH, textS, textL),
    strategy: "complementary-surprise",
    paletteReasoning: [
      palette.paletteReasoning,
      "Complementary stage polish — preserved song hue family; matched chroma/temperature (not a global cyan/magenta lock).",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * Soft-repair creative palettes: keep Gemini hue/chroma intent, fix value,
 * then polish complementary stage pairs so they share gel temperature.
 */
function repairCreativePalette(
  palette: PaletteBrief,
  audioFeatures: AudioFeatures
): PaletteBrief {
  const bg = hexToHsl(palette.background);
  const textHsl = hexToHsl(resolveTextColor(palette));
  if (!bg) return palette;

  const stageLike = isStageLikePalette(palette, audioFeatures);
  const salt = songHueSalt(audioFeatures);

  let { h, s, l } = bg;

  // Lift void / muddy backgrounds into a mid chromatic field; keep hue family.
  if (l < 36 || (l < 42 && s < 28)) {
    l = stageLike ? 46 : 42;
    s = Math.max(s, stageLike ? 52 : 40);
  }

  // Mustard/ochre only → song-specific cool gel (not fixed cyan).
  if (stageLike && h >= 25 && h <= 100 && s > 22) {
    h = avoidMustardHue(h, salt);
    s = Math.max(s, 52);
    l = Math.max(l, 44);
  }

  const repairedBg = hslToHex(
    h,
    Math.min(58, Math.max(40, s)),
    Math.min(52, Math.max(42, l))
  );

  // Preserve creative text chroma. Rescue too-dark text on mid fields.
  let textColor = resolveTextColor(palette);
  if (textHsl && textHsl.l < 32 && stageLike) {
    const rescuedH = complementaryHue(h, salt);
    textColor = hslToHex(
      rescuedH,
      Math.min(68, Math.max(58, textHsl.s)),
      Math.min(64, Math.max(56, textHsl.l))
    );
  }

  const repaired: PaletteBrief = {
    ...palette,
    background: repairedBg,
    textColor,
    strategy:
      stageLike && palette.strategy === "muted-contrast"
        ? "complementary-surprise"
        : palette.strategy,
    paletteReasoning: [
      palette.paletteReasoning,
      "Value repair — preserved creative hue/chroma; lifted background into a mid chromatic field (no full palette regen).",
    ]
      .filter(Boolean)
      .join(" "),
  };

  return polishComplementaryStagePair(repaired, audioFeatures);
}

function hardFailuresAreValueOnly(hard: string[]): boolean {
  if (hard.length === 0) return false;
  return hard.every(
    (w) =>
      /near-black|muddy low-chroma|mid chromatic|near-black void|desaturated steel/i.test(
        w
      )
  );
}

function isClichéWarmOrangeBrown(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.h >= 18 && hsl.h <= 50 && hsl.s > 40 && hsl.l > 20 && hsl.l < 74;
}

function isCreamText(hex: string): boolean {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  return hsl.h >= 35 && hsl.h <= 58 && hsl.s < 28 && hsl.l > 78;
}

function isNearGrayscale(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  const spread = Math.max(rgb[0], rgb[1], rgb[2]) - Math.min(rgb[0], rgb[1], rgb[2]);
  return spread < 18;
}

function isSafeTemplatePalette(palette: PaletteBrief & { primary?: string }): boolean {
  const textColor = resolveTextColor(palette);
  const darkBg = isNearBlack(palette.background) || isCharcoalBackground(palette.background);
  const warmText = isClichéWarmOrangeBrown(textColor);
  const creamText = isCreamText(textColor);
  const neonText = paletteContainsNeon(palette);
  const grayscalePair =
    isNearGrayscale(palette.background) && isNearGrayscale(textColor);

  return (
    (darkBg && warmText) ||
    (darkBg && creamText) ||
    (grayscalePair && neonText) ||
    (darkBg && neonText)
  );
}

function ensureFontIsolationReasoning(
  reasoning: string,
  audioFeatures: AudioFeatures
): string {
  const lower = reasoning.toLowerCase();
  const mentionsFont =
    lower.includes("font") ||
    lower.includes("typeface") ||
    lower.includes("typography") ||
    lower.includes("zero influence") ||
    lower.includes("did not influence");
  if (mentionsFont) return reasoning;
  return `${reasoning} Font metadata had zero influence on this palette — typeface did not choose colors.`.trim();
}

function readStoredPaletteFamilies(fingerprint: string): string[] {
  try {
    const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      fingerprint: string;
      signature?: { families?: { paletteFamily?: string } };
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry.fingerprint !== fingerprint)
      .map((entry) => entry.signature?.families?.paletteFamily)
      .filter((family): family is string => Boolean(family));
  } catch {
    return [];
  }
}

/**
 * Soft warnings — fix in place (do not wipe Gemini / creative colors).
 * Hard warnings — require a regenerated palette.
 */
export function splitPaletteWarnings(warnings: string[]): {
  soft: string[];
  hard: string[];
} {
  const soft: string[] = [];
  const hard: string[] = [];
  for (const w of warnings) {
    const softIssue =
      w.includes("paletteReasoning") ||
      w.includes("font did not influence") ||
      w.includes("must confirm font");
    if (softIssue) soft.push(w);
    else hard.push(w);
  }
  return { soft, hard };
}

export function validatePaletteDirection(
  palette: PaletteBrief & { primary?: string },
  audioFeatures: AudioFeatures,
  fingerprint: string,
  font?: FontMetadata
): string[] {
  const errors: string[] = [];
  const { warmth, energy, darkness, organic, tension, nostalgia } =
    audioFeatures.emotionalVector;
  const atmosphere = deriveVisualAtmosphere(audioFeatures);
  const textColor = resolveTextColor(palette);
  const colors = paletteColors(palette);

  if (!palette.paletteReasoning?.trim()) {
    errors.push("palette missing paletteReasoning — must explain environment, cliché avoidance, and font isolation");
  } else {
    const reasoning = palette.paletteReasoning.toLowerCase();
    const mentionsFontIsolation =
      reasoning.includes("font") ||
      reasoning.includes("typeface") ||
      reasoning.includes("typography") ||
      reasoning.includes("letter") ||
      reasoning.includes("did not influence") ||
      reasoning.includes("zero influence");
    if (!mentionsFontIsolation) {
      errors.push("paletteReasoning must confirm font did not influence palette");
    }
  }

  if (
    isNearBlack(palette.background) &&
    !allowsDarkBackground(audioFeatures, atmosphere.lightBehavior)
  ) {
    errors.push(
      "dark/black background without darkness score, synthetic atmosphere, or dramatic shadow support"
    );
  }

  // Soft preference only when atmosphere truly prefers light — no longer
  // rejects kinetic dark palettes that passed allowsDarkBackground.

  if (warmth > 0.55 && colors.some(isClichéWarmOrangeBrown)) {
    errors.push("warmth mapped to orange/yellow/brown cliché");
  }

  if (organic > 0.55 && colors.some(isClichéWarmOrangeBrown)) {
    errors.push("organic mapped to beige/earth-tone cliché");
  }

  if (nostalgia > 0.52 && colors.every(isClichéWarmOrangeBrown)) {
    errors.push("nostalgia mapped to sepia/brown cliché");
  }

  if (isHighIntensityAudio(audioFeatures) && paletteContainsNeon(palette)) {
    errors.push("high energy mapped to neon/cyan futuristic cliché");
  }

  if (tension > 0.58 && isNearBlack(palette.background) && darkness < 0.55) {
    if (!allowsDarkBackground(audioFeatures, atmosphere.lightBehavior)) {
      errors.push("tension mapped to dark background without darkness support");
    }
  }

  if (isSafeTemplatePalette(palette)) {
    errors.push(
      "palette resembles visualizer template (charcoal+white, dark+neon text, cream on black) — choose different strategy"
    );
  }

  const restlessStage =
    (audioFeatures.songCharacter.energyType === "restless" ||
      audioFeatures.songCharacter.energyType === "surging") &&
    (palette.lightBehavior === "artificial-stage" ||
      palette.lightBehavior === "dramatic-shadows" ||
      /stage|led|gel|poster/i.test(palette.material ?? ""));

  const liveBandRestless =
    audioFeatures.songCharacter.performanceStyle === "live_band" &&
    (audioFeatures.songCharacter.energyType === "restless" ||
      audioFeatures.songCharacter.energyType === "surging");

  if (restlessStage && isMuddyLowChroma(palette.background)) {
    errors.push(
      "restless/stage atmosphere used muddy low-chroma background — use real gel/teal chroma, not desaturated steel"
    );
  }

  if (restlessStage && palette.strategy === "muted-contrast") {
    errors.push(
      "restless/stage atmosphere used muted-contrast — prefer complementary-surprise with readable chroma"
    );
  }

  // Live-band restless: reject near-black voids (spectral brightness ≠ dark UI).
  if (
    liveBandRestless &&
    (isNearBlack(palette.background) || isVeryDarkBackground(palette.background)) &&
    audioFeatures.emotionalVector.darkness < 0.7
  ) {
    errors.push(
      "live_band restless used near-black background — prefer a mid chromatic stage/poster field"
    );
  }

  // High-chroma complementary text on a near-black void = half a visualizer look.
  if (
    (palette.strategy === "complementary-surprise" || restlessStage) &&
    isHighChromaColor(textColor) &&
    (isNearBlack(palette.background) || isVeryDarkBackground(palette.background))
  ) {
    errors.push(
      "high-chroma complementary text on near-black void — lift background into a mid chromatic field"
    );
  }

  if (colors.every(isNearGrayscale) && !shouldUseGrayscalePaletteGate(audioFeatures)) {
    errors.push("grayscale pair without monochromatic atmosphere support");
  }

  if (font) {
    const technicalFont = font.visualIdentity.some((tag) =>
      ["pixel", "modular", "digital", "bitcount", "lekton", "technical", "michroma"].some(
        (key) => tag.toLowerCase().includes(key)
      )
    );
    if (technicalFont && paletteContainsNeon(palette)) {
      errors.push("technical font influenced neon/cyber palette — font must not determine palette");
    }
  }

  if (isCharcoalBackground(palette.background) && isCreamText(textColor)) {
    errors.push("charcoal background + cream text — default music visualizer pairing");
  }

  if (
    energy > 0.68 &&
    isNearBlack(palette.background) &&
    !allowsDarkBackground(audioFeatures, atmosphere.lightBehavior)
  ) {
    errors.push("high energy defaulted to dark background without atmospheric support");
  }

  if (isHighIntensityAudio(audioFeatures)) {
    const family = classifyPaletteFamily(palette);
    const priorFamilies = readStoredPaletteFamilies(fingerprint);
    if (priorFamilies.includes(family) && computeEnergyBucket(audioFeatures) === "high") {
      errors.push(
        `high-energy song repeats palette family (${family}) — use unexpected complementary or faded cinematic pairing`
      );
    }
  }

  return errors;
}

function shouldUseGrayscalePaletteGate(audioFeatures: AudioFeatures): boolean {
  const { organic, warmth } = audioFeatures.emotionalVector;
  const { mechanicalness, humanity } = audioFeatures.performanceTexture;
  return (
    organic < 0.35 &&
    warmth < 0.35 &&
    mechanicalness > 0.62 &&
    humanity < 0.35
  );
}

export function fillPaletteMetadata(
  palette: Partial<PaletteBrief> & { primary?: string; accent?: string },
  audioFeatures: AudioFeatures
): PaletteBrief {
  const atmosphere = deriveVisualAtmosphere(audioFeatures);
  const derived = derivePalette(audioFeatures);

  const textColor =
    palette.textColor ??
    palette.primary ??
    derived.textColor;

  let reasoning =
    palette.paletteReasoning?.trim() ||
    derivePaletteReasoning(audioFeatures, atmosphere);
  reasoning = ensureFontIsolationReasoning(reasoning, audioFeatures);

  return {
    background: palette.background ?? derived.background,
    textColor,
    strategy: palette.strategy ?? atmosphere.strategy,
    material: palette.material?.trim() || atmosphere.material,
    lightBehavior: palette.lightBehavior ?? atmosphere.lightBehavior,
    paletteReasoning: reasoning,
  };
}

export function enforcePaletteQuality(
  direction: CreativeDirection,
  audioFeatures: AudioFeatures,
  fingerprint: string,
  font?: FontMetadata
): { direction: CreativeDirection; warnings: string[]; corrected: boolean } {
  let palette = fillPaletteMetadata(direction.palette, audioFeatures);
  let warnings = validatePaletteDirection(palette, audioFeatures, fingerprint, font);
  let corrected = false;

  const { soft, hard } = splitPaletteWarnings(warnings);

  // Soft: patch reasoning; keep creative colors.
  if (soft.length > 0 && hard.length === 0) {
    palette = {
      ...palette,
      paletteReasoning: ensureFontIsolationReasoning(
        palette.paletteReasoning,
        audioFeatures
      ),
    };
    warnings = validatePaletteDirection(palette, audioFeatures, fingerprint, font);
  }

  const afterSoft = splitPaletteWarnings(warnings);

  if (afterSoft.hard.length > 0) {
    // Prefer repairing creative colors (keep pink/teal intent) over full alternate regen.
    if (hardFailuresAreValueOnly(afterSoft.hard)) {
      const repaired = repairCreativePalette(palette, audioFeatures);
      const repairedWarnings = validatePaletteDirection(
        repaired,
        audioFeatures,
        fingerprint,
        font
      );
      const repairedHard = splitPaletteWarnings(repairedWarnings).hard;
      if (repairedHard.length === 0) {
        console.warn("[Palette Validation] Value-repaired creative palette (preserved chroma)", {
          hard: afterSoft.hard,
          before: { background: palette.background, textColor: palette.textColor },
          after: { background: repaired.background, textColor: repaired.textColor },
        });
        return {
          direction: { ...direction, palette: repaired },
          warnings: [...afterSoft.hard, "palette value-repaired — creative chroma preserved"],
          corrected: true,
        };
      }
      palette = repaired;
      warnings = repairedWarnings;
    }

    const stillHard = splitPaletteWarnings(
      validatePaletteDirection(palette, audioFeatures, fingerprint, font)
    ).hard;

    if (stillHard.length > 0) {
      // Last resort: deterministic alternate (cool stage recipe for restless).
      const salt =
        fingerprint.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) +
        Math.round(audioFeatures.tempo) +
        Math.round(audioFeatures.energy * 100);
      const regenerated = deriveAlternatePalette(audioFeatures, salt);
      palette = polishComplementaryStagePair(
        {
          ...regenerated,
          paletteReasoning: [
            direction.palette?.paletteReasoning,
            "Hard cliché validation failed after value repair — regenerated with song-differentiated alternate.",
            regenerated.paletteReasoning,
          ]
            .filter(Boolean)
            .join(" "),
        },
        audioFeatures
      );
      warnings = [
        ...stillHard,
        "palette regenerated with alternate song-character recipe after hard validation failure",
      ];
      corrected = true;
      console.warn("[Palette Validation] Corrected palette (hard failures only)", {
        hard: stillHard,
        soft: afterSoft.soft,
        palette,
      });
    } else {
      corrected = true;
      warnings = [
        ...afterSoft.hard,
        "palette value-repaired — creative chroma preserved",
      ];
    }
  } else if (soft.length > 0) {
    console.log("[Palette Validation] Soft fixes only — preserving creative colors", {
      soft,
      palette: { background: palette.background, textColor: palette.textColor },
    });
  }

  // Always polish stage complementary pairs so cyan/magenta share gel temperature + chroma.
  const beforePolish = palette;
  palette = polishComplementaryStagePair(palette, audioFeatures);
  if (
    palette.background !== beforePolish.background ||
    palette.textColor !== beforePolish.textColor
  ) {
    corrected = true;
    console.log("[Palette Validation] Complementary stage polish applied", {
      before: {
        background: beforePolish.background,
        textColor: beforePolish.textColor,
      },
      after: { background: palette.background, textColor: palette.textColor },
    });
  }

  return {
    direction: { ...direction, palette },
    warnings,
    corrected,
  };
}
