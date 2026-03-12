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
  Star,
  Download,
  Share2,
  Trash2,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Tokens ─────────────────────────────────────────────────────────────────
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

// ─── Data ────────────────────────────────────────────────────────────────────
const RECENT = [
  { id: 1, prompt: "Cyberpunk city at dusk", ratio: "3:4", starred: true },
  { id: 2, prompt: "Abstract fluid art", ratio: "1:1", starred: false },
  { id: 3, prompt: "Serene mountain lake", ratio: "16:9", starred: true },
  { id: 4, prompt: "Portrait, golden hour", ratio: "2:3", starred: false },
  { id: 5, prompt: "Neon Tokyo street", ratio: "3:4", starred: false },
  { id: 6, prompt: "Minimal geometric", ratio: "1:1", starred: true },
];

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

// ─── Helpers ────────────────────────────────────────────────────────────────
function getApiSize(selectedRatio) {
  switch (selectedRatio) {
    case "9:16":
    case "2:3":
    case "3:4":
      return "1024x1536";
    case "16:9":
    case "21:9":
    case "4:3":
    case "3:2":
      return "1536x1024";
    case "1:1":
    case "Auto":
    default:
      return "1024x1024";
  }
}

function getApiQuality(selectedMode) {
  switch (selectedMode) {
    case "1K SD":
      return "low";
    case "4K":
      return "high";
    case "2K HD":
    default:
      return "medium";
  }
}

// ─── Sidebar Item ────────────────────────────────────────────────────────────
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
          ? "linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))"
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
    <div>{inner}</div>
  ) : (
    <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}

// ─── Segment Control ─────────────────────────────────────────────────────────
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
                ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.13))"
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

// ─── Image Card ──────────────────────────────────────────────────────────────
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
          <div
            style={{
              fontSize: "13px",
              color: C.text,
              fontWeight: 500,
              marginBottom: "3px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.prompt}
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted }}>{item.ratio} · 2K HD</div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setStarred(!starred);
                }}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: `1px solid ${C.border}`,
                  background: "rgba(0,0,0,0.4)",
                  color: starred ? "#fbbf24" : "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Star size={13} fill={starred ? "#fbbf24" : "none"} />
              </button>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "11.5px",
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.4,
                }}
              >
                {item.prompt}
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                {[Download, Share2].map((Icon, i) => (
                  <button
                    key={i}
                    style={{
                      height: "26px",
                      padding: "0 10px",
                      borderRadius: "7px",
                      border: `1px solid ${C.border}`,
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: "inherit",
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

// ─── Drop Zone ───────────────────────────────────────────────────────────────
function DropZone({ onFiles, refCount }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
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
        gap: "12px",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(Array.from(e.target.files || []))}
      />
      <div
        style={{
          width: "34px",
          height: "34px",
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
      <div>
        <div style={{ fontSize: "13px", color: C.text, fontWeight: 500 }}>
          Drop images or <span style={{ color: "#a78bfa" }}>browse</span>
        </div>
        <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>
          PNG, JPG, WEBP · max 10 refs
        </div>
      </div>
      <div style={{ marginLeft: "auto", fontSize: "12px", color: C.textDim }}>{refCount}/10</div>
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

  const [generatedImages, setGeneratedImages] = useState([]);
  const [generationError, setGenerationError] = useState("");
  const [referenceFiles, setReferenceFiles] = useState([]);

  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReferenceFiles = useCallback((files) => {
    if (!files?.length) return;
    setReferenceFiles((prev) => [...prev, ...files].slice(0, 10));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    try {
      setGenerating(true);
      setShowRecent(false);
      setGenerationError("");
      setGeneratedImages([]);

      const size = getApiSize(ratio);
      const quality = getApiQuality(mode);

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          size,
          quality,
          n: outputCount,
          ratio,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate image");
      }

      const images = Array.isArray(data?.images)
        ? data.images
        : data?.image
        ? [data.image]
        : [];

      if (!images.length) {
        throw new Error("No image returned from API");
      }

      setGeneratedImages(images);
    } catch (error) {
      console.error("Image generation failed:", error);
      setGenerationError(error.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const charCount = prompt.length;
  const charLimit = 500;

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), ${C.bg}`,
        color: C.text,
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
        display: "grid",
        gridTemplateColumns: "88px 1fr",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          borderRight: `1px solid ${C.border}`,
          background: C.sidebar,
          padding: "18px 10px",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
            background: "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))",
            border: `1px solid ${C.border}`,
            boxShadow: `0 0 20px ${C.accentGlow}`,
          }}
        >
          <Sparkles size={20} color="#a78bfa" />
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "48px 1fr",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ── Top Nav Bar ── */}
        <div
          style={{
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {["All", "Output", "Projects"].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                style={{
                  height: "30px",
                  padding: "0 14px",
                  borderRadius: "9px",
                  border: `1px solid ${activeTab === tab ? C.accentBorder : "transparent"}`,
                  background: activeTab === tab ? C.accentSoft : "transparent",
                  color: activeTab === tab ? "#c4b5fd" : C.textMuted,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  fontWeight: activeTab === tab ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {tab}
              </motion.button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(
              ({ icon: Icon, val }) => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setAssetView(val)}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: radius.sm,
                    border: `1px solid ${C.border}`,
                    background: assetView === val ? "rgba(255,255,255,0.08)" : "transparent",
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
              whileTap={{ scale: 0.96 }}
              style={{
                height: "34px",
                padding: "0 14px",
                borderRadius: radius.sm,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: "rgba(255,255,255,0.8)",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease",
              }}
            >
              <Folder size={13} /> Assets
            </motion.button>
          </div>
        </div>

        {/* ── Full-Height Split ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* ── Left Panel ── */}
          <div
            style={{
              borderRight: `1px solid ${C.border}`,
              background: "linear-gradient(180deg, rgba(7,9,15,0.98), rgba(9,11,17,0.98))",
              padding: "16px",
              display: "grid",
              gridTemplateRows: "auto auto auto 1fr auto",
              gap: "12px",
              overflow: "hidden",
              height: "100%",
            }}
          >
            {/* Heading */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px" }}>
              <div
                style={{
                  color: C.text,
                  fontWeight: 700,
                  fontSize: "14px",
                  position: "relative",
                  display: "inline-block",
                  paddingBottom: "4px",
                }}
              >
                Image Generation
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: "-15px",
                    width: "100%",
                    height: "2px",
                    borderRadius: radius.full,
                    background: `linear-gradient(90deg, ${C.indigo}, ${C.accent})`,
                  }}
                />
              </div>
            </div>

            {/* Model Selector */}
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
                gap: "10px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.16s ease",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6D5CFF, #9d4edd)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "12px",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                V1
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Kylor V1
                </div>
                <div
                  style={{
                    fontSize: "11.5px",
                    color: C.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Consistency · free multi-reference generation
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: "10px",
                    padding: "2px 7px",
                    borderRadius: "6px",
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

            {/* Drop Zone */}
            <DropZone onFiles={handleReferenceFiles} refCount={referenceFiles.length} />

            {/* Prompt */}
            <div
              style={{
                borderRadius: radius.md,
                border: `1px solid ${C.border}`,
                background: C.surface,
                padding: "12px",
                display: "grid",
                gridTemplateRows: "1fr auto",
                minHeight: 0,
              }}
            >
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, charLimit))}
                placeholder="Describe the image you want to create..."
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  color: C.text,
                  resize: "none",
                  fontFamily: "inherit",
                  fontSize: "13.5px",
                  lineHeight: 1.7,
                  outline: "none",
                  height: "100%",
                  minHeight: 0,
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "10px",
                  paddingTop: "10px",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <div style={{ display: "flex", gap: "6px" }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    style={{
                      height: "30px",
                      padding: "0 12px",
                      borderRadius: "9px",
                      border: `1px solid ${C.accentBorder}`,
                      background: C.accentSoft,
                      color: "#a78bfa",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Styles
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    style={{
                      height: "30px",
                      padding: "0 12px",
                      borderRadius: "9px",
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.textMuted,
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Negative
                  </motion.button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      color: charCount > charLimit * 0.9 ? "#f87171" : C.textDim,
                    }}
                  >
                    {charCount}/{charLimit}
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
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
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: "58px",
                      zIndex: 10,
                      borderRadius: "18px",
                      border: `1px solid ${C.border}`,
                      background: "rgba(14,16,26,0.99)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "0 28px 80px rgba(0,0,0,0.5)",
                      padding: "16px",
                      display: "grid",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: C.textMuted,
                          marginBottom: "8px",
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
                          fontSize: "11px",
                          color: C.textMuted,
                          marginBottom: "8px",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Aspect Ratio
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                        {RATIOS.map((item) => (
                          <motion.button
                            key={item}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRatio(item)}
                            style={{
                              height: "34px",
                              borderRadius: radius.sm,
                              border:
                                ratio === item
                                  ? `1px solid ${C.accentBorder}`
                                  : `1px solid ${C.border}`,
                              background:
                                ratio === item
                                  ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))"
                                  : C.surface,
                              color: ratio === item ? "white" : C.textMuted,
                              fontSize: "12px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {item}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: C.textMuted,
                          marginBottom: "8px",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Output Count
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }}>
                        {OUTPUTS.map((item) => (
                          <motion.button
                            key={item}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setOutputCount(item)}
                            style={{
                              height: "34px",
                              borderRadius: radius.sm,
                              border:
                                outputCount === item
                                  ? `1px solid ${C.accentBorder}`
                                  : `1px solid ${C.border}`,
                              background:
                                outputCount === item
                                  ? "linear-gradient(160deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))"
                                  : C.surface,
                              color: outputCount === item ? "white" : C.textMuted,
                              fontSize: "13px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s ease",
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
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: radius.md,
                    border: `1px solid ${C.border}`,
                    background: "#0d0f18",
                    color: "rgba(255,255,255,0.85)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    transition: "border-color 0.15s ease",
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
                    prompt.trim() && !generating
                      ? { boxShadow: "0 18px 40px rgba(124,58,237,0.38)" }
                      : {}
                  }
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  style={{
                    height: "46px",
                    borderRadius: radius.md,
                    border: "none",
                    background:
                      prompt.trim() && !generating
                        ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        : "rgba(255,255,255,0.06)",
                    color: prompt.trim() && !generating ? "white" : C.textMuted,
                    cursor: prompt.trim() && !generating ? "pointer" : "default",
                    fontSize: "14px",
                    fontWeight: 700,
                    boxShadow:
                      prompt.trim() && !generating
                        ? "0 14px 32px rgba(124,58,237,0.28)"
                        : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontFamily: "inherit",
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

          {/* ── Right Panel — full height output ── */}
          <div
            style={{
              background: "rgba(4,5,12,0.95)",
              display: "grid",
              gridTemplateRows: `${notifDismissed ? "0px" : "44px"} 48px 1fr`,
              height: "100%",
              overflow: "hidden",
              transition: "grid-template-rows 0.24s ease",
            }}
          >
            {/* Notification */}
            <AnimatePresence>
              {!notifDismissed && (
                <motion.div
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: "#12141e",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "rgba(255,255,255,0.75)",
                      fontSize: "13px",
                    }}
                  >
                    <Bell size={13} color={C.textMuted} />
                    <span>Turn on notifications for generation updates.</span>
                    <button
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a78bfa",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                    >
                      Allow
                    </button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNotifDismissed(true)}
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
            </AnimatePresence>

            {/* Filter Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {["All", "Images", "Videos", "Audio"].map((tab, i) => (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: `1px solid ${i === 0 ? C.border : "transparent"}`,
                      background: i === 0 ? "rgba(255,255,255,0.09)" : "transparent",
                      color: i === 0 ? C.text : C.textMuted,
                      cursor: "pointer",
                      fontSize: "12.5px",
                      fontFamily: "inherit",
                      transition: "all 0.14s ease",
                    }}
                  >
                    {tab}
                  </motion.button>
                ))}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginLeft: "6px",
                    fontSize: "12.5px",
                    color: C.textMuted,
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" style={{ accentColor: C.accent }} /> Favorites
                </label>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(
                  ({ icon: Icon, val }) => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setAssetView(val)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9px",
                        border: `1px solid ${C.border}`,
                        background: assetView === val ? "rgba(255,255,255,0.08)" : C.surface,
                        color: assetView === val ? C.text : C.textMuted,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={13} />
                    </motion.button>
                  )
                )}

                <motion.button
                  whileHover={{ borderColor: C.borderHover }}
                  style={{
                    height: "32px",
                    padding: "0 12px",
                    borderRadius: "9px",
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: "rgba(255,255,255,0.8)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "12.5px",
                    fontFamily: "inherit",
                  }}
                >
                  <Folder size={13} /> Assets
                </motion.button>
              </div>
            </div>

            {/* Canvas */}
            <div style={{ overflow: "auto", padding: "20px", minHeight: 0, height: "100%" }}>
              {generating ? (
                <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "999px",
                        margin: "0 auto 16px",
                        border: `2px solid ${C.accent}`,
                        borderTopColor: "transparent",
                      }}
                    />
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: C.text,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      Generating your images…
                    </p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>
                      {mode} · {ratio} · {outputCount} outputs
                    </p>
                  </div>
                </div>
              ) : generationError ? (
                <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: "center", maxWidth: "360px" }}
                  >
                    <div
                      style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "999px",
                        margin: "0 auto 16px",
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid rgba(248,113,113,0.25)`,
                        background: "rgba(248,113,113,0.08)",
                      }}
                    >
                      <X size={26} color="#f87171" />
                    </div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: C.text,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      Generation failed
                    </p>
                    <p
                      style={{
                        margin: "0 0 18px",
                        color: C.textMuted,
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      {generationError}
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleGenerate}
                      style={{
                        height: "34px",
                        padding: "0 16px",
                        borderRadius: radius.md,
                        border: `1px solid ${C.accentBorder}`,
                        background: C.accentSoft,
                        color: "#c4b5fd",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Wand2 size={13} /> Try again
                    </motion.button>
                  </motion.div>
                </div>
              ) : generatedImages.length > 0 ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>
                      Generated Output
                    </span>
                    <button
                      onClick={() => {
                        setGeneratedImages([]);
                        setShowRecent(true);
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a78bfa",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Clear
                    </button>
                  </div>

                  {assetView === "grid" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {generatedImages.map((img, i) => (
                        <motion.div
                          key={`${img}-${i}`}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          style={{
                            borderRadius: radius.xl,
                            border: `1px solid ${C.border}`,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.02)",
                            boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: ratio === "Auto" ? "1 / 1" : ratio.replace(":", "/"),
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <img
                              src={img}
                              alt={`Generated image ${i + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              padding: "10px 12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                              borderTop: `1px solid ${C.border}`,
                              background: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: C.text,
                                  fontWeight: 600,
                                  marginBottom: "2px",
                                }}
                              >
                                Kylor Output {i + 1}
                              </div>
                              <div style={{ fontSize: "11px", color: C.textMuted }}>
                                {ratio} · {mode}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <a
                                href={img}
                                download={`kylor-output-${i + 1}.png`}
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
                                <Download size={13} />
                              </a>
                              <button
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
                                <Share2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {generatedImages.map((img, i) => (
                        <motion.div
                          key={`${img}-list-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr auto",
                            gap: "14px",
                            alignItems: "center",
                            padding: "10px",
                            borderRadius: radius.lg,
                            border: `1px solid ${C.border}`,
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div
                            style={{
                              width: "120px",
                              aspectRatio: "1 / 1",
                              borderRadius: radius.md,
                              overflow: "hidden",
                              background: "rgba(255,255,255,0.03)",
                            }}
                          >
                            <img
                              src={img}
                              alt={`Generated image ${i + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                color: C.text,
                                fontWeight: 600,
                                marginBottom: "4px",
                              }}
                            >
                              Kylor Output {i + 1}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: C.textMuted,
                                lineHeight: 1.5,
                                marginBottom: "4px",
                              }}
                            >
                              {prompt}
                            </div>
                            <div style={{ fontSize: "11px", color: C.textDim }}>
                              {ratio} · {mode}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "6px" }}>
                            <a
                              href={img}
                              download={`kylor-output-${i + 1}.png`}
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
                              <Download size={13} />
                            </a>
                            <button
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
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : showRecent ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>
                      Recent Generations
                    </span>
                    <button
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#a78bfa",
                        fontSize: "12px",
                        cursor: "pointer",
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
                        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                        gap: "12px",
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
                <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: "center", maxWidth: "300px" }}
                  >
                    <div
                      style={{
                        width: "68px",
                        height: "68px",
                        borderRadius: "999px",
                        margin: "0 auto 16px",
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                      }}
                    >
                      <ImageIcon size={28} color={C.textDim} />
                    </div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        color: C.text,
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      Ready to create
                    </p>
                    <p
                      style={{
                        margin: "0 0 18px",
                        color: C.textMuted,
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      Write a prompt and hit Generate. Your creations will appear here.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => textareaRef.current?.focus()}
                      style={{
                        height: "34px",
                        padding: "0 16px",
                        borderRadius: radius.md,
                        border: `1px solid ${C.accentBorder}`,
                        background: C.accentSoft,
                        color: "#c4b5fd",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
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
    </main>
  );
}