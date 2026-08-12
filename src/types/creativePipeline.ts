import type { CreativeDirection } from "@/types/creativeDirection";
import type { AudioFeatures } from "@/types/audio";
import type { FontRecommendation, SelectedFontMetadata } from "@/types/fontMetadata";

export interface ResolvedCreativePipeline {
  direction: CreativeDirection;
  audioFeatures: AudioFeatures;
  selectedFont: SelectedFontMetadata;
  fontRecommendation: FontRecommendation;
}
