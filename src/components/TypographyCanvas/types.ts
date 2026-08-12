import type { CreativeState } from "../../types/CreativeState";
import type { AudioAccent } from "../MotionEngine/audioAccent";

/** Imperative API for MP4 export — drives the live preview DOM, no second renderer. */
export interface TypographyCanvasHandle {
  /** Root preview element to rasterize (matches on-screen viewport). */
  getCaptureRoot(): HTMLElement | null;
  /** CSS-pixel size of the capture root. */
  getPixelSize(): { width: number; height: number };
  /**
   * Apply the shared motion path at an absolute time in seconds.
   * Same code path as the live RAF loop.
   */
  renderAtTime(time: number, audioAccent?: AudioAccent): void;
  /** Pause live RAF while export seeks frames; resume afterward. */
  setExportLock(locked: boolean): void;
  /** Snapshot of current creative state (for filename / diagnostics). */
  getState(): CreativeState;
}
