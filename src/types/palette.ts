export const LIGHT_BEHAVIORS = [
  "bright-natural",
  "soft-diffused",
  "muted-daylight",
  "dramatic-shadows",
  "artificial-stage",
  "glowing-atmosphere",
  "flat-graphic",
  "faded-film",
] as const;

export type LightBehavior = (typeof LIGHT_BEHAVIORS)[number];

export const PALETTE_STRATEGIES = [
  "light-dark",
  "dark-light",
  "monochromatic",
  "muted-contrast",
  "complementary-surprise",
  "faded-cinematic",
] as const;

export type PaletteStrategy = (typeof PALETTE_STRATEGIES)[number];

/** Renderer-aware palette — background + typography color only */
export interface PaletteBrief {
  background: string;
  textColor: string;
  strategy: PaletteStrategy;
  lightBehavior: LightBehavior;
  material: string;
  paletteReasoning: string;
}

export function paletteColorKey(palette: PaletteBrief): string {
  return `${palette.background}|${palette.textColor}`;
}

export function resolveTextColor(
  palette: PaletteBrief & { primary?: string }
): string {
  return palette.textColor ?? palette.primary ?? "#111111";
}
