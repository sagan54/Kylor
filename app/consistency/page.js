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
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";

// ─── Supabase bucket name ─────────────────────────────────────────────────────
// Create this once in Supabase → Storage → New bucket
// Name: "character-refs"  |  Public: true
const CHAR_BUCKET = "character-refs";

// ─── Tokens ───────────────────────────────────────────────────────────────────
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: "Home",        icon: Compass,      href: "/" },
  { label: "Explore",     icon: Compass,      href: "/explore" },
  { label: "Story",       icon: Clapperboard, href: "/story" },
  { label: "Image",       icon: ImageIcon,    href: "/image" },
  { label: "Video",       icon: Video,        href: "#" },
  { label: "Consistency", icon: UserCircle2,  href: "/consistency", active: true },
  { label: "Motion",      icon: Orbit,        href: "#" },
  { label: "Projects",    icon: FolderKanban, href: "/story" },
  { label: "Settings",    icon: Settings,     href: "#" },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const GENDERS     = ["Female", "Male", "Non-binary", "Unspecified"];
const AGE_RANGE   = ["Teen (13–17)", "Young Adult (18–30)", "Adult (30–50)", "Senior (50+)", "Unspecified"];
const ETHNICITIES = ["Unspecified", "East Asian", "South Asian", "Black / African", "Latino / Hispanic", "Middle Eastern", "White / European", "Mixed"];
const HAIR_STYLES = ["Short", "Medium", "Long", "Curly", "Wavy", "Braided", "Bald", "Ponytail"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "White", "Silver", "Blue", "Pink", "Green"];
const EYE_COLORS  = ["Brown", "Blue", "Green", "Hazel", "Grey", "Amber"];
const BUILD_TYPES = ["Slim", "Athletic", "Average", "Muscular", "Stocky", "Curvy"];
const SCENE_TYPES = [
  "Portrait / Close-up", "Upper body", "Full body standing",
  "Full body action", "Sitting / relaxed", "Walking / moving",
];
const LIGHTING_PRESETS = [
  { id: "cinematic",   label: "Cinematic",   color: "#6366f1" },
  { id: "golden_hour", label: "Golden Hour", color: "#f59e0b" },
  { id: "dramatic",    label: "Dramatic",    color: "#ef4444" },
  { id: "soft_studio", label: "Soft Studio", color: "#14b8a6" },
  { id: "neon",        label: "Neon Glow",   color: "#a855f7" },
  { id: "natural",     label: "Natural",     color: "#84cc16" },
];
const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(124,58,237,0.3))",
  "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(17,17,34,0.85))",
  "linear-gradient(135deg, rgba(49,46,129,0.65), rgba(79,70,229,0.35))",
  "linear-gradient(135deg, rgba(91,33,182,0.55), rgba(55,48,163,0.4))",
  "linear-gradient(135deg, rgba(67,56,202,0.6), rgba(124,58,237,0.3))",
];
const CHARACTER_PACK_VIEWS = [
  {
    key: "front",
    label: "Front Full-Body",
    shot: "single person, front-facing, full-body, standing straight, arms relaxed, centered composition",
    size: "1024x1536",
  },
  {
    key: "left",
    label: "Left Profile Full-Body",
    shot: "single person, strict left side profile, facing the left edge of the frame, full-body, standing straight, arms relaxed, centered composition",
    size: "1024x1536",
  },
  {
    key: "right",
    label: "Right Profile Full-Body",
    shot: "single person, strict right side profile, facing the right edge of the frame, full-body, standing straight, arms relaxed, centered composition",
    size: "1024x1536",
  },
  {
    key: "back",
    label: "Back Full-Body",
    shot: "single person, full-body back view, facing away from camera, standing straight, arms relaxed, centered composition",
    size: "1024x1536",
  },
  {
    key: "closeup",
    label: "Upper-Body Close-Up",
    shot: "single person, upper-body close-up portrait, facing camera, centered composition",
    size: "1024x1024",
  },
];




// ─── Helper: file → base64 ────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Helper: stable numeric index from id ─────────────────────────────────────
function getIdNumber(id) {
  const s = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ─── Helper: traits metadata serialization ────────────────────────────────────
function buildTraitsPayload({
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
}) {
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
    const parsed = JSON.parse(value || "{}");
    return {
      charDesc: parsed.charDesc || "",
      gender: parsed.gender || "",
      ageRange: parsed.ageRange || "",
      ethnicity: parsed.ethnicity || "",
      hairStyle: parsed.hairStyle || "",
      hairColor: parsed.hairColor || "",
      eyeColor: parsed.eyeColor || "",
      build: parsed.build || "",
      charLocked: !!parsed.charLocked,
      extraPrompt: parsed.extraPrompt || "",
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


// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{ display: "grid", justifyItems: "center", gap: "6px", padding: "10px 6px",
        borderRadius: radius.lg,
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
  return item.href === "#" ? <div>{inner}</div>
    : <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
}

// ─── Custom Select ────────────────────────────────────────────────────────────
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
          justifyContent: "space-between", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit",
          transition: "all 0.15s ease" }}>
        <span>{value || label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={13} color={C.textMuted} />
        </motion.div>
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
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "background 0.12s ease" }}
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

// ─── Ref Image Upload Zone ─────────────────────────────────────────────────────
function RefUpload({ entries, onEntries, label, hint, max = 5 }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  function addFiles(fileList) {
    const valid = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    onEntries(prev => {
      const slots = max - prev.length;
      if (slots <= 0) return prev;
      const newEntries = valid.slice(0, slots).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...newEntries];
    });
  }

  function removeEntry(i) {
    onEntries(prev => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, j) => j !== i);
    });
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    addFiles(e.dataTransfer.files);
  }, [onEntries, max]);

  const onInputChange = useCallback(e => {
    const captured = Array.from(e.target.files || []);
    e.target.value = "";
    if (captured.length) addFiles(captured);
  }, [onEntries, max]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <motion.div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        animate={{ borderColor: drag ? C.accent : "rgba(255,255,255,0.09)", background: drag ? C.accentSoft : C.surface }}
        style={{ borderRadius: radius.md, border: "1.5px dashed rgba(255,255,255,0.09)", padding: "14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={onInputChange} />
        <div style={{ width: 36, height: 36, borderRadius: radius.sm, flexShrink: 0,
          background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center" }}>
          <Camera size={14} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{hint}</div>
        </div>
        <div style={{ fontSize: 11.5, color: entries.length > 0 ? "#a78bfa" : C.textDim, fontWeight: 600 }}>
          {entries.length}/{max}
        </div>
      </motion.div>

      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {entries.map((entry, i) => (
            <motion.div key={entry.previewUrl}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{ position: "relative", width: 52, height: 52, borderRadius: 9,
                overflow: "hidden", border: `1.5px solid ${C.accentBorder}`, flexShrink: 0 }}>
              <img src={entry.previewUrl} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button
                onClick={e => { e.stopPropagation(); removeEntry(i); }}
                style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 999,
                  background: "rgba(0,0,0,0.8)", border: "none", color: "white",
                  display: "grid", placeItems: "center", cursor: "pointer" }}>
                <X size={9} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Character Card ──────────────────────────────────────────────────────────
function CharacterCard({ char, isActive, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const gradient = CARD_GRADIENTS[getIdNumber(char.id) % CARD_GRADIENTS.length];
  return (
    <motion.div whileHover={{ y: -2 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{ borderRadius: radius.lg, border: `1px solid ${isActive ? C.accentBorder : hovered ? C.borderHover : C.border}`,
        background: isActive ? "rgba(124,58,237,0.06)" : C.surface, cursor: "pointer",
        overflow: "hidden", transition: "all 0.18s ease",
        boxShadow: isActive ? `0 0 0 1px rgba(124,58,237,0.12) inset` : "none" }}>
      <div style={{ height: 80, background: gradient, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.05),transparent)" }} />
        {char.refEntries.length > 0 ? (
          <img src={char.refEntries[0].previewUrl} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <User size={28} color="rgba(255,255,255,0.25)" />
          </div>
        )}
        {isActive && (
          <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 999,
            background: C.accent, display: "grid", placeItems: "center" }}>
            <Check size={10} color="white" />
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{char.name || "Unnamed"}</div>
        <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {[char.gender, char.ageRange, char.ethnicity].filter(Boolean).join(" · ") || "No traits set"}
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full,
            border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.04)", color: C.textMuted }}>
            {char.generations} images
          </div>
          {char.refEntries.length > 0 && (
            <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full,
              border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd" }}>
              {char.refEntries.length} ref{char.refEntries.length > 1 ? "s" : ""}
            </div>
          )}
          {char.locked && (
            <div style={{ fontSize: 10.5, padding: "2px 7px", borderRadius: radius.full,
              border: `1px solid rgba(34,197,94,0.25)`, background: "rgba(34,197,94,0.08)", color: "#86efac" }}>
              Locked
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Generation Output Card ───────────────────────────────────────────────────
function OutputCard({ item, onDelete, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => item.url && onOpen?.(item)}
      style={{ borderRadius: radius.lg, border: `1px solid ${hovered ? C.borderHover : C.border}`,
        overflow: "hidden", cursor: item.url ? "zoom-in" : "default", position: "relative",
        background: CARD_GRADIENTS[getIdNumber(item.id) % CARD_GRADIENTS.length],
        aspectRatio: "2/3", transition: "border-color 0.16s ease" }}>
      {item.url && item.url !== "__FAILED__" ? (
  <img
    src={item.url}
    alt={item.scene}
    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
  />
) : item.url === "__FAILED__" ? (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>Failed</div>
      <div style={{ fontSize: 11.5, color: C.textMuted }}>{item.scene}</div>
    </div>
  </div>
) : (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      style={{ width: 32, height: 32, borderRadius: 999, border: `2px solid ${C.accent}`, borderTopColor: "transparent" }}
    />
  </div>
)}

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.04),transparent 50%)", pointerEvents: "none" }} />
      <AnimatePresence>
        {hovered && item.url && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent 55%)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
              {[Download, Share2, Trash2].map((Icon, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); if (i === 2) onDelete?.(); }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid rgba(255,255,255,0.14)`,
                    background: "rgba(0,0,0,0.55)", color: i === 2 ? "#f87171" : "white",
                    display: "grid", placeItems: "center", cursor: "pointer" }}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConsistencyPage() {
  
  function autoResizeTextarea(e) {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}


  const router = useRouter();

  const [activeView,   setActiveView]   = useState("generate");
  const [outputView,   setOutputView]   = useState("grid");
  const [characters,   setCharacters]   = useState([]);
  const [activeCharId, setActiveCharId] = useState(null);
  const [generatingMore, setGeneratingMore] = useState(false);


  // Character form
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

  // Generation
  const [extraPrompt, setExtraPrompt] = useState("");
  const charLimit = 1000;

  const [outputs,     setOutputs]     = useState([]);
  const [generating,  setGenerating]  = useState(false);
  const [formSection, setFormSection] = useState("traits");
  const [lightboxItem, setLightboxItem] = useState(null);

  // Supabase
  const [userId,  setUserId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const canvasRef = useRef(null);

  const activeChar = characters.find(c => c.id === activeCharId) || null;
const charOutputs = outputs.filter(o => o.charId === activeCharId);

const visibleCharOutputs = charOutputs.filter(o => o.url !== "__FAILED__");

const frontOutput = visibleCharOutputs.find(
  o => o.scene === "Front Full-Body"
);

const otherOutputs = visibleCharOutputs.filter(
  o => o.scene !== "Front Full-Body"
);

const hasOnlyFront = !!frontOutput && otherOutputs.length === 0;



  // ── Sync refEntries form state → active character in real-time ────────────
  useEffect(() => {
    if (!activeCharId) return;
    setCharacters(p => p.map(c =>
      c.id === activeCharId ? { ...c, refEntries } : c
    ));
  }, [refEntries, activeCharId]);

  // ── Load characters from Supabase on mount ────────────────────────────────
  useEffect(() => {
    (async () => {
      const {
  data: { user },
} = await supabase.auth.getUser();

const uid = user?.id ?? null;

      setUserId(uid);
      if (!uid) return;

      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const loaded = data.map(row => {
          const traits = parseTraitsPayload(row.prompt);
          const generatedImages = Array.isArray(row.generated_images) ? row.generated_images : [];
          const refUrls = row.reference_image ? [row.reference_image] : [];

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
            refEntries: refUrls.map(url => ({ file: null, previewUrl: url })),
          };
        });

       const loadedOutputs = loaded.flatMap(char =>
  (char.generatedImages || []).map((url, i) => ({
    id: `${char.id}-${CHARACTER_PACK_VIEWS[i]?.key || i}`,
    charId: char.id,
    prompt: "",
    scene: CHARACTER_PACK_VIEWS[i]?.label || `View ${i + 1}`,
    url,
    createdAt: char.createdAt || new Date().toISOString(),
  }))
);


        setCharacters(loaded);
        setOutputs(loadedOutputs);
        setActiveCharId(loaded[0].id);
      }
    })();
  }, []);

  // ── Save character ────────────────────────────────────────────────────────
  async function saveCharacter() {
  if (!charName.trim()) return;

  if (!userId) {
    alert("Please log in first to save characters.");
    return;
  }

  setSaving(true);

  try {
    let refUrls = [];

    if (refEntries.length > 0) {
      const uploads = await Promise.all(
        refEntries.map(async (entry, i) => {
          if (!entry.file) return entry.previewUrl;

          try {
            const ext =
              entry.file.type === "image/webp"
                ? "webp"
                : entry.file.type === "image/jpeg"
                ? "jpg"
                : "png";

            const path = `${userId}/${Date.now()}-ref${i}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from(CHAR_BUCKET)
              .upload(path, entry.file, {
                contentType: entry.file.type,
                upsert: true,
              });

            if (uploadError) {
              console.error("Ref upload failed:", uploadError);
              return null;
            }

            const { data: publicUrlData } = supabase.storage
              .from(CHAR_BUCKET)
              .getPublicUrl(path);

            return publicUrlData?.publicUrl ?? null;
          } catch (err) {
            console.error("Ref upload exception:", err);
            return null;
          }
        })
      );

      refUrls = uploads.filter(Boolean);
    }

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


    const insertPayload = {
      user_id: userId,
      name: charName.trim(),
      description: charDesc.trim(),
      prompt: promptPayload,
      reference_image: refUrls[0] || null,
      generated_images: [],
      cover_image: refUrls[0] || null,
      style: null,
      seed: null,
    };

    console.log("Saving character payload:", insertPayload);

    const { data, error } = await supabase
      .from("characters")
      .insert([insertPayload])
      .select()
      .single();

    if (error || !data) {
      console.error("Character save failed:", error);
      alert(`Failed to save character: ${error?.message || "Unknown error"}`);
      setSaving(false);
      return;
    }

    const newChar = {
      id: data.id,
      name: charName.trim(),
      desc: charDesc.trim(),
      gender,
      ageRange,
      ethnicity,
      hairStyle,
      hairColor,
      eyeColor,
      build,
      refEntries: refUrls.map(url => ({ file: null, previewUrl: url })),
      locked: charLocked,
      generations: 0,
      generatedImages: [],
      style: null,
      extraPrompt: extraPrompt || "",
      createdAt: data.created_at,
    };

    setCharacters(prev => [newChar, ...prev]);
    setActiveCharId(data.id);

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

    setFormSection("generate");
    setActiveView("characters");
  } catch (err) {
    console.error("Save character exception:", err);
    alert("Failed to save character.");
  } finally {
    setSaving(false);
  }
}



  // ── Delete character ──────────────────────────────────────────────────────
  async function deleteCharacter(id) {
    setCharacters(p => p.filter(c => c.id !== id));
    setOutputs(p => p.filter(o => o.charId !== id));

    if (activeCharId === id) {
      const nextChar = characters.find(c => c.id !== id);
      setActiveCharId(nextChar?.id ?? null);
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
    setRefEntries([...char.refEntries]);
    setCharLocked(char.locked);
    setExtraPrompt(char.extraPrompt || "");
    setActiveCharId(char.id);
    setFormSection("generate");
  }

  // ── Send to Image Gen ─────────────────────────────────────────────────────
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
    traitDesc ? `same identity and physical traits: ${traitDesc}` : null,
    activeChar.desc || null,
    activeChar.refEntries.length > 0
      ? `Maintain exact facial features, skin tone, and distinguishing characteristics of this specific person.`
      : null,
  ].filter(Boolean).join(". ");

  try {
    sessionStorage.setItem("kylor_selected_character_id", String(activeChar.id));
    sessionStorage.setItem("kylor_prefill_prompt", charPrompt);
  } catch {}

  router.push("/image");
}


  // ── Generate ──────────────────────────────────────────────────────────────
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
      shot: "single person, left side profile, full-body, facing left, standing straight, arms relaxed, centered composition",
      size: "1024x1536",
    },
    {
      key: "right",
      label: "Right Profile Full-Body",
      shot: "single person, right side profile, full-body, facing right, standing straight, arms relaxed, centered composition",
      size: "1024x1536",
    },
    {
      key: "back",
      label: "Back Full-Body",
      shot: "single person, back view, full-body, standing straight, arms relaxed, centered composition",
      size: "1024x1536",
    },
    {
      key: "close",
      label: "Upper-Body Close-Up",
      shot: "single person, upper body portrait, facing camera, shoulders visible, neutral expression",
      size: "1024x1024",
    },
  ];

  const traitDesc = [
    activeChar.gender,
    activeChar.ageRange,
    activeChar.ethnicity,
    activeChar.hairColor && activeChar.hairStyle
      ? `${activeChar.hairColor} ${activeChar.hairStyle} hair`
      : null,
    activeChar.eyeColor ? `${activeChar.eyeColor} eyes` : null,
    activeChar.build ? `${activeChar.build} build` : null,
  ]
    .filter(Boolean)
    .join(", ");

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
        ...prev.filter(
          o => !(o.charId === activeCharId && o.scene === view.label)
        ),
        placeholder,
      ]);

      const finalPrompt = [
        `This is the same exact character named ${activeChar.name}. Preserve the same identity, face, hairstyle, outfit, body type, and proportions.`,
        traitDesc ? `Physical traits: ${traitDesc}.` : null,
        activeChar.desc ? `Character details: ${activeChar.desc}.` : null,
        extraPrompt.trim()
          ? `Additional fixed details: ${extraPrompt.trim()}.`
          : null,
        `View requirement: ${view.shot}.`,
        "Plain neutral studio background.",
        "Exactly one person only.",
        "No collage.",
        "No multiple people.",
        "No split screen.",
        "No character sheet.",
        "No text.",
        "No watermark.",
      ]
        .filter(Boolean)
        .join(" ");

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          size: view.size,
          n: 1,
          characterSeed: String(activeChar.id),
        }),
      });

      const data = await res.json();

      const url = Array.isArray(data?.images)
        ? data.images[0]
        : data?.image ?? null;

      setOutputs(prev =>
        prev.map(o =>
          o.id === placeholder.id ? { ...o, url: url || "__FAILED__" } : o
        )
      );

      if (url) {
        const updatedImages = [
          ...(activeChar.generatedImages || []).filter(Boolean),
          url,
        ];

        await supabase
          .from("characters")
          .update({
            generated_images: updatedImages,
          })
          .eq("id", activeCharId)
          .eq("user_id", userId);
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
  setGenerating(true);

  const frontView = CHARACTER_PACK_VIEWS[0];

  const traitDesc = [
    activeChar.gender,
    activeChar.ageRange,
    activeChar.ethnicity,
    activeChar.hairColor && activeChar.hairStyle ? `${activeChar.hairColor} ${activeChar.hairStyle} hair` : null,
    activeChar.eyeColor ? `${activeChar.eyeColor} eyes` : null,
    activeChar.build ? `${activeChar.build} build` : null,
  ].filter(Boolean).join(", ");

  const effectiveRefs = activeChar.refEntries.length > 0 ? activeChar.refEntries : refEntries;
  const hasRefs = effectiveRefs.length > 0;

  const createdAt = new Date().toISOString();

  const frontOutput = {
    id: `${activeCharId}-${frontView.key}-${Date.now()}`,
    charId: activeCharId,
    prompt: frontView.shot,
    scene: frontView.label,
    url: null,
    createdAt,
  };

  setOutputs(prev => {
  const withoutCurrentChar = prev.filter(o => o.charId !== activeCharId);
  return [frontOutput, ...withoutCurrentChar];
});

  canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const uploadedRefs = hasRefs
      ? (await Promise.all(
          effectiveRefs.map(async e => {
            if (e.file) return fileToBase64(e.file);
            if (e.previewUrl) return e.previewUrl;
            return null;
          })
        )).filter(Boolean)
      : [];

    const finalPrompt = [
      hasRefs
        ? `This is the same exact real person named ${activeChar.name}. Preserve the exact same identity, facial structure, skin tone, hairstyle, and proportions.`
        : `This is the same exact character named ${activeChar.name}. Preserve the exact same identity, face, hairstyle, outfit, body type, and proportions.`,
      traitDesc ? `Physical traits: ${traitDesc}.` : null,
      activeChar.desc ? `Character details: ${activeChar.desc}.` : null,
      extraPrompt.trim() ? `Additional fixed details: ${extraPrompt.trim()}.` : null,
      `View requirement: ${frontView.shot}.`,
      "Plain light studio background.",
      "Neutral reference photo style.",
      "Exactly one person only.",
      "No duplicate person.",
      "No collage.",
      "No split screen.",
      "No multiple angles in one image.",
      "No character sheet.",
      "No contact sheet.",
      "No grid layout.",
      "No text.",
      "No watermark.",
    ].filter(Boolean).join(" ");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    let data = null;

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: finalPrompt,
          size: frontView.size,
          n: 1,
          referenceImages: uploadedRefs,
          characterSeed: String(activeChar.id),
          
          
        }),
      });

      data = await res.json();
    } finally {
      clearTimeout(timeout);
    }

    const url = Array.isArray(data?.images) ? data.images[0] : data?.image ?? null;

    setOutputs(prev =>
      prev.map(o =>
        o.id === frontOutput.id ? { ...o, url: url || "__FAILED__" } : o
      )
    );

    if (url) {
      const updatedChar = {
        ...activeChar,
        generations: 1,
        generatedImages: [url],
        extraPrompt: extraPrompt || activeChar.extraPrompt || "",
      };

      setCharacters(prev =>
        prev.map(c => (c.id === activeCharId ? updatedChar : c))
      );

      if (userId && !String(activeCharId).startsWith("local-")) {
        await supabase
          .from("characters")
          .update({
            generated_images: [url],
            cover_image: url,
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
          })
          .eq("id", activeCharId)
          .eq("user_id", userId);
      }
    }
  } catch (err) {
    console.error("Generate first image failed:", err);
    setOutputs(prev =>
      prev.map(o =>
        o.id === frontOutput.id ? { ...o, url: "__FAILED__" } : o
      )
    );
  } finally {
    setGenerating(false);
  }
}



  const canGenerate = !!activeChar && !generating;

  return (
    <main style={{
      height: "100vh", overflow: "hidden",
      background: `radial-gradient(ellipse at 8% 12%,rgba(79,70,229,0.13),transparent 28%),radial-gradient(ellipse at 92% 8%,rgba(124,58,237,0.11),transparent 30%),${C.bg}`,
      color: C.text, fontFamily: "'Inter','SF Pro Display',sans-serif",
      display: "grid", gridTemplateColumns: "88px 1fr",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{ borderRight: `1px solid ${C.border}`, background: C.sidebar,
        padding: "18px 10px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ width: 46, height: 46, borderRadius: 16, margin: "0 auto 22px",
          display: "grid", placeItems: "center",
          background: "linear-gradient(135deg,rgba(79,70,229,0.28),rgba(124,58,237,0.18))",
          border: `1px solid ${C.border}`, boxShadow: `0 0 20px ${C.accentGlow}` }}>
          <Sparkles size={20} color="#a78bfa" />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {SIDEBAR_ITEMS.map(item => <SidebarItem key={item.label} item={item} />)}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ display: "grid", gridTemplateRows: "48px 1fr", height: "100vh", overflow: "hidden" }}>

        {/* ── Top Nav ── */}
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 18px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ height: 30, padding: "0 12px", borderRadius: radius.full,
              border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
              fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Character Consistency
            </div>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 2px" }} />
            {[
              { label: "Generate",   id: "generate",   icon: Wand2 },
              { label: "Characters", id: "characters", icon: Users },
            ].map(({ label, id, icon: Icon }) => (
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
{activeChar && (
  <motion.button
    whileHover={charOutputs.length > 0 ? { borderColor: C.accentBorder } : {}}
    whileTap={charOutputs.length > 0 ? { scale: 0.96 } : {}}
    onClick={sendToImageGen}
    disabled={charOutputs.length === 0}
    style={{ height: 34, padding: "0 14px", borderRadius: radius.sm,
      border: `1px solid ${charOutputs.length > 0 ? C.accentBorder : C.border}`,
      background: charOutputs.length > 0 ? C.accentSoft : C.surface,
      color: charOutputs.length > 0 ? "#c4b5fd" : C.textMuted,
      display: "inline-flex", alignItems: "center", gap: 6,
      cursor: charOutputs.length > 0 ? "pointer" : "default",
      fontSize: 12.5, fontFamily: "inherit", transition: "all 0.15s ease",
      opacity: charOutputs.length > 0 ? 1 : 0.7 }}>
    <ImageIcon size={13} /> Use This Character in Image <ExternalLink size={11} />
  </motion.button>
)}

            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
              <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setOutputView(val)}
                style={{ width: 34, height: 34, borderRadius: radius.sm, border: `1px solid ${C.border}`,
                  background: outputView === val ? "rgba(255,255,255,0.08)" : "transparent",
                  color: outputView === val ? C.text : C.textMuted, display: "grid", placeItems: "center",
                  cursor: "pointer", transition: "all 0.15s ease" }}>
                <Icon size={15} />
              </motion.button>
            ))}
            <motion.button whileHover={{ borderColor: C.borderHover }}
              style={{ height: 34, padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`,
                background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex",
                alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
              <Folder size={13} /> Assets
            </motion.button>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "100%", overflow: "hidden" }}>

          {/* ══ LEFT PANEL ══ */}
          <div style={{ borderRight: `1px solid ${C.border}`,
            background: "linear-gradient(180deg,rgba(7,9,15,0.98),rgba(9,11,17,0.98))",
            height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

            {/* Section tabs */}
            <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: 4,
                borderRadius: radius.md, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                {[
                  { id: "traits",   label: "Traits",   icon: Sliders },
                  { id: "refs",     label: "Refs",     icon: Camera },
                  { id: "generate", label: "Generate", icon: Sparkles },
                ].map(({ id, label, icon: Icon }) => {
                  const active = formSection === id;
                  return (
                    <motion.button key={id} whileTap={{ scale: 0.96 }} onClick={() => setFormSection(id)}
                      style={{ height: 34, borderRadius: radius.sm,
                        border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
                        background: active ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.13))" : "transparent",
                        color: active ? "white" : C.textMuted, fontSize: 12, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.15s ease",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon size={11} /> {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Heading */}
            <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
              <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13.5, position: "relative",
                    display: "inline-block", paddingBottom: 4 }}>
                    {formSection === "traits" ? "Character Traits" : formSection === "refs" ? "Reference Images" : "Generate"}
                    <span style={{ position: "absolute", left: 0, bottom: -13, width: "100%", height: 2,
                      borderRadius: radius.full, background: `linear-gradient(90deg,${C.indigo},${C.accent})` }} />
                  </div>
                  {activeChar && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px",
                      borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft,
                      fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>
                      <User size={9} /> {activeChar.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable form area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }}>

              {/* ── TRAITS ── */}
              {formSection === "traits" && (<>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Character Name *</div>
                  <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Aria Voss, Marcus Kane…"
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: radius.sm,
                      border: `1px solid ${charName ? C.accentBorder : C.border}`, background: charName ? C.accentSoft : C.surface,
                      color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "all 0.16s ease" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Description</div>
                  <textarea value={charDesc} onChange={e => setCharDesc(e.target.value)} rows={3}
                    placeholder="Scar above left eyebrow, always wears a silver necklace…"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: radius.sm,
                      border: `1px solid ${C.border}`, background: C.surface, color: C.text, resize: "none",
                      fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }} />
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
                  style={{ height: 36, padding: "0 14px", borderRadius: radius.sm, cursor: "pointer",
                    border: `1px solid ${charLocked ? "rgba(34,197,94,0.3)" : C.border}`,
                    background: charLocked ? "rgba(34,197,94,0.08)" : C.surface,
                    color: charLocked ? "#86efac" : C.textMuted, fontSize: 12.5, fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s ease" }}>
                  {charLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  {charLocked ? "Character locked (consistent)" : "Lock character traits"}
                </motion.button>

                {/* ── Save Character Button ── */}
                <motion.button
                  whileHover={charName.trim() && !saving ? { boxShadow: "0 12px 32px rgba(124,58,237,0.35)" } : {}}
                  whileTap={charName.trim() && !saving ? { scale: 0.98 } : {}}
                  onClick={saveCharacter}
                  disabled={saving || !charName.trim()}
                  style={{ height: 44, borderRadius: radius.md, border: "none",
                    cursor: charName.trim() && !saving ? "pointer" : "default",
                    background: charName.trim() && !saving ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
                    color: charName.trim() && !saving ? "white" : C.textMuted,
                    fontSize: 13.5, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: charName.trim() && !saving ? "0 8px 24px rgba(124,58,237,0.25)" : "none" }}>
                  {saving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Zap size={15} />
                      </motion.div>
                      Saving…
                    </>
                  ) : (
                    <><User size={15} /> Save Character</>
                  )}
                </motion.button>
              </>)}

              {/* ── REFS ── */}
              {formSection === "refs" && (<>
                <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.65 }}>
                  Upload reference photos of the character. More consistent references = more accurate generations.
                </p>

                <RefUpload
                  entries={refEntries}
                  onEntries={setRefEntries}
                  label="Face references"
                  hint="Clear, front-facing photos · best results"
                  max={5}
                />

                {refEntries.length > 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: radius.sm,
                    border: `1px solid rgba(34,197,94,0.25)`, background: "rgba(34,197,94,0.06)",
                    display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#86efac" }}>
                    <Check size={13} />
                    {refEntries.length} reference image{refEntries.length > 1 ? "s" : ""} ready — will be saved with character.
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
                    style={{ height: 40, borderRadius: radius.md, border: `1px solid ${C.accentBorder}`,
                      background: C.accentSoft, color: "#c4b5fd", fontSize: 13, fontWeight: 600,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                      cursor: "pointer", fontFamily: "inherit" }}>
                    <ChevronRight size={13} /> Continue to Generate
                  </motion.button>
                )}
              </>)}

              {/* ── GENERATE ── */}
              {formSection === "generate" && (<>
                {!activeChar && (
                  <div style={{ padding: 20, borderRadius: radius.md, border: `1px solid ${C.border}`,
                    background: C.surface, textAlign: "center" }}>
                    <User size={32} color={C.textDim} style={{ margin: "0 auto 12px" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>No character selected</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, lineHeight: 1.6 }}>Create a character first, or select one from the Characters view.</div>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFormSection("traits")}
                      style={{ height: 34, padding: "0 14px", borderRadius: radius.sm,
                        border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
                        fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Plus size={12} /> Create character
                    </motion.button>
                  </div>
                )}

                {activeChar && (<>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Reference Notes
</div>
                    <div style={{ position: "relative" }}>
                      <textarea
  value={extraPrompt}
  onChange={e => {
    setExtraPrompt(e.target.value.slice(0, charLimit));
    autoResizeTextarea(e);
  }}
  onInput={autoResizeTextarea}
  placeholder="outfit details, facial details, accessories, exact look notes…"
  rows={1}
  style={{
    width: "100%",
    minHeight: 110,
    padding: "10px 12px",
    borderRadius: radius.md,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    resize: "none",
    overflow: "hidden",
    fontSize: 12.5,
    fontFamily: "inherit",
    lineHeight: 1.6,
    outline: "none",
    boxSizing: "border-box",
  }}
/>

                      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10.5,
                        color: extraPrompt.length > charLimit * 0.9 ? "#f87171" : C.textDim }}>
                        {extraPrompt.length}/{charLimit}
                      </div>
                    </div>
                  </div>

                  {/* Char summary pill */}
                  <div style={{ padding: "10px 12px", borderRadius: radius.sm, border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, overflow: "hidden", flexShrink: 0,
                      background: CARD_GRADIENTS[getIdNumber(activeChar.id) % CARD_GRADIENTS.length], display: "grid", placeItems: "center" }}>
                      {activeChar.refEntries.length > 0
                        ? <img src={activeChar.refEntries[0].previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <User size={14} color="rgba(255,255,255,0.4)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{activeChar.name}</div>
                      <div style={{ fontSize: 11, color: activeChar.refEntries.length > 0 ? "#86efac" : C.textMuted }}>
                        {activeChar.refEntries.length > 0
                          ? `${activeChar.refEntries.length} ref image${activeChar.refEntries.length > 1 ? "s" : ""} attached`
                          : "No reference images — add in Refs tab"}
                      </div>
                    </div>
                    <button onClick={() => setFormSection("refs")}
                      style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Camera size={13} />
                    </button>
                  </div>
                </>)}
              </>)}
            </div>

            {/* Generate button — pinned at bottom */}
            {formSection === "generate" && activeChar && (
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                <motion.button
                  whileHover={canGenerate ? { boxShadow: "0 18px 40px rgba(124,58,237,0.42)" } : {}}
                  whileTap={canGenerate ? { scale: 0.98 } : {}}
                  onClick={handleGenerate} disabled={!canGenerate}
                  style={{ height: 48, width: "100%", borderRadius: radius.md, border: "none",
                    background: canGenerate ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
                    color: canGenerate ? "white" : C.textMuted, cursor: canGenerate ? "pointer" : "default",
                    fontSize: 14.5, fontWeight: 700, display: "inline-flex", alignItems: "center",
                    justifyContent: "center", gap: 9, fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: canGenerate ? "0 10px 28px rgba(124,58,237,0.28)" : "none" }}>
                  <AnimatePresence mode="wait">
                    {generating ? (
                      <motion.span key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={16} /></motion.div>
                        Generating…
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 8 }}>
                       <Wand2 size={16} /> Generate Character Pack <ChevronRight size={15} />

                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div style={{ background: "rgba(4,5,12,0.95)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {/* ── GENERATE VIEW ── */}
            {activeView === "generate" && (
              <>
                <div style={{ padding: "0 16px", borderBottom: `1px solid ${C.border}`, height: 48,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                      {activeChar ? `${activeChar.name} — ${charOutputs.length} image${charOutputs.length !== 1 ? "s" : ""}` : "No character selected"}
                    </span>
                    {generating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 9px",
                        borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft,
                        fontSize: 11, color: "#c4b5fd" }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                          <Zap size={10} />
                        </motion.div>
                        Generating…
                      </div>
                    )}
                  </div>
                  {charOutputs.length > 0 && (
                    <button onClick={() => setOutputs(p => p.filter(o => o.charId !== activeCharId))}
                      style={{ height: 28, padding: "0 10px", borderRadius: 8,
                        border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.07)",
                        color: "#fca5a5", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit",
                        display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>

                <div ref={canvasRef} style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                  {!activeChar && (
                    <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: "center", maxWidth: 320 }}>
                        <div style={{ width: 80, height: 80, borderRadius: 999, margin: "0 auto 20px",
                          display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <UserCircle2 size={36} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 8px", color: C.text, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>No character yet</p>
                        <p style={{ margin: "0 0 22px", color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                          Create a character with traits and reference images, then generate consistent outputs.
                        </p>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setFormSection("traits"); }}
                          style={{ height: 40, padding: "0 20px", borderRadius: radius.md,
                            border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
                            fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                            display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <Plus size={14} /> Create your first character
                        </motion.button>
                      </motion.div>
                    </div>
                  )}

                  {activeChar && charOutputs.length === 0 && !generating && (
                    <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: "center", maxWidth: 300 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto 16px",
                          display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <ImageIcon size={28} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 6px", color: C.text, fontSize: 15, fontWeight: 700 }}>Ready to generate</p>
                        <p style={{ margin: "0 0 18px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }}>
                          Generate the fixed 5-view character pack, then use it in the Image section.


                        </p>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setFormSection("generate")}
                          style={{ height: 36, padding: "0 16px", borderRadius: radius.md,
                            border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
                            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                            display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Wand2 size={13} /> Set up generation
                        </motion.button>
                      </motion.div>
                    </div>
                  )}

                  {activeChar && charOutputs.length > 0 && !hasOnlyFront && (
  <div style={{ display: "grid", gridTemplateColumns: outputView === "grid" ? "repeat(auto-fill,minmax(200px,1fr))" : "1fr", gap: 12 }}>
    {charOutputs.map((item, i) => (
      outputView === "grid" ? (
        <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <OutputCard
            item={item}
            onDelete={() => setOutputs(p => p.filter(o => o.id !== item.id))}
            onOpen={setLightboxItem}
          />
        </motion.div>
      ) : (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => item.url && item.url !== "__FAILED__" && setLightboxItem(item)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 14px",
            borderRadius: radius.md,
            border: `1px solid ${C.border}`,
            background: C.surface,
            cursor: item.url && item.url !== "__FAILED__" ? "zoom-in" : "default",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.sm,
              flexShrink: 0,
              overflow: "hidden",
              border: `1px solid ${C.border}`,
              background: CARD_GRADIENTS[getIdNumber(item.id) % CARD_GRADIENTS.length],
            }}
          >
            {item.url && item.url !== "__FAILED__" && (
              <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
              {item.scene || "Portrait"}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted }}>
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>

          <div style={{ display: "flex", gap: 5 }}>
            {[Download, Trash2].map((Icon, j) => (
              <button
                key={j}
                onClick={e => {
                  e.stopPropagation();
                  if (j === 1) setOutputs(p => p.filter(o => o.id !== item.id));
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: j === 1 ? "#f87171" : C.textMuted,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </motion.div>
      )
    ))}
  </div>
)}

{activeChar && hasOnlyFront && (
  <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 16, alignItems: "stretch" }}>
    <div>
      <OutputCard
        item={frontOutput}
        onDelete={() => setOutputs(p => p.filter(o => o.id !== frontOutput.id))}
        onOpen={setLightboxItem}
      />
    </div>

    <div
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${C.border}`,
        background: C.surface,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 280,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10 }}>
        First profile ready
      </div>

      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, maxWidth: 500, marginBottom: 18 }}>
        Generate the remaining 4 profiles for this character: left profile, right profile, back view, and upper-body close-up.
      </div>

      <motion.button
        whileHover={!generatingMore ? { boxShadow: "0 18px 40px rgba(124,58,237,0.32)" } : {}}
        whileTap={!generatingMore ? { scale: 0.98 } : {}}
        onClick={generateOtherProfiles}
        disabled={generatingMore}
        style={{
          height: 46,
          padding: "0 18px",
          borderRadius: radius.md,
          border: "none",
          background: !generatingMore ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
          color: !generatingMore ? "white" : C.textMuted,
          cursor: !generatingMore ? "pointer" : "default",
          fontSize: 14,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          width: "fit-content",
          fontFamily: "inherit",
        }}
      >
        {generatingMore ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Zap size={15} />
            </motion.div>
            Generating Other 4 Profiles...
          </>
        ) : (
          <>
            <Plus size={15} />
            Generate Other 4 Profiles
          </>
        )}
      </motion.button>
    </div>
  </div>
)}
                </div>
              </>
            )}


            {/* ── CHARACTERS VIEW ── */}
            {activeView === "characters" && (
              <>
                <div style={{ padding: "0 16px", borderBottom: `1px solid ${C.border}`, height: 48,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
                    {characters.length} character{characters.length !== 1 ? "s" : ""} saved
                  </span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setFormSection("traits"); setActiveView("generate"); }}
                    style={{ height: 30, padding: "0 12px", borderRadius: 9,
                      border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
                      cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                    <Plus size={12} /> New character
                  </motion.button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 0 }}>
                  {characters.length === 0 ? (
                    <div style={{ height: "80%", display: "grid", placeItems: "center" }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: "center", maxWidth: 280 }}>
                        <div style={{ width: 72, height: 72, borderRadius: 999, margin: "0 auto 16px",
                          display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <Users size={28} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 6px", color: C.text, fontSize: 15, fontWeight: 700 }}>No characters yet</p>
                        <p style={{ margin: "0 0 16px", color: C.textMuted, fontSize: 12.5, lineHeight: 1.7 }}>
                          Build your cast by defining characters with traits and references.
                        </p>
                        <motion.button whileTap={{ scale: 0.96 }}
                          onClick={() => { setFormSection("traits"); setActiveView("generate"); }}
                          style={{ height: 36, padding: "0 16px", borderRadius: radius.md,
                            border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
                            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                            display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Plus size={13} /> Create first character
                        </motion.button>
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                      {characters.map((char, i) => (
                        <motion.div key={char.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <div style={{ position: "relative" }}>
                            <CharacterCard char={char} isActive={char.id === activeCharId}
                              onClick={() => { loadCharacterIntoForm(char); setActiveView("generate"); }}
                              onDelete={() => deleteCharacter(char.id)} />
                            <button onClick={e => { e.stopPropagation(); deleteCharacter(char.id); }}
                              style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 8,
                                border: `1px solid rgba(248,113,113,0.25)`, background: "rgba(248,113,113,0.1)",
                                color: "#f87171", display: "grid", placeItems: "center", cursor: "pointer" }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxItem(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
              onClick={e => e.stopPropagation()}
              style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh",
                borderRadius: radius.xl, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}>
              <img src={lightboxItem.url} alt={lightboxItem.scene}
                style={{ display: "block", maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain" }} />
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
                {[Download, X].map((Icon, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.9 }}
                    onClick={() => { if (i === 1) setLightboxItem(null); }}
                    style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "white",
                      display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Icon size={15} />
                  </motion.button>
                ))}
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)", padding: "40px 20px 18px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "white" }}>{lightboxItem.scene || "Portrait"}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>{new Date(lightboxItem.createdAt).toLocaleString()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
