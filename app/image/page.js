"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Compass, Clapperboard, Image as ImageIcon, Video, UserCircle2,
  Orbit, FolderKanban, Settings, Grid3X3, List, Wand2, ChevronRight,
  Bell, BellOff, X, ChevronDown, Folder, Upload, Zap, Star, Download,
  Share2, Trash2, Plus, Music, Check, Copy, CloudUpload,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { supabase } from "../../lib/supabase";

// ─── Cache keys ───────────────────────────────────────────────────────────────
const SESSION_KEY = "kylor_img_cache_v2";
const CHAR_SESSION_KEY = "kylor_img_chars_cache_v2";

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function sbLoadAll(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("image_generations")
    .select("id, prompt, negative_prompt, images, created_at, mode, ratio, style")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);

 if (error) {
  console.error("sbLoadAll failed:", error);
  return [];
}
console.log("sbLoadAll result:", data);
  return (data || []).map((row) => ({
    id: row.id,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
    ratio: row.ratio,
    mode: row.mode,
    style: row.style,
    createdAt: row.created_at,
    images: Array.isArray(row.images)
  ? row.images.map((img) => {
      if (typeof img === "string") return { url: img, starred: false };
      if (img && typeof img === "object") {
        return {
          url: img.url || null,
          starred: Boolean(img.starred),
        };
      }
      return { url: null, starred: false };
    })
  : [],
  }));
}

async function sbSaveGroup(group, userId) {
  console.log("sbSaveGroup called:", { userId, group });

  if (!userId) {
    console.error("sbSaveGroup aborted: missing userId");
    return;
  }

  const payload = {
    id: Number(group.id),
    user_id: userId,
    prompt: group.prompt,
    negative_prompt: group.negativePrompt,
    ratio: group.ratio,
    mode: group.mode,
    style: group.style,
    images: group.images,
    created_at: group.createdAt,
  };

  console.log("sbSaveGroup payload:", payload);

  const { data, error } = await supabase
    .from("image_generations")
    .upsert(payload, { onConflict: "id" })
    .select();

  if (error) {
    console.error("sbSaveGroup failed:", error);
  } else {
    console.log("sbSaveGroup success:", data);
  }
}

async function sbDeleteGroup(id, userId) {
  if (!userId) return;
  const { error } = await supabase
    .from("image_generations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) console.error("sbDeleteGroup:", error.message);
}

async function sbClearAll(userId) {
  if (!userId) return;
  const { error } = await supabase
    .from("image_generations")
    .delete()
    .eq("user_id", userId);

  if (error) console.error("sbClearAll:", error.message);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_BUCKET = "generated-images";

async function deleteImageFromStorage(userId, imageId) {
  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([
      `${userId}/${imageId}.png`,
      `${userId}/${imageId}.jpg`,
      `${userId}/${imageId}.webp`,
    ]);
  } catch (err) {
    console.warn("deleteImageFromStorage:", err.message);
  }
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  accent: "#7c3aed",
  accentSoft: "rgba(124,58,237,0.15)",
  accentBorder: "rgba(124,58,237,0.35)",
  accentGlow: "rgba(124,58,237,0.25)",
  indigo: "#4f46e5",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.13)",
  surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.055)",
  text: "white",
  textMuted: "rgba(255,255,255,0.52)",
  textDim: "rgba(255,255,255,0.32)",
  bg: "#05070c",
  sidebar: "#080a10",
};

const radius = {
  sm: "10px",
  md: "14px",
  lg: "18px",
  xl: "22px",
  full: "999px",
};

// ─── Style presets ────────────────────────────────────────────────────────────
const STYLES = [
  { id: "cinematic", label: "Cinematic", desc: "Film-grade, anamorphic lens, deep color grade", color: "#6366f1" },
  { id: "neon_noir", label: "Neon Noir", desc: "Dark city, glowing neon reflections, rain-slick", color: "#a855f7" },
  { id: "anime", label: "Anime", desc: "Japanese animation, vibrant, bold outlines", color: "#ec4899" },
  { id: "photorealistic", label: "Photorealistic", desc: "Hyper-detailed, DSLR quality, natural light", color: "#14b8a6" },
  { id: "oil_painting", label: "Oil Painting", desc: "Classical brushwork, rich texture, canvas feel", color: "#f59e0b" },
  { id: "concept_art", label: "Concept Art", desc: "Studio-quality game/film concept, dramatic", color: "#3b82f6" },
  { id: "low_poly", label: "Low Poly", desc: "Geometric, faceted shapes, minimal palette", color: "#10b981" },
  { id: "watercolor", label: "Watercolor", desc: "Soft washes, painterly, delicate paper texture", color: "#06b6d4" },
  { id: "retro_scifi", label: "Retro Sci-Fi", desc: "70s pulp art, retrofuturism, gritty print", color: "#f97316" },
  { id: "dark_fantasy", label: "Dark Fantasy", desc: "Moody, mythic, smoke and shadow", color: "#8b5cf6" },
  { id: "studio_photo", label: "Studio Photo", desc: "Clean professional shot, neutral backdrop", color: "#64748b" },
  { id: "impressionist", label: "Impressionist", desc: "Loose brushstrokes, dappled light, movement", color: "#84cc16" },
];

const SIDEBAR_ITEMS = [
  { label: "Home", icon: Compass, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Story", icon: Clapperboard, href: "/story" },
  { label: "Image", icon: ImageIcon, href: "/image", active: true },
  { label: "Video", icon: Video, href: "/video" },
  { label: "Consistency", icon: UserCircle2, href: "/consistency" },
  { label: "Motion", icon: Orbit, href: "#" },
  { label: "Projects", icon: FolderKanban, href: "/story" },
  { label: "Settings", icon: Settings, href: "#" },
];

const MODES = ["1K SD", "2K HD", "4K"];
const RATIOS = ["Auto", "9:16", "2:3", "3:4", "1:1", "4:3", "3:2", "16:9", "21:9"];
const OUTPUTS = [1, 2, 3, 4];
const CONTENT_TABS = ["All", "Images", "Videos", "Audio"];

const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(124,58,237,0.35))",
  "linear-gradient(135deg, rgba(124,58,237,0.5),  rgba(17,17,34,0.9))",
  "linear-gradient(135deg, rgba(49,46,129,0.65),  rgba(79,70,229,0.4))",
  "linear-gradient(135deg, rgba(91,33,182,0.55),  rgba(55,48,163,0.45))",
  "linear-gradient(135deg, rgba(67,56,202,0.6),   rgba(124,58,237,0.35))",
  "linear-gradient(135deg, rgba(109,92,255,0.45), rgba(49,46,129,0.55))",
];

// ─── Misc helpers ─────────────────────────────────────────────────────────────
function getApiSize(r) {
  if (["9:16", "2:3", "3:4"].includes(r)) return "1024x1536";
  if (["16:9", "21:9", "4:3", "3:2"].includes(r)) return "1536x1024";
  return "1024x1024";
}

function getApiQuality(m) {
  if (m === "1K SD") return "low";
  if (m === "4K") return "high";
  return "medium";
}
function getCompositionHint(ratio, sceneText = "") {
  const text = String(sceneText || "").toLowerCase();

  if (text.includes("close up") || text.includes("close-up") || text.includes("headshot")) {
    return "close-up framing, face-focused composition, intentional portrait crop";
  }

  if (text.includes("wide shot") || text.includes("wide angle") || text.includes("environment shot")) {
    return "wide shot, subject fully integrated in the environment, cinematic environmental framing, not a close-up portrait";
  }

  if (text.includes("full body") || text.includes("full-body")) {
    return "full-body composition, subject visible from head to toe, balanced framing, not cropped";
  }

  if (text.includes("medium shot") || text.includes("mid shot") || text.includes("mid-shot")) {
    return "medium shot composition, subject framed from the waist or torso upward, balanced cinematic framing";
  }

  if (ratio === "16:9" || ratio === "21:9") {
    return "widescreen cinematic composition, environment clearly visible, do not default to a face-only close-up";
  }

  if (ratio === "9:16") {
    return "vertical composition, full subject framing when relevant, not an accidental face-only crop";
  }

  return "composition should follow the scene request exactly and should not default to a close-up unless explicitly requested";
}

const STYLE_PROMPT_MAP = {
  cinematic:
    "cinematic film still, anamorphic lens feel, production-grade composition, dramatic lighting, rich color depth, high-end movie frame",
  neon_noir:
    "neon noir aesthetic, dark moody atmosphere, glowing neon reflections, rain-slick surfaces, deep shadows, stylish urban contrast",
  anime:
    "anime style, clean bold linework, expressive shapes, vibrant color separation, polished cinematic anime frame",
  photorealistic:
    "photorealistic, ultra-detailed, DSLR realism, natural lighting, realistic skin texture, grounded physical detail",
  oil_painting:
    "classical oil painting, rich painterly brushwork, textured canvas feel, museum-quality color treatment",
  concept_art:
    "high-end concept art, film-production design quality, dramatic atmosphere, detailed environment painting",
  low_poly:
    "low poly 3D style, faceted geometric forms, simplified surfaces, stylized minimal rendering",
  watercolor:
    "watercolor painting style, soft pigment washes, delicate paper texture, airy painterly finish",
  retro_scifi:
    "retro sci-fi illustration, 70s retrofuturism, vintage pulp aesthetic, gritty print-inspired visual treatment",
  dark_fantasy:
    "dark fantasy atmosphere, moody smoke and shadow, mythic tone, dramatic mystical environment",
  studio_photo:
    "professional studio photography, clean controlled lighting, neutral backdrop, polished editorial portrait setup",
  impressionist:
    "impressionist painting, loose brushstrokes, dappled light, atmospheric motion, painterly softness",
};

function buildPositivePrompt({
  scenePrompt = "",
  characterPrompt = "",
  styleId = null,
  ratio = "1:1",
}) {
  const styleText = styleId ? STYLE_PROMPT_MAP[styleId] : "";
  const composition = getCompositionHint(ratio, scenePrompt);

  return [
    `Scene: ${scenePrompt.trim()}`,
    `Composition: ${composition}`,
    characterPrompt?.trim() ? `Character: ${characterPrompt.trim()}` : null,
    styleText ? `Style direction: ${styleText}` : null,
    "Preserve the requested scene, framing, action, environment, and outfit details.",
    "Do not default to a close-up portrait unless the prompt explicitly asks for one.",
    "No text, no captions, no subtitles, no watermark.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files = []) {
  const urls = await Promise.all(
    files.map(async (file) => {
      try {
        return await fileToDataUrl(file);
      } catch {
        return null;
      }
    })
  );

  return urls.filter(Boolean);
}

function getCharacterReferenceImages(character) {
  if (!character) return [];

  const refs = [
    character.referenceImage,
    character.coverImage,
    ...(Array.isArray(character.generatedImages) ? character.generatedImages : []),
  ].filter(Boolean);

  return [...new Set(refs)];
}

async function downloadImage(url, filename = "kylor-output.png") {
  if (!url || typeof url !== "string") return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = Object.assign(document.createElement("a"), {
      href: objectUrl,
      download: filename,
    });

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

async function shareImage({ url, title, text }) {
  try {
    if (!url || typeof url !== "string") return false;

    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function mapCharacterRow(row) {
  let traits = {};
  try {
    traits = JSON.parse(row.prompt || "{}");
  } catch {}

  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    referenceImage: row.reference_image || null,
    generatedImages: Array.isArray(row.generated_images) ? row.generated_images : [],
    coverImage:
      row.cover_image ||
      (Array.isArray(row.generated_images) && row.generated_images[0]) ||
      row.reference_image ||
      null,
    gender: traits.gender || "",
    ageRange: traits.ageRange || "",
    ethnicity: traits.ethnicity || "",
    hairStyle: traits.hairStyle || "",
    hairColor: traits.hairColor || "",
    eyeColor: traits.eyeColor || "",
    build: traits.build || "",
    charDesc: traits.charDesc || row.description || "",
  };
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "grid",
        justifyItems: "center",
        gap: "6px",
        padding: "10px 6px",
        borderRadius: radius.lg,
        background: item.active
          ? "linear-gradient(160deg,rgba(79,70,229,0.22),rgba(124,58,237,0.14))"
          : "transparent",
        border: `1px solid ${item.active ? C.border : "transparent"}`,
        color: item.active ? C.text : C.textMuted,
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: item.active
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={17} />
      </div>
      <span style={{ fontSize: "10.5px", textAlign: "center", lineHeight: 1.2 }}>
        {item.label}
      </span>
    </motion.div>
  );

  return item.href === "#" ? (
    <div>{inner}</div>
  ) : (
    <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}

// ─── Segment Control ──────────────────────────────────────────────────────────
function SegmentControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length},1fr)`,
        gap: 6,
        padding: 4,
        borderRadius: radius.lg,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <motion.button
            key={opt}
            onClick={() => onChange(opt)}
            whileTap={{ scale: 0.96 }}
            style={{
              height: 36,
              borderRadius: radius.sm,
              border: active
                ? `1px solid ${C.accentBorder}`
                : "1px solid transparent",
              background: active
                ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.13))"
                : "transparent",
              color: active ? "white" : C.textMuted,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.16s ease",
            }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({ files, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (dropped.length) onFiles((p) => [...p, ...dropped].slice(0, 10));
    },
    [onFiles]
  );

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: dragging ? C.accent : "rgba(255,255,255,0.08)",
          background: dragging ? C.accentSoft : C.surface,
        }}
        style={{
          borderRadius: radius.md,
          border: "1.5px dashed rgba(255,255,255,0.08)",
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            onFiles((p) =>
              [
                ...p,
                ...Array.from(e.target.files).filter((f) =>
                  f.type.startsWith("image/")
                ),
              ].slice(0, 10)
            );
            e.target.value = "";
          }}
        />
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: radius.sm,
            flexShrink: 0,
            background: C.accentSoft,
            border: `1px solid ${C.accentBorder}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Upload size={14} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
            Drop images or <span style={{ color: "#a78bfa" }}>browse</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            PNG, JPG, WEBP · max 10 refs
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: files.length > 0 ? "#a78bfa" : C.textDim,
            fontWeight: 600,
          }}
        >
          {files.length}/10
        </div>
      </motion.div>

      {files.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {files.map((file, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${C.accentBorder}`,
              }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFiles((p) => p.filter((_, j) => j !== i));
                }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.75)",
                  border: "none",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Styles Picker ────────────────────────────────────────────────────────────
function StylesPicker({ value, onChange, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "calc(100% + 10px)",
        zIndex: 20,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        background:
          "linear-gradient(180deg, rgba(13,16,28,0.985), rgba(9,11,20,0.985))",
        backdropFilter: "blur(20px)",
        boxShadow:
          "0 30px 90px rgba(0,0,0,0.58), 0 0 0 1px rgba(255,255,255,0.025) inset",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "#b8a8ff",
              marginBottom: 4,
            }}
          >
            Style Library
          </div>
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Pick a visual direction for this generation
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.03)",
            color: C.textMuted,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <X size={13} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        {STYLES.map((s) => {
          const active = value === s.id;

          return (
            <motion.button
              key={s.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onChange(active ? null : s.id);
                if (!active) onClose();
              }}
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "12px 12px 11px",
                borderRadius: 14,
                border: `1px solid ${active ? s.color + "55" : "rgba(255,255,255,0.07)"}`,
                background: active
                  ? `linear-gradient(180deg, ${s.color}18, rgba(255,255,255,0.03))`
                  : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02))",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "all 0.16s ease",
                display: "grid",
                gap: 6,
                minHeight: 78,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: active
                    ? `linear-gradient(90deg, ${s.color}, rgba(255,255,255,0.2))`
                    : "transparent",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      flexShrink: 0,
                      background: s.color,
                      boxShadow: `0 0 12px ${s.color}80`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? C.text : "rgba(255,255,255,0.92)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.label}
                  </span>
                </div>

                {active && <Check size={12} color={s.color} />}
              </div>

              <span
                style={{
                  fontSize: 10.8,
                  color: active ? "rgba(255,255,255,0.74)" : C.textDim,
                  lineHeight: 1.45,
                }}
              >
                {s.desc}
              </span>
            </motion.button>
          );
        })}
      </div>

      {value && (
        <button
          onClick={() => onChange(null)}
          style={{
            marginTop: 12,
            width: "100%",
            height: 36,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.025)",
            color: C.textMuted,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Clear style
        </button>
      )}
    </motion.div>
  );
}

// ─── Generation Feed Card ─────────────────────────────────────────────────────
function GenerationCard({
  group,
  isLatest,
  onDelete,
  onToggleFavorite,
  onDownload,
  onShare,
  onOpenLightbox,
  onVariation,
  generating,
  isMobile,
  isTablet,
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const featured = group.images[featuredIdx];

  async function copyPrompt() {
    if (!group.prompt) return;
    try {
      await navigator.clipboard.writeText(group.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 20,
        border: `1px solid ${isLatest ? C.accentBorder : C.border}`,
        background: isLatest ? "rgba(124,58,237,0.04)" : "rgba(255,255,255,0.015)",
        overflow: "hidden",
        boxShadow: isLatest
          ? "0 0 0 1px rgba(124,58,237,0.08) inset, 0 8px 32px rgba(0,0,0,0.3)"
          : "none",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              flexShrink: 0,
              background: "linear-gradient(135deg,#6D5CFF,#9d4edd)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 11,
              color: "#fff",
            }}
          >
            V1
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Kylor V1</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(group.createdAt)}</div>
          </div>
          {isLatest && (
            <div
              style={{
                padding: "2px 8px",
                borderRadius: radius.full,
                background: C.accentSoft,
                border: `1px solid ${C.accentBorder}`,
                fontSize: 10.5,
                color: "#c4b5fd",
                fontWeight: 700,
              }}
            >
              Latest
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {[
            {
              icon: Star,
              action: () => onToggleFavorite?.(group.id, featuredIdx),
              active: featured?.starred,
              activeColor: "#fbbf24",
              activeFill: "#fbbf24",
            },
            { icon: Download, action: () => featured?.url && onDownload?.(featured) },
            { icon: Share2, action: () => featured?.url && onShare?.(featured) },
            { icon: Trash2, action: () => onDelete?.(group.id), danger: true },
          ].map(({ icon: Icon, action, active, activeColor, activeFill, danger }, i) => (
            <button
              key={i}
              onClick={action}
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                cursor: "pointer",
                border: `1px solid ${
                  danger
                    ? "rgba(248,113,113,0.25)"
                    : active
                    ? `${activeColor}40`
                    : C.border
                }`,
                background: danger
                  ? "rgba(248,113,113,0.07)"
                  : active
                  ? `${activeColor}12`
                  : C.surface,
                color: danger ? "#f87171" : active ? activeColor : C.textMuted,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon size={13} fill={active && activeFill ? activeFill : "none"} />
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 320px",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: isMobile ? 240 : isTablet ? 300 : 360,
            background: "#05070c",
            borderRight: isMobile || isTablet ? "none" : `1px solid ${C.border}`,
            borderBottom: isMobile || isTablet ? `1px solid ${C.border}` : "none",
            overflow: "hidden",
          }}
        >
          {featured?.url ? (
            <img
              src={featured.url}
              alt={group.prompt}
              onClick={() => onOpenLightbox?.(featured, group.prompt)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                cursor: "zoom-in",
                maxHeight: 560,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                minHeight: 360,
                background: CARD_GRADIENTS[(group.id || 0) % CARD_GRADIENTS.length],
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <ImageIcon size={42} color="rgba(255,255,255,0.18)" />
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  maxWidth: 220,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {group.prompt}
              </span>
            </div>
          )}

          {group.images.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {group.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIdx(idx)}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 9,
                    overflow: "hidden",
                    padding: 0,
                    cursor: "pointer",
                    border: `2px solid ${
                      featuredIdx === idx ? C.accent : "rgba(255,255,255,0.18)"
                    }`,
                    background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length],
                    flexShrink: 0,
                    transition: "border-color 0.15s ease",
                  }}
                >
                  {img.url && (
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {featured?.url && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "4px 10px",
                borderRadius: radius.full,
                background: "rgba(0,0,0,0.58)",
                backdropFilter: "blur(8px)",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                pointerEvents: "none",
              }}
            >
              Click to zoom
            </div>
          )}
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[group.ratio, group.mode, group.style].filter(Boolean).map((tag) => (
              <div
                key={tag}
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: radius.full,
                  border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11.5,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {tag}
              </div>
            ))}
            {group.images.length > 1 && (
              <div
                style={{
                  height: 26,
                  padding: "0 10px",
                  borderRadius: radius.full,
                  border: `1px solid ${C.accentBorder}`,
                  background: C.accentSoft,
                  color: "#c4b5fd",
                  fontSize: 11.5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ImageIcon size={10} /> {group.images.length} images
              </div>
            )}
          </div>

          <div
            style={{
              flex: 1,
              borderRadius: radius.md,
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.02)",
              padding: "10px 12px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                }}
              >
                Prompt
              </div>
              <button
                onClick={copyPrompt}
                style={{
                  height: 24,
                  padding: "0 8px",
                  borderRadius: 7,
                  cursor: "pointer",
                  border: `1px solid ${copiedPrompt ? C.accentBorder : C.border}`,
                  background: copiedPrompt ? C.accentSoft : C.surface,
                  color: copiedPrompt ? "#c4b5fd" : C.textMuted,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontFamily: "inherit",
                  transition: "all 0.16s",
                }}
              >
                {copiedPrompt ? <Check size={10} /> : <Copy size={10} />}
                {copiedPrompt ? "Copied" : "Copy"}
              </button>
            </div>

            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.82)",
                fontSize: 12.5,
                lineHeight: 1.65,
                wordBreak: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: 7,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {group.prompt}
            </p>
          </div>

          {group.negativePrompt && (
            <div
              style={{
                borderRadius: radius.sm,
                border: "1px solid rgba(248,113,113,0.2)",
                background: "rgba(248,113,113,0.04)",
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#fca5a5",
                  marginBottom: 4,
                }}
              >
                Negative
              </div>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {group.negativePrompt}
              </p>
            </div>
          )}

          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.textMuted,
                marginBottom: 6,
              }}
            >
              Variations
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[1, 2, 3, 4].map((v, i) => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onVariation?.(group, i)}
                  disabled={generating}
                  style={{
                    height: 34,
                    borderRadius: radius.sm,
                    cursor: generating ? "default" : "pointer",
                    border: `1px solid ${C.border}`,
                    background: generating ? "rgba(255,255,255,0.02)" : C.surface,
                    color: generating ? C.textDim : C.textMuted,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  V{v}
                </motion.button>
              ))}
            </div>
          </div>

          <button
            onClick={() => featured?.url && onDownload?.(featured)}
            style={{
              height: 40,
              borderRadius: radius.sm,
              border: `1px solid ${C.accentBorder}`,
              background: C.accentSoft,
              color: "#c4b5fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            <Download size={13} /> Download image
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ImagePage() {
  const [topTab, setTopTab] = useState("All");
  const [contentFilter, setContentFilter] = useState("All");
  const [assetView, setAssetView] = useState("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [scenePrompt, setScenePrompt] = useState("");
  const charLimit = 500;
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");

  const [stylesOpen, setStylesOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [refImages, setRefImages] = useState([]);
  const [showCharacterModal, setShowCharacterModal] = useState(false);

  const [savedCharacters, setSavedCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  const [ratio, setRatio] = useState("16:9");
  const [mode, setMode] = useState("2K HD");
  const [outputCount, setOutputCount] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifState, setNotifState] = useState("idle");

const [userId, setUserId] = useState(null);
const [authReady, setAuthReady] = useState(false);

const [groups, setGroups] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [lightboxItem, setLightboxItem] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const panelRef = useRef(null);
  const stylesRef = useRef(null);
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);

  function loadCharacterFromSessionPayload() {
    try {
      const raw = sessionStorage.getItem("kylor_selected_character_payload");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function loadSavedCharacters() {
    try {
      setLoadingCharacters(true);

      const payloadCharacter = loadCharacterFromSessionPayload();

      try {
        const raw = localStorage.getItem(CHAR_SESSION_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            let cachedCharacters = cached.map(mapCharacterRow);

            if (payloadCharacter) {
              const exists = cachedCharacters.some((c) => String(c.id) === String(payloadCharacter.id));
              if (!exists) cachedCharacters = [payloadCharacter, ...cachedCharacters];
            }

            setSavedCharacters(cachedCharacters);

            const selectedId = sessionStorage.getItem("kylor_selected_character_id");
            if (selectedId) {
              const found = cachedCharacters.find((c) => String(c.id) === String(selectedId));
              if (found) setSelectedCharacter(found);
            } else if (payloadCharacter) {
              setSelectedCharacter(payloadCharacter);
            }
          }
        }
      } catch {}

      const { data: { session } } = await supabase.auth.getSession();
      let uid = session?.user?.id ?? null;

      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id ?? null;
      }

      if (!uid) {
        if (payloadCharacter) {
          setSavedCharacters([payloadCharacter]);
          setSelectedCharacter(payloadCharacter);
        } else {
          setSavedCharacters([]);
          setSelectedCharacter(null);
        }
        return;
      }

      const { data, error } = await supabase
        .from("characters")
        .select("id, name, description, prompt, reference_image, generated_images, cover_image, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Failed to load saved characters:", error?.message);

        if (payloadCharacter) {
          setSavedCharacters([payloadCharacter]);
          setSelectedCharacter(payloadCharacter);
        } else {
          setSavedCharacters([]);
        }
        return;
      }

      const mapped = data.map(mapCharacterRow);

      let finalCharacters = mapped;

      if (payloadCharacter) {
        const exists = mapped.some((c) => String(c.id) === String(payloadCharacter.id));
        if (!exists) {
          finalCharacters = [payloadCharacter, ...mapped];
        }
      }

      setSavedCharacters(finalCharacters);

      try {
        localStorage.setItem(CHAR_SESSION_KEY, JSON.stringify(data));
      } catch {}

      const selectedId = sessionStorage.getItem("kylor_selected_character_id");
      if (selectedId) {
        const found = finalCharacters.find((c) => String(c.id) === String(selectedId));
        if (found) {
          setSelectedCharacter(found);
        }
      } else if (payloadCharacter) {
        setSelectedCharacter(payloadCharacter);
      }
    } catch (err) {
      console.error("loadSavedCharacters error:", err);
      setSavedCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  }

  function handleSelectCharacter(character) {
    setSelectedCharacter(character);
    try {
      sessionStorage.setItem("kylor_selected_character_id", String(character.id));
    } catch {}
    setShowCharacterModal(false);
  }

  function clearSelectedCharacter() {
    setSelectedCharacter(null);
    setPrompt("");
    setScenePrompt("");
    try {
      sessionStorage.removeItem("kylor_selected_character_id");
      sessionStorage.removeItem("kylor_selected_character_payload");
    } catch {}
  }

    useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1100);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadSavedCharacters();
  }, []);

  useEffect(() => {
    if (!selectedCharacter) {
      setPrompt("");
      return;
    }

    const traitParts = [
      selectedCharacter.gender,
      selectedCharacter.ageRange,
      selectedCharacter.ethnicity,
      selectedCharacter.hairColor && selectedCharacter.hairStyle
        ? `${selectedCharacter.hairColor} ${selectedCharacter.hairStyle} hair`
        : null,
      selectedCharacter.eyeColor ? `${selectedCharacter.eyeColor} eyes` : null,
      selectedCharacter.build ? `${selectedCharacter.build} build` : null,
    ].filter(Boolean);

    const characterPrompt = [
      `Use the same character: ${selectedCharacter.name}`,
      traitParts.length ? traitParts.join(", ") : null,
      selectedCharacter.charDesc || null,
      "Maintain the same facial features, hairstyle, skin tone, proportions, and identity.",
    ]
      .filter(Boolean)
      .join(". ");

    setPrompt(characterPrompt);
  }, [selectedCharacter]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (mounted && Array.isArray(cached) && cached.length > 0) {
            setGroups(cached);
          }
        }
      } catch {}

      const { data: { session } } = await supabase.auth.getSession();
      let uid = session?.user?.id ?? null;

      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id ?? null;
      }

      if (!mounted) return;

setUserId(uid);
setAuthReady(true);
console.log("Resolved userId:", uid);

if (!uid) {
  setDbLoaded(true);
  return;
}

      const fresh = await sbLoadAll(uid);

      if (!mounted) return;

      setGroups(fresh);
      setDbLoaded(true);

      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
      } catch {}
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let uid = session?.user?.id ?? null;

      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id ?? null;
      }

      if (!mounted) return;

setUserId(uid);
setAuthReady(true);

if (!uid) return;

      const fresh = await sbLoadAll(uid);

      if (!mounted) return;

      setGroups(fresh);
      setDbLoaded(true);

      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
      } catch {}
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
      if (stylesRef.current && !stylesRef.current.contains(e.target)) {
        setStylesOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function syncCache(updatedGroups) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedGroups));
    } catch {}
  }

  const activeStyle = STYLES.find((s) => s.id === selectedStyle);

  async function handleAllowNotifications() {
    if (!("Notification" in window)) {
      setNotifState("dismissed");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setNotifState(p === "granted" ? "granted" : "denied");
    } catch {
      setNotifState("dismissed");
    }
  }

  async function deleteGroup(groupId) {
    const group = groups.find((g) => g.id === groupId);
    const next = groups.filter((g) => g.id !== groupId);
    setGroups(next);
    syncCache(next);

    if (lightboxItem?.groupId === groupId) setLightboxItem(null);

    await sbDeleteGroup(groupId, userId);

if (group && userId) {
  const storageImages = group.images.filter(
    (img) => typeof img?.url === "string" && img.url.includes("/storage/v1/object/public/")
  );

  await Promise.all(
    storageImages.map((_, i) => deleteImageFromStorage(userId, `${groupId}-${i}`))
  );
}
  }

  async function toggleFavorite(groupId, imgIdx) {
    let updated;
    setGroups((p) => {
      const next = p.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              images: g.images.map((img, i) =>
                i === imgIdx ? { ...img, starred: !img.starred } : img
              ),
            }
      );
      updated = next.find((g) => g.id === groupId);
      syncCache(next);
      return next;
    });

    if (updated) await sbSaveGroup(updated, userId);
  }

  async function handleDownload(img) {
    if (!img?.url || typeof img.url !== "string") return;
    await downloadImage(img.url, `kylor-${Date.now()}.png`);
  }

  async function handleShare(img) {
    if (!img?.url || typeof img.url !== "string") return;
    await shareImage({
      url: img.url,
      title: "Kylor image",
      text: "Created with Kylor",
    });
  }

  async function clearAll() {
    if (!confirm("Delete all saved generations? This cannot be undone.")) return;
    setGroups([]);
    setLightboxItem(null);
    syncCache([]);
    await sbClearAll(userId);
  }
  async function handleGenerate() {
  const trimmedScenePrompt = scenePrompt.trim();
  if (!trimmedScenePrompt || generating) return;

  let effectiveUserId = userId;

  if (!effectiveUserId) {
    console.warn("userId state missing, checking Supabase auth directly...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to get user from Supabase:", userError);
    }

    effectiveUserId = user?.id ?? null;

    if (effectiveUserId) {
      setUserId(effectiveUserId);
      console.log("Recovered userId from Supabase:", effectiveUserId);
    }
  }

  if (!effectiveUserId) {
    console.error("No userId found.");
    alert("No user session found. Please log in again.");
    return;
  }

  setGenerating(true);
  canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const styleLabel = activeStyle?.label ?? null;
  const characterPrompt = selectedCharacter ? prompt.trim() : "";

  const positivePrompt = buildPositivePrompt({
    scenePrompt: trimmedScenePrompt,
    characterPrompt,
    styleId: selectedStyle,
    ratio,
  });

  const uploadedReferenceImages = await filesToDataUrls(refImages);
  const characterReferenceImages = getCharacterReferenceImages(selectedCharacter);

  const uniqueReferenceImages = [
    ...new Set([...characterReferenceImages, ...uploadedReferenceImages].filter(Boolean)),
  ];

  const hasCharacterControl =
    Boolean(characterPrompt) || uniqueReferenceImages.length > 0;

  const n = Math.min(outputCount, 4);

  try {
    const requests = Array.from({ length: n }, () =>
      fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          prompt: positivePrompt,
          scenePrompt: trimmedScenePrompt,
          characterPrompt: hasCharacterControl ? characterPrompt : "",
          style: selectedStyle,
          styleLabel,
          stylePrompt: selectedStyle ? STYLE_PROMPT_MAP[selectedStyle] : "",
          negativePrompt: negativePrompt.trim(),
          referenceImages: hasCharacterControl ? uniqueReferenceImages : [],
          useCharacter: hasCharacterControl,
          ratio,
          size: getApiSize(ratio),
          quality: getApiQuality(mode),
          n: 1,
        }),
      }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || "Generation failed");
        return data;
      })
    );

    const results = await Promise.all(requests);

    const newGroups = results
      .map((d) => {
        const row = d?.generation;
        if (!row) return null;

        return {
          id: row.id,
          prompt: row.prompt,
          negativePrompt: row.negative_prompt,
          ratio: row.ratio,
          mode: row.mode,
          style: row.style,
          createdAt: row.created_at,
          images: Array.isArray(row.images)
            ? row.images.map((img) => {
                if (typeof img === "string") return { url: img, starred: false };
                if (img && typeof img === "object") {
                  return {
                    url: img.url || null,
                    path: img.path || null,
                    starred: Boolean(img.starred),
                  };
                }
                return { url: null, starred: false };
              })
            : [],
        };
      })
      .filter(Boolean);

    if (!newGroups.length) {
      throw new Error("No saved generation returned from API");
    }

    setGroups((p) => {
      const next = [...newGroups, ...p];
      syncCache(next);
      return next;
    });

    if (notifState === "granted" && "Notification" in window) {
      new Notification("Kylor", { body: "Your image generation is complete." });
    }
  } catch (err) {
    console.error("Generation failed:", err);
    alert(err?.message || "Generation failed");
  } finally {
    setGenerating(false);
  }
}

  async function handleVariation(group, variationIndex) {
  if (!group?.prompt || generating) return;

  setGenerating(true);
  canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  let effectiveUserId = userId;

  if (!effectiveUserId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to get user from Supabase:", userError);
    }

    effectiveUserId = user?.id ?? null;

    if (effectiveUserId) {
      setUserId(effectiveUserId);
    }
  }

  if (!effectiveUserId) {
    alert("No user session found. Please log in again.");
    setGenerating(false);
    return;
  }

  const variationPrompt = [
    group.prompt,
    `Variation ${variationIndex + 1}. Keep the same subject and overall style, but change composition and details slightly.`,
    "Preserve the requested scene instead of collapsing into a face-only close-up.",
    "No text, no captions, no subtitles, no watermark.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: effectiveUserId,
        prompt: variationPrompt,
        negativePrompt: group.negativePrompt || "",
        styleLabel: group.style || "",
        ratio: group.ratio,
        size: getApiSize(group.ratio),
        quality: getApiQuality(group.mode),
        n: 1,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || "Variation failed");
    }

    const row = data?.generation;
    if (!row) {
      throw new Error("No saved variation returned from API");
    }

    const newGroup = {
      id: row.id,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt,
      ratio: row.ratio,
      mode: row.mode,
      style: row.style,
      createdAt: row.created_at,
      images: Array.isArray(row.images)
        ? row.images.map((img) => {
            if (typeof img === "string") return { url: img, starred: false };
            if (img && typeof img === "object") {
              return {
                url: img.url || null,
                path: img.path || null,
                starred: Boolean(img.starred),
              };
            }
            return { url: null, starred: false };
          })
        : [],
    };

    setGroups((p) => {
      const next = [newGroup, ...p];
      syncCache(next);
      return next;
    });

    if (notifState === "granted" && "Notification" in window) {
      new Notification("Kylor", {
        body: `Variation V${variationIndex + 1} is ready.`,
      });
    }
  } catch (err) {
    console.error("Variation failed:", err);
    alert(err?.message || "Variation failed");
  } finally {
    setGenerating(false);
  }
}

  const filteredGroups = useMemo(() => {
    if (contentFilter === "Videos" || contentFilter === "Audio") return [];
    if (favoritesOnly) return groups.filter((g) => g.images.some((i) => i.starred));
    return groups;
  }, [groups, contentFilter, favoritesOnly]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 8% 12%,rgba(79,70,229,0.13),transparent 28%),radial-gradient(ellipse at 92% 8%,rgba(124,58,237,0.11),transparent 30%),${C.bg}`,
        color: C.text,
        fontFamily: "'Inter','SF Pro Display',sans-serif",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "88px 1fr",
        overflow: "hidden",
      }}
    >      <aside
        style={{
          borderRight: isMobile ? "none" : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : "none",
          background: C.sidebar,
          padding: isMobile ? "12px 10px" : "18px 10px",
          height: isMobile ? "auto" : "100vh",
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          overflowX: isMobile ? "auto" : "hidden",
          overflowY: "hidden",
          gap: isMobile ? 10 : 0,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            margin: isMobile ? "0 6px 0 0" : "0 auto 22px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            background: "linear-gradient(135deg,rgba(79,70,229,0.28),rgba(124,58,237,0.18))",
            border: `1px solid ${C.border}`,
            boxShadow: `0 0 20px ${C.accentGlow}`,
          }}
        >
          <Sparkles size={20} color="#a78bfa" />
        </div>

        <div
          style={{
            display: isMobile ? "flex" : "grid",
            gap: 8,
            overflowX: isMobile ? "auto" : "visible",
            width: "100%",
          }}
        >
          {SIDEBAR_ITEMS.map((item) => (
            <div key={item.label} style={{ flex: isMobile ? "0 0 auto" : "unset" }}>
              <SidebarItem item={item} />
            </div>
          ))}
        </div>
      </aside>

      <div
        style={{
          display: "grid",
          gridTemplateRows: isMobile ? "auto auto 1fr" : "48px 1fr",
          minHeight: isMobile ? "calc(100vh - 74px)" : "100vh",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "10px 12px" : "0 18px",
            background: "rgba(255,255,255,0.01)",
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: isMobile ? 10 : 0,
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {["All", "Output", "Projects"].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTopTab(tab)}
                style={{
                  height: 30,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: `1px solid ${topTab === tab ? C.accentBorder : "transparent"}`,
                  background: topTab === tab ? C.accentSoft : "transparent",
                  color: topTab === tab ? "#c4b5fd" : C.textMuted,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: topTab === tab ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {tab}
              </motion.button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(
              ({ icon: Icon, val }) => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setAssetView(val)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: radius.sm,
                    border: `1px solid ${C.border}`,
                    background:
                      assetView === val ? "rgba(255,255,255,0.08)" : "transparent",
                    color: assetView === val ? C.text : C.textMuted,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={15} />
                </motion.button>
              )
            )}

            <motion.button
              whileHover={{ borderColor: C.borderHover }}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: radius.sm,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: "rgba(255,255,255,0.8)",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              <Folder size={13} /> Assets
            </motion.button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "320px 1fr" : "380px 1fr",
            height: "100%",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <div
            style={{
              borderRight: isMobile ? "none" : `1px solid ${C.border}`,
              borderBottom: isMobile ? `1px solid ${C.border}` : "none",
              background: "linear-gradient(180deg,rgba(7,9,15,0.98),rgba(9,11,17,0.98))",
              height: "100%",
              overflow: isMobile ? "visible" : "hidden",
              display: "flex",
              flexDirection: "column",
              padding: isMobile ? 12 : 16,
              gap: 12,
              boxSizing: "border-box",
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${C.border}`,
                paddingBottom: 14,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  color: C.text,
                  fontWeight: 700,
                  fontSize: 14,
                  position: "relative",
                  display: "inline-block",
                  paddingBottom: 4,
                }}
              >
                Image Generation
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: -15,
                    width: "100%",
                    height: 2,
                    borderRadius: radius.full,
                    background: `linear-gradient(90deg,${C.indigo},${C.accent})`,
                  }}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ borderColor: C.accentBorder }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: radius.md,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.16s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: "linear-gradient(135deg,#6D5CFF,#9d4edd)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  color: "#fff",
                }}
              >
                V1
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Kylor V1</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Consistency · free multi-reference generation
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "rgba(124,58,237,0.2)",
                    border: `1px solid ${C.accentBorder}`,
                    color: "#c4b5fd",
                  }}
                >
                  FREE
                </div>
                <ChevronDown size={14} color={C.textMuted} />
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                setShowCharacterModal(true);
                await loadSavedCharacters();
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: radius.md,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.16s ease",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <UserCircle2 size={15} />
              </div>

              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Use Character</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Select a saved character from Consistency
                </div>
              </div>

              <ChevronRight size={14} color={C.textMuted} />
            </motion.button>

            {selectedCharacter && (
              <div
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: radius.md,
                  border: `1px solid ${C.accentBorder}`,
                  background: C.accentSoft,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    flexShrink: 0,
                  }}
                >
                  {selectedCharacter.coverImage ? (
                    <img
                      src={selectedCharacter.coverImage}
                      alt={selectedCharacter.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                      <UserCircle2 size={16} color={C.textDim} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {selectedCharacter.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "rgba(255,255,255,0.72)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Character applied
                  </div>
                </div>

                <button
                  onClick={clearSelectedCharacter}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: C.textMuted,
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontFamily: "inherit",
                  }}
                >
                  Remove
                </button>
              </div>
            )}

            <div style={{ flexShrink: 0 }}>
              <DropZone files={refImages} onFiles={setRefImages} />
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                borderRadius: radius.md,
                border: `1px solid ${C.border}`,
                background: C.surface,
                padding: 12,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }}>
                {selectedCharacter && (
                  <div
                    style={{
                      border: `1px solid ${C.accentBorder}`,
                      background: "rgba(124,58,237,0.08)",
                      borderRadius: radius.md,
                      padding: 10,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#c4b5fd",
                        marginBottom: 6,
                      }}
                    >
                      Defined Character Prompt
                    </div>

                    <div
                      style={{
                        width: "100%",
                        maxHeight: 150,
                        overflowY: "auto",
                        paddingRight: 4,
                        background: "transparent",
                        color: "rgba(255,255,255,0.88)",
                        fontFamily: "inherit",
                        fontSize: 13,
                        lineHeight: 1.65,
                        boxSizing: "border-box",
                        scrollbarWidth: "thin",
                        scrollbarColor: "dark grey",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {prompt}
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                      marginBottom: 6,
                      flexShrink: 0,
                    }}
                  >
                    Scene Prompt
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={scenePrompt}
                    onChange={(e) => setScenePrompt(e.target.value.slice(0, charLimit))}
                    placeholder={
                      selectedCharacter
                        ? "Describe the scene, action, camera angle, environment, outfit, lighting..."
                        : "Describe the image you want to create..."
                    }
                    style={{
                      flex: 1,
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: C.text,
                      resize: "none",
                      fontFamily: "inherit",
                      fontSize: 13.5,
                      lineHeight: 1.7,
                      outline: "none",
                      minHeight: 0,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <AnimatePresence>
                {negativeOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      style={{
                        borderTop: `1px solid ${C.border}`,
                        marginTop: 8,
                        paddingTop: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#f87171",
                          marginBottom: 6,
                        }}
                      >
                        Negative Prompt
                      </div>
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="What to avoid: blurry, distorted, watermark..."
                        rows={3}
                        style={{
                          width: "100%",
                          border: "1px solid rgba(248,113,113,0.25)",
                          background: "rgba(248,113,113,0.04)",
                          color: C.text,
                          borderRadius: radius.sm,
                          padding: "8px 10px",
                          resize: "none",
                          fontFamily: "inherit",
                          fontSize: 12.5,
                          lineHeight: 1.6,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

<div
  style={{
    display: "flex",
    alignItems: isMobile ? "stretch" : "center",
    justifyContent: "space-between",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 10 : 0,
    marginTop: 10,
    paddingTop: 10,
    borderTop: `1px solid ${C.border}`,
    flexShrink: 0,
  }}
>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStylesOpen((p) => !p)}
                    style={{
                      height: 30,
                      padding: "0 12px",
                      borderRadius: 9,
                      border: `1px solid ${
                        activeStyle ? activeStyle.color + "55" : C.accentBorder
                      }`,
                      background: activeStyle ? activeStyle.color + "18" : C.accentSoft,
                      color: activeStyle ? C.text : "#a78bfa",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {activeStyle ? (
                      <>
                        <Check size={10} />
                        {activeStyle.label}
                      </>
                    ) : (
                      "Styles"
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNegativeOpen((p) => !p)}
                    style={{
                      height: 30,
                      padding: "0 12px",
                      borderRadius: 9,
                      border: `1px solid ${
                        negativeOpen || negativePrompt
                          ? "rgba(248,113,113,0.3)"
                          : C.border
                      }`,
                      background:
                        negativeOpen || negativePrompt
                          ? "rgba(248,113,113,0.08)"
                          : C.surface,
                      color: negativeOpen || negativePrompt ? "#fca5a5" : C.textMuted,
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Negative{negativePrompt ? " ✓" : ""}
                  </motion.button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between", width: isMobile ? "100%" : "auto" }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: scenePrompt.length > charLimit * 0.9 ? "#f87171" : C.textDim,
                    }}
                  >
                    {scenePrompt.length}/{charLimit}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    title="Enhance prompt"
                    onClick={() => {
                      if (scenePrompt.trim()) {
                        setScenePrompt((p) => p.trim() + ", ultra detailed, cinematic lighting, 8K");
                      }
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: `1px solid ${C.accentBorder}`,
                      background: C.accentSoft,
                      color: "#a78bfa",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Sparkles size={14} />
                  </motion.button>
                </div>
              </div>
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <div ref={stylesRef}>
                <AnimatePresence>
                  {stylesOpen && (
                    <StylesPicker
                      value={selectedStyle}
                      onChange={setSelectedStyle}
                      onClose={() => setStylesOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div ref={panelRef}>
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 16, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.97 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: "calc(100% + 8px)",
                        zIndex: 10,
                        borderRadius: 18,
                        border: `1px solid ${C.border}`,
                        background: "rgba(14,16,26,0.99)",
                        backdropFilter: "blur(16px)",
                        boxShadow: "0 28px 80px rgba(0,0,0,0.5)",
                        padding: 16,
                        display: "grid",
                        gap: 16,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textMuted,
                            marginBottom: 8,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Mode
                        </div>
                        <SegmentControl options={MODES} value={mode} onChange={setMode} />
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textMuted,
                            marginBottom: 8,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Aspect Ratio
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(5,1fr)",
                            gap: 6,
                          }}
                        >
                          {RATIOS.map((r) => (
                            <motion.button
                              key={r}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setRatio(r)}
                              style={{
                                height: 34,
                                borderRadius: radius.sm,
                                border:
                                  ratio === r
                                    ? `1px solid ${C.accentBorder}`
                                    : `1px solid ${C.border}`,
                                background:
                                  ratio === r
                                    ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))"
                                    : C.surface,
                                color: ratio === r ? "white" : C.textMuted,
                                fontSize: 12,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {r}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: C.textMuted,
                            marginBottom: 8,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Output Count
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4,1fr)",
                            gap: 6,
                          }}
                        >
                          {OUTPUTS.map((n) => (
                            <motion.button
                              key={n}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setOutputCount(n)}
                              style={{
                                height: 34,
                                borderRadius: radius.sm,
                                border:
                                  outputCount === n
                                    ? `1px solid ${C.accentBorder}`
                                    : `1px solid ${C.border}`,
                                background:
                                  outputCount === n
                                    ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))"
                                    : C.surface,
                                color: outputCount === n ? "white" : C.textMuted,
                                fontSize: 13,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {n}
                            </motion.button>
                          ))}
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: 11, color: C.textMuted }}>
                          Max 4 per generation
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "auto 1fr",
                    gap: 10,
                  }}
                >
                  <motion.button
                    whileHover={{ borderColor: C.borderHover }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSettingsOpen((p) => !p)}
                    style={{
                      height: 46,
                      padding: "0 14px",
                      borderRadius: radius.md,
                      border: `1px solid ${settingsOpen ? C.accentBorder : C.border}`,
                      background: settingsOpen ? C.accentSoft : "#0d0f18",
                      color: "rgba(255,255,255,0.85)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "inherit",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Settings size={14} />
                    <span>
                      {mode} · {ratio} · ×{outputCount}
                    </span>
                    <motion.div
                      animate={{ rotate: settingsOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </motion.button>

                  <motion.button
                    whileHover={
                      scenePrompt.trim() && !generating
                        ? { boxShadow: "0 18px 40px rgba(124,58,237,0.42)" }
                        : {}
                    }
                    whileTap={
                      scenePrompt.trim() && !generating
                        ? { scale: 0.98 }
                        : {}
                    }
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      height: 46,
                      width: "100%",
                      borderRadius: radius.md,
                      border: "none",
                      background:
  scenePrompt.trim() && !generating && authReady
    ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
    : "rgba(255,255,255,0.06)",
color:
  scenePrompt.trim() && !generating && authReady
    ? "white"
    : C.textMuted,
cursor:
  scenePrompt.trim() && !generating && authReady
    ? "pointer"
    : "default",
boxShadow:
  scenePrompt.trim() && !generating && authReady
    ? "0 10px 28px rgba(124,58,237,0.28)"
    : "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {generating ? (
                        <motion.span
                          key="gen"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              ease: "linear",
                            }}
                          >
                            <Zap size={15} />
                          </motion.div>
                          Generating…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: 8 }}
                        >
                          <Wand2 size={15} /> Generate <ChevronRight size={15} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(4,5,12,0.95)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <AnimatePresence>
              {notifState === "idle" && (
                <motion.div
                  key="notif-idle"
                  initial={{ height: 44 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
  borderBottom: `1px solid ${C.border}`,
  background: "#12141e",
  padding: isMobile ? "10px 12px" : "0 16px",
  display: "flex",
  alignItems: isMobile ? "flex-start" : "center",
  justifyContent: "space-between",
  gap: 10,
  overflow: "hidden",
  flexShrink: 0,
  minHeight: isMobile ? "auto" : 44,
  flexWrap: isMobile ? "wrap" : "nowrap",
}}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "rgba(255,255,255,0.75)",
                      fontSize: 13,
                    }}
                  >
                    <Bell size={13} color={C.textMuted} />
                    <span>Turn on notifications for generation updates.</span>
                    <button
                      onClick={handleAllowNotifications}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a78bfa",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      Allow
                    </button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNotifState("dismissed")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: C.textMuted,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <X size={14} />
                  </motion.button>
                </motion.div>
              )}

              {notifState === "granted" && (
                <motion.div
                  key="notif-ok"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 44, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: "rgba(34,197,94,0.07)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#86efac", fontSize: 13 }}>
                    <Check size={13} /> Notifications enabled — you'll be notified when generation completes.
                  </div>
                  <button
                    onClick={() => setNotifState("dismissed")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: C.textMuted,
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}

              {notifState === "denied" && (
                <motion.div
                  key="notif-denied"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 44, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: "rgba(239,68,68,0.07)",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fca5a5", fontSize: 13 }}>
                    <BellOff size={13} /> Notifications blocked — enable them in your browser settings.
                  </div>
                  <button
                    onClick={() => setNotifState("dismissed")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: C.textMuted,
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                padding: isMobile ? "10px 12px" : "0 16px",
                borderBottom: `1px solid ${C.border}`,
                minHeight: isMobile ? "auto" : 48,
                flexShrink: 0,
                flexWrap: isMobile ? "wrap" : "nowrap",
                gap: isMobile ? 10 : 0,
              }}
            >
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                {CONTENT_TABS.map((tab) => (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setContentFilter(tab)}
                    style={{
                      height: 28,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: `1px solid ${
                        contentFilter === tab ? C.border : "transparent"
                      }`,
                      background:
                        contentFilter === tab ? "rgba(255,255,255,0.09)" : "transparent",
                      color: contentFilter === tab ? C.text : C.textMuted,
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontFamily: "inherit",
                      transition: "all 0.14s ease",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {tab === "Videos" && <Video size={11} />}
                    {tab === "Audio" && <Music size={11} />}
                    {tab === "Images" && <ImageIcon size={11} />}
                    {tab}
                  </motion.button>
                ))}

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginLeft: 6,
                    fontSize: 12.5,
                    color: favoritesOnly ? "#a78bfa" : C.textMuted,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    style={{ accentColor: C.accent }}
                  />
                  Favorites
                </label>
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {groups.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAll}
                    style={{
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(248,113,113,0.25)",
                      background: "rgba(248,113,113,0.07)",
                      color: "#fca5a5",
                      fontSize: 11.5,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Trash2 size={11} /> Clear all
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ borderColor: C.borderHover }}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: "rgba(255,255,255,0.8)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "inherit",
                  }}
                >
                  <Folder size={12} /> Assets
                </motion.button>
              </div>
            </div>

            <div ref={canvasRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {topTab === "Projects" ? (
                <div style={{ padding: "16px 16px 64px" }}>
                  {groups.length === 0 ? (
                    <div style={{ height: "80vh", display: "grid", placeItems: "center" }}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: "center", maxWidth: 320 }}
                      >
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: 999,
                            margin: "0 auto 18px",
                            display: "grid",
                            placeItems: "center",
                            border: `1px solid ${C.border}`,
                            background: C.surface,
                          }}
                        >
                          <FolderKanban size={30} color={C.textDim} />
                        </div>

                        <p style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                          No projects yet
                        </p>

                        <p style={{ margin: 0, color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                          Generate some images first. They will appear here as your saved image projects.
                        </p>
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {groups.map((group, idx) => (
<GenerationCard
  key={group.id}
  group={group}
  isLatest={idx === 0 && !generating}
  generating={generating}
  onDelete={deleteGroup}
  onToggleFavorite={toggleFavorite}
  onDownload={handleDownload}
  onShare={handleShare}
  onVariation={handleVariation}
  onOpenLightbox={(img, promptText) =>
    setLightboxItem({ ...img, promptText })
  }
  isMobile={isMobile}
  isTablet={isTablet}
/>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {generating && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            margin: "16px 16px 0",
                            borderRadius: 16,
                            border: `1px solid ${C.accentBorder}`,
                            background: "rgba(124,58,237,0.06)",
                            padding: "18px 20px",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: 999,
                                border: `2px solid ${C.accent}`,
                                borderTopColor: "transparent",
                              }}
                            />
                            <motion.div
                              animate={{ rotate: -360 }}
                              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                              style={{
                                position: "absolute",
                                inset: 6,
                                borderRadius: 999,
                                border: `1.5px solid ${C.accentBorder}`,
                                borderBottomColor: "transparent",
                              }}
                            />
                            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                              <Sparkles size={14} color="#a78bfa" />
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                              Generating your image…
                            </div>
                            <div style={{ fontSize: 12, color: C.textMuted }}>
                              {mode} · {ratio}
                              {activeStyle ? ` · ${activeStyle.label}` : ""} · {outputCount} output
                              {outputCount > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!generating && contentFilter === "Videos" && (
                    <div style={{ height: "80vh", display: "grid", placeItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 999,
                            margin: "0 auto 14px",
                            display: "grid",
                            placeItems: "center",
                            border: `1px solid ${C.border}`,
                            background: C.surface,
                          }}
                        >
                          <Video size={26} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 4px", color: C.text, fontSize: 15, fontWeight: 600 }}>
                          Video Generation
                        </p>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>Coming soon.</p>
                      </div>
                    </div>
                  )}

                  {!generating && contentFilter === "Audio" && (
                    <div style={{ height: "80vh", display: "grid", placeItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 999,
                            margin: "0 auto 14px",
                            display: "grid",
                            placeItems: "center",
                            border: `1px solid ${C.border}`,
                            background: C.surface,
                          }}
                        >
                          <Music size={26} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 4px", color: C.text, fontSize: 15, fontWeight: 600 }}>
                          Audio Generation
                        </p>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>Coming soon.</p>
                      </div>
                    </div>
                  )}

                  {!generating &&
                    (contentFilter === "All" || contentFilter === "Images") &&
                    filteredGroups.length === 0 && (
                      <div style={{ height: "80vh", display: "grid", placeItems: "center" }}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ textAlign: "center", maxWidth: 300 }}
                        >
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 999,
                              margin: "0 auto 18px",
                              display: "grid",
                              placeItems: "center",
                              border: `1px solid ${C.border}`,
                              background: C.surface,
                            }}
                          >
                            <ImageIcon size={30} color={C.textDim} />
                          </div>
                          <p style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                            Your canvas is empty
                          </p>
                          <p
                            style={{
                              margin: "0 0 20px",
                              color: C.textMuted,
                              fontSize: 13,
                              lineHeight: 1.7,
                            }}
                          >
                            Describe what you want to create and hit Generate — your images will be auto-saved and reappear after refresh.
                          </p>
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => textareaRef.current?.focus()}
                            style={{
                              height: 36,
                              padding: "0 18px",
                              borderRadius: radius.md,
                              border: `1px solid ${C.accentBorder}`,
                              background: C.accentSoft,
                              color: "#c4b5fd",
                              fontSize: 13,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 7,
                            }}
                          >
                            <Plus size={13} /> Start with a prompt
                          </motion.button>
                        </motion.div>
                      </div>
                    )}

                  {(contentFilter === "All" || contentFilter === "Images") &&
                    filteredGroups.length > 0 && (
                      <div
                        style={{
                          padding: "16px 16px 64px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                        }}
                      >
                        {filteredGroups.map((group, idx) => (
  <GenerationCard
  key={group.id}
  group={group}
  isLatest={idx === 0}
  generating={false}
  onDelete={deleteGroup}
  onToggleFavorite={toggleFavorite}
  onDownload={handleDownload}
  onShare={handleShare}
  onVariation={handleVariation}
  onOpenLightbox={(img, promptText) =>
    setLightboxItem({ ...img, promptText })
  }
  isMobile={isMobile}
  isTablet={isTablet}
/>
                        ))}
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCharacterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCharacterModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? 12 : 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : 680,
                borderRadius: 22,
                border: `1px solid ${C.border}`,
                background: "linear-gradient(180deg, rgba(10,12,20,0.98), rgba(8,10,18,0.98))",
                boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    Use Character
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    Select a saved character from Consistency
                  </div>
                </div>

                <button
                  onClick={() => setShowCharacterModal(false)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.textMuted,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: 14 }}>
                {loadingCharacters ? (
                  <div
                    style={{
                      minHeight: 180,
                      borderRadius: 18,
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    <div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{
                          width: 34,
                          height: 34,
                          margin: "0 auto 12px",
                          borderRadius: 999,
                          border: `2px solid ${C.accent}`,
                          borderTopColor: "transparent",
                        }}
                      />
                      <div style={{ fontSize: 13, color: C.textMuted }}>Loading saved characters…</div>
                    </div>
                  </div>
                ) : savedCharacters.length === 0 ? (
                  <div
                    style={{
                      minHeight: 180,
                      borderRadius: 18,
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 999,
                          margin: "0 auto 12px",
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <UserCircle2 size={22} color={C.textDim} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                        No saved characters yet
                      </div>
                      <div style={{ fontSize: 12.5, color: C.textMuted }}>
                        Create and save a character in the Consistency section first.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
                      gap: 12,
                      maxHeight: 420,
                      overflowY: "auto",
                    }}
                  >
                    {savedCharacters.map((character) => {
                      const active = String(selectedCharacter?.id) === String(character.id);

                      return (
                        <button
                          key={character.id}
                          onClick={() => handleSelectCharacter(character)}
                          style={{
                            border: `1px solid ${active ? C.accentBorder : C.border}`,
                            background: active ? "rgba(124,58,237,0.08)" : C.surface,
                            borderRadius: 16,
                            padding: 10,
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "inherit",
                            transition: "all 0.16s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "16/10",
                              borderRadius: 12,
                              overflow: "hidden",
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid ${C.border}`,
                              marginBottom: 10,
                            }}
                          >
                            {character.coverImage ? (
                              <img
                                src={character.coverImage}
                                alt={character.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
                                <UserCircle2 size={22} color={C.textDim} />
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.text,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {character.name}
                            </div>

                            {active && <Check size={13} color="#a78bfa" />}
                          </div>

                          <div
                            style={{
                              fontSize: 11.5,
                              color: C.textMuted,
                              lineHeight: 1.5,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {character.charDesc || "Saved character from Consistency"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}