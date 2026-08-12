export const EXPORT_DURATION_SECONDS = 8;
export const EXPORT_FPS = 30;
export const EXPORT_FRAME_COUNT = EXPORT_DURATION_SECONDS * EXPORT_FPS;
export const EXPORT_FRAME_DURATION_US = Math.round(1_000_000 / EXPORT_FPS);

/** Progress weight: most of the bar is frame capture/encode; finalize is the rest. */
export const EXPORT_PROGRESS = {
  framesEnd: 96,
  complete: 100,
} as const;
