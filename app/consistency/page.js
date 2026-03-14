"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Compass, Clapperboard, Image as ImageIcon, Video, UserCircle2,
  Orbit, FolderKanban, Settings, Wand2, ChevronRight, X, ChevronDown,
  Upload, Zap, Star, Download, Share2, Trash2, Plus, Check, Copy,
  User, Users, Layers, RefreshCw, Eye, Lock, Unlock, Grid3X3,
  List, Folder, Bell, BellOff, ChevronLeft, MoreHorizontal,
  Shuffle, BookOpen, Camera, Sliders,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

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
  { label: "Home",       icon: Compass,      href: "/" },
  { label: "Explore",    icon: Compass,      href: "/explore" },
  { label: "Story",      icon: Clapperboard, href: "/story" },
  { label: "Image",      icon: ImageIcon,    href: "/image" },
  { label: "Video",      icon: Video,        href: "#" },
  { label: "Consistency", icon: UserCircle2,  href: "/consistency", active: true },
  { label: "Motion",     icon: Orbit,        href: "#" },
  { label: "Projects",   icon: FolderKanban, href: "/story" },
  { label: "Settings",   icon: Settings,     href: "#" },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const GENDERS   = ["Female", "Male", "Non-binary", "Unspecified"];
const AGE_RANGE = ["Teen (13–17)", "Young Adult (18–30)", "Adult (30–50)", "Senior (50+)", "Unspecified"];
const ETHNICITIES = ["Unspecified", "East Asian", "South Asian", "Black / African", "Latino / Hispanic", "Middle Eastern", "White / European", "Mixed"];
const HAIR_STYLES = ["Short", "Medium", "Long", "Curly", "Wavy", "Braided", "Bald", "Ponytail"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "White", "Silver", "Blue", "Pink", "Green"];
const EYE_COLORS  = ["Brown", "Blue", "Green", "Hazel", "Grey", "Amber"];
const BUILD_TYPES = ["Slim", "Athletic", "Average", "Muscular", "Stocky", "Curvy"];
const SCENE_TYPES = [
  "Portrait / Close-up",
  "Upper body",
  "Full body standing",
  "Full body action",
  "Sitting / relaxed",
  "Walking / moving",
];
const LIGHTING_PRESETS = [
  { id: "cinematic",   label: "Cinematic",    color: "#6366f1" },
  { id: "golden_hour", label: "Golden Hour",  color: "#f59e0b" },
  { id: "dramatic",    label: "Dramatic",     color: "#ef4444" },
  { id: "soft_studio", label: "Soft Studio",  color: "#14b8a6" },
  { id: "neon",        label: "Neon Glow",    color: "#a855f7" },
  { id: "natural",     label: "Natural",      color: "#84cc16" },
];
const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(124,58,237,0.3))",
  "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(17,17,34,0.85))",
  "linear-gradient(135deg, rgba(49,46,129,0.65), rgba(79,70,229,0.35))",
  "linear-gradient(135deg, rgba(91,33,182,0.55), rgba(55,48,163,0.4))",
  "linear-gradient(135deg, rgba(67,56,202,0.6), rgba(124,58,237,0.3))",
];

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
function RefUpload({ files, onFiles, label, hint, max = 5 }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const onDrop = useCallback(e => {
    e.preventDefault(); setDrag(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    onFiles(p => [...p, ...dropped].slice(0, max));
  }, [onFiles, max]);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <motion.div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={onDrop} onClick={() => inputRef.current?.click()}
        animate={{ borderColor: drag ? C.accent : "rgba(255,255,255,0.09)", background: drag ? C.accentSoft : C.surface }}
        style={{ borderRadius: radius.md, border: "1.5px dashed rgba(255,255,255,0.09)", padding: "14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => { onFiles(p => [...p, ...Array.from(e.target.files)].slice(0, max)); e.target.value = ""; }} />
        <div style={{ width: 36, height: 36, borderRadius: radius.sm, flexShrink: 0,
          background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center" }}>
          <Camera size={14} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{hint}</div>
        </div>
        <div style={{ fontSize: 11.5, color: files.length > 0 ? "#a78bfa" : C.textDim, fontWeight: 600 }}>{files.length}/{max}</div>
      </motion.div>
      {files.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {files.map((file, i) => (
            <div key={i} style={{ position: "relative", width: 46, height: 46, borderRadius: 9,
              overflow: "hidden", border: `1px solid ${C.accentBorder}` }}>
              <img src={URL.createObjectURL(file)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={e => { e.stopPropagation(); onFiles(p => p.filter((_, j) => j !== i)); }}
                style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 999,
                  background: "rgba(0,0,0,0.75)", border: "none", color: "white",
                  display: "grid", placeItems: "center", cursor: "pointer" }}>
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Character Card ──────────────────────────────────────────────────────────
function CharacterCard({ char, isActive, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const gradient = CARD_GRADIENTS[char.id % CARD_GRADIENTS.length];
  return (
    <motion.div whileHover={{ y: -2 }} onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{ borderRadius: radius.lg, border: `1px solid ${isActive ? C.accentBorder : hovered ? C.borderHover : C.border}`,
        background: isActive ? "rgba(124,58,237,0.06)" : C.surface, cursor: "pointer",
        overflow: "hidden", transition: "all 0.18s ease",
        boxShadow: isActive ? `0 0 0 1px rgba(124,58,237,0.12) inset` : "none" }}>
      {/* Avatar strip */}
      <div style={{ height: 80, background: gradient, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.05),transparent)" }} />
        {char.refImages.length > 0 ? (
          <img src={URL.createObjectURL(char.refImages[0])} alt=""
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
function OutputCard({ item, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      style={{ borderRadius: radius.lg, border: `1px solid ${hovered ? C.borderHover : C.border}`,
        overflow: "hidden", cursor: "pointer", position: "relative",
        background: CARD_GRADIENTS[item.id % CARD_GRADIENTS.length],
        aspectRatio: "2/3", transition: "border-color 0.16s ease" }}>
      {item.url
        ? <img src={item.url} alt={item.prompt} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
        : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><User size={32} color="rgba(255,255,255,0.2)" /></div>
      }
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(255,255,255,0.04),transparent 50%)", pointerEvents: "none" }} />
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.75),transparent 55%)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
              {[Download, Share2, Trash2].map((Icon, i) => (
                <button key={i} onClick={i === 2 ? onDelete : undefined}
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
export default function ConsistentPage() {
  // View
  const [activeView,    setActiveView]    = useState("generate"); // "generate" | "characters"
  const [outputView,    setOutputView]    = useState("grid");

  // Characters list
  const [characters,    setCharacters]    = useState([]);
  const [activeCharId,  setActiveCharId]  = useState(null);

  // ── Character form ────────────────────────────────────────────────────────
  const [charName,      setCharName]      = useState("");
  const [charDesc,      setCharDesc]      = useState("");
  const [gender,        setGender]        = useState("");
  const [ageRange,      setAgeRange]      = useState("");
  const [ethnicity,     setEthnicity]     = useState("");
  const [hairStyle,     setHairStyle]     = useState("");
  const [hairColor,     setHairColor]     = useState("");
  const [eyeColor,      setEyeColor]      = useState("");
  const [build,         setBuild]         = useState("");
  const [refImages,     setRefImages]     = useState([]);
  const [charLocked,    setCharLocked]    = useState(false);

  // ── Generation form ───────────────────────────────────────────────────────
  const [scene,         setScene]         = useState("");
  const [lighting,      setLighting]      = useState(null);
  const [extraPrompt,   setExtraPrompt]   = useState("");
  const charLimit = 300;

  // ── Output ────────────────────────────────────────────────────────────────
  const [outputs,       setOutputs]       = useState([]);
  const [generating,    setGenerating]    = useState(false);

  // Panels
  const [formSection,   setFormSection]   = useState("traits"); // "traits" | "refs" | "generate"

  const canvasRef = useRef(null);

  const activeChar = characters.find(c => c.id === activeCharId) || null;
  const charOutputs = outputs.filter(o => o.charId === activeCharId);

  // ── Save / update active character ────────────────────────────────────────
  function saveCharacter() {
    if (!charName.trim()) return;
    const newChar = {
      id:         Date.now(),
      name:       charName.trim(),
      desc:       charDesc.trim(),
      gender, ageRange, ethnicity,
      hairStyle, hairColor, eyeColor, build,
      refImages:  [...refImages],
      locked:     charLocked,
      generations: 0,
      createdAt:  new Date().toISOString(),
    };
    setCharacters(p => [newChar, ...p]);
    setActiveCharId(newChar.id);
    // Reset form
    setCharName(""); setCharDesc(""); setGender(""); setAgeRange(""); setEthnicity("");
    setHairStyle(""); setHairColor(""); setEyeColor(""); setBuild("");
    setRefImages([]); setCharLocked(false);
    setFormSection("generate");
  }

  function deleteCharacter(id) {
    setCharacters(p => p.filter(c => c.id !== id));
    if (activeCharId === id) setActiveCharId(characters.find(c => c.id !== id)?.id ?? null);
    setOutputs(p => p.filter(o => o.charId !== id));
  }

  function loadCharacterIntoForm(char) {
    setCharName(char.name); setCharDesc(char.desc);
    setGender(char.gender); setAgeRange(char.ageRange); setEthnicity(char.ethnicity);
    setHairStyle(char.hairStyle); setHairColor(char.hairColor);
    setEyeColor(char.eyeColor); setBuild(char.build);
    setRefImages([...char.refImages]); setCharLocked(char.locked);
    setActiveCharId(char.id);
    setFormSection("generate");
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!activeChar || generating) return;
    setGenerating(true);

    const traitDesc = [
      activeChar.gender, activeChar.ageRange, activeChar.ethnicity,
      activeChar.hairColor && activeChar.hairStyle ? `${activeChar.hairColor} ${activeChar.hairStyle} hair` : null,
      activeChar.eyeColor ? `${activeChar.eyeColor} eyes` : null,
      activeChar.build ? `${activeChar.build} build` : null,
    ].filter(Boolean).join(", ");

    const lightLabel = lighting ? LIGHTING_PRESETS.find(l => l.id === lighting)?.label : null;

    const fullPrompt = [
      `Character portrait of ${activeChar.name}`,
      traitDesc ? `— ${traitDesc}` : null,
      activeChar.desc || null,
      scene ? `Scene: ${scene}` : null,
      lightLabel ? `Lighting: ${lightLabel}` : null,
      extraPrompt.trim() || null,
      "Consistent character design, photorealistic, ultra detailed, no text, no watermark.",
    ].filter(Boolean).join(". ");

    const outputId = Date.now();
    // Optimistic placeholder
    const placeholder = { id: outputId, charId: activeCharId, prompt: fullPrompt, scene: scene || "Portrait", url: null, createdAt: new Date().toISOString() };
    setOutputs(p => [placeholder, ...p]);
    setGenerating(false);
    canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res  = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, size: "1024x1536", quality: "high", n: 1 }),
      });
      const data = await res.json();
      const url  = Array.isArray(data?.images) ? data.images[0] : data?.image ?? null;

      setOutputs(p => p.map(o => o.id === outputId ? { ...o, url } : o));
      setCharacters(p => p.map(c => c.id === activeCharId ? { ...c, generations: c.generations + 1 } : c));
    } catch (err) {
      console.error("Generate failed:", err);
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
            {/* Badge */}
            <div style={{ height: 30, padding: "0 12px", borderRadius: radius.full,
              border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd",
              fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Character Consistency
            </div>
            <div style={{ width: 1, height: 20, background: C.border, margin: "0 2px" }} />
            {[
              { label: "Generate", id: "generate", icon: Wand2 },
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
            height: "100%", overflow: "hidden", display: "flex", flexDirection: "column",
            boxSizing: "border-box" }}>

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
                      style={{ height: 34, borderRadius: radius.sm, border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
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

              {/* ── TRAITS SECTION ── */}
              {formSection === "traits" && (<>
                {/* Name */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Character Name *</div>
                  <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="e.g. Aria Voss, Marcus Kane…"
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: radius.sm,
                      border: `1px solid ${charName ? C.accentBorder : C.border}`, background: charName ? C.accentSoft : C.surface,
                      color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none",
                      boxSizing: "border-box", transition: "all 0.16s ease" }} />
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Description</div>
                  <textarea value={charDesc} onChange={e => setCharDesc(e.target.value)} rows={3}
                    placeholder="Scar above left eyebrow, always wears a silver necklace…"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: radius.sm,
                      border: `1px solid ${C.border}`, background: C.surface, color: C.text, resize: "none",
                      fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6, outline: "none",
                      boxSizing: "border-box" }} />
                </div>

                {/* Demographics */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Demographics</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Gender</div><Select label="Select" options={GENDERS} value={gender} onChange={setGender} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Age</div><Select label="Select" options={AGE_RANGE} value={ageRange} onChange={setAgeRange} /></div>
                    <div style={{ gridColumn: "1/-1" }}><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Ethnicity</div><Select label="Select" options={ETHNICITIES} value={ethnicity} onChange={setEthnicity} /></div>
                  </div>
                </div>

                {/* Physical */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Physical Features</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Hair style</div><Select label="Select" options={HAIR_STYLES} value={hairStyle} onChange={setHairStyle} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Hair color</div><Select label="Select" options={HAIR_COLORS} value={hairColor} onChange={setHairColor} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Eye color</div><Select label="Select" options={EYE_COLORS} value={eyeColor} onChange={setEyeColor} /></div>
                    <div><div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Build</div><Select label="Select" options={BUILD_TYPES} value={build} onChange={setBuild} /></div>
                  </div>
                </div>

                {/* Lock toggle */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setCharLocked(p => !p)}
                  style={{ height: 36, padding: "0 14px", borderRadius: radius.sm, cursor: "pointer",
                    border: `1px solid ${charLocked ? "rgba(34,197,94,0.3)" : C.border}`,
                    background: charLocked ? "rgba(34,197,94,0.08)" : C.surface,
                    color: charLocked ? "#86efac" : C.textMuted, fontSize: 12.5, fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s ease" }}>
                  {charLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  {charLocked ? "Character locked (consistent)" : "Lock character traits"}
                </motion.button>

                {/* Save character button */}
                <motion.button whileHover={charName.trim() ? { boxShadow: "0 12px 32px rgba(124,58,237,0.35)" } : {}}
                  whileTap={charName.trim() ? { scale: 0.98 } : {}} onClick={saveCharacter}
                  style={{ height: 44, borderRadius: radius.md, border: "none", cursor: charName.trim() ? "pointer" : "default",
                    background: charName.trim() ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.06)",
                    color: charName.trim() ? "white" : C.textMuted, fontSize: 13.5, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: "inherit", transition: "all 0.2s ease",
                    boxShadow: charName.trim() ? "0 8px 24px rgba(124,58,237,0.25)" : "none" }}>
                  <User size={15} /> Save Character
                </motion.button>
              </>)}

              {/* ── REFS SECTION ── */}
              {formSection === "refs" && (<>
                <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted, lineHeight: 1.65 }}>
                  Upload reference photos of the character. More consistent references = more accurate generations.
                </p>

                <RefUpload files={refImages} onFiles={setRefImages}
                  label="Face references" hint="Clear, front-facing photos · best results" max={5} />

                <div style={{ padding: 14, borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Tips for better consistency</div>
                  {[
                    "Use clear, well-lit photos",
                    "Include front and 3/4 angles",
                    "Avoid obscured faces or masks",
                    "2–5 references works best",
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < 3 ? 6 : 0 }}>
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

              {/* ── GENERATE SECTION ── */}
              {formSection === "generate" && (<>

                {/* No character selected */}
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
                  {/* Scene picker */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Scene Type</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {SCENE_TYPES.map(s => (
                        <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setScene(scene === s ? "" : s)}
                          style={{ height: 34, borderRadius: radius.sm, cursor: "pointer",
                            border: `1px solid ${scene === s ? C.accentBorder : C.border}`,
                            background: scene === s ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))" : C.surface,
                            color: scene === s ? "white" : C.textMuted, fontSize: 11.5,
                            fontFamily: "inherit", transition: "all 0.15s ease" }}>
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Lighting */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8 }}>Lighting</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {LIGHTING_PRESETS.map(l => (
                        <motion.button key={l.id} whileTap={{ scale: 0.94 }} onClick={() => setLighting(lighting === l.id ? null : l.id)}
                          style={{ height: 30, padding: "0 11px", borderRadius: radius.full, cursor: "pointer",
                            border: `1px solid ${lighting === l.id ? l.color + "60" : C.border}`,
                            background: lighting === l.id ? l.color + "18" : C.surface,
                            color: lighting === l.id ? l.color : C.textMuted,
                            fontSize: 11.5, fontFamily: "inherit", transition: "all 0.14s ease" }}>
                          {l.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Extra prompt */}
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: 6 }}>Additional Details</div>
                    <div style={{ position: "relative" }}>
                      <textarea value={extraPrompt} onChange={e => setExtraPrompt(e.target.value.slice(0, charLimit))}
                        placeholder="wearing a leather jacket, rainy city background, 2049…"
                        rows={4}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: radius.md,
                          border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                          resize: "none", fontSize: 12.5, fontFamily: "inherit", lineHeight: 1.6,
                          outline: "none", boxSizing: "border-box" }} />
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
                      background: CARD_GRADIENTS[activeChar.id % CARD_GRADIENTS.length],
                      display: "grid", placeItems: "center" }}>
                      {activeChar.refImages.length > 0
                        ? <img src={URL.createObjectURL(activeChar.refImages[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <User size={14} color="rgba(255,255,255,0.4)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{activeChar.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {[activeChar.gender, activeChar.ageRange].filter(Boolean).join(" · ") || "No demographics set"}
                      </div>
                    </div>
                    <button onClick={() => setFormSection("traits")}
                      style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Sliders size={13} />
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
                        <Wand2 size={16} /> Generate Character <ChevronRight size={15} />
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
                {/* Output toolbar */}
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

                {/* Canvas */}
                <div ref={canvasRef} style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                  {/* No character */}
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

                  {/* Has character but no outputs */}
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
                          Choose a scene and lighting, then hit Generate Character.
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

                  {/* Outputs grid */}
                  {activeChar && charOutputs.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: outputView === "grid" ? "repeat(auto-fill,minmax(200px,1fr))" : "1fr", gap: 12 }}>
                      {charOutputs.map((item, i) => (
                        outputView === "grid" ? (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <OutputCard item={item} onDelete={() => setOutputs(p => p.filter(o => o.id !== item.id))} />
                          </motion.div>
                        ) : (
                          <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px",
                              borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface }}>
                            <div style={{ width: 52, height: 52, borderRadius: radius.sm, flexShrink: 0,
                              overflow: "hidden", border: `1px solid ${C.border}`,
                              background: CARD_GRADIENTS[item.id % CARD_GRADIENTS.length] }}>
                              {item.url && <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{item.scene || "Portrait"}</div>
                              <div style={{ fontSize: 11, color: C.textMuted }}>{new Date(item.createdAt).toLocaleString()}</div>
                            </div>
                            <div style={{ display: "flex", gap: 5 }}>
                              {[Download, Trash2].map((Icon, j) => (
                                <button key={j} onClick={j === 1 ? () => setOutputs(p => p.filter(o => o.id !== item.id)) : undefined}
                                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
                                    background: C.surface, color: j === 1 ? "#f87171" : C.textMuted,
                                    display: "grid", placeItems: "center", cursor: "pointer" }}>
                                  <Icon size={13} />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )
                      ))}
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
    </main>
  );
}