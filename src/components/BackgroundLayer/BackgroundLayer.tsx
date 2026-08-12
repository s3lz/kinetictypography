import { useEffect, useState } from "react";
import type { BackgroundState } from "../../types/background";

interface BackgroundLayerProps {
  background: BackgroundState;
  /** AI-generated solid color — used when mode is AI_COLOR */
  aiColor: string;
}

/** Max edge length for the ink mask — keeps thresholding light. */
const MASK_MAX_EDGE = 960;

/**
 * High-threshold ink mask: only darker source pixels become opaque.
 * White / light regions stay transparent so the paper field shows through.
 */
function buildInkMaskDataUrl(source: HTMLImageElement): string {
  const scale = Math.min(
    1,
    MASK_MAX_EDGE / Math.max(source.naturalWidth, source.naturalHeight)
  );
  const width = Math.max(1, Math.round(source.naturalWidth * scale));
  const height = Math.max(1, Math.round(source.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  ctx.filter = "blur(0.7px)";
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = "none";
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  // High threshold: only the darker ~25–30% of tones become ink.
  const threshold = 0.38;

  for (let i = 0; i < data.length; i += 4) {
    const luminance =
      (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    const ink = luminance < threshold ? 255 : 0;
    data[i] = ink;
    data[i + 1] = ink;
    data[i + 2] = ink;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function useInkMaskUrl(imageUrl: string | null): string | null {
  const [maskUrl, setMaskUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setMaskUrl(null);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      try {
        setMaskUrl(buildInkMaskDataUrl(image));
      } catch (error) {
        console.error("[Background] Ink mask failed", error);
        setMaskUrl(null);
      }
    };
    image.onerror = () => {
      if (!cancelled) setMaskUrl(null);
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return maskUrl;
}

/**
 * Renderer input for the preview/export background.
 * Modes are mutually exclusive; typography is always drawn above this layer.
 *
 * Uploaded images render as a screen-print ink plate on white paper:
 * mostly white, with only darker source regions preserved as tint-colored ink.
 */
export function BackgroundLayer({ background, aiColor }: BackgroundLayerProps) {
  const uploaded =
    background.mode === "UPLOADED_IMAGE" ? background.uploadedImage : null;
  const maskUrl = useInkMaskUrl(uploaded?.imageUrl ?? null);

  if (!uploaded) {
    return (
      <div
        className="background-layer background-layer--ai-color"
        style={{ backgroundColor: aiColor }}
        aria-hidden
      />
    );
  }

  const { tintColor, tintOpacity } = uploaded;

  return (
    <div
      className="background-layer background-layer--uploaded-image"
      aria-hidden
    >
      {maskUrl ? (
        <div
          className="background-layer__ink"
          style={{
            backgroundColor: tintColor,
            opacity: tintOpacity,
            WebkitMaskImage: `url(${maskUrl})`,
            maskImage: `url(${maskUrl})`,
          }}
        />
      ) : null}
    </div>
  );
}
