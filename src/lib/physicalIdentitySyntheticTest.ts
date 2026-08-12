/**
 * Temporary internal validation: fragile/fracture vs fluid/flow must diverge
 * in params and sampled transforms. Run via:
 *   npx --yes tsx src/lib/physicalIdentitySyntheticTest.ts
 */
import { synthesizeIdentityFixtures } from "./compilePhysicalIdentity";
import { resolveMotionLayers } from "@/components/MotionEngine/MotionResolver";
import { defaultCreativeState } from "@/types/CreativeState";
import type { CompiledPhysicalIdentity } from "./compilePhysicalIdentity";
import type { CreativeState } from "@/types/CreativeState";

function stateFromIdentity(
  identity: CompiledPhysicalIdentity,
  label: string
): CreativeState {
  return {
    ...defaultCreativeState,
    text: label,
    physicalModel: identity.physicalModel,
    typographyBehavior: identity.typographyBehavior,
    fontPhysics: identity.fontPhysics,
    motionParams: identity.motionParams,
    motionProfile: {
      primary: identity.physicalModel.deformation === "fracture" ? "impact" : "wave",
      secondary:
        identity.physicalModel.deformation === "fracture"
          ? ["elastic", "material"]
          : ["float", "pulse"],
    },
    motion: {
      float: identity.physicalModel.material === "fluid" ? 48 : 12,
      wave: identity.physicalModel.deformation === "flow" ? 70 : 10,
      pulse: identity.physicalModel.material === "fluid" ? 40 : 18,
      elastic: identity.physicalModel.deformation === "fracture" ? 55 : 20,
      impact: identity.physicalModel.deformation === "fracture" ? 78 : 14,
      material: 20,
    },
    animationSpeed:
      identity.physicalModel.recovery === "snap"
        ? 1.12
        : identity.physicalModel.material === "fluid"
          ? 0.82
          : 1,
  };
}

function sampleDistance(
  a: ReturnType<typeof resolveMotionLayers>,
  b: ReturnType<typeof resolveMotionLayers>
): number {
  const keys = ["x", "y", "scale", "rotation", "skewX"] as const;
  let sum = 0;
  for (const layer of ["word", "local"] as const) {
    for (const k of keys) {
      sum += Math.abs(a[layer][k] - b[layer][k]);
    }
  }
  return sum;
}

export function runPhysicalIdentitySyntheticTest(): boolean {
  const { fragileFracture, fluidFlow } = synthesizeIdentityFixtures();

  const paramsDiff = {
    elasticStretch: Math.abs(
      (fragileFracture.motionParams.elastic?.stretchAmount ?? 0) -
        (fluidFlow.motionParams.elastic?.stretchAmount ?? 0)
    ),
    impactFrag: Math.abs(
      (fragileFracture.motionParams.impact?.fragmentationAmount ?? 0) -
        (fluidFlow.motionParams.impact?.fragmentationAmount ?? 0)
    ),
    impactRelease: Math.abs(
      (fragileFracture.motionParams.impact?.releaseSpeed ?? 0) -
        (fluidFlow.motionParams.impact?.releaseSpeed ?? 0)
    ),
    waveSmooth: Math.abs(
      (fragileFracture.motionParams.wave?.smoothness ?? 0) -
        (fluidFlow.motionParams.wave?.smoothness ?? 0)
    ),
    damping: Math.abs(
      (fragileFracture.motionParams.elastic?.damping ?? 0) -
        (fluidFlow.motionParams.elastic?.damping ?? 0)
    ),
  };

  const stateA = stateFromIdentity(fragileFracture, "BRITTLE");
  const stateB = stateFromIdentity(fluidFlow, "LIQUID");

  let transformDistance = 0;
  const times = [0.05, 0.35, 0.8, 1.4, 2.1];
  for (const t of times) {
    const a = resolveMotionLayers({
      charIndex: 1,
      totalChars: 7,
      time: t,
      state: stateA,
    });
    const b = resolveMotionLayers({
      charIndex: 1,
      totalChars: 7,
      time: t,
      state: stateB,
    });
    transformDistance += sampleDistance(a, b);
  }

  const passed =
    paramsDiff.impactFrag > 0.35 &&
    paramsDiff.impactRelease > 0.35 &&
    paramsDiff.waveSmooth > 0.2 &&
    paramsDiff.damping > 0.08 &&
    transformDistance > 8;

  console.log("[Physical Identity Synthetic Test]", {
    fragile: {
      physicalModel: fragileFracture.physicalModel,
      typographyBehavior: fragileFracture.typographyBehavior,
      impact: fragileFracture.motionParams.impact,
      elastic: fragileFracture.motionParams.elastic,
    },
    fluid: {
      physicalModel: fluidFlow.physicalModel,
      typographyBehavior: fluidFlow.typographyBehavior,
      impact: fluidFlow.motionParams.impact,
      wave: fluidFlow.motionParams.wave,
    },
    paramsDiff,
    transformDistance: Number(transformDistance.toFixed(2)),
    passed,
  });

  if (!passed) {
    console.error(
      "[Physical Identity Synthetic Test] FAILED — identities collapsed in renderer params/transforms"
    );
  } else {
    console.log(
      "[Physical Identity Synthetic Test] PASSED — fragile/fracture ≠ fluid/flow"
    );
  }

  return passed;
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("physicalIdentitySyntheticTest");

if (isDirectRun) {
  const ok = runPhysicalIdentitySyntheticTest();
  process.exit(ok ? 0 : 1);
}
