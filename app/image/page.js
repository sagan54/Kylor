"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Compass,
  Clapperboard,
  Image as ImageIcon,
  Video,
  UserCircle2,
  Orbit,
  FolderKanban,
  Settings,
  Grid3X3,
  List,
  Wand2,
  ChevronRight,
  Bell,
  BellOff,
  X,
  ChevronDown,
  Folder,
  Upload,
  Zap,
  Star,
  Download,
  Share2,
  Trash2,
  Plus,
  Music,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

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
const radius = { sm: "10px", md: "14px", lg: "18px", xl: "22px", full: "999px" };

// ─── Style presets ─────────────────────────────────────────────────────────────
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

const RECENT_SEED = [];

const SIDEBAR_ITEMS = [
  { label: "Home", icon: Compass, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Story", icon: Clapperboard, href: "/story" },
  { label: "Image", icon: ImageIcon, href: "/image", active: true },
  { label: "Video", icon: Video, href: "#" },
  { label: "Consistent", icon: UserCircle2, href: "#" },
  { label: "Motion", icon: Orbit, href: "#" },
  { label: "Projects", icon: FolderKanban, href: "/story" },
  { label: "Settings", icon: Settings, href: "#" },
];

const MODES = ["1K SD", "2K HD", "4K"];
const RATIOS = ["Auto", "9:16", "2:3", "3:4", "1:1", "4:3", "3:2", "16:9", "21:9"];
const OUTPUTS = [1, 2, 3, 4, 5, 6, 7, 8];
const CONTENT_TABS = ["All", "Images", "Videos", "Audio"];
const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.4), rgba(124,58,237,0.2))",
  "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(17,17,34,0.8))",
  "linear-gradient(135deg, rgba(49,46,129,0.5), rgba(79,70,229,0.25))",
  "linear-gradient(135deg, rgba(91,33,182,0.4), rgba(55,48,163,0.3))",
  "linear-gradient(135deg, rgba(67,56,202,0.45), rgba(124,58,237,0.2))",
  "linear-gradient(135deg, rgba(109,92,255,0.3), rgba(49,46,129,0.4))",
];

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{ display: "grid", justifyItems: "center", gap: "6px", padding: "10px 6px", borderRadius: radius.lg, background: item.active ? "linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))" : "transparent", border: `1px solid ${item.active ? C.border : "transparent"}`, color: item.active ? C.text : C.textMuted, cursor: "pointer", transition: "all 0.18s ease" }}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", background: item.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)" }}>
        <Icon size={17} />
      </div>
      <span style={{ fontSize: "10.5px", textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
    </motion.div>
  );
  return item.href === "#" ? <div>{inner}</div> : (
    <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>
  );
}

// ─── Segment Control ──────────────────────────────────────────────────────────
function SegmentControl({ options, value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: "6px", padding: "4px", borderRadius: radius.lg, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <motion.button key={opt} onClick={() => onChange(opt)} whileTap={{ scale: 0.96 }}
            style={{ height: "36px", borderRadius: radius.sm, border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent", background: active ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.13))" : "transparent", color: active ? "white" : C.textMuted, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.16s ease" }}
          >{opt}</motion.button>
        );
      })}
    </div>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ item, view, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [starred, setStarred] = useState(item.starred || false);
  const gradient = CARD_GRADIENTS[item.id % CARD_GRADIENTS.length];

  if (view === "list") {
    return (
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
        style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", borderRadius: radius.md, background: hovered ? C.surfaceHover : "transparent", border: `1px solid ${hovered ? C.borderHover : "transparent"}`, cursor: "pointer", transition: "all 0.16s ease" }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: radius.sm, flexShrink: 0, border: `1px solid ${C.border}`, overflow: "hidden", background: gradient }}>
          {item.url && <img src={item.url} alt={item.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", color: C.text, fontWeight: 500, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.prompt}</div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>{item.ratio} · 2K HD</div>
        </div>
        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", gap: "6px" }}>
              {[Download, Share2, Trash2].map((Icon, i) => (
                <button key={i} onClick={i === 2 ? onDelete : undefined}
                  style={{ width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.surface, color: i === 2 ? "#f87171" : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <Icon size={13} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      style={{ borderRadius: radius.lg, border: `1px solid ${hovered ? C.borderHover : C.border}`, overflow: "hidden", cursor: "pointer", position: "relative", background: gradient, aspectRatio: (item.ratio || "1:1").replace(":", "/"), transition: "border-color 0.16s ease" }}
    >
      {item.url && <img src={item.url} alt={item.prompt} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 50%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px" }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={(e) => { e.stopPropagation(); setStarred(!starred); }}
                style={{ width: "28px", height: "28px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.4)", color: starred ? "#fbbf24" : "white", display: "grid", placeItems: "center", cursor: "pointer" }}>
                <Star size={13} fill={starred ? "#fbbf24" : "none"} />
              </button>
            </div>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "11.5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{item.prompt}</p>
              <div style={{ display: "flex", gap: "6px" }}>
                {[Download, Share2].map((Icon, i) => (
                  <button key={i} style={{ height: "26px", padding: "0 10px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "rgba(0,0,0,0.5)", color: "white", display: "inline-flex", alignItems: "center", cursor: "pointer" }}><Icon size={11} /></button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({ files, onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (dropped.length) onFiles((prev) => [...prev, ...dropped].slice(0, 10));
  }, [onFiles]);

  const handleChange = (e) => {
    const picked = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    onFiles((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = "";
  };

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{ borderColor: dragging ? C.accent : "rgba(255,255,255,0.08)", background: dragging ? C.accentSoft : C.surface }}
        style={{ borderRadius: radius.md, border: "1.5px dashed rgba(255,255,255,0.08)", padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleChange} />
        <div style={{ width: "34px", height: "34px", borderRadius: radius.sm, flexShrink: 0, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center" }}>
          <Upload size={14} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", color: C.text, fontWeight: 500 }}>Drop images or <span style={{ color: "#a78bfa" }}>browse</span></div>
          <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>PNG, JPG, WEBP · max 10 refs</div>
        </div>
        <div style={{ fontSize: "12px", color: files.length > 0 ? "#a78bfa" : C.textDim, fontWeight: 600 }}>{files.length}/10</div>
      </motion.div>

      {files.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {files.map((file, i) => {
            const url = URL.createObjectURL(file);
            return (
              <div key={i} style={{ position: "relative", width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${C.accentBorder}` }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={(e) => { e.stopPropagation(); onFiles((prev) => prev.filter((_, idx) => idx !== i)); }}
                  style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "999px", background: "rgba(0,0,0,0.75)", border: "none", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <X size={9} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Styles Picker ────────────────────────────────────────────────────────────
function StylesPicker({ value, onChange, onClose }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "absolute", left: 0, right: 0, bottom: "calc(100% + 8px)", zIndex: 20, borderRadius: radius.lg, border: `1px solid ${C.border}`, background: "rgba(12,14,22,0.99)", backdropFilter: "blur(18px)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", padding: "14px" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted }}>Choose Style</div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={14} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", maxHeight: "260px", overflowY: "auto" }}>
        {STYLES.map((s) => {
          const active = value === s.id;
          return (
            <motion.button key={s.id} whileTap={{ scale: 0.96 }} onClick={() => { onChange(active ? null : s.id); if (!active) onClose(); }}
              style={{ padding: "10px 12px", borderRadius: radius.sm, border: `1px solid ${active ? s.color + "55" : C.border}`, background: active ? s.color + "18" : C.surface, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s ease", display: "grid", gap: "3px" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: active ? C.text : "rgba(255,255,255,0.85)" }}>{s.label}</span>
                {active && <Check size={11} color={s.color} />}
              </div>
              <span style={{ fontSize: "10.5px", color: C.textDim, lineHeight: 1.4 }}>{s.desc}</span>
            </motion.button>
          );
        })}
      </div>
      {value && (
        <button onClick={() => onChange(null)} style={{ marginTop: "10px", width: "100%", padding: "8px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
          Clear style
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ImagePage() {
  const [topTab, setTopTab] = useState("All");
  const [contentFilter, setContentFilter] = useState("All");
  const [assetView, setAssetView] = useState("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lightboxItem, setLightboxItem] = useState(null); // fullscreen preview
  const [featuredId, setFeaturedId] = useState(null); // which item is the hero

  const [prompt, setPrompt] = useState("");
  const charLimit = 500;

  const [negativeOpen, setNegativeOpen] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");

  const [stylesOpen, setStylesOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [refImages, setRefImages] = useState([]);

  const [ratio, setRatio] = useState("16:9");
  const [mode, setMode] = useState("2K HD");
  const [outputCount, setOutputCount] = useState(4);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // "idle" | "granted" | "denied" | "dismissed"
  const [notifState, setNotifState] = useState("idle");

  const [generating, setGenerating] = useState(false);
  const [recentItems, setRecentItems] = useState(RECENT_SEED);

  const panelRef = useRef(null);
  const stylesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setSettingsOpen(false);
      if (stylesRef.current && !stylesRef.current.contains(e.target)) setStylesOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Notification ────────────────────────────────────────────────────────────
  async function handleAllowNotifications() {
    if (!("Notification" in window)) { setNotifState("dismissed"); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotifState(permission === "granted" ? "granted" : "denied");
    } catch { setNotifState("dismissed"); }
  }

  // ── Generate ────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    const styleLabel = selectedStyle ? STYLES.find((s) => s.id === selectedStyle)?.label : null;
    const fullPrompt = [
      prompt.trim(),
      styleLabel ? `Style: ${styleLabel}` : null,
      negativePrompt.trim() ? `Negative: ${negativePrompt.trim()}` : null,
    ].filter(Boolean).join(". ");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      const data = await res.json();

      if (data.image) {
        const newItem = { id: Date.now(), prompt: prompt.trim(), ratio, starred: false, url: data.image };
        setRecentItems((prev) => [newItem, ...prev]);
        setFeaturedId(newItem.id);
      } else {
        const placeholder = { id: Date.now(), prompt: prompt.trim(), ratio, starred: false, url: null };
        setRecentItems((prev) => [placeholder, ...prev]);
        setFeaturedId(placeholder.id);
      }
    } catch {
      const placeholder = { id: Date.now(), prompt: prompt.trim(), ratio, starred: false, url: null };
      setRecentItems((prev) => [placeholder, ...prev]);
      setFeaturedId(placeholder.id);
    }

    setGenerating(false);
  }

  const activeStyle = STYLES.find((s) => s.id === selectedStyle);

  const filteredItems = recentItems.filter((item) => {
    if (favoritesOnly && !item.starred) return false;
    if (contentFilter === "Videos" || contentFilter === "Audio") return false;
    return true;
  });

  return (
    <main style={{
      height: "100vh", overflow: "hidden",
      background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), ${C.bg}`,
      color: C.text, fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      display: "grid", gridTemplateColumns: "88px 1fr",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{ borderRight: `1px solid ${C.border}`, background: C.sidebar, padding: "18px 10px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ width: "46px", height: "46px", borderRadius: "16px", margin: "0 auto 22px", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))", border: `1px solid ${C.border}`, boxShadow: `0 0 20px ${C.accentGlow}` }}>
          <Sparkles size={20} color="#a78bfa" />
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {SIDEBAR_ITEMS.map((item) => <SidebarItem key={item.label} item={item} />)}
        </div>
      </aside>

      {/* ── Main column ── */}
      <div style={{ display: "grid", gridTemplateRows: "48px 1fr", height: "100vh", overflow: "hidden" }}>

        {/* ── Top Nav ── */}
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {["All", "Output", "Projects"].map((tab) => (
              <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setTopTab(tab)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "9px", border: `1px solid ${topTab === tab ? C.accentBorder : "transparent"}`, background: topTab === tab ? C.accentSoft : "transparent", color: topTab === tab ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: topTab === tab ? 600 : 400, transition: "all 0.15s ease" }}
              >{tab}</motion.button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
              <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setAssetView(val)}
                style={{ width: "34px", height: "34px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: assetView === val ? "rgba(255,255,255,0.08)" : "transparent", color: assetView === val ? C.text : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}
              ><Icon size={15} /></motion.button>
            ))}
            <motion.button whileHover={{ borderColor: C.borderHover }}
              style={{ height: "34px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}
            ><Folder size={13} /> Assets</motion.button>
          </div>
        </div>

        {/* ── Split ── */}
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "100%", overflow: "hidden" }}>

          {/* ══ LEFT PANEL — flex column, never clips ══ */}
          <div style={{
            borderRight: `1px solid ${C.border}`,
            background: "linear-gradient(180deg, rgba(7,9,15,0.98), rgba(9,11,17,0.98))",
            height: "100%", overflow: "hidden",
            display: "flex", flexDirection: "column",
            padding: "16px", gap: "12px", boxSizing: "border-box",
          }}>

            {/* Heading */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px", flexShrink: 0 }}>
              <div style={{ color: C.text, fontWeight: 700, fontSize: "14px", position: "relative", display: "inline-block", paddingBottom: "4px" }}>
                Image Generation
                <span style={{ position: "absolute", left: 0, bottom: "-15px", width: "100%", height: "2px", borderRadius: radius.full, background: `linear-gradient(90deg, ${C.indigo}, ${C.accent})` }} />
              </div>
            </div>

            {/* Model Selector */}
            <motion.button whileHover={{ borderColor: C.accentBorder }} whileTap={{ scale: 0.99 }}
              style={{ width: "100%", padding: "10px 12px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, color: C.text, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.16s ease", flexShrink: 0 }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "linear-gradient(135deg, #6D5CFF, #9d4edd)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", color: "#fff", flexShrink: 0 }}>V1</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Kylor V1</div>
                <div style={{ fontSize: "11.5px", color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Consistency · free multi-reference generation</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <div style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "6px", background: "rgba(124,58,237,0.2)", border: `1px solid ${C.accentBorder}`, color: "#c4b5fd" }}>FREE</div>
                <ChevronDown size={14} color={C.textMuted} />
              </div>
            </motion.button>

            {/* Drop Zone */}
            <div style={{ flexShrink: 0 }}>
              <DropZone files={refImages} onFiles={setRefImages} />
            </div>

            {/* Prompt — fills remaining height */}
            <div style={{ flex: 1, minHeight: 0, borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "12px", display: "flex", flexDirection: "column" }}>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, charLimit))}
                placeholder="Describe the image you want to create..."
                style={{ flex: 1, width: "100%", border: "none", background: "transparent", color: C.text, resize: "none", fontFamily: "inherit", fontSize: "13.5px", lineHeight: 1.7, outline: "none", minHeight: 0, boxSizing: "border-box" }}
              />

              {/* Negative prompt — collapsible */}
              <AnimatePresence>
                {negativeOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: "8px", paddingTop: "8px" }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f87171", marginBottom: "6px" }}>Negative Prompt</div>
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="What to avoid: blurry, distorted, watermark, low quality..."
                        rows={3}
                        style={{ width: "100%", border: `1px solid rgba(248,113,113,0.25)`, background: "rgba(248,113,113,0.04)", color: C.text, borderRadius: radius.sm, padding: "8px 10px", resize: "none", fontFamily: "inherit", fontSize: "12.5px", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setStylesOpen((p) => !p); }}
                    style={{ height: "30px", padding: "0 12px", borderRadius: "9px", border: `1px solid ${activeStyle ? (activeStyle.color + "55") : C.accentBorder}`, background: activeStyle ? (activeStyle.color + "18") : C.accentSoft, color: activeStyle ? C.text : "#a78bfa", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    {activeStyle ? <><Check size={10} />{activeStyle.label}</> : "Styles"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setNegativeOpen((p) => !p)}
                    style={{ height: "30px", padding: "0 12px", borderRadius: "9px", border: `1px solid ${negativeOpen || negativePrompt ? "rgba(248,113,113,0.3)" : C.border}`, background: negativeOpen || negativePrompt ? "rgba(248,113,113,0.08)" : C.surface, color: negativeOpen || negativePrompt ? "#fca5a5" : C.textMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}
                  >Negative{negativePrompt ? " ✓" : ""}</motion.button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: prompt.length > charLimit * 0.9 ? "#f87171" : C.textDim }}>{prompt.length}/{charLimit}</span>
                  <motion.button whileTap={{ scale: 0.92 }} title="Enhance prompt"
                    onClick={() => { if (prompt.trim()) setPrompt((p) => p.trim() + ", ultra detailed, cinematic lighting, 8K"); }}
                    style={{ width: "32px", height: "32px", borderRadius: "10px", border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#a78bfa", display: "grid", placeItems: "center", cursor: "pointer" }}>
                    <Sparkles size={14} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* ── Settings + Generate — always at bottom, never cut ── */}
            <div style={{ position: "relative", flexShrink: 0 }}>

              {/* Styles picker popover */}
              <div ref={stylesRef}>
                <AnimatePresence>
                  {stylesOpen && (
                    <StylesPicker value={selectedStyle} onChange={setSelectedStyle} onClose={() => setStylesOpen(false)} />
                  )}
                </AnimatePresence>
              </div>

              {/* Settings popover */}
              <div ref={panelRef}>
                <AnimatePresence>
                  {settingsOpen && (
                    <motion.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      style={{ position: "absolute", left: 0, right: 0, bottom: "calc(100% + 8px)", zIndex: 10, borderRadius: "18px", border: `1px solid ${C.border}`, background: "rgba(14,16,26,0.99)", backdropFilter: "blur(16px)", boxShadow: "0 28px 80px rgba(0,0,0,0.5)", padding: "16px", display: "grid", gap: "16px" }}
                    >
                      <div>
                        <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mode</div>
                        <SegmentControl options={MODES} value={mode} onChange={setMode} />
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Aspect Ratio</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                          {RATIOS.map((item) => (
                            <motion.button key={item} whileTap={{ scale: 0.95 }} onClick={() => setRatio(item)}
                              style={{ height: "34px", borderRadius: radius.sm, border: ratio === item ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`, background: ratio === item ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))" : C.surface, color: ratio === item ? "white" : C.textMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}
                            >{item}</motion.button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Output Count</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}>
                          {OUTPUTS.map((item) => (
                            <motion.button key={item} whileTap={{ scale: 0.95 }} onClick={() => setOutputCount(item)}
                              style={{ height: "34px", borderRadius: radius.sm, border: outputCount === item ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`, background: outputCount === item ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))" : C.surface, color: outputCount === item ? "white" : C.textMuted, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}
                            >{item}</motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Settings + Generate row */}
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px" }}>
                  <motion.button whileHover={{ borderColor: C.borderHover }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSettingsOpen((p) => !p)}
                    style={{ height: "46px", padding: "0 14px", borderRadius: radius.md, border: `1px solid ${settingsOpen ? C.accentBorder : C.border}`, background: settingsOpen ? C.accentSoft : "#0d0f18", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s ease" }}
                  >
                    <Settings size={14} />
                    <span>{mode} · {ratio} · ×{outputCount}</span>
                    <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={14} /></motion.div>
                  </motion.button>

                  <motion.button
                    whileHover={prompt.trim() && !generating ? { boxShadow: "0 18px 40px rgba(124,58,237,0.42)" } : {}}
                    whileTap={prompt.trim() && !generating ? { scale: 0.98 } : {}}
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      height: "46px", width: "100%", borderRadius: radius.md, border: "none",
                      background: prompt.trim() && !generating ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.06)",
                      color: prompt.trim() && !generating ? "white" : C.textMuted,
                      cursor: prompt.trim() && !generating ? "pointer" : "default",
                      fontSize: "14px", fontWeight: 700,
                      boxShadow: prompt.trim() && !generating ? "0 10px 28px rgba(124,58,237,0.28)" : "none",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      fontFamily: "inherit", transition: "all 0.2s ease",
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {generating ? (
                        <motion.span key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={15} /></motion.div>
                          Generating…
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Wand2 size={15} /> Generate <ChevronRight size={15} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div style={{ background: "rgba(4,5,12,0.95)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {/* Notification bar */}
            <AnimatePresence>
              {notifState === "idle" && (
                <motion.div key="notif-idle" initial={{ height: 44 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ borderBottom: `1px solid ${C.border}`, background: "#12141e", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", overflow: "hidden", flexShrink: 0, height: 44 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                    <Bell size={13} color={C.textMuted} />
                    <span>Turn on notifications for generation updates.</span>
                    <button onClick={handleAllowNotifications}
                      style={{ border: "none", background: "transparent", color: "#a78bfa", cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "inherit" }}>Allow</button>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setNotifState("dismissed")}
                    style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    <X size={14} />
                  </motion.button>
                </motion.div>
              )}
              {notifState === "granted" && (
                <motion.div key="notif-ok" initial={{ height: 0, opacity: 0 }} animate={{ height: 44, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(34,197,94,0.07)", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", overflow: "hidden", flexShrink: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#86efac", fontSize: "13px" }}>
                    <Check size={13} /> Notifications enabled — you'll be notified when generation completes.
                  </div>
                  <button onClick={() => setNotifState("dismissed")} style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}><X size={14} /></button>
                </motion.div>
              )}
              {notifState === "denied" && (
                <motion.div key="notif-denied" initial={{ height: 0, opacity: 0 }} animate={{ height: 44, opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(239,68,68,0.07)", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", overflow: "hidden", flexShrink: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fca5a5", fontSize: "13px" }}>
                    <BellOff size={13} /> Notifications blocked — enable them in your browser settings.
                  </div>
                  <button onClick={() => setNotifState("dismissed")} style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer" }}><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${C.border}`, height: "48px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {CONTENT_TABS.map((tab) => (
                  <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setContentFilter(tab)}
                    style={{ height: "28px", padding: "0 12px", borderRadius: "8px", border: `1px solid ${contentFilter === tab ? C.border : "transparent"}`, background: contentFilter === tab ? "rgba(255,255,255,0.09)" : "transparent", color: contentFilter === tab ? C.text : C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", transition: "all 0.14s ease", display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    {tab === "Videos" && <Video size={11} />}
                    {tab === "Audio" && <Music size={11} />}
                    {tab === "Images" && <ImageIcon size={11} />}
                    {tab}
                  </motion.button>
                ))}
                <label style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px", fontSize: "12.5px", color: favoritesOnly ? "#a78bfa" : C.textMuted, cursor: "pointer" }}>
                  <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} style={{ accentColor: C.accent }} />
                  Favorites
                </label>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
                  <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setAssetView(val)}
                    style={{ width: "32px", height: "32px", borderRadius: "9px", border: `1px solid ${C.border}`, background: assetView === val ? "rgba(255,255,255,0.08)" : C.surface, color: assetView === val ? C.text : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}
                  ><Icon size={13} /></motion.button>
                ))}
                <motion.button whileHover={{ borderColor: C.borderHover }}
                  style={{ height: "32px", padding: "0 12px", borderRadius: "9px", border: `1px solid ${C.border}`, background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit" }}
                ><Folder size={13} /> Assets</motion.button>
              </div>
            </div>

            {/* ── Canvas ─────────────────────────────────────────────── */}
            <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>

              {/* Generating spinner — full area */}
              {generating && (
                <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto 20px" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        style={{ position: "absolute", inset: 0, borderRadius: "999px", border: `2px solid ${C.accent}`, borderTopColor: "transparent" }}
                      />
                      <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        style={{ position: "absolute", inset: "8px", borderRadius: "999px", border: `1.5px solid ${C.accentBorder}`, borderBottomColor: "transparent" }}
                      />
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                        <Sparkles size={22} color="#a78bfa" />
                      </div>
                    </div>
                    <p style={{ margin: "0 0 6px", color: C.text, fontSize: "16px", fontWeight: 700 }}>Generating your image…</p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>{mode} · {ratio}{activeStyle ? ` · ${activeStyle.label}` : ""}</p>
                  </div>
                </div>
              )}

              {/* Videos / Audio empty states */}
              {!generating && contentFilter === "Videos" && (
                <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}><Video size={26} color={C.textDim} /></div>
                    <p style={{ margin: "0 0 4px", color: C.text, fontSize: "15px", fontWeight: 600 }}>Video Generation</p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>Coming soon — video outputs will appear here.</p>
                  </div>
                </div>
              )}
              {!generating && contentFilter === "Audio" && (
                <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}><Music size={26} color={C.textDim} /></div>
                    <p style={{ margin: "0 0 4px", color: C.text, fontSize: "15px", fontWeight: 600 }}>Audio Generation</p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>Coming soon — audio outputs will appear here.</p>
                  </div>
                </div>
              )}

              {/* Images view */}
              {!generating && (contentFilter === "All" || contentFilter === "Images") && (() => {
                const items = filteredItems;
                if (items.length === 0) {
                  return (
                    <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: "300px" }}>
                        <div style={{ width: "72px", height: "72px", borderRadius: "999px", margin: "0 auto 18px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <ImageIcon size={30} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 8px", color: C.text, fontSize: "16px", fontWeight: 700 }}>Your canvas is empty</p>
                        <p style={{ margin: "0 0 20px", color: C.textMuted, fontSize: "13px", lineHeight: 1.7 }}>Describe what you want to create and hit Generate — your image will appear here.</p>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => textareaRef.current?.focus()}
                          style={{ height: "36px", padding: "0 18px", borderRadius: radius.md, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "7px" }}
                        ><Plus size={13} /> Start with a prompt</motion.button>
                      </motion.div>
                    </div>
                  );
                }

                const featured = items.find((x) => x.id === featuredId) || items[0];
                const history = items.filter((x) => x.id !== featured.id);

                return (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

                    {/* ── Hero Preview ── */}
                    <div style={{ flex: 1, minHeight: 0, padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <motion.div key={featured.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => setLightboxItem(featured)}
                        style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", borderRadius: radius.xl, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "zoom-in", boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset` }}
                      >
                        {featured.url ? (
                          <img src={featured.url} alt={featured.prompt}
                            style={{ display: "block", maxWidth: "100%", maxHeight: "calc(100vh - 260px)", objectFit: "contain", borderRadius: radius.xl }}
                          />
                        ) : (
                          /* Placeholder when API returns no image */
                          <div style={{ width: "460px", height: "520px", background: CARD_GRADIENTS[featured.id % CARD_GRADIENTS.length], display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                            <ImageIcon size={40} color="rgba(255,255,255,0.2)" />
                            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>{featured.prompt}</span>
                          </div>
                        )}

                        {/* Overlay actions */}
                        <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "6px" }}>
                          {[
                            { Icon: Download, title: "Download" },
                            { Icon: Share2, title: "Share" },
                            { Icon: Star, title: "Favourite", active: featured.starred },
                          ].map(({ Icon, title, active }) => (
                            <motion.button key={title} whileTap={{ scale: 0.9 }} title={title}
                              style={{ width: "36px", height: "36px", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.12)`, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: active ? "#fbbf24" : "white", display: "grid", placeItems: "center", cursor: "pointer" }}
                            ><Icon size={14} fill={active ? "#fbbf24" : "none"} /></motion.button>
                          ))}
                        </div>

                        {/* Bottom prompt label */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)", padding: "32px 16px 14px", borderRadius: `0 0 ${radius.xl} ${radius.xl}` }}>
                          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{featured.prompt}</p>
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: C.textMuted }}>{featured.ratio} · {mode}{activeStyle ? ` · ${activeStyle.label}` : ""}</p>
                        </div>
                      </motion.div>
                    </div>

                    {/* ── History strip ── */}
                    {history.length > 0 && (
                      <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: "12px 20px 16px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textMuted, marginBottom: "10px" }}>
                          History · {history.length}
                        </div>
                        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                          {history.map((item, i) => (
                            <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                              onClick={() => setFeaturedId(item.id)}
                              style={{ flexShrink: 0, width: "90px", height: "90px", borderRadius: radius.md, overflow: "hidden", border: `2px solid ${featuredId === item.id ? C.accent : C.border}`, cursor: "pointer", position: "relative", transition: "border-color 0.18s ease", background: CARD_GRADIENTS[item.id % CARD_GRADIENTS.length] }}
                            >
                              {item.url && <img src={item.url} alt={item.prompt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
                              <div style={{ position: "absolute", bottom: "4px", left: "6px", right: "6px", fontSize: "9px", color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.prompt}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setLightboxItem(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          >
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", borderRadius: radius.xl, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}
            >
              {lightboxItem.url ? (
                <img src={lightboxItem.url} alt={lightboxItem.prompt} style={{ display: "block", maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain" }} />
              ) : (
                <div style={{ width: "600px", height: "700px", background: CARD_GRADIENTS[lightboxItem.id % CARD_GRADIENTS.length], display: "grid", placeItems: "center" }}>
                  <ImageIcon size={60} color="rgba(255,255,255,0.15)" />
                </div>
              )}

              {/* Lightbox controls */}
              <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", gap: "8px" }}>
                {[Download, Share2].map((Icon, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.9 }}
                    style={{ width: "40px", height: "40px", borderRadius: "12px", border: `1px solid rgba(255,255,255,0.12)`, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
                  ><Icon size={15} /></motion.button>
                ))}
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLightboxItem(null)}
                  style={{ width: "40px", height: "40px", borderRadius: "12px", border: `1px solid rgba(255,255,255,0.12)`, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
                ><X size={15} /></motion.button>
              </div>

              {/* Lightbox prompt */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", padding: "40px 20px 18px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "white" }}>{lightboxItem.prompt}</p>
                <p style={{ margin: 0, fontSize: "12px", color: C.textMuted }}>{lightboxItem.ratio} · {mode}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}