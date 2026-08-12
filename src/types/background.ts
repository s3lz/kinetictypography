/**
 * Modular background system.
 * Modes are mutually exclusive; settings for each mode are preserved when switching.
 * Extensible for future types (gradients, textures, video).
 */

export type BackgroundMode = "AI_COLOR" | "UPLOADED_IMAGE";

/**
 * Settings for user-uploaded image backgrounds.
 * Rendered as a high-threshold screen-print ink plate on white paper.
 */
export interface UploadedImageBackground {
  /** Data URL of the uploaded image */
  imageUrl: string;
  /** Ink color for preserved dark regions */
  tintColor: string;
  /** 0–1 opacity of the ink plate */
  tintOpacity: number;
}

export interface BackgroundState {
  mode: BackgroundMode;
  /** Preserved when switching back to AI_COLOR */
  uploadedImage: UploadedImageBackground | null;
}

export const DEFAULT_UPLOADED_IMAGE_TINT = "#2a3d4f";
export const DEFAULT_TINT_OPACITY = 0.88;

export const DEFAULT_BACKGROUND_STATE: BackgroundState = {
  mode: "AI_COLOR",
  uploadedImage: null,
};

export function createUploadedImageBackground(
  imageUrl: string,
  tintColor: string = DEFAULT_UPLOADED_IMAGE_TINT
): UploadedImageBackground {
  return {
    imageUrl,
    tintColor,
    tintOpacity: DEFAULT_TINT_OPACITY,
  };
}
