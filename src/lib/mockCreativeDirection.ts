import type { CreativeDirection } from "../types/creativeDirection";
import { DEFAULT_ENERGY_DISTRIBUTION } from "../types/creativeInterpretation";

export const mockCreativeDirection: CreativeDirection = {
  physicalInterpretation: {
    phenomenon: "compressed letter mass that repeatedly separates and reforms",
    forces: "binding cohesion opposed by sudden outward release",
    restState: "word held as one compressed block at ~0.9 scale",
    disruption: "on peaks, block splits horizontally up to 12–18px gaps",
    recovery: "gaps close with elastic snap within 180–280ms",
  },

  typographyIdentity: {
    weight: "dense",
    rigidity: "high — prefers break over melt",
    flexibility: "low continuous bend; allows split gaps",
    edgeBehavior: "keep edges hard during separation",
    spacingBehavior: "gaps open on disruption, close on recovery",
    silhouetteBehavior: "word silhouette restores after reconnection",
    deformationTolerance: "fracture-tolerant; stretch-limited",
    metaphor: "compressed letter mass separating and reforming",
    behavior: "splits on peaks, magnetically reconnects",
  },

  typographyConcept: {
    metaphor: "compressed letter mass separating and reforming",
    behavior: "splits on peaks, magnetically reconnects",
  },

  atmosphere: {
    description: "compressed letter mass under irregular release pressure",
    emotionalTemperature: "cool compression",
    tension: 0.72,
    intimacy: 0.28,
    movement: 0.8,
    complexity: 0.55,
    humanQuality: 0.45,
  },

  visualWorld: {
    field: "high-contrast matte field",
    lighting: "flat-graphic",
    texture: "hard edge plane",
    material: "dense ink on quiet ground",
    description: "Readable field for type: high-contrast matte field. Not a scene.",
  },

  visualLanguage: {
    geometry: "rectilinear",
    composition: "compressed",
    spacing: "tight",
    symmetry: "asymmetric",
    edgeTreatment: "hard",
    motionCharacter: "fragmented",
    depth: "flat",
    texture: "smooth",
  },

  artisticIntent:
    "Word holds compressed at rest, splits horizontally on peaks up to 14px, then snaps back in ~220ms.",

  composition: {
    composition: "left-rail",
    negativeSpace: 0.72,
    alignment: "left",
    textDensity: "sparse",
  },

  motionSystem: {
    motionAction: {
      primaryAction: "fracture",
      secondaryConsequence: "pieces magnetically reconnect into the word",
      explanation: "on peaks, block splits horizontally then reunites",
    },
    animationRules: {
      wordBehavior:
        "word holds as one mass at rest; on peaks, opens horizontal gaps then reunites",
      glyphBehavior:
        "glyphs inherit split offsets only during disruption (<8px); quiet otherwise",
      scale: "rest 0.92–1.0; peaks up to 1.08",
      position: "word X split ±6–14px during disruption; Y quiet",
      rotation: "≤2° word rotation; glyphs ≤0.5°",
      spacing: "tracking opens with split; restores on reconnection",
      deformation: "prefer gap/separation over melt; mild skew ≤2°",
      timing: "sudden disruption on transients; 180–280ms elastic recovery",
      intensityResponse:
        "higher intensity widens peak gaps and shortens recovery — not more glyph noise",
    },
    motionConcept: {
      metaphor: "fracture: on peaks, block splits horizontally then reunites",
      primaryMotion: "fracture",
      secondaryMotion: "pieces magnetically reconnect into the word",
      intensityBehavior:
        "higher intensity widens peak gaps and shortens recovery — not more glyph noise",
      wordMovement:
        "word holds as one mass at rest; on peaks, opens horizontal gaps then reunites",
      glyphMovement:
        "glyphs inherit split offsets only during disruption (<8px); quiet otherwise",
      cameraMovement: "locked",
    },
    motionLanguage: {
      force: "aggressive",
      material: "elastic",
      timing: "staccato",
      deformation: "fragmentation",
      direction: "horizontal",
    },
    motionBehavior: {
      primary: "collision",
      secondary: "tension",
    },
    primaryPrimitive: "elastic",
    secondaryPrimitive: "impact",
  },

  motionLanguage: {
    force: "aggressive",
    material: "elastic",
    timing: "staccato",
    deformation: "fragmentation",
    direction: "horizontal",
  },

  motionBehavior: {
    primary: "collision",
    secondary: "tension",
  },

  animationArc: {
    entrance: "word held as one compressed block at ~0.9 scale",
    development: "on peaks, block splits horizontally up to 12–18px gaps",
    peak: "maximum binding cohesion opposed by sudden outward release",
    resolution: "gaps close with elastic snap within 180–280ms",
  },

  camera: {
    movement: "locked",
    zoomBehavior: "none",
  },

  palette: {
    background: "#ebe6df",
    textColor: "#1c1712",
    strategy: "muted-contrast",
    material: "dense ink on quiet ground",
    lightBehavior: "flat-graphic",
    paletteReasoning:
      "Quiet matte ground with dense ink type for fracture readability — not a scene, neon, or genre palette.",
  },

  fontTreatment: {
    role: "font body: dense, high — prefers break over melt",
    deformation: "fracture-tolerant; stretch-limited",
    spacing: "gaps open on disruption, close on recovery",
    contrast: "word silhouette restores after reconnection",
    rigidity: "high — prefers break over melt",
    spacingBehavior: "gaps open on disruption, close on recovery",
    edgeBehavior: "keep edges hard during separation",
    silhouettePreservation: "word silhouette restores after reconnection",
    flexibility: "low continuous bend; allows split gaps",
    deformationTolerance: "fracture-tolerant; stretch-limited",
  },

  energyDistribution: { ...DEFAULT_ENERGY_DISTRIBUTION },

  rendererIdentity: {
    primaryMotion: "fracture",
    secondaryMotion: "pieces magnetically reconnect into the word",
    wordMovement:
      "word holds as one mass at rest; on peaks, opens horizontal gaps then reunites",
    glyphMovement:
      "glyphs inherit split offsets only during disruption (<8px); quiet otherwise",
    scaleBehavior: "rest 0.92–1.0; peaks up to 1.08",
    positionBehavior: "word X split ±6–14px during disruption; Y quiet",
    rotationBehavior: "≤2° word rotation; glyphs ≤0.5°",
    spacingBehavior: "tracking opens with split; restores on reconnection",
    deformationBehavior: "prefer gap/separation over melt; mild skew ≤2°",
    backgroundColor: "#ebe6df",
    textColor: "#1c1712",
    composition: "left-rail",
    camera: "locked",
  },

  reasoning: {
    creativeTranslation:
      "Forces: binding vs release. Action: fracture → magnetic reconnect. Rest/disrupt/recover are executable word rules.",
    whyThisSongNotAnother:
      "Transient-driven split/reform with left-rail concentration — not pulse-bounce or stage scenery.",
    hiddenIdentityCheck:
      "Yes — letter physics only; no title/artist/genre scenery.",
    selfCheck: {
      hiddenIdentity: true,
      uniquePhysicalBehavior: true,
      developerImplementable: true,
      fontGeometryOnly: true,
      avoidedGenericVisuals: true,
    },
  },

  specificityReasoning: {
    whyThisSongNotAnother:
      "Transient-driven split/reform with left-rail concentration — not pulse-bounce or stage scenery.",
  },
};
