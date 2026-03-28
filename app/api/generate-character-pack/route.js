import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";
import { IMAGE_TYPES, IMAGE_ORDER, PACK_VIEWS } from "../../../lib/character-constants";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MODEL = "black-forest-labs/flux-1.1-pro";
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
      return "3:2";
    case "1024x1024":
      return "1:1";
    default:
      return "1:1";
  }
}

function getViewPrompt(viewKey) {
  switch (viewKey) {
    case IMAGE_TYPES.FRONT:
      return "front-facing full body of the same exact person, standing straight, neutral pose, relaxed arms, centered composition, plain studio-like framing";

    case IMAGE_TYPES.LEFT:
      return "strict left side profile of the same exact person, full body, facing left, standing straight, neutral pose, relaxed arms, centered composition";

    case IMAGE_TYPES.RIGHT:
      return "strict right side profile of the same exact person, full body, facing right, standing straight, neutral pose, relaxed arms, centered composition";

    case IMAGE_TYPES.BACK:
      return "back view of the same exact person, full body, facing away from camera, standing straight, neutral pose, relaxed arms, centered composition";

    case IMAGE_TYPES.CLOSEUP:
      return "tight close-up portrait of the same exact person, face clearly visible, highly recognizable identity, neutral expression, realistic photography";

    default:
      return "full body portrait of the same exact person, natural realistic photography";
  }
}

async function fileOutputToUrl(output) {
  if (!output) return null;

  if (typeof output === "string") return output;

  if (Array.isArray(output)) {
    const first = output[0];
    if (!first) return null;

    if (typeof first === "string") return first;
    if (typeof first.url === "function") return await first.url();
    if (typeof first.url === "string") return first.url;

    const s = typeof first.toString === "function" ? first.toString() : null;
    return s && s !== "[object Object]" ? s : null;
  }

  if (typeof output.url === "function") return await output.url();
  if (typeof output.url === "string") return output.url;

  const s = typeof output.toString === "function" ? output.toString() : null;
  return s && s !== "[object Object]" ? s : null;
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

    case IMAGE_TYPES.LEFT:
      return [
        "Single person only.",
        "Strict left side profile.",
        "Face turned to the left.",
        "Full body visible from head to toe.",
        "Standing straight, neutral pose, relaxed arms.",
        "Preserve exact facial identity even from the side.",
        "Preserve exact nose bridge, nose tip, forehead slope, brow line, jawline, chin projection, ear shape, and hairline from the same person.",
        "Do not turn toward camera.",
      ].join(" ");

    case IMAGE_TYPES.RIGHT:
      return [
        "Single person only.",
        "Strict right side profile.",
        "Face turned to the right.",
        "Full body visible from head to toe.",
        "Standing straight, neutral pose, relaxed arms.",
        "Preserve exact facial identity even from the side.",
        "Preserve exact nose bridge, nose tip, forehead slope, brow line, jawline, chin projection, ear shape, and hairline from the same person.",
        "Do not turn toward camera.",
      ].join(" ");

    case IMAGE_TYPES.BACK:
      return [
        "Single person only.",
        "Back view.",
        "Facing away from camera.",
        "Full body visible from head to toe.",
        "Standing straight, neutral pose, relaxed arms.",
        "Only the viewing angle changes.",
        "Identity, body type, hairstyle, hair length, neck, shoulders, silhouette, and outfit remain the same person.",
      ].join(" ");

    case IMAGE_TYPES.CLOSEUP:
      return [
        "Single person only.",
        "Tight close-up portrait.",
        "Face clearly visible and highly recognizable.",
        "Preserve exact face shape, skin tone, hairstyle, hairline, eyebrows, eyes, nose, lips, jawline, ears, and facial hair.",
        "Close-up must look unmistakably like the same person as the master identity and front image.",
        "Natural realistic photography.",
      ].join(" ");

    default:
      return [
        "Single person only.",
        "Keep the same exact identity.",
        "Natural realistic photography.",
      ].join(" ");
  }
}

function buildNegativeBlock(negativePrompt = "", viewType = IMAGE_TYPES.FRONT) {
  const base = [
    "different person",
    "wrong identity",
    "identity drift",
    "generic face",
    "altered face shape",
    "different jawline",
    "different cheek structure",
    "different nose",
    "different eyes",
    "different lips",
    "different eyebrows",
    "different hairstyle",
    "different hairline",
    "different skin tone",
    "beauty filter",
    "plastic skin",
    "waxy skin",
    "cgi look",
    "3d render",
    "stylized face",
    "anime face",
    "doll face",
    "over-retouched skin",
    "blurry face",
    "deformed face",
    "duplicate person",
    "multiple people",
    "extra person",
    "collage",
    "split screen",
    "contact sheet",
    "character sheet",
    "text",
    "watermark",
  ];

  if (
    viewType === IMAGE_TYPES.FRONT ||
    viewType === IMAGE_TYPES.LEFT ||
    viewType === IMAGE_TYPES.RIGHT ||
    viewType === IMAGE_TYPES.BACK
  ) {
    base.push("close-up crop", "head-only crop", "partial body cut-off", "cropped feet", "cropped head");
  }

  if (negativePrompt && String(negativePrompt).trim()) {
    base.push(String(negativePrompt).trim());
  }

  return base.join(", ");
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

Determine ONE primary failureType:
- "identity_drift"
- "wrong_shot"
- "multiple_people"
- "face_not_visible"
- "low_quality"
- "bad_composition"
- "none"

Rules:
- If identity does not match → identity_drift
- If wrong angle → wrong_shot
- If >1 person → multiple_people
- If face hidden → face_not_visible
- If blurry/artifacts → low_quality
- If framing bad → bad_composition

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
      "Preserve exact face shape, skull shape, jawline, cheek structure, forehead, brow line, eyebrow shape, eye shape, eyelids, nose bridge, nose tip, nostrils, lips, chin, ears, skin tone, hairstyle, hairline, and body proportions."
    );
  }

  if (strategy.identityPriority === "very_high") {
    lines.push(
      "Identity preservation is the highest priority for this shot.",
      "Even if angle changes, the person must remain unmistakably the same human being."
    );
  }

  if (viewType === IMAGE_TYPES.LEFT || viewType === IMAGE_TYPES.RIGHT) {
    lines.push(
      "Preserve side-profile identity markers exactly: forehead slope, nose projection, nose bridge, lip projection, chin projection, jaw contour, ear shape, and hairline."
    );
  }

  if (viewType === IMAGE_TYPES.CLOSEUP) {
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
    lines.push("Subject must face left in a strict side profile.");
  }

  if (viewType === IMAGE_TYPES.RIGHT) {
    lines.push("Subject must face right in a strict side profile.");
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

  if (viewType === IMAGE_TYPES.CLOSEUP) {
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

  if (viewType === IMAGE_TYPES.CLOSEUP && fusion.faceHeavy) {
    lines.push(
      "This shot is face-critical. Prioritize exact facial identity over all non-essential styling."
    );
  }

  if (
    (viewType === IMAGE_TYPES.LEFT || viewType === IMAGE_TYPES.RIGHT) &&
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

  const negativeBlock = buildNegativeBlock(negativePrompt, viewType);

  return [
    identityBlock,
    shotBlock,
    compositionBlock,
    repairBlock,
    fusionBlock,
    packContextBlock,
    realismBlock,
    `Shot request: ${String(prompt || "").trim()}`,
    `Avoid: ${negativeBlock}`,
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
        minIdentityScore: attempt === 0 ? 7.2 : 8.0,
        minShotScore: 7.5,
        minCompositionScore: 6.8,
        minQualityScore: 6.8,
        minFinalScore: 7.5,
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
        minIdentityScore: 8.5,
        minShotScore: 7.0,
        minCompositionScore: 7.0,
        minQualityScore: 7.5,
        minFinalScore: 8.0,
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

function shouldRejectScore(score, thresholds) {
  if (!score) return true;
  if (!thresholds) return true;

  if (score.multiplePeople) return true;
  if (score.wrongShot) return true;
  if (score.faceNotVisible) return true;
  if (score.identityDrift) return true;
  if (score.lowQuality) return true;

  if (score.identityScore < thresholds.minIdentityScore) return true;
  if (score.shotScore < thresholds.minShotScore) return true;
  if (score.compositionScore < thresholds.minCompositionScore) return true;
  if (score.qualityScore < thresholds.minQualityScore) return true;
  if (score.finalScore < thresholds.minFinalScore) return true;

  return false;
}

function getReferencePriority(viewType) {
  switch (viewType) {
    case IMAGE_TYPES.FRONT:
      return ["MASTER", IMAGE_TYPES.FRONT];

    case IMAGE_TYPES.LEFT:
      return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.RIGHT];

    case IMAGE_TYPES.RIGHT:
      return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.LEFT];

    case IMAGE_TYPES.BACK:
      return ["MASTER", IMAGE_TYPES.FRONT, IMAGE_TYPES.LEFT, IMAGE_TYPES.RIGHT];

    case IMAGE_TYPES.CLOSEUP:
      return [IMAGE_TYPES.FRONT, "MASTER", IMAGE_TYPES.LEFT, IMAGE_TYPES.RIGHT];

    default:
      return ["MASTER", IMAGE_TYPES.FRONT];
  }
}

function trimReferencesForView(viewType, refs) {
  const uniqueRefs = Array.from(new Set(refs)).filter(Boolean);

  switch (viewType) {
    case IMAGE_TYPES.FRONT:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.LEFT:
    case IMAGE_TYPES.RIGHT:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.BACK:
      return uniqueRefs.slice(0, 4);

    case IMAGE_TYPES.CLOSEUP:
      return uniqueRefs.slice(0, 3);

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
    score += 14;
  }

  if (candidate.type === "MASTER") {
    score += 16;
  }

  if (targetViewType === IMAGE_TYPES.CLOSEUP) {
    score += identityScore * 2.5;
    score += qualityScore * 1.5;

    if (candidate.type === IMAGE_TYPES.FRONT) score += 10;
    if (candidate.type === IMAGE_TYPES.LEFT || candidate.type === IMAGE_TYPES.RIGHT) score += 4;
  }

  if (targetViewType === IMAGE_TYPES.BACK) {
    if (candidate.type === IMAGE_TYPES.LEFT || candidate.type === IMAGE_TYPES.RIGHT) score += 6;
    if (candidate.type === IMAGE_TYPES.FRONT) score += 3;
  }

  if (targetViewType === IMAGE_TYPES.LEFT || targetViewType === IMAGE_TYPES.RIGHT) {
    score += identityScore * 2;
    score += shotScore * 1.5;

    if (candidate.type === IMAGE_TYPES.FRONT) score += 8;
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
    if (acceptedRef?.url) {
      candidates.push({
        ...acceptedRef,
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
  const failed = collectFailedViews(results);

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
      map[item.type] = item;
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

const finalPrompt = [
  basePrompt,
  dnaIdentityBlock,
  lockedTraitsBlock,
].filter(Boolean).join("\n\n");

  const input = hasRefs
    ? {
        prompt: finalPrompt,
        aspect_ratio,
        output_format: "png",
        reference_images: refs,
      }
    : {
        prompt: finalPrompt,
        aspect_ratio,
        output_format: "png",
      };

  const output = await replicate.run(MODEL, { input });
  const tempUrl = await fileOutputToUrl(output);

  if (!tempUrl) {
    throw new Error(`No image URL returned for ${viewType}`);
  }

  const permanentUrl = await savePermanentImage({
    imageUrl: tempUrl,
    userId,
    characterId,
    viewType,
  });

  return {
    imageUrl: permanentUrl,
    tempUrl,
    finalPrompt,
    viewType,
    hasRefs,
    aspect_ratio,
    attempt,
    failureType,
    referenceCount: refs.length,
    referencesUsed: refs,
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
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.FRONT].url, detail: "high" } },

    { type: "text", text: "LEFT profile full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.LEFT].url, detail: "high" } },

    { type: "text", text: "RIGHT profile full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.RIGHT].url, detail: "high" } },

    { type: "text", text: "BACK full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.BACK].url, detail: "high" } },

    { type: "text", text: "CLOSEUP portrait:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.CLOSEUP].url, detail: "high" } },
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
    identityConsistencyScore: clampScore(parsed.identityConsistencyScore, 0),
    silhouetteConsistencyScore: clampScore(parsed.silhouetteConsistencyScore, 0),
    hairstyleConsistencyScore: clampScore(parsed.hairstyleConsistencyScore, 0),
    facialConsistencyScore: clampScore(parsed.facialConsistencyScore, 0),
    packCohesionScore: clampScore(parsed.packCohesionScore, 0),
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
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.FRONT].url, detail: "high" } },

    { type: "text", text: "LEFT profile:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.LEFT].url, detail: "high" } },

    { type: "text", text: "RIGHT profile:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.RIGHT].url, detail: "high" } },

    { type: "text", text: "BACK full-body:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.BACK].url, detail: "high" } },

    { type: "text", text: "CLOSEUP portrait:" },
    { type: "image_url", image_url: { url: packMap[IMAGE_TYPES.CLOSEUP].url, detail: "high" } },
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
    dnaConfidence: clampScore(parsed.dnaConfidence, 0),
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

    failureType: normalizeFailureType(evaluation?.failureType),
    reason: evaluation?.reason || "no_reason_provided",
  };

  const thresholds = getAdaptiveThresholds({
    viewType,
    attempt,
    referenceFusion,
  });

  const thresholdFailureReasons = getThresholdFailureReasons(normalized, thresholds);

  if (shouldRejectScore(normalized, thresholds)) {
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
    failedView.type === IMAGE_TYPES.CLOSEUP ? "1024x1024" : "1024x1536";

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

  for (let attempt = 0; attempt < 2; attempt++) {
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

      const score = await scoreGeneratedView({
        imageUrl: generated.imageUrl,
        masterImage: normalizedMaster,
        frontImageUrl,
        viewType: failedView.type,
        attempt: attempt + 3,
        referenceFusion: generated.referenceFusion,
      });

      lastScore = score;

      if (!score.accepted) {
        throw new Error(score.reason || `Repair scoring failed for ${failedView.type}`);
      }

      repairedResult = {
        type: failedView.type,
        label: failedView.label,
        url: generated.imageUrl,
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

      const message = String(err?.message || "");
      if (
        message.includes("Insufficient credit") ||
        message.includes("Payment Required") ||
        message.includes("Too Many Requests") ||
        message.includes("429") ||
        message.includes("402")
      ) {
        break;
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
        currentFrontImageUrl = repaired.url;
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
    .in("image_type", [
      IMAGE_TYPES.FRONT,
      IMAGE_TYPES.LEFT,
      IMAGE_TYPES.RIGHT,
      IMAGE_TYPES.BACK,
      IMAGE_TYPES.CLOSEUP,
    ]);

  if (error) {
    throw new Error(error.message || "Failed to clear previous pack images");
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

    await deleteExistingPackImages(characterId, userId);

    for (const view of PACK_VIEWS) {
      const size =
        view.key === IMAGE_TYPES.CLOSEUP ? "1024x1024" : "1024x1536";

const referenceSelection = buildReferenceSet({
  viewType: view.key,
  masterImage: normalizedMaster,
  acceptedViewMap,
  anchorRefs: baseAnchorRefs,
});

      const currentRefs = referenceSelection.refs;
      const rankedCandidates = referenceSelection.rankedCandidates;

      maxReferenceCountUsed = Math.max(maxReferenceCountUsed, currentRefs.length);

      console.log("Generating view:", view.key, {
  refCount: currentRefs.length,
  refs: currentRefs,
  uploadedReferenceCount: uploadedReferenceUrls.length,
  baseAnchorRefCount: baseAnchorRefs.length,
});

      let acceptedResult = null;
      let lastError = null;
      let lastScore = null;
      const basePrompt = getViewPrompt(view.key);

      for (let attempt = 0; attempt < 3; attempt++) {
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

          const score = await scoreGeneratedView({
            imageUrl: generated.imageUrl,
            masterImage: normalizedMaster,
            frontImageUrl,
            viewType: view.key,
            attempt,
            referenceFusion: generated.referenceFusion,
          });

          lastScore = score;

          if (!score.accepted) {
            throw new Error(score.reason || `Scoring failed for ${view.key}`);
          }

          acceptedResult = {
            type: view.key,
            label: view.label,
            url: generated.imageUrl,
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

          const message = String(err?.message || "");
          if (
            message.includes("Insufficient credit") ||
            message.includes("Payment Required") ||
            message.includes("Too Many Requests") ||
            message.includes("429") ||
            message.includes("402")
          ) {
            break;
          }
        }
      }

      if (!acceptedResult) {
        results.push({
          type: view.key,
          label: view.label,
          url: null,
          sort_order: IMAGE_ORDER[view.key],
          accepted: false,
          attemptsUsed: 3,
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
        });
        continue;
      }

      if (view.key === IMAGE_TYPES.FRONT) {
        frontImageUrl = acceptedResult.url;
      }

      acceptedViewMap[view.key] = acceptedResult;
      results.push(acceptedResult);

      console.log("Success:", view.key, {
        attemptsUsed: acceptedResult.attemptsUsed,
        finalScore: acceptedResult.finalScore,
        failureType: acceptedResult.failureType,
        referenceCount: acceptedResult.referenceCount,
        thresholds: acceptedResult.thresholds,
      });
    }

    let finalResults = results;
    let finalFrontImageUrl = frontImageUrl;

    if (collectFailedViews(finalResults).length > 0) {
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

    const acceptedCount = finalResults.filter((r) => r.accepted).length;

if (acceptedCount !== views.length) {
  const failedViews = finalResults
    .filter((r) => !r.accepted)
    .map((r) => r.view);

  // ✅ ADD THIS BLOCK HERE
  const failedReasons = finalResults
    .filter((r) => !r.accepted)
    .map((r) => String(r.scoreReason || r.repairError || ""))
    .join(" | ");

  if (
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
      "Replicate rate limit hit. Wait about 10 seconds and try again."
    );
  }

  // ❗ KEEP your original error BELOW
  throw new Error(
    `Pack incomplete after repair pass: only ${acceptedCount} of ${views.length} views were accepted. Failed: ${failedViews.join(", ")}`
  );
}

    let packCohesion = null;
    let usedCohesionRepair = false;

    let packMap = buildPackMap(finalResults);

    packCohesion = await evaluatePackCohesion({
      masterImage: normalizedMaster,
      packMap,
    });

    if (shouldRepairFromPackCohesion(packCohesion) && packCohesion.weakViewType !== "none") {
      const weakView = finalResults.find((r) => r.type === packCohesion.weakViewType);

      if (weakView) {
        usedCohesionRepair = true;

const repairedWeakView = await runRepairPassForView({
  failedView: {
    ...weakView,
    failureType: "identity_drift",
  },
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

        if (repairedWeakView?.accepted) {
          const cohesionRepairedView = {
            ...repairedWeakView,
            repairedFromCohesion: true,
          };

          finalResults = finalResults.map((r) =>
            r.type === cohesionRepairedView.type ? cohesionRepairedView : r
          );

          acceptedViewMap[cohesionRepairedView.type] = cohesionRepairedView;

          if (cohesionRepairedView.type === IMAGE_TYPES.FRONT) {
            finalFrontImageUrl = cohesionRepairedView.url;
          }

          packMap = buildPackMap(finalResults);
          packCohesion = await evaluatePackCohesion({
            masterImage: normalizedMaster,
            packMap,
          });
        }
      }
    }

    if (shouldRepairFromPackCohesion(packCohesion)) {
      throw new Error(
        `Pack cohesion failed: ${packCohesion.reason || "low cohesion"}`
      );
    }

for (const item of finalResults.filter((r) => r.accepted && r.url)) {
  const { error: insertError } = await supabase
    .from("character_images")
    .insert({
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
        repairedFromCohesion: !!item.repairedFromCohesion,
      },
    });

  if (insertError) {
    throw new Error(insertError.message || `Failed to save ${item.type} image`);
  }
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

    console.log("🔥 Starting DNA extraction...", {
  characterId,
  userId,
  hasMasterImage: !!normalizedMaster,
  finalResultCount: finalResults.length,
});

const finalPackMap = buildPackMap(finalResults);

const characterDNA = await extractCharacterDNA({
  masterImage: normalizedMaster,
  packMap: finalPackMap,
});

console.log("✅ DNA extracted:", {
  dnaConfidence: characterDNA?.dnaConfidence,
  bestAnchorViewTypes: characterDNA?.bestAnchorViewTypes,
  identitySummary: characterDNA?.identitySummary,
});

const anchorViews = buildAnchorViewSummary(finalResults);

console.log("💾 Saving DNA to DB...", {
  characterId,
  userId,
  dnaConfidence: characterDNA?.dnaConfidence,
  anchorViewCount: anchorViews.length,
});

const { data: existingCharacter, error: existingCharacterError } = await supabase
  .from("characters")
  .select("id, user_id, name")
  .eq("id", characterId)
  .eq("user_id", userId)
  .maybeSingle();

console.log("🔎 Character row before DNA save:", {
  existingCharacter,
  existingCharacterError,
  characterId,
  userId,
});

const { data: updatedCharacterRows, error: dnaUpdateError } = await supabase
  .from("characters")
  .update({
    dna_profile: characterDNA,
    dna_confidence: characterDNA.dnaConfidence,
    anchor_views: anchorViews,
  })
  .eq("id", characterId)
  .eq("user_id", userId)
  .select("id, user_id, dna_confidence, dna_profile, anchor_views");

if (dnaUpdateError) {
  throw new Error(dnaUpdateError.message || "Failed to save character DNA");
}

if (!updatedCharacterRows || updatedCharacterRows.length === 0) {
  throw new Error(
    `DNA save matched 0 characters. Check characterId/userId. characterId=${characterId}, userId=${userId}`
  );
}

console.log("✅ DNA saved successfully:", updatedCharacterRows[0]);

    return Response.json({
      success: true,
      pack: finalResults,
      meta: {
        model: MODEL,
        evaluatorModel: EVALUATOR_MODEL,
        referenceCount: maxReferenceCountUsed,
        usedReferences: true,
        returnedCount: finalResults.length,
        acceptedCount: finalResults.filter((r) => r.accepted).length,
        averageFinalScore,
        minimumFinalScore,
        maxAttemptsUsed,
        repairedCount,
        usedRepairPass: repairedCount > 0 || collectFailedViews(results).length > 0,
        frontImageUrl: finalFrontImageUrl,
        packCohesion,
        usedCohesionRepair,
        characterDNA,
        anchorViews,
      },
    });
  } catch (error) {
    console.error("PACK ROUTE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to generate character pack" },
      { status: 500 }
    );
  }
}