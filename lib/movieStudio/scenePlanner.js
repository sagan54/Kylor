const NEGATIVE_PROMPT =
  "cartoon, anime, illustration, CGI, 3D render, plastic skin, waxy face, beauty filter, over-smoothed skin, low detail face, distorted eyes, deformed hands, extra fingers, bad anatomy, warped body, duplicated person, multiple faces, identity drift, changing clothes, changing hairstyle, flicker, jitter, unstable camera, melting objects, morphing face, unrealistic motion, floating body, broken limbs, low resolution, blurry, text, watermark, logo";

const CINEMATIC_PRESETS = {
  ACTION: {
    mood: "tense, kinetic, high-stakes, adrenaline-driven",
    cameraMovement: "low-angle stabilized tracking shot, slow push forward with subtle handheld energy",
    lighting: "hard rim light, dramatic contrast, practical highlights",
    motion: "grounded walking, running, or fighting motion with realistic weight and impact",
    colorPalette: "steel blues, hot practical highlights, controlled deep blacks",
  },
  DRAMA: {
    mood: "intimate, restrained, emotionally grounded",
    cameraMovement: "slow dolly push-in",
    lighting: "soft directional key light, natural falloff",
    motion: "subtle breathing, small facial movement, emotional micro-expression",
    colorPalette: "warm skin tones, gentle shadows, muted natural colors",
  },
  HORROR: {
    mood: "ominous, tense, unsettling, suspenseful",
    cameraMovement: "slow creeping dolly, slight handheld unease",
    lighting: "low-key lighting, deep shadows, motivated practical light",
    motion: "slow cautious movement with atmospheric fog movement",
    colorPalette: "cold shadows, sickly practical highlights, desaturated contrast",
  },
  SCIFI: {
    mood: "sleek, futuristic, mysterious, immersive",
    cameraMovement: "smooth tracking shot through neon-lit environment",
    lighting: "neon reflections, wet pavement, volumetric haze",
    motion: "subtle tech ambience, drifting steam, glowing signs, realistic reflections",
    colorPalette: "cyan, magenta, sodium vapor, wet black surfaces",
  },
  EPIC_WAR: {
    mood: "grand, mythic, urgent, large-scale",
    cameraMovement: "wide cinematic tracking or crane movement",
    lighting: "large scale atmospheric backlight, smoke diffusion",
    motion: "dust, smoke, flags, distant movement, grounded subject motion",
    colorPalette: "smoky amber, ash gray, weathered earth tones",
  },
  FANTASY: {
    mood: "mythic, wondrous, dramatic, grounded in physical reality",
    cameraMovement: "elegant dolly or crane movement with restrained wonder",
    lighting: "soft magical practical glow mixed with real atmospheric backlight",
    motion: "cloak and fabric movement, drifting mist, grounded character motion",
    colorPalette: "deep forest greens, burnished gold, moonlit blues",
  },
  GENERAL: {
    mood: "cinematic, polished, immersive, realistic",
    cameraMovement: "controlled cinematic dolly with natural handheld texture",
    lighting: "premium cinematic lighting with dimensional contrast",
    motion: "natural subject motion, subtle breathing, cloth movement, realistic weight",
    colorPalette: "filmic neutrals, rich blacks, restrained color contrast",
  },
};

const CAMERA_OVERRIDES = {
  "dolly in": "slow dolly push-in with stable, motivated movement",
  "dolly out": "slow dolly pullback revealing more of the environment",
  "pan left": "controlled pan left with stable horizon and cinematic pacing",
  "pan right": "controlled pan right with stable horizon and cinematic pacing",
  "crane up": "rising crane movement revealing scale and atmosphere",
  "crane down": "descending crane movement into the subject with strong depth",
  handheld: "subtle handheld camera energy, realistic operator movement, not shaky",
  auto: null,
};

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function cleanPrompt(prompt) {
  return String(prompt || "").replace(/\s+/g, " ").trim();
}

function detectPreset(lowered, genre) {
  if (includesAny(lowered, ["war", "battlefield", "soldier", "army", "battle", "tank", "trench"])) {
    return "EPIC_WAR";
  }
  if (includesAny(lowered, ["sci-fi", "scifi", "cyberpunk", "neon", "robot", "android", "spaceship", "future"])) {
    return "SCIFI";
  }
  if (includesAny(lowered, ["horror", "haunted", "monster", "killer", "demon", "terrifying", "thriller"])) {
    return "HORROR";
  }
  if (includesAny(lowered, ["fantasy", "dragon", "wizard", "castle", "kingdom", "elf", "magic"])) {
    return "FANTASY";
  }
  if (includesAny(lowered, ["fight", "chase", "explosion", "running", "gunfire", "combat", "attack", "escape"])) {
    return "ACTION";
  }
  if (includesAny(lowered, ["emotional", "sad", "sadness", "cry", "tear", "romance", "kiss", "embrace", "drama"])) {
    return "DRAMA";
  }

  switch (String(genre || "").toLowerCase()) {
    case "action":
      return "ACTION";
    case "horror":
    case "thriller":
      return "HORROR";
    case "scifi":
      return "SCIFI";
    case "epic":
      return "EPIC_WAR";
    case "romance":
    case "drama":
      return "DRAMA";
    default:
      return "GENERAL";
  }
}

function pickSubject(prompt, lowered) {
  const firstClause = prompt.split(/[,.]/)[0]?.trim();
  if (includesAny(lowered, ["warrior", "knight"])) return "a battle-worn warrior";
  if (includesAny(lowered, ["soldier", "marine"])) return "a weathered soldier";
  if (includesAny(lowered, ["woman", "girl"])) return "the central woman";
  if (includesAny(lowered, ["man", "boy"])) return "the central man";
  if (includesAny(lowered, ["robot", "android", "cyborg"])) return "a realistic synthetic character";
  if (includesAny(lowered, ["creature", "monster", "dragon"])) return "a powerful creature";
  if (includesAny(lowered, ["city", "street", "alley"])) return "the central figure within the city";
  return firstClause || "the main subject";
}

function pickAction(lowered) {
  if (includesAny(lowered, ["fight", "combat", "duel"])) return "locked in a grounded physical confrontation";
  if (includesAny(lowered, ["chase", "running", "run", "escape"])) return "moving urgently through the scene";
  if (includesAny(lowered, ["explosion", "fireball", "blast"])) return "reacting to a powerful practical explosion";
  if (includesAny(lowered, ["cry", "tear", "grief", "sad"])) return "holding back emotion in a quiet dramatic beat";
  if (includesAny(lowered, ["kiss", "embrace", "romance"])) return "sharing a restrained intimate moment";
  if (includesAny(lowered, ["walk", "walking"])) return "walking with purpose and natural weight";
  return "performing the core action described by the prompt";
}

function pickEnvironment(lowered) {
  if (includesAny(lowered, ["rain", "storm", "wet"])) return "rain-soaked practical location with reflective wet surfaces";
  if (includesAny(lowered, ["snow", "blizzard", "ice"])) return "cold snow-covered environment with visible breath and drifting snow";
  if (includesAny(lowered, ["desert", "sand", "dune"])) return "wide desert location with heat haze and wind-blown dust";
  if (includesAny(lowered, ["forest", "woods", "jungle"])) return "layered natural environment with deep background texture";
  if (includesAny(lowered, ["battlefield", "war", "trench"])) return "smoky battlefield with practical debris and distant movement";
  if (includesAny(lowered, ["city", "street", "alley", "neon"])) return "urban practical location with depth, reflections, and lived-in detail";
  if (includesAny(lowered, ["spaceship", "space station", "planet"])) return "tactile science fiction environment with practical set detail";
  if (includesAny(lowered, ["castle", "kingdom", "temple"])) return "ancient cinematic location with textured stone and atmospheric scale";
  if (includesAny(lowered, ["room", "apartment", "house", "interior"])) return "intimate interior location with believable production design";
  return "a believable cinematic location matching the user's prompt";
}

function pickTimeOfDay(lowered) {
  if (includesAny(lowered, ["night", "midnight"])) return "night";
  if (includesAny(lowered, ["sunset", "golden hour", "dusk"])) return "golden hour";
  if (includesAny(lowered, ["sunrise", "dawn"])) return "dawn";
  if (includesAny(lowered, ["noon", "daylight", "day"])) return "daylight";
  return "cinematic motivated time of day";
}

function pickShotType(lowered, presetName) {
  if (includesAny(lowered, ["close-up", "closeup", "close up", "tear", "face", "eyes"])) return "intimate close-up";
  if (includesAny(lowered, ["wide", "vista", "landscape", "battlefield", "army"])) return "wide establishing shot";
  if (includesAny(lowered, ["drone", "aerial"])) return "aerial tracking shot";
  if (includesAny(lowered, ["tracking", "follow"])) return "tracking medium-wide shot";
  if (includesAny(lowered, ["over the shoulder", "dialogue"])) return "over-the-shoulder medium shot";
  if (presetName === "EPIC_WAR") return "wide cinematic battlefield shot";
  if (presetName === "DRAMA") return "intimate medium close-up";
  return "cinematic medium-wide shot";
}

function pickLens(shotType, presetName) {
  if (shotType.includes("close")) return "85mm anamorphic lens, shallow depth of field";
  if (shotType.includes("wide") || shotType.includes("aerial") || presetName === "EPIC_WAR") {
    return "35mm anamorphic lens with cinematic scale";
  }
  if (presetName === "HORROR") return "50mm anamorphic lens with controlled compression";
  return "40mm anamorphic lens, natural perspective and filmic depth";
}

function pickFraming(shotType) {
  if (shotType.includes("close")) return "tight framing with eyes sharp and background falling away";
  if (shotType.includes("wide")) return "wide frame with strong foreground, midground, and background layers";
  if (shotType.includes("aerial")) return "high cinematic framing that reveals geography and scale";
  return "balanced rule-of-thirds framing with the subject clearly staged in depth";
}

function pickComposition(shotType, presetName) {
  if (presetName === "ACTION") return "diagonal action lines, clear silhouette, practical debris framing the subject";
  if (presetName === "DRAMA") return "clean negative space, emotionally readable face, soft background separation";
  if (presetName === "HORROR") return "uneasy negative space, deep shadow pockets, subject isolated in frame";
  if (presetName === "EPIC_WAR") return "layered scale with foreground texture, distant silhouettes, smoke depth";
  if (shotType.includes("wide")) return "epic layered composition with strong environmental scale";
  return "cinematic composition with clear subject priority and depth separation";
}

function pickAtmosphere(lowered, presetName) {
  const parts = [];
  if (includesAny(lowered, ["rain", "storm", "wet"])) parts.push("rain streaks, wet reflections, drifting mist");
  if (includesAny(lowered, ["snow", "blizzard"])) parts.push("falling snow, cold breath, wind movement");
  if (includesAny(lowered, ["fire", "explosion", "burn"])) parts.push("practical firelight, smoke, floating ash");
  if (includesAny(lowered, ["smoke", "fog", "mist"])) parts.push("volumetric smoke and haze");
  if (includesAny(lowered, ["dust", "desert", "battlefield"])) parts.push("wind-blown dust and suspended particles");
  if (includesAny(lowered, ["neon", "cyberpunk", "city"])) parts.push("neon reflections and wet pavement glow");
  if (!parts.length && presetName === "EPIC_WAR") parts.push("smoke diffusion, distant dust, atmospheric backlight");
  if (!parts.length && presetName === "HORROR") parts.push("thin fog, stale air, practical light falloff");
  if (!parts.length) parts.push("subtle atmospheric haze and realistic practical texture");
  return parts.join(", ");
}

function pickProductionDesign(lowered, presetName) {
  if (presetName === "SCIFI") return "tactile futuristic set pieces, practical light panels, worn metal, real reflections";
  if (presetName === "EPIC_WAR") return "weathered uniforms, practical debris, smoke, mud, flags, lived-in battlefield detail";
  if (presetName === "FANTASY") return "aged stone, real fabric, worn leather, practical props, grounded fantasy texture";
  if (includesAny(lowered, ["rain", "street", "city"])) return "wet asphalt, practical signage, real wardrobe texture, lived-in urban detail";
  if (presetName === "DRAMA") return "minimal believable set dressing, real fabric, natural skin texture, practical interior detail";
  return "real-world production design, practical props, textured wardrobe, believable environment detail";
}

function buildPhysicalMotion(preset, presetName, lowered) {
  if (presetName === "ACTION") {
    return "dynamic but stable motion, realistic foot contact, visible weight shifts, believable impacts, controlled momentum";
  }
  if (presetName === "DRAMA") {
    return "subtle breathing, small eye movement, micro-expression, tiny posture shifts, natural stillness";
  }
  if (presetName === "EPIC_WAR") {
    return "grounded subject motion with drifting smoke, dust, flags, and distant figures moving at realistic scale";
  }
  if (includesAny(lowered, ["walk", "walking"])) return "natural walking rhythm, grounded steps, cloth reacting to body movement";
  return preset.motion;
}

function buildHeroFramePrompt(plan) {
  return [
    `Ultra realistic Hollywood film still of ${plan.subject} ${plan.action} in ${plan.environment}.`,
    `Shot type: ${plan.shotType}.`,
    `Camera: ${plan.lens}, ${plan.framing}, ${plan.composition}.`,
    `Lighting: ${plan.lighting}.`,
    `Mood: ${plan.mood}.`,
    `Color palette: ${plan.colorPalette}.`,
    `Atmosphere: ${plan.atmosphere}.`,
    `Production design: ${plan.productionDesign}.`,
    "Realistic physical details, natural skin texture, real fabric, real wet surfaces, real smoke, cinematic depth, strong foreground/midground/background separation.",
    "Shot on ARRI Alexa 65, anamorphic lens, filmic contrast, subtle film grain, high dynamic range, cinematic composition, realistic motion-ready pose.",
    "No CGI look, no plastic skin, no over-smoothed face, no cartoon, no digital painting.",
    `Creative intent from user prompt: ${plan.originalPrompt}.`,
  ].join(" ");
}

function buildVideoMotionPrompt(plan, presetName) {
  const actionLine =
    presetName === "ACTION"
      ? "Keep the movement dynamic but stable, with realistic impact, believable momentum, and no chaotic warping."
      : presetName === "DRAMA"
        ? "Use a slow push-in, micro expression, subtle breathing, shallow depth of field, and controlled motion."
        : presetName === "EPIC_WAR"
          ? "Use slow crane, dolly, or drone motion that reveals scale while atmosphere moves through the frame."
          : "";

  return [
    "Animate this shot like a real Hollywood movie scene.",
    `Camera movement: ${plan.cameraMovement}.`,
    `Subject motion: ${plan.physicalMotion}.`,
    `Environmental motion: ${plan.atmosphere}.`,
    "Keep identity, clothing, face, body shape, and environment consistent with the first frame.",
    "Use realistic body mechanics, natural weight, subtle head movement, breathing, cloth movement, and grounded motion.",
    "Maintain cinematic lighting and composition.",
    actionLine,
    "Do not morph the face. Do not change outfit. Do not add extra people. Do not warp hands. Do not change the scene.",
    `Original user intent: ${plan.originalPrompt}.`,
  ].filter(Boolean).join(" ");
}

export function expandScene(prompt, options = {}) {
  const originalPrompt = cleanPrompt(prompt);
  const lowered = originalPrompt.toLowerCase();
  const requestedGenre = String(options.genre || "general").toLowerCase();
  const presetName = detectPreset(lowered, requestedGenre);
  const preset = CINEMATIC_PRESETS[presetName] || CINEMATIC_PRESETS.GENERAL;
  const cameraKey = String(options.camera || "auto").toLowerCase();
  const shotType = pickShotType(lowered, presetName);

  const plan = {
    originalPrompt,
    scene: originalPrompt,
    genre: requestedGenre,
    cinematicPreset: presetName,
    subject: pickSubject(originalPrompt, lowered),
    action: pickAction(lowered),
    environment: pickEnvironment(lowered),
    timeOfDay: pickTimeOfDay(lowered),
    mood: preset.mood,
    lighting: preset.lighting,
    colorPalette: preset.colorPalette,
    cameraMovement: CAMERA_OVERRIDES[cameraKey] || preset.cameraMovement,
    shotType,
    lens: pickLens(shotType, presetName),
    framing: pickFraming(shotType),
    composition: pickComposition(shotType, presetName),
    depthOfField: shotType.includes("close")
      ? "very shallow depth of field with natural focus falloff"
      : "cinematic depth with clear foreground, midground, and background separation",
    motionIntent: presetName === "ACTION"
      ? "dynamic action motion with stable cinematic camera control"
      : presetName === "DRAMA"
        ? "subtle emotional performance motion"
        : presetName === "EPIC_WAR"
          ? "large-scale cinematic motion with environmental atmosphere"
          : "grounded cinematic motion that preserves the hero frame composition",
    physicalMotion: buildPhysicalMotion(preset, presetName, lowered),
    atmosphere: pickAtmosphere(lowered, presetName),
    productionDesign: pickProductionDesign(lowered, presetName),
    realismNotes:
      "photoreal human detail, grounded body mechanics, real material response, natural lighting behavior, no generic AI smoothness",
    negativePrompt: NEGATIVE_PROMPT,
  };

  plan.heroFramePrompt = buildHeroFramePrompt(plan);
  plan.videoMotionPrompt = buildVideoMotionPrompt(plan, presetName);

  return plan;
}
