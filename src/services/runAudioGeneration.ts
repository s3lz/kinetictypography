import { generateCreativeState } from "@/services/generateCreativeState";
import type { CreativeState } from "@/types/CreativeState";
import type { GenerationProgress } from "@/types/generationProgress";

const GENERATION_MIN_DELAY_MS = 1200;

export async function runAudioGeneration(
  file: File,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CreativeState> {
  const startedAt = performance.now();

  const generatedState = await generateCreativeState(file, onProgress);

  const elapsed = performance.now() - startedAt;
  const remaining = GENERATION_MIN_DELAY_MS - elapsed;
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remaining);
    });
  }

  return generatedState;
}
