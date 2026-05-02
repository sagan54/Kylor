const UNSUPPORTED_MODELS = new Set(["veo", "seedance"]);

export const VIDEO_MODEL_FALLBACK_REASON =
  "Veo/Seedance not configured yet. Falling back to Kling.";

export function chooseVideoModel({ selectedModel = "auto" } = {}) {
  const requested = String(selectedModel || "auto").toLowerCase();

  if (!requested || requested === "auto") return "kling";
  if (requested === "kling") return "kling";
  if (UNSUPPORTED_MODELS.has(requested)) return "kling";

  return "kling";
}

export function getVideoModelFallbackReason(selectedModel) {
  const requested = String(selectedModel || "auto").toLowerCase();
  return UNSUPPORTED_MODELS.has(requested) ? VIDEO_MODEL_FALLBACK_REASON : null;
}
