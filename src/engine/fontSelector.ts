/** Import once in your app entry: `import "../styles/fonts.css"` */

export const FONT_CATALOG = [
  { id: "ballet", label: "Ballet", variable: "--font-ballet" },
  { id: "bitcount-prop-single", label: "Bitcount Prop Single", variable: "--font-bitcount-prop-single" },
  { id: "lekton", label: "Lekton", variable: "--font-lekton" },
  { id: "xanh-mono", label: "Xanh Mono", variable: "--font-xanh-mono" },
  { id: "manrope", label: "Manrope", variable: "--font-manrope" },
  { id: "league-gothic", label: "League Gothic", variable: "--font-league-gothic" },
  { id: "petit-formal-script", label: "Petit Formal Script", variable: "--font-petit-formal-script" },
  { id: "elsie-swash-caps", label: "Elsie Swash Caps", variable: "--font-elsie-swash-caps" },
  { id: "michroma", label: "Michroma", variable: "--font-michroma" },
  { id: "unifraktur-maguntia", label: "UnifrakturMaguntia", variable: "--font-unifraktur-maguntia" },
  { id: "space-grotesk", label: "Space Grotesk", variable: "--font-space-grotesk" },
  { id: "turret-road", label: "Turret Road", variable: "--font-turret-road" },
  { id: "zalando-sans-expanded", label: "Zalando Sans Expanded", variable: "--font-zalando-sans-expanded" },
  { id: "pinyon-script", label: "Pinyon Script", variable: "--font-pinyon-script" },
  { id: "bebas-neue", label: "Bebas Neue", variable: "--font-bebas-neue" },
] as const;

export type FontId = (typeof FONT_CATALOG)[number]["id"];

export function getFontById(id: FontId) {
  return FONT_CATALOG.find((entry) => entry.id === id) ?? FONT_CATALOG.find((entry) => entry.id === "manrope")!;
}

export function getFontFamily(id: FontId): string {
  return `var(${getFontById(id).variable})`;
}

export function getFontStyle(id: FontId): { fontFamily: string } {
  return { fontFamily: getFontFamily(id) };
}
