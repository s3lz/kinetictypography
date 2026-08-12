import type { CameraBrief, CompositionDirection, VisualLanguage } from "@/types/designBrief";
import {
  DEFAULT_MOTION_PERSONALITY,
  type MotionPersonality,
} from "@/types/motionPersonality";

function hashPick(key: string, options: MotionPersonality[]): MotionPersonality {
  if (options.length === 0) return DEFAULT_MOTION_PERSONALITY;
  if (options.length === 1) return options[0];

  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return options[hash % options.length];
}

function matchMotionCharacterHint(motionCharacter: string): MotionPersonality | null {
  const key = motionCharacter.toLowerCase();

  if (
    key.includes("chaotic") ||
    key.includes("fragment") ||
    key.includes("glitch") ||
    key.includes("noisy")
  ) {
    return "chaotic";
  }
  if (
    key.includes("theatrical") ||
    key.includes("dramatic") ||
    key.includes("pulse") ||
    key.includes("poster")
  ) {
    return "theatrical";
  }
  if (
    key.includes("mechanical") ||
    key.includes("locked") ||
    key.includes("modular") ||
    key.includes("digital") ||
    key.includes("grid")
  ) {
    return "mechanical";
  }
  if (
    key.includes("float") ||
    key.includes("fluid") ||
    key.includes("drift") ||
    key.includes("breath") ||
    key.includes("flow")
  ) {
    return "flowing";
  }
  if (
    key.includes("restrain") ||
    key.includes("subtle") ||
    key.includes("minimal") ||
    key.includes("quiet")
  ) {
    return "restrained";
  }
  if (
    key.includes("kinetic") ||
    key.includes("elastic") ||
    key.includes("physical") ||
    key.includes("expressive")
  ) {
    return "physical";
  }
  if (key.includes("organic")) return "flowing";

  return null;
}

function candidatesFromComposition(composition: CompositionDirection): MotionPersonality[] {
  const key = composition.composition.toLowerCase();

  if (key.includes("burst") || key.includes("radial")) {
    return ["chaotic", "physical", "theatrical"];
  }
  if (key.includes("poster") || key.includes("stack")) {
    return ["theatrical", "mechanical", "restrained"];
  }
  if (key.includes("edge") || key.includes("anchor") || key.includes("rail")) {
    return ["restrained", "mechanical", "theatrical"];
  }
  if (key.includes("wide") || key.includes("banner")) {
    return ["flowing", "theatrical", "physical"];
  }
  if (composition.textDensity === "sparse") {
    return ["flowing", "restrained", "theatrical"];
  }
  if (composition.textDensity === "dense") {
    return ["mechanical", "chaotic", "physical"];
  }

  return ["physical", "flowing", "theatrical"];
}

function candidatesFromCamera(camera: CameraBrief): MotionPersonality[] {
  if (camera.movement === "orbit") return ["theatrical", "flowing", "physical"];
  if (camera.movement === "slow-drift") return ["flowing", "restrained", "theatrical"];
  return ["mechanical", "restrained", "physical"];
}

function hintFromArtisticIntent(intent: string): MotionPersonality | null {
  const key = intent.toLowerCase();

  if (key.includes("chaos") || key.includes("shatter") || key.includes("fragment")) {
    return "chaotic";
  }
  if (key.includes("dramatic") || key.includes("anticipation") || key.includes("hold")) {
    return "theatrical";
  }
  if (key.includes("grid") || key.includes("precise") || key.includes("mechanical")) {
    return "mechanical";
  }
  if (key.includes("drift") || key.includes("flow") || key.includes("breathe")) {
    return "flowing";
  }
  if (key.includes("minimal") || key.includes("subtle") || key.includes("restrained")) {
    return "restrained";
  }
  if (key.includes("overshoot") || key.includes("rebound") || key.includes("physical")) {
    return "physical";
  }

  return null;
}

/**
 * Derives renderer motion personality from creative-direction fields outside motionLanguage.
 * Songs with identical motionLanguage schemas can still diverge here.
 */
export function deriveMotionPersonality(
  visualLanguage: VisualLanguage,
  composition: CompositionDirection,
  camera: CameraBrief,
  artisticIntent: string
): MotionPersonality {
  const fromCharacter = matchMotionCharacterHint(visualLanguage.motionCharacter);
  if (fromCharacter) return fromCharacter;

  const fromIntent = hintFromArtisticIntent(artisticIntent);
  if (fromIntent) return fromIntent;

  const compositionCandidates = candidatesFromComposition(composition);
  const cameraCandidates = candidatesFromCamera(camera);
  const shared = compositionCandidates.filter((candidate) =>
    cameraCandidates.includes(candidate)
  );
  const pool = shared.length > 0 ? shared : compositionCandidates;

  const differentiationKey = [
    visualLanguage.motionCharacter,
    visualLanguage.geometry,
    visualLanguage.texture,
    visualLanguage.spacing,
    visualLanguage.depth,
    composition.composition,
    composition.alignment,
    String(composition.negativeSpace),
    camera.movement,
    camera.zoomBehavior,
    artisticIntent.slice(0, 120),
  ].join("|");

  return hashPick(differentiationKey, pool);
}
