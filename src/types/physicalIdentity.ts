/**
 * Compiled physical identity — executable numbers between CreativeDirection and the renderer.
 * Descriptive strings from CreativeDirector are compiled into these, then drive motionParams.
 */

export type PhysicalMaterial =
  | "rigid"
  | "elastic"
  | "fluid"
  | "fragile"
  | "soft"
  | "granular"
  | "gaseous";

export type PhysicalDeformation =
  | "stretch"
  | "fracture"
  | "compress"
  | "dissolve"
  | "flow"
  | "bend"
  | "rotate"
  | "vibrate";

export type ForceDirection =
  | "inward"
  | "outward"
  | "vertical"
  | "horizontal"
  | "radial";

export type RecoveryMode = "snap" | "settle" | "reform" | "fade" | "none";

export interface PhysicalModel {
  material: PhysicalMaterial;
  deformation: PhysicalDeformation;
  forceDirection: ForceDirection;
  recovery: RecoveryMode;
  resistance: number;
  elasticity: number;
  fragmentation: number;
  tension: number;
}

export type WordBehavior =
  | "expand"
  | "contract"
  | "collide"
  | "drift"
  | "orbit"
  | "fracture"
  | "flow";

export type GlyphBehavior =
  | "stable"
  | "distort"
  | "fragment"
  | "jitter"
  | "breathe";

export type SpacingBehavior = "compress" | "expand" | "unstable";

export type SilhouetteBehavior = "preserve" | "deform" | "break";

export interface TypographyBehavior {
  wordBehavior: WordBehavior;
  glyphBehavior: GlyphBehavior;
  spacingBehavior: SpacingBehavior;
  silhouetteBehavior: SilhouetteBehavior;
}

/** Font structure → motion constraints. */
export interface FontPhysics {
  maxStretch: number;
  maxRotation: number;
  compressionTolerance: number;
  fragmentationTolerance: number;
  silhouetteStrength: number;
}

export const DEFAULT_PHYSICAL_MODEL: PhysicalModel = {
  material: "elastic",
  deformation: "stretch",
  forceDirection: "horizontal",
  recovery: "settle",
  resistance: 0.45,
  elasticity: 0.55,
  fragmentation: 0.15,
  tension: 0.4,
};

export const DEFAULT_TYPOGRAPHY_BEHAVIOR: TypographyBehavior = {
  wordBehavior: "expand",
  glyphBehavior: "stable",
  spacingBehavior: "compress",
  silhouetteBehavior: "preserve",
};

export const DEFAULT_FONT_PHYSICS: FontPhysics = {
  maxStretch: 0.18,
  maxRotation: 4,
  compressionTolerance: 0.15,
  fragmentationTolerance: 0.35,
  silhouetteStrength: 0.7,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function clampPhysicalModel(model: PhysicalModel): PhysicalModel {
  return {
    ...model,
    resistance: clamp01(model.resistance),
    elasticity: clamp01(model.elasticity),
    fragmentation: clamp01(model.fragmentation),
    tension: clamp01(model.tension),
  };
}
