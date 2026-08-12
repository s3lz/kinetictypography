import {
  RENDERER_DESCRIPTORS,
  type CompositionDirection,
  type RendererDescriptor,
  type VisualLanguage,
} from "@/types/designBrief";

const DESCRIPTOR_MAP: Record<string, RendererDescriptor[]> = {
  rectilinear: ["rectilinear", "angular", "modular"],
  angular: ["angular", "hard-edge"],
  organic: ["elastic", "layered"],
  compressed: ["compressed", "dense", "tight"],
  expanded: ["expanded", "sparse", "oversized"],
  asymmetric: ["asymmetric", "offset-baseline"],
  symmetric: ["columnar", "stacked"],
  fragmented: ["fragmented", "noisy"],
  modular: ["modular", "stacked"],
  floating: ["sparse", "elastic"],
  tight: ["tight", "compressed"],
  loose: ["expanded", "sparse"],
  hard: ["hard-edge", "angular", "cropped"],
  soft: ["elastic", "layered"],
  flat: ["flat", "cropped"],
  layered: ["layered", "stacked"],
  digital: ["noisy", "modular", "angular"],
  noise: ["noisy", "fragmented"],
  column: ["columnar", "stacked"],
  poster: ["oversized", "cropped", "dense"],
  sparse: ["sparse", "expanded"],
  dense: ["dense", "compressed"],
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function addDescriptors(
  target: Set<RendererDescriptor>,
  keys: string[]
): void {
  for (const key of keys) {
    const mapped = DESCRIPTOR_MAP[key];
    if (mapped) {
      for (const descriptor of mapped) {
        target.add(descriptor);
      }
    }
  }
}

export function deriveDescriptors(
  visualLanguage: VisualLanguage,
  composition: CompositionDirection
): RendererDescriptor[] {
  const descriptors = new Set<RendererDescriptor>();
  const sourceText = [
    visualLanguage.geometry,
    visualLanguage.composition,
    visualLanguage.spacing,
    visualLanguage.symmetry,
    visualLanguage.edgeTreatment,
    visualLanguage.motionCharacter,
    visualLanguage.depth,
    visualLanguage.texture,
    composition.composition,
    composition.textDensity,
  ].join(" ");

  addDescriptors(descriptors, tokenize(sourceText));

  if (composition.negativeSpace > 0.7) descriptors.add("sparse");
  if (composition.negativeSpace < 0.35) descriptors.add("dense");
  if (composition.alignment !== "center") descriptors.add("offset-baseline");

  const ordered = RENDERER_DESCRIPTORS.filter((descriptor) =>
    descriptors.has(descriptor)
  );

  return ordered.slice(0, 8);
}
