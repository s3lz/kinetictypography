import type { CreativeDirection } from "@/types/creativeDirection";
import {
  CreativeDirectionPipelineError,
  getCreativeDirectionValidationErrors,
  logPipelineStage,
} from "@/lib/creativeDirectionPipeline";
import { normalizeCreativeDirection } from "@/lib/normalizeCreativeDirection";

const CACHE_KEY_PREFIX = "creative-direction:";

/**
 * Temporarily hard-disabled so every request regenerates CreativeDirection.
 * Re-enable by restoring env-based skip:
 *   VITE_SKIP_CREATIVE_DIRECTION_CACHE=true|false
 *
 * NOTE: Font anti-repeat and direction-signature uniqueness are independent
 * of this flag and always record across songs.
 */
export function isCreativeDirectionCacheSkipped(): boolean {
  return true;
}

function getCacheKey(fingerprint: string): string {
  return `${CACHE_KEY_PREFIX}${fingerprint}`;
}

export function getCachedCreativeDirection(
  fingerprint: string
): CreativeDirection | null {
  if (isCreativeDirectionCacheSkipped()) return null;

  try {
    const raw = localStorage.getItem(getCacheKey(fingerprint));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    logPipelineStage("cache-read", parsed);

    if (!parsed || typeof parsed !== "object") {
      throw new CreativeDirectionPipelineError("cache-read", [
        "cached value was not a JSON object",
      ]);
    }

    const normalized = normalizeCreativeDirection(parsed);

    if (!normalized) {
      localStorage.removeItem(getCacheKey(fingerprint));
      throw new CreativeDirectionPipelineError("cache-read", [
        "cached CreativeDirection could not be normalized — stale cache evicted",
      ]);
    }

    const validationErrors = getCreativeDirectionValidationErrors(normalized);
    if (validationErrors.length > 0) {
      localStorage.removeItem(getCacheKey(fingerprint));
      throw new CreativeDirectionPipelineError("cache-read", validationErrors);
    }

    return normalized as unknown as CreativeDirection;
  } catch (error) {
    if (error instanceof CreativeDirectionPipelineError) {
      console.warn("[CreativeDirectionCache]", error.message);
      return null;
    }
    return null;
  }
}

export function setCachedCreativeDirection(
  fingerprint: string,
  direction: CreativeDirection
): void {
  if (isCreativeDirectionCacheSkipped()) return;

  try {
    const normalized = normalizeCreativeDirection(direction);
    if (!normalized) return;

    localStorage.setItem(getCacheKey(fingerprint), JSON.stringify(normalized));
  } catch (error) {
    console.warn("[CreativeDirectionCache] Failed to save cache entry", error);
  }
}
