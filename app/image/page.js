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
  X,
  ChevronDown,
  Folder,
  Upload,
  Zap,
  Clock,
  Star,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Tokens ────────────────────────────────────────────────────────────────
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
  panel: "rgba(10,12,20,0.97)",
};

const radius = {
  sm: "10px",
  md: "14px",
  lg: "18px",
  xl: "22px",
  full: "999px",
};

// ─── Mock recent images ─────────────────────────────────────────────────────
const RECENT = [
  { id: 1, prompt: "Cyberpunk city at dusk", ratio: "3:4", starred: true },
  { id: 2, prompt: "Abstract fluid art", ratio: "1:1", starred: false },
  { id: 3, prompt: "Serene mountain lake", ratio: "16:9", starred: true },
  { id: 4, prompt: "Portrait, golden hour", ratio: "2:3", starred: false },
  { id: 5, prompt: "Neon Tokyo street", ratio: "3:4", starred: false },
  { id: 6, prompt: "Minimal geometric", ratio: "1:1", starred: true },
];

// ─── Sidebar ────────────────────────────────────────────────────────────────
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

// ─── Sub-components ──────────────────────────────────────────────────────────

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
          ? `linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))`
          : "transparent",
        border: `1px solid ${item.active ? C.border : "transparent"}`,
        color: item.active ? C.text : C.textMuted,
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "12px",
          display: "grid",
          placeItems: "center",
          background: item.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
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
    <div key={item.label}>{inner}</div>
  ) : (
    <Link key={item.label} href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: "6px",
        padding: "4px",
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
              height: "36px",
              borderRadius: radius.sm,
              border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
              background: active
                ? `linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.13))`
                : "transparent",
              color: active ? "white" : C.textMuted,
              fontSize: "13px",
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

function ImageCard({ item, view }) {
  const [hovered, setHovered] = useState(false);
  const [starred, setStarred] = useState(item.starred);

  const gradients = [
    "linear-gradient(135deg, rgba(79,70,229,0.4), rgba(124,58,237,0.2))",
    "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(17,17,34,0.8))",
    "linear-gradient(135deg, rgba(49,46,129,0.5), rgba(79,70,229,0.25))",
    "linear-gradient(135deg, rgba(91,33,182,0.4), rgba(55,48,163,0.3))",
    "linear-gradient(135deg, rgba(67,56,202,0.45), rgba(124,58,237,0.2))",
    "linear-gradient(135deg, rgba(109,92,255,0.3), rgba(49,46,129,0.4))",
  ];

  if (view === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "10px 14px",
          borderRadius: radius.md,
          background: hovered ? C.surfaceHover : "transparent",
          border: `1px solid ${hovered ? C.borderHover : "transparent"}`,
          cursor: "pointer",
          transition: "all 0.16s ease",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: radius.sm,
            background: gradients[item.id % gradients.length],
            flexShrink: 0,
            border: `1px solid ${C.border}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", color: C.text, fontWeight: 500, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.prompt}
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>
            {item.ratio} · 2K HD
          </div>
        </div>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", gap: "6px" }}
            >
              {[Download, Share2, Trash2].map((Icon, i) => (
                <button
                  key={i}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.textMuted,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        borderRadius: radius.lg,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        background: gradients[item.id % gradients.length],
        aspectRatio: item.ratio.replace(":", "/"),
        transition: "border-color 0.16s ease",
      }}
    >
      {/* Shimmer overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 50%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={(e) => { e.stopPropagation(); setStarred(!starred); }}
                style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  border: `1px solid ${C.border}`,
                  background: "rgba(0,0,0,0.4)",
                  color: starred ? "#fbbf24" : "white",
                  display: "grid", placeItems: "center", cursor: "pointer",
                }}
              >
                <Star size={13} fill={starred ? "#fbbf24" : "none"} />
              </button>
            </div>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "11.5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>
                {item.prompt}
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {[Download, Share2].map((Icon, i) => (
                  <button
                    key={i}
                    style={{
                      height: "26px", padding: "0 10px",
                      borderRadius: "7px", border: `1px solid ${C.border}`,
                      background: "rgba(0,0,0,0.5)", color: "white",
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      cursor: "pointer", fontSize: "11px", fontFamily: "inherit",
                    }}
                  >
                    <Icon size={11} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{
        borderColor: dragging ? C.accent : "rgba(255,255,255,0.08)",
        background: dragging ? C.accentSoft : C.surface,
      }}
      style={{
        borderRadius: radius.md,
        border: `1.5px dashed rgba(255,255,255,0.08)`,
        padding: "14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        transition: "all 0.18s ease",
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => onFiles(Array.from(e.target.files))} />
      <div
        style={{
          width: "36px", height: "36px", borderRadius: radius.sm, flexShrink: 0,
          background: C.accentSoft, border: `1px solid ${C.accentBorder}`,
          display: "grid", placeItems: "center",
        }}
      >
        <Upload size={15} color="#a78bfa" />
      </div>
      <div>
        <div style={{ fontSize: "13px", color: C.text, fontWeight: 500 }}>
          Drop images or <span style={{ color: "#a78bfa" }}>browse</span>
        </div>
        <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>
          PNG, JPG, WEBP · max 10 refs
        </div>
      </div>
      <div style={{ marginLeft: "auto", fontSize: "12px", color: C.textDim }}>0/10</div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("3:4");
  const [mode, setMode] = useState("2K HD");
  const [outputCount, setOutputCount] = useState(4);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showRecent, setShowRecent] = useState(true);
  const [refs, setRefs] = useState([]);

  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  const TABS = ["All", "Images", "Videos", "Audio"];

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setShowRecent(false);
    setTimeout(() => setGenerating(false), 3000);
  };

  const charCount = prompt.length;
  const charLimit = 500;

  return (
    <main
      style={{
        minHeight: "100vh",
        height: "100vh",
        overflow: "hidden",
        background: `
          radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%),
          radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%),
          radial-gradient(ellipse at 50% 100%, rgba(79,70,229,0.06), transparent 40%),
          ${C.bg}
        `,
        color: C.text,
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", height: "100vh" }}>

        {/* ── Sidebar ── */}
        <aside
          style={{
            borderRight: `1px solid ${C.border}`,
            background: C.sidebar,
            padding: "18px 10px",
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "16px",
              margin: "0 auto 22px",
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))`,
              border: `1px solid ${C.border}`,
              boxShadow: `0 0 20px ${C.accentGlow}`,
            }}
          >
            <Sparkles size={20} color="#a78bfa" />
          </div>

          <div style={{ display: "grid", gap: "8px", flex: 1 }}>
            {SIDEBAR_ITEMS.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <section
          style={{
            display: "grid",
            gridTemplateRows: "52px 1fr",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              background: "rgba(255,255,255,0.01)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {[
                { icon: Grid3X3, val: "grid" },
                { icon: List, val: "list" },
              ].map(({ icon: Icon, val }) => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setAssetView(val)}
                  style={{
                    width: "34px", height: "34px", borderRadius: radius.sm,
                    border: `1px solid ${C.border}`,
                    background: assetView === val ? "rgba(255,255,255,0.08)" : "transparent",
                    color: assetView === val ? C.text : C.textMuted,
                    display: "grid", placeItems: "center", cursor: "pointer",
                    transition: "all 0.16s ease",
                  }}
                >
                  <Icon size={15} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 16px 14px", overflow: "hidden", height: "100%" }}>
            <div style={{ width: "100%", height: "100%", display: "grid", gridTemplateRows: "auto 1fr", gap: "12px" }}>

              {/* Page Header */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <div
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "7px",
                      padding: "5px 12px", borderRadius: radius.full,
                      border: `1px solid ${C.border}`, background: C.surface,
                      fontSize: "12px", color: "rgba(255,255,255,0.78)", marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "7px", height: "7px", borderRadius: "999px",
                        background: C.accent, boxShadow: `0 0 10px ${C.accent}`,
                      }}
                    />
                    AI Visual Production
                  </div>
                  <h1
                    style={{
                      fontSize: "48px", fontWeight: 800, lineHeight: 1,
                      margin: 0, letterSpacing: "-0.035em",
                      background: "linear-gradient(135deg, #fff 40%, rgba(167,139,250,0.85))",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    }}
                  >
                    Image Engine
                  </h1>
                </div>
                <div style={{ display: "flex", gap: "8px", paddingBottom: "4px" }}>
                  <motion.button
                    whileHover={{ borderColor: C.accentBorder }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      height: "36px", padding: "0 14px", borderRadius: radius.md,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: C.textMuted, fontSize: "13px", display: "inline-flex",
                      alignItems: "center", gap: "7px", cursor: "pointer", fontFamily: "inherit",
                      transition: "border-color 0.16s ease",
                    }}
                  >
                    <Clock size={13} /> History
                  </motion.button>
                  <motion.button
                    whileHover={{ borderColor: C.accentBorder }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      height: "36px", padding: "0 14px", borderRadius: radius.md,
                      border: `1px solid ${C.border}`, background: C.surface,
                      color: C.textMuted, fontSize: "13px", display: "inline-flex",
                      alignItems: "center", gap: "7px", cursor: "pointer", fontFamily: "inherit",
                      transition: "border-color 0.16s ease",
                    }}
                  >
                    <SlidersHorizontal size={13} /> Presets
                  </motion.button>
                </div>
              </div>

              {/* Main Panel */}
              <div
                style={{
                  borderRadius: radius.xl,
                  border: `1px solid ${C.border}`,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                  padding: "8px",
                  minHeight: 0,
                  height: "100%",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "380px 1fr",
                    height: "100%",
                    borderRadius: "16px",
                    border: `1px solid ${C.border}`,
                    overflow: "hidden",
                    background: "rgba(6,8,16,0.82)",
                  }}
                >

                  {/* ── Left Panel ── */}
                  <div
                    style={{
                      borderRight: `1px solid ${C.border}`,
                      background: "linear-gradient(180deg, rgba(7,9,15,0.98), rgba(9,11,17,0.98))",
                      padding: "14px",
                      display: "grid",
                      gridTemplateRows: "auto auto auto 1fr auto",
                      gap: "10px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Tab */}
                    <div
                      style={{
                        display: "flex", gap: "18px", alignItems: "center",
                        borderBottom: `1px solid ${C.border}`, paddingBottom: "12px",
                      }}
                    >
                      <div style={{ color: C.text, fontWeight: 700, fontSize: "14px", position: "relative", paddingBottom: "4px" }}>
                        Image Generation
                        <span style={{
                          position: "absolute", left: 0, bottom: "-13px",
                          width: "100%", height: "2px", borderRadius: radius.full,
                          background: `linear-gradient(90deg, ${C.indigo}, ${C.accent})`,
                        }} />
                      </div>
                    </div>

                    {/* Model Selector */}
                    <motion.button
                      whileHover={{ borderColor: C.accentBorder, background: "rgba(255,255,255,0.04)" }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: radius.md,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, display: "flex", alignItems: "center",
                        gap: "10px", cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.16s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: "10px",
                          background: "linear-gradient(135deg, #6D5CFF, #9d4edd)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "12px", color: "#fff", flexShrink: 0,
                        }}
                      >
                        V1
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Kylor V1
                        </div>
                        <div style={{ fontSize: "11.5px", color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          Consistency · free multi-reference generation
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: "10px", padding: "2px 7px", borderRadius: "6px",
                            background: "rgba(124,58,237,0.2)", border: `1px solid ${C.accentBorder}`,
                            color: "#c4b5fd",
                          }}
                        >
                          FREE
                        </div>
                        <ChevronDown size={14} color={C.textMuted} />
                      </div>
                    </motion.button>

                    {/* Image Reference Drop Zone */}
                    <DropZone onFiles={(files) => setRefs((prev) => [...prev, ...files].slice(0, 10))} />

                    {/* Prompt */}
                    <div
                      style={{
                        borderRadius: radius.md, border: `1px solid ${C.border}`,
                        background: C.surface, padding: "12px",
                        display: "grid", gridTemplateRows: "1fr auto", minHeight: 0,
                      }}
                    >
                      <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value.slice(0, charLimit))}
                        placeholder="Describe the image you want to create..."
                        style={{
                          width: "100%", border: "none", background: "transparent",
                          color: C.text, resize: "none", fontFamily: "inherit",
                          fontSize: "13.5px", lineHeight: 1.7, outline: "none",
                          height: "100%", minHeight: 0, boxSizing: "border-box",
                        }}
                      />
                      <div
                        style={{
                          display: "flex", alignItems: "center",
                          justifyContent: "space-between", marginTop: "10px",
                          paddingTop: "10px", borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <div style={{ display: "flex", gap: "6px" }}>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={{
                              height: "30px", padding: "0 12px", borderRadius: "9px",
                              border: `1px solid ${C.accentBorder}`, background: C.accentSoft,
                              color: "#a78bfa", fontSize: "12px", fontWeight: 600,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            Styles
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            style={{
                              height: "30px", padding: "0 12px", borderRadius: "9px",
                              border: `1px solid ${C.border}`, background: C.surface,
                              color: C.textMuted, fontSize: "12px",
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            Negative
                          </motion.button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "11px", color: charCount > charLimit * 0.9 ? "#f87171" : C.textDim }}>
                            {charCount}/{charLimit}
                          </span>
                          <motion.button
                            whileHover={{ background: "rgba(255,255,255,0.07)" }}
                            whileTap={{ scale: 0.92 }}
                            style={{
                              width: "32px", height: "32px", borderRadius: "10px",
                              border: `1px solid ${C.accentBorder}`, background: C.accentSoft,
                              color: "#a78bfa", display: "grid", placeItems: "center", cursor: "pointer",
                            }}
                          >
                            <Sparkles size={14} />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Settings + Generate */}
                    <div ref={panelRef} style={{ position: "relative" }}>
                      <AnimatePresence>
                        {settingsOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              position: "absolute", left: 0, right: 0, bottom: "58px",
                              zIndex: 10, borderRadius: "18px",
                              border: `1px solid ${C.border}`,
                              background: "rgba(14,16,26,0.99)",
                              backdropFilter: "blur(16px)",
                              boxShadow: "0 28px 80px rgba(0,0,0,0.5)",
                              padding: "16px",
                              display: "grid", gap: "16px",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mode</div>
                              <SegmentControl options={MODES} value={mode} onChange={setMode} />
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Aspect Ratio</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                                {RATIOS.map((item) => (
                                  <motion.button
                                    key={item}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setRatio(item)}
                                    style={{
                                      height: "34px", borderRadius: radius.sm,
                                      border: ratio === item ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`,
                                      background: ratio === item
                                        ? `linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))`
                                        : C.surface,
                                      color: ratio === item ? "white" : C.textMuted,
                                      fontSize: "12px", cursor: "pointer",
                                      fontFamily: "inherit", transition: "all 0.15s ease",
                                    }}
                                  >
                                    {item}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Output Count</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}>
                                {OUTPUTS.map((item) => (
                                  <motion.button
                                    key={item}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setOutputCount(item)}
                                    style={{
                                      height: "34px", borderRadius: radius.sm,
                                      border: outputCount === item ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`,
                                      background: outputCount === item
                                        ? `linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))`
                                        : C.surface,
                                      color: outputCount === item ? "white" : C.textMuted,
                                      fontSize: "13px", cursor: "pointer",
                                      fontFamily: "inherit", transition: "all 0.15s ease",
                                    }}
                                  >
                                    {item}
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px" }}>
                        <motion.button
                          whileHover={{ borderColor: C.borderHover }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSettingsOpen((p) => !p)}
                          style={{
                            height: "46px", padding: "0 14px", borderRadius: radius.md,
                            border: `1px solid ${C.border}`, background: "#0d0f18",
                            color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center",
                            gap: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
                            whiteSpace: "nowrap", transition: "border-color 0.15s ease",
                          }}
                        >
                          <Settings size={14} />
                          <span>{mode} · {ratio} · ×{outputCount}</span>
                          <motion.div animate={{ rotate: settingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={14} />
                          </motion.div>
                        </motion.button>

                        <motion.button
                          whileHover={{ boxShadow: `0 18px 40px rgba(124,58,237,0.38)` }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGenerate}
                          style={{
                            height: "46px", borderRadius: radius.md, border: "none",
                            background: prompt.trim()
                              ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                              : "rgba(255,255,255,0.06)",
                            color: prompt.trim() ? "white" : C.textMuted,
                            cursor: prompt.trim() ? "pointer" : "default",
                            fontSize: "14px", fontWeight: 700,
                            boxShadow: prompt.trim() ? `0 14px 32px rgba(124,58,237,0.28)` : "none",
                            display: "inline-flex", alignItems: "center",
                            justifyContent: "center", gap: "8px", fontFamily: "inherit",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {generating ? (
                              <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                  <Zap size={15} />
                                </motion.div>
                                Generating…
                              </motion.div>
                            ) : (
                              <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <Wand2 size={15} /> Generate <ChevronRight size={15} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* ── Right Panel ── */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.88)",
                      display: "grid",
                      gridTemplateRows: `${notifDismissed ? "0px" : "46px"} 50px 1fr`,
                      minHeight: 0,
                      overflow: "hidden",
                      transition: "grid-template-rows 0.24s ease",
                    }}
                  >
                    {/* Notification */}
                    <AnimatePresence>
                      {!notifDismissed && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            background: "#141620",
                            padding: "0 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.82)", fontSize: "13px" }}>
                            <Bell size={13} color={C.textMuted} />
                            <span>Turn on notifications for generation updates.</span>
                            <button
                              style={{
                                border: "none", background: "transparent", color: "#a78bfa",
                                cursor: "pointer", fontWeight: 700, fontSize: "13px", fontFamily: "inherit",
                              }}
                            >
                              Allow
                            </button>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setNotifDismissed(true)}
                            style={{
                              border: "none", background: "transparent",
                              color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center",
                            }}
                          >
                            <X size={14} />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Filter Bar */}
                    <div
                      style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", padding: "0 16px",
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {TABS.map((tab) => (
                          <motion.button
                            key={tab}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab(tab)}
                            style={{
                              height: "28px", padding: "0 12px", borderRadius: "8px",
                              border: `1px solid ${activeTab === tab ? C.border : "transparent"}`,
                              background: activeTab === tab ? "rgba(255,255,255,0.09)" : "transparent",
                              color: activeTab === tab ? C.text : C.textMuted,
                              cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit",
                              transition: "all 0.14s ease",
                            }}
                          >
                            {tab}
                          </motion.button>
                        ))}
                        <label
                          style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            marginLeft: "6px", fontSize: "12.5px", color: C.textMuted, cursor: "pointer",
                          }}
                        >
                          <input type="checkbox" style={{ accentColor: C.accent }} />
                          Favorites
                        </label>
                      </div>

                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {[
                          { icon: Grid3X3, val: "grid" },
                          { icon: List, val: "list" },
                        ].map(({ icon: Icon, val }) => (
                          <motion.button
                            key={val}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => setAssetView(val)}
                            style={{
                              width: "32px", height: "32px", borderRadius: "9px",
                              border: `1px solid ${C.border}`, background: C.surface,
                              color: assetView === val ? C.text : C.textMuted,
                              display: "grid", placeItems: "center", cursor: "pointer",
                            }}
                          >
                            <Icon size={13} />
                          </motion.button>
                        ))}
                        <motion.button
                          whileHover={{ borderColor: C.borderHover }}
                          whileTap={{ scale: 0.96 }}
                          style={{
                            height: "32px", padding: "0 12px", borderRadius: "9px",
                            border: `1px solid ${C.border}`, background: C.surface,
                            color: "rgba(255,255,255,0.8)", display: "inline-flex",
                            alignItems: "center", gap: "6px", cursor: "pointer",
                            fontSize: "12.5px", fontFamily: "inherit",
                            transition: "border-color 0.15s ease",
                          }}
                        >
                          <Folder size={13} /> Assets
                        </motion.button>
                      </div>
                    </div>

                    {/* Canvas / Gallery */}
                    <div style={{ overflow: "auto", padding: "16px", minHeight: 0 }}>
                      {generating ? (
                        // Generating state
                        <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                          <div style={{ textAlign: "center" }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                              style={{
                                width: "60px", height: "60px", borderRadius: "999px",
                                margin: "0 auto 16px", display: "grid", placeItems: "center",
                                border: `2px solid ${C.accent}`,
                                borderTopColor: "transparent",
                              }}
                            />
                            <p style={{ margin: "0 0 6px", color: C.text, fontSize: "15px", fontWeight: 600 }}>
                              Generating your images…
                            </p>
                            <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>
                              {mode} · {ratio} · {outputCount} outputs
                            </p>
                          </div>
                        </div>
                      ) : showRecent ? (
                        // Recent gallery
                        <div>
                          <div
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              marginBottom: "12px",
                            }}
                          >
                            <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>
                              Recent Generations
                            </span>
                            <button
                              style={{
                                border: "none", background: "transparent",
                                color: "#a78bfa", fontSize: "12px", cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              See all
                            </button>
                          </div>

                          {assetView === "grid" ? (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                gap: "10px",
                              }}
                            >
                              {RECENT.map((item, i) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                >
                                  <ImageCard item={item} view="grid" />
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: "grid", gap: "4px" }}>
                              {RECENT.map((item, i) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                >
                                  <ImageCard item={item} view="list" />
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Empty state
                        <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: "center", maxWidth: "300px" }}
                          >
                            <div
                              style={{
                                width: "68px", height: "68px", borderRadius: "999px",
                                margin: "0 auto 16px", display: "grid", placeItems: "center",
                                border: `1px solid ${C.border}`, background: C.surface,
                              }}
                            >
                              <ImageIcon size={28} color={C.textDim} />
                            </div>
                            <p style={{ margin: "0 0 6px", color: C.text, fontSize: "15px", fontWeight: 600 }}>
                              Ready to create
                            </p>
                            <p style={{ margin: "0 0 18px", color: C.textMuted, fontSize: "13px", lineHeight: 1.6 }}>
                              Write a prompt and hit Generate. Your creations will appear here.
                            </p>
                            <motion.button
                              whileHover={{ background: "rgba(124,58,237,0.22)" }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => textareaRef.current?.focus()}
                              style={{
                                height: "34px", padding: "0 16px", borderRadius: radius.md,
                                border: `1px solid ${C.accentBorder}`, background: C.accentSoft,
                                color: "#c4b5fd", fontSize: "13px", cursor: "pointer",
                                fontFamily: "inherit", display: "inline-flex",
                                alignItems: "center", gap: "6px", transition: "background 0.15s ease",
                              }}
                            >
                              <Plus size={13} /> Start with a prompt
                            </motion.button>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
