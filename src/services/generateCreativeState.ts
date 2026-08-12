import { mapCreativeDirectionToState } from "@/services/stateMapper";
import { resolveCreativeDirection } from "@/services/resolveCreativeDirection";
import { logPipelineStage } from "@/lib/creativeDirectionPipeline";
import { auditFontInfluenceOnCreativeState } from "@/lib/fontInfluenceAudit";
import { logPipelineDebugSnapshot } from "@/lib/pipelineDebug";
import { runPhysicalIdentitySyntheticTest } from "@/lib/physicalIdentitySyntheticTest";
import type { CreativeState } from "@/types/CreativeState";
import type { GenerationProgress } from "@/types/generationProgress";

let ranPhysicalIdentitySyntheticTest = false;

export async function generateCreativeState(
  file: File,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CreativeState> {
  const { direction, audioFeatures, selectedFont, fontRecommendation } =
    await resolveCreativeDirection(file, onProgress);

  onProgress?.({ stage: "mapping-state", detail: "Building renderer state" });

  logPipelineStage("validated-direction", direction, {
    source: "resolveCreativeDirection",
    selectedFont: selectedFont.name,
  });

  const creativeState = mapCreativeDirectionToState(
    direction,
    audioFeatures,
    selectedFont,
    fontRecommendation
  );

  if (import.meta.env.DEV && !ranPhysicalIdentitySyntheticTest) {
    ranPhysicalIdentitySyntheticTest = true;
    runPhysicalIdentitySyntheticTest();
  }

  logPipelineStage("creative-state", creativeState);
  logPipelineDebugSnapshot(direction, creativeState, {
    songFile: file.name,
    font: selectedFont.name,
  }, audioFeatures);

  auditFontInfluenceOnCreativeState(direction, creativeState, selectedFont.name);

  return creativeState;
}
