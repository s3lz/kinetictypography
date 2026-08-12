import {
  assertValidCreativeDirection,
  CreativeDirectionPipelineError,
  getCreativeDirectionValidationErrors,
  logPipelineStage,
} from "@/lib/creativeDirectionPipeline";
import { normalizeCreativeDirection } from "@/lib/normalizeCreativeDirection";
import type { AudioFeatures } from "@/types/audio";
import type { CreativeDirection } from "@/types/creativeDirection";
import { getFontMetadata } from "@/lib/creativeInterpretation";
import {
  toFontStylingContext,
  type SelectedFontMetadata,
} from "@/types/fontMetadata";

export async function generateCreativeDirection(
  audioFeatures: AudioFeatures,
  selectedFont: SelectedFontMetadata
): Promise<CreativeDirection> {
  console.log("[CreativeDirector] POST /api/creative-direction (Gemini)");
  const requestStartedAt = performance.now();

  const response = await fetch("/api/creative-direction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audioFeatures,
      selectedFont: toFontStylingContext(getFontMetadata(selectedFont.name)),
    }),
  });

  const responseBody = await response.json().catch(() => null);

  logPipelineStage("api-response", responseBody, {
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const validationErrors = Array.isArray(
      (responseBody as { validationErrors?: unknown } | null)?.validationErrors
    )
      ? ((responseBody as { validationErrors: string[] }).validationErrors ?? [])
      : [];

    const detail =
      responseBody &&
      typeof responseBody === "object" &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
        : `Creative direction API failed with ${response.status}`;

    throw new CreativeDirectionPipelineError(
      "api-response",
      validationErrors.length > 0 ? validationErrors : [detail]
    );
  }

  const normalized = normalizeCreativeDirection(responseBody);
  const validationErrors = getCreativeDirectionValidationErrors(normalized);
  if (validationErrors.length > 0) {
    throw new CreativeDirectionPipelineError(
      "api-response",
      validationErrors,
      "API returned a payload that failed client-side validation. "
    );
  }

  const creativeDirection = assertValidCreativeDirection(
    normalized,
    "api-response"
  );

  console.log("[CreativeDirector] Gemini response received", {
    durationMs: Math.round(performance.now() - requestStartedAt),
    creativeDirection,
  });
  return creativeDirection;
}
