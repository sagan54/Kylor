const GENRE_MOODS = {
  action: "kinetic, tense, adrenaline-driven",
  horror: "ominous, unsettling, suspenseful",
  comedy: "bright, playful, expressive",
  noir: "moody, shadowed, morally ambiguous",
  drama: "intimate, emotionally grounded",
  epic: "grand, mythic, awe-filled",
  scifi: "sleek, futuristic, mysterious",
  romance: "warm, tender, luminous",
  thriller: "tense, controlled, psychological",
  general: "cinematic, polished, immersive",
};

const CAMERA_MOVEMENTS = {
  "dolly in": "slow dolly in",
  "dolly out": "slow dolly out",
  "pan left": "controlled pan left",
  "pan right": "controlled pan right",
  "crane up": "rising crane move",
  "crane down": "descending crane move",
  handheld: "subtle handheld movement",
  auto: "cinematic motivated camera movement",
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function pickSubject(prompt, lowered) {
  if (includesAny(lowered, ["warrior", "knight", "soldier"])) return "a battle-worn hero";
  if (includesAny(lowered, ["woman", "girl"])) return "the central woman in the scene";
  if (includesAny(lowered, ["man", "boy"])) return "the central man in the scene";
  if (includesAny(lowered, ["robot", "android", "cyborg"])) return "a futuristic synthetic character";
  if (includesAny(lowered, ["city", "street", "alley"])) return "the city itself as a living character";
  if (includesAny(lowered, ["creature", "monster"])) return "a powerful creature";
  return prompt.split(/[,.]/)[0]?.trim() || "the main subject";
}

function pickAction(lowered) {
  if (includesAny(lowered, ["fight", "battle", "attack", "duel"])) return "engages in a high-stakes confrontation";
  if (includesAny(lowered, ["chase", "running", "run", "escape"])) return "moves urgently through the frame";
  if (includesAny(lowered, ["cry", "tear", "grief"])) return "reveals restrained emotion in a quiet beat";
  if (includesAny(lowered, ["kiss", "embrace"])) return "shares an intimate emotional moment";
  if (includesAny(lowered, ["explosion", "fire", "burn"])) return "reacts as the environment erupts with energy";
  return "performs the core action described in the prompt";
}

function pickEnvironment(lowered) {
  if (includesAny(lowered, ["rain", "storm"])) return "rain-soaked atmosphere with reflective surfaces";
  if (includesAny(lowered, ["desert", "sand"])) return "vast desert landscape with heat haze";
  if (includesAny(lowered, ["forest", "woods"])) return "dense natural environment with layered depth";
  if (includesAny(lowered, ["space", "ship", "planet"])) return "high-detail science fiction environment";
  if (includesAny(lowered, ["city", "neon", "street"])) return "urban cinematic location with practical lights";
  if (includesAny(lowered, ["room", "apartment", "house"])) return "intimate interior space with visible production design";
  return "cinematic environment implied by the prompt";
}

function pickLighting(lowered, genre) {
  if (includesAny(lowered, ["night", "noir", "shadow"])) return "low-key contrast lighting with deep shadows";
  if (includesAny(lowered, ["sunset", "golden hour"])) return "golden hour backlight with soft rim highlights";
  if (includesAny(lowered, ["neon", "cyberpunk"])) return "neon practical lighting with colored reflections";
  if (includesAny(lowered, ["rain", "storm"])) return "moody diffused light with wet specular highlights";
  if (genre === "horror" || genre === "thriller") return "motivated low-key lighting with controlled darkness";
  if (genre === "romance") return "soft warm light with gentle skin tones";
  return "premium cinematic lighting with dimensional contrast";
}

function pickShotType(lowered) {
  if (includesAny(lowered, ["close-up", "closeup", "tear", "face"])) return "emotional close-up";
  if (includesAny(lowered, ["wide", "vista", "battle", "landscape"])) return "wide establishing shot";
  if (includesAny(lowered, ["drone", "aerial"])) return "aerial tracking shot";
  if (includesAny(lowered, ["over the shoulder", "dialogue"])) return "over-the-shoulder medium shot";
  return "cinematic medium-wide shot";
}

function pickMotionIntent(lowered) {
  if (includesAny(lowered, ["fight", "battle", "chase", "running", "explosion", "attack", "escape"])) {
    return "dynamic action motion with strong subject movement";
  }
  if (includesAny(lowered, ["dialogue", "whisper", "emotional", "cry", "tear", "storytelling"])) {
    return "subtle performance motion with emotional continuity";
  }
  if (includesAny(lowered, ["epic", "dramatic", "cinematic", "sweeping"])) {
    return "grand cinematic movement with dramatic camera emphasis";
  }
  return "natural cinematic motion that preserves the hero frame composition";
}

function pickLens(shotType, genre) {
  if (shotType.includes("close")) return "85mm cinematic portrait lens, shallow depth of field";
  if (shotType.includes("wide") || genre === "epic") return "24mm anamorphic lens, expansive depth";
  if (genre === "noir" || genre === "thriller") return "50mm lens with controlled compression";
  return "35mm anamorphic lens, filmic depth of field";
}

export function expandScene(prompt, options = {}) {
  const scene = String(prompt || "").trim();
  const lowered = scene.toLowerCase();
  const genre = String(options.genre || "general").toLowerCase();
  const camera = String(options.camera || "auto").toLowerCase();
  const shotType = pickShotType(lowered);

  return {
    scene,
    subject: pickSubject(scene, lowered),
    action: pickAction(lowered),
    environment: pickEnvironment(lowered),
    lighting: pickLighting(lowered, genre),
    mood: GENRE_MOODS[genre] || GENRE_MOODS.general,
    cameraMovement: CAMERA_MOVEMENTS[camera] || CAMERA_MOVEMENTS.auto,
    lens: pickLens(shotType, genre),
    shotType,
    motionIntent: pickMotionIntent(lowered),
    negativePrompt:
      "low quality, blurry, distorted anatomy, warped face, flicker, jitter, unstable camera, text, watermark, logo, bad hands, duplicate limbs",
  };
}
