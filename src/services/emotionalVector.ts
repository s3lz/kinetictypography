import type { EmotionalVector } from "@/types/emotionalVector";
import type { AudioFeatures } from "@/types/audio";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hintScore(hints: string[], keywords: string[]): number {
  if (hints.length === 0 || keywords.length === 0) return 0;

  const matches = keywords.filter((keyword) =>
    hints.some((hint) => hint.includes(keyword) || keyword.includes(hint))
  ).length;

  return clamp01(matches / keywords.length);
}

export function deriveEmotionalVector(
  audioFeatures: Omit<AudioFeatures, "emotionalVector">
): EmotionalVector {
  const { energy, brightness, density, dynamics, semanticProfile } = audioFeatures;
  const soft = 1 - brightness;
  const sparse = 1 - density;

  const warmth =
    clamp01(
      soft * 0.25 +
        hintScore(semanticProfile.textureHints, ["warm", "analog", "organic"]) * 0.35 +
        hintScore(semanticProfile.moodHints, ["tender", "wistful", "warm"]) * 0.25 +
        (1 - hintScore(semanticProfile.textureHints, ["synthetic", "glassy", "crisp"])) * 0.15
    );

  const darkness =
    clamp01(
      soft * 0.3 +
        hintScore(semanticProfile.moodHints, ["brooding", "solemn", "weighted"]) * 0.3 +
        hintScore(semanticProfile.spaceHints, ["enclosed", "cinematic"]) * 0.2 +
        (1 - brightness) * 0.2
    );

  const organic =
    clamp01(
      hintScore(semanticProfile.textureHints, ["organic", "warm analog", "smooth"]) * 0.4 +
        (1 - hintScore(semanticProfile.textureHints, ["synthetic", "glassy", "grainy"])) * 0.25 +
        hintScore(semanticProfile.motionHints, ["flowing", "blooming", "swelling"]) * 0.2 +
        sparse * 0.15
    );

  const nostalgia =
    clamp01(
      hintScore(semanticProfile.moodHints, ["wistful", "nostalgic", "reflective"]) * 0.35 +
        hintScore(semanticProfile.textureHints, ["warm analog", "grainy", "hazy"]) * 0.25 +
        soft * 0.2 +
        (audioFeatures.tempo < 100 ? 0.2 : audioFeatures.tempo < 115 ? 0.1 : 0)
    );

  const tension =
    clamp01(
      dynamics * 0.35 +
        energy * 0.25 +
        hintScore(semanticProfile.moodHints, ["restless", "commanding", "radiant"]) * 0.2 +
        hintScore(semanticProfile.motionHints, ["fragmented", "pulsing", "oscillating"]) * 0.2
    );

  const complexity =
    clamp01(
      density * 0.35 +
        hintScore(semanticProfile.textureHints, ["layered", "lush", "grainy"]) * 0.25 +
        hintScore(semanticProfile.spaceHints, ["immersive", "cinematic"]) * 0.2 +
        dynamics * 0.2
    );

  return {
    energy,
    warmth,
    darkness,
    organic,
    nostalgia,
    tension,
    complexity,
  };
}
