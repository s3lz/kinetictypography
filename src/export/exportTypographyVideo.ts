import type { TypographyCanvasHandle } from "../components/TypographyCanvas/types";
import { ZERO_AUDIO_ACCENT } from "../components/MotionEngine/audioAccent";
import { getFontEmbedCSS } from "../vendor/html-to-image";
import { captureElementFrame } from "./captureFrame";
import {
  EXPORT_FRAME_COUNT,
  EXPORT_FPS,
  EXPORT_PROGRESS,
} from "./constants";
import { buildExportFilename, downloadBlob } from "./download";
import { createMp4Encoder } from "./encodeMp4";
import { waitForFonts, waitForPaint } from "./timing";

export interface ExportTypographyVideoOptions {
  canvas: TypographyCanvasHandle;
  onProgress?: (progress: number) => void;
  /** When true (default), triggers a browser download of the finished MP4. */
  autoDownload?: boolean;
}

export interface ExportTypographyVideoResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  frameCount: number;
}

function reportProgress(
  onProgress: ((progress: number) => void) | undefined,
  value: number
): void {
  onProgress?.(Math.max(0, Math.min(100, value)));
}

/**
 * Export the live typography preview to an 8s / 30fps looping MP4.
 *
 * Drives the same DOM + `applyCanvasFrame` path as the editor — no second animation.
 * Frame time is exact: `frameIndex / EXPORT_FPS`.
 */
export async function exportTypographyVideo(
  options: ExportTypographyVideoOptions
): Promise<ExportTypographyVideoResult> {
  const { canvas, onProgress, autoDownload = true } = options;

  const root = canvas.getCaptureRoot();
  if (!root) {
    throw new Error("Typography preview is not ready to export.");
  }

  const probe = canvas.getPixelSize();
  if (probe.width < 2 || probe.height < 2) {
    throw new Error("Preview viewport has no measurable size.");
  }

  reportProgress(onProgress, 2);
  await waitForFonts();

  let fontEmbedCSS: string | undefined;
  try {
    fontEmbedCSS = await getFontEmbedCSS(root);
  } catch {
    fontEmbedCSS = undefined;
  }

  reportProgress(onProgress, 4);

  canvas.setExportLock(true);

  let encoder: Awaited<ReturnType<typeof createMp4Encoder>> | null = null;
  let width = 0;
  let height = 0;

  try {
    // Seek to t=0 and capture once to lock encoder dimensions to the viewport.
    canvas.renderAtTime(0, ZERO_AUDIO_ACCENT);
    await waitForPaint();

    const firstFrame = await captureElementFrame({
      element: root,
      fontEmbedCSS,
    });
    width = firstFrame.width;
    height = firstFrame.height;

    encoder = await createMp4Encoder({ width, height });
    await encoder.encodeFrame(firstFrame.canvas, 0);
    reportProgress(
      onProgress,
      Math.max(4, EXPORT_PROGRESS.framesEnd / EXPORT_FRAME_COUNT)
    );

    for (let frameIndex = 1; frameIndex < EXPORT_FRAME_COUNT; frameIndex += 1) {
      const time = frameIndex / EXPORT_FPS;

      // Deterministic accents so looping frames are stable and match paused preview motion.
      canvas.renderAtTime(time, ZERO_AUDIO_ACCENT);
      await waitForPaint();

      const frame = await captureElementFrame({
        element: root,
        fontEmbedCSS,
      });

      await encoder.encodeFrame(frame.canvas, frameIndex);

      const frameProgress =
        EXPORT_PROGRESS.framesEnd * ((frameIndex + 1) / EXPORT_FRAME_COUNT);
      reportProgress(onProgress, Math.max(4, frameProgress));
    }

    reportProgress(onProgress, EXPORT_PROGRESS.framesEnd);
    const blob = await encoder.finalize();
    reportProgress(onProgress, EXPORT_PROGRESS.complete);

    const filename = buildExportFilename(canvas.getState().text);

    if (autoDownload) {
      downloadBlob(blob, filename);
    }

    return {
      blob,
      filename,
      width,
      height,
      frameCount: EXPORT_FRAME_COUNT,
    };
  } finally {
    encoder?.close();
    canvas.setExportLock(false);
  }
}
