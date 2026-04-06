export const FLUX_MODEL = "black-forest-labs/flux-2-pro";
export const DREAMO_MODEL = "fal-ai/dreamo";
export const INSTANTID_MODEL = "grandlineai/instant-id-photorealistic";

const CINEMATIC_QUALITY_BLOCK = [
  "Cinematic photorealistic still frame.",
  "Preserve realism, mood, atmosphere, dramatic lighting, natural skin texture, and believable environmental depth.",
  "Keep premium filmic composition without losing clarity on the subject.",
  "No text, no watermark, no subtitles.",
].join(" ");

const IDENTITY_VISIBILITY_BLOCK = [
  "CRITICAL IDENTITY RULES:",
  "Face must be clearly visible and readable.",
  "Eyes, nose, mouth, jawline, cheek structure, and full facial shape must remain visible.",
  "No silhouette, no obscured face, no hidden eyes, no extreme distance.",
  "No heavy fog, smoke, rain streaks, hair, shadows, props, or motion blur covering the face.",
  "No back-facing angle and no full side-profile-only framing.",
  "Prefer front-facing or slight 3/4 view.",
  "The face must be well-lit enough for identity recognition while keeping the scene cinematic.",
].join(" ");

const IDENTITY_SCENE_CORRECTION_BLOCK = [
  "SCENE CORRECTIONS FOR IDENTITY:",
  "Keep fog and atmosphere in the background and away from the face.",
  "Avoid strong backlighting that turns the face into a silhouette.",
  "Use clear key light on the face with readable eyes and skin tone.",
  "Maintain cinematic mood but protect facial visibility first.",
].join(" ");

const IDENTITY_CAMERA_BLOCK = [
  "CAMERA RULES FOR IDENTITY:",
  "Use 50mm or 85mm lens language.",
  "Use medium shot, medium close-up, or close-up framing.",
  "Eye-level framing.",
  "Subject faces camera or slight 3/4 angle.",
  "Do not place the subject too far away.",
].join(" ");

const IDENTITY_NEGATIVE_BLOCK = [
  "silhouette",
  "backlit face",
  "face in shadow",
  "hidden face",
  "obscured face",
  "fog covering face",
  "hair covering eyes",
  "eyes not visible",
  "back view",
  "rear view",
  "extreme side profile",
  "tiny face",
  "distant subject",
  "identity drift",
  "different person",
].join(", ");

export function adjustSceneForIdentity(scene = "") {
  return [
    String(scene || "").trim(),
    "Keep atmosphere and weather around the environment, but keep the face area clean and readable.",
    "If there is fog, smoke, or rain, it must not block the face.",
    "If there is dramatic lighting, it must still reveal the face clearly.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function enforceIdentityRules(prompt = "") {
  return [
    String(prompt || "").trim(),
    IDENTITY_VISIBILITY_BLOCK,
    IDENTITY_SCENE_CORRECTION_BLOCK,
    IDENTITY_CAMERA_BLOCK,
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
  const safeScene = String(scene || "").trim();
  const styleBlock = style ? `Style: ${style}` : "";
  const characterBlock = character
    ? [
        "IDENTITY ANCHOR:",
        String(character).trim(),
        "Use the reference images and identity anchor as the highest-priority instruction.",
        "Do not change gender presentation, ethnicity presentation, face shape, hairline, hairstyle, age impression, facial hair pattern, or recognizable likeness unless explicitly requested.",
      ].join(" ")
    : "";

  const basePrompt = [
    safeScene,
    characterBlock,
    styleBlock,
    CINEMATIC_QUALITY_BLOCK,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (mode === "character") {
    return [
      enforceIdentityRules(basePrompt),
      negativePrompt
        ? `Avoid: ${negativePrompt}, ${IDENTITY_NEGATIVE_BLOCK}`
        : `Avoid: ${IDENTITY_NEGATIVE_BLOCK}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    basePrompt,
    negativePrompt ? `Avoid: ${negativePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCorrectionPrompt(prompt = "") {
  return [
    String(prompt || "").trim(),
    "Correction: Make the face clearly visible and well-lit, preserve identity.",
    "Correction: keep the subject facing camera or slight 3/4 view.",
    "Correction: remove silhouette lighting, remove heavy fog over the face, and keep the eyes readable.",
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
