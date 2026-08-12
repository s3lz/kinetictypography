// src/lib/songUniquenessVector.ts
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function bucket(value, steps = 10) {
  return Math.round(clamp01(value) * steps);
}
function computeSongUniquenessVector(audioFeatures) {
  const { analysisSignals, emotionalVector, brightness, density } = audioFeatures;
  const vector = {
    stereoWidth: analysisSignals.stereoWidth,
    brightness,
    silenceRatio: analysisSignals.silenceRatio,
    density,
    harmonicStability: analysisSignals.harmonicStability,
    repetitionScore: analysisSignals.repetitionScore,
    focalStability: analysisSignals.focalStability,
    organic: emotionalVector.organic,
    differentiationKey: ""
  };
  vector.differentiationKey = [
    bucket(vector.stereoWidth, 8),
    bucket(vector.brightness, 8),
    bucket(vector.silenceRatio, 8),
    bucket(vector.density, 8),
    bucket(vector.harmonicStability, 8),
    bucket(vector.repetitionScore, 8),
    bucket(vector.focalStability, 8),
    bucket(vector.organic, 8)
  ].join(":");
  return vector;
}
function describeUniquenessVector(vector) {
  return [
    `stereoWidth=${vector.stereoWidth.toFixed(2)}`,
    `brightness=${vector.brightness.toFixed(2)}`,
    `silenceRatio=${vector.silenceRatio.toFixed(2)}`,
    `density=${vector.density.toFixed(2)}`,
    `harmonicStability=${vector.harmonicStability.toFixed(2)}`,
    `repetitionScore=${vector.repetitionScore.toFixed(2)}`,
    `focalStability=${vector.focalStability.toFixed(2)}`,
    `organic=${vector.organic.toFixed(2)}`,
    `key=${vector.differentiationKey}`
  ].join(", ");
}

// src/types/motionLanguage.ts
var MOTION_FORCES = [
  "subtle",
  "controlled",
  "aggressive",
  "explosive"
];
var MOTION_MATERIALS = [
  "fluid",
  "elastic",
  "rigid",
  "mechanical",
  "organic"
];
var MOTION_TIMINGS = [
  "smooth",
  "staccato",
  "irregular",
  "repetitive"
];
var MOTION_DEFORMATIONS = [
  "none",
  "scale",
  "stretch",
  "rotation",
  "fragmentation"
];
var MOTION_DIRECTIONS = [
  "horizontal",
  "vertical",
  "radial",
  "orbital",
  "random"
];

// src/types/motionBehavior.ts
var MOTION_BEHAVIORS = [
  "impact",
  "breathing",
  "accumulation",
  "collision",
  "tension",
  "stretch",
  "orbit",
  "dissolve",
  "reveal",
  "oscillation"
];

// src/types/palette.ts
var LIGHT_BEHAVIORS = [
  "bright-natural",
  "soft-diffused",
  "muted-daylight",
  "dramatic-shadows",
  "artificial-stage",
  "glowing-atmosphere",
  "flat-graphic",
  "faded-film"
];
var PALETTE_STRATEGIES = [
  "light-dark",
  "dark-light",
  "monochromatic",
  "muted-contrast",
  "complementary-surprise",
  "faded-cinematic"
];

// src/types/creativeInterpretation.ts
var DEFAULT_ENERGY_DISTRIBUTION = {
  word: 0.8,
  glyph: 0.15,
  camera: 0.05
};
function normalizeEnergyDistribution(value) {
  const word = clamp012(value?.word ?? DEFAULT_ENERGY_DISTRIBUTION.word);
  const glyph = clamp012(value?.glyph ?? DEFAULT_ENERGY_DISTRIBUTION.glyph);
  const camera = clamp012(value?.camera ?? DEFAULT_ENERGY_DISTRIBUTION.camera);
  const sum = word + glyph + camera;
  if (sum <= 1e-3) return { ...DEFAULT_ENERGY_DISTRIBUTION };
  return {
    word: word / sum,
    glyph: glyph / sum,
    camera: camera / sum
  };
}
function clamp012(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

// src/types/background.ts
var DEFAULT_BACKGROUND_STATE = {
  mode: "AI_COLOR",
  uploadedImage: null
};

// src/types/motionGrammar.ts
var DEFAULT_MOTION_GRAMMAR = {
  grouping: "word",
  entrancePattern: "cascade",
  idlePattern: "drift",
  transitionPattern: "stretch",
  exitPattern: "fade",
  spatialDistribution: "linear",
  timingModel: "continuous",
  emphasis: "center"
};

// src/types/motionPersonality.ts
var DEFAULT_MOTION_PERSONALITY = "physical";

// src/types/physicalIdentity.ts
var DEFAULT_PHYSICAL_MODEL = {
  material: "elastic",
  deformation: "stretch",
  forceDirection: "horizontal",
  recovery: "settle",
  resistance: 0.45,
  elasticity: 0.55,
  fragmentation: 0.15,
  tension: 0.4
};
var DEFAULT_TYPOGRAPHY_BEHAVIOR = {
  wordBehavior: "expand",
  glyphBehavior: "stable",
  spacingBehavior: "compress",
  silhouetteBehavior: "preserve"
};
var DEFAULT_FONT_PHYSICS = {
  maxStretch: 0.18,
  maxRotation: 4,
  compressionTolerance: 0.15,
  fragmentationTolerance: 0.35,
  silhouetteStrength: 0.7
};

// src/types/CreativeState.ts
var MOTION_DIMENSIONS = [
  "float",
  "wave",
  "pulse",
  "elastic",
  "impact",
  "material"
];
var DEFAULT_MOTION_LEVELS = {
  float: 62,
  wave: 0,
  pulse: 28,
  elastic: 0,
  impact: 0,
  material: 14
};
var defaultCreativeState = {
  font: "ballet",
  fontRecommendation: {
    primary: "ballet",
    confidence: 0,
    alternatives: [],
    reasoning: ""
  },
  visualLanguage: {
    geometry: "organic",
    composition: "expanded",
    spacing: "loose",
    symmetry: "asymmetric",
    edgeTreatment: "soft",
    motionCharacter: "floating",
    depth: "layered",
    texture: "smooth"
  },
  artisticIntent: "Word compresses to 0.9 at rest, expands to 1.12 on crests, tracking opens then recovers in 700ms.",
  physicalInterpretation: {
    phenomenon: "slow expansion and collapse of a single word mass",
    forces: "outward breath opposed by soft return",
    restState: "word at resting scale 1.0 with tight tracking",
    disruption: "scale rises to ~1.12 and tracking opens during crests",
    recovery: "scale and tracking ease back over 600\u2013900ms"
  },
  typographyIdentity: {
    weight: "airy",
    rigidity: "low",
    flexibility: "high \u2014 gentle bend and breath",
    edgeBehavior: "soft edges allowed",
    spacingBehavior: "tracking breathes with scale",
    silhouetteBehavior: "soft outline holds",
    deformationTolerance: "scale \xB112%; avoid fragmentation",
    metaphor: "breathing word mass",
    behavior: "slow expand/contract as one object"
  },
  atmosphere: {
    description: "slow expansion with soft recovery",
    emotionalTemperature: "warm openness with soft edges",
    tension: 0.35,
    intimacy: 0.6,
    movement: 0.4,
    complexity: 0.35,
    humanQuality: 0.55
  },
  visualWorld: {
    field: "soft low-contrast wash",
    lighting: "muted-daylight",
    texture: "soft fiber",
    material: "paper",
    description: "Readable field for type: soft low-contrast wash. Not a scene."
  },
  typographyConcept: {
    metaphor: "breathing word mass",
    behavior: "slow expand/contract as one object"
  },
  motionSystem: {
    motionAction: {
      primaryAction: "expansion",
      secondaryConsequence: "soft collapse back to rest scale",
      explanation: "scale rises to ~1.12 and tracking opens during crests"
    },
    animationRules: {
      wordBehavior: "word compresses on tension, expands on release",
      glyphBehavior: "almost none \u2014 life <1px",
      scale: "0.85 resting during tension; up to 1.15 on release",
      position: "slight vertical settle on release (2\u20134px)",
      rotation: "0\u20131\xB0",
      spacing: "tracking increases during expansion; returns during recovery",
      deformation: "uniform scale; deformationTolerance low for glyphs",
      timing: "slow buildup, sudden release",
      intensityResponse: "higher intensity deepens rest\u2194peak scale contrast"
    },
    motionConcept: {
      metaphor: "expansion: scale rises to ~1.12 and tracking opens during crests",
      primaryMotion: "expansion",
      secondaryMotion: "soft collapse back to rest scale",
      intensityBehavior: "higher intensity deepens rest\u2194peak scale contrast",
      wordMovement: "word compresses on tension, expands on release",
      glyphMovement: "almost none \u2014 life <1px",
      cameraMovement: "locked"
    },
    motionLanguage: {
      force: "subtle",
      material: "fluid",
      timing: "smooth",
      deformation: "scale",
      direction: "vertical"
    },
    motionBehavior: {
      primary: "breathing",
      secondary: "reveal"
    },
    primaryPrimitive: "pulse",
    secondaryPrimitive: "float"
  },
  animationArc: {
    entrance: "word at resting scale 1.0 with tight tracking",
    development: "scale rises to ~1.12 and tracking opens during crests",
    peak: "maximum outward breath opposed by soft return",
    resolution: "scale and tracking ease back over 600\u2013900ms"
  },
  fontTreatment: {
    role: "font body: airy, low rigidity",
    deformation: "scale \xB112%; avoid fragmentation",
    spacing: "tracking breathes with scale",
    contrast: "soft outline holds",
    rigidity: "low",
    spacingBehavior: "tracking breathes with scale",
    edgeBehavior: "soft edges allowed",
    silhouettePreservation: "soft outline holds",
    flexibility: "high \u2014 gentle bend and breath",
    deformationTolerance: "scale \xB112%; avoid fragmentation"
  },
  energyDistribution: { ...DEFAULT_ENERGY_DISTRIBUTION },
  rendererIdentity: {
    primaryMotion: "expansion",
    secondaryMotion: "soft collapse back to rest scale",
    wordMovement: "word compresses on tension, expands on release",
    glyphMovement: "almost none \u2014 life <1px",
    scaleBehavior: "0.85 resting during tension; up to 1.15 on release",
    positionBehavior: "slight vertical settle on release (2\u20134px)",
    rotationBehavior: "0\u20131\xB0",
    spacingBehavior: "tracking increases during expansion; returns during recovery",
    deformationBehavior: "uniform scale; deformationTolerance low for glyphs",
    backgroundColor: "#f4f0e8",
    textColor: "#2a3d4f",
    composition: "center-column",
    camera: "locked"
  },
  reasoning: {
    creativeTranslation: "Forces: breath vs return. Action: expansion \u2192 soft collapse. Executable rest/disrupt/recover on the word.",
    whyThisSongNotAnother: "Expansion/contraction word physics \u2014 not genre floating or pulse defaults.",
    hiddenIdentityCheck: "Yes \u2014 driven by executable letter physics rather than genre labels.",
    selfCheck: {
      hiddenIdentity: true,
      uniquePhysicalBehavior: true,
      developerImplementable: true,
      fontGeometryOnly: true,
      avoidedGenericVisuals: true
    }
  },
  descriptors: ["sparse", "elastic", "layered"],
  layout: {
    composition: "center-column",
    alignment: "center",
    negativeSpace: 0.72,
    textDensity: "sparse",
    maxTextWidth: 0.62,
    marginX: 0.12,
    marginY: 0.14,
    anchorX: 0.5,
    anchorY: 0.46,
    lineHeight: 1.28,
    scaleProgression: "uniform"
  },
  typography: {
    tracking: 0.8,
    kerningBias: 0.6,
    lineHeight: 1.28,
    scaleCurve: 1,
    rotationAllowance: 2,
    opacityBehavior: "constant",
    weightBehavior: "constant",
    scaleBehavior: "uniform",
    fontWeight: 300,
    fontSize: 56
  },
  motionLanguage: {
    force: "subtle",
    material: "fluid",
    timing: "smooth",
    deformation: "none",
    direction: "orbital"
  },
  motionBehavior: {
    primary: "breathing",
    secondary: "orbit"
  },
  camera: {
    movement: "locked",
    zoomBehavior: "none",
    zoomScale: 1,
    driftAmplitude: 0,
    intensity: 0
  },
  fontWeight: 300,
  fontSize: 56,
  tracking: 0,
  kerning: 0,
  palette: {
    background: "#f4f0e8",
    textColor: "#2a3d4f",
    strategy: "light-dark",
    material: "paper texture",
    lightBehavior: "soft-diffused",
    paletteReasoning: "Paper texture under soft diffused light \u2014 light field with dark typography, not warmth\u2192beige mapping. Font had zero influence on palette."
  },
  background: { ...DEFAULT_BACKGROUND_STATE },
  motionProfile: {
    primary: "float",
    secondary: ["pulse"]
  },
  motion: { ...DEFAULT_MOTION_LEVELS },
  motionParams: {},
  physicalModel: { ...DEFAULT_PHYSICAL_MODEL },
  typographyBehavior: { ...DEFAULT_TYPOGRAPHY_BEHAVIOR },
  fontPhysics: { ...DEFAULT_FONT_PHYSICS },
  motionGrammar: { ...DEFAULT_MOTION_GRAMMAR },
  motionPersonality: DEFAULT_MOTION_PERSONALITY,
  animationSpeed: 1,
  text: "your motion typography"
};

// src/lib/normalizeCreativeDirection.ts
function pickString(source, ...keys) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return void 0;
}
function clamp013(value) {
  return Math.min(1, Math.max(0, value));
}
function normalizeNumber(value, fallback) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
function normalizeAlignment(value) {
  if (typeof value !== "string") return "center";
  const key = value.toLowerCase();
  if (key.includes("left")) return "left";
  if (key.includes("right")) return "right";
  return "center";
}
function normalizeDensity(value) {
  if (typeof value !== "string") return "balanced";
  const key = value.toLowerCase();
  if (key.includes("sparse")) return "sparse";
  if (key.includes("dense")) return "dense";
  return "balanced";
}
function normalizeCameraMovement(value) {
  if (typeof value !== "string") return "locked";
  const key = value.toLowerCase();
  if (key.includes("orbit")) return "orbit";
  if (key.includes("drift")) return "slow-drift";
  return "locked";
}
function normalizeZoomBehavior(value) {
  if (typeof value !== "string") return "none";
  const key = value.toLowerCase();
  if (key.includes("pull")) return "slow-pull";
  if (key.includes("push")) return "slow-push";
  if (key.includes("pulse")) return "pulse";
  return "none";
}
function normalizeVisualLanguage(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const geometry = pickString(source, "geometry");
  const composition = pickString(source, "composition");
  const spacing = pickString(source, "spacing");
  const symmetry = pickString(source, "symmetry");
  const edgeTreatment = pickString(source, "edgeTreatment", "edge_treatment");
  const motionCharacter = pickString(source, "motionCharacter", "motion_character");
  const depth = pickString(source, "depth");
  const texture = pickString(source, "texture");
  if (!geometry || !composition || !spacing || !symmetry || !edgeTreatment || !motionCharacter || !depth || !texture) {
    return null;
  }
  return {
    geometry,
    composition,
    spacing,
    symmetry,
    edgeTreatment,
    motionCharacter,
    depth,
    texture
  };
}
function normalizeComposition(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const composition = pickString(source, "composition");
  if (!composition) return null;
  let negativeSpace = normalizeNumber(source.negativeSpace ?? source.negative_space, 0.6);
  if (negativeSpace > 1 && negativeSpace <= 100) negativeSpace /= 100;
  negativeSpace = clamp013(negativeSpace);
  return {
    composition,
    negativeSpace,
    alignment: normalizeAlignment(source.alignment),
    textDensity: normalizeDensity(source.textDensity ?? source.text_density)
  };
}
function normalizeEnum(value, allowed) {
  if (typeof value !== "string") return null;
  const key = value.toLowerCase().trim();
  return allowed.find((option) => option === key) ?? null;
}
function normalizeMotionForce(value) {
  const direct = normalizeEnum(value, MOTION_FORCES);
  if (direct) return direct;
  if (typeof value !== "string") return "controlled";
  const key = value.toLowerCase();
  if (key.includes("explosive") || key.includes("extreme")) return "explosive";
  if (key.includes("aggressive") || key.includes("strong") || key.includes("heavy")) {
    return "aggressive";
  }
  if (key.includes("subtle") || key.includes("gentle") || key.includes("soft") || key.includes("low")) {
    return "subtle";
  }
  return "controlled";
}
function normalizeMotionMaterial(value) {
  const direct = normalizeEnum(value, MOTION_MATERIALS);
  if (direct) return direct;
  if (typeof value !== "string") return "rigid";
  const key = value.toLowerCase();
  if (key.includes("kinetic") || key.includes("elastic")) return "elastic";
  if (key.includes("float") || key.includes("fluid") || key.includes("drift")) return "fluid";
  if (key.includes("organic") || key.includes("human") || key.includes("live")) return "organic";
  if (key.includes("mechanical") || key.includes("digital") || key.includes("robot")) {
    return "mechanical";
  }
  if (key.includes("rigid") || key.includes("solid") || key.includes("locked")) return "rigid";
  return "rigid";
}
function normalizeMotionTiming(value) {
  const direct = normalizeEnum(value, MOTION_TIMINGS);
  if (direct) return direct;
  if (typeof value !== "string") return "smooth";
  const key = value.toLowerCase();
  if (key.includes("staccato") || key.includes("burst") || key.includes("snap")) return "staccato";
  if (key.includes("irregular") || key.includes("chaotic") || key.includes("syncop")) {
    return "irregular";
  }
  if (key.includes("repetitive") || key.includes("grid") || key.includes("loop")) {
    return "repetitive";
  }
  return "smooth";
}
function normalizeMotionDeformation(value) {
  const direct = normalizeEnum(value, MOTION_DEFORMATIONS);
  if (direct) return direct;
  if (typeof value !== "string") return "none";
  const key = value.toLowerCase();
  if (key.includes("fragment") || key.includes("glitch") || key.includes("shatter")) {
    return "fragmentation";
  }
  if (key.includes("stretch") || key.includes("warp")) return "stretch";
  if (key.includes("scale") || key.includes("pulse") || key.includes("bounce")) return "scale";
  if (key.includes("rotation") || key.includes("rotate") || key.includes("spin")) {
    return "rotation";
  }
  return "none";
}
function normalizeMotionDirection(value) {
  const direct = normalizeEnum(value, MOTION_DIRECTIONS);
  if (direct) return direct;
  if (typeof value !== "string") return "horizontal";
  const key = value.toLowerCase();
  if (key.includes("horizontal") || key.includes("tear") || key.includes("left") || key.includes("right") || key.includes("slide")) {
    return "horizontal";
  }
  if (key.includes("vertical") || key.includes("rise") || key.includes("drop") || key.includes("up")) {
    return "vertical";
  }
  if (key.includes("radial") || key.includes("scatter") || key.includes("burst") || key.includes("explode")) {
    return "radial";
  }
  if (key.includes("orbital") || key.includes("drift") || key.includes("circular") || key.includes("orbit")) {
    return "orbital";
  }
  if (key.includes("random") || key.includes("chaos")) return "random";
  return "horizontal";
}
function normalizeMotionLanguageFromLegacy(source) {
  const combined = [
    pickString(source, "entrance"),
    pickString(source, "idle"),
    pickString(source, "transition"),
    pickString(source, "exit")
  ].filter(Boolean).join(" ").toLowerCase();
  if (!combined) return null;
  return {
    force: normalizeMotionForce(combined),
    material: normalizeMotionMaterial(combined),
    timing: normalizeMotionTiming(combined),
    deformation: normalizeMotionDeformation(combined),
    direction: normalizeMotionDirection(combined)
  };
}
function normalizeMotionLanguage(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  if (pickString(source, "entrance") || pickString(source, "idle") || pickString(source, "transition") || pickString(source, "exit")) {
    return normalizeMotionLanguageFromLegacy(source);
  }
  const force = normalizeMotionForce(source.force);
  const material = normalizeMotionMaterial(source.material);
  const timing = normalizeMotionTiming(source.timing);
  const deformation = normalizeMotionDeformation(source.deformation);
  const direction = normalizeMotionDirection(source.direction);
  return { force, material, timing, deformation, direction };
}
function normalizeMotionBehavior(value, motionLanguage) {
  if (value && typeof value === "object") {
    const source = value;
    const primaryRaw = pickString(source, "primary");
    const secondaryRaw = pickString(source, "secondary");
    const primary = MOTION_BEHAVIORS.find((b) => b === primaryRaw?.toLowerCase());
    const secondary = MOTION_BEHAVIORS.find((b) => b === secondaryRaw?.toLowerCase());
    if (primary) {
      return { primary, ...secondary ? { secondary } : {} };
    }
  }
  if (motionLanguage.deformation === "fragmentation") {
    return { primary: "collision", secondary: "impact" };
  }
  if (motionLanguage.timing === "staccato") {
    return { primary: "impact" };
  }
  if (motionLanguage.material === "fluid") {
    return { primary: "breathing", secondary: "dissolve" };
  }
  if (motionLanguage.material === "elastic") {
    return { primary: "stretch", secondary: "tension" };
  }
  if (motionLanguage.timing === "repetitive") {
    return { primary: "oscillation" };
  }
  return { primary: "breathing" };
}
function normalizeCamera(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  return {
    movement: normalizeCameraMovement(source.movement),
    zoomBehavior: normalizeZoomBehavior(
      source.zoomBehavior ?? source.zoom_behavior
    )
  };
}
var LEGACY_LIGHT_BEHAVIOR = {
  "soft-haze": "soft-diffused",
  "bright-daylight": "bright-natural",
  "deep-shadow": "dramatic-shadows",
  "dramatic-contrast": "dramatic-shadows",
  "artificial-glow": "glowing-atmosphere",
  muted: "muted-daylight",
  luminous: "glowing-atmosphere"
};
var LEGACY_PALETTE_STRATEGY = {
  atmospheric: "light-dark",
  editorial: "muted-contrast",
  "high-contrast": "muted-contrast",
  "vibrant-editorial": "complementary-surprise",
  "pastel-contrast": "muted-contrast",
  "atmospheric-gradient": "faded-cinematic",
  minimal: "monochromatic",
  analogous: "muted-contrast",
  complementary: "complementary-surprise"
};
function normalizeLightBehavior(value) {
  if (typeof value !== "string") return "soft-diffused";
  const key = value.toLowerCase().trim().replace(/\s+/g, "-");
  if (LEGACY_LIGHT_BEHAVIOR[key]) return LEGACY_LIGHT_BEHAVIOR[key];
  return LIGHT_BEHAVIORS.find(
    (behavior) => key === behavior || key.includes(behavior.replace(/-/g, ""))
  ) ?? "soft-diffused";
}
function normalizePaletteStrategy(value) {
  if (typeof value !== "string") return "light-dark";
  const key = value.toLowerCase().trim().replace(/\s+/g, "-");
  if (LEGACY_PALETTE_STRATEGY[key]) return LEGACY_PALETTE_STRATEGY[key];
  return PALETTE_STRATEGIES.find(
    (strategy) => key === strategy || key.includes(strategy.replace(/-/g, ""))
  ) ?? "light-dark";
}
function normalizePalette(value) {
  if (!value || typeof value !== "object") return null;
  const palette = value;
  if (typeof palette.background !== "string") {
    return null;
  }
  const textColor = typeof palette.textColor === "string" ? palette.textColor : typeof palette.text_color === "string" ? palette.text_color : typeof palette.primary === "string" ? palette.primary : null;
  if (!textColor) {
    return null;
  }
  return {
    background: palette.background,
    textColor,
    strategy: normalizePaletteStrategy(palette.strategy),
    material: typeof palette.material === "string" && palette.material.trim() ? palette.material.trim() : "matte surface",
    lightBehavior: normalizeLightBehavior(palette.lightBehavior ?? palette.light_behavior),
    paletteReasoning: typeof palette.paletteReasoning === "string" ? palette.paletteReasoning.trim() : typeof palette.palette_reasoning === "string" ? palette.palette_reasoning.trim() : ""
  };
}
function normalizeSpecificityReasoning(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const why = typeof source.whyThisSongNotAnother === "string" ? source.whyThisSongNotAnother.trim() : typeof source.why_this_song_not_another === "string" ? source.why_this_song_not_another.trim() : "";
  if (!why) return null;
  return { whyThisSongNotAnother: why };
}
function normalizeAtmosphere(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const description = pickString(source, "description", "summary");
  const emotionalTemperature = pickString(
    source,
    "emotionalTemperature",
    "emotional_temperature",
    "temperature"
  );
  if (!description || !emotionalTemperature) return null;
  return {
    description,
    emotionalTemperature,
    tension: clamp013(normalizeNumber(source.tension, 0.5)),
    intimacy: clamp013(normalizeNumber(source.intimacy, 0.5)),
    movement: clamp013(normalizeNumber(source.movement, 0.5)),
    complexity: clamp013(normalizeNumber(source.complexity, 0.5)),
    humanQuality: clamp013(
      normalizeNumber(source.humanQuality ?? source.human_quality, 0.5)
    )
  };
}
function normalizeVisualWorld(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const field = pickString(source, "field", "environment", "world", "place");
  const lighting = pickString(source, "lighting", "light");
  const texture = pickString(source, "texture");
  const material = pickString(source, "material") ?? texture ?? field;
  const description = pickString(source, "description") ?? (field ? `Color field: ${field}` : void 0);
  if (!field || !lighting || !texture || !material || !description) return null;
  return { field, lighting, texture, material, description };
}
function normalizePhysicalInterpretation(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const phenomenon = pickString(source, "phenomenon", "physical", "interpretation");
  const forces = pickString(source, "forces", "force") ?? "opposing physical forces";
  if (!phenomenon) return null;
  return {
    phenomenon,
    forces,
    restState: pickString(source, "restState", "rest_state", "rest") ?? "word held as one cohesive mass at resting scale",
    disruption: pickString(source, "disruption", "peak", "event") ?? "peak force deforms the word mass",
    recovery: pickString(source, "recovery", "return") ?? "returns to rest with damping"
  };
}
function normalizeTypographyIdentity(value, fallbackConcept) {
  const source = value && typeof value === "object" ? value : {};
  return {
    weight: pickString(source, "weight") ?? "dense",
    rigidity: pickString(source, "rigidity") ?? "medium",
    flexibility: pickString(source, "flexibility") ?? "medium",
    edgeBehavior: pickString(source, "edgeBehavior", "edge_behavior") ?? "stable edges",
    spacingBehavior: pickString(source, "spacingBehavior", "spacing_behavior") ?? "spacing follows word scale",
    silhouetteBehavior: pickString(source, "silhouetteBehavior", "silhouette_behavior", "silhouettePreservation") ?? "preserve word silhouette",
    deformationTolerance: pickString(source, "deformationTolerance", "deformation_tolerance") ?? "word \xB115%; glyph life subtle",
    metaphor: pickString(source, "metaphor") ?? fallbackConcept.metaphor,
    behavior: pickString(source, "behavior") ?? fallbackConcept.behavior,
    movementPersonality: pickString(source, "movementPersonality", "movement_personality"),
    physicalMaterial: pickString(source, "physicalMaterial", "physical_material", "material"),
    structuralBehavior: pickString(source, "structuralBehavior", "structural_behavior")
  };
}
function normalizeTypographyConcept(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const metaphor = pickString(source, "metaphor", "concept", "identity");
  const behavior = pickString(source, "behavior", "motion", "action");
  if (!metaphor || !behavior) return null;
  return { metaphor, behavior };
}
function normalizeMotionAction(value, fallbackPrimary, fallbackSecondary) {
  const source = value && typeof value === "object" ? value : {};
  return {
    primaryAction: pickString(source, "primaryAction", "primary_action", "primary") ?? fallbackPrimary,
    secondaryConsequence: pickString(source, "secondaryConsequence", "secondary_consequence", "secondary") ?? fallbackSecondary,
    explanation: pickString(source, "explanation") ?? `${fallbackPrimary} with consequence ${fallbackSecondary}`
  };
}
function normalizeAnimationRules(value, wordFallback, glyphFallback) {
  const source = value && typeof value === "object" ? value : {};
  return {
    wordBehavior: pickString(source, "wordBehavior", "word_behavior") ?? wordFallback,
    glyphBehavior: pickString(source, "glyphBehavior", "glyph_behavior") ?? glyphFallback,
    scale: pickString(source, "scale") ?? "rest ~1.0; peaks \xB110\u201315%",
    position: pickString(source, "position") ?? "word-level translation preferred",
    rotation: pickString(source, "rotation") ?? "\u22642\xB0",
    spacing: pickString(source, "spacing") ?? "follows word scale",
    deformation: pickString(source, "deformation") ?? "word-dominant deformation",
    timing: pickString(source, "timing") ?? "attack on peaks; damped recovery",
    intensityResponse: pickString(source, "intensityResponse", "intensity_response") ?? "higher intensity increases word displacement/spring \u2014 glyph stays nearly constant"
  };
}
function normalizeMotionConcept(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const metaphor = pickString(source, "metaphor");
  const primaryMotion = pickString(source, "primaryMotion", "primary_motion", "primary");
  const secondaryMotion = pickString(source, "secondaryMotion", "secondary_motion", "secondary") ?? "release";
  const intensityBehavior = pickString(source, "intensityBehavior", "intensity_behavior") ?? "Higher intensity increases word displacement and rebound; glyph motion stays nearly constant.";
  if (!metaphor || !primaryMotion) return null;
  return {
    metaphor,
    primaryMotion,
    secondaryMotion,
    intensityBehavior,
    wordMovement: pickString(source, "wordMovement", "word_movement") ?? "Word acts as one physical object under the primary action.",
    glyphMovement: pickString(source, "glyphMovement", "glyph_movement") ?? "Subtle life only \u2014 no competing locomotion.",
    cameraMovement: pickString(source, "cameraMovement", "camera_movement") ?? "locked",
    primaryAction: pickString(source, "primaryAction", "primary_action"),
    secondaryConsequence: pickString(
      source,
      "secondaryConsequence",
      "secondary_consequence"
    )
  };
}
function normalizePrimitive(value) {
  if (typeof value !== "string") return void 0;
  const key = value.toLowerCase().trim();
  return MOTION_DIMENSIONS.find((dim) => dim === key);
}
function normalizeMotionSystem(value, fallbackLanguage, fallbackBehavior) {
  const source = value && typeof value === "object" ? value : {};
  const motionLanguage = normalizeMotionLanguage(source.motionLanguage ?? source.motion_language) ?? fallbackLanguage;
  const motionBehavior = normalizeMotionBehavior(
    source.motionBehavior ?? source.motion_behavior,
    motionLanguage
  );
  const motionConcept = normalizeMotionConcept(source.motionConcept ?? source.motion_concept) ?? {
    metaphor: `The text performs ${motionBehavior.primary} as a single word object.`,
    primaryMotion: motionBehavior.primary,
    secondaryMotion: motionBehavior.secondary ?? "release",
    intensityBehavior: "Higher intensity increases word displacement, scale anticipation, and rebound \u2014 glyph motion stays nearly constant.",
    wordMovement: "Word acts as one physical object under the primary action.",
    glyphMovement: "Subtle life only \u2014 no competing locomotion.",
    cameraMovement: "locked"
  };
  const motionAction = normalizeMotionAction(
    source.motionAction ?? source.motion_action,
    motionConcept.primaryAction || motionConcept.primaryMotion,
    motionConcept.secondaryConsequence || motionConcept.secondaryMotion
  );
  const animationRules = normalizeAnimationRules(
    source.animationRules ?? source.animation_rules,
    motionConcept.wordMovement,
    motionConcept.glyphMovement
  );
  return {
    motionAction,
    animationRules,
    motionConcept: {
      ...motionConcept,
      primaryMotion: motionAction.primaryAction,
      secondaryMotion: motionAction.secondaryConsequence,
      primaryAction: motionAction.primaryAction,
      secondaryConsequence: motionAction.secondaryConsequence
    },
    motionLanguage,
    motionBehavior: motionBehavior.primary ? motionBehavior : fallbackBehavior,
    primaryPrimitive: normalizePrimitive(
      source.primaryPrimitive ?? source.primary_primitive
    ),
    secondaryPrimitive: normalizePrimitive(
      source.secondaryPrimitive ?? source.secondary_primitive
    )
  };
}
function normalizeAnimationArc(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const entrance = pickString(source, "entrance");
  const development = pickString(source, "development", "body");
  const peak = pickString(source, "peak", "climax");
  const resolution = pickString(source, "resolution", "exit", "settle");
  if (!entrance || !development || !peak || !resolution) return null;
  return { entrance, development, peak, resolution };
}
function normalizeFontTreatment(value) {
  if (!value || typeof value !== "object") return null;
  const source = value;
  const role = pickString(source, "role", "materialRole", "material_role");
  const deformation = pickString(source, "deformation");
  const spacing = pickString(source, "spacing");
  const contrast = pickString(source, "contrast");
  if (!role || !deformation || !spacing || !contrast) return null;
  return {
    role,
    deformation,
    spacing,
    contrast,
    rigidity: pickString(source, "rigidity") ?? "medium",
    spacingBehavior: pickString(source, "spacingBehavior", "spacing_behavior") ?? "compress or expand with word scale",
    edgeBehavior: pickString(source, "edgeBehavior", "edge_behavior") ?? "keep edges stable",
    silhouettePreservation: pickString(source, "silhouettePreservation", "silhouette_preservation") ?? "preserve silhouette as the object moves",
    flexibility: pickString(source, "flexibility"),
    deformationTolerance: pickString(
      source,
      "deformationTolerance",
      "deformation_tolerance"
    )
  };
}
function normalizeRendererIdentity(value, motionConcept, animationRules, composition, backgroundColor, textColor, cameraMovement) {
  const source = value && typeof value === "object" ? value : {};
  return {
    primaryMotion: pickString(source, "primaryMotion", "primary_motion") ?? motionConcept.primaryMotion,
    secondaryMotion: pickString(source, "secondaryMotion", "secondary_motion") ?? motionConcept.secondaryMotion,
    wordMovement: pickString(source, "wordMovement", "word_movement") ?? motionConcept.wordMovement,
    glyphMovement: pickString(source, "glyphMovement", "glyph_movement") ?? motionConcept.glyphMovement,
    scaleBehavior: pickString(source, "scaleBehavior", "scale_behavior") ?? animationRules.scale,
    positionBehavior: pickString(source, "positionBehavior", "position_behavior") ?? animationRules.position,
    rotationBehavior: pickString(source, "rotationBehavior", "rotation_behavior") ?? animationRules.rotation,
    spacingBehavior: pickString(source, "spacingBehavior", "spacing_behavior") ?? animationRules.spacing,
    deformationBehavior: pickString(source, "deformationBehavior", "deformation_behavior") ?? animationRules.deformation,
    backgroundColor: pickString(source, "backgroundColor", "background_color") ?? backgroundColor,
    textColor: pickString(source, "textColor", "text_color") ?? textColor,
    composition: pickString(source, "composition") ?? composition,
    camera: pickString(source, "camera", "cameraMovement", "camera_movement") ?? cameraMovement,
    motionIntensityBehavior: pickString(source, "motionIntensityBehavior", "motion_intensity_behavior") ?? motionConcept.intensityBehavior,
    cameraMovement: pickString(source, "cameraMovement", "camera_movement") ?? cameraMovement
  };
}
function normalizeReasoning(value, artisticIntent, specificity) {
  const source = value && typeof value === "object" ? value : {};
  const why = pickString(source, "whyThisSongNotAnother", "why_this_song_not_another") ?? specificity?.whyThisSongNotAnother ?? artisticIntent;
  return {
    creativeTranslation: pickString(source, "creativeTranslation", "creative_translation") ?? artisticIntent,
    whyThisSongNotAnother: why,
    hiddenIdentityCheck: pickString(source, "hiddenIdentityCheck", "hidden_identity_check") ?? "Direction is based on physical letter behavior and material color, not title, artist, or genre scenery."
  };
}
function normalizeEnergyDist(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ENERGY_DISTRIBUTION };
  }
  const source = value;
  return normalizeEnergyDistribution({
    word: normalizeNumber(source.word, DEFAULT_ENERGY_DISTRIBUTION.word),
    glyph: normalizeNumber(source.glyph, DEFAULT_ENERGY_DISTRIBUTION.glyph),
    camera: normalizeNumber(source.camera, DEFAULT_ENERGY_DISTRIBUTION.camera)
  });
}
function unwrapCreativeDirection(value) {
  if (!value || typeof value !== "object") return null;
  const record = value;
  const nested = record.creativeDirection ?? record.designBrief ?? record.design_brief ?? record.direction ?? record.result;
  if (nested && typeof nested === "object") {
    return nested;
  }
  return record;
}
function normalizeCreativeDirection(value) {
  const unwrapped = unwrapCreativeDirection(value);
  if (!unwrapped) return null;
  const direction = { ...unwrapped };
  delete direction.fontRecommendation;
  delete direction.font;
  delete direction.selectedFont;
  delete direction.error;
  delete direction.stage;
  delete direction.validationErrors;
  const motionSystemSource = direction.motionSystem ?? direction.motion_system ?? {};
  const motionLanguage = normalizeMotionLanguage(
    motionSystemSource.motionLanguage ?? motionSystemSource.motion_language ?? direction.motionLanguage ?? direction.motion_language
  ) ?? null;
  if (!motionLanguage) return null;
  const motionBehavior = normalizeMotionBehavior(
    motionSystemSource.motionBehavior ?? motionSystemSource.motion_behavior ?? direction.motionBehavior ?? direction.motion_behavior,
    motionLanguage
  );
  const motionSystem = normalizeMotionSystem(
    motionSystemSource,
    motionLanguage,
    motionBehavior
  );
  const typographyConcept = normalizeTypographyConcept(
    direction.typographyConcept ?? direction.typography_concept
  ) ?? {
    metaphor: motionSystem.motionConcept.metaphor,
    behavior: motionSystem.motionConcept.metaphor
  };
  const typographyIdentity = normalizeTypographyIdentity(
    direction.typographyIdentity ?? direction.typography_identity,
    typographyConcept
  );
  const physicalInterpretation = normalizePhysicalInterpretation(
    direction.physicalInterpretation ?? direction.physical_interpretation
  ) ?? {
    phenomenon: typographyIdentity.metaphor || typographyConcept.metaphor,
    forces: "opposing physical forces on the word mass",
    restState: "word held as one cohesive mass at resting scale",
    disruption: typographyConcept.behavior,
    recovery: "returns to rest with damping"
  };
  const artisticIntent = pickString(direction, "artisticIntent", "artistic_intent", "intent") ?? motionSystem.motionConcept.metaphor ?? typographyConcept.behavior;
  const visualLanguage = normalizeVisualLanguage(
    direction.visualLanguage ?? direction.visual_language
  );
  if (!visualLanguage) return null;
  const composition = normalizeComposition(direction.composition ?? direction.layout);
  if (!composition) return null;
  const camera = normalizeCamera(direction.camera);
  if (!camera) return null;
  const palette = normalizePalette(direction.palette);
  if (!palette) return null;
  const atmosphere = normalizeAtmosphere(direction.atmosphere);
  const visualWorld = normalizeVisualWorld(direction.visualWorld ?? direction.visual_world) ?? {
    field: palette.material || "quiet matte wash",
    lighting: palette.lightBehavior,
    texture: palette.material || "flat pigment",
    material: palette.material || "paper",
    description: palette.paletteReasoning || `Color field: ${palette.material}`
  };
  const animationArc = normalizeAnimationArc(direction.animationArc ?? direction.animation_arc) ?? {
    entrance: "type settles into composition",
    development: "word-level locomotion follows the song body",
    peak: "maximum word energy",
    resolution: "motion decays while silhouette remains readable"
  };
  const fontTreatment = normalizeFontTreatment(direction.fontTreatment ?? direction.font_treatment) ?? {
    role: `font body: ${typographyIdentity.weight}`,
    deformation: typographyIdentity.deformationTolerance,
    spacing: typographyIdentity.spacingBehavior,
    contrast: typographyIdentity.silhouetteBehavior,
    rigidity: typographyIdentity.rigidity,
    spacingBehavior: typographyIdentity.spacingBehavior,
    edgeBehavior: typographyIdentity.edgeBehavior,
    silhouettePreservation: typographyIdentity.silhouetteBehavior,
    flexibility: typographyIdentity.flexibility,
    deformationTolerance: typographyIdentity.deformationTolerance
  };
  const specificityReasoning = normalizeSpecificityReasoning(
    direction.specificityReasoning ?? direction.specificity_reasoning
  );
  const reasoning = normalizeReasoning(
    direction.reasoning,
    artisticIntent,
    specificityReasoning
  );
  const energyDistribution = normalizeEnergyDist(
    direction.energyDistribution ?? direction.energy_distribution
  );
  const resolvedAtmosphere = atmosphere ?? {
    description: typographyConcept.metaphor,
    emotionalTemperature: "interpreted from audio",
    tension: 0.5,
    intimacy: 0.5,
    movement: 0.5,
    complexity: 0.5,
    humanQuality: 0.5
  };
  const syncedPalette = {
    ...palette,
    material: palette.material || visualWorld.material
  };
  const rendererIdentity = normalizeRendererIdentity(
    direction.rendererIdentity ?? direction.renderer_identity,
    motionSystem.motionConcept,
    motionSystem.animationRules,
    composition.composition,
    syncedPalette.background,
    syncedPalette.textColor,
    camera.movement
  );
  return {
    physicalInterpretation,
    typographyIdentity,
    typographyConcept: {
      metaphor: typographyIdentity.metaphor || typographyConcept.metaphor || physicalInterpretation.phenomenon,
      behavior: typographyIdentity.behavior || typographyConcept.behavior || physicalInterpretation.disruption
    },
    atmosphere: resolvedAtmosphere,
    visualWorld,
    composition,
    motionSystem,
    animationArc,
    palette: syncedPalette,
    fontTreatment,
    camera,
    energyDistribution,
    rendererIdentity,
    visualLanguage,
    artisticIntent,
    motionLanguage: motionSystem.motionLanguage,
    motionBehavior: motionSystem.motionBehavior,
    reasoning,
    specificityReasoning: {
      whyThisSongNotAnother: reasoning.whyThisSongNotAnother
    }
  };
}
function describeValidationFailure(value) {
  const direction = unwrapCreativeDirection(value);
  if (!direction) {
    return "response was not a JSON object";
  }
  if (!pickString(direction, "artisticIntent", "artistic_intent", "intent")) {
    const motionSystem = direction.motionSystem ?? direction.motion_system;
    if (!motionSystem || typeof motionSystem !== "object" || !normalizeMotionConcept(
      motionSystem.motionConcept ?? motionSystem.motion_concept
    )) {
      return "missing artisticIntent and motionSystem.motionConcept";
    }
  }
  if (!normalizeVisualLanguage(direction.visualLanguage ?? direction.visual_language)) {
    return "missing or invalid visualLanguage (all string fields required)";
  }
  if (!normalizeComposition(direction.composition ?? direction.layout)) {
    return "missing or invalid composition";
  }
  const motionSource = direction.motionSystem ?? direction.motion_system ?? direction;
  const motionLang = typeof motionSource === "object" ? motionSource.motionLanguage ?? motionSource.motion_language ?? direction.motionLanguage ?? direction.motion_language : direction.motionLanguage ?? direction.motion_language;
  if (!normalizeMotionLanguage(motionLang)) {
    if (!motionLang || typeof motionLang !== "object") {
      return "missing motionLanguage (inside motionSystem or top-level)";
    }
    return `invalid motionLanguage \u2014 got ${JSON.stringify(motionLang)}; expected force/material/timing/deformation/direction enums`;
  }
  if (!normalizeCamera(direction.camera)) return "missing or invalid camera";
  if (!normalizePalette(direction.palette)) return "missing or invalid palette";
  return "unknown normalization failure";
}

// src/lib/creativeDirectionPipeline.ts
var CreativeDirectionPipelineError = class extends Error {
  stage;
  validationErrors;
  constructor(stage, validationErrors, detail) {
    const summary = validationErrors.join("; ");
    super(
      detail ? `[CreativeDirector:${stage}] ${detail}${summary ? ` (${summary})` : ""}` : `[CreativeDirector:${stage}] ${summary}`
    );
    this.name = "CreativeDirectionPipelineError";
    this.stage = stage;
    this.validationErrors = validationErrors;
  }
};
function logPipelineStage(stage, payload, meta) {
  console.group(`[CreativeDirector Pipeline] ${stage}`);
  if (meta) {
    console.log("meta:", meta);
  }
  console.log(payload);
  console.groupEnd();
}
function extractCreativeDirectionJson(text) {
  const trimmed = text.trim();
  try {
    return {
      parsed: JSON.parse(trimmed),
      extractionMethod: "direct"
    };
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return {
        parsed: JSON.parse(fenced[1].trim()),
        extractionMethod: "markdown-fence"
      };
    }
    const objectMatch = trimmed.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return {
        parsed: JSON.parse(objectMatch[0]),
        extractionMethod: "object-match"
      };
    }
    throw new CreativeDirectionPipelineError(
      "json-extraction",
      ["response did not contain valid JSON"],
      "Gemini response could not be parsed. "
    );
  }
}
function getNormalizationErrors(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return ["response was not a JSON object"];
  }
  const direction = value;
  if (typeof direction.artisticIntent !== "string" && typeof direction.artistic_intent !== "string") {
    const motionSystem = direction.motionSystem ?? direction.motion_system;
    const hasConcept = motionSystem && typeof motionSystem === "object" && Boolean(
      motionSystem.motionConcept ?? motionSystem.motion_concept
    );
    if (!hasConcept) {
      errors.push("artisticIntent: expected non-empty string (or motionSystem.motionConcept)");
    }
  }
  if (!direction.visualLanguage && !direction.visual_language) {
    errors.push("visualLanguage: missing");
  }
  if (!direction.composition && !direction.layout) {
    errors.push("composition: missing");
  }
  if (!direction.motionLanguage && !direction.motion_language && !direction.motionSystem && !direction.motion_system) {
    errors.push("motionLanguage / motionSystem: missing");
  }
  if (!direction.camera) {
    errors.push("camera: missing");
  }
  if (!direction.palette || typeof direction.palette !== "object") {
    errors.push("palette: missing or not an object");
  } else {
    const palette = direction.palette;
    if (typeof palette.background !== "string") {
      errors.push(`palette.background: expected string, got ${JSON.stringify(palette.background)}`);
    }
    const textColor = typeof palette.textColor === "string" ? palette.textColor : typeof palette.primary === "string" ? palette.primary : null;
    if (!textColor) {
      errors.push("palette.textColor: expected string");
    }
  }
  const specificity = direction.specificityReasoning ?? direction.specificity_reasoning;
  const reasoningBlock = direction.reasoning;
  const whyFromReasoning = reasoningBlock && typeof reasoningBlock === "object" ? typeof reasoningBlock.whyThisSongNotAnother === "string" ? String(reasoningBlock.whyThisSongNotAnother).trim() : "" : "";
  if ((!specificity || typeof specificity !== "object") && !whyFromReasoning) {
    errors.push("specificityReasoning / reasoning.whyThisSongNotAnother: missing");
  } else if (specificity && typeof specificity === "object" && !whyFromReasoning) {
    const reasoning = specificity;
    const why = typeof reasoning.whyThisSongNotAnother === "string" ? reasoning.whyThisSongNotAnother.trim() : typeof reasoning.why_this_song_not_another === "string" ? reasoning.why_this_song_not_another.trim() : "";
    if (!why) {
      errors.push("specificityReasoning.whyThisSongNotAnother: expected non-empty string");
    }
  }
  const normalized = normalizeCreativeDirection(value);
  if (!normalized) {
    const reason = describeValidationFailure(value);
    if (!errors.includes(reason)) {
      errors.push(reason);
    }
  }
  return errors;
}
function getCreativeDirectionValidationErrors(value) {
  const errors = [];
  if (!value || typeof value !== "object") {
    return ["response was not a JSON object"];
  }
  const direction = value;
  if (typeof direction.artisticIntent !== "string" || !direction.artisticIntent.trim()) {
    errors.push(
      `artisticIntent: expected non-empty string, got ${JSON.stringify(direction.artisticIntent)}`
    );
  }
  const visualLanguage = direction.visualLanguage;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    errors.push("visualLanguage: missing or not an object");
  } else {
    const language = visualLanguage;
    for (const key of [
      "geometry",
      "composition",
      "spacing",
      "symmetry",
      "edgeTreatment",
      "motionCharacter",
      "depth",
      "texture"
    ]) {
      if (typeof language[key] !== "string" || !language[key].trim()) {
        errors.push(`visualLanguage.${key}: expected non-empty string`);
      }
    }
  }
  const composition = direction.composition;
  if (!composition || typeof composition !== "object") {
    errors.push("composition: missing or not an object");
  } else {
    const layout = composition;
    if (typeof layout.composition !== "string" || !layout.composition.trim()) {
      errors.push("composition.composition: expected non-empty string");
    }
    if (typeof layout.negativeSpace !== "number" || layout.negativeSpace < 0 || layout.negativeSpace > 1) {
      errors.push(
        `composition.negativeSpace: expected number between 0 and 1, got ${JSON.stringify(layout.negativeSpace)}`
      );
    }
    if (!["left", "center", "right"].includes(String(layout.alignment))) {
      errors.push(`composition.alignment: invalid value ${JSON.stringify(layout.alignment)}`);
    }
    if (!["sparse", "balanced", "dense"].includes(String(layout.textDensity))) {
      errors.push(`composition.textDensity: invalid value ${JSON.stringify(layout.textDensity)}`);
    }
  }
  const motionLanguage = direction.motionLanguage;
  if (!motionLanguage || typeof motionLanguage !== "object") {
    errors.push("motionLanguage: missing or not an object");
  } else {
    const motion = motionLanguage;
    for (const key of ["force", "material", "timing", "deformation", "direction"]) {
      if (typeof motion[key] !== "string" || !motion[key].trim()) {
        errors.push(`motionLanguage.${key}: expected non-empty string`);
      }
    }
  }
  const camera = direction.camera;
  if (!camera || typeof camera !== "object") {
    errors.push("camera: missing or not an object");
  } else {
    const cameraValues = camera;
    if (!["locked", "slow-drift", "orbit"].includes(String(cameraValues.movement))) {
      errors.push(`camera.movement: invalid value ${JSON.stringify(cameraValues.movement)}`);
    }
    if (!["none", "slow-push", "slow-pull", "pulse"].includes(
      String(cameraValues.zoomBehavior)
    )) {
      errors.push(
        `camera.zoomBehavior: invalid value ${JSON.stringify(cameraValues.zoomBehavior)}`
      );
    }
  }
  const palette = direction.palette;
  if (!palette || typeof palette !== "object") {
    errors.push("palette: missing or not an object");
  } else {
    const colors = palette;
    const textColor = typeof colors.textColor === "string" ? colors.textColor : typeof colors.primary === "string" ? colors.primary : null;
    if (typeof colors.background !== "string" || !textColor) {
      errors.push("palette: expected background and textColor strings");
    }
    for (const key of ["strategy", "material", "lightBehavior"]) {
      if (typeof colors[key] !== "string" || !String(colors[key]).trim()) {
        errors.push(`palette.${key}: expected non-empty string`);
      }
    }
    if (typeof colors.paletteReasoning !== "string" || !String(colors.paletteReasoning).trim()) {
      errors.push("palette.paletteReasoning: expected non-empty string");
    }
  }
  if (direction.fontRecommendation || direction.font || direction.selectedFont) {
    errors.push(
      "creative direction must not include font fields \u2014 font is selected upstream"
    );
  }
  const specificity = direction.specificityReasoning ?? direction.specificity_reasoning;
  const reasoningBlock = direction.reasoning;
  const whyFromReasoning = reasoningBlock && typeof reasoningBlock === "object" ? typeof reasoningBlock.whyThisSongNotAnother === "string" ? String(reasoningBlock.whyThisSongNotAnother).trim() : "" : "";
  if ((!specificity || typeof specificity !== "object") && !whyFromReasoning) {
    errors.push("specificityReasoning / reasoning: missing");
  } else if (specificity && typeof specificity === "object") {
    const reasoning = specificity;
    const why = typeof reasoning.whyThisSongNotAnother === "string" ? reasoning.whyThisSongNotAnother.trim() : typeof reasoning.why_this_song_not_another === "string" ? reasoning.why_this_song_not_another.trim() : whyFromReasoning;
    if (!why) {
      errors.push("specificityReasoning.whyThisSongNotAnother: expected non-empty string");
    }
  }
  for (const key of [
    "physicalInterpretation",
    "typographyIdentity",
    "atmosphere",
    "visualWorld",
    "typographyConcept",
    "motionSystem",
    "animationArc",
    "fontTreatment",
    "energyDistribution",
    "rendererIdentity",
    "reasoning"
  ]) {
    if (!direction[key] || typeof direction[key] !== "object") {
      errors.push(`${key}: missing or not an object`);
    }
  }
  return errors;
}
function processGeminiCreativeDirection(rawText) {
  logPipelineStage("raw-gemini-response", rawText, {
    length: rawText.length,
    startsWithFence: rawText.trim().startsWith("```")
  });
  const { parsed, extractionMethod } = extractCreativeDirectionJson(rawText);
  logPipelineStage("parsed-json", parsed, { extractionMethod });
  const normalizationErrors = getNormalizationErrors(parsed);
  if (normalizationErrors.length > 0) {
    throw new CreativeDirectionPipelineError(
      "normalized-direction",
      normalizationErrors,
      "Normalization failed before validation. "
    );
  }
  const normalized = normalizeCreativeDirection(parsed);
  if (!normalized) {
    throw new CreativeDirectionPipelineError(
      "normalized-direction",
      ["normalizeCreativeDirection returned null"]
    );
  }
  logPipelineStage("normalized-direction", normalized);
  const validationErrors = getCreativeDirectionValidationErrors(normalized);
  if (validationErrors.length > 0) {
    throw new CreativeDirectionPipelineError(
      "validated-direction",
      validationErrors,
      "Gemini payload failed schema validation. "
    );
  }
  const validated = normalized;
  logPipelineStage("validated-direction", validated);
  return validated;
}

// server/creativeDirector.ts
var REQUIRED_FORMAT_JSON = `{
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
function buildPrompt(audioFeatures, selectedFont) {
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
  \u2193
Physical forces
  \u2193
Typography behavior
  \u2193
Animation mechanics
  \u2193
Color relationship
  \u2193
Renderer parameters

Never do: Audio \u2192 genre \u2192 visual clich\xE9

BAD: "Rock song \u2192 dark stage \u2192 aggressive typography"
BAD: "Emotional song \u2192 blue background \u2192 floating text"
GOOD: "High transient energy + unstable rhythm \u2192 compressed letter mass that repeatedly separates and reforms"

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
STEP 1 \u2014 physicalInterpretation
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
STEP 2 \u2014 typographyIdentity (font = physical body)
==================================================

Selected font: ${selectedFont.name}
Font metadata (geometry ONLY \u2014 5% max):
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

Dense sharp font \u2192 may resist deformation, may fracture instead of stretch.
Thin flowing font \u2192 may bend, stretch, dissolve.

typographyConcept: mirror executable summary as metaphor/behavior strings for compat (must still sound like animation rules, not poetry).

==================================================
STEP 3 \u2014 motionSystem.motionAction (ONE dominant action)
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
fracture \u2192 primary: letters split apart | secondary: pieces magnetically reconnect
stretch \u2192 primary: letters elongate | secondary: edges wobble after release

Also fill motionLanguage/motionBehavior/primaryPrimitive CONSISTENT with that single action:
- force: subtle | controlled | aggressive | explosive
- material: fluid | elastic | rigid | mechanical | organic
- timing: smooth | staccato | irregular | repetitive
- deformation: none | scale | stretch | rotation | fragmentation
- direction: horizontal | vertical | radial | orbital | random
- motionBehavior: impact | breathing | accumulation | collision | tension | stretch | orbit | dissolve | reveal | oscillation
- primitives: float | wave | pulse | elastic | impact | material (material usually secondary)

==================================================
STEP 4 \u2014 motionSystem.animationRules (EXECUTABLE)
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
STEP 5 \u2014 Audio mapping (evidence, not aesthetics)
==================================================

Energy \u2192 force magnitude
Transient sharpness \u2192 suddenness
Dynamics \u2192 contrast between rest and peak
Density \u2192 number of simultaneous behaviors
Stereo width \u2192 spatial spread
Tempo \u2192 timing (NOT automatic shaking)

High transient + high tension \u2192 sudden deformation events
High dynamics \u2192 large rest\u2194peak difference
Low density \u2192 isolated typography movement

Do NOT map: energy\u2192red | sadness\u2192blue | darkness\u2192black

==================================================
STEP 6 \u2014 Color (readable type \u2014 not a scene)
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
- stage lighting / artificial-stage \u2192 gel wash or graphic poster chroma (magenta, cyan, amber gel) \u2014 not oxidized bronze
- dramatic-shadows \u2192 cool shadow field when the environment is stage/architectural \u2014 not warm sepia metal
Emotional temperature may nudge saturation/contrast slightly, but must not choose the hue family.

CHROMA RULE (critical):
Avoiding clich\xE9s does NOT mean desaturating everything into muddy steel/slate.
- restless / surging + artificial-stage or stage lighting \u2192 prefer strategy complementary-surprise (not muted-contrast)
- Use real chromatic gel/teal/cyan/magenta fields \u2014 readable chroma, not oxidized-steel gray with a faint tint
- Desaturation is for faded-cinematic / soft atmospheres, not high-energy stage worlds
- Do NOT default material to "oxidized steel" as an excuse to mute color

VALUE / LIGHTNESS RULE (critical):
- Low spectral brightness does NOT mean a near-black UI background
- live_band + restless/surging \u2192 mid chromatic stage/poster field (roughly mid lightness), with complementary high-chroma text
- Do NOT pair saturated pink/magenta/cyan text with a near-black void \u2014 both sides of the pair should feel alive
- Near-black backgrounds only when emotional darkness is genuinely high or the world is synthetic/mechanical night

visualWorld is a supporting COLOR FIELD (not a room):
{ field, lighting, texture, material, description }

Avoid: default black background, neon cyber pairs, cinematic gradients, genre colors, bronze-on-black "heated metal" clich\xE9s, muddy desaturated charcoal-teal, pink-on-void.
The background supports the typography. It does not create a scene.
Do NOT justify colors from font rigidity/architecture.

==================================================
STEP 7 \u2014 composition (to reveal the physical behavior)
==================================================

{
  composition,   // layout name, e.g. center-column | left-rail | offset-column | edge-anchor | poster-stack
  negativeSpace, // 0\u20131
  alignment,     // left | center | right
  textDensity    // sparse | balanced | dense
}

Compression \u2192 tighter spacing, concentrated composition
Expansion \u2192 more negative space, wider placement
Dispersion \u2192 separated elements

Do NOT choose layouts from genre.
Spatial DNA hints AFTER physical identity:
stereoWidth < 0.1 \u2192 avoid center; prefer edge/left-rail; higher negativeSpace

==================================================
STEP 8 \u2014 rendererIdentity (FINAL EXECUTABLE OBJECT)
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

If any answer is no \u2014 regenerate before returning.

==================================================
INPUTS
==================================================

songCharacter:
${JSON.stringify(audioFeatures.songCharacter, null, 2)}

Visual DNA:
${JSON.stringify(audioFeatures.visualDna, null, 2)}

Analysis signals (nuance \u2014 do not output raw):
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
      emotionalVector: audioFeatures.emotionalVector
    },
    null,
    2
  )}

Return JSON only:

${REQUIRED_FORMAT_JSON}
`;
}
async function generateCreativeDirectionFromGemini(audioFeatures, selectedFont) {
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
    model: "gemini-2.5-flash"
  });
  const prompt = buildPrompt(audioFeatures, selectedFont);
  console.group("[CreativeDirector] Prompt");
  console.log(prompt);
  console.groupEnd();
  console.group("[CreativeDirector] Request");
  console.log({
    audioFeatures,
    selectedFont,
    prompt
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
        message: error.message
      });
      throw error;
    }
    console.error("[CreativeDirector] Gemini request failed", error);
    throw error;
  }
}

// server/rateLimit.ts
var buckets = /* @__PURE__ */ new Map();
var DEFAULT_MAX = 5;
var DEFAULT_WINDOW_MS = 60 * 60 * 1e3;
function getRateLimitConfig() {
  const max = Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_MAX);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS);
  return {
    max: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS
  };
}
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (first ?? req.socket?.remoteAddress ?? "unknown").trim();
}
function checkRateLimit(key) {
  const { max, windowMs } = getRateLimitConfig();
  const now = Date.now();
  const bucket2 = buckets.get(key);
  if (!bucket2 || now >= bucket2.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (bucket2.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((bucket2.resetAt - now) / 1e3)
    };
  }
  bucket2.count += 1;
  return { allowed: true };
}

// server/api.ts
async function readJsonBody(req) {
  if (req.body !== void 0 && req.body !== null) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(body);
}
function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
async function handleCreativeDirectionRequest(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }
  const { allowed, retryAfterSec } = checkRateLimit(getClientIp(req));
  if (!allowed) {
    if (retryAfterSec) {
      res.setHeader("Retry-After", String(retryAfterSec));
    }
    sendJson(res, 429, {
      error: "Too many requests. Please try again later.",
      retryAfterSec
    });
    return;
  }
  try {
    const body = await readJsonBody(req);
    if (!body.audioFeatures) {
      sendJson(res, 400, { error: "Missing audioFeatures" });
      return;
    }
    if (!body.selectedFont) {
      sendJson(res, 400, { error: "Missing selectedFont" });
      return;
    }
    const creativeDirection = await generateCreativeDirectionFromGemini(
      body.audioFeatures,
      body.selectedFont
    );
    sendJson(res, 200, creativeDirection);
  } catch (error) {
    if (error instanceof CreativeDirectionPipelineError) {
      console.error("[CreativeDirector] API handler pipeline failure", {
        stage: error.stage,
        validationErrors: error.validationErrors,
        message: error.message
      });
      sendJson(res, 422, {
        error: error.message,
        stage: error.stage,
        validationErrors: error.validationErrors
      });
      return;
    }
    console.error("[CreativeDirector] API handler failed", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to generate creative direction"
    });
  }
}

// server/vercel-handler.ts
function handler(req, res) {
  void handleCreativeDirectionRequest(req, res);
}
export {
  handler as default
};
