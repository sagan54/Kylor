export const FLUX_MODEL = "black-forest-labs/flux-2-pro";
export const DREAMO_MODEL = "fal-ai/dreamo";
export const INSTANTID_MODEL = "grandlineai/instant-id-photorealistic";

const CINEMATIC_QUALITY_BLOCK = [
  "Cinematic photorealistic still frame.",
  "Preserve realism, mood, atmosphere, and believable environmental depth.",
  "Prioritize physical believability over flattering portrait treatment.",
  "No text, no watermark, no subtitles.",
].join(" ");

const IDENTITY_PRESERVATION_BLOCK = [
  "CRITICAL IDENTITY RULES:",
  "Use the reference images and identity anchor as the highest-priority instruction for facial structure and recognizable likeness.",
  "Preserve gender presentation, ethnicity presentation, face shape, hairline, hairstyle, age impression, and facial hair pattern unless explicitly requested otherwise.",
  "When the face is visible, keep the features recognizable and anatomically consistent.",
  "Do not introduce identity drift, face reshaping, or a different person.",
  "Do not force frontal visibility, uniform exposure, or studio relighting if the scene naturally motivates shadow, backlight, fog, profile, or partial facial falloff.",
].join(" ");

const IDENTITY_CAMERA_BLOCK = [
  "CAMERA RULES FOR IDENTITY:",
  "Use framing that supports recognizable identity when the subject is meant to be visible.",
  "Prefer medium shot, medium close-up, or close-up only when the requested scene supports it.",
  "Allow profile, back view, silhouette, distance, or partial facial concealment when explicitly requested by the scene.",
].join(" ");

const BASE_LIGHTING_BLOCK = [
  "LIGHTING:",
  "Environment-driven lighting only.",
  "The character must be lit by the actual scene atmosphere and practical light sources present in the environment.",
  "Respect direction, intensity, color temperature, and shadow falloff from the scene.",
  "Allow partial facial shadow, cast shadow, occlusion shadow, and restrained exposure when physically correct.",
  "No artificial studio portrait lighting, no beauty relighting, and no fake facial fill that ignores the environment.",
].join(" ");

const BASE_SCENE_INTEGRATION_BLOCK = [
  "SCENE INTEGRATION:",
  "The subject must feel fully embedded in the environment, not composited on top.",
  "Match the scene's color temperature, contrast, atmospheric diffusion, and depth.",
  "If the background is dark, foggy, stormy, backlit, low-key, moody, or high contrast, the character must reflect the same lighting behavior.",
  "Avoid separation between subject and background.",
].join(" ");

const SKIN_REALISM_BLOCK = `
real human skin, visible pores, subtle micro-texture,
slight uneven tone, natural softness in fine details,
no over-sharpening, no hyper clarity, no artificial crispness,
realistic facial shading with gentle transitions,
no beauty filter, no airbrushed skin, no waxy texture
`.trim();

const CAMERA_IMPERFECTION_BLOCK = `
captured on real camera, slight natural softness,
subtle sensor grain, realistic noise in shadows,
no digital sharpening, no HDR over-processing,
natural lens rendering, imperfect optical response
`.trim();

const LIGHT_DISCIPLINE_BLOCK = `
lighting must strictly follow environment,
no face brightening or artificial lift,
no fill light unless explicitly present,
harsh directional light creates strong contrast,
face may be partially obscured in shadow,
do not preserve facial visibility at the cost of realism
`.trim();

const SHADOW_INTERACTION_BLOCK = `
objects between light and subject must cast shadows,
arms, weapons, and environment must create occlusion shadows,
face should show partial shadow when blocked,
no evenly lit face under obstruction
`.trim();

const BASE_REALISM_BLOCK = [
  "REALISM:",
  "Natural cinematic exposure.",
  "No glamour portrait look.",
  "No flat front-lit face.",
  "Maintain realistic facial depth, natural shadow falloff, and physically believable highlights.",
].join(" ");

const IDENTITY_NEGATIVE_BLOCK = [
  "identity drift",
  "different person",
  "face reshaping",
  "wrong facial structure",
].join(", ");

const LIGHTING_NEGATIVE_BLOCK = [
  "studio lighting",
  "beauty lighting",
  "flat frontal lighting",
  "evenly lit face",
  "glamour portrait",
  "artificial face illumination",
  "overexposed face",
  "HDR portrait look",
  "subject cutout look",
  "composited subject",
  "mismatched lighting",
  "studio key light",
  "soft front light",
  "perfectly lit face",
  "symmetrical lighting",
  "unnatural face brightness",
  "studio-lit face in a dark scene",
].join(", ");

const NEGATIVE_SKIN_BLOCK = `
beauty filter, smooth skin, plastic skin, waxy skin,
airbrushed, soft skin, glam lighting, perfect skin,
digital smoothing, AI face glow
`.replace(/\s+/g, " ").trim();

const NEGATIVE_REALISM_BLOCK = `
over-sharpened, hyper detailed skin, HDR face glow,
perfect lighting, studio lighting, artificial clarity,
digital sharpening, ultra crisp edges, beauty lighting
`.replace(/\s+/g, " ").trim();

function normalizeText(value = "") {
  return String(value || "").trim();
}

function detectSceneTypes(scene = "", style = "") {
  const haystack = `${scene} ${style}`.toLowerCase();

  return {
    storm:
      /(storm|thunder|lightning|tempest|rainstorm|dark clouds|downpour)/.test(
        haystack
      ),
    fog: /(fog|mist|haze|smoke|smoky|atmospheric|diffusion)/.test(haystack),
    sunset: /(sunset|golden hour|dusk|sunrise|warm sky|orange glow)/.test(
      haystack
    ),
    night: /(night|moonlight|midnight|nocturnal|low-key|dark scene)/.test(
      haystack
    ),
    interior: /(interior|indoors|room|hallway|corridor|practical light|lamp|kitchen|bedroom|warehouse|office|window light)/.test(
      haystack
    ),
    action: /(action|running|combat|sprinting|explosion|battle|chase|fight|attack|punch|kick|gunfight|war)/.test(
      haystack
    ),
    horror: /(horror|monster|creature|terror|danger|survival|panic|haunted|demon|zombie|threat)/.test(
      haystack
    ),
    grief: /(cry|crying|loss|heartbreak|mourning|grief|funeral|goodbye|tears|sorrow)/.test(
      haystack
    ),
    joy: /(victory|warm reunion|joy|joyful|happiness|happy|celebration|laughing|smile|smiling|triumph)/.test(
      haystack
    ),
    confrontation: /(confrontation|standoff|serious|tense|intense|dramatic confrontation|faceoff)/.test(
      haystack
    ),
    pain: /(pain|painful|injured|strained|wounded|hurt|exhausted|bleeding)/.test(
      haystack
    ),
    backlit: /(backlit|rim light|silhouette|against the light)/.test(haystack),
    sideLit: /(side-lit|side lit|light from the side|window light|sliver of light)/.test(
      haystack
    ),
    neon: /(neon|club light|sign glow|colored practical|magenta light|cyan light)/.test(
      haystack
    ),
    firelight: /(firelight|candlelight|torchlight|embers|bonfire|flame light)/.test(
      haystack
    ),
    cloudy: /(cloudy|overcast|grey sky|soft daylight|diffused daylight)/.test(
      haystack
    ),
    obstruction: /(through blinds|through window frame|through leaves|through bars|through smoke|partially blocked|occluded|shadow from|blocked light)/.test(
      haystack
    ),
  };
}

export function inferSceneExpression(promptText = "", style = "") {
  const haystack = `${promptText} ${style}`.toLowerCase();
  const has = (pattern) => pattern.test(haystack);

  let label = "focused / neutral";
  let guidance =
    "Expression should stay neutral or lightly focused by default, with no smile unless the scene clearly calls for it.";
  let negative =
    "happy expression, cheerful grin, big smile, playful smile, emotion mismatch";

  if (has(/victory|warm reunion|joy|joyful|happiness|happy|celebration|laughing|laugh|smile|smiling|wedding toast/)) {
    label = "subtle smile / joyful";
    guidance =
      "Expression should carry believable warmth, relief, or subtle joy. Use a smile only if it feels naturally motivated by the scene.";
    negative = "blank serious face, angry expression, grief expression, horror panic";
  } else if (has(/cry|crying|loss|heartbreak|mourning|grief|funeral|goodbye|tears|sorrow|devastated/)) {
    label = "sad / emotional";
    guidance =
      "Expression should feel emotionally heavy, sad, or restrained, with believable tension around the eyes and mouth and no cheerful smile.";
    negative = "happy expression, cheerful grin, playful smile, triumphant look";
  } else if (has(/horror|monster|creature|terror|danger|survival|panic|haunted|demon|zombie|threat|ambush/)) {
    if (has(/survival|stand ground|fight back|determined|resist/)) {
      label = "fearful / determined";
      guidance =
        "Expression should convey tension and survival-driven resolve, with fear or strain present but controlled.";
    } else {
      label = "fearful / shocked";
      guidance =
        "Expression should show fear, alarm, or shock appropriate to danger, not happiness.";
    }
    negative = "happy expression, relaxed smile, flirtatious look, playful grin";
  } else if (has(/fight|battle|attack|rage|combat|assault|gunfight|war|punch|kick|aggressive/)) {
    label = "angry / aggressive";
    guidance =
      "Expression should feel aggressive, combative, or hard-edged, with no smile and no soft cheerful expression.";
    negative = "happy expression, cheerful grin, relaxed smile, soft portrait smile";
  } else if (has(/confrontation|standoff|serious|tense|intense|interrogation|threaten|faceoff/)) {
    label = "focused / intense";
    guidance =
      "Expression should feel serious, intense, or locked-in, with restrained emotion and no smile.";
    negative = "happy expression, grin, playful look, casual smile";
  } else if (has(/pain|painful|injured|strained|wounded|hurt|bleeding|exhausted/)) {
    label = "painful / strained";
    guidance =
      "Expression should show strain, pain, exhaustion, or physical stress without slipping into glamour posing.";
    negative = "happy expression, relaxed grin, playful smile";
  } else if (has(/heroic|determined|resolve|resolute|marching forward|final stand/)) {
    label = "determined / heroic";
    guidance =
      "Expression should feel determined, controlled, and resolute, with intensity rather than happiness.";
    negative = "happy expression, silly grin, casual smile";
  } else if (has(/calm|quiet|stillness|peaceful|meditative|resting/)) {
    label = "calm / neutral";
    guidance =
      "Expression should stay calm, neutral, and grounded, with no unnecessary smile.";
    negative = "big smile, exaggerated anger, comic fear";
  }

  return {
    label,
    guidance,
    negative,
  };
}

function buildDynamicLightingLines(sceneTypes) {
  const lines = [];

  if (sceneTypes.storm) {
    lines.push(
      "Storm scenes should use darker ambient exposure, sky-driven light, and lightning-style contrast only when motivated by the environment."
    );
  }

  if (sceneTypes.fog) {
    lines.push(
      "Fog scenes should use softer diffused light, reduced contrast, and atmospheric wrap that affects both face and background consistently."
    );
  }

  if (sceneTypes.sunset) {
    lines.push(
      "Sunset scenes should use warm directional light and a strong environmental color cast rather than neutral portrait illumination."
    );
  }

  if (sceneTypes.night) {
    lines.push(
      "Night scenes should stay low-key with practical or motivated highlights only, never bright studio-style facial fill."
    );
  }

  if (sceneTypes.interior) {
    lines.push(
      "Interior scenes should use practical motivated sources from the location itself, with believable falloff and shadow direction."
    );
  }

  if (sceneTypes.action) {
    lines.push(
      "Action scenes should preserve realism under motion and stress, avoiding polished portrait exposure or artificially clean facial lighting."
    );
  }

  if (sceneTypes.backlit) {
    lines.push(
      "Backlit scenes may retain partial silhouette or edge light if it is physically motivated by the environment."
    );
  }

  if (sceneTypes.sideLit) {
    lines.push(
      "Side-lit scenes should allow one side of the face to fall off naturally rather than filling both sides evenly."
    );
  }

  if (sceneTypes.neon) {
    lines.push(
      "Neon scenes should let practical colored light shape the skin and shadow planes instead of neutralizing the face."
    );
  }

  if (sceneTypes.firelight) {
    lines.push(
      "Firelight scenes should use warm flicker-driven directionality, deeper surrounding shadow, and uneven practical illumination."
    );
  }

  if (sceneTypes.cloudy) {
    lines.push(
      "Cloudy scenes should keep diffuse overcast softness without turning the face into flat beauty lighting."
    );
  }

  if (sceneTypes.obstruction) {
    lines.push(
      "If objects block the light source, cast shadows and partial occlusion shadows must appear on the face and body accordingly."
    );
  }

  return lines;
}

export function buildLightingBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  return [BASE_LIGHTING_BLOCK, ...buildDynamicLightingLines(sceneTypes)]
    .filter(Boolean)
    .join(" ");
}

export function buildRealismLightingBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const lines = [
    "PHYSICAL LIGHTING REALISM:",
    "Face brightness must respect scene light direction and environmental exposure.",
    "Do not relight the face independently from the world.",
    "If the scene is dark, stormy, foggy, backlit, or low-key, do not brighten the subject unnaturally.",
    "If something blocks the light source, allow realistic cast shadow and partial facial shadow.",
    "No studio beauty light unless the user explicitly requests studio photography.",
    LIGHT_DISCIPLINE_BLOCK,
    SHADOW_INTERACTION_BLOCK,
  ];

  if (sceneTypes.backlit || sceneTypes.sideLit || sceneTypes.obstruction) {
    lines.push(
      "Partial shadow on the face is acceptable and often required when the environment motivates it."
    );
  }

  if (sceneTypes.neon || sceneTypes.firelight || sceneTypes.interior) {
    lines.push(
      "Practical lights in the environment should visibly shape skin tone, highlight placement, and shadow color."
    );
  }

  return lines.join(" ");
}

export function buildSceneIntegrationBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const lines = [BASE_SCENE_INTEGRATION_BLOCK];

  if (sceneTypes.fog) {
    lines.push(
      "Atmospheric diffusion should wrap around the subject naturally instead of leaving the face looking cut out from the fog."
    );
  }

  if (sceneTypes.storm || sceneTypes.night) {
    lines.push(
      "Keep the subject grounded inside the low-key tonal range of the scene rather than lifting the face brighter than the world around it."
    );
  }

  if (sceneTypes.sunset) {
    lines.push(
      "Carry the same warm environmental color cast onto skin, clothing, and shadows."
    );
  }

  return lines.join(" ");
}

export function buildRealismBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const lines = [BASE_REALISM_BLOCK];

  if (sceneTypes.storm || sceneTypes.night) {
    lines.push("Allow deeper shadow and restrained highlight detail for realism.");
  }

  if (sceneTypes.fog) {
    lines.push(
      "Keep contrast natural and softened by atmosphere, without turning the face into a clean studio subject."
    );
  }

  return lines.join(" ");
}

export function buildSkinRealismBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const lines = [SKIN_REALISM_BLOCK];

  if (sceneTypes.night || sceneTypes.storm) {
    lines.push(
      "Allow deeper natural shadow planes across the face without smoothing them away."
    );
  }

  if (sceneTypes.neon || sceneTypes.firelight) {
    lines.push(
      "Keep skin texture readable under colored practical light instead of polishing it into a glamour look."
    );
  }

  return lines.join(" ");
}

export function buildCameraRealismBlock() {
  return CAMERA_IMPERFECTION_BLOCK;
}

export function buildShadowInteractionBlock() {
  return SHADOW_INTERACTION_BLOCK;
}

export function buildExpressionBlock(scene = "", style = "") {
  const inferred = inferSceneExpression(scene, style);
  return `EXPRESSION: ${inferred.guidance} Inferred expression: ${inferred.label}.`;
}

export function buildExpressionNegativeBlock(scene = "", style = "") {
  return inferSceneExpression(scene, style).negative;
}

export function buildLightingNegativeBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const negatives = [LIGHTING_NEGATIVE_BLOCK];

  if (!sceneTypes.backlit) negatives.push("fake rim light");
  if (!sceneTypes.sunset) negatives.push("golden beauty light");
  if (sceneTypes.storm || sceneTypes.night) negatives.push("bright facial fill");
  if (sceneTypes.action || sceneTypes.horror || sceneTypes.confrontation) {
    negatives.push("happy expression", "smiling during tension");
  }

  return negatives.join(", ");
}

function joinNegativePrompts(...blocks) {
  return blocks
    .map((block) => normalizeText(block))
    .filter(Boolean)
    .join(", ");
}

export function adjustSceneForIdentity(scene = "") {
  return [
    normalizeText(scene),
    buildLightingBlock(scene),
    buildRealismLightingBlock(scene),
    buildSceneIntegrationBlock(scene),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function enforceIdentityRules(prompt = "", scene = "", style = "") {
  return [
    normalizeText(prompt),
    IDENTITY_PRESERVATION_BLOCK,
    IDENTITY_CAMERA_BLOCK,
    buildLightingBlock(scene || prompt, style),
    buildRealismLightingBlock(scene || prompt, style),
    buildSceneIntegrationBlock(scene || prompt, style),
    buildSkinRealismBlock(scene || prompt, style),
    buildCameraRealismBlock(),
    buildShadowInteractionBlock(),
    buildRealismBlock(scene || prompt, style),
    buildExpressionBlock(scene || prompt, style),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildPrompt({
  scene = "",
  character = null,
  mode = "freeform",
  style = "",
  negativePrompt = "",
}) {
  const safeScene = normalizeText(scene);
  const styleBlock = style ? `Style: ${style}` : "";
  const characterBlock = character
    ? [
        "IDENTITY ANCHOR:",
        normalizeText(character),
        "Use the reference images and identity anchor as the highest-priority instruction.",
        "Do not change gender presentation, ethnicity presentation, face shape, hairline, hairstyle, age impression, facial hair pattern, or recognizable likeness unless explicitly requested.",
      ].join(" ")
    : "";
  const lightingBlock = buildLightingBlock(safeScene, style);
  const realismLightingBlock = buildRealismLightingBlock(safeScene, style);
  const sceneIntegrationBlock = buildSceneIntegrationBlock(safeScene, style);
  const skinRealismBlock = buildSkinRealismBlock(safeScene, style);
  const cameraRealismBlock = buildCameraRealismBlock();
  const shadowInteractionBlock = buildShadowInteractionBlock();
  const realismBlock = buildRealismBlock(safeScene, style);
  const expressionBlock = buildExpressionBlock(safeScene, style);
  const combinedNegativePrompt = joinNegativePrompts(
    negativePrompt,
    buildLightingNegativeBlock(safeScene, style),
    buildExpressionNegativeBlock(safeScene, style),
    NEGATIVE_SKIN_BLOCK,
    NEGATIVE_REALISM_BLOCK,
    "emotion mismatch",
    mode === "character" ? IDENTITY_NEGATIVE_BLOCK : ""
  );

  const basePrompt = [
    safeScene,
    characterBlock,
    styleBlock,
    CINEMATIC_QUALITY_BLOCK,
    lightingBlock,
    realismLightingBlock,
    sceneIntegrationBlock,
    skinRealismBlock,
    cameraRealismBlock,
    shadowInteractionBlock,
    realismBlock,
    expressionBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (mode === "character") {
    return [
      enforceIdentityRules(basePrompt, safeScene, style),
      combinedNegativePrompt ? `Avoid: ${combinedNegativePrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    basePrompt,
    combinedNegativePrompt ? `Avoid: ${combinedNegativePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCorrectionPrompt(prompt = "") {
  return [
    normalizeText(prompt),
    "Correction: preserve identity while keeping the subject physically integrated into the environment.",
    "Correction: remove studio portrait lighting, beauty-filtered skin, artificial face illumination, and composited subject separation.",
    "Correction: match facial exposure, contrast, shadow direction, and expression to the scene background exactly.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function getModelForTask({ hasCharacter = false, attempt = 0 } = {}) {
  if (!hasCharacter) {
    return {
      provider: "replicate",
      model: FLUX_MODEL,
      identityMode: "prompt_only_flux",
    };
  }

  if (attempt <= 0) {
    return {
      provider: "fal",
      model: DREAMO_MODEL,
      identityMode: "dreamo_identity",
    };
  }

  return {
    provider: "replicate",
    model: INSTANTID_MODEL,
    identityMode: "instantid_identity",
  };
}
