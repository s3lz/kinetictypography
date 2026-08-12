import type { AudioFeatures } from "../src/types/audio";
import type { CreativeDirection } from "../src/types/creativeDirection";
import type { FontStylingContext } from "../src/types/fontMetadata";
import {
  computeSongUniquenessVector,
  describeUniquenessVector,
} from "../src/lib/songUniquenessVector";
import {
  CreativeDirectionPipelineError,
  processGeminiCreativeDirection,
} from "../src/lib/creativeDirectionPipeline";

const REQUIRED_FORMAT_JSON = `{
  "physicalInterpretation": {
    "phenomenon": "",
    "forces": "",
    "restState": "",
    "disruption": "",
    "recovery": ""
  },
  "typographyIdentity": {
    "weight": "",
    "rigidity": "",
    "flexibility": "",
    "edgeBehavior": "",
    "spacingBehavior": "",
    "silhouetteBehavior": "",
    "deformationTolerance": ""
  },
  "typographyConcept": {
    "metaphor": "",
    "behavior": ""
  },
  "atmosphere": {
    "description": "",
    "emotionalTemperature": "",
    "tension": 0.0,
    "intimacy": 0.0,
    "movement": 0.0,
    "complexity": 0.0,
    "humanQuality": 0.0
  },
  "visualWorld": {
    "field": "",
    "lighting": "",
    "texture": "",
    "material": "",
    "description": ""
  },
  "composition": {
    "composition": "",
    "negativeSpace": 0.0,
    "alignment": "",
    "textDensity": ""
  },
  "motionSystem": {
    "motionAction": {
      "primaryAction": "",
      "secondaryConsequence": "",
      "explanation": ""
    },
    "animationRules": {
      "wordBehavior": "",
      "glyphBehavior": "",
      "scale": "",
      "position": "",
      "rotation": "",
      "spacing": "",
      "deformation": "",
      "timing": "",
      "intensityResponse": ""
    },
    "motionConcept": {
      "metaphor": "",
      "primaryMotion": "",
      "secondaryMotion": "",
      "intensityBehavior": "",
      "wordMovement": "",
      "glyphMovement": "",
      "cameraMovement": ""
    },
    "motionLanguage": {
      "force": "",
      "material": "",
      "timing": "",
      "deformation": "",
      "direction": ""
    },
    "motionBehavior": {
      "primary": "",
      "secondary": ""
    },
    "primaryPrimitive": "",
    "secondaryPrimitive": ""
  },
  "animationArc": {
    "entrance": "",
    "development": "",
    "peak": "",
    "resolution": ""
  },
  "palette": {
    "background": "",
    "textColor": "",
    "strategy": "",
    "lightBehavior": "",
    "material": "",
    "paletteReasoning": ""
  },
  "fontTreatment": {
    "role": "",
    "deformation": "",
    "spacing": "",
    "contrast": "",
    "rigidity": "",
    "spacingBehavior": "",
    "edgeBehavior": "",
    "silhouettePreservation": "",
    "flexibility": "",
    "deformationTolerance": ""
  },
  "camera": {
    "movement": "locked",
    "zoomBehavior": "none"
  },
  "energyDistribution": {
    "word": 0.8,
    "glyph": 0.15,
    "camera": 0.05
  },
  "rendererIdentity": {
    "primaryMotion": "",
    "secondaryMotion": "",
    "wordMovement": "",
    "glyphMovement": "",
    "scaleBehavior": "",
    "positionBehavior": "",
    "rotationBehavior": "",
    "spacingBehavior": "",
    "deformationBehavior": "",
    "backgroundColor": "",
    "textColor": "",
    "composition": "",
    "camera": "locked"
  },
  "visualLanguage": {
    "geometry": "",
    "composition": "",
    "spacing": "",
    "symmetry": "",
    "edgeTreatment": "",
    "motionCharacter": "",
    "depth": "",
    "texture": ""
  },
  "artisticIntent": "",
  "reasoning": {
    "creativeTranslation": "",
    "whyThisSongNotAnother": "",
    "hiddenIdentityCheck": "",
    "selfCheck": {
      "hiddenIdentity": true,
      "uniquePhysicalBehavior": true,
      "developerImplementable": true,
      "fontGeometryOnly": true,
      "avoidedGenericVisuals": true
    }
  }
}`;

function buildPrompt(
  audioFeatures: AudioFeatures,
  selectedFont: FontStylingContext
): string {
  const uniqueness = computeSongUniquenessVector(audioFeatures);

  return `You are designing a KINETIC TYPOGRAPHY ENGINE.

You are NOT creating:
- a music video scene
- a visual world
- a mood board
- a cinematic environment
- a genre aesthetic

The ONLY subject is:
"If this song became moving typography, what physical behavior would the letters perform?"

The final output must describe an animation system that can be DIRECTLY RENDERED.

==================================================
CORE PIPELINE
==================================================

Audio
  ↓
Physical forces
  ↓
Typography behavior
  ↓
Animation mechanics
  ↓
Color relationship
  ↓
Renderer parameters

Never do: Audio → genre → visual cliché

BAD: "Rock song → dark stage → aggressive typography"
BAD: "Emotional song → blue background → floating text"
GOOD: "High transient energy + unstable rhythm → compressed letter mass that repeatedly separates and reforms"

==================================================
IMPORTANT PRINCIPLE
==================================================

The metaphor is NOT the output. The metaphor is only a thinking tool.

BAD: "The letters are obsidian."
GOOD: "The word remains compressed at rest, expands 20%, splits horizontally during peaks, then rapidly snaps back with elastic recoil."

The renderer cannot animate "obsidian."
The renderer CAN animate: position, scale, rotation, spacing, deformation, opacity, timing, velocity, spring behavior.

Every creative decision MUST become a physical animation rule.

==================================================
STEP 1 — physicalInterpretation
==================================================

Convert audio into physical forces. The letters themselves are the phenomenon.

{
  phenomenon,
  forces,
  restState,      // executable rest condition
  disruption,     // what peaks/transients do
  recovery        // how it returns
}

Think: tension between opposing forces | unstable balance | pressure release | continuous flow | fragmentation and reunion | expansion and contraction | attraction and repulsion | gradual transformation

Avoid: rooms, places, landscapes, objects as decoration

==================================================
STEP 2 — typographyIdentity (font = physical body)
==================================================

Selected font: ${selectedFont.name}
Font metadata (geometry ONLY — 5% max):
${JSON.stringify(selectedFont, null, 2)}

Font metadata affects ONLY: structural rigidity, density, stroke behavior, silhouette, spacing tolerance.
Font metadata does NOT determine: color, genre, mood, environment.

Do NOT assume: blackletter=gothic | serif=elegant | script=romantic

{
  weight,
  rigidity,
  flexibility,
  edgeBehavior,
  spacingBehavior,
  silhouetteBehavior,
  deformationTolerance
}

Dense sharp font → may resist deformation, may fracture instead of stretch.
Thin flowing font → may bend, stretch, dissolve.

typographyConcept: mirror executable summary as metaphor/behavior strings for compat (must still sound like animation rules, not poetry).

==================================================
STEP 3 — motionSystem.motionAction (ONE dominant action)
==================================================

Choose ONE primaryAction from:
compression | expansion | stretch | fracture | flow | erosion | alignment | dispersion | magnetic_pull | collision | shear | warping | drift | collapse | release

secondaryConsequence = a CONSEQUENCE of the primary action, not a second competing animation.

Avoid defaulting to pulse / bounce / shake / oscillate unless audio specifically requires repetition.

{
  primaryAction,
  secondaryConsequence,
  explanation
}

Examples:
fracture → primary: letters split apart | secondary: pieces magnetically reconnect
stretch → primary: letters elongate | secondary: edges wobble after release

Also fill motionLanguage/motionBehavior/primaryPrimitive CONSISTENT with that single action:
- force: subtle | controlled | aggressive | explosive
- material: fluid | elastic | rigid | mechanical | organic
- timing: smooth | staccato | irregular | repetitive
- deformation: none | scale | stretch | rotation | fragmentation
- direction: horizontal | vertical | radial | orbital | random
- motionBehavior: impact | breathing | accumulation | collision | tension | stretch | orbit | dissolve | reveal | oscillation
- primitives: float | wave | pulse | elastic | impact | material (material usually secondary)

==================================================
STEP 4 — motionSystem.animationRules (EXECUTABLE)
==================================================

{
  wordBehavior, glyphBehavior,
  scale, position, rotation, spacing, deformation,
  timing, intensityResponse
}

WORD movement is dominant. Glyph movement is subtle.
energyDistribution MUST be approximately: { word: 0.8, glyph: 0.15, camera: 0.05 }

GOOD scale: "0.85 resting scale, up to 1.15 during peaks"
GOOD timing: "slow buildup, sudden release"
BAD: "letters feel powerful and energetic"

Also fill motionConcept as a SHORT mirror of the executable rules (same idea, not a second concept).
cameraMovement default: "locked"

==================================================
STEP 5 — Audio mapping (evidence, not aesthetics)
==================================================

Energy → force magnitude
Transient sharpness → suddenness
Dynamics → contrast between rest and peak
Density → number of simultaneous behaviors
Stereo width → spatial spread
Tempo → timing (NOT automatic shaking)

High transient + high tension → sudden deformation events
High dynamics → large rest↔peak difference
Low density → isolated typography movement

Do NOT map: energy→red | sadness→blue | darkness→black

==================================================
STEP 6 — Color (readable type — not a scene)
==================================================

Ask: "What colors would allow this letterform to exist and remain readable?"

palette:
{
  background, textColor, strategy, lightBehavior, material, paletteReasoning
}

strategy: light-dark | dark-light | monochromatic | muted-contrast | complementary-surprise | faded-cinematic
lightBehavior: bright-natural | soft-diffused | muted-daylight | dramatic-shadows | artificial-stage | glowing-atmosphere | flat-graphic | faded-film

HUE RULE (critical):
Pick hue from the imagined visual environment (material + lightBehavior), NOT from emotionalTemperature alone.
- "hot" does NOT mean bronze / orange / heated metal text
- "darkness" does NOT mean near-black background
- stage lighting / artificial-stage → gel wash or graphic poster chroma (magenta, cyan, amber gel) — not oxidized bronze
- dramatic-shadows → cool shadow field when the environment is stage/architectural — not warm sepia metal
Emotional temperature may nudge saturation/contrast slightly, but must not choose the hue family.

CHROMA RULE (critical):
Avoiding clichés does NOT mean desaturating everything into muddy steel/slate.
- restless / surging + artificial-stage or stage lighting → prefer strategy complementary-surprise (not muted-contrast)
- Use real chromatic gel/teal/cyan/magenta fields — readable chroma, not oxidized-steel gray with a faint tint
- Desaturation is for faded-cinematic / soft atmospheres, not high-energy stage worlds
- Do NOT default material to "oxidized steel" as an excuse to mute color

VALUE / LIGHTNESS RULE (critical):
- Low spectral brightness does NOT mean a near-black UI background
- live_band + restless/surging → mid chromatic stage/poster field (roughly mid lightness), with complementary high-chroma text
- Do NOT pair saturated pink/magenta/cyan text with a near-black void — both sides of the pair should feel alive
- Near-black backgrounds only when emotional darkness is genuinely high or the world is synthetic/mechanical night

visualWorld is a supporting COLOR FIELD (not a room):
{ field, lighting, texture, material, description }

Avoid: default black background, neon cyber pairs, cinematic gradients, genre colors, bronze-on-black "heated metal" clichés, muddy desaturated charcoal-teal, pink-on-void.
The background supports the typography. It does not create a scene.
Do NOT justify colors from font rigidity/architecture.

==================================================
STEP 7 — composition (to reveal the physical behavior)
==================================================

{
  composition,   // layout name, e.g. center-column | left-rail | offset-column | edge-anchor | poster-stack
  negativeSpace, // 0–1
  alignment,     // left | center | right
  textDensity    // sparse | balanced | dense
}

Compression → tighter spacing, concentrated composition
Expansion → more negative space, wider placement
Dispersion → separated elements

Do NOT choose layouts from genre.
Spatial DNA hints AFTER physical identity:
stereoWidth < 0.1 → avoid center; prefer edge/left-rail; higher negativeSpace

==================================================
STEP 8 — rendererIdentity (FINAL EXECUTABLE OBJECT)
==================================================

{
  primaryMotion,
  secondaryMotion,
  wordMovement,
  glyphMovement,
  scaleBehavior,
  positionBehavior,
  rotationBehavior,
  spacingBehavior,
  deformationBehavior,
  backgroundColor,   // MUST == palette.background
  textColor,         // MUST == palette.textColor
  composition,       // MUST == composition.composition
  camera             // default "locked" unless movement is necessary
}

Camera brief:
{ movement: locked | slow-drift | orbit, zoomBehavior: none | slow-push | slow-pull | pulse }
Default camera to locked. The typography is the camera.

artisticIntent: ONE sentence of executable physical behavior (not mood).

visualLanguage: derive FROM typography body + action (geometry tokens only).

==================================================
SELF CHECK (required in reasoning.selfCheck)
==================================================

1. Would this still work if artist/title/genre were hidden?
2. Is the animation unique because of physical behavior, not color/style?
3. Could a developer implement this without guessing?
4. Did the font influence only geometry?
5. Did I avoid generic "cool visuals"?

If any answer is no — regenerate before returning.

==================================================
INPUTS
==================================================

songCharacter:
${JSON.stringify(audioFeatures.songCharacter, null, 2)}

Visual DNA:
${JSON.stringify(audioFeatures.visualDna, null, 2)}

Analysis signals (nuance — do not output raw):
${JSON.stringify(audioFeatures.analysisSignals, null, 2)}

Uniqueness:
${describeUniquenessVector(uniqueness)}

Secondary:
${JSON.stringify(
  {
    tempo: audioFeatures.tempo,
    energy: audioFeatures.energy,
    dynamics: audioFeatures.dynamics,
    brightness: audioFeatures.brightness,
    density: audioFeatures.density,
    emotionalVector: audioFeatures.emotionalVector,
  },
  null,
  2
)}

Return JSON only:

${REQUIRED_FORMAT_JSON}
`;
}

export async function generateCreativeDirectionFromGemini(
  audioFeatures: AudioFeatures,
  selectedFont: FontStylingContext
): Promise<CreativeDirection> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new CreativeDirectionPipelineError(
      "raw-gemini-response",
      ["GEMINI_API_KEY is not configured"]
    );
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = buildPrompt(audioFeatures, selectedFont);

  console.group("[CreativeDirector] Prompt");
  console.log(prompt);
  console.groupEnd();

  console.group("[CreativeDirector] Request");
  console.log({
    audioFeatures,
    selectedFont,
    prompt,
  });
  console.groupEnd();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return processGeminiCreativeDirection(text);
  } catch (error) {
    if (error instanceof CreativeDirectionPipelineError) {
      console.error("[CreativeDirector] Pipeline failure", {
        stage: error.stage,
        validationErrors: error.validationErrors,
        message: error.message,
      });
      throw error;
    }

    console.error("[CreativeDirector] Gemini request failed", error);
    throw error;
  }
}
