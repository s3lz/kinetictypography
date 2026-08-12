import type { CreativeState } from "@/types/CreativeState";
import type { CreativeDirection } from "@/types/creativeDirection";
import type { FontMetadata } from "@/types/fontMetadata";
import { getFontMetadata } from "@/lib/creativeInterpretation";
import type { FontId } from "@/engine/fontSelector";
import type { MotionDimension } from "@/types/CreativeState";

const ALLOWED_TYPOGRAPHY_FONT_FIELDS = [
  "structure.density",
  "structure.sharpness",
  "structure.roundness",
  "structure.strokeContrast",
  "structure.complexity",
  "visualIdentity",
  "energy (font size scale only)",
] as const;

const FORBIDDEN_FONT_MOTION_FIELDS = [
  "motionAffinity",
  "motionPersonality",
] as const;

function topMotionAffinityKey(
  affinity: FontMetadata["motionAffinity"]
): keyof FontMetadata["motionAffinity"] {
  let best: keyof FontMetadata["motionAffinity"] = "floating";
  let peak = -1;

  for (const [key, value] of Object.entries(affinity) as Array<
    [keyof FontMetadata["motionAffinity"], number]
  >) {
    if (value > peak) {
      peak = value;
      best = key;
    }
  }

  return best;
}

function topMotionSlider(motion: CreativeState["motion"]): MotionDimension {
  const dimensions: MotionDimension[] = [
    "float",
    "wave",
    "pulse",
    "elastic",
    "impact",
    "material",
  ];
  let best: MotionDimension = "float";
  let peak = -1;

  for (const dimension of dimensions) {
    if (motion[dimension] > peak) {
      peak = motion[dimension];
      best = dimension;
    }
  }

  return best;
}

function mapAffinityToSlider(
  key: keyof FontMetadata["motionAffinity"]
): MotionDimension | null {
  if (key === "floating") return "float";
  if (key === "organic") return "pulse";
  if (key === "mechanical") return "material";
  if (key === "impact") return "impact";
  if (key === "kinetic") return "elastic";
  if (key === "dissolve" || key === "glitch") return null;
  return null;
}

export interface FontInfluenceAuditResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
  allowedInfluence: readonly string[];
  forbiddenMotionFields: readonly string[];
  topFontAffinity: keyof FontMetadata["motionAffinity"];
  topMotionSlider: MotionDimension;
  affinityMirrorsSlider: boolean;
}

export function auditFontInfluenceOnCreativeState(
  direction: CreativeDirection,
  state: CreativeState,
  fontId: FontId
): FontInfluenceAuditResult {
  const font = getFontMetadata(fontId);
  const violations: string[] = [];
  const warnings: string[] = [];

  const topAffinity = topMotionAffinityKey(font.motionAffinity);
  const topSlider = topMotionSlider(state.motion);
  const mappedSlider = mapAffinityToSlider(topAffinity);
  const affinityMirrorsSlider = mappedSlider === topSlider;

  if (affinityMirrorsSlider && state.motion[topSlider] >= 70) {
    warnings.push(
      `motion slider peak (${topSlider}=${state.motion[topSlider]}) mirrors font motionAffinity peak (${topAffinity}) — verify motion came from audio brief, not font`
    );
  }

  if (
    direction.artisticIntent.toLowerCase().includes(font.name.toLowerCase()) &&
    direction.artisticIntent.toLowerCase().includes("motion")
  ) {
    violations.push("artisticIntent references font name alongside motion — font must not drive motion");
  }

  const passed = violations.length === 0;

  const result: FontInfluenceAuditResult = {
    passed,
    violations,
    warnings,
    allowedInfluence: ALLOWED_TYPOGRAPHY_FONT_FIELDS,
    forbiddenMotionFields: FORBIDDEN_FONT_MOTION_FIELDS,
    topFontAffinity: topAffinity,
    topMotionSlider: topSlider,
    affinityMirrorsSlider,
  };

  console.group("[Font Influence Audit] Post CreativeState");
  console.log("allowed typography influence:", ALLOWED_TYPOGRAPHY_FONT_FIELDS);
  console.log("forbidden motion fields:", FORBIDDEN_FONT_MOTION_FIELDS);
  console.log("audit:", result);
  console.groupEnd();

  return result;
}
