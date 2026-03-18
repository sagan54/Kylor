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
  Copy,
  Clock3,
  Play,
  CloudUpload,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

const SESSION_KEY = "kylor_video_cache_v1";

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

const SIDEBAR_ITEMS = [
  { label: "Home", icon: Compass, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Story", icon: Clapperboard, href: "/story" },
  { label: "Image", icon: ImageIcon, href: "/image" },
  { label: "Video", icon: Video, href: "/video", active: true },
  { label: "Consistency", icon: UserCircle2, href: "/consistency" },
  { label: "Motion", icon: Orbit, href: "#" },
  { label: "Projects", icon: FolderKanban, href: "/story" },
  { label: "Settings", icon: Settings, href: "#" },
];

const CONTENT_TABS = ["All", "Images", "Videos", "Audio"];
const VIDEO_MODES = ["Text to Video", "Image to Video", "Frame to Video"];
const QUALITIES = ["720p", "1080p", "2K HD", "4K"];
const DURATIONS = ["3 sec", "5 sec", "8 sec", "10 sec"];
const RATIOS = ["9:16", "1:1", "4:5", "16:9", "21:9"];
const FPS_OPTIONS = ["24 FPS", "30 FPS", "60 FPS"];
const OUTPUTS = [1, 2, 4];
const MOTIONS = [
  "Static",
  "Slow Push In",
  "Pull Back",
  "Orbit Shot",
  "Tracking Shot",
  "Drone Rise",
  "Handheld",
  "Tilt Up",
];

const VIDEO_GRADIENTS = [
  "linear-gradient(135deg, rgba(79,70,229,0.55), rgba(124,58,237,0.35))",
  "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(17,17,34,0.9))",
  "linear-gradient(135deg, rgba(49,46,129,0.65), rgba(79,70,229,0.4))",
  "linear-gradient(135deg, rgba(91,33,182,0.55), rgba(55,48,163,0.45))",
  "linear-gradient(135deg, rgba(67,56,202,0.6), rgba(124,58,237,0.35))",
];

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

function DropZone({ files, onFiles, label = "Drop frames or browse" }) {
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
            {label.split("browse")[0]}
            <span style={{ color: "#a78bfa" }}>browse</span>
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

function VideoOutputCard({
  group,
  isLatest,
  onDelete,
  onToggleFavorite,
  onDownload,
  onShare,
  onVariation,
  generating,
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Kylor Video</div>
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
              action: () => onToggleFavorite?.(group.id),
              active: group.starred,
              activeColor: "#fbbf24",
              activeFill: "#fbbf24",
            },
            { icon: Download, action: () => onDownload?.(group) },
            { icon: Share2, action: () => onShare?.(group) },
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px" }}>
        <div
          style={{
            position: "relative",
            minHeight: 360,
            background: VIDEO_GRADIENTS[(group.id || 0) % VIDEO_GRADIENTS.length],
            borderRight: `1px solid ${C.border}`,
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 22%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.25), transparent 28%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {[group.duration, group.ratio].filter(Boolean).map((tag) => (
              <div
                key={tag}
                style={{
                  height: 24,
                  padding: "0 10px",
                  borderRadius: radius.full,
                  background: "rgba(0,0,0,0.38)",
                  border: `1px solid rgba(255,255,255,0.12)`,
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {tag}
              </div>
            ))}
          </div>

          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 999,
              background: "rgba(0,0,0,0.38)",
              border: `1px solid rgba(255,255,255,0.18)`,
              display: "grid",
              placeItems: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <Play size={22} fill="white" color="white" />
          </div>

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
            }}
          >
            Preview
          </div>
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
            {[group.mode, group.quality, group.motion].filter(Boolean).map((tag) => (
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
            onClick={() => onDownload?.(group)}
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
            <Download size={13} /> Download video
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function VideoPage() {
  const [topTab, setTopTab] = useState("All");
  const [contentFilter, setContentFilter] = useState("Videos");
  const [assetView, setAssetView] = useState("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [mode, setMode] = useState("Text to Video");
  const [quality, setQuality] = useState("1080p");
  const [duration, setDuration] = useState("5 sec");
  const [ratio, setRatio] = useState("16:9");
  const [fps, setFps] = useState("24 FPS");
  const [motionType, setMotionType] = useState("Slow Push In");
  const [outputCount, setOutputCount] = useState(2);

  const [prompt, setPrompt] = useState("");
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [refImages, setRefImages] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [notifState, setNotifState] = useState("idle");
  const [groups, setGroups] = useState([]);
  const [generating, setGenerating] = useState(false);

  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const canvasRef = useRef(null);

  const charLimit = 600;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setGroups(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function syncCache(updated) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    } catch {}
  }

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

  function deleteGroup(groupId) {
    const next = groups.filter((g) => g.id !== groupId);
    setGroups(next);
    syncCache(next);
  }

  function toggleFavorite(groupId) {
    const next = groups.map((g) =>
      g.id === groupId ? { ...g, starred: !g.starred } : g
    );
    setGroups(next);
    syncCache(next);
  }

  async function handleDownload(group) {
    try {
      await navigator.clipboard.writeText(`Video prompt copied:\n\n${group.prompt}`);
    } catch {}
  }

  async function handleShare(group) {
    try {
      const text = `Kylor Video\n\n${group.prompt}`;
      if (navigator.share) {
        await navigator.share({ title: "Kylor Video", text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  }

  function clearAll() {
    if (!confirm("Delete all saved video generations?")) return;
    setGroups([]);
    syncCache([]);
  }

  function makeGroup(basePrompt, variationLabel = null) {
    return {
      id: Date.now() + Math.floor(Math.random() * 1000),
      prompt: variationLabel ? `${basePrompt}. ${variationLabel}` : basePrompt,
      negativePrompt: negativePrompt.trim(),
      createdAt: new Date().toISOString(),
      mode,
      quality,
      duration,
      ratio,
      fps,
      motion: motionType,
      starred: false,
    };
  }

  async function handleGenerate() {
    const basePrompt = prompt.trim();
    if (!basePrompt || generating) return;

    setGenerating(true);
    canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    const promptText = [
      basePrompt,
      negativePrompt.trim() ? `Negative: ${negativePrompt.trim()}` : null,
      `Mode: ${mode}`,
      `Motion: ${motionType}`,
      `Duration: ${duration}`,
      `Quality: ${quality}`,
      `Aspect Ratio: ${ratio}`,
      `Frame Rate: ${fps}`,
    ]
      .filter(Boolean)
      .join(". ");

    setTimeout(() => {
      const made = Array.from({ length: outputCount }, (_, i) =>
        makeGroup(promptText, outputCount > 1 ? `Variation ${i + 1}` : null)
      );

      const next = [...made, ...groups];
      setGroups(next);
      syncCache(next);
      setGenerating(false);

      if (notifState === "granted" && "Notification" in window) {
        new Notification("Kylor", {
          body: "Your video generation is complete.",
        });
      }
    }, 1800);
  }

  async function handleVariation(group, variationIndex) {
    if (generating) return;
    setGenerating(true);

    setTimeout(() => {
      const nextGroup = {
        ...group,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        starred: false,
        prompt: `${group.prompt}. Variation ${variationIndex + 1}, slightly different camera movement and framing.`,
      };

      const next = [nextGroup, ...groups];
      setGroups(next);
      syncCache(next);
      setGenerating(false);
    }, 1200);
  }

  const filteredGroups = useMemo(() => {
    if (contentFilter === "Images" || contentFilter === "Audio") return [];
    if (favoritesOnly) return groups.filter((g) => g.starred);
    return groups;
  }, [groups, contentFilter, favoritesOnly]);

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 8% 12%,rgba(79,70,229,0.13),transparent 28%),radial-gradient(ellipse at 92% 8%,rgba(124,58,237,0.11),transparent 30%),${C.bg}`,
        color: C.text,
        fontFamily: "'Inter','SF Pro Display',sans-serif",
        display: "grid",
        gridTemplateColumns: "88px 1fr",
      }}
    >
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
            width: 46,
            height: 46,
            borderRadius: 16,
            margin: "0 auto 22px",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,rgba(79,70,229,0.28),rgba(124,58,237,0.18))",
            border: `1px solid ${C.border}`,
            boxShadow: `0 0 20px ${C.accentGlow}`,
          }}
        >
          <Sparkles size={20} color="#a78bfa" />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {SIDEBAR_ITEMS.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </div>
      </aside>

      <div
        style={{
          display: "grid",
          gridTemplateRows: "48px 1fr",
          height: "100vh",
          overflow: "hidden",
        }}
      >
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
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            gridTemplateColumns: "380px 1fr",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderRight: `1px solid ${C.border}`,
              background: "linear-gradient(180deg,rgba(7,9,15,0.98),rgba(9,11,17,0.98))",
              height: "100%",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: 16,
              gap: 12,
              boxSizing: "border-box",
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
                Video Generation
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
                <div style={{ fontSize: 14, fontWeight: 700 }}>Kylor Video V1</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Motion-aware cinematic video generation
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
                  BETA
                </div>
                <ChevronDown size={14} color={C.textMuted} />
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
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

            <div style={{ flexShrink: 0 }}>
              <DropZone files={refImages} onFiles={setRefImages} label="Drop frames or browse" />
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
                  Video Prompt
                </div>

                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, charLimit))}
                  placeholder="Describe the video scene, camera motion, action, lighting, mood, and composition..."
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
                        placeholder="What to avoid: flicker, blur, distorted faces, unstable motion..."
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
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
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

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: prompt.length > charLimit * 0.9 ? "#f87171" : C.textDim,
                    }}
                  >
                    {prompt.length}/{charLimit}
                  </span>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    title="Enhance prompt"
                    onClick={() => {
                      if (prompt.trim()) {
                        setPrompt((p) => p.trim() + ", cinematic camera movement, rich lighting, premium film look");
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
                        <SegmentControl options={VIDEO_MODES} value={mode} onChange={setMode} />
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
                          Quality
                        </div>
                        <SegmentControl options={QUALITIES} value={quality} onChange={setQuality} />
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
                          Duration
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4,1fr)",
                            gap: 6,
                          }}
                        >
                          {DURATIONS.map((r) => (
                            <motion.button
                              key={r}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDuration(r)}
                              style={{
                                height: 34,
                                borderRadius: radius.sm,
                                border:
                                  duration === r
                                    ? `1px solid ${C.accentBorder}`
                                    : `1px solid ${C.border}`,
                                background:
                                  duration === r
                                    ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))"
                                    : C.surface,
                                color: duration === r ? "white" : C.textMuted,
                                fontSize: 12,
                                cursor: "pointer",
                                fontFamily: "inherit",
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
                          Aspect Ratio
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5,1fr)",
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
                          FPS
                        </div>
                        <SegmentControl options={FPS_OPTIONS} value={fps} onChange={setFps} />
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
                            gridTemplateColumns: "repeat(3,1fr)",
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
                              }}
                            >
                              {n}
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
                          Camera Motion
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {MOTIONS.map((m) => (
                            <motion.button
                              key={m}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setMotionType(m)}
                              style={{
                                height: 34,
                                padding: "0 12px",
                                borderRadius: radius.full,
                                border:
                                  motionType === m
                                    ? `1px solid ${C.accentBorder}`
                                    : `1px solid ${C.border}`,
                                background:
                                  motionType === m
                                    ? "linear-gradient(160deg,rgba(79,70,229,0.18),rgba(124,58,237,0.12))"
                                    : C.surface,
                                color: motionType === m ? "white" : C.textMuted,
                                fontSize: 12,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              {m}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10 }}>
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
                      {quality} · {ratio} · {duration}
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
                        ? { boxShadow: "0 18px 40px rgba(124,58,237,0.42)" }
                        : {}
                    }
                    whileTap={prompt.trim() && !generating ? { scale: 0.98 } : {}}
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      height: 46,
                      width: "100%",
                      borderRadius: radius.md,
                      border: "none",
                      background:
                        prompt.trim() && !generating
                          ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                          : "rgba(255,255,255,0.06)",
                      color: prompt.trim() && !generating ? "white" : C.textMuted,
                      cursor: prompt.trim() && !generating ? "pointer" : "default",
                      boxShadow:
                        prompt.trim() && !generating
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
                          <Wand2 size={15} /> Generate Video <ChevronRight size={15} />
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
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    overflow: "hidden",
                    flexShrink: 0,
                    height: 44,
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
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                borderBottom: `1px solid ${C.border}`,
                height: 48,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
                          No video projects yet
                        </p>

                        <p style={{ margin: 0, color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                          Generate some videos first. They will appear here as your saved video projects.
                        </p>
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {groups.map((group, idx) => (
                        <VideoOutputCard
                          key={group.id}
                          group={group}
                          isLatest={idx === 0}
                          generating={false}
                          onDelete={deleteGroup}
                          onToggleFavorite={toggleFavorite}
                          onDownload={handleDownload}
                          onShare={handleShare}
                          onVariation={handleVariation}
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
                              Generating your video…
                            </div>
                            <div style={{ fontSize: 12, color: C.textMuted }}>
                              {mode} · {quality} · {ratio} · {duration} · {outputCount} output
                              {outputCount > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!generating && contentFilter === "Images" && (
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
                          <ImageIcon size={26} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 4px", color: C.text, fontSize: 15, fontWeight: 600 }}>
                          Image Feed
                        </p>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: 13 }}>
                          Use the Image section for still generations.
                        </p>
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
                    (contentFilter === "All" || contentFilter === "Videos") &&
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
                            <Video size={30} color={C.textDim} />
                          </div>

                          <p style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                            Your video canvas is empty
                          </p>

                          <p
                            style={{
                              margin: "0 0 20px",
                              color: C.textMuted,
                              fontSize: 13,
                              lineHeight: 1.7,
                            }}
                          >
                            Describe your cinematic shot and hit Generate Video — your outputs will appear here.
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
                            <Plus size={13} /> Start with a video prompt
                          </motion.button>
                        </motion.div>
                      </div>
                    )}

                  {(contentFilter === "All" || contentFilter === "Videos") &&
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
                          <VideoOutputCard
                            key={group.id}
                            group={group}
                            isLatest={idx === 0 && !generating}
                            generating={generating}
                            onDelete={deleteGroup}
                            onToggleFavorite={toggleFavorite}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onVariation={handleVariation}
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
    </main>
  );
}