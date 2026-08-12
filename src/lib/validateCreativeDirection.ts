import type { CreativeDirection } from "../types/creativeDirection";
import { normalizeCreativeDirection } from "@/lib/normalizeCreativeDirection";

export function validateCreativeDirection(
  value: unknown
): CreativeDirection | null {
  if (!value || typeof value !== "object") return null;

  const normalized = normalizeCreativeDirection(value);
  if (!normalized) return null;

  const direction = normalized as Record<string, unknown>;

  if (typeof direction.artisticIntent !== "string") return null;

  const visualLanguage = direction.visualLanguage;
  if (!visualLanguage || typeof visualLanguage !== "object") return null;

  const composition = direction.composition;
  if (!composition || typeof composition !== "object") return null;

  const motionLanguage = direction.motionLanguage;
  if (!motionLanguage || typeof motionLanguage !== "object") return null;

  const camera = direction.camera;
  if (!camera || typeof camera !== "object") return null;

  const palette = direction.palette;
  if (!palette || typeof palette !== "object") return null;

  const colors = palette as Record<string, unknown>;
  if (typeof colors.background !== "string") return null;
  const textColor =
    typeof colors.textColor === "string"
      ? colors.textColor
      : typeof colors.primary === "string"
        ? colors.primary
        : null;
  if (!textColor) return null;

  return normalized as CreativeDirection;
}

export function validateCachedCreativeDirection(
  value: unknown
): CreativeDirection | null {
  return validateCreativeDirection(value);
}
