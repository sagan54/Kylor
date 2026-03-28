"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Compass, Clapperboard, Image as ImageIcon, Video, UserCircle2,
  Orbit, FolderKanban, Settings, Wand2, ChevronRight, X, ChevronDown,
  Upload, Zap, Star, Download, Share2, Trash2, Plus, Check, Copy,
  User, Users, Layers, RefreshCw, Eye, Lock, Unlock, Grid3X3,
  List, Folder, Bell, BellOff, ChevronLeft, MoreHorizontal,
  Shuffle, BookOpen, Camera, Sliders, ArrowRight, ExternalLink,
} from "lucide-react";
import { IMAGE_TYPES, IMAGE_ORDER, PACK_VIEWS } from "../../lib/character-constants";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";

const CHAR_BUCKET = "characters";
const SESSION_KEY = "kylor_chars_cache_v2";

const C = {
  accent: "#7c3aed", accentSoft: "rgba(124,58,237,0.15)",
  accentBorder: "rgba(124,58,237,0.35)", accentGlow: "rgba(124,58,237,0.25)",
  indigo: "#4f46e5", border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.13)", surface: "rgba(255,255,255,0.03)",
  surfaceHover: "rgba(255,255,255,0.055)", text: "white",
  textMuted: "rgba(255,255,255,0.52)", textDim: "rgba(255,255,255,0.32)",
  bg: "#05070c", sidebar: "#080a10",
};
const radius = { sm: "10px", md: "14px", lg: "18px", xl: "22px", full: "999px" };

const SIDEBAR_ITEMS = [
  { label: "Home",        icon: Compass,      href: "/" },
  { label: "Explore",     icon: Compass,      href: "/explore" },
  { label: "Story",       icon: Clapperboard, href: "/story" },
  { label: "Image",       icon: ImageIcon,    href: "/image" },
  { label: "Video",       icon: Video,        href: "/video" },
  { label: "Consistency", icon: UserCircle2,  href: "/consistency", active: true },
  { label: "Motion",      icon: Orbit,        href: "#" },
  { label: "Projects",    icon: FolderKanban, href: "/story" },
  { label: "Settings",    icon: Settings,     href: "#" },
];

const GENDERS     = ["Female", "Male", "Non-binary", "Unspecified"];
const AGE_RANGE   = ["Teen (13–17)", "Young Adult (18–30)", "Adult (30–50)", "Senior (50+)", "Unspecified"];
const ETHNICITIES = ["Unspecified", "East Asian", "South Asian", "Black / African", "Latino / Hispanic", "Middle Eastern", "White / European", "Mixed"];
const HAIR_STYLES = ["Short", "Medium", "Long", "Curly", "Wavy", "Braided", "Bald", "Ponytail"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "White", "Silver", "Blue", "Pink", "Green"];
const EYE_COLORS  = ["Brown", "Blue", "Green", "Hazel", "Grey", "Amber"];
const BUILD_TYPES = ["Slim", "Athletic", "Average", "Muscular", "Stocky", "Curvy"];
const CHARACTER_PACK_VIEWS = [
  { key: "front",   label: "Front Full-Body",         shot: "single person, front-facing, full-body, standing straight, arms relaxed, centered composition",                                                    size: "1024x1536" },
  { key: "left",    label: "Left Profile Full-Body",  shot: "single person, strict left side profile, facing the left edge of the frame, full-body, standing straight, arms relaxed, centered composition",   size: "1024x1536" },
  { key: "right",   label: "Right Profile Full-Body", shot: "single person, strict right side profile, facing the right edge of the frame, full-body, standing straight, arms relaxed, centered composition", size: "1024x1536" },
  { key: "back",    label: "Back Full-Body",          shot: "single person, full-body back view, facing away from camera, standing straight, arms relaxed, centered composition",                             size: "1024x1536" },
  { key: "closeup", label: "Upper-Body Close-Up",     shot: "single person, upper-body close-up portrait, facing camera, centered composition",                                                               size: "1024x1024" },
];
const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(124,58,237,0.3))",
  "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(17,17,34,0.85))",
  "linear-gradient(135deg, rgba(49,46,129,0.65), rgba(79,70,229,0.35))",
  "linear-gradient(135deg, rgba(91,33,182,0.55), rgba(55,48,163,0.4))",
  "linear-gradient(135deg, rgba(67,56,202,0.6), rgba(124,58,237,0.3))",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function entriesToReferenceImages(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const refs = await Promise.all(
    entries.map(async (entry) => {
      if (entry?.file) return await fileToBase64(entry.file);

      // only allow permanent urls here, never dead blob urls
      if (entry?.previewUrl && !entry.previewUrl.startsWith("blob:")) {
        return entry.previewUrl;
      }

      return null;
    })
  );

  return refs.filter(Boolean);
}

function getIdNumber(id) {
  const s = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) { hash = (hash << 5) - hash + s.charCodeAt(i); hash |= 0; }
  return Math.abs(hash);
}

function makeTriggerToken(name) {
  const cleaned = (name || "character")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `kylorchar_${cleaned || "character"}_${suffix}`;
}

function buildTraitsPayload({ charDesc, gender, ageRange, ethnicity, hairStyle, hairColor, eyeColor, build, charLocked, extraPrompt }) {
  return JSON.stringify({
    charDesc: charDesc || "",
    gender: gender || "",
    ageRange: ageRange || "",
    ethnicity: ethnicity || "",
    hairStyle: hairStyle || "",
    hairColor: hairColor || "",
    eyeColor: eyeColor || "",
    build: build || "",
    charLocked: !!charLocked,
    extraPrompt: extraPrompt || "",
  });
}

function parseTraitsPayload(value) {
  try {
    const p = JSON.parse(value || "{}");
    return {
      charDesc: p.charDesc || "",
      gender: p.gender || "",
      ageRange: p.ageRange || "",
      ethnicity: p.ethnicity || "",
      hairStyle: p.hairStyle || "",
      hairColor: p.hairColor || "",
      eyeColor: p.eyeColor || "",
      build: p.build || "",
      charLocked: !!p.charLocked,
      extraPrompt: p.extraPrompt || "",
    };
  } catch {
    return {
      charDesc: "",
      gender: "",
      ageRange: "",
      ethnicity: "",
      hairStyle: "",
      hairColor: "",
      eyeColor: "",
      build: "",
      charLocked: false,
      extraPrompt: "",
    };
  }
}

function normalizeLockedTraits(row) {
  const promptTraits = parseTraitsPayload(row.prompt);
  const locked = row.locked_traits && typeof row.locked_traits === "object" ? row.locked_traits : {};
  return {
    charDesc: promptTraits.charDesc || row.description || "",
    gender: locked.gender || promptTraits.gender || "",
    ageRange: locked.age || locked.ageRange || promptTraits.ageRange || "",
    ethnicity: locked.ethnicity || promptTraits.ethnicity || "",
    hairStyle: locked.hair_style || locked.hairStyle || promptTraits.hairStyle || "",
    hairColor: locked.hair_color || locked.hairColor || promptTraits.hairColor || "",
    eyeColor: locked.eye_color || locked.eyeColor || promptTraits.eyeColor || "",
    build: locked.build || promptTraits.build || "",
    charLocked: typeof locked.charLocked === "boolean" ? locked.charLocked : promptTraits.charLocked || false,
    extraPrompt: promptTraits.extraPrompt || "",
  };
}

function rowToCharacter(row, imageRows = []) {
  
  const traits = normalizeLockedTraits(row);

  const uploadImages = imageRows
  
    .filter(img => img.source_type === "upload" || img.source_type === "master_identity")
    .sort((a, b) => {
      const aCanon = a.is_canon ? 1 : 0;
      const bCanon = b.is_canon ? 1 : 0;
      if (aCanon !== bCanon) return bCanon - aCanon;

      const aSort = a.sort_order ?? 0;
      const bSort = b.sort_order ?? 0;
      if (aSort !== bSort) return aSort - bSort;
      

      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

  const generatedRows = imageRows
  .filter(
    (img) =>
      img.source_type === "generated" ||
      [
        IMAGE_TYPES.FRONT,
        IMAGE_TYPES.LEFT,
        IMAGE_TYPES.RIGHT,
        IMAGE_TYPES.BACK,
        IMAGE_TYPES.CLOSEUP,
      ].includes(img.image_type)
  )
  .sort((a, b) => {
    const aSort = a.sort_order ?? 0;
    const bSort = b.sort_order ?? 0;
    if (aSort !== bSort) return aSort - bSort;
    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
  });

  const fallbackGeneratedImages = Array.isArray(row.generated_images) ? row.generated_images : [];
  const generatedImages =
    generatedRows.length > 0
      ? generatedRows.map(img => img.image_url).filter(Boolean)
      : fallbackGeneratedImages;

  const refEntries = uploadImages.length > 0
    ? uploadImages.map(img => ({
        id: img.id,
        file: null,
        previewUrl: img.image_url,
        storagePath: img.storage_path || null,
        sourceType: img.source_type || "upload",
        isCanon: !!img.is_canon,
        isCover: !!img.is_cover,
        packView: img.pack_view || null,
        metadata: img.metadata || {},
      }))
    : (row.reference_image ? [{
        id: null,
        file: null,
        previewUrl: row.reference_image,
        storagePath: null,
        sourceType: "upload",
        isCanon: false,
        isCover: true,
        packView: null,
        metadata: {},
      }] : []);

  const canonRef = refEntries.find(entry => entry.isCanon && entry.previewUrl);
  const coverRef = refEntries.find(entry => entry.isCover && entry.previewUrl);

  return {
    id: row.id,
    name: row.name,
    desc: traits.charDesc || row.description || "",
    gender: traits.gender || "",
    ageRange: traits.ageRange || "",
    ethnicity: traits.ethnicity || "",
    hairStyle: traits.hairStyle || "",
    hairColor: traits.hairColor || "",
    eyeColor: traits.eyeColor || "",
    build: traits.build || "",
    locked: traits.charLocked || false,
    generations: generatedImages.length,
    generatedImages,
    style: row.style || null,
    extraPrompt: traits.extraPrompt || "",
    createdAt: row.created_at,
    refEntries,
    triggerToken: row.trigger_token || "",
status: row.status || "draft",
loraPath: row.lora_path || null,
masterImage: row.master_image || canonRef?.previewUrl || null,
coverImage: canonRef?.previewUrl || row.cover_image || coverRef?.previewUrl || refEntries[0]?.previewUrl || null,
  };
}

function outputsFromCharacter(char) {
  if (!char) return [];

  return (char.generatedImages || []).map((url, i) => ({
    id: `${char.id}-${PACK_VIEWS[i]?.key || i}`,
    charId: char.id,
    prompt: "",
    scene: PACK_VIEWS[i]?.label || `View ${i + 1}`,
    url,
    createdAt: char.createdAt || new Date().toISOString(),
  }));
}

function extractGeneratedUrl(data) {
  if (!data) return null;

  if (typeof data.image === "string" && data.image) return data.image;

  if (Array.isArray(data.images) && data.images.length > 0) {
    const first = data.images[0];
    if (typeof first === "string") return first;
    if (first && typeof first.url === "string") return first.url;
  }

  return null;
}

function buildActiveCharacterTraitDesc(char) {
  return [
    char.gender,
    char.ageRange,
    char.ethnicity,
    char.hairColor && char.hairStyle ? `${char.hairColor} ${char.hairStyle} hair` : null,
    char.eyeColor ? `${char.eyeColor} eyes` : null,
    char.build ? `${char.build} build` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function buildLockedCharacterPrompt({
  char,
  shot,
  extraPrompt = "",
  hasRefs = false,
  mode = "front",
}) {
  const traitDesc = buildActiveCharacterTraitDesc(char);

  const identityBlock = hasRefs
    ? [
        `Generate the EXACT SAME real person as the provided reference image(s).`,
        `This is a specific human identity, not a similar-looking character.`,
        `Preserve exact face shape, cheek structure, jawline, chin, forehead, hairline, eyebrows, eyes, eyelids, nose, lips, ears, skin tone, hairstyle, hair texture, hair volume, neck, shoulders, body proportions, and overall build.`,
        `If facial hair exists in the reference, preserve the exact moustache, beard, stubble pattern, density, and placement.`,
        `Do not beautify, idealize, glamorize, age-shift, gender-shift, ethnicity-shift, or redesign the person.`,
        `Do not generate a different person.`,
      ].join(" ")
    : [
        `Generate one stable realistic human identity.`,
        `Keep the exact same identity consistently across outputs.`,
        `Do not redesign the face between generations.`,
      ].join(" ");

  const realismBlock = [
    `Photorealistic human image.`,
    `Natural skin texture, realistic pores, real facial detail, realistic hair strands.`,
    `No waxy skin, no plastic skin, no CGI look, no 3D render look, no beauty-filtered face.`,
  ].join(" ");

  const sceneBlock =
    mode === "front"
      ? [
          `Plain light studio background.`,
          `Neutral reference-photo style.`,
          `Same outfit unless explicitly changed.`,
        ].join(" ")
      : [
          `Keep the same person identity while changing only the angle / framing requested.`,
          `Keep the same outfit, same background family, same neutral lighting unless explicitly changed.`,
        ].join(" ");

  const avoidBlock = [
    `Avoid: different person, generic face, identity drift, altered face shape, altered nose, altered eyes, altered lips, altered jawline, changed hairstyle, changed hairline, changed skin tone, duplicate person, multiple people, split screen, collage, character sheet, contact sheet, text, watermark.`,
  ].join(" ");

  return [
    identityBlock,
    char.triggerToken ? `Character token: ${char.triggerToken}.` : null,
    traitDesc ? `Locked physical traits: ${traitDesc}.` : null,
    char.desc ? `Locked character details: ${char.desc}.` : null,
    extraPrompt?.trim() ? `Locked reference notes: ${extraPrompt.trim()}.` : null,
    `Shot request: ${shot}.`,
    sceneBlock,
    realismBlock,
    avoidBlock,
  ]
    .filter(Boolean)
    .join(" ");
}

function extractGeneratedUrls(data) {
  if (!data) return [];

  if (Array.isArray(data.images)) {
    return data.images
      .map((item, i) => {
        if (typeof item === "string") {
          return {
            id: `img-${i}`,
            url: item,
            attempt: i + 1,
          };
        }

        if (item && typeof item.url === "string") {
          return {
            id: item.id || `img-${i}`,
            url: item.url,
            attempt: item.attempt || i + 1,
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof data.image === "string" && data.image) {
    return [{ id: "img-0", url: data.image, attempt: 1 }];
  }

  return [];
}

function getMasterImageForCharacter(char) {
  if (!char) return null;

  if (char.masterImage) return char.masterImage;

  const canonRef = (char.refEntries || []).find((entry) => entry?.isCanon && entry?.previewUrl);
  if (canonRef?.previewUrl) return canonRef.previewUrl;

  const coverRef = (char.refEntries || []).find((entry) => entry?.isCover && entry?.previewUrl);
  if (coverRef?.previewUrl) return coverRef.previewUrl;

  return char.coverImage || null;
}

function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{ display: "grid", justifyItems: "center", gap: "6px", padding: "10px 6px", borderRadius: radius.lg,
        background: item.active ? "linear-gradient(160deg,rgba(79,70,229,0.22),rgba(124,58,237,0.14))" : "transparent",
        border: `1px solid ${item.active ? C.border : "transparent"}`,
        color: item.active ? C.text : C.textMuted, cursor: "pointer", transition: "all 0.18s ease" }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center",
        background: item.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)" }}>
        <Icon size={17} />
      </div>
      <span style={{ fontSize: "10.5px", textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
    </motion.div>
  );
  return item.href === "#" ? <div>{inner}</div> : <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
}

function Select({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function out(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ width: "100%", height: 36, padding: "0 12px", borderRadius: radius.sm,
          border: `1px solid ${open ? C.accentBorder : C.border}`, background: open ? C.accentSoft : C.surface,
          color: value ? C.text : C.textMuted, display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", transition: "all 0.15s ease" }}>
        <span>{value || label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}><ChevronDown size={13} color={C.textMuted} /></motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.16, ease: [0.22,1,0.36,1] }}
            style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
              borderRadius: radius.md, border: `1px solid ${C.border}`, background: "rgba(12,14,22,0.99)",
              backdropFilter: "blur(14px)", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            {options.map((opt, i) => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{ width: "100%", padding: "9px 12px", background: value === opt ? "rgba(124,58,237,0.15)" : "transparent",
                  color: value === opt ? "#c4b5fd" : C.textMuted, border: "none",
                  borderBottom: i !== options.length - 1 ? `1px solid ${C.border}` : "none",
                  textAlign: "left", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.12s ease" }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}>
                {opt}
                {value === opt && <Check size={11} color="#a78bfa" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RefUpload({ entries, onEntries, label, hint, max = 5 }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const valid = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;

    onEntries(prev => {
      const slots = max - prev.length;
      if (slots <= 0) return prev;
      return [...prev, ...valid.slice(0, slots).map(file => ({
        id: null,
        file,
        previewUrl: URL.createObjectURL(file),
        storagePath: null,
        sourceType: "upload",
        isCanon: false,
        isCover: false,
        packView: null,
      }))];
    });
  }

  function removeEntry(i) {
    onEntries(prev => {
      const entry = prev[i];
      if (entry?.file && entry?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((_, j) => j !== i);
    });
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDrag(false);
    addFiles(e.dataTransfer.files);
  }, [onEntries, max]);

  const onInputChange = useCallback(e => {
    const c = Array.from(e.target.files || []);
    e.target.value = "";
    if (c.length) addFiles(c);
  }, [onEntries, max]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <motion.div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={onDrop} onClick={() => inputRef.current?.click()}
        animate={{ borderColor: drag ? C.accent : "rgba(255,255,255,0.09)", background: drag ? C.accentSoft : C.surface }}
        style={{ borderRadius: radius.md, border: "1.5px dashed rgba(255,255,255,0.09)", padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
<input
  id="character-ref-upload"
  name="characterRefUpload"
  ref={inputRef}
  type="file"
  accept="image/*"
  multiple
  style={{ display: "none" }}
  onChange={onInputChange}
/>
        <div style={{ width: 36, height: 36, borderRadius: radius.sm, flexShrink: 0, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center" }}><Camera size={14} color="#a78bfa" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{hint}</div>
        </div>
        <div style={{ fontSize: 11.5, color: entries.length > 0 ? "#a78bfa" : C.textDim, fontWeight: 600 }}>{entries.length}/{max}</div>
      </motion.div>
      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {entries.map((entry, i) => (
            <motion.div key={`${entry.previewUrl}-${i}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{ position: "relative", width: 52, height: 52, borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.accentBorder}`, flexShrink: 0 }}>
              <img src={entry.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button onClick={e => { e.stopPropagation(); removeEntry(i); }}
                style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 999, background: "rgba(0,0,0,0.8)", border: "none", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <X size={9} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterCard({ char, isActive, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div whileHover={{ y: -2 }} onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)} onClick={onClick}
      style={{ borderRadius: radius.lg, border: `1px solid ${isActive ? C.accentBorder : hovered ? C.borderHover : C.border}`,
        background: isActive ? "rgba(124,58,237,0.06)" : C.surface, cursor: "pointer", overflow: "hidden", transition: "all 0.18s ease",
        boxShadow: isActive ? `0 0 0 1px rgba(124,58,237,0.12) inset` : "none" }}>
      <div style={{ height: 80, background: CARD_GRADIENTS[getIdNumber(char.id) % CARD_GRADIENTS.length], position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.05),transparent)" }} />
        {char.refEntries.length > 0
          ? <img src={char.refEntries[0].previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><User size={28} color="rgba(255,255,255,0.25)" /></div>}
        {isActive && <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 999, background: C.accent, display: "grid", placeItems: "center" }}><Check size={10} color="white" /></div>}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{char.name || "Unnamed"}</div>
        <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {[char.gender, char.ageRange, char.ethnicity].filter(Boolean).join(" · ") || "No traits set"}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.textMuted }}>{char.generations} images</div>
          {char.refEntries.length > 0 && <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd" }}>{char.refEntries.length} ref{char.refEntries.length > 1 ? "s" : ""}</div>}
          {char.locked && <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full, border: `1px solid rgba(34,197,94,0.25)`, background: "rgba(34,197,94,0.08)", color: "#86efac" }}>Locked</div>}
        </div>
      </div>
    </motion.div>
  );
}

function OutputCard({ item, onDelete, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => item.url && item.url !== "__FAILED__" && onOpen?.(item)}
      style={{ borderRadius: radius.lg, border: `1px solid ${hovered ? C.borderHover : C.border}`,
        overflow: "hidden", cursor: item.url && item.url !== "__FAILED__" ? "zoom-in" : "default", position: "relative",
        background: CARD_GRADIENTS[getIdNumber(item.id) % CARD_GRADIENTS.length], aspectRatio: "2/3", transition: "border-color 0.16s ease" }}>
      {item.url && item.url !== "__FAILED__" ? (
        <img
          src={item.url}
          alt={item.scene}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        />
      ) : item.url === "__FAILED__" ? (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>Failed</div><div style={{ fontSize: 11.5, color: C.textMuted }}>{item.scene}</div></div>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            style={{ width: 32, height: 32, borderRadius: 999, border: `2px solid ${C.accent}`, borderTopColor: "transparent" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.04),transparent 50%)", pointerEvents: "none" }} />
      <AnimatePresence>
        {hovered && item.url && item.url !== "__FAILED__" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent 55%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
              {[Download, Share2, Trash2].map((Icon, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); if (i === 2) onDelete?.(); }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid rgba(255,255,255,0.14)`, background: "rgba(0,0,0,0.55)", color: i === 2 ? "#f87171" : "white", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <Icon size={12} />
                </button>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{item.scene}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ConsistencyPage() {
  const router = useRouter();
  const [activeView,     setActiveView]     = useState("generate");
  const [outputView,     setOutputView]     = useState("grid");
  const [characters,     setCharacters]     = useState([]);
  const [activeCharId,   setActiveCharId]   = useState(null);
  const [generatingMore, setGeneratingMore] = useState(false);

  const [charName,    setCharName]    = useState("");
  const [charDesc,    setCharDesc]    = useState("");
  const [gender,      setGender]      = useState("");
  const [ageRange,    setAgeRange]    = useState("");
  const [ethnicity,   setEthnicity]   = useState("");
  const [hairStyle,   setHairStyle]   = useState("");
  const [hairColor,   setHairColor]   = useState("");
  const [eyeColor,    setEyeColor]    = useState("");
  const [build,       setBuild]       = useState("");
  const [refEntries,  setRefEntries]  = useState([]);
  const [charLocked,  setCharLocked]  = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const charLimit = 1000;

  const [outputs,         setOutputs]         = useState([]);
  const [generating,      setGenerating]      = useState(false);
  const [formSection,     setFormSection]     = useState("traits");
  const [lightboxItem, setLightboxItem] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [userId,          setUserId]          = useState(null);
  const [saving,          setSaving]          = useState(false);
  const [characterImages, setCharacterImages] = useState([]);
    const [masterCandidates, setMasterCandidates] = useState([]);
  const [masterIdentityImage, setMasterIdentityImage] = useState(null);
  const [generatingMaster, setGeneratingMaster] = useState(false);
  const [savingMaster, setSavingMaster] = useState(false);

  const canvasRef = useRef(null);
  const generatingRef = useRef(false);

  const activeChar = characters.find(c => c.id === activeCharId) || null;
  const charOutputs = outputs.filter(o => o.charId === activeCharId);
  const visibleCharOutputs = charOutputs.filter(o => o.url && o.url !== "__FAILED__");
  const orderedVisibleOutputs = CHARACTER_PACK_VIEWS
    .map(view => visibleCharOutputs.find(o => o.scene === view.label))
    .filter(Boolean);

  const frontOutput = visibleCharOutputs.find(o => o.scene === "Front Full-Body");
  const otherOutputs = visibleCharOutputs.filter(o => o.scene !== "Front Full-Body");
  const shouldShowGenerateMorePanel = false;

const updateCharactersCache = useCallback((chars) => {
  try {
    const safeChars = (chars || []).map((char) => ({
      ...char,
      refEntries: (char.refEntries || []).map((entry) => ({
        ...entry,
        file: null,
        previewUrl:
          typeof entry?.previewUrl === "string" && entry.previewUrl.startsWith("blob:")
            ? null
            : entry?.previewUrl || null,
      })),
      generatedImages: (char.generatedImages || []).filter(
        (url) => typeof url === "string" && !url.startsWith("blob:")
      ),
      coverImage:
        typeof char?.coverImage === "string" && char.coverImage.startsWith("blob:")
          ? null
          : char?.coverImage || null,
    }));

    localStorage.setItem(SESSION_KEY, JSON.stringify(safeChars));
  } catch {}
}, []);

const hydrateCachedCharacters = useCallback((cached) => {
  if (!Array.isArray(cached)) return [];

  return cached.map((item) => {
    const normalized =
      item && Array.isArray(item.refEntries) ? item : rowToCharacter(item || {}, []);

    return {
      ...normalized,
      refEntries: (normalized.refEntries || []).filter(
        (entry) =>
          entry &&
          typeof entry.previewUrl === "string" &&
          !entry.previewUrl.startsWith("blob:")
      ),
      generatedImages: (normalized.generatedImages || []).filter(
        (url) => typeof url === "string" && !url.startsWith("blob:")
      ),
      coverImage:
        typeof normalized?.coverImage === "string" &&
        !normalized.coverImage.startsWith("blob:")
          ? normalized.coverImage
          : null,
    };
  });
}, []);

  async function loadCharacterImages(characterId, allCharacters = null) {
    if (!characterId && !allCharacters?.length) {
      setCharacterImages([]);
      return [];
    }

    const ids = allCharacters?.length ? allCharacters.map(c => c.id) : [characterId];

    const { data, error } = await supabase
      .from("character_images")
      .select("*")
      .in("character_id", ids)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load character images:", error);
      return [];
    }

    if (!allCharacters?.length && characterId) {
      setCharacterImages((data || []).filter(img => img.character_id === characterId));
    }

    return data || [];
  }

  async function uploadCharacterRefs(characterId, entries) {
    if (!userId || !characterId || !entries?.length) return [];

    const rows = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry?.file) continue;

      try {
        const rawExt = entry.file.name?.split(".")?.pop()?.toLowerCase();
        const ext = rawExt || (entry.file.type === "image/webp" ? "webp" : entry.file.type === "image/jpeg" ? "jpg" : "png");
        const fileName = `${Date.now()}_${i}.${ext}`;
        const storagePath = `${userId}/${characterId}/refs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(CHAR_BUCKET)
          .upload(storagePath, entry.file, { contentType: entry.file.type, upsert: false });

        if (uploadError) {
          console.error("Ref upload failed:", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from(CHAR_BUCKET).getPublicUrl(storagePath);
        const imageUrl = publicUrlData?.publicUrl || null;
        if (!imageUrl) continue;

        const { data: row, error: rowError } = await supabase
          .from("character_images")
          .insert({
            user_id: userId,
            character_id: characterId,
            image_url: imageUrl,
            storage_path: storagePath,
            source_type: "upload",
            sort_order: i,
          })
          .select()
          .single();

        if (rowError) {
          console.error("character_images insert error:", rowError);
          continue;
        }

        rows.push(row);
      } catch (err) {
        console.error("Ref upload exception:", err);
      }
    }

    return rows;
  }

  async function persistGeneratedImage(imageUrl, characterId, folder = "generated") {
  if (!imageUrl || !userId || !characterId) return null;

  try {
    const res = await fetch("/api/persist-character-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        userId,
        characterId,
        folder,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Persist image failed:", data);
      return null;
    }

    return data.url || null;
  } catch (err) {
    console.error("Persist image request failed:", err);
    return null;
  }
}

  async function insertGeneratedCharacterImage(characterId, imageUrl, scene, sortOrder = 0, isCover = false) {
    if (!userId || !characterId || !imageUrl) return null;

    const packViewKey = CHARACTER_PACK_VIEWS.find(v => v.label === scene)?.key || null;

    const { data, error } = await supabase
      .from("character_images")
      .insert({
        user_id: userId,
        character_id: characterId,
        image_url: imageUrl,
        source_type: "generated",
        is_cover: !!isCover,
        pack_view: packViewKey,
        sort_order: sortOrder,
        metadata: { scene },
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert generated character image:", error);
      return null;
    }

    return data;
  }

    async function insertMasterIdentityImage(characterId, imageUrl, sortOrder = 0) {
    if (!userId || !characterId || !imageUrl) return null;

    await supabase
      .from("character_images")
      .update({ is_canon: false })
      .eq("character_id", characterId)
      .eq("source_type", "master_identity");

    const { data, error } = await supabase
      .from("character_images")
      .insert({
        user_id: userId,
        character_id: characterId,
        image_url: imageUrl,
        source_type: "master_identity",
        is_canon: true,
        is_cover: true,
        sort_order: sortOrder,
        metadata: { role: "master_identity" },
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to insert master identity image:", error);
      return null;
    }

    return data;
  }

  async function markAsCanon(imageId) {
    const { error } = await supabase
      .from("character_images")
      .update({ is_canon: true })
      .eq("id", imageId);

    if (error) {
      console.error(error);
      alert("Failed to mark image as canon.");
      return;
    }

    if (activeChar?.id) {
      const rows = await loadCharacterImages(activeChar.id);
      const refRows = rows.filter(r => r.character_id === activeChar.id);
      setCharacterImages(refRows);
    }
  }

  async function markAsCover(image) {
    if (!activeChar?.id || !image?.id) return;

    await supabase
      .from("character_images")
      .update({ is_cover: false })
      .eq("character_id", activeChar.id);

    const { error: imageError } = await supabase
      .from("character_images")
      .update({ is_cover: true })
      .eq("id", image.id);

    if (imageError) {
      console.error(imageError);
      return;
    }

    const { error: charError } = await supabase
      .from("characters")
      .update({ cover_image: image.image_url })
      .eq("id", activeChar.id)
      .eq("user_id", userId);

    if (charError) {
      console.error(charError);
      return;
    }

    const rows = await loadCharacterImages(activeChar.id);
    const refRows = rows.filter(r => r.character_id === activeChar.id);
    setCharacterImages(refRows);
  }

useEffect(() => {
  if (!activeCharId) return;

  setCharacters((prev) => {
    const updated = prev.map((c) =>
      c.id === activeCharId
        ? {
            ...c,
            refEntries: (refEntries || []).map((entry) => ({
              ...entry,
              file: null,
            })),
          }
        : c
    );

    updateCharactersCache(updated);
    return updated;
  });
}, [refEntries, activeCharId, updateCharactersCache]);

  useEffect(() => {
    if (!activeCharId) {
      setOutputs([]);
      setCharacterImages([]);
      return;
    }

    if (generatingRef.current || generatingMore) return;

    const current = characters.find(c => c.id === activeCharId);
    if (!current) {
      setOutputs([]);
      setCharacterImages([]);
      return;
    }

    setCharacterImages(
      (current.refEntries || []).map((entry, i) => ({
        id: entry.id || `local-${i}`,
        character_id: current.id,
        image_url: entry.previewUrl,
        storage_path: entry.storagePath || null,
        source_type: entry.sourceType || "upload",
        is_canon: !!entry.isCanon,
        is_cover: !!entry.isCover,
        pack_view: entry.packView || null,
      }))
    );
    setOutputs(outputsFromCharacter(current));
  }, [activeCharId, characters, generatingMore]);

    useEffect(() => {
    if (!activeChar) {
      setMasterIdentityImage(null);
      return;
    }

    setMasterIdentityImage(getMasterImageForCharacter(activeChar));
  }, [activeChar]);

  useEffect(() => {
    let mounted = true;

    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setCharacters(hydrateCachedCharacters(cached));
        }
      }
    } catch {}

    async function bootstrapCharacters() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const uid = session?.user?.id ?? null;

      if (!mounted) return;

      setUserId(uid);

      if (!uid) return;

const { data, error } = await supabase
    .from("characters")
    .select("id, name, description, prompt, reference_image, generated_images, cover_image, master_image, style, seed, created_at, trigger_token, status, lora_path, base_model, locked_traits, metadata")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  console.log("Characters query result:", { data, error });

  if (!mounted) return;

  if (error) {
    console.error("Failed to load saved characters:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      raw: error,
    });
    return;
  }

      if (data && !generatingRef.current) {
        const allImageRows = await loadCharacterImages(null, data);
        if (!mounted) return;

        const grouped = new Map();
        for (const img of allImageRows) {
          if (!grouped.has(img.character_id)) grouped.set(img.character_id, []);
          grouped.get(img.character_id).push(img);
        }

        const mapped = data.map(row => rowToCharacter(row, grouped.get(row.id) || []));
        setCharacters(mapped);
        updateCharactersCache(mapped);
      }
    }

    bootstrapCharacters();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const uid = session?.user?.id ?? null;
      setUserId(uid);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateCachedCharacters, updateCharactersCache]);

  async function saveCharacter() {
    if (!charName.trim()) return;
    if (!userId) {
      alert("Please log in first to save characters.");
      return;
    }

    setSaving(true);

    try {
      const lockedTraits = {
        gender: gender || "",
        age: ageRange || "",
        ethnicity: ethnicity || "",
        hair_style: hairStyle || "",
        hair_color: hairColor || "",
        eye_color: eyeColor || "",
        build: build || "",
        charLocked: !!charLocked,
      };

      const promptPayload = buildTraitsPayload({
        charDesc,
        gender,
        ageRange,
        ethnicity,
        hairStyle,
        hairColor,
        eyeColor,
        build,
        charLocked,
        extraPrompt,
      });

      const existingChar = activeCharId ? characters.find(c => c.id === activeCharId) : null;
      const triggerToken = existingChar?.triggerToken || makeTriggerToken(charName);

      const payload = {
        user_id: userId,
        name: charName.trim(),
        description: charDesc.trim(),
        prompt: promptPayload,
        style: existingChar?.style || null,
        seed: null,
        status: "ready",
        trigger_token: triggerToken,
        locked_traits: lockedTraits,
      };

      let result;

      if (existingChar?.id) {
        result = await supabase
          .from("characters")
          .update(payload)
          .eq("id", existingChar.id)
          .eq("user_id", userId)
          .select()
          .single();
      } else {
        result = await supabase
          .from("characters")
          .insert([payload])
          .select()
          .single();
      }

      const { data, error } = result;
      if (error || !data) {
        console.error("Character save failed:", error);
        alert(`Failed to save: ${error?.message}`);
        setSaving(false);
        return;
      }

      const uploadedRows = await uploadCharacterRefs(data.id, refEntries);
      const existingRemoteRefs = refEntries
        .filter(entry => !entry.file && entry.previewUrl)
        .map((entry, i) => ({
          id: entry.id || null,
          character_id: data.id,
          image_url: entry.previewUrl,
          storage_path: entry.storagePath || null,
          source_type: entry.sourceType || "upload",
          is_canon: !!entry.isCanon,
          is_cover: !!entry.isCover,
          pack_view: entry.packView || null,
          sort_order: i,
          created_at: new Date().toISOString(),
        }));

      const combinedRefRows = [...existingRemoteRefs, ...uploadedRows];
      const firstRefUrl = combinedRefRows[0]?.image_url || existingChar?.coverImage || null;

      await supabase
        .from("characters")
        .update({
          reference_image: firstRefUrl,
          cover_image: data.cover_image || firstRefUrl,
        })
        .eq("id", data.id)
        .eq("user_id", userId);

      const savedChar = rowToCharacter(
        { ...data, reference_image: firstRefUrl, cover_image: data.cover_image || firstRefUrl, prompt: promptPayload, locked_traits: lockedTraits },
        combinedRefRows
      );

      setCharacters(prev => {
        const exists = prev.some(c => c.id === savedChar.id);
        const updated = exists ? prev.map(c => c.id === savedChar.id ? { ...c, ...savedChar } : c) : [savedChar, ...prev];
        updateCharactersCache(updated);
        return updated;
      });

      setCharacterImages(combinedRefRows);
      setActiveCharId(data.id);
      setRefEntries(savedChar.refEntries);

      if (!existingChar?.id) {
        setCharName("");
        setCharDesc("");
        setGender("");
        setAgeRange("");
        setEthnicity("");
        setHairStyle("");
        setHairColor("");
        setEyeColor("");
        setBuild("");
        setRefEntries([]);
        setCharLocked(false);
        setExtraPrompt("");
      }

      setFormSection("generate");
      setActiveView("generate");
    } catch (err) {
      console.error("Save exception:", err);
      alert("Failed to save character.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOutput(outputId) {
    const output = outputs.find(o => o.id === outputId);
    setOutputs(prev => prev.filter(o => o.id !== outputId));

    if (!output?.url || output.url === "__FAILED__" || !userId) return;

    const char = characters.find(c => c.id === output.charId);
    if (!char) return;

    const updatedImages = (char.generatedImages || []).filter(url => url !== output.url);

    await supabase
      .from("characters")
      .update({ generated_images: updatedImages })
      .eq("id", char.id)
      .eq("user_id", userId);

    await supabase
      .from("character_images")
      .delete()
      .eq("character_id", char.id)
      .eq("image_url", output.url)
      .eq("source_type", "generated");

    setCharacters(prev => {
      const updated = prev.map(c => c.id === char.id ? { ...c, generatedImages: updatedImages, generations: updatedImages.length } : c);
      updateCharactersCache(updated);
      return updated;
    });

    if (activeCharId === char.id) {
      const rows = await loadCharacterImages(char.id);
      setCharacterImages(rows.filter(r => r.character_id === char.id));
    }
  }

  function openLightboxForItem(item) {
    const index = orderedVisibleOutputs.findIndex(o => o.id === item.id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxItem(item);
  }

  function goPrevLightbox() {
    if (!orderedVisibleOutputs.length) return;
    const nextIndex =
      lightboxIndex <= 0 ? orderedVisibleOutputs.length - 1 : lightboxIndex - 1;
    setLightboxIndex(nextIndex);
    setLightboxItem(orderedVisibleOutputs[nextIndex]);
  }

  function goNextLightbox() {
    if (!orderedVisibleOutputs.length) return;
    const nextIndex =
      lightboxIndex >= orderedVisibleOutputs.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(nextIndex);
    setLightboxItem(orderedVisibleOutputs[nextIndex]);
  }

  async function deleteAllOutputs() {
    setOutputs(prev => prev.filter(o => o.charId !== activeCharId));
    if (!activeCharId || !userId) return;

    await supabase
      .from("characters")
      .update({ generated_images: [], cover_image: null })
      .eq("id", activeCharId)
      .eq("user_id", userId);

    await supabase
      .from("character_images")
      .delete()
      .eq("character_id", activeCharId)
      .eq("source_type", "generated");

    setCharacters(prev => {
      const updated = prev.map(c => c.id === activeCharId ? { ...c, generatedImages: [], generations: 0, coverImage: c.refEntries[0]?.previewUrl || null } : c);
      updateCharactersCache(updated);
      return updated;
    });

    const rows = await loadCharacterImages(activeCharId);
    setCharacterImages(rows.filter(r => r.character_id === activeCharId));
  }

  async function deleteCharacter(id) {
    setCharacters(prev => {
      const updated = prev.filter(c => c.id !== id);
      updateCharactersCache(updated);
      return updated;
    });

    setOutputs(prev => prev.filter(o => o.charId !== id));

    if (activeCharId === id) {
      const next = characters.find(c => c.id !== id);
      setActiveCharId(next?.id ?? null);
    }

    if (userId && !String(id).startsWith("local-")) {
      await supabase.from("characters").delete().eq("id", id).eq("user_id", userId);
    }
  }

  function loadCharacterIntoForm(char) {
    setCharName(char.name);
    setCharDesc(char.desc);
    setGender(char.gender);
    setAgeRange(char.ageRange);
    setEthnicity(char.ethnicity);
    setHairStyle(char.hairStyle);
    setHairColor(char.hairColor);
    setEyeColor(char.eyeColor);
    setBuild(char.build);
    setRefEntries([...(char.refEntries || [])]);
    setCharLocked(char.locked);
    setExtraPrompt(char.extraPrompt || "");
    setActiveCharId(char.id);
    setFormSection("generate");
  }

  function sendToImageGen() {
    if (!activeChar || charOutputs.length === 0) return;

    const traitDesc = [
      activeChar.gender,
      activeChar.ageRange,
      activeChar.ethnicity,
      activeChar.hairColor && activeChar.hairStyle ? `${activeChar.hairColor} ${activeChar.hairStyle} hair` : null,
      activeChar.eyeColor ? `${activeChar.eyeColor} eyes` : null,
      activeChar.build ? `${activeChar.build} build` : null,
    ].filter(Boolean).join(", ");

    const charPrompt = [
      `Use the saved character ${activeChar.name}`,
      activeChar.triggerToken ? `Trigger token: ${activeChar.triggerToken}` : null,
      traitDesc ? `same identity and physical traits: ${traitDesc}` : null,
      activeChar.desc || null,
      activeChar.refEntries.length > 0 ? `Maintain exact facial features, skin tone, and distinguishing characteristics of this specific person.` : null,
    ].filter(Boolean).join(". ");

    try {
      sessionStorage.setItem("kylor_prefill_prompt", charPrompt);
      sessionStorage.setItem("kylor_selected_character_id", String(activeChar.id));
      sessionStorage.setItem("kylor_selected_character_payload", JSON.stringify(activeChar));
    } catch {}

    router.push("/image");
  }
  
  async function handleGenerateMasterIdentity() {
    if (!activeChar || generatingMaster) return;

    const effectiveRefs = activeChar.refEntries.length > 0 ? activeChar.refEntries : refEntries;
    const uploadedRefs = await entriesToReferenceImages(effectiveRefs);

    if (!uploadedRefs.length) {
      alert("Please upload at least one reference image first.");
      return;
    }

    setGeneratingMaster(true);
    setMasterCandidates([]);

    try {
      const res = await fetch("/api/generate-master-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  prompt: [
    activeChar.desc || "",
    extraPrompt || "",
    "close-up master identity portrait, neutral expression, plain light studio background, same exact person",
  ]
    .filter(Boolean)
    .join(". "),
  referenceImages: uploadedRefs,
  negativePrompt:
    "different person, identity drift, generic face, altered hairstyle, altered skin tone, beauty filter, cgi, 3d render, text, watermark",
  strictIdentity: true,
  candidates: 4,
  userId,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate master identity");
      }

      const urls = extractGeneratedUrls(data);
      setMasterCandidates(urls);
    } catch (err) {
      console.error("Master identity generation failed:", err);
      alert(err?.message || "Failed to generate master identity.");
    } finally {
      setGeneratingMaster(false);
    }
  }

  async function useMasterIdentity(candidate) {
    if (!activeChar || !candidate?.url || savingMaster) return;

    setSavingMaster(true);

    try {
      const savedMasterUrl = candidate.url;

if (!savedMasterUrl) {
  throw new Error("Failed to persist master identity image.");
}

await insertMasterIdentityImage(activeChar.id, savedMasterUrl, 0);

await supabase
  .from("characters")
  .update({
     cover_image: savedMasterUrl,
  reference_image: savedMasterUrl,
  master_image: savedMasterUrl,
  })
        .eq("id", activeChar.id)
        .eq("user_id", userId);

      const rows = await loadCharacterImages(activeChar.id);
      const mapped = rowToCharacter(
  {
    ...activeChar,
    cover_image: savedMasterUrl,
    reference_image: savedMasterUrl,
    master_image: savedMasterUrl,
          prompt: buildTraitsPayload({
            charDesc: activeChar.desc,
            gender: activeChar.gender,
            ageRange: activeChar.ageRange,
            ethnicity: activeChar.ethnicity,
            hairStyle: activeChar.hairStyle,
            hairColor: activeChar.hairColor,
            eyeColor: activeChar.eyeColor,
            build: activeChar.build,
            charLocked: activeChar.locked,
            extraPrompt,
          }),
          locked_traits: {
            gender: activeChar.gender || "",
            age: activeChar.ageRange || "",
            ethnicity: activeChar.ethnicity || "",
            hair_style: activeChar.hairStyle || "",
            hair_color: activeChar.hairColor || "",
            eye_color: activeChar.eyeColor || "",
            build: activeChar.build || "",
            charLocked: !!activeChar.locked,
          },
        },
        rows
      );

      setCharacters(prev => {
        const updated = prev.map(c => (c.id === activeChar.id ? mapped : c));
        updateCharactersCache(updated);
        return updated;
      });

      setCharacterImages(rows.filter(r => r.character_id === activeChar.id));
      setRefEntries(mapped.refEntries);
      setMasterIdentityImage(savedMasterUrl);
      setMasterCandidates([]);
      alert("Master identity selected.");
    } catch (err) {
      console.error("Use master identity failed:", err);
      alert("Failed to save master identity.");
    } finally {
      setSavingMaster(false);
    }
  }
async function handleGenerateCharacterPack() {
  if (!activeChar || generating) return;

  const masterRef = activeChar.masterImage || masterIdentityImage || getMasterImageForCharacter(activeChar);

  if (!masterRef) {
    alert("Please select a master identity first.");
    return;
  }

  generatingRef.current = true;
  setGenerating(true);

  try {
    const res = await fetch("/api/generate-character-pack", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        characterId: activeChar.id,
        masterImage: masterRef,
        userId,
        negativePrompt:
          "different person, identity drift, altered face shape, altered hairstyle, altered skin tone, generic face, beauty filter, CGI, 3D render, multiple people, collage, split screen, text, watermark",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to generate character pack");
    }

    const pack = Array.isArray(data?.pack) ? data.pack : [];

    const nextOutputs = pack.map((item) => ({
      id: `${activeChar.id}-${item.type}`,
      charId: activeChar.id,
      prompt: "",
      scene: PACK_VIEWS.find((v) => v.key === item.type)?.label || item.type,
      url: item.url,
      createdAt: new Date().toISOString(),
    }));

    setOutputs((prev) => [
      ...prev.filter((o) => o.charId !== activeChar.id),
      ...nextOutputs,
    ]);

    const rows = await loadCharacterImages(activeChar.id);

    const mapped = rowToCharacter(
      {
        ...activeChar,
        master_image: masterRef,
      },
      rows
    );

    setCharacters((prev) => {
      const updated = prev.map((c) => (c.id === activeChar.id ? mapped : c));
      updateCharactersCache(updated);
      return updated;
    });

    setCharacterImages(rows.filter((r) => r.character_id === activeChar.id));
  } catch (err) {
    console.error("Character pack generation failed:", err);
    alert(err?.message || "Failed to generate character pack.");
  } finally {
    generatingRef.current = false;
    setGenerating(false);
  }
}
  async function generateOtherProfiles() {
    if (!activeChar || generatingMore) return;

    const existingFront = charOutputs.find(
      o => o.scene === "Front Full-Body" && o.url && o.url !== "__FAILED__"
    );

    if (!existingFront) {
      alert("Generate the first image first.");
      return;
    }

    setGeneratingMore(true);

    const views = [
      {
        key: "left",
        label: "Left Profile Full-Body",
        shot: "strict left side profile, full-body, facing left, standing straight, arms relaxed, centered composition",
        size: "1024x1536",
      },
      {
        key: "right",
        label: "Right Profile Full-Body",
        shot: "strict right side profile, full-body, facing right, standing straight, arms relaxed, centered composition",
        size: "1024x1536",
      },
      {
        key: "back",
        label: "Back Full-Body",
        shot: "back view, full-body, standing straight, arms relaxed, centered composition",
        size: "1024x1536",
      },
      {
        key: "closeup",
        label: "Upper-Body Close-Up",
        shot: "upper-body close-up portrait, facing camera, neutral expression, centered composition",
        size: "1024x1024",
      },
    ];

    let accumulatedImages = [...(activeChar.generatedImages || []).filter(Boolean)];

    const effectiveRefs = activeChar.refEntries.length > 0 ? activeChar.refEntries : refEntries;
    const uploadedRefs = await entriesToReferenceImages(effectiveRefs);

        const masterRef = masterIdentityImage || getMasterImageForCharacter(activeChar);

    const sharedReferenceImages = [
      ...uploadedRefs.filter(Boolean),
      masterRef,
      existingFront.url,
    ].filter(Boolean);

    try {
      for (const view of views) {
        const placeholder = {
          id: `${activeCharId}-${view.key}-${Date.now()}`,
          charId: activeCharId,
          prompt: view.shot,
          scene: view.label,
          url: null,
          createdAt: new Date().toISOString(),
        };

        setOutputs(prev => [
          ...prev.filter(o => !(o.charId === activeCharId && o.scene === view.label)),
          placeholder,
        ]);

        const finalPrompt = buildLockedCharacterPrompt({
          char: activeChar,
          shot: view.shot,
          extraPrompt,
          hasRefs: sharedReferenceImages.length > 0,
          mode: "profile",
        });

        const res = await fetch("/api/generate-consistency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  prompt: finalPrompt,
  size: view.size,
  referenceImages: sharedReferenceImages,
  negativePrompt:
    "different person, identity drift, altered face shape, altered hairline, altered hairstyle, altered skin tone, changed beard, generic face, beauty filter, CGI, 3D render, multiple people, collage, split screen, text, watermark",
  strictIdentity: true,
  attempts: 3,
  userId,
}),
        });

        const data = await res.json();
        console.log("PROFILE RESPONSE:", data);

const savedUrl = extractGeneratedUrl(data);
setOutputs(prev =>
  prev.map(o =>
    o.id === placeholder.id ? { ...o, url: savedUrl || "__FAILED__" } : o
  )
);

if (savedUrl) {
  accumulatedImages = [...accumulatedImages, savedUrl];

  await insertGeneratedCharacterImage(
    activeCharId,
    savedUrl,
    view.label,
    accumulatedImages.length - 1,
    false
  );

          await supabase
            .from("characters")
            .update({ generated_images: accumulatedImages })
            .eq("id", activeCharId)
            .eq("user_id", userId);

          setCharacters(prev => {
            const updated = prev.map(c =>
              c.id === activeCharId
                ? {
                    ...c,
                    generatedImages: accumulatedImages,
                    generations: accumulatedImages.length,
                  }
                : c
            );
            updateCharactersCache(updated);
            return updated;
          });

          const rows = await loadCharacterImages(activeCharId);
          setCharacterImages(rows.filter(r => r.character_id === activeCharId));
        }
      }
    } catch (err) {
      console.error("Generate other profiles failed:", err);
    } finally {
      setGeneratingMore(false);
    }
  }

  async function handleGenerate() {
    if (!activeChar || generating) return;

    generatingRef.current = true;
    setGenerating(true);

    const frontView = CHARACTER_PACK_VIEWS[0];
    const effectiveRefs = activeChar.refEntries.length > 0 ? activeChar.refEntries : refEntries;
    const frontOutputItem = {
      id: `${activeCharId}-${frontView.key}-${Date.now()}`,
      charId: activeCharId,
      prompt: frontView.shot,
      scene: frontView.label,
      url: null,
      createdAt: new Date().toISOString(),
    };

    setOutputs(prev => [frontOutputItem, ...prev.filter(o => o.charId !== activeCharId)]);
    canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    try {
const uploadedRefs = await entriesToReferenceImages(effectiveRefs);
const masterRef = masterIdentityImage || getMasterImageForCharacter(activeChar);
const finalRefs = [...uploadedRefs, masterRef].filter(Boolean);
const hasRefs = finalRefs.length > 0;
      const finalPrompt = buildLockedCharacterPrompt({
        char: activeChar,
        shot: "front-facing, full-body, standing straight, arms relaxed, centered composition",
        extraPrompt,
        hasRefs,
        mode: "front",
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      let data = null;
      try {
        const res = await fetch("/api/generate-consistency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        body: JSON.stringify({
  prompt: finalPrompt,
  size: frontView.size,
  referenceImages: finalRefs,
  negativePrompt:
    "different person, identity drift, generic face, altered hairstyle, altered skin tone, beauty filter, CGI, 3D render, duplicate person, collage, split screen, text, watermark",
  strictIdentity: true,
  attempts: 3,
  userId,
}),
        });

        data = await res.json();
      } finally {
        clearTimeout(timeout);
      }

      console.log("GEN RESPONSE:", data);

const savedUrl = extractGeneratedUrl(data);

setOutputs(prev =>
  prev.map(o =>
    o.id === frontOutputItem.id ? { ...o, url: savedUrl || "__FAILED__" } : o
  )
);

if (savedUrl) {
  await insertGeneratedCharacterImage(activeCharId, savedUrl, frontView.label, 0, true);

  const updatedChar = {
    ...activeChar,
    generations: 1,
    generatedImages: [savedUrl],
    extraPrompt: extraPrompt || activeChar.extraPrompt || "",
    coverImage: savedUrl,
  };

        setCharacters(prev => {
          const updated = prev.map(c => (c.id === activeCharId ? updatedChar : c));
          updateCharactersCache(updated);
          return updated;
        });

        if (userId && !String(activeCharId).startsWith("local-")) {
          await supabase
            .from("characters")
            .update({
              generated_images: [savedUrl],
cover_image: savedUrl,
              prompt: buildTraitsPayload({
                charDesc: activeChar.desc,
                gender: activeChar.gender,
                ageRange: activeChar.ageRange,
                ethnicity: activeChar.ethnicity,
                hairStyle: activeChar.hairStyle,
                hairColor: activeChar.hairColor,
                eyeColor: activeChar.eyeColor,
                build: activeChar.build,
                charLocked: activeChar.locked,
                extraPrompt,
              }),
              locked_traits: {
                gender: activeChar.gender || "",
                age: activeChar.ageRange || "",
                ethnicity: activeChar.ethnicity || "",
                hair_style: activeChar.hairStyle || "",
                hair_color: activeChar.hairColor || "",
                eye_color: activeChar.eyeColor || "",
                build: activeChar.build || "",
                charLocked: !!activeChar.locked,
              },
            })
            .eq("id", activeCharId)
            .eq("user_id", userId);
        }

        const rows = await loadCharacterImages(activeCharId);
        setCharacterImages(rows.filter(r => r.character_id === activeCharId));
      }
    } catch (err) {
      console.error("Generate failed:", err);
      setOutputs(prev =>
        prev.map(o =>
          o.id === frontOutputItem.id ? { ...o, url: "__FAILED__" } : o
        )
      );
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  }

  function resetToLanding() {
    setActiveCharId(null);
    setCharName("");
    setCharDesc("");
    setGender("");
    setAgeRange("");
    setEthnicity("");
    setHairStyle("");
    setHairColor("");
    setEyeColor("");
    setBuild("");
    setRefEntries([]);
    setCharLocked(false);
    setExtraPrompt("");
    setFormSection("traits");
    setActiveView("generate");
  }

  const canGenerate = !!activeChar && !generating;

  return (
    <main style={{ height: "100vh", overflow: "hidden",
      background: `radial-gradient(ellipse at 8% 12%,rgba(79,70,229,0.13),transparent 28%),radial-gradient(ellipse at 92% 8%,rgba(124,58,237,0.11),transparent 30%),${C.bg}`,
      color: C.text, fontFamily: "'Inter','SF Pro Display',sans-serif", display: "grid", gridTemplateColumns: "88px 1fr" }}>

      <aside style={{ borderRight: `1px solid ${C.border}`, background: C.sidebar, padding: "18px 10px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ width: 46, height: 46, borderRadius: 16, margin: "0 auto 22px", display: "grid", placeItems: "center",
          background: "linear-gradient(135deg,rgba(79,70,229,0.28),rgba(124,58,237,0.18))", border: `1px solid ${C.border}`, boxShadow: `0 0 20px ${C.accentGlow}` }}>
          <Sparkles size={20} color="#a78bfa" />
        </div>
        <div style={{ display: "grid", gap: 8 }}>{SIDEBAR_ITEMS.map(item => <SidebarItem key={item.label} item={item} />)}</div>
      </aside>

      <div style={{ display: "grid", gridTemplateRows: "48px 1fr", height: "100vh", overflow: "hidden" }}>

        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ height: 30, padding: "0 12px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Character Consistency
            </div>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 2px" }} />
            {[{ label: "Generate", id: "generate", icon: Wand2 }, { label: "Characters", id: "characters", icon: Users }].map(({ label, id, icon: Icon }) => (
              <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setActiveView(id)}
                style={{ height: 30, padding: "0 12px", borderRadius: 9, display: "inline-flex", alignItems: "center", gap: 6,
                  border: `1px solid ${activeView === id ? C.accentBorder : "transparent"}`,
                  background: activeView === id ? C.accentSoft : "transparent",
                  color: activeView === id ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: 12.5,
                  fontFamily: "inherit", fontWeight: activeView === id ? 600 : 400, transition: "all 0.15s ease" }}>
                <Icon size={12} /> {label}
              </motion.button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
              <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setOutputView(val)}
                style={{ width: 34, height: 34, borderRadius: radius.sm, border: `1px solid ${C.border}`,
                  background: outputView === val ? "rgba(255,255,255,0.08)" : "transparent",
                  color: outputView === val ? C.text : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
                <Icon size={15} />
              </motion.button>
            ))}
            <motion.button whileHover={{ borderColor: C.borderHover }}
              style={{ height: 34, padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`,
                background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              <Folder size={13} /> Assets
            </motion.button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "100%", overflow: "hidden" }}>

          <div style={{ borderRight: `1px solid ${C.border}`, background: "linear-gradient(180deg,rgba(7,9,15,0.98),rgba(9,11,17,0.98))", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

            <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: 4, borderRadius: radius.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                {[{ id: "traits", label: "Traits", icon: Sliders }, { id: "refs", label: "Refs", icon: Camera }, { id: "generate", label: "Generate", icon: Sparkles }].map(({ id, label, icon: Icon }) => {
                  const active = formSection === id;
                  return (
                    <motion.button key={id} whileTap={{ scale: 0.96 }} onClick={() => setFormSection(id)}
                      style={{ height: 34, borderRadius: radius.sm, border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                        background: active ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.13))" : "transparent",
                        color: active ? "white" : C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon size={11} /> {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <motion.button whileTap={{ scale: 0.94 }} onClick={resetToLanding} title="Back to home"
                      style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, transition: "all 0.15s ease" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentBorder; e.currentTarget.style.color = "#c4b5fd"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                      <ChevronLeft size={14} />
                    </motion.button>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 13.5, position: "relative", display: "inline-block", paddingBottom: 4 }}>
                      {formSection === "traits" ? "Character Traits" : formSection === "refs" ? "Reference Images" : "Generate"}
                      <span style={{ position: "absolute", left: 0, bottom: -13, width: "100%", height: 2, borderRadius: radius.full, background: `linear-gradient(90deg,${C.indigo},${C.accent})` }} />
                    </div>
                  </div>
                  {activeChar && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>
                      <User size={9} /> {activeChar.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>

              {formSection === "traits" && (<>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Character Name *</div>
 <input
  id="character-name"
  name="characterName"
  value={charName}
  onChange={e => setCharName(e.target.value)}
  placeholder="e.g. Aria Voss, Marcus Kane…"
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: radius.sm, border: `1px solid ${charName ? C.accentBorder : C.border}`, background: charName ? C.accentSoft : C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "all 0.16s ease" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Description</div>
                  <textarea
  id="character-description"
  name="characterDescription"
  ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
  value={charDesc} onChange={e => { setCharDesc(e.target.value.slice(0, 1000)); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    placeholder="Scar above left eyebrow, always wears a silver necklace…" rows={3}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.text, resize: "none", overflow: "hidden", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxSizing: "border-box", minHeight: 80 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Demographics</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Gender</div><Select label="Select" options={GENDERS} value={gender} onChange={setGender} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Age</div><Select label="Select" options={AGE_RANGE} value={ageRange} onChange={setAgeRange} /></div>
                    <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Ethnicity</div><Select label="Select" options={ETHNICITIES} value={ethnicity} onChange={setEthnicity} /></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Physical Features</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Hair style</div><Select label="Select" options={HAIR_STYLES} value={hairStyle} onChange={setHairStyle} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Hair color</div><Select label="Select" options={HAIR_COLORS} value={hairColor} onChange={setHairColor} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Eye color</div><Select label="Select" options={EYE_COLORS} value={eyeColor} onChange={setEyeColor} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Build</div><Select label="Select" options={BUILD_TYPES} value={build} onChange={setBuild} /></div>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCharLocked(p => !p)}
                  style={{ height: 36, padding: "0 14px", borderRadius: radius.sm, cursor: "pointer", border: `1px solid ${charLocked ? "rgba(34,197,94,0.3)" : C.border}`, background: charLocked ? "rgba(34,197,94,0.08)" : C.surface, color: charLocked ? "#86efac" : C.textMuted, fontSize: 12.5, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s ease" }}>
                  {charLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  {charLocked ? "Character locked (consistent)" : "Lock character traits"}
                </motion.button>
                <motion.button whileHover={charName.trim() && !saving ? { boxShadow: "0 12px 32px rgba(124,58,237,0.35)" } : {}} whileTap={charName.trim() && !saving ? { scale: 0.98 } : {}} onClick={saveCharacter} disabled={saving || !charName.trim()}
                  style={{ height: 44, borderRadius: radius.md, border: "none", cursor: charName.trim() && !saving ? "pointer" : "default",
                    background: charName.trim() && !saving ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
                    color: charName.trim() && !saving ? "white" : C.textMuted, fontSize: 13.5, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: charName.trim() && !saving ? "0 8px 24px rgba(124,58,237,0.25)" : "none" }}>
                  {saving ? (<><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={15} /></motion.div>Saving…</>) : (<><User size={15} /> Save Character</>)}
                </motion.button>
              </>)}

              {formSection === "refs" && (<>
                <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.65 }}>Upload reference photos of the character. More consistent references = more accurate generations.</p>
                <RefUpload entries={refEntries} onEntries={setRefEntries} label="Face references" hint="Clear, front-facing photos · best results" max={5} />
                {refEntries.length > 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: radius.sm, border: `1px solid rgba(34,197,94,0.25)`, background: "rgba(34,197,94,0.06)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#86efac" }}>
                    <Check size={13} /> {refEntries.length} reference image{refEntries.length > 1 ? "s" : ""} ready — will be saved with character.
                  </div>
                )}
                <div style={{ padding: 14, borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Tips for better consistency</div>
                  {["Use clear, well-lit photos", "Include front and 3/4 angles", "Avoid obscured faces or masks", "2–5 references works best"].map((tip, i, arr) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 999, background: C.accent, flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
                {activeChar && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setFormSection("generate")}
                    style={{ height: 40, borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", fontFamily: "inherit" }}>
                    <ChevronRight size={13} /> Continue to Generate
                  </motion.button>
                )}
              </>)}

              {formSection === "generate" && (<>
                {!activeChar && (
                  <div style={{ padding: 20, borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, textAlign: "center" }}>
                    <User size={32} color={C.textDim} style={{ margin: "0 auto 12px" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>No character selected</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, lineHeight: 1.6 }}>Create a character first, or select one from the Characters view.</div>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFormSection("traits")}
                      style={{ height: 34, padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Plus size={12} /> Create character
                    </motion.button>
                  </div>
                )}

                {activeChar && (<>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Reference Notes</div>
                    <div style={{ position: "relative" }}>
                      <textarea
  id="reference-notes"
  name="referenceNotes"
  ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
  value={extraPrompt} onChange={e => { setExtraPrompt(e.target.value.slice(0, charLimit)); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                        placeholder="outfit details, facial details, accessories, exact look notes…" rows={1}
                        style={{ width: "100%", minHeight: 110, padding: "10px 12px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, color: C.text, resize: "none", overflow: "hidden", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }} />
                      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10.5, color: extraPrompt.length > charLimit * 0.9 ? "#f87171" : C.textDim }}>{extraPrompt.length}/{charLimit}</div>
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: CARD_GRADIENTS[getIdNumber(activeChar.id) % CARD_GRADIENTS.length], display: "grid", placeItems: "center" }}>
                      {activeChar.refEntries.length > 0 ? <img src={activeChar.refEntries[0].previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={14} color="rgba(255,255,255,0.4)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{activeChar.name}</div>
                      <div style={{ fontSize: 11, color: activeChar.refEntries.length > 0 ? "#86efac" : C.textMuted }}>
                        {activeChar.refEntries.length > 0 ? `${activeChar.refEntries.length} ref image${activeChar.refEntries.length > 1 ? "s" : ""} attached` : "No reference images — add in Refs tab"}
                      </div>
                    </div>
                    <button onClick={() => setFormSection("refs")} style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}><Camera size={13} /></button>
                  </div>
                  <div style={{ padding: 12, borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Master Identity</div>
                      {masterIdentityImage && (
                        <div style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: radius.full, border: `1px solid rgba(34,197,94,0.25)`, background: "rgba(34,197,94,0.08)", color: "#86efac" }}>
                          Selected
                        </div>
                      )}
                    </div>

                    {masterIdentityImage ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: radius.md, overflow: "hidden", border: `1px solid ${C.accentBorder}`, background: "rgba(255,255,255,0.03)" }}>
                          <img
                            src={masterIdentityImage}
                            alt="Master identity"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6 }}>
                          This approved master portrait will be used as the strongest identity reference for pack generation.
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 }}>
                        Generate 4 close-up identity candidates first, then choose the best one as the master identity.
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerateMasterIdentity}
                        disabled={generatingMaster || !(activeChar?.refEntries?.length || refEntries.length)}
                        style={{
                          height: 38,
                          padding: "0 14px",
                          borderRadius: radius.sm,
                          border: `1px solid ${C.accentBorder}`,
                          background: C.accentSoft,
                          color: "#c4b5fd",
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: generatingMaster ? "default" : "pointer",
                          fontFamily: "inherit",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        {generatingMaster ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                              <Zap size={13} />
                            </motion.div>
                            Generating…
                          </>
                        ) : (
                          <>
                            <Camera size={13} />
                            Generate Master Identity
                          </>
                        )}
                      </motion.button>
                    </div>

                    {masterCandidates.length > 0 && (
                      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>Choose the closest identity:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {masterCandidates.map((candidate, i) => (
                            <div
                              key={candidate.id || i}
                              style={{
                                borderRadius: radius.md,
                                overflow: "hidden",
                                border: `1px solid ${C.border}`,
                                background: "rgba(255,255,255,0.02)",
                              }}
                            >
                              <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden" }}>
                                <img
                                  src={candidate.url}
                                  alt={`Master candidate ${i + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              </div>
                              <div style={{ padding: 8 }}>
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => useMasterIdentity(candidate)}
                                  disabled={savingMaster}
                                  style={{
                                    width: "100%",
                                    height: 32,
                                    borderRadius: 8,
                                    border: `1px solid ${C.accentBorder}`,
                                    background: C.accentSoft,
                                    color: "#c4b5fd",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: savingMaster ? "default" : "pointer",
                                    fontFamily: "inherit",
                                  }}
                                >
                                  Use as Master
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>)}
              </>)}
            </div>

            {formSection === "generate" && activeChar && (
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                <motion.button whileHover={canGenerate ? { boxShadow: "0 18px 40px rgba(124,58,237,0.42)" } : {}} whileTap={canGenerate ? { scale: 0.98 } : {}}
  onClick={handleGenerateCharacterPack} disabled={!canGenerate}
                  style={{ height: 48, width: "100%", borderRadius: radius.md, border: "none",
                    background: canGenerate ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
                    color: canGenerate ? "white" : C.textMuted, cursor: canGenerate ? "pointer" : "default",
                    fontSize: 14.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: canGenerate ? "0 10px 28px rgba(124,58,237,0.28)" : "none" }}>
                  <AnimatePresence mode="wait">
                    {generating
                      ? <motion.span key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 8 }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={16} /></motion.div>Generating…</motion.span>
                      : <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 8 }}><Wand2 size={16} /> Generate Character Pack <ChevronRight size={15} /></motion.span>}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(4,5,12,0.95)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {activeView === "generate" && (<>
              <div style={{ padding: "0 16px", borderBottom: `1px solid ${C.border}`, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                    {activeChar ? `${activeChar.name} — ${charOutputs.length} image${charOutputs.length !== 1 ? "s" : ""}` : "No character selected"}
                  </span>
                  {generating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, fontSize: 11, color: "#c4b5fd" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={10} /></motion.div>
                      Generating…
                    </div>
                  )}
                </div>
                {charOutputs.length > 0 && (
                  <button onClick={deleteAllOutputs}
                    style={{ height: 28, padding: "0 10px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)", color: "#fca5a5", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>

              <div ref={canvasRef} style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

                {!activeChar && (
                  <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                      style={{ textAlign: "center", maxWidth: 380 }}>
                      <div style={{ width: 88, height: 88, borderRadius: 999, margin: "0 auto 22px", display: "grid", placeItems: "center",
                        background: "linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))",
                        border: `1px solid ${C.accentBorder}`, boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
                        <UserCircle2 size={38} color="#a78bfa" />
                      </div>
                      <p style={{ margin: "0 0 8px", color: C.text, fontSize: 20, fontWeight: 800, letterSpacing: "-0.025em" }}>Character Consistency</p>
                      <p style={{ margin: "0 0 32px", color: C.textMuted, fontSize: 13.5, lineHeight: 1.7, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
                        Build characters with locked traits and reference photos for consistent AI generations.
                      </p>
                      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <motion.button whileHover={{ borderColor: C.accentBorder, color: "#c4b5fd", boxShadow: "0 8px 24px rgba(124,58,237,0.18)" }} whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveView("characters")}
                          style={{ height: 46, padding: "0 22px", borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.18s ease" }}>
                          <Users size={15} /> Open Saved Characters
                          {characters.length > 0 && (
                            <span style={{ padding: "1px 7px", borderRadius: radius.full, background: C.accent, color: "white", fontSize: 11, fontWeight: 700 }}>{characters.length}</span>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeChar && charOutputs.length === 0 && !generating && (
                  <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: 300 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto 16px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}><ImageIcon size={28} color={C.textDim} /></div>
                      <p style={{ margin: "0 0 6px", color: C.text, fontSize: 15, fontWeight: 700 }}>Ready to generate</p>
                      <p style={{ margin: "0 0 18px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }}>Generate the fixed 5-view character pack, then use it in the Image section.</p>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFormSection("generate")}
                        style={{ height: 36, padding: "0 16px", borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Wand2 size={13} /> Set up generation
                      </motion.button>
                    </motion.div>
                  </div>
                )}

                {activeChar && charOutputs.length > 0 && !shouldShowGenerateMorePanel && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: outputView === "grid" ? "repeat(auto-fill,minmax(200px,1fr))" : "1fr", gap: 12 }}>
                      {charOutputs.map((item, i) => (
                        outputView === "grid" ? (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <OutputCard
                              item={item}
                              onDelete={() => deleteOutput(item.id)}
                              onOpen={openLightboxForItem}
                            />
                          </motion.div>
                        ) : (
                          <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            onClick={() => item.url && item.url !== "__FAILED__" && openLightboxForItem(item)}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, cursor: item.url && item.url !== "__FAILED__" ? "zoom-in" : "default" }}>
                            <div style={{ width: 52, height: 52, borderRadius: radius.sm, flexShrink: 0, overflow: "hidden", border: `1px solid ${C.border}`, background: CARD_GRADIENTS[getIdNumber(item.id) % CARD_GRADIENTS.length] }}>
                              {item.url && item.url !== "__FAILED__" && <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{item.scene || "Portrait"}</div>
                              <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(item.createdAt).toLocaleString()}</div>
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              {[Download, Trash2].map((Icon, j) => (
                                <button key={j} onClick={e => { e.stopPropagation(); if (j === 1) deleteOutput(item.id); }}
                                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: j === 1 ? "#f87171" : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}>
                                  <Icon size={13} />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )
                      ))}
                    </div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
                      <motion.button whileHover={{ boxShadow: "0 12px 32px rgba(124,58,237,0.35)", borderColor: "#a78bfa" }} whileTap={{ scale: 0.97 }}
                        onClick={sendToImageGen}
                        style={{ height: 44, padding: "0 20px", borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "white", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 20px rgba(124,58,237,0.3)", transition: "all 0.2s ease" }}>
                        <ImageIcon size={15} /> Use This Character in Image <ExternalLink size={12} />
                      </motion.button>
                    </motion.div>
                  </div>
                )}

                {activeChar && shouldShowGenerateMorePanel && (
                  <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 16, alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <OutputCard
                        item={frontOutput}
                        onDelete={() => deleteOutput(frontOutput.id)}
                        onOpen={openLightboxForItem}
                      />
                      <motion.button whileHover={!generating ? { borderColor: C.accentBorder, color: "#c4b5fd" } : {}} whileTap={!generating ? { scale: 0.97 } : {}}
                        onClick={handleGenerateCharacterPack} disabled={generating}
                        style={{ height: 36, borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: generating ? "default" : "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s ease" }}>
                        {generating
                          ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={13} /></motion.div>Regenerating…</>
                          : <><RefreshCw size={13} /> Regenerate</>}
                      </motion.button>
                    </div>
                    <div style={{ borderRadius: radius.lg, border: `1px solid ${C.border}`, background: C.surface, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 280 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10 }}>First profile ready</div>
                      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, maxWidth: 500, marginBottom: 18 }}>
                        Happy with it? Generate the remaining 4 profiles: left profile, right profile, back view, and upper-body close-up.
                      </div>
                      <motion.button whileHover={!generatingMore ? { boxShadow: "0 18px 40px rgba(124,58,237,0.32)" } : {}} whileTap={!generatingMore ? { scale: 0.98 } : {}}
                        onClick={handleGenerateCharacterPack} disabled={generatingMore}
                        style={{ height: 46, padding: "0 18px", borderRadius: radius.md, border: "none", background: !generatingMore ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)", color: !generatingMore ? "white" : C.textMuted, cursor: !generatingMore ? "pointer" : "default", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content", fontFamily: "inherit" }}>
                        {generatingMore
                          ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={15} /></motion.div>Generating Other 4 Profiles...</>
                          : <><Plus size={15} /> Generate Other 4 Profiles</>}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </>)}

            {activeView === "characters" && (<>
              <div style={{ padding: "0 16px", borderBottom: `1px solid ${C.border}`, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{characters.length} character{characters.length !== 1 ? "s" : ""} saved</span>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setFormSection("traits"); setActiveView("generate"); }}
                  style={{ height: 30, padding: "0 12px", borderRadius: 9, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", cursor: "pointer", fontSize: 12, fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                  <Plus size={12} /> New character
                </motion.button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
                {characters.length === 0 ? (
                  <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: 280 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto 16px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}><Users size={28} color={C.textDim} /></div>
                      <p style={{ margin: "0 0 6px", color: C.text, fontSize: 15, fontWeight: 700 }}>No characters yet</p>
                      <p style={{ margin: "0 0 16px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }}>Build your cast by defining characters with traits and references.</p>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setFormSection("traits"); setActiveView("generate"); }}
                        style={{ height: 36, padding: "0 16px", borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Plus size={13} /> Create first character
                      </motion.button>
                    </motion.div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                    {characters.map((char, i) => (
                      <motion.div key={char.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div style={{ position: "relative" }}>
                          <CharacterCard
                            char={char}
                            isActive={char.id === activeCharId}
                            onClick={() => { loadCharacterIntoForm(char); setActiveView("generate"); }}
                            onDelete={() => deleteCharacter(char.id)}
                          />
                          <button onClick={e => { e.stopPropagation(); deleteCharacter(char.id); }}
                            style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 8, border: `1px solid rgba(248,113,113,0.25)`, background: "rgba(248,113,113,0.1)", color: "#f87171", display: "grid", placeItems: "center", cursor: "pointer" }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>)}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxItem(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: radius.xl,
                overflow: "hidden",
                boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
              }}
            >
              <img
                src={lightboxItem.url}
                alt={lightboxItem.scene}
                style={{
                  display: "block",
                  maxWidth: "90vw",
                  maxHeight: "88vh",
                  objectFit: "contain",
                }}
              />

              {orderedVisibleOutputs.length > 1 && (
                <>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={goPrevLightbox}
                    style={{
                      position: "absolute",
                      left: 18,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={goNextLightbox}
                    style={{
                      position: "absolute",
                      right: 18,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                </>
              )}

              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
                {[Download, X].map((Icon, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (i === 0 && lightboxItem?.url) {
                        const a = document.createElement("a");
                        a.href = lightboxItem.url;
                        a.download = `${lightboxItem.scene || "character"}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }
                      if (i === 1) setLightboxItem(null);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={15} />
                  </motion.button>
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)",
                  padding: "40px 20px 18px",
                }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "white" }}>
                  {lightboxItem.scene || "Portrait"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                  {new Date(lightboxItem.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}