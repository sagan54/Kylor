import { createClient } from "@supabase/supabase-js";
import { IMAGE_TYPES } from "../../../lib/character-constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EVALUATOR_MODEL = process.env.EVALUATOR_MODEL || "gpt-4.1-mini";

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeModelScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const scaled = n <= 1 ? n * 10 : n;
  return Math.max(0, Math.min(10, scaled));
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

function shouldRepairFromPackCohesion(cohesion) {
  if (!cohesion) return false;
  if (cohesion.identityMismatch) return true;
  if (cohesion.hairstyleMismatch) return true;
  if (cohesion.silhouetteMismatch) return true;
  if (cohesion.packCohesionScore < 7.5) return true;
  if (cohesion.identityConsistencyScore < 7.8) return true;
  return false;
}

async function evaluatePackCohesion({ masterImage, packMap }) {
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

async function extractCharacterDNA({ masterImage, packMap }) {
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

function getMissingRequiredViews(packMap = {}) {
  const requiredViews = [
    IMAGE_TYPES.FRONT,
    IMAGE_TYPES.LEFT,
    IMAGE_TYPES.RIGHT,
    IMAGE_TYPES.BACK,
    IMAGE_TYPES.CLOSEUP,
  ];

  return requiredViews.filter((view) => !packMap?.[view]?.url);
}

export async function POST(req) {
  let characterId = null;
  let userId = null;

  try {
    const body = await req.json();
    characterId = body?.characterId;
    userId = body?.userId;

    if (!characterId || !String(characterId).trim()) {
      return Response.json({ error: "characterId is required" }, { status: 400 });
    }

    if (!userId || !String(userId).trim()) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    await supabase
      .from("characters")
      .update({
        processing_status: "processing",
        dna_status: "processing",
        cohesion_status: "processing",
        processing_error: null,
      })
      .eq("id", characterId)
      .eq("user_id", userId);

    const { data: character, error: characterError } = await supabase
      .from("characters")
      .select("id, user_id, master_image")
      .eq("id", characterId)
      .eq("user_id", userId)
      .single();

    if (characterError || !character) {
      throw new Error(characterError?.message || "Character not found");
    }

    const { data: packRows, error: packError } = await supabase
      .from("character_images")
      .select("image_url, pack_view, metadata, sort_order")
      .eq("character_id", characterId)
      .eq("user_id", userId)
      .eq("image_type", "pack")
      .order("sort_order", { ascending: true });

    if (packError) {
      throw new Error(packError.message || "Failed to load pack images");
    }

    const finalResults = (packRows || []).map((row) => ({
      type: row.pack_view,
      label: row.pack_view,
      url: row.image_url,
      evalUrl: row.image_url,
      sort_order: row.sort_order,
      accepted: true,
      finalScore: row.metadata?.finalScore || 0,
      identityScore: row.metadata?.identityScore || 0,
      qualityScore: row.metadata?.qualityScore || 0,
    }));

    const packMap = buildPackMap(finalResults);

const missingViews = getMissingRequiredViews(packMap);

console.log("DNA ROUTE PACK CHECK", {
  characterId,
  packTypes: Object.keys(packMap || {}),
  missingViews,
  packRowCount: finalResults.length,
  masterImage: character.master_image,
});

if (missingViews.length > 0) {
  await supabase
    .from("characters")
    .update({
      processing_status: "partial",
      dna_status: "skipped",
      cohesion_status: "skipped",
      processing_error: `Pack incomplete. Missing views: ${missingViews.join(", ")}`,
    })
    .eq("id", characterId)
    .eq("user_id", userId);

  return Response.json({
    success: false,
    skipped: true,
    characterId,
    reason: "Pack incomplete for DNA/cohesion processing",
    missingViews,
  });
}

    const packCohesion = await evaluatePackCohesion({
      masterImage: character.master_image,
      packMap,
    });

    if (shouldRepairFromPackCohesion(packCohesion)) {
      const softAccept =
        !packCohesion.identityMismatch &&
        !packCohesion.silhouetteMismatch &&
        packCohesion.identityConsistencyScore >= 7.8 &&
        packCohesion.packCohesionScore >= 7.0;

      if (!softAccept) {
        throw new Error(`Pack cohesion failed: ${packCohesion.reason || "low cohesion"}`);
      }
    }

    const characterDNA = await extractCharacterDNA({
      masterImage: character.master_image,
      packMap,
    });

    const anchorViews = buildAnchorViewSummary(finalResults);

    const { error: updateError } = await supabase
      .from("characters")
      .update({
        processing_status: "complete",
        dna_status: "complete",
        cohesion_status: "complete",
        dna_profile: characterDNA,
        dna_confidence: characterDNA.dnaConfidence,
        anchor_views: anchorViews,
        pack_score: packCohesion,
        processing_error: null,
      })
      .eq("id", characterId)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message || "Failed to save character DNA");
    }

    return Response.json({
      success: true,
      characterId,
      meta: {
        processed: true,
        packCohesion,
        characterDNA,
        anchorViews,
      },
    });
  } catch (error) {
    console.error("PROCESS CHARACTER DNA ERROR:", error);

    if (characterId && userId) {
      await supabase
        .from("characters")
        .update({
          processing_status: "failed",
          dna_status: "failed",
          cohesion_status: "failed",
          processing_error: error?.message || "Post-processing failed",
        })
        .eq("id", characterId)
        .eq("user_id", userId);
    }

    return Response.json(
      { error: error?.message || "Failed to process character DNA" },
      { status: 500 }
    );
  }
}