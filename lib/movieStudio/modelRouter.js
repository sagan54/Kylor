const VIDEO_MODELS = new Set(["auto", "kling", "veo", "seedance"]);

function textIncludesAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function chooseVideoModel({ selectedModel = "auto", motionIntent = "", mood = "", prompt = "" } = {}) {
  const requested = String(selectedModel || "auto").toLowerCase();
  if (VIDEO_MODELS.has(requested) && requested !== "auto") {
    return requested;
  }

  const text = String(prompt || "").toLowerCase();

  if (textIncludesAny(text, ["action", "fight", "chase", "running", "explosion"])) {
    return "kling";
  }

  if (textIncludesAny(text, ["dialogue", "emotional", "storytelling"])) {
    return "seedance";
  }

  if (textIncludesAny(text, ["cinematic", "dramatic", "epic"])) {
    return "veo";
  }

  return "kling";
}
