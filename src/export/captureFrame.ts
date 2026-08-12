import { toCanvas } from "../vendor/html-to-image";
import { evenDimension } from "./download";

export interface CaptureFrameOptions {
  element: HTMLElement;
  /** Precomputed font CSS to avoid re-embedding on every frame. */
  fontEmbedCSS?: string;
}

export interface CapturedFrame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Rasterize the live preview element at its laid-out CSS size,
 * then crop to even H.264-safe dimensions (no layout reflow).
 */
export async function captureElementFrame(
  options: CaptureFrameOptions
): Promise<CapturedFrame> {
  const { element, fontEmbedCSS } = options;
  const sourceWidth = Math.max(1, Math.round(element.clientWidth));
  const sourceHeight = Math.max(1, Math.round(element.clientHeight));
  const width = evenDimension(sourceWidth);
  const height = evenDimension(sourceHeight);

  const source = await toCanvas(element, {
    width: sourceWidth,
    height: sourceHeight,
    canvasWidth: sourceWidth,
    canvasHeight: sourceHeight,
    pixelRatio: 1,
    cacheBust: false,
    fontEmbedCSS,
  });

  if (source.width === width && source.height === height) {
    return { canvas: source, width, height };
  }

  const cropped = document.createElement("canvas");
  cropped.width = width;
  cropped.height = height;
  const ctx = cropped.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create 2D canvas context for export crop.");
  }
  ctx.drawImage(source, 0, 0);
  return { canvas: cropped, width, height };
}
