import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_TYPES, IMAGE_ORDER, PACK_VIEWS } from "../../../lib/character-constants";
import { INSTANTID_MODEL } from "../../../lib/image-generation-rules";
import { after } from "next/server";
import sharp from "sharp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const JOB_TIMEOUT_MS = 3 * 60 * 1000;
const STALE_PACK_JOB_MS = 10 * 60 * 1000;
const INTER_VIEW_COOLDOWN_MS = 11000;
const MODEL = INSTANTID_MODEL;

const REQUIRED_PACK_VIEWS = [
  IMAGE_TYPES.FRONT,
  IMAGE_TYPES.CLOSEUP,
  IMAGE_TYPES.RIGHT,
  IMAGE_TYPES.LEFT,
  IMAGE_TYPES.BACK,
];

const GENERATION_VIEW_ORDER = [
  IMAGE_TYPES.FRONT,
  IMAGE_TYPES.CLOSEUP,
  IMAGE_TYPES.RIGHT,
  IMAGE_TYPES.LEFT,
  IMAGE_TYPES.BACK,
];

function getModelForView(viewType) {
  void viewType;
  return MODEL;
}

function shouldEvaluateViewOnFirstPass(viewType) {
  void viewType;
  return false;
}

function shouldRepairFailedView(failedView) {
  if (!failedView || failedView.accepted) return false;
  return REQUIRED_PACK_VIEWS.includes(failedView.type);
}

const STORAGE_BUCKET = "character-refs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EVALUATOR_MODEL = process.env.EVALUATOR_MODEL || "gpt-4.1-mini";

function normalizeReferenceImage(image) {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;

  return null;
}

function mapSizeToAspectRatio(size) {
  switch (size) {
    case "1024x1536":
      return "2:3";
    case "1536x1024":
      return "16:9";
    case "1024x1024":
      return "1:1";
    default:
      return "1:1";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowMs() {
  return Date.now();
}

function getTimeMs(value) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function isProviderRateLimitError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("429")
  );
}

function isProviderBillingError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    msg.includes("insufficient credit") ||
    msg.includes("credits") ||
    msg.includes("balance") ||
    msg.includes("payment required") ||
    msg.includes("402")
  );
}

function getReplicateRetryAfterMs(err) {
  const msg = String(err?.message || err || "");
  const match =
    msg.match(/retry_after["']?\s*:\s*(\d+)/i) ||
    msg.match(/retry after["']?\s*:\s*(\d+)/i) ||
    msg.match(/resets in ~?(\d+)s/i);

  if (!match) return null;

  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  return seconds * 1000;
}

function formatReplicateRateLimitMessage(err) {
  const retryAfterMs = getReplicateRetryAfterMs(err);
  const retryAfterSeconds = retryAfterMs
    ? Math.max(1, Math.ceil(retryAfterMs / 1000))
    : 10;

  return `Replicate rate limit hit. Wait about ${retryAfterSeconds} seconds and try again.`;
}

function shouldStopPackEarly(err) {
  return isProviderRateLimitError(err) || isProviderBillingError(err);
}

async function runProviderWithBackoff(fn, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const retryAfterMs = getReplicateRetryAfterMs(lastError);
        await sleep(retryAfterMs || INTER_VIEW_COOLDOWN_MS);
      }
      return await fn();
    } catch (err) {
      lastError = err;

      if (isProviderBillingError(err)) {
        throw new Error(
          "Replicate credit/billing issue. Wait a few minutes after adding credit, then try again."
        );
      }

      if (isProviderRateLimitError(err) && attempt === maxRetries) {
        throw new Error(formatReplicateRateLimitMessage(err));
      }

      if (!isProviderRateLimitError(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

function getViewPrompt(viewKey) {
  switch (viewKey) {
    case IMAGE_TYPES.FRONT:
      return "front-facing full body of the same exact person, standing straight, neutral pose, relaxed arms, centered composition, plain studio-like framing";

    case IMAGE_TYPES.CLOSEUP:
      return "front-facing upper-body close portrait of the same exact person, chest-up framing, face clearly visible, highly recognizable identity, centered composition, plain studio-like framing";

    case IMAGE_TYPES.LEFT:
      return "strict left side profile portrait of the same exact person, upper-body framing, facing left, centered composition";

    case IMAGE_TYPES.RIGHT:
      return "strict right side profile portrait of the same exact person, upper-body framing, facing right, centered composition";

    case IMAGE_TYPES.BACK:
      return "back side profile portrait of the same exact person, upper-body framing, facing away from camera, centered composition";

    default:
      return "full body portrait of the same exact person, natural realistic photography";
  }
}

function mapSizeToDimensions(size) {
  switch (String(size || "").toLowerCase()) {
    case "1536x1024":
      return { width: 1024, height: 1536 };
    case "1024x1024":
      return { width: 1024, height: 1024 };
    case "1024x1536":
    default:
      return { width: 1024, height: 1536 };
  }
}

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = await fileOutputToUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof output?.url === "function") {
    const url = await output.url();
    return typeof url === "string" ? url : String(url || "");
  }

  if (typeof output?.url === "string") return output.url;
  if (typeof output?.href === "string") return output.href;

  if (output?.output) {
    return await fileOutputToUrl(output.output);
  }

  const asString = String(output || "").trim();
  if (asString.startsWith("http://") || asString.startsWith("https://")) {
    return asString;
  }

  return null;
}

function mapSizeToSeedreamImageSize(size) {
  switch (String(size || "").toLowerCase()) {
    case "1024x1024":
    case "square":
    case "1:1":
      return "square_hd";
    case "1536x1024":
    case "landscape":
    case "16:9":
      return "landscape_16_9";
    case "1024x1536":
    case "portrait":
    case "2:3":
    default:
      return "portrait_4_3";
  }
}

function buildShotInstruction(viewType) {
  switch (viewType) {
    case IMAGE_TYPES.FRONT:
      return [
        "Single person only.",
        "Front-facing full body.",
        "Standing straight, neutral pose, relaxed arms.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact facial identity.",
        "Full body visible from head to toe.",
        "Centered composition.",
      ].join(" ");

case IMAGE_TYPES.CLOSEUP:
  return [
    "Single person only.",
    "Front-facing upper-body close portrait.",
    "Chest-up framing.",
    "Face clearly visible and highly recognizable.",
    "Preserve exact facial identity.",
    "Centered composition.",
  ].join(" ");

case IMAGE_TYPES.LEFT:
  return [
    "Single person only.",
    "Strict LEFT side profile only.",
    "The subject must face LEFT.",
    "The nose must point to the LEFT edge of the frame.",
    "The chest, hips, knees, and feet must also face LEFT.",
    "Only the LEFT side of the face is visible.",
    "The RIGHT side of the face must not be visible.",
    "This must be a true 90-degree side profile.",
    "No three-quarter angle.",
    "No front angle.",
    "No almost-side angle.",
    "No mirrored right profile.",
    "Do not turn toward camera.",
    "Preserve exact identity from the same person.",
    "Preserve exact forehead slope, nose bridge, nose tip, lips, chin projection, jaw contour, ear shape, hairline, hairstyle, and sideburn shape.",
    "Upper-body portrait framing.",
    "Centered composition.",
  ].join(" ");

case IMAGE_TYPES.RIGHT:
  return [
    "Single person only.",
    "Strict RIGHT side profile only.",
    "The subject must face RIGHT.",
    "The nose must point to the RIGHT edge of the frame.",
    "The chest, hips, knees, and feet must also face RIGHT.",
    "Only the RIGHT side of the face is visible.",
    "The LEFT side of the face must not be visible.",
    "This must be a true 90-degree side profile.",
    "No three-quarter angle.",
    "No front angle.",
    "No almost-side angle.",
    "No mirrored left profile.",
    "Do not turn toward camera.",
    "Preserve exact identity from the same person.",
    "Preserve exact forehead slope, nose bridge, nose tip, lips, chin projection, jaw contour, ear shape, hairline, hairstyle, and sideburn shape.",
    "Upper-body portrait framing.",
    "Centered composition.",
  ].join(" ");

    case IMAGE_TYPES.BACK:
      return [
        "Single person only.",
        "Back side profile portrait.",
        "Facing away from camera.",
        "Upper-body portrait framing.",
        "Only the viewing angle changes.",
        "Identity, body type, hairstyle, hair length, neck, shoulders, silhouette, and outfit remain the same person.",
      ].join(" ");

    default:
      return [
        "Single person only.",
        "Keep the same exact identity.",
        "Natural realistic photography.",
      ].join(" ");
  }
}

function buildEvaluatorPrompt({ viewType }) {
  return `
You are evaluating a generated character consistency image.

STRICTLY classify the failure if any.

Evaluation categories (0–10):
- identityScore
- shotScore
- compositionScore
- qualityScore

Also detect:
- multiplePeople
- wrongShot
- faceNotVisible
- identityDrift
- lowQuality
- hairMismatch
- facingDirection

Determine ONE primary failureType:
- "identity_drift"
- "wrong_shot"
- "multiple_people"
- "face_not_visible"
- "low_quality"
- "bad_composition"
- "none"

Rules:
 - If face shape, jawline, nose, eyes, hairline, or hairstyle clearly differs from the MASTER identity image, treat it as identity_drift
- If identity does not match → identity_drift
- If wrong angle or wrong facing direction → wrong_shot
- If >1 person → multiple_people
- If face hidden → face_not_visible
- If blurry/artifacts → low_quality
- If framing bad → bad_composition
- If hair length, hair mass, hair silhouette, or hairstyle differs from the master/front identity anchor → hairMismatch = true
- For LEFT view, facingDirection must be "left"
- For RIGHT view, facingDirection must be "right"
- For FRONT view, facingDirection must be "front"
- For BACK view, facingDirection must be "back"
- LEFT and RIGHT profiles must be opposite directions, not duplicates
- If LEFT and RIGHT both appear to face the same direction, mark wrongShot = true
- If a LEFT view looks like a RIGHT view, failureType must be "wrong_shot"
- If a RIGHT view looks like a LEFT view, failureType must be "wrong_shot"
- For back view, face_not_visible is expected and should NOT be treated as a failure by itself
- If skin looks plastic, glossy, waxy, over-smoothed, or beauty-filtered → low_quality
Return STRICT JSON:

{
  "accepted": true,
  "identityScore": 0,
  "shotScore": 0,
  "compositionScore": 0,
  "qualityScore": 0,
  "finalScore": 0,
  "multiplePeople": false,
  "wrongShot": false,
  "faceNotVisible": false,
  "identityDrift": false,
  "lowQuality": false,
  "hairMismatch": false,
  "facingDirection": "front",
  "failureType": "none",
  "reason": ""
}

Target view: ${viewType}
`;
}

function buildPackCohesionPrompt() {
  return `
You are evaluating a full character consistency pack.

You will compare:
- MASTER identity image
- FRONT full-body
- LEFT profile full-body
- RIGHT profile full-body
- BACK full-body
- CLOSEUP portrait

Your job is to judge whether all images depict the SAME EXACT person across all views.

Evaluate:
- identityConsistencyScore
- silhouetteConsistencyScore
- hairstyleConsistencyScore
- facialConsistencyScore
- packCohesionScore

Also detect:
- identityMismatch
- hairstyleMismatch
- silhouetteMismatch
- weakViewType

weakViewType must be one of:
- "front"
- "left"
- "right"
- "back"
- "closeup"
- "none"

Rules:
- identityMismatch = true if one or more views appear to be a different person
- hairstyleMismatch = true if hairstyle/hairline/hair mass noticeably changes across views
- silhouetteMismatch = true if body proportions / shoulders / outline noticeably change
- weakViewType = the single worst view if one clearly weakens the pack, otherwise "none"

Return STRICT JSON only.
`;
}

function buildCharacterDnaPrompt() {
  return `
You are extracting a stable character identity profile ("character DNA") from a validated character consistency pack.

You will analyze:
- MASTER identity image
- FRONT full-body
- LEFT profile
- RIGHT profile
- BACK full-body
- CLOSEUP portrait

Your job:
Extract only stable identity traits that should remain consistent across future generations.

Focus on:
- faceShape
- jawline
- cheekStructure
- foreheadShape
- noseProfile
- eyeShape
- eyebrowShape
- lipShape
- chinShape
- earShape
- skinTone
- hairstyle
- hairline
- hairLength
- bodyBuild
- shoulderWidth
- neckShape
- silhouetteSummary
- distinguishingFeatures
- identitySummary

Also estimate:
- dnaConfidence
- bestAnchorViewTypes

bestAnchorViewTypes must be a list of view types most reliable for future identity locking.

Do not invent uncertain details.
Return strict JSON only.
`;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getEvaluatorSchema() {
  return {
    name: "character_pack_view_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        accepted: { type: "boolean" },
        identityScore: { type: "number" },
        shotScore: { type: "number" },
        compositionScore: { type: "number" },
        qualityScore: { type: "number" },
        finalScore: { type: "number" },

        multiplePeople: { type: "boolean" },
        wrongShot: { type: "boolean" },
        faceNotVisible: { type: "boolean" },
        identityDrift: { type: "boolean" },
        lowQuality: { type: "boolean" },
                hairMismatch: { type: "boolean" },
        facingDirection: {
          type: "string",
          enum: ["front", "left", "right", "back", "unknown"],
        },

        failureType: {
          type: "string",
          enum: [
            "none",
            "identity_drift",
            "wrong_shot",
            "multiple_people",
            "face_not_visible",
            "low_quality",
            "bad_composition",
          ],
        },

        reason: { type: "string" },
      },
      required: [
        "accepted",
        "identityScore",
        "shotScore",
        "compositionScore",
        "qualityScore",
        "finalScore",
        "multiplePeople",
        "wrongShot",
        "faceNotVisible",
        "identityDrift",
        "lowQuality",
        "hairMismatch",
        "facingDirection",
        "failureType",
        "reason",
      ],
    },
  };
}

function getPackCohesionSchema() {
  return {
    name: "character_pack_cohesion_evaluation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        accepted: { type: "boolean" },
        identityConsistencyScore: { type: "number" },
        silhouetteConsistencyScore: { type: "number" },
        hairstyleConsistencyScore: { type: "number" },
        facialConsistencyScore: { type: "number" },
        packCohesionScore: { type: "number" },

        identityMismatch: { type: "boolean" },
        hairstyleMismatch: { type: "boolean" },
        silhouetteMismatch: { type: "boolean" },

        weakViewType: {
          type: "string",
          enum: [
            IMAGE_TYPES.FRONT,
            IMAGE_TYPES.LEFT,
            IMAGE_TYPES.RIGHT,
            IMAGE_TYPES.BACK,
            IMAGE_TYPES.CLOSEUP,
            "none",
          ],
        },

        reason: { type: "string" },
      },
      required: [
        "accepted",
        "identityConsistencyScore",
        "silhouetteConsistencyScore",
        "hairstyleConsistencyScore",
        "facialConsistencyScore",
        "packCohesionScore",
        "identityMismatch",
        "hairstyleMismatch",
        "silhouetteMismatch",
        "weakViewType",
        "reason",
      ],
    },
  };
}

function getCharacterDnaSchema() {
  return {
    name: "character_dna_extraction",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        identitySummary: { type: "string" },

        faceShape: { type: "string" },
        jawline: { type: "string" },
        cheekStructure: { type: "string" },
        foreheadShape: { type: "string" },
        noseProfile: { type: "string" },
        eyeShape: { type: "string" },
        eyebrowShape: { type: "string" },
        lipShape: { type: "string" },
        chinShape: { type: "string" },
        earShape: { type: "string" },

        skinTone: { type: "string" },

        hairstyle: { type: "string" },
        hairline: { type: "string" },
        hairLength: { type: "string" },

        bodyBuild: { type: "string" },
        shoulderWidth: { type: "string" },
        neckShape: { type: "string" },
        silhouetteSummary: { type: "string" },

        distinguishingFeatures: {
          type: "array",
          items: { type: "string" },
        },

        bestAnchorViewTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              IMAGE_TYPES.FRONT,
              IMAGE_TYPES.LEFT,
              IMAGE_TYPES.RIGHT,
              IMAGE_TYPES.BACK,
              IMAGE_TYPES.CLOSEUP,
            ],
          },
        },

        dnaConfidence: { type: "number" },
      },
      required: [
        "identitySummary",
        "faceShape",
        "jawline",
        "cheekStructure",
        "foreheadShape",
        "noseProfile",
        "eyeShape",
        "eyebrowShape",
        "lipShape",
        "chinShape",
        "earShape",
        "skinTone",
        "hairstyle",
        "hairline",
        "hairLength",
        "bodyBuild",
        "shoulderWidth",
        "neckShape",
        "silhouetteSummary",
        "distinguishingFeatures",
        "bestAnchorViewTypes",
        "dnaConfidence",
      ],
    },
  };
}

function getExtensionFromContentType(contentType = "") {
  const type = String(contentType).toLowerCase();

  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";

  return "png";
}

function getPromptIntensity(attempt = 0) {
  if (attempt <= 0) {
    return {
      identityWeight: 1,
      shotWeight: 1,
      compositionWeight: 1,
      strictness: "normal",
    };
  }

  if (attempt === 1) {
    return {
      identityWeight: 1.25,
      shotWeight: 1.2,
      compositionWeight: 1.1,
      strictness: "high",
    };
  }

  return {
    identityWeight: 1.5,
    shotWeight: 1.4,
    compositionWeight: 1.25,
    strictness: "extreme",
  };
}

function getViewStrategy(viewType) {
  switch (viewType) {
    case IMAGE_TYPES.SHEET:
      return {
        identityPriority: "very_high",
        shotPriority: "high",
        compositionPriority: "high",
        cinematicPriority: "low",
      };

    case IMAGE_TYPES.FRONT:
      return {
        identityPriority: "high",
        shotPriority: "high",
        compositionPriority: "medium",
        cinematicPriority: "low",
      };

    case IMAGE_TYPES.LEFT:
    case IMAGE_TYPES.RIGHT:
      return {
        identityPriority: "very_high",
        shotPriority: "very_high",
        compositionPriority: "medium",
        cinematicPriority: "low",
      };

    case IMAGE_TYPES.BACK:
      return {
        identityPriority: "medium",
        shotPriority: "very_high",
        compositionPriority: "medium",
        cinematicPriority: "low",
      };

    case IMAGE_TYPES.CLOSEUP:
    case IMAGE_TYPES.CLOSEUP_LEFT:
    case IMAGE_TYPES.CLOSEUP_RIGHT:
      return {
        identityPriority: "very_high",
        shotPriority: "medium",
        compositionPriority: "high",
        cinematicPriority: "medium",
      };

    default:
      return {
        identityPriority: "high",
        shotPriority: "high",
        compositionPriority: "medium",
        cinematicPriority: "low",
      };
  }
}

function buildGlobalCharacterLockBlock() {
  return [
    "Hidden global character lock:",

    // 👇 OUTFIT LOCK
"The outfit must remain a plain white t-shirt and plain black pants in every generated pack view.",
"No logos, no graphics, no patterns, no printed shirt, no colored shirt, no shorts, no jeans shorts, no costume.",
"Do not copy outfit from uploaded reference images.",
"Ignore clothing from source images completely.",
"Only preserve the person's identity, body, face, hairstyle, and proportions.",

"",

"Hair continuity lock:",
"Hairstyle, hair length, hair volume, hair density, hairline, sideburns, and overall hair silhouette must remain identical across all pack views.",
"Do not lengthen the hair in side views or back view.",
"Do not shorten the hair in front view or close-up.",
"Do not add extra hair mass, extra layers, mullet shape, ponytail shape, or extended back hair unless clearly present in the approved identity anchor.",
"Hair must remain the same person, same cut, same length, same structure in every generated image.",
    "Do not copy outfit from uploaded reference images.",
    "Ignore clothing from source images completely.",
    "Only preserve the person's identity, body, face, hairstyle, and proportions.",

    "",

    // 👇 BACKGROUND LOCK (NEW 🔥)
    "Background must be a clean, neutral studio background.",
    "Use a light grey or soft grey background only.",
    "Do not use pure white background.",
    "Do not use dark background.",
    "Do not use colored background.",
    "Background must be consistent across all views.",
    "Keep background simple, flat, and non-distracting.",
    "Ensure clear contrast between subject and background.",

    "",

    // 👇 SKIN REALISM LOCK
    "Skin realism lock:",
"Skin must be natural, matte, and realistic.",
"Preserve natural pores and subtle real skin texture.",
"Skin must be clean, smooth, and healthy.",
"Do not generate acne, pimples, skin spots, blemishes, or facial marks.",
"Do not introduce any new skin defects not present in the reference.",
"Maintain natural skin texture WITHOUT imperfections.",
"Do not introduce new facial marks that are not visible in the reference image.",
"Maintain realistic skin variation without artificial imperfections.",
"Do not over-smooth skin.",
"Do not beauty-retouch the face.",
    "Do not apply glamour lighting, cosmetic skin cleanup, or commercial skincare-ad style rendering.",
    "Do not make the face look airbrushed, filtered, polished, or hyper-beautified.",
    
    "",
"Side-profile direction lock:",
"LEFT profile and RIGHT profile must be true opposite directions.",
"LEFT profile must face left only.",
"RIGHT profile must face right only.",
"Do not duplicate the same side for both images.",
"Do not mirror one side profile into the other.",
  ].join(" ");
}

function buildStableCharacterLockBlock() {
  return [
    "Hidden global character lock:",
    "Preserve the same exact face, jawline, cheek structure, forehead, eye spacing, nose shape, lip shape, chin, ears, skin tone, hairstyle, hairline, sideburns, neck, shoulders, and body proportions in every pack view.",
    "",
    "Outfit lock:",
    "The outfit must remain a plain white t-shirt and plain black pants in every generated pack view.",
    "No logos, graphics, patterns, costume changes, printed shirt, or colored shirt.",
    "Use reference images for identity only, not for clothing.",
    "",
    "Hair continuity lock:",
    "Hairstyle, hair length, hair volume, hair density, hairline, sideburn shape, and overall hair silhouette must remain identical across all pack views.",
    "Do not add extra hair mass, remove hair volume, change the parting, or alter the hairline unless clearly visible in the approved master identity.",
    "",
    "Background lock:",
    "Background must be a clean neutral studio background with consistent simple lighting across all views.",
    "Keep the background flat, non-distracting, and easy to evaluate.",
    "",
    "Skin realism lock:",
    "Skin must stay natural and realistic with subtle real texture.",
    "Do not beauty-retouch, airbrush, glamorize, polish, or beautify the face.",
    "Do not invent new blemishes, acne, marks, or spots not visible in the master identity image.",
    "Do not remove distinctive identity features visible in the master identity image.",
    "",
    "Side-profile direction lock:",
    "LEFT profile and RIGHT profile must be true opposite directions.",
    "LEFT profile must face left only.",
    "RIGHT profile must face right only.",
    "Do not duplicate the same side profile twice and do not mirror one side into the other.",
  ].join(" ");
}

function buildAdaptiveIdentityBlock({
  hasRefs,
  viewType,
  attempt = 0,
  failureType = "none",
}) {
  const intensity = getPromptIntensity(attempt);
  const strategy = getViewStrategy(viewType);

  const lines = [];

  if (!hasRefs) {
    lines.push(
      "Create one stable realistic human identity.",
      "Keep facial structure, hairstyle, skin tone, body shape, and proportions internally consistent."
    );
  } else {
    lines.push(
      "This must remain the SAME EXACT person from the reference images.",
      "Do not generate a similar person. Do not reinterpret identity.",
      "Preserve exact face shape, skull shape, jawline, cheek structure, forehead, brow line, eyebrow shape, eye shape, eyelids, nose bridge, nose tip, nostrils, lips, chin, ears, skin tone, hairstyle, hairline, and body proportions.",
      "Master reference identity overrides any generic beauty, fashion, or portrait tendencies from the model."
    );
  }

  if (strategy.identityPriority === "very_high") {
    lines.push(
      "Identity preservation is the highest priority for this shot.",
      "Even if angle changes, the person must remain unmistakably the same human being."
    );
  }

  if (
    viewType === IMAGE_TYPES.LEFT ||
    viewType === IMAGE_TYPES.RIGHT ||
    viewType === IMAGE_TYPES.CLOSEUP_LEFT ||
    viewType === IMAGE_TYPES.CLOSEUP_RIGHT
  ) {
    lines.push(
      "Preserve side-profile identity markers exactly: forehead slope, nose projection, nose bridge, lip projection, chin projection, jaw contour, ear shape, and hairline."
    );
  }

  if (
    viewType === IMAGE_TYPES.CLOSEUP ||
    viewType === IMAGE_TYPES.CLOSEUP_LEFT ||
    viewType === IMAGE_TYPES.CLOSEUP_RIGHT
  ) {
    lines.push(
      "Close-up must be highly recognizable and unmistakably the same person.",
      "Facial identity must be preserved with maximum accuracy."
    );
  }

  if (viewType === IMAGE_TYPES.BACK) {
    lines.push(
      "For back view, preserve hairstyle, hair density, hair length, neck shape, shoulder width, body silhouette, and outfit continuity exactly."
    );
  }

  lines.push(
    "Hair consistency is mandatory. Keep the same hairline, front hair shape, side volume, crown volume, and sideburn structure across every view."
  );

  if (failureType === "identity_drift") {
    lines.push(
      "Correct previous identity drift.",
      "Preserve the exact same person with much stronger facial identity locking."
    );
  }

  if (intensity.strictness === "high" || intensity.strictness === "extreme") {
    lines.push(
      "Do not beautify, glamorize, stylize, age-shift, ethnicity-shift, or redesign the face.",
      "Do not change skin texture, facial proportions, or hairstyle identity."
    );
  }

  if (intensity.strictness === "extreme") {
    lines.push(
      "Absolute identity lock: no creative reinterpretation is allowed.",
      "Similarity is not enough; exact identity match is required."
    );
  }

  return lines.join(" ");
}

function buildAdaptiveShotBlock({
  viewType,
  attempt = 0,
  failureType = "none",
}) {
  const intensity = getPromptIntensity(attempt);
  const lines = [buildShotInstruction(viewType)];

  if (failureType === "wrong_shot") {
    lines.push(
      "Correct the shot angle strictly.",
      "Do not approximate the requested angle.",
      "The camera angle must exactly match the requested view."
    );
  }

if (viewType === IMAGE_TYPES.LEFT) {
  lines.push(
    "Mandatory direction rule: the person must face LEFT.",
    "Nose must point LEFT.",
    "Torso must face LEFT.",
    "Feet must face LEFT.",
    "Only the left facial contour may be visible.",
    "This must be a true left profile, not an approximate side angle.",
    "Do not mirror the right profile.",
    "If the pose resembles a right profile, it is incorrect."
  );
}

if (viewType === IMAGE_TYPES.RIGHT) {
  lines.push(
    "Mandatory direction rule: the person must face RIGHT.",
    "Nose must point RIGHT.",
    "Torso must face RIGHT.",
    "Feet must face RIGHT.",
    "Only the right facial contour may be visible.",
    "This must be a true right profile, not an approximate side angle.",
    "Do not mirror the left profile.",
    "If the pose resembles a left profile, it is incorrect."
  );
}

if (viewType === IMAGE_TYPES.CLOSEUP_LEFT) {
  lines.push(
    "Mandatory direction rule: the person must face LEFT.",
    "Only the left facial contour may be visible.",
    "This must be a true left profile portrait, not a three-quarter portrait."
  );
}

if (viewType === IMAGE_TYPES.CLOSEUP_RIGHT) {
  lines.push(
    "Mandatory direction rule: the person must face RIGHT.",
    "Only the right facial contour may be visible.",
    "This must be a true right profile portrait, not a three-quarter portrait."
  );
}

  if (viewType === IMAGE_TYPES.BACK) {
    lines.push("Subject must fully face away from camera.");
  }

  if (viewType === IMAGE_TYPES.FRONT) {
    lines.push("Subject must face directly toward camera.");
  }

  if (intensity.shotWeight >= 1.2) {
    lines.push(
      "Do not use an in-between angle.",
      "Do not rotate partially toward the camera unless the shot explicitly requires it."
    );
  }

  if (intensity.shotWeight >= 1.4) {
    lines.push(
      "Exact shot compliance is mandatory.",
      "Any deviation from the requested view is unacceptable."
    );
  }

  return lines.join(" ");
}

function buildAdaptiveCompositionBlock({
  viewType,
  attempt = 0,
  failureType = "none",
}) {
  const intensity = getPromptIntensity(attempt);
  const lines = [
    "Single person only.",
    "Centered composition.",
  ];

  if (viewType === IMAGE_TYPES.SHEET) {
    return [
      "Single character sheet only.",
      "Landscape 16:9 composition.",
      "Seven clearly separated panels with even spacing.",
      "Top row: four full-body views.",
      "Bottom row: three portrait views.",
      "No extra people, no duplicate bonus panels, no text labels, no border captions.",
    ].join(" ");
  }

  if (
    viewType === IMAGE_TYPES.CLOSEUP ||
    viewType === IMAGE_TYPES.CLOSEUP_LEFT ||
    viewType === IMAGE_TYPES.CLOSEUP_RIGHT
  ) {
    lines.push(
      "Tight portrait framing.",
      "Face fully visible and clearly readable."
    );
  } else {
    lines.push(
      "Full body visible from head to toe.",
      "No cropped head, no cropped feet, no partial body cutoff."
    );
  }

  if (failureType === "multiple_people") {
    lines.push(
      "Only one person may appear in the frame.",
      "No extra people, no duplicate subject, no background characters."
    );
  }

  if (failureType === "face_not_visible") {
    lines.push(
      "Face must remain clearly visible whenever identity verification is needed.",
      "Do not hide the face with hair, shadows, pose, cropping, or blur."
    );
  }

  if (failureType === "bad_composition") {
    lines.push(
      "Fix subject framing and centering.",
      "Keep the subject properly aligned and fully readable in frame."
    );
  }

  if (intensity.compositionWeight >= 1.2) {
    lines.push(
      "Composition must be clean, symmetrical, and easy to evaluate."
    );
  }

  return lines.join(" ");
}

function buildAdaptiveRepairBlock({
  viewType,
  failureType = "none",
  attempt = 0,
}) {
  const intensity = getPromptIntensity(attempt);
  const lines = [];

  if (failureType === "identity_drift") {
    lines.push(
      "Repair identity drift from the previous attempt.",
      "Match the exact same person from the references."
    );
  }

  if (failureType === "wrong_shot") {
    lines.push(
      `Repair shot mismatch for ${viewType}.`,
      "Use the exact requested camera/view angle."
    );
  }

  if (failureType === "multiple_people") {
    lines.push(
      "Repair subject duplication.",
      "Generate exactly one person only."
    );
  }

  if (failureType === "face_not_visible") {
    lines.push(
      "Repair hidden or unreadable face issue.",
      "Face visibility must be clear enough for identity verification."
    );
  }

  if (failureType === "low_quality") {
    lines.push(
      "Repair image quality issues.",
      "Remove blur, distortion, broken anatomy, artifacts, and rendering defects."
    );
  }

  if (failureType === "bad_composition") {
    lines.push(
      "Repair framing and composition issues.",
      "Keep the subject centered, complete, and clearly visible."
    );
  }

  if (intensity.strictness === "extreme") {
    lines.push(
      "This is a high-priority correction attempt.",
      "Follow all constraints strictly without creative deviation."
    );
  }

  return lines.join(" ");
}

function analyzeReferenceFusion({
  viewType,
  rankedCandidates = [],
  selectedRefs = [],
}) {
  const selectedCandidates = rankedCandidates.filter((item) =>
    selectedRefs.includes(item.url)
  );

  const selectedTypes = selectedCandidates.map((item) => item.type);

  const hasMaster = selectedTypes.includes("MASTER");
  const hasFront = selectedTypes.includes(IMAGE_TYPES.FRONT);
  const hasLeft = selectedTypes.includes(IMAGE_TYPES.LEFT);
  const hasRight = selectedTypes.includes(IMAGE_TYPES.RIGHT);
  const hasBack = selectedTypes.includes(IMAGE_TYPES.BACK);

  const faceHeavy =
    hasFront ||
    viewType === IMAGE_TYPES.CLOSEUP ||
    selectedTypes.includes(IMAGE_TYPES.LEFT) ||
    selectedTypes.includes(IMAGE_TYPES.RIGHT);

  const profileHeavy = hasLeft || hasRight;

  const silhouetteHeavy =
    hasBack ||
    viewType === IMAGE_TYPES.BACK ||
    (hasLeft && hasRight);

  const strongestIdentityScore =
    selectedCandidates.length > 0
      ? Math.max(...selectedCandidates.map((c) => Number(c.identityScore || 0)))
      : 0;

  const strongestQualityScore =
    selectedCandidates.length > 0
      ? Math.max(...selectedCandidates.map((c) => Number(c.qualityScore || 0)))
      : 0;

  return {
    selectedTypes,
    selectedCandidates,
    hasMaster,
    hasFront,
    hasLeft,
    hasRight,
    hasBack,
    faceHeavy,
    profileHeavy,
    silhouetteHeavy,
    strongestIdentityScore,
    strongestQualityScore,
  };
}

function buildReferenceFusionBlock({
  viewType,
  fusion,
}) {
  const lines = [];

  if (!fusion || !fusion.selectedTypes?.length) {
    return "";
  }

  lines.push(
    `Reference fusion mode active. Selected references: ${fusion.selectedTypes.join(", ")}.`
  );

  if (fusion.hasMaster) {
    lines.push(
      "Use the master image as the root identity anchor."
    );
    lines.push(
      "MASTER reference has highest authority for face shape, hairline, hairstyle, sideburns, skin tone, and recognizable likeness."
    );
  }

  if (fusion.hasFront) {
    lines.push(
      "Use the front reference as the primary facial identity anchor."
    );
  }

  if (fusion.hasLeft || fusion.hasRight) {
    lines.push(
      "Use side references to preserve profile geometry, nose projection, forehead slope, jaw contour, ear shape, and hairline consistency."
    );
  }

  if (fusion.silhouetteHeavy) {
    lines.push(
      "Preserve body silhouette, neck shape, shoulder width, hairstyle mass, and overall structural continuity."
    );
  }

  if (
    (viewType === IMAGE_TYPES.CLOSEUP ||
      viewType === IMAGE_TYPES.CLOSEUP_LEFT ||
      viewType === IMAGE_TYPES.CLOSEUP_RIGHT) &&
    fusion.faceHeavy
  ) {
    lines.push(
      "This shot is face-critical. Prioritize exact facial identity over all non-essential styling."
    );
  }

  if (
    (
      viewType === IMAGE_TYPES.LEFT ||
      viewType === IMAGE_TYPES.RIGHT ||
      viewType === IMAGE_TYPES.CLOSEUP_LEFT ||
      viewType === IMAGE_TYPES.CLOSEUP_RIGHT
    ) &&
    fusion.profileHeavy
  ) {
    lines.push(
      "This shot is profile-critical. Prioritize side-angle facial geometry and strict profile structure."
    );
  }

  if (viewType === IMAGE_TYPES.BACK && fusion.silhouetteHeavy) {
    lines.push(
      "This shot is silhouette-critical. Prioritize hair shape, body outline, shoulder structure, and back-view continuity."
    );
  }

  if (fusion.strongestIdentityScore >= 8.5) {
    lines.push(
      "Selected references are high-confidence identity anchors. Match them very closely."
    );
  }

  if (fusion.strongestQualityScore >= 8.5) {
    lines.push(
      "Selected references are high-quality visual anchors. Preserve their visual clarity and structural detail."
    );
  }

  return lines.join(" ");
}

function buildPackContextBlock({
  targetViewType,
  acceptedViewMap = {},
}) {
  const acceptedTypes = Object.keys(acceptedViewMap || {});
  if (!acceptedTypes.length) return "";

  const lines = [
    `Pack context available from accepted views: ${acceptedTypes.join(", ")}.`,
    "Maintain full cross-view identity consistency with the already accepted pack images.",
    "Hair continuity with accepted pack views is mandatory.",
    "Do not change hair length, hair mass, hair shape, hairline, sideburns, or back hair silhouette across views.",
  ];

  if (acceptedViewMap[IMAGE_TYPES.FRONT]?.url) {
    lines.push("The accepted front view is a strong pack anchor for facial identity.");
  }

  if (acceptedViewMap[IMAGE_TYPES.LEFT]?.url || acceptedViewMap[IMAGE_TYPES.RIGHT]?.url) {
    lines.push("Use accepted side views to preserve profile geometry and head structure.");
  }

  if (acceptedViewMap[IMAGE_TYPES.BACK]?.url) {
    lines.push("Use the accepted back view to preserve silhouette, hair mass, and rear structure continuity.");
  }

  if (targetViewType === IMAGE_TYPES.CLOSEUP) {
    lines.push("For this repair, prioritize exact face match with accepted pack identity.");
  }

  if (targetViewType === IMAGE_TYPES.BACK) {
    lines.push("For this repair, prioritize silhouette continuity with accepted pack structure.");
  }

  return lines.join(" ");
}

function buildIntelligentPrompt({
  prompt,
  hasRefs,
  viewType,
  negativePrompt = "",
  attempt = 0,
  failureType = "none",
  referenceFusion = null,
  packContextBlock = "",
}) {
  const identityBlock = buildAdaptiveIdentityBlock({
    hasRefs,
    viewType,
    attempt,
    failureType,
  });

  const shotBlock = buildAdaptiveShotBlock({
    viewType,
    attempt,
    failureType,
  });

  const compositionBlock = buildAdaptiveCompositionBlock({
    viewType,
    attempt,
    failureType,
  });

  const repairBlock = buildAdaptiveRepairBlock({
    viewType,
    failureType,
    attempt,
  });

  const fusionBlock = buildReferenceFusionBlock({
    viewType,
    fusion: referenceFusion,
  });

  const realismBlock = [
    "Highly realistic human photography.",
    "Natural skin texture, realistic pores, realistic hair strands, realistic facial detail.",
    "Grounded lighting and physically believable rendering.",
    "No CGI look, no 3D render look, no beauty-filtered skin.",
  ].join(" ");

return [
  buildStableCharacterLockBlock(),
  identityBlock,
  shotBlock,
  compositionBlock,
  repairBlock,
  fusionBlock,
  packContextBlock,
  realismBlock,

  "Absolute rule: skin must be clean with no acne or pimples under any condition.",

  `Shot request: ${String(prompt || "").trim()}`,
]
  .filter(Boolean)
  .join("\n\n");
}

function normalizeFailureType(value) {
  const allowed = new Set([
    "none",
    "identity_drift",
    "wrong_shot",
    "multiple_people",
    "face_not_visible",
    "low_quality",
    "bad_composition",
  ]);

  return allowed.has(value) ? value : "none";
}

function clampScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(10, n));
}

function normalizeModelScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;

  // If evaluator returns 0–1 scale, convert to 0–10
  const scaled = n <= 1 ? n * 10 : n;

  return Math.max(0, Math.min(10, scaled));
}

function getAdaptiveThresholds({
  viewType,
  attempt = 0,
  referenceFusion = null,
}) {
  let thresholds = {
    minIdentityScore: 7,
    minShotScore: 7,
    minCompositionScore: 6.5,
    minQualityScore: 6.5,
    minFinalScore: 7,
  };

  switch (viewType) {
case IMAGE_TYPES.FRONT:
  thresholds = {
    minIdentityScore: attempt === 0 ? 7.4 : 8.0,
    minShotScore: 7.4,
    minCompositionScore: 6.7,
    minQualityScore: 6.7,
    minFinalScore: 7.4,
  };
  break;

    case IMAGE_TYPES.LEFT:
    case IMAGE_TYPES.RIGHT:
      thresholds = {
        minIdentityScore: 7.5,
        minShotScore: 8.0,
        minCompositionScore: 6.8,
        minQualityScore: 6.8,
        minFinalScore: 7.5,
      };
      break;

    case IMAGE_TYPES.BACK:
      thresholds = {
        minIdentityScore: 6.8,
        minShotScore: 8.0,
        minCompositionScore: 6.8,
        minQualityScore: 6.8,
        minFinalScore: 7.2,
      };
      break;

case IMAGE_TYPES.CLOSEUP:
  thresholds = {
    minIdentityScore: 8.2,
    minShotScore: 7.0,
    minCompositionScore: 6.8,
    minQualityScore: 7.1,
    minFinalScore: 7.7,
  };
  break;
  }

  if (referenceFusion?.strongestIdentityScore >= 8.5) {
    thresholds.minIdentityScore += 0.2;
  }

  if (referenceFusion?.strongestQualityScore >= 8.5) {
    thresholds.minQualityScore += 0.2;
  }

  if (attempt >= 2) {
    thresholds.minCompositionScore -= 0.2;
    thresholds.minQualityScore -= 0.2;
  }

  thresholds.minIdentityScore = Math.max(6.5, Math.min(9.0, thresholds.minIdentityScore));
  thresholds.minShotScore = Math.max(6.5, Math.min(9.0, thresholds.minShotScore));
  thresholds.minCompositionScore = Math.max(6.0, Math.min(8.5, thresholds.minCompositionScore));
  thresholds.minQualityScore = Math.max(6.0, Math.min(8.5, thresholds.minQualityScore));
  thresholds.minFinalScore = Math.max(6.8, Math.min(8.5, thresholds.minFinalScore));

  return thresholds;
}

function getThresholdFailureReasons(score, thresholds) {
  const reasons = [];

  if (score.identityScore < thresholds.minIdentityScore) {
    reasons.push(`identity_below_threshold:${score.identityScore}<${thresholds.minIdentityScore}`);
  }
  if (score.shotScore < thresholds.minShotScore) {
    reasons.push(`shot_below_threshold:${score.shotScore}<${thresholds.minShotScore}`);
  }
  if (score.compositionScore < thresholds.minCompositionScore) {
    reasons.push(`composition_below_threshold:${score.compositionScore}<${thresholds.minCompositionScore}`);
  }
  if (score.qualityScore < thresholds.minQualityScore) {
    reasons.push(`quality_below_threshold:${score.qualityScore}<${thresholds.minQualityScore}`);
  }
  if (score.finalScore < thresholds.minFinalScore) {
    reasons.push(`final_below_threshold:${score.finalScore}<${thresholds.minFinalScore}`);
  }

  return reasons;
}

function shouldRejectScore(score, thresholds, viewType) {
  if (!score) return true;
  if (!thresholds) return true;

  if (score.multiplePeople) return true;
  if (score.wrongShot) return true;
  if (score.hairMismatch) return true;

  const facing = String(score.facingDirection || "").toLowerCase();
  const hasKnownFacing =
    facing === "left" ||
    facing === "right" ||
    facing === "front" ||
    facing === "back";

  if (viewType === IMAGE_TYPES.LEFT && hasKnownFacing && facing !== "left") return true;
  if (viewType === IMAGE_TYPES.RIGHT && hasKnownFacing && facing !== "right") return true;

  if (
  (viewType === IMAGE_TYPES.LEFT || viewType === IMAGE_TYPES.RIGHT) &&
  score.wrongShot
) {
  return true;
}

  if (viewType === IMAGE_TYPES.FRONT && hasKnownFacing && facing !== "front") return true;
  if (viewType === IMAGE_TYPES.BACK && hasKnownFacing && facing !== "back") return true;

  // Back view should NOT fail just because face is not visible
  if (viewType !== IMAGE_TYPES.BACK && score.faceNotVisible) return true;

  if (score.identityDrift) return true;

  if (score.identityScore < thresholds.minIdentityScore) return true;
  if (score.shotScore < thresholds.minShotScore) return true;
  if (score.compositionScore < thresholds.minCompositionScore) return true;
  if (score.qualityScore < thresholds.minQualityScore) return true;
  if (score.finalScore < thresholds.minFinalScore) return true;

  return false;
}

function shouldSoftAcceptScore(score, thresholds, viewType) {
  if (!score || !thresholds) return false;

  const facing = String(score.facingDirection || "").toLowerCase();
  const hasKnownFacing =
    facing === "left" ||
    facing === "right" ||
    facing === "front" ||
    facing === "back";

  if (score.multiplePeople) return false;
  if (score.wrongShot) return false;
  if (score.faceNotVisible && viewType !== IMAGE_TYPES.BACK) return false;
  if (score.identityDrift) return false;
  if (score.hairMismatch) return false;

  if (viewType === IMAGE_TYPES.LEFT && hasKnownFacing && facing !== "left") return false;
  if (viewType === IMAGE_TYPES.RIGHT && hasKnownFacing && facing !== "right") return false;
  if (viewType === IMAGE_TYPES.FRONT && hasKnownFacing && facing !== "front") return false;
  if (viewType === IMAGE_TYPES.BACK && hasKnownFacing && facing !== "back") return false;

  if (score.identityScore < Math.max(5.8, thresholds.minIdentityScore - 1.2)) return false;
  if (score.shotScore < Math.max(5.8, thresholds.minShotScore - 1.2)) return false;
  if (score.compositionScore < Math.max(5.6, thresholds.minCompositionScore - 1.0)) return false;
  if (score.qualityScore < Math.max(5.6, thresholds.minQualityScore - 1.0)) return false;
  if (score.finalScore < Math.max(5.9, thresholds.minFinalScore - 1.2)) return false;

  return true;
}

function getReferencePriority(viewType) {
  switch (viewType) {
    case IMAGE_TYPES.SHEET:
      return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.LEFT, IMAGE_TYPES.RIGHT, IMAGE_TYPES.BACK];

    case IMAGE_TYPES.FRONT:
      return ["MASTER", IMAGE_TYPES.FRONT];

    case IMAGE_TYPES.LEFT:
  return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.LEFT];

case IMAGE_TYPES.RIGHT:
  return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.RIGHT];

    case IMAGE_TYPES.BACK:
      return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.LEFT, IMAGE_TYPES.RIGHT];

    case IMAGE_TYPES.CLOSEUP:
      return [IMAGE_TYPES.FRONT, "MASTER", IMAGE_TYPES.LEFT, IMAGE_TYPES.RIGHT];

    case IMAGE_TYPES.CLOSEUP_LEFT:
      return ["MASTER", IMAGE_TYPES.LEFT, IMAGE_TYPES.FRONT, IMAGE_TYPES.CLOSEUP];

    case IMAGE_TYPES.CLOSEUP_RIGHT:
      return ["MASTER", IMAGE_TYPES.RIGHT, IMAGE_TYPES.FRONT, IMAGE_TYPES.CLOSEUP];

    default:
      return ["MASTER", IMAGE_TYPES.FRONT];
  }
}

function trimReferencesForView(viewType, refs) {
  const uniqueRefs = Array.from(new Set(refs)).filter(Boolean);

  switch (viewType) {
    case IMAGE_TYPES.SHEET:
      return uniqueRefs.slice(0, 5);

    case IMAGE_TYPES.FRONT:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.LEFT:
    case IMAGE_TYPES.RIGHT:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.BACK:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.CLOSEUP:
      return uniqueRefs.slice(0, 3);

    case IMAGE_TYPES.CLOSEUP_LEFT:
    case IMAGE_TYPES.CLOSEUP_RIGHT:
      return uniqueRefs.slice(0, 4);

    default:
      return uniqueRefs.slice(0, 3);
  }
}

function scoreReferenceCandidate({
  candidate,
  targetViewType,
  preferredTypeOrder = [],
}) {
  if (!candidate?.url) return -Infinity;

  let score = 0;

  const finalScore = Number(candidate.finalScore || 0);
  const identityScore = Number(candidate.identityScore || 0);
  const shotScore = Number(candidate.shotScore || 0);
  const compositionScore = Number(candidate.compositionScore || 0);
  const qualityScore = Number(candidate.qualityScore || 0);

  score += finalScore * 5;
  score += identityScore * 4;
  score += shotScore * 2;
  score += compositionScore * 1.5;
  score += qualityScore * 2;

  if (candidate.failureType && candidate.failureType !== "none") {
    score -= 4;
  }

    const typeIndex = preferredTypeOrder.indexOf(candidate.type);
  if (typeIndex !== -1) {
    score += Math.max(0, 12 - typeIndex * 3);
  }

  if (candidate.type === "UPLOAD") {
    score += 4;
  }

  if (candidate.type === "MASTER") {
    score += 16;
  }

  if (candidate.type === IMAGE_TYPES.FRONT) {
    score += 18;
  }

  if (targetViewType === IMAGE_TYPES.CLOSEUP) {
    score += identityScore * 2.5;
    score += qualityScore * 1.5;

    if (candidate.type === IMAGE_TYPES.FRONT) score += 10;
    if (candidate.type === IMAGE_TYPES.LEFT || candidate.type === IMAGE_TYPES.RIGHT) score += 4;
  }

  if (targetViewType === IMAGE_TYPES.CLOSEUP_LEFT) {
    score += identityScore * 2.5;
    score += qualityScore * 1.5;

    if (candidate.type === IMAGE_TYPES.LEFT) score += 16;
    if (candidate.type === IMAGE_TYPES.FRONT) score += 8;
  }

  if (targetViewType === IMAGE_TYPES.CLOSEUP_RIGHT) {
    score += identityScore * 2.5;
    score += qualityScore * 1.5;

    if (candidate.type === IMAGE_TYPES.RIGHT) score += 16;
    if (candidate.type === IMAGE_TYPES.FRONT) score += 8;
  }

  if (targetViewType === IMAGE_TYPES.BACK) {
    if (candidate.type === IMAGE_TYPES.LEFT || candidate.type === IMAGE_TYPES.RIGHT) score += 8;
    if (candidate.type === IMAGE_TYPES.FRONT) score += 16;
  }

  if (targetViewType === IMAGE_TYPES.LEFT || targetViewType === IMAGE_TYPES.RIGHT) {
    score += identityScore * 2;
    score += shotScore * 1.5;

    if (candidate.type === IMAGE_TYPES.FRONT) score += 18;
    if (candidate.type === targetViewType) score += 6;
  }

  return score;
}

function buildReferenceCandidates({
  viewType,
  masterImage,
  acceptedViewMap,
  anchorRefs = [],
}) {
  const priority = getReferencePriority(viewType);
  const candidates = [];

  if (masterImage) {
    candidates.push({
      type: "MASTER",
      url: masterImage,
      finalScore: 10,
      identityScore: 10,
      shotScore: 10,
      compositionScore: 10,
      qualityScore: 10,
      failureType: "none",
      isMaster: true,
    });
  }

  for (const anchorUrl of anchorRefs) {
    if (!anchorUrl || anchorUrl === masterImage) continue;

    candidates.push({
      type: "UPLOAD",
      url: anchorUrl,
      finalScore: 9,
      identityScore: 9,
      shotScore: 8,
      compositionScore: 8,
      qualityScore: 8,
      failureType: "none",
      isMaster: false,
    });
  }

for (const refType of priority) {
  const acceptedRef = acceptedViewMap[refType];
  if (acceptedRef?.url || acceptedRef?.evalUrl) {
    candidates.push({
      ...acceptedRef,
      url: acceptedRef.evalUrl || acceptedRef.url,
      isMaster: false,
    });
  }
}

  return candidates;
}

function rankReferenceCandidates({
  viewType,
  candidates,
}) {
  const preferredTypeOrder = getReferencePriority(viewType);

  return [...candidates].sort((a, b) => {
    const scoreA = scoreReferenceCandidate({
      candidate: a,
      targetViewType: viewType,
      preferredTypeOrder,
    });

    const scoreB = scoreReferenceCandidate({
      candidate: b,
      targetViewType: viewType,
      preferredTypeOrder,
    });

    return scoreB - scoreA;
  });
}

function selectTopReferencesForView(viewType, rankedCandidates) {
  const rankedUrls = rankedCandidates
    .map((item) => item?.url)
    .filter(Boolean);

  return trimReferencesForView(viewType, rankedUrls);
}

function buildReferenceSet({
  viewType,
  masterImage,
  acceptedViewMap,
  anchorRefs = [],
}) {
  const candidates = buildReferenceCandidates({
    viewType,
    masterImage,
    acceptedViewMap,
    anchorRefs,
  });

  const rankedCandidates = rankReferenceCandidates({
    viewType,
    candidates,
  });

  const selectedRefs = selectTopReferencesForView(viewType, rankedCandidates);

  return {
    refs: selectedRefs,
    rankedCandidates,
  };
}

function collectFailedViews(results = []) {
  return results.filter((item) => !item.accepted);
}

function buildRepairQueue(results = []) {
  const failed = collectFailedViews(results).filter(shouldRepairFailedView);

  return [...failed].sort((a, b) => {
    const aPriority = a.type === IMAGE_TYPES.FRONT ? 1 : a.type === IMAGE_TYPES.CLOSEUP ? 2 : 3;
    const bPriority = b.type === IMAGE_TYPES.FRONT ? 1 : b.type === IMAGE_TYPES.CLOSEUP ? 2 : 3;
    return aPriority - bPriority;
  });
}

function buildPackMap(results = []) {
  const map = {};
  for (const item of results) {
    if (item?.accepted && item?.type) {
      map[item.type] = {
        ...item,
        evalUrl: item.evalUrl || item.url,
        url: item.url,
      };
    }
  }
  return map;
}

function buildAnchorViewSummary(finalResults = []) {
  const sorted = [...finalResults]
    .filter((r) => r.accepted)
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

  return sorted.slice(0, 3).map((item) => ({
    type: item.type,
    url: item.url,
    finalScore: item.finalScore,
    identityScore: item.identityScore,
    qualityScore: item.qualityScore,
  }));
}

async function loadCharacterMemory(characterId, userId) {
  const { data, error } = await supabase
    .from("characters")
    .select(`
      id,
      user_id,
      name,
      description,
      master_image,
      locked_traits,
      dna_profile,
      dna_confidence,
      anchor_views,
      metadata
    `)
    .eq("id", characterId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Character memory not found");
  }

  return data;
}

async function loadUploadedReferenceUrls(characterId, userId) {
  const { data, error } = await supabase
    .from("character_images")
    .select("image_url, source_type, is_canon, is_cover, sort_order, created_at")
    .eq("character_id", characterId)
    .eq("user_id", userId)
    .eq("source_type", "upload")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load uploaded reference images");
  }

  return (data || [])
    .map((row) => normalizeReferenceImage(row.image_url))
    .filter(Boolean);
}

function buildLockedTraitsBlock(lockedTraits = {}) {
  if (!lockedTraits || typeof lockedTraits !== "object") return "";

  const parts = [
    lockedTraits.gender ? `Gender presentation must remain ${lockedTraits.gender}.` : null,
    lockedTraits.age || lockedTraits.ageRange
      ? `Age range must remain ${lockedTraits.age || lockedTraits.ageRange}.`
      : null,
    lockedTraits.ethnicity ? `Ethnicity must remain ${lockedTraits.ethnicity}.` : null,
    lockedTraits.hair_style ? `Hair style must remain ${lockedTraits.hair_style}.` : null,
    lockedTraits.hair_color ? `Hair color must remain ${lockedTraits.hair_color}.` : null,
    lockedTraits.eye_color ? `Eye color must remain ${lockedTraits.eye_color}.` : null,
    lockedTraits.build ? `Body build must remain ${lockedTraits.build}.` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

function buildDnaIdentityBlock(dnaProfile = {}) {
  if (!dnaProfile || typeof dnaProfile !== "object") return "";

  const parts = [
    dnaProfile.identitySummary ? `Identity summary: ${dnaProfile.identitySummary}.` : null,
    dnaProfile.faceShape ? `Face shape: ${dnaProfile.faceShape}.` : null,
    dnaProfile.jawline ? `Jawline: ${dnaProfile.jawline}.` : null,
    dnaProfile.cheekStructure ? `Cheek structure: ${dnaProfile.cheekStructure}.` : null,
    dnaProfile.foreheadShape ? `Forehead shape: ${dnaProfile.foreheadShape}.` : null,
    dnaProfile.noseProfile ? `Nose profile: ${dnaProfile.noseProfile}.` : null,
    dnaProfile.eyeShape ? `Eye shape: ${dnaProfile.eyeShape}.` : null,
    dnaProfile.eyebrowShape ? `Eyebrow shape: ${dnaProfile.eyebrowShape}.` : null,
    dnaProfile.lipShape ? `Lip shape: ${dnaProfile.lipShape}.` : null,
    dnaProfile.chinShape ? `Chin shape: ${dnaProfile.chinShape}.` : null,
    dnaProfile.earShape ? `Ear shape: ${dnaProfile.earShape}.` : null,
    dnaProfile.skinTone ? `Skin tone: ${dnaProfile.skinTone}.` : null,
    dnaProfile.hairstyle ? `Hairstyle: ${dnaProfile.hairstyle}.` : null,
    dnaProfile.hairline ? `Hairline: ${dnaProfile.hairline}.` : null,
    dnaProfile.hairLength ? `Hair length: ${dnaProfile.hairLength}.` : null,
    dnaProfile.bodyBuild ? `Body build: ${dnaProfile.bodyBuild}.` : null,
    dnaProfile.shoulderWidth ? `Shoulder width: ${dnaProfile.shoulderWidth}.` : null,
    dnaProfile.neckShape ? `Neck shape: ${dnaProfile.neckShape}.` : null,
    dnaProfile.silhouetteSummary ? `Silhouette: ${dnaProfile.silhouetteSummary}.` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

function getAnchorRefs(characterMemory = {}) {
  const master = normalizeReferenceImage(characterMemory?.master_image);
  const anchors = Array.isArray(characterMemory?.anchor_views)
    ? characterMemory.anchor_views
        .map((item) => normalizeReferenceImage(item?.url))
        .filter(Boolean)
    : [];

  return Array.from(new Set([master, ...anchors])).filter(Boolean);
}

function shouldRepairFromPackCohesion(cohesion) {
  if (!cohesion) return false;
  if (cohesion.identityMismatch) return true;
  if (cohesion.hairstyleMismatch) return true;
  if (cohesion.silhouetteMismatch) return true;
  if (cohesion.packCohesionScore < 7.5) return true;
  if (cohesion.identityConsistencyScore < 7.8) return true;
  return false;
}

async function savePermanentImage({
  imageUrl,
  userId = "anonymous",
  characterId,
  viewType,
}) {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return await savePermanentBuffer({
    buffer,
    contentType,
    userId,
    characterId,
    viewType,
  });
}

async function savePermanentBuffer({
  buffer,
  contentType = "image/png",
  userId = "anonymous",
  characterId,
  viewType,
}) {
  if (!buffer) return null;

  const ext = getExtensionFromContentType(contentType);
  const filePath = `${userId}/${characterId}/pack/${viewType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image to Supabase");
  }

  const { data: publicData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicData?.publicUrl || null;
}

async function fetchImageBuffer(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image asset: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function buildPortraitFromFullBody(imageUrl) {
  const buffer = await fetchImageBuffer(imageUrl);
  const source = sharp(buffer);
  const metadata = await source.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1536;

  const scale = Math.max(1600 / width, 2400 / height);
  const scaledWidth = Math.max(1600, Math.round(width * scale));
  const scaledHeight = Math.max(2400, Math.round(height * scale));
  const targetWidth = 1024;
  const targetHeight = 1536;
  const left = clampInt((scaledWidth - targetWidth) / 2, 0, Math.max(0, scaledWidth - targetWidth));
  const top = clampInt(scaledHeight * 0.06, 0, Math.max(0, scaledHeight - targetHeight));

  return await source
    .resize(scaledWidth, scaledHeight, { fit: "cover" })
    .extract({
      left,
      top,
      width: targetWidth,
      height: targetHeight,
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function fitBufferForSheet(imageUrl, width, height) {
  const buffer = await fetchImageBuffer(imageUrl);
  return await sharp(buffer)
    .resize(width, height, {
      fit: "contain",
      background: { r: 245, g: 245, b: 245, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function buildProfileSheet({
  frontUrl,
  leftUrl,
  rightUrl,
  backUrl,
  leftPortraitUrl,
  frontPortraitUrl,
  rightPortraitUrl,
}) {
  const sheetWidth = 1536;
  const sheetHeight = 1024;
  const topY = 48;
  const bottomY = 622;
  const topW = 300;
  const topH = 500;
  const bottomW = 320;
  const bottomH = 320;
  const topXs = [24, 408, 792, 1176];
  const bottomXs = [128, 608, 1088];

  const [
    front,
    left,
    right,
    back,
    leftPortrait,
    frontPortrait,
    rightPortrait,
  ] = await Promise.all([
    fitBufferForSheet(frontUrl, topW, topH),
    fitBufferForSheet(leftUrl, topW, topH),
    fitBufferForSheet(rightUrl, topW, topH),
    fitBufferForSheet(backUrl, topW, topH),
    fitBufferForSheet(leftPortraitUrl, bottomW, bottomH),
    fitBufferForSheet(frontPortraitUrl, bottomW, bottomH),
    fitBufferForSheet(rightPortraitUrl, bottomW, bottomH),
  ]);

  const background = {
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 3,
      background: { r: 247, g: 247, b: 247 },
    },
  };

  return await sharp(background)
    .composite([
      { input: front, left: topXs[0], top: topY },
      { input: left, left: topXs[1], top: topY },
      { input: right, left: topXs[2], top: topY },
      { input: back, left: topXs[3], top: topY },
      { input: leftPortrait, left: bottomXs[0], top: bottomY },
      { input: frontPortrait, left: bottomXs[1], top: bottomY },
      { input: rightPortrait, left: bottomXs[2], top: bottomY },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function buildDerivedPackAssets(finalResults = []) {
  void finalResults;
  return [];
}

async function runSingleGeneration({
  prompt,
  refs,
  size,
  negativePrompt,
  strictIdentity,
  userId,
  characterId,
  viewType,
  attempt = 0,
  failureType = "none",
  rankedCandidates = [],
  selectedRefs = [],
  acceptedViewMap = {},
  dnaIdentityBlock = "",
  lockedTraitsBlock = "",
}) {
  void strictIdentity;

  const hasRefs = refs.length > 0;
  const aspect_ratio = mapSizeToAspectRatio(size);

  const referenceFusion = analyzeReferenceFusion({
    viewType,
    rankedCandidates,
    selectedRefs,
  });

  const packContextBlock = buildPackContextBlock({
    targetViewType: viewType,
    acceptedViewMap,
  });

const basePrompt = buildIntelligentPrompt({
  prompt,
  hasRefs,
  viewType,
  negativePrompt,
  attempt,
  failureType,
  referenceFusion,
  packContextBlock,
});

const enforcedNegativePrompt = [
  negativePrompt,
  "glossy skin",
  "shiny skin",
  "oily skin",
  "plastic skin",
  "waxy skin",
  "airbrushed skin",
  "over-smoothed skin",
  "beauty retouching",
  "beauty filter",
  "skin smoothing",
  "polished face",
  "cosmetic skin cleanup",
  "hyper smooth skin",
  "fake skin texture",
  "cg skin",
  "3d skin",
  "rendered face",
  "beauty ad face",
  "fashion editorial face",
  "makeup campaign lighting",
  "overexposed forehead shine",
  "glamour portrait",
  "retouched portrait",
  "logo shirt",
  "graphic t-shirt",
  "printed shirt",
  "colored shirt",
  "blue shirt",
  "green shirt",
  "red shirt",
  "sports jersey",
  "shorts",
  "patterned clothes",
  "fashion styling",
  "logo shirt",
  "graphic t-shirt",
  "printed shirt",
  "colored shirt",
  "blue shirt",
  "green shirt",
  "red shirt",
  "sports jersey",
  "shorts",
  "patterned clothes",
  "fashion styling",
  "pure white background",
"white studio background",
"overexposed background",
"washed out background",
"high key background",
"acne",
"pimples",
"skin blemishes",
"skin spots",
"face spots",
"facial acne",
"breakouts",
"skin imperfections dots",
].filter(Boolean).join(", ");

const viewSpecificNegativePrompt =
  viewType === IMAGE_TYPES.LEFT
    ? [
        "facing right",
        "nose pointing right",
        "right profile",
        "mirrored right profile",
        "wrong side profile",
        "three-quarter face",
        "front-facing",
        "semi-front angle",
        "partial front view",
        "camera-facing head",
      ].join(", ")
    : viewType === IMAGE_TYPES.RIGHT
    ? [
        "facing left",
        "nose pointing left",
        "left profile",
        "mirrored left profile",
        "wrong side profile",
        "three-quarter face",
        "front-facing",
        "semi-front angle",
        "partial front view",
        "camera-facing head",
      ].join(", ")
    : viewType === IMAGE_TYPES.CLOSEUP
    ? "beauty lighting, glossy forehead, polished skin, studio glamour retouching, makeup-ad skin"
    : "";

const finalNegativePrompt = [
  enforcedNegativePrompt,
  viewSpecificNegativePrompt,
].filter(Boolean).join(", ");

const finalPrompt = [
  basePrompt,
  dnaIdentityBlock,
  lockedTraitsBlock,
  finalNegativePrompt ? `Avoid: ${finalNegativePrompt}` : "",
].filter(Boolean).join("\n\n");

const cleanedRefs = refs
  .map((r) => normalizeReferenceImage(r))
  .filter(Boolean)
  .slice(0, 8);

const input = {
  prompt: finalPrompt,
  image: cleanedRefs[0],
  negative_prompt: finalNegativePrompt,
  ...mapSizeToDimensions(size),
  ip_adapter_scale: 0.95,
  controlnet_conditioning_scale: 0.95,
  num_inference_steps: 40,
  guidance_scale: 4.5,
};

const modelToUse = getModelForView(viewType);

const output = await runProviderWithBackoff(async () => {
  console.log("PROVIDER DEBUG", {
    model: modelToUse,
    viewType,
    refCount: cleanedRefs.length,
    refsPreview: cleanedRefs.slice(0, 3),
    inputKeys: Object.keys(input),
  });

  console.log("PROVIDER INPUT SUMMARY", {
  viewType,
  model: modelToUse,
  refCount: cleanedRefs.length,
  hasNegativePrompt: !!finalNegativePrompt,
  promptLength: finalPrompt.length,
});

  return await replicate.run(modelToUse, { input });
}, 1);

const tempUrl = await fileOutputToUrl(output);

console.log("PROVIDER OUTPUT DEBUG", {
  model: modelToUse,
  viewType,
  tempUrl,
  refCount: cleanedRefs.length,
  refsPreview: cleanedRefs.slice(0, 3),
  inputKeys: Object.keys(input),
});

if (!tempUrl) {
  throw new Error(`No image URL returned for ${viewType}`);
}

return {
  imageUrl: tempUrl, // use temp URL for evaluation first
  tempUrl,
  finalPrompt,
  viewType,
  hasRefs,
  aspect_ratio,
  attempt,
  failureType,
  referenceCount: cleanedRefs.length,
  referencesUsed: cleanedRefs,
  referenceFusion,
  packContextBlock,
};
}

function validateGeneratedView({ imageUrl, viewType }) {
  void viewType;

  if (!imageUrl || typeof imageUrl !== "string") {
    return {
      ok: false,
      reason: "missing_image_url",
    };
  }

  if (
    !imageUrl.startsWith("http://") &&
    !imageUrl.startsWith("https://")
  ) {
    return {
      ok: false,
      reason: "invalid_image_url",
    };
  }

  return {
    ok: true,
    reason: "passed_basic_validation",
  };
}

async function callVisionEvaluator({
  imageUrl,
  masterImage,
  frontImageUrl = null,
  viewType,
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const content = [
    {
      type: "text",
      text: buildEvaluatorPrompt({ viewType }),
    },
    {
      type: "text",
      text: "Generated image to evaluate:",
    },
    {
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "high",
      },
    },
    {
      type: "text",
      text: "Master identity reference image:",
    },
    {
      type: "image_url",
      image_url: {
        url: masterImage,
        detail: "high",
      },
    },
  ];

  if (frontImageUrl) {
    content.push(
      {
        type: "text",
        text: "Front-view reference image:",
      },
      {
        type: "image_url",
        image_url: {
          url: frontImageUrl,
          detail: "high",
        },
      }
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EVALUATOR_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: getEvaluatorSchema(),
      },
      messages: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text: "You are a strict evaluator for character consistency packs. Return only schema-valid JSON.",
            },
          ],
        },
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Vision evaluator request failed");
  }

  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = safeParseJson(text);

  if (!parsed) {
    throw new Error("Vision evaluator returned invalid JSON");
  }

  return parsed;
}

async function evaluatePackCohesion({
  masterImage,
  packMap,
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const requiredViews = [
    IMAGE_TYPES.FRONT,
    IMAGE_TYPES.LEFT,
    IMAGE_TYPES.RIGHT,
    IMAGE_TYPES.BACK,
    IMAGE_TYPES.CLOSEUP,
  ];

  for (const view of requiredViews) {
    if (!packMap?.[view]?.url) {
      throw new Error(`Missing pack view for cohesion evaluation: ${view}`);
    }
  }

  const content = [
    { type: "text", text: buildPackCohesionPrompt() },

    { type: "text", text: "MASTER identity image:" },
    { type: "image_url", image_url: { url: masterImage, detail: "high" } },

    { type: "text", text: "FRONT full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.FRONT].evalUrl || packMap[IMAGE_TYPES.FRONT].url, detail: "high" } },

    { type: "text", text: "LEFT profile full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.LEFT].evalUrl || packMap[IMAGE_TYPES.LEFT].url, detail: "high" } },

    { type: "text", text: "RIGHT profile full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.RIGHT].evalUrl || packMap[IMAGE_TYPES.RIGHT].url, detail: "high" } },

    { type: "text", text: "BACK full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.BACK].evalUrl || packMap[IMAGE_TYPES.BACK].url, detail: "high" } },

    { type: "text", text: "CLOSEUP portrait:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.CLOSEUP].evalUrl || packMap[IMAGE_TYPES.CLOSEUP].url, detail: "high" } },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EVALUATOR_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: getPackCohesionSchema(),
      },
      messages: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text: "You are a strict evaluator for full character pack cohesion. Return only schema-valid JSON.",
            },
          ],
        },
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Pack cohesion evaluator request failed");
  }

  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = safeParseJson(text);

  if (!parsed) {
    throw new Error("Pack cohesion evaluator returned invalid JSON");
  }

  return {
    accepted: !!parsed.accepted,
    identityConsistencyScore: normalizeModelScore(parsed.identityConsistencyScore, 0),
silhouetteConsistencyScore: normalizeModelScore(parsed.silhouetteConsistencyScore, 0),
hairstyleConsistencyScore: normalizeModelScore(parsed.hairstyleConsistencyScore, 0),
facialConsistencyScore: normalizeModelScore(parsed.facialConsistencyScore, 0),
packCohesionScore: normalizeModelScore(parsed.packCohesionScore, 0),
    identityMismatch: !!parsed.identityMismatch,
    hairstyleMismatch: !!parsed.hairstyleMismatch,
    silhouetteMismatch: !!parsed.silhouetteMismatch,
    weakViewType: parsed.weakViewType || "none",
    reason: parsed.reason || "no_reason_provided",
  };
}

async function extractCharacterDNA({
  masterImage,
  packMap,
}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const requiredViews = [
    IMAGE_TYPES.FRONT,
    IMAGE_TYPES.LEFT,
    IMAGE_TYPES.RIGHT,
    IMAGE_TYPES.BACK,
    IMAGE_TYPES.CLOSEUP,
  ];

  for (const view of requiredViews) {
    if (!packMap?.[view]?.url) {
      throw new Error(`Missing pack view for DNA extraction: ${view}`);
    }
  }

  const content = [
    { type: "text", text: buildCharacterDnaPrompt() },

    { type: "text", text: "MASTER identity image:" },
    { type: "image_url", image_url: { url: masterImage, detail: "high" } },

    { type: "text", text: "FRONT full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.FRONT].evalUrl || packMap[IMAGE_TYPES.FRONT].url, detail: "high" } },

    { type: "text", text: "LEFT profile:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.LEFT].evalUrl || packMap[IMAGE_TYPES.LEFT].url, detail: "high" } },

    { type: "text", text: "RIGHT profile:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.RIGHT].evalUrl || packMap[IMAGE_TYPES.RIGHT].url, detail: "high" } },

    { type: "text", text: "BACK full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.BACK].evalUrl || packMap[IMAGE_TYPES.BACK].url, detail: "high" } },

    { type: "text", text: "CLOSEUP portrait:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.CLOSEUP].evalUrl || packMap[IMAGE_TYPES.CLOSEUP].url, detail: "high" } },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EVALUATOR_MODEL,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: getCharacterDnaSchema(),
      },
      messages: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text: "You are extracting a reusable character identity memory. Return only schema-valid JSON.",
            },
          ],
        },
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Character DNA extraction request failed");
  }

  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = safeParseJson(text);

  if (!parsed) {
    throw new Error("Character DNA extraction returned invalid JSON");
  }

return {
  ...parsed,
  dnaConfidence: normalizeModelScore(parsed.dnaConfidence, 0),
};
}

async function scoreGeneratedView({
  imageUrl,
  masterImage,
  frontImageUrl = null,
  viewType,
  attempt = 0,
  referenceFusion = null,
}) {
  if (!imageUrl) {
    return {
      accepted: false,
      identityScore: 0,
      shotScore: 0,
      compositionScore: 0,
      qualityScore: 0,
      finalScore: 0,
      multiplePeople: false,
      wrongShot: false,
      faceNotVisible: false,
      identityDrift: false,
      lowQuality: false,
      failureType: "none",
      reason: "missing_image",
      thresholds: getAdaptiveThresholds({
        viewType,
        attempt,
        referenceFusion,
      }),
      thresholdFailureReasons: ["missing_image"],
    };
  }

  const evaluation = await callVisionEvaluator({
    imageUrl,
    masterImage,
    frontImageUrl,
    viewType,
  });

  const normalized = {
    accepted: !!evaluation?.accepted,
    identityScore: clampScore(evaluation?.identityScore, 0),
    shotScore: clampScore(evaluation?.shotScore, 0),
    compositionScore: clampScore(evaluation?.compositionScore, 0),
    qualityScore: clampScore(evaluation?.qualityScore, 0),
    finalScore: clampScore(evaluation?.finalScore, 0),

    multiplePeople: !!evaluation?.multiplePeople,
    wrongShot: !!evaluation?.wrongShot,
    faceNotVisible: !!evaluation?.faceNotVisible,
    identityDrift: !!evaluation?.identityDrift,
    lowQuality: !!evaluation?.lowQuality,
    hairMismatch: !!evaluation?.hairMismatch,
    facingDirection: evaluation?.facingDirection || "unknown",

    failureType: normalizeFailureType(evaluation?.failureType),
    reason: evaluation?.reason || "no_reason_provided",
  };

  const thresholds = getAdaptiveThresholds({
    viewType,
    attempt,
    referenceFusion,
  });

  const thresholdFailureReasons = getThresholdFailureReasons(normalized, thresholds);

  if (shouldRejectScore(normalized, thresholds, viewType)) {
    if (shouldSoftAcceptScore(normalized, thresholds, viewType)) {
      return {
        ...normalized,
        accepted: true,
        thresholds,
        thresholdFailureReasons: getThresholdFailureReasons(normalized, thresholds),
        reason: normalized.reason || "soft_accept_borderline_score",
      };
    }

    return {
      ...normalized,
      accepted: false,
      thresholds,
      thresholdFailureReasons,
      reason:
        normalized.reason ||
        thresholdFailureReasons[0] ||
        (normalized.failureType !== "none" ? normalized.failureType : "score_below_threshold"),
    };
  }

  return {
    ...normalized,
    accepted: true,
    thresholds,
    thresholdFailureReasons: [],
  };
}

async function runRepairPassForView({
  failedView,
  normalizedMaster,
  acceptedViewMap,
  negativePrompt,
  userId,
  characterId,
  frontImageUrl,
  anchorRefs = [],
  dnaIdentityBlock = "",
  lockedTraitsBlock = "",
}) {
  const size =
    PACK_VIEWS.find((view) => view.key === failedView.type)?.size || "1024x1536";

const referenceSelection = buildReferenceSet({
  viewType: failedView.type,
  masterImage: normalizedMaster,
  acceptedViewMap,
  anchorRefs,
});

  const currentRefs = referenceSelection.refs;
  const rankedCandidates = referenceSelection.rankedCandidates;

  let repairedResult = null;
let lastError = null;
let lastScore = null;
const basePrompt = getViewPrompt(failedView.type);

const maxAttempts = 2;

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    const generated = await runSingleGeneration({
      prompt: basePrompt,
      refs: currentRefs,
      size,
      negativePrompt,
      strictIdentity: true,
      userId,
      characterId,
      viewType: failedView.type,
      attempt: attempt + 3,
      failureType: failedView.failureType || lastScore?.failureType || "none",
      rankedCandidates,
      selectedRefs: currentRefs,
      acceptedViewMap,
      dnaIdentityBlock,
      lockedTraitsBlock,
    });

    const validation = validateGeneratedView({
      imageUrl: generated.imageUrl,
      viewType: failedView.type,
    });

    if (!validation.ok) {
      throw new Error(`Validation failed: ${validation.reason}`);
    }

    const shouldEvaluate = shouldEvaluateViewOnFirstPass(failedView.type);
    const score = shouldEvaluate
      ? await scoreGeneratedView({
          imageUrl: generated.tempUrl || generated.imageUrl,
          masterImage: normalizedMaster,
          frontImageUrl,
          viewType: failedView.type,
          attempt: attempt + 3,
          referenceFusion: generated.referenceFusion,
        })
      : {
          accepted: true,
          identityScore: 8,
          shotScore: 8,
          compositionScore: 8,
          qualityScore: 8,
          finalScore: 8,
          multiplePeople: false,
          wrongShot: false,
          faceNotVisible: false,
          identityDrift: false,
          lowQuality: false,
          hairMismatch: false,
          facingDirection: "unknown",
          failureType: "none",
          reason: "repair_pass_fast_accept",
          thresholds: null,
          thresholdFailureReasons: [],
        };

    lastScore = score;

    if (!score.accepted) {
  throw new Error(score.reason || `Repair scoring failed for ${failedView.type}`);
}

repairedResult = {
  type: failedView.type,
  label: failedView.label,
  url: generated.tempUrl,      // temporary for now
  evalUrl: generated.tempUrl,
  sort_order: IMAGE_ORDER[failedView.type],
      accepted: true,
      attemptsUsed: (failedView.attemptsUsed || 0) + attempt + 1,
      validationReason: validation.reason,
      identityScore: score.identityScore,
      shotScore: score.shotScore,
      compositionScore: score.compositionScore,
      qualityScore: score.qualityScore,
      finalScore: score.finalScore,
      multiplePeople: score.multiplePeople,
      wrongShot: score.wrongShot,
      faceNotVisible: score.faceNotVisible,
      identityDrift: score.identityDrift,
      lowQuality: score.lowQuality,
      failureType: score.failureType,
      scoreReason: score.reason,
      generationAttempt: attempt + 3,
      referenceCount: generated.referenceCount,
      referencesUsed: generated.referencesUsed,
      referenceFusion: generated.referenceFusion,
      thresholds: score.thresholds,
      thresholdFailureReasons: score.thresholdFailureReasons,
      selectedReferenceTypes: rankedCandidates
        .filter((item) => currentRefs.includes(item.url))
        .map((item) => item.type),
      selectedReferenceScores: rankedCandidates
        .filter((item) => currentRefs.includes(item.url))
        .map((item) => ({
          type: item.type,
          finalScore: item.finalScore,
          identityScore: item.identityScore,
          qualityScore: item.qualityScore,
        })),
      repairedInPass2: true,
    };

    break;
  } catch (err) {
    lastError = err;
    lastScore = lastScore || failedView;

    if (shouldStopPackEarly(err)) {
      throw err;
    }
  }
}

  if (!repairedResult) {
return {
  ...failedView,
  repairedInPass2: false,
  repairError: lastError?.message || "repair_failed",
};
  }

  return repairedResult;
}

async function repairFailedViews({
  results,
  normalizedMaster,
  acceptedViewMap,
  negativePrompt,
  userId,
  characterId,
  frontImageUrl,
  anchorRefs = [],
  dnaIdentityBlock = "",
  lockedTraitsBlock = "",
}) {
  const repairQueue = buildRepairQueue(results);
  if (!repairQueue.length) {
    return {
      results,
      frontImageUrl,
    };
  }

  const repairedResults = [...results];
  let currentFrontImageUrl = frontImageUrl;

  for (const failedView of repairQueue) {
const repaired = await runRepairPassForView({
  failedView,
  normalizedMaster,
  acceptedViewMap,
  negativePrompt,
  userId,
  characterId,
  frontImageUrl: currentFrontImageUrl,
  anchorRefs,
  dnaIdentityBlock,
  lockedTraitsBlock,
});

    const index = repairedResults.findIndex((r) => r.type === failedView.type);
    if (index !== -1) {
      repairedResults[index] = repaired;
    }

    if (repaired.accepted && repaired.url) {
      acceptedViewMap[repaired.type] = repaired;

if (repaired.type === IMAGE_TYPES.FRONT) {
  currentFrontImageUrl = repaired.evalUrl || repaired.url;
}
    }
  }

  return {
    results: repairedResults,
    frontImageUrl: currentFrontImageUrl,
  };
}

async function deleteExistingPackImages(characterId, userId) {
  const { error } = await supabase
    .from("character_images")
    .delete()
    .eq("character_id", characterId)
    .eq("user_id", userId)
    .eq("image_type", "pack");

  if (error) {
    throw new Error(error.message || "Failed to clear previous pack images");
  }
}

async function createPendingGeneration({
  userId,
  characterId,
  prompt,
  negativePrompt = "",
  metadata = {},
}) {
  const payload = {
    user_id: userId || null,
    character_id: characterId || null,
    prompt: String(prompt || "").trim(),
    negative_prompt: String(negativePrompt || "").trim(),
    images: [],
    mode: "character_pack",
    ratio: "2:3",
    style: "photorealistic",
    metadata: {
      state: "processing",
      progressStage: "queued",
      startedAt: new Date().toISOString(),
      ...metadata,
    },
  };

  const { data, error } = await supabase
    .from("image_generations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create character pack job");
  }

  return data;
}

async function updateGenerationJob(generationId, patch) {
  const { data: existing } = await supabase
    .from("image_generations")
    .select("metadata")
    .eq("id", generationId)
    .single();

  const nextPatch =
    patch?.metadata && typeof patch.metadata === "object"
      ? {
          ...patch,
          metadata: {
            ...(existing?.metadata || {}),
            ...patch.metadata,
          },
        }
      : patch;

  const { error } = await supabase
    .from("image_generations")
    .update(nextPatch)
    .eq("id", generationId);

  if (error) {
    throw new Error(error.message || "Failed to update character pack job");
  }
}

function serializePackResults(results = []) {
  return results.map((item) => ({
    type: item.type,
    label: item.label,
    url: item.url || null,
    sort_order: item.sort_order,
    accepted: !!item.accepted,
    finalScore: item.finalScore ?? null,
    scoreReason: item.scoreReason || null,
    failureType: item.failureType || null,
  }));
}

async function generatePackView({
  view,
  routeStart,
  normalizedMaster,
  baseAnchorRefs,
  acceptedViewMap,
  negativePrompt,
  userId,
  characterId,
  frontImageUrl,
  dnaIdentityBlock,
  lockedTraitsBlock,
}) {
  if (nowMs() - routeStart >= JOB_TIMEOUT_MS) {
    return {
      timedOut: true,
      result: null,
      maxReferenceCountUsed: 0,
    };
  }

  const size = view.size || "1024x1536";
  const viewStart = nowMs();
  console.log("VIEW START", { view: view.key });

  const referenceSelection = buildReferenceSet({
    viewType: view.key,
    masterImage: normalizedMaster,
    acceptedViewMap,
    anchorRefs: baseAnchorRefs,
  });

  const currentRefs = referenceSelection.refs;
  const rankedCandidates = referenceSelection.rankedCandidates;
  const basePrompt = getViewPrompt(view.key);
  const maxAttempts = 2;
  let acceptedResult = null;
  let lastError = null;
  let lastScore = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const generated = await runSingleGeneration({
        prompt: basePrompt,
        refs: currentRefs,
        size,
        negativePrompt,
        strictIdentity: true,
        userId,
        characterId,
        viewType: view.key,
        attempt,
        failureType: lastScore?.failureType || "none",
        rankedCandidates,
        selectedRefs: currentRefs,
        acceptedViewMap,
        dnaIdentityBlock,
        lockedTraitsBlock,
      });

      console.log("VIEW GENERATED", {
        view: view.key,
        seconds: ((nowMs() - viewStart) / 1000).toFixed(2),
      });

      if (!generated?.imageUrl) {
        throw new Error(`No image produced for ${view.key}`);
      }

      const validation = validateGeneratedView({
        imageUrl: generated.imageUrl,
        viewType: view.key,
      });

      if (!validation.ok) {
        throw new Error(`Validation failed: ${validation.reason}`);
      }

      let score;

      if (shouldEvaluateViewOnFirstPass(view.key)) {
        score = await scoreGeneratedView({
          imageUrl: generated.imageUrl,
          masterImage: normalizedMaster,
          frontImageUrl,
          viewType: view.key,
          attempt,
          referenceFusion: generated.referenceFusion,
        });

        lastScore = score;

        console.log("VIEW SCORED", {
          view: view.key,
          seconds: ((nowMs() - viewStart) / 1000).toFixed(2),
          accepted: score.accepted,
          finalScore: score.finalScore,
        });

        if (!score.accepted) {
          throw new Error(score.reason || `Scoring failed for ${view.key}`);
        }
      } else {
        score = {
          accepted: true,
          identityScore: 8,
          shotScore: 8,
          compositionScore: 8,
          qualityScore: 8,
          finalScore: 8,
          multiplePeople: false,
          wrongShot: false,
          faceNotVisible: false,
          identityDrift: false,
          lowQuality: false,
          failureType: "none",
          reason: "first_pass_fast_accept",
          thresholds: null,
          thresholdFailureReasons: [],
        };
      }

      acceptedResult = {
        type: view.key,
        label: view.label,
        url: generated.tempUrl,
        evalUrl: generated.tempUrl,
        sort_order: IMAGE_ORDER[view.key],
        accepted: true,
        attemptsUsed: attempt + 1,
        validationReason: validation.reason,
        identityScore: score.identityScore,
        shotScore: score.shotScore,
        compositionScore: score.compositionScore,
        qualityScore: score.qualityScore,
        finalScore: score.finalScore,
        multiplePeople: score.multiplePeople,
        wrongShot: score.wrongShot,
        faceNotVisible: score.faceNotVisible,
        identityDrift: score.identityDrift,
        lowQuality: score.lowQuality,
        hairMismatch: score.hairMismatch,
        facingDirection: score.facingDirection,
        failureType: score.failureType,
        scoreReason: score.reason,
        generationAttempt: attempt,
        referenceCount: generated.referenceCount,
        referencesUsed: generated.referencesUsed,
        referenceFusion: generated.referenceFusion,
        thresholds: score.thresholds,
        thresholdFailureReasons: score.thresholdFailureReasons,
        selectedReferenceTypes: rankedCandidates
          .filter((item) => currentRefs.includes(item.url))
          .map((item) => item.type),
        selectedReferenceScores: rankedCandidates
          .filter((item) => currentRefs.includes(item.url))
          .map((item) => ({
            type: item.type,
            finalScore: item.finalScore,
            identityScore: item.identityScore,
            qualityScore: item.qualityScore,
          })),
        repairedInPass2: false,
        repairedFromCohesion: false,
      };

      break;
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt + 1} failed for ${view.key}:`, err);

      if (shouldStopPackEarly(err)) {
        throw err;
      }
    }
  }

  if (!acceptedResult) {
    return {
      timedOut: false,
      maxReferenceCountUsed: currentRefs.length,
      result: {
        type: view.key,
        label: view.label,
        url: null,
        sort_order: IMAGE_ORDER[view.key],
        accepted: false,
        attemptsUsed: maxAttempts,
        scoreReason: lastError?.message || `Failed to generate acceptable ${view.key}`,
        failureType: lastScore?.failureType || "unknown",
        thresholds: lastScore?.thresholds || null,
        thresholdFailureReasons: lastScore?.thresholdFailureReasons || [],
        referenceCount: currentRefs.length,
        referencesUsed: currentRefs,
        selectedReferenceTypes: rankedCandidates
          .filter((item) => currentRefs.includes(item.url))
          .map((item) => item.type),
        selectedReferenceScores: rankedCandidates
          .filter((item) => currentRefs.includes(item.url))
          .map((item) => ({
            type: item.type,
            finalScore: item.finalScore,
            identityScore: item.identityScore,
            qualityScore: item.qualityScore,
          })),
        repairedInPass2: false,
        repairedFromCohesion: false,
      },
    };
  }

  console.log("Success:", view.key, {
    attemptsUsed: acceptedResult.attemptsUsed,
    finalScore: acceptedResult.finalScore,
    failureType: acceptedResult.failureType,
    referenceCount: acceptedResult.referenceCount,
    thresholds: acceptedResult.thresholds,
  });

  return {
    timedOut: false,
    maxReferenceCountUsed: currentRefs.length,
    result: acceptedResult,
  };
}

async function runGenerationJob(generationId, payload) {
  try {
    const {
      characterId,
      masterImage,
      userId,
      negativePrompt = "",
    } = payload;

    const normalizedMaster = normalizeReferenceImage(masterImage);
    if (!normalizedMaster) {
      throw new Error("Invalid master image");
    }

const routeStart = nowMs();
let timedOut = false;
console.log("PACK START", { generationId, characterId, userId });

await updateGenerationJob(generationId, {
  metadata: {
    state: "processing",
    progressStage: "loading_character_memory",
    startedAt: new Date(routeStart).toISOString(),
  },
});

const characterMemory = await loadCharacterMemory(characterId, userId);
const uploadedReferenceUrls = await loadUploadedReferenceUrls(characterId, userId);

const dnaIdentityBlock = buildDnaIdentityBlock(characterMemory?.dna_profile || {});
const lockedTraitsBlock = buildLockedTraitsBlock(characterMemory?.locked_traits || {});
const anchorRefs = getAnchorRefs(characterMemory);

const baseAnchorRefs = Array.from(
  new Set([
    ...uploadedReferenceUrls,
    ...anchorRefs,
  ])
).filter(Boolean);

console.log("🧠 Loaded character memory", {
  characterId,
  hasMasterImage: !!characterMemory?.master_image,
  dnaConfidence: characterMemory?.dna_confidence ?? null,
  uploadedReferenceCount: uploadedReferenceUrls.length,
  anchorRefCount: anchorRefs.length,
  baseAnchorRefCount: baseAnchorRefs.length,
});

    const results = [];
    const acceptedViewMap = {};
    let frontImageUrl = null;
    let maxReferenceCountUsed = 0;

    const generationViews = GENERATION_VIEW_ORDER
      .map((key) => PACK_VIEWS.find((view) => view.key === key))
      .filter(Boolean);

    const frontView = generationViews.find((view) => view.key === IMAGE_TYPES.FRONT);
    if (!frontView) {
      throw new Error("Front view configuration is missing.");
    }

    const frontRun = await generatePackView({
      view: frontView,
      routeStart,
      normalizedMaster,
      baseAnchorRefs,
      acceptedViewMap,
      negativePrompt,
      userId,
      characterId,
      frontImageUrl: null,
      dnaIdentityBlock,
      lockedTraitsBlock,
    });

    if (frontRun.timedOut) {
      timedOut = true;
    } else if (frontRun.result) {
      results.push(frontRun.result);
      maxReferenceCountUsed = Math.max(maxReferenceCountUsed, frontRun.maxReferenceCountUsed);
      if (frontRun.result.accepted && frontRun.result.url) {
        acceptedViewMap[IMAGE_TYPES.FRONT] = frontRun.result;
        frontImageUrl = frontRun.result.evalUrl || frontRun.result.url;
      }
    }

    const remainingViews = generationViews.filter((view) => view.key !== IMAGE_TYPES.FRONT);

    if (!timedOut && remainingViews.length > 0) {
      for (let index = 0; index < remainingViews.length; index += 1) {
        const view = remainingViews[index];

        await updateGenerationJob(generationId, {
          metadata: {
            state: "processing",
            progressStage: `generating_${view.key}`,
            lastProgressAt: new Date().toISOString(),
          },
        });

        const run = await generatePackView({
          view,
          routeStart,
          normalizedMaster,
          baseAnchorRefs,
          acceptedViewMap,
          negativePrompt,
          userId,
          characterId,
          frontImageUrl,
          dnaIdentityBlock,
          lockedTraitsBlock,
        });

        if (run.timedOut) {
          timedOut = true;
          break;
        }

        if (run.result) {
          results.push(run.result);
          maxReferenceCountUsed = Math.max(maxReferenceCountUsed, run.maxReferenceCountUsed);
          if (run.result.accepted && run.result.url) {
            acceptedViewMap[run.result.type] = run.result;
          }
        }

        if (index < remainingViews.length - 1) {
          await sleep(INTER_VIEW_COOLDOWN_MS);
        }
      }
    }

let finalResults = results;
let finalFrontImageUrl = frontImageUrl;

const failedAfterFirstPass = collectFailedViews(finalResults);
const repairableFailures = failedAfterFirstPass.filter(shouldRepairFailedView);

if (!timedOut && repairableFailures.length > 0) {
  const repaired = await repairFailedViews({
    results: finalResults,
    normalizedMaster,
    acceptedViewMap,
    negativePrompt,
    userId,
    characterId,
    frontImageUrl: finalFrontImageUrl,
    anchorRefs: baseAnchorRefs,
    dnaIdentityBlock,
    lockedTraitsBlock,
  });

  finalResults = repaired.results;
  finalFrontImageUrl = repaired.frontImageUrl;
}

const derivedAssets = await buildDerivedPackAssets(finalResults);
if (derivedAssets.length > 0) {
  finalResults = [...finalResults, ...derivedAssets].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
}

const acceptedCount = finalResults.filter((r) => r.accepted).length;
const totalViews = finalResults.length;

const acceptedTypes = finalResults
  .filter((r) => r.accepted)
  .map((r) => r.type);

const missingRequiredViews = REQUIRED_PACK_VIEWS.filter(
  (viewType) => !acceptedTypes.includes(viewType)
);
const partialCompletion = timedOut && acceptedTypes.length > 0;

if (!partialCompletion && missingRequiredViews.length > 0) {
  const failedViews = finalResults
    .filter((r) => !r.accepted)
    .map((r) => r.type);

  const failedReasons = finalResults
    .filter((r) => !r.accepted)
    .map((r) => String(r.scoreReason || r.repairError || ""))
    .join(" | ");

  console.log("FINAL RESULTS DEBUG:", JSON.stringify(finalResults, null, 2));

console.log("PACK FAILURE SUMMARY", {
  acceptedCount,
  totalViews,
  missingRequiredViews,
  failedViews,
});

  const failedDebug = finalResults
    .filter((r) => !r.accepted)
    .map((r) => ({
      type: r.type,
      scoreReason: r.scoreReason,
      repairError: r.repairError,
      failureType: r.failureType,
      thresholdFailureReasons: r.thresholdFailureReasons,
      identityScore: r.identityScore,
      shotScore: r.shotScore,
      compositionScore: r.compositionScore,
      qualityScore: r.qualityScore,
      finalScore: r.finalScore,
    }));

  console.log("FAILED VIEW DEBUG:", JSON.stringify(failedDebug, null, 2));

  if (
    failedReasons.toLowerCase().includes("credit") ||
    failedReasons.toLowerCase().includes("credits") ||
    failedReasons.toLowerCase().includes("balance") ||
    failedReasons.includes("Insufficient credit") ||
    failedReasons.includes("Payment Required")
  ) {
    throw new Error(
      "Replicate credit is insufficient. Add billing credit, wait a few minutes, and try again."
    );
  }

  if (
    failedReasons.includes("Too Many Requests") ||
    failedReasons.includes("429")
  ) {
    throw new Error(
      formatReplicateRateLimitMessage(failedReasons)
    );
  }

  const reasonSuffix = failedReasons ? ` Reasons: ${failedReasons}` : "";
  throw new Error(
    `Pack incomplete after repair pass. Required views missing: ${missingRequiredViews.join(", ")}. Accepted: ${acceptedTypes.join(", ")}. Failed: ${failedViews.join(", ")}.${reasonSuffix}`
  );
}

console.log("FINAL UPLOAD START", {
  acceptedCount: finalResults.filter((r) => r.accepted).length,
  elapsedSeconds: ((nowMs() - routeStart) / 1000).toFixed(2),
});

// Upload final accepted images to permanent storage only after full pack passes
for (let i = 0; i < finalResults.length; i++) {
  const item = finalResults[i];
  if (!item.accepted || !item.url) continue;

  const permanentUrl = item.derivedBuffer
    ? await savePermanentBuffer({
        buffer: item.derivedBuffer,
        contentType: "image/jpeg",
        userId,
        characterId,
        viewType: item.type,
      })
    : await savePermanentImage({
        imageUrl: item.evalUrl || item.url,
        userId,
        characterId,
        viewType: item.type,
      });

  finalResults[i] = {
    ...item,
    url: permanentUrl,
    derivedBuffer: undefined,
  };
}

const acceptedItems = finalResults.filter((r) => r.accepted && r.url);
if (!acceptedItems.length) {
  throw new Error("Character pack job completed without any accepted images.");
}

const averageFinalScore =
  finalResults.length > 0
    ? finalResults.reduce((sum, r) => sum + (r.finalScore || 0), 0) / finalResults.length
    : 0;

const minimumFinalScore =
  finalResults.length > 0
    ? Math.min(...finalResults.map((r) => r.finalScore || 0))
    : 0;

const maxAttemptsUsed =
  finalResults.length > 0
    ? Math.max(...finalResults.map((r) => r.attemptsUsed || 0))
    : 0;

const repairedCount =
  finalResults.length > 0
    ? finalResults.filter((r) => r.repairedInPass2).length
    : 0;

const anchorViews = buildAnchorViewSummary(finalResults);

if (!partialCompletion) {
  await deleteExistingPackImages(characterId, userId);

  const insertRows = acceptedItems.map((item) => ({
    character_id: characterId,
    user_id: userId,
    image_type: "pack",
    image_url: item.url,
    pack_view: item.type,
    source_type: "generated",
    is_canon: item.finalScore >= 8.5,
    is_cover: item.type === IMAGE_TYPES.FRONT,
    sort_order: item.sort_order,
    metadata: {
      finalScore: item.finalScore,
      identityScore: item.identityScore,
      qualityScore: item.qualityScore,
      repairedInPass2: !!item.repairedInPass2,
    },
  }));

  const { error: insertError } = await supabase
    .from("character_images")
    .insert(insertRows);

  if (insertError) {
    throw new Error(insertError.message || "Failed to save pack images");
  }

  const { error: characterUpdateError } = await supabase
    .from("characters")
    .update({
      anchor_views: anchorViews,
      processing_error: null,
    })
    .eq("id", characterId)
    .eq("user_id", userId);

  if (characterUpdateError) {
    console.error("Character update warning:", characterUpdateError);
  }
}

console.log("PACK COMPLETE", {
  elapsedSeconds: ((nowMs() - routeStart) / 1000).toFixed(2),
  acceptedCount: finalResults.filter((r) => r.accepted).length,
});

await updateGenerationJob(generationId, {
  images: acceptedItems.map((item) => item.url),
  metadata: {
    state: "completed",
    progressStage: partialCompletion ? "completed_partial_timeout" : "completed",
    completedAt: new Date().toISOString(),
    timedOut,
    partialCompletion,
    characterId,
    pack: serializePackResults(finalResults),
    model: {
      front: getModelForView(IMAGE_TYPES.FRONT),
      left: getModelForView(IMAGE_TYPES.LEFT),
      right: getModelForView(IMAGE_TYPES.RIGHT),
      back: getModelForView(IMAGE_TYPES.BACK),
      closeup: getModelForView(IMAGE_TYPES.CLOSEUP),
    },
    evaluatorModel: EVALUATOR_MODEL,
    referenceCount: maxReferenceCountUsed,
    returnedCount: finalResults.length,
    acceptedCount: finalResults.filter((r) => r.accepted).length,
    averageFinalScore,
    minimumFinalScore,
    repairedCount,
    frontImageUrl:
      finalResults.find((r) => r.type === IMAGE_TYPES.FRONT)?.url || null,
    anchorViews,
    error: null,
  },
});
  } catch (error) {
    console.error("PACK ROUTE ERROR:", error);
    await updateGenerationJob(generationId, {
      metadata: {
        state: "failed",
        progressStage: "failed",
        failedAt: new Date().toISOString(),
        error: error?.message || "Failed to generate character pack",
      },
    });
  }
}

export async function POST(req) {
  try {
    const {
      characterId,
      masterImage,
      userId,
      negativePrompt = "",
    } = await req.json();

    if (!characterId || !String(characterId).trim()) {
      return Response.json({ error: "characterId is required" }, { status: 400 });
    }

    if (!masterImage || !String(masterImage).trim()) {
      return Response.json({ error: "masterImage is required" }, { status: 400 });
    }

    if (!userId || !String(userId).trim()) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const normalizedMaster = normalizeReferenceImage(masterImage);
    if (!normalizedMaster) {
      return Response.json({ error: "Invalid master image" }, { status: 400 });
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("image_generations")
      .select("id, metadata, created_at")
      .eq("character_id", characterId)
      .eq("user_id", userId)
      .eq("mode", "character_pack")
      .order("created_at", { ascending: false })
      .limit(5);

    if (existingError) {
      console.warn("PACK ROUTE EXISTING JOB CHECK FAILED", existingError);
    }

    const activeJob = (existingRows || []).find((row) => {
      const state = String(row?.metadata?.state || "").toLowerCase();
      if (!(state === "processing" || state === "queued" || state === "")) {
        return false;
      }

      const lastProgressAt =
        getTimeMs(row?.metadata?.lastProgressAt) ||
        getTimeMs(row?.metadata?.startedAt) ||
        getTimeMs(row?.created_at);

      if (!lastProgressAt) return true;

      return nowMs() - lastProgressAt < STALE_PACK_JOB_MS;
    });

    if (activeJob?.id) {
      return Response.json({
        success: true,
        predictionId: activeJob.id,
        status: "processing",
        reused: true,
      });
    }

    const pending = await createPendingGeneration({
      userId,
      characterId,
      prompt: `Generate character pack for ${characterId}`,
      negativePrompt,
      metadata: {
        route: "generate-character-pack",
        masterImage: normalizedMaster,
      },
    });

    const dispatchMode = "route_direct";

    await updateGenerationJob(pending.id, {
      metadata: {
        state: "processing",
        progressStage: "queued_direct",
        dispatchMode,
        lastProgressAt: new Date().toISOString(),
      },
    });

    after(() =>
      runGenerationJob(pending.id, {
        characterId,
        masterImage: normalizedMaster,
        userId,
        negativePrompt,
      }).catch((err) => {
        console.error("PACK ROUTE DIRECT ERROR:", err);
      })
    );

    return Response.json({
      success: true,
      predictionId: pending.id,
      status: "processing",
      dispatchMode,
    });
  } catch (error) {
    console.error("PACK ROUTE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to generate character pack" },
      { status: 500 }
    );
  }
}
