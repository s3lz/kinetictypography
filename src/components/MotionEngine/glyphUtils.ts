/** Split text into individual glyphs (handles surrogate pairs). */
export function splitGlyphs(text: string): string[] {
  return [...text];
}

/** Per-glyph phase offset so characters never move in lockstep. */
export function glyphPhaseOffset(charIndex: number, salt = 0): number {
  const goldenAngle = 0.618033988749895;
  return charIndex * goldenAngle * Math.PI * 2 + salt;
}

/** Stable per-glyph seed for organic variation. */
export function glyphSeed(charIndex: number, salt = 0): number {
  return charIndex * 2654435761 + salt * 97;
}
