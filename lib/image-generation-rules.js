export const FLUX_MODEL = "black-forest-labs/flux-2-pro";
export const DREAMO_MODEL = "fal-ai/dreamo";
export const INSTANTID_MODEL = "grandlineai/instant-id-photorealistic";

const CINEMATIC_QUALITY_BLOCK = [
  "Cinematic photorealistic still frame.",
  "Preserve realism, mood, atmosphere, dramatic lighting, natural skin texture, and believable environmental depth.",
  "Keep premium filmic composition without losing clarity on the subject.",
  "No text, no watermark, no subtitles.",
].join(" ");

const IDENTITY_PRESERVATION_BLOCK = [
  "CRITICAL IDENTITY RULES:",
  "Use the reference images and identity anchor as the highest-priority instruction for facial structure and recognizable likeness.",
  "Preserve gender presentation, ethnicity presentation, face shape, hairline, hairstyle, age impression, and facial hair pattern unless explicitly requested otherwise.",
  "When the face is visible, keep the features recognizable and anatomically consistent.",
  "Do not introduce identity drift, face reshaping, or a different person.",
  "Do not force frontal visibility or studio-lit exposure if the scene naturally motivates shadow, backlight, fog, profile, or partial facial falloff.",
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
  "No artificial studio portrait lighting.",
  "Allow natural shadow across the face.",
  "One side of the face may fall into darker shadow if physically correct.",
  "Slight underexposure is allowed for cinematic realism.",
  "Lighting direction, contrast, and exposure on the subject must match the background exactly.",
  "Fog, mist, storm light, sky glow, lightning, haze, smoke, sunset, moonlight, or any environmental source must affect both the character and the background consistently.",
].join(" ");

const BASE_SCENE_INTEGRATION_BLOCK = [
  "SCENE INTEGRATION:",
  "The subject must feel fully embedded in the environment, not composited on top.",
  "Match the scene's color temperature, contrast, atmospheric diffusion, and depth.",
  "If the background is dark, foggy, stormy, backlit, low-key, moody, or high contrast, the character must reflect the same lighting behavior.",
  "Avoid separation between subject and background.",
].join(" ");

const BASE_REALISM_BLOCK = [
  "REALISM:",
  "Natural cinematic exposure.",
  "No beauty lighting.",
  "No glamour portrait look.",
  "No flat front-lit face.",
  "No over-clean skin rendering.",
  "Keep realistic facial depth, subtle skin texture, natural shadow falloff, and physically believable highlights only.",
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
  "full face visibility",
].join(", ");

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
    interior: /(interior|indoors|room|hallway|corridor|practical light|lamp)/.test(
      haystack
    ),
    action: /(action|running|combat|sprinting|explosion|battle|chase)/.test(
      haystack
    ),
    backlit: /(backlit|rim light|silhouette|against the light)/.test(haystack),
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

  return lines;
}

export function buildLightingBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  return [BASE_LIGHTING_BLOCK, ...buildDynamicLightingLines(sceneTypes)]
    .filter(Boolean)
    .join(" ");
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

export function buildLightingNegativeBlock(scene = "", style = "") {
  const sceneTypes = detectSceneTypes(scene, style);
  const negatives = [LIGHTING_NEGATIVE_BLOCK];

  if (!sceneTypes.backlit) negatives.push("fake rim light");
  if (!sceneTypes.sunset) negatives.push("golden beauty light");
  if (sceneTypes.storm || sceneTypes.night) negatives.push("bright facial fill");

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
    buildSceneIntegrationBlock(scene || prompt, style),
    buildRealismBlock(scene || prompt, style),
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
  const sceneIntegrationBlock = buildSceneIntegrationBlock(safeScene, style);
  const realismBlock = buildRealismBlock(safeScene, style);
  const combinedNegativePrompt = joinNegativePrompts(
    negativePrompt,
    buildLightingNegativeBlock(safeScene, style),
    mode === "character" ? IDENTITY_NEGATIVE_BLOCK : ""
  );

  const basePrompt = [
    safeScene,
    characterBlock,
    styleBlock,
    CINEMATIC_QUALITY_BLOCK,
    lightingBlock,
    sceneIntegrationBlock,
    realismBlock,
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
    "Correction: remove studio portrait lighting, artificial face illumination, and composited subject separation.",
    "Correction: match facial exposure, contrast, and shadow direction to the scene background exactly.",
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
