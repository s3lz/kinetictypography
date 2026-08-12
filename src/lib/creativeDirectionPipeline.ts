import type { CreativeDirection } from "../types/creativeDirection";
import { describeValidationFailure, normalizeCreativeDirection } from "./normalizeCreativeDirection";

export type PipelineStage =
  | "raw-gemini-response"
  | "json-extraction"
  | "parsed-json"
  | "normalized-direction"
  | "validated-direction"
  | "creative-state"
  | "api-response"
  | "cache-read";

export class CreativeDirectionPipelineError extends Error {
  readonly stage: PipelineStage;
  readonly validationErrors: string[];

  constructor(stage: PipelineStage, validationErrors: string[], detail?: string) {
    const summary = validationErrors.join("; ");
    super(
      detail
        ? `[CreativeDirector:${stage}] ${detail}${summary ? ` (${summary})` : ""}`
        : `[CreativeDirector:${stage}] ${summary}`
    );
    this.name = "CreativeDirectionPipelineError";
    this.stage = stage;
    this.validationErrors = validationErrors;
  }
}

export function logPipelineStage(
  stage: PipelineStage,
  payload: unknown,
  meta?: Record<string, unknown>
): void {
  console.group(`[CreativeDirector Pipeline] ${stage}`);
  if (meta) {
    console.log("meta:", meta);
  }
  console.log(payload);
  console.groupEnd();
}

export function extractCreativeDirectionJson(text: string): {
  parsed: unknown;
  extractionMethod: "direct" | "markdown-fence" | "object-match";
} {
  const trimmed = text.trim();

  try {
    return {
      parsed: JSON.parse(trimmed),
      extractionMethod: "direct",
    };
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return {
        parsed: JSON.parse(fenced[1].trim()),
        extractionMethod: "markdown-fence",
      };
    }

    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return {
        parsed: JSON.parse(objectMatch[0]),
        extractionMethod: "object-match",
      };
    }

    throw new CreativeDirectionPipelineError(
      "json-extraction",
      ["response did not contain valid JSON"],
      "Gemini response could not be parsed. "
    );
  }
}

export function getNormalizationErrors(value: unknown): string[] {
  const errors: string[] = [];

  if (!value || typeof value !== "object") {
    return ["response was not a JSON object"];
  }

  const direction = value as Record<string, unknown>;

  if (
    typeof direction.artisticIntent !== "string" &&
    typeof direction.artistic_intent !== "string"
  ) {
    const motionSystem = direction.motionSystem ?? direction.motion_system;
    const hasConcept =
      motionSystem &&
      typeof motionSystem === "object" &&
      Boolean(
        (motionSystem as Record<string, unknown>).motionConcept ??
          (motionSystem as Record<string, unknown>).motion_concept
      );
    if (!hasConcept) {
      errors.push("artisticIntent: expected non-empty string (or motionSystem.motionConcept)");
    }
  }

  if (!direction.visualLanguage && !direction.visual_language) {
    errors.push("visualLanguage: missing");
  }

  if (!direction.composition && !direction.layout) {
    errors.push("composition: missing");
  }

  if (
    !direction.motionLanguage &&
    !direction.motion_language &&
    !direction.motionSystem &&
    !direction.motion_system
  ) {
    errors.push("motionLanguage / motionSystem: missing");
  }

  if (!direction.camera) {
    errors.push("camera: missing");
  }

  if (!direction.palette || typeof direction.palette !== "object") {
    errors.push("palette: missing or not an object");
  } else {
    const palette = direction.palette as Record<string, unknown>;
    if (typeof palette.background !== "string") {
      errors.push(`palette.background: expected string, got ${JSON.stringify(palette.background)}`);
    }
    const textColor =
      typeof palette.textColor === "string"
        ? palette.textColor
        : typeof palette.primary === "string"
          ? palette.primary
          : null;
    if (!textColor) {
      errors.push("palette.textColor: expected string");
    }
  }

  const specificity =
    direction.specificityReasoning ?? direction.specificity_reasoning;
  const reasoningBlock = direction.reasoning;
  const whyFromReasoning =
    reasoningBlock && typeof reasoningBlock === "object"
      ? typeof (reasoningBlock as Record<string, unknown>).whyThisSongNotAnother === "string"
        ? String((reasoningBlock as Record<string, unknown>).whyThisSongNotAnother).trim()
        : ""
      : "";
  if ((!specificity || typeof specificity !== "object") && !whyFromReasoning) {
    errors.push("specificityReasoning / reasoning.whyThisSongNotAnother: missing");
  } else if (specificity && typeof specificity === "object" && !whyFromReasoning) {
    const reasoning = specificity as Record<string, unknown>;
    const why =
      typeof reasoning.whyThisSongNotAnother === "string"
        ? reasoning.whyThisSongNotAnother.trim()
        : typeof reasoning.why_this_song_not_another === "string"
          ? reasoning.why_this_song_not_another.trim()
          : "";
    if (!why) {
      errors.push("specificityReasoning.whyThisSongNotAnother: expected non-empty string");
    }
  }

  const normalized = normalizeCreativeDirection(value);
  if (!normalized) {
    const reason = describeValidationFailure(value);
    if (!errors.includes(reason)) {
      errors.push(reason);
    }
  }

  return errors;
}

export function getCreativeDirectionValidationErrors(value: unknown): string[] {
  const errors: string[] = [];

  if (!value || typeof value !== "object") {
    return ["response was not a JSON object"];
  }

  const direction = value as Record<string, unknown>;

  if (typeof direction.artisticIntent !== "string" || !direction.artisticIntent.trim()) {
    errors.push(
      `artisticIntent: expected non-empty string, got ${JSON.stringify(direction.artisticIntent)}`
    );
  }

  const visualLanguage = direction.visualLanguage;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    errors.push("visualLanguage: missing or not an object");
  } else {
    const language = visualLanguage as Record<string, unknown>;
    for (const key of [
      "geometry",
      "composition",
      "spacing",
      "symmetry",
      "edgeTreatment",
      "motionCharacter",
      "depth",
      "texture",
    ] as const) {
      if (typeof language[key] !== "string" || !language[key].trim()) {
        errors.push(`visualLanguage.${key}: expected non-empty string`);
      }
    }
  }

  const composition = direction.composition;
  if (!composition || typeof composition !== "object") {
    errors.push("composition: missing or not an object");
  } else {
    const layout = composition as Record<string, unknown>;
    if (typeof layout.composition !== "string" || !layout.composition.trim()) {
      errors.push("composition.composition: expected non-empty string");
    }
    if (typeof layout.negativeSpace !== "number" || layout.negativeSpace < 0 || layout.negativeSpace > 1) {
      errors.push(
        `composition.negativeSpace: expected number between 0 and 1, got ${JSON.stringify(layout.negativeSpace)}`
      );
    }
    if (!["left", "center", "right"].includes(String(layout.alignment))) {
      errors.push(`composition.alignment: invalid value ${JSON.stringify(layout.alignment)}`);
    }
    if (!["sparse", "balanced", "dense"].includes(String(layout.textDensity))) {
      errors.push(`composition.textDensity: invalid value ${JSON.stringify(layout.textDensity)}`);
    }
  }

  const motionLanguage = direction.motionLanguage;
  if (!motionLanguage || typeof motionLanguage !== "object") {
    errors.push("motionLanguage: missing or not an object");
  } else {
    const motion = motionLanguage as Record<string, unknown>;
    for (const key of ["force", "material", "timing", "deformation", "direction"] as const) {
      if (typeof motion[key] !== "string" || !motion[key].trim()) {
        errors.push(`motionLanguage.${key}: expected non-empty string`);
      }
    }
  }

  const camera = direction.camera;
  if (!camera || typeof camera !== "object") {
    errors.push("camera: missing or not an object");
  } else {
    const cameraValues = camera as Record<string, unknown>;
    if (!["locked", "slow-drift", "orbit"].includes(String(cameraValues.movement))) {
      errors.push(`camera.movement: invalid value ${JSON.stringify(cameraValues.movement)}`);
    }
    if (
      !["none", "slow-push", "slow-pull", "pulse"].includes(
        String(cameraValues.zoomBehavior)
      )
    ) {
      errors.push(
        `camera.zoomBehavior: invalid value ${JSON.stringify(cameraValues.zoomBehavior)}`
      );
    }
  }

  const palette = direction.palette;
  if (!palette || typeof palette !== "object") {
    errors.push("palette: missing or not an object");
  } else {
  const colors = palette as Record<string, unknown>;
    const textColor =
      typeof colors.textColor === "string"
        ? colors.textColor
        : typeof colors.primary === "string"
          ? colors.primary
          : null;
    if (typeof colors.background !== "string" || !textColor) {
      errors.push("palette: expected background and textColor strings");
    }
    for (const key of ["strategy", "material", "lightBehavior"] as const) {
      if (typeof colors[key] !== "string" || !String(colors[key]).trim()) {
        errors.push(`palette.${key}: expected non-empty string`);
      }
    }
    if (typeof colors.paletteReasoning !== "string" || !String(colors.paletteReasoning).trim()) {
      errors.push("palette.paletteReasoning: expected non-empty string");
    }
  }

  if (direction.fontRecommendation || direction.font || direction.selectedFont) {
    errors.push(
      "creative direction must not include font fields — font is selected upstream"
    );
  }

  const specificity =
    direction.specificityReasoning ?? direction.specificity_reasoning;
  const reasoningBlock = direction.reasoning;
  const whyFromReasoning =
    reasoningBlock && typeof reasoningBlock === "object"
      ? typeof (reasoningBlock as Record<string, unknown>).whyThisSongNotAnother === "string"
        ? String((reasoningBlock as Record<string, unknown>).whyThisSongNotAnother).trim()
        : ""
      : "";

  if ((!specificity || typeof specificity !== "object") && !whyFromReasoning) {
    errors.push("specificityReasoning / reasoning: missing");
  } else if (specificity && typeof specificity === "object") {
    const reasoning = specificity as Record<string, unknown>;
    const why =
      typeof reasoning.whyThisSongNotAnother === "string"
        ? reasoning.whyThisSongNotAnother.trim()
        : typeof reasoning.why_this_song_not_another === "string"
          ? reasoning.why_this_song_not_another.trim()
          : whyFromReasoning;
    if (!why) {
      errors.push("specificityReasoning.whyThisSongNotAnother: expected non-empty string");
    }
  }

  // Creative interpretation layer (required after normalization)
  for (const key of [
    "physicalInterpretation",
    "typographyIdentity",
    "atmosphere",
    "visualWorld",
    "typographyConcept",
    "motionSystem",
    "animationArc",
    "fontTreatment",
    "energyDistribution",
    "rendererIdentity",
    "reasoning",
  ] as const) {
    if (!direction[key] || typeof direction[key] !== "object") {
      errors.push(`${key}: missing or not an object`);
    }
  }

  return errors;
}

export function assertValidCreativeDirection(
  value: unknown,
  stage: PipelineStage
): CreativeDirection {
  const errors = getCreativeDirectionValidationErrors(value);
  if (errors.length > 0) {
    throw new CreativeDirectionPipelineError(stage, errors);
  }

  return value as CreativeDirection;
}

export function processGeminiCreativeDirection(rawText: string): CreativeDirection {
  logPipelineStage("raw-gemini-response", rawText, {
    length: rawText.length,
    startsWithFence: rawText.trim().startsWith("```"),
  });

  const { parsed, extractionMethod } = extractCreativeDirectionJson(rawText);
  logPipelineStage("parsed-json", parsed, { extractionMethod });

  const normalizationErrors = getNormalizationErrors(parsed);
  if (normalizationErrors.length > 0) {
    throw new CreativeDirectionPipelineError(
      "normalized-direction",
      normalizationErrors,
      "Normalization failed before validation. "
    );
  }

  const normalized = normalizeCreativeDirection(parsed);
  if (!normalized) {
    throw new CreativeDirectionPipelineError(
      "normalized-direction",
      ["normalizeCreativeDirection returned null"]
    );
  }

  logPipelineStage("normalized-direction", normalized);

  const validationErrors = getCreativeDirectionValidationErrors(normalized);

  if (validationErrors.length > 0) {
    throw new CreativeDirectionPipelineError(
      "validated-direction",
      validationErrors,
      "Gemini payload failed schema validation. "
    );
  }

  const validated = normalized as CreativeDirection;

  logPipelineStage("validated-direction", validated);
  return validated;
}
