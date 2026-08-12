/**
 * Unity / cohesion helpers.
 * High cohesion (→1): word moves as one object.
 * Low cohesion (→0): glyphs behave independently.
 */
export function normalizeLevel(raw: number): number {
  return Math.max(0, Math.min(1, raw / 100));
}

/** independence = 1 - cohesion (0–1). */
export function computeIndependence(cohesionLevel: number): number {
  return 1 - normalizeLevel(cohesionLevel);
}
