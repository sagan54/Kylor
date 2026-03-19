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
  ChevronRight,
  X,
  Download,
  Share2,
  Trash2,
  Music,
  Check,
  Copy,
  Play,
  Clock3,
  ImagePlus,
  Wand2,
  History,
  PanelsTopLeft,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";

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
  panel: "rgba(10,12,18,0.92)",
  panel2: "rgba(255,255,255,0.02)",
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

const CREATE_TABS = ["Create Video", "Edit Video", "Motion Control"];
const RIGHT_TABS = ["History", "How it works"];
const PRESETS = [
  { id: 1, title: "Tracking", sub: "Dynamic follow movement" },
  { id: 2, title: "Flock", sub: "Organic chaotic motion" },
  { id: 3, title: "Corporate", sub: "Minimal smooth camera" },
];
const RESULT_TAGS = ["5s", "16:9", "720p"];
const DURATIONS = ["5s", "8s", "10s"];
const RATIOS = ["Auto", "9:16", "2:3", "3:4", "1:1", "4:3", "3:2", "16:9", "21:9"];
const RESOLUTIONS = ["720p", "1080p"];

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

function PillButton({ active, onClick, children }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        height: 34,
        padding: "0 12px",
        borderRadius: radius.full,
        border: `1px solid ${active ? C.accentBorder : C.border}`,
        background: active ? C.accentSoft : C.surface,
        color: active ? C.text : C.textMuted,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {children}
    </motion.button>
  );
}

function SmallToggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        border: `1px solid ${checked ? C.accentBorder : C.border}`,
        background: checked ? C.accentSoft : "rgba(255,255,255,0.05)",
        padding: 2,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: checked ? "#c4b5fd" : "rgba(255,255,255,0.7)",
          transform: `translateX(${checked ? 20 : 0}px)`,
          transition: "transform 0.18s ease",
        }}
      />
    </button>
  );
}

function FrameUploadCard({ title, file, onFileChange, onRemove }) {
  const inputRef = useRef(null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 18,
        border: `1px solid ${C.border}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015))",
        minHeight: 126,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          onFileChange?.(selected);
          e.target.value = "";
        }}
      />

      {file && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          <X size={11} />
        </button>
      )}

      <div />

      <div style={{ display: "grid", placeItems: "center", gap: 10, paddingBottom: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "rgba(255,255,255,0.03)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {file ? (
            <img
              src={URL.createObjectURL(file)}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <ImagePlus size={18} color="rgba(255,255,255,0.72)" />
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: C.textMuted }}>{title}</div>
          {file && (
            <div
              style={{
                fontSize: 10.5,
                color: "#c4b5fd",
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 110,
              }}
            >
              {file.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SegmentControl({ options, value, onChange, columns }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns || options.length},1fr)`,
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
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(opt)}
            style={{
              height: 36,
              borderRadius: radius.sm,
              border: active ? `1px solid ${C.accentBorder}` : "1px solid transparent",
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

export default function VideoPage() {
  const [createTab, setCreateTab] = useState("Create Video");
  const [rightTab, setRightTab] = useState("How it works");
  const [notifState, setNotifState] = useState("idle");

  const [model] = useState("Kylor 1.0");
  const [duration, setDuration] = useState("5s");
  const [ratio, setRatio] = useState("16:9");
  const [quality, setQuality] = useState("720p");

  const [multiShot, setMultiShot] = useState(false);
  const [enhanceOn, setEnhanceOn] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [negativeOpen, setNegativeOpen] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(2);
  const [generating, setGenerating] = useState(false);

  const [startFrame, setStartFrame] = useState(null);
  const [endFrame, setEndFrame] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const promptRef = useRef(null);
  const settingsRef = useRef(null);

  const presetGradients = useMemo(
    () => [
      "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(124,58,237,0.05), rgba(255,255,255,0.015))",
      "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.10), rgba(255,255,255,0.03))",
      "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(79,70,229,0.06), rgba(255,255,255,0.015))",
    ],
    []
  );

  useEffect(() => {
    function handleOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

  function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    setTimeout(() => {
      setGenerating(false);
      if (notifState === "granted" && "Notification" in window) {
        new Notification("Kylor", {
          body: "Your video job has been queued.",
        });
      }
    }, 1800);
  }

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
          height: "100vh",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "1fr",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <section
            style={{
              borderRight: `1px solid ${C.border}`,
              background: "linear-gradient(180deg,rgba(8,10,16,0.98),rgba(9,11,17,0.98))",
              padding: 10,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "12px 14px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 13,
                }}
              >
                {CREATE_TABS.map((tab) => {
                  const active = createTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setCreateTab(tab)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: active ? C.text : C.textMuted,
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        padding: 0,
                        borderBottom: active
                          ? "2px solid rgba(255,255,255,0.9)"
                          : "2px solid transparent",
                        paddingBottom: 8,
                        fontFamily: "inherit",
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: 12, display: "grid", gap: 12 }}>
                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: `1px solid ${C.border}`,
                    minHeight: 132,
                    position: "relative",
                    background:
                      "linear-gradient(145deg, rgba(79,70,229,0.16), rgba(124,58,237,0.10), rgba(255,255,255,0.02))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.10), transparent 18%), radial-gradient(circle at 75% 75%, rgba(124,58,237,0.18), transparent 24%)",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: `1px solid ${C.accentBorder}`,
                        background: "rgba(124,58,237,0.10)",
                        color: "#c4b5fd",
                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      <Video size={11} />
                      VIDEO CORE
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#c4b5fd",
                        fontWeight: 800,
                        marginBottom: 2,
                      }}
                    >
                      Kylor motion preset
                    </div>
                    <div style={{ fontSize: 15, color: C.text, fontWeight: 800 }}>{model}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                      Optimized for cinematic scene movement
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <FrameUploadCard
                    title="Start frame"
                    file={startFrame}
                    onFileChange={setStartFrame}
                    onRemove={() => setStartFrame(null)}
                  />
                  <FrameUploadCard
                    title="End frame"
                    file={endFrame}
                    onFileChange={setEndFrame}
                    onRemove={() => setEndFrame(null)}
                  />
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: `1px solid ${C.border}`,
                    background: C.panel2,
                    padding: 12,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: C.textMuted }}>Multi-shot</span>
                      <div
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: 999,
                          border: `1px solid ${C.border}`,
                          color: C.textDim,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 10,
                        }}
                      >
                        i
                      </div>
                    </div>
                    <SmallToggle checked={multiShot} onChange={setMultiShot} />
                  </div>

                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='Describe your video, like "A woman walking through a neon-lit city". Add elements using @'
                    style={{
                      width: "100%",
                      minHeight: 116,
                      resize: "none",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: C.text,
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      fontFamily: "inherit",
                    }}
                  />

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
                            marginTop: 2,
                            paddingTop: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "#f87171",
                              marginBottom: 8,
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
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <PillButton active={enhanceOn} onClick={() => setEnhanceOn(!enhanceOn)}>
                        <Wand2 size={12} style={{ marginRight: 6 }} />
                        Enhance on
                      </PillButton>
                      <PillButton active={true} onClick={() => {}}>
                        <Music size={12} style={{ marginRight: 6 }} />
                        On
                      </PillButton>
                      <PillButton active={false} onClick={() => {}}>
                        @ Elements
                      </PillButton>
                    </div>

                    <button
                      onClick={() => setNegativeOpen((p) => !p)}
                      style={{
                        height: 34,
                        padding: "0 12px",
                        borderRadius: radius.full,
                        border: `1px solid ${
                          negativeOpen || negativePrompt ? "rgba(248,113,113,0.3)" : C.border
                        }`,
                        background:
                          negativeOpen || negativePrompt
                            ? "rgba(248,113,113,0.08)"
                            : C.surface,
                        color: negativeOpen || negativePrompt ? "#fca5a5" : C.textMuted,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Negative{negativePrompt ? " ✓" : ""}
                    </button>
                  </div>
                </div>

                <div style={{ position: "relative" }} ref={settingsRef}>
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
                            Resolution
                          </div>
                          <SegmentControl
                            options={RESOLUTIONS}
                            value={quality}
                            onChange={setQuality}
                            columns={2}
                          />
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
                          <SegmentControl
                            options={DURATIONS}
                            value={duration}
                            onChange={setDuration}
                            columns={3}
                          />
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
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {r}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: "grid", gap: 10 }}>
  <motion.button
    whileHover={{ borderColor: C.borderHover }}
    whileTap={{ scale: 0.97 }}
    onClick={() => setSettingsOpen((p) => !p)}
    style={{
      height: 46,
      width: "100%",
      padding: "0 14px",
      borderRadius: radius.md,
      border: `1px solid ${settingsOpen ? C.accentBorder : C.border}`,
      background: settingsOpen ? C.accentSoft : "#0d0f18",
      color: "rgba(255,255,255,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "inherit",
      transition: "all 0.15s ease",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <Settings size={14} />
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {quality} · {ratio} · {duration}
      </span>
    </div>

    <motion.div
      animate={{ rotate: settingsOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      style={{ flexShrink: 0 }}
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
    whileTap={
      prompt.trim() && !generating
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
        prompt.trim() && !generating
          ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
          : "rgba(255,255,255,0.06)",
      color:
        prompt.trim() && !generating
          ? "white"
          : C.textMuted,
      cursor:
        prompt.trim() && !generating
          ? "pointer"
          : "default",
      boxShadow:
        prompt.trim() && !generating
          ? "0 10px 28px rgba(124,58,237,0.28)"
          : "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: "inherit",
      fontSize: 15,
      fontWeight: 700,
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
          </section>

          <section
            style={{
              overflowY: "auto",
              padding: 10,
              background: "rgba(5,7,12,0.92)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {RIGHT_TABS.map((tab) => {
                const active = rightTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    style={{
                      height: 34,
                      padding: "0 14px",
                      borderRadius: 12,
                      border: `1px solid ${active ? C.border : "transparent"}`,
                      background: active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                      color: active ? C.text : C.textMuted,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {tab === "History" ? <History size={13} /> : <PanelsTopLeft size={13} />}
                    {tab}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {rightTab === "How it works" ? (
                <motion.div
                  key="how"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  style={{
                    borderRadius: 26,
                    border: `1px solid ${C.border}`,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.015))",
                    padding: 30,
                    minHeight: "calc(100vh - 40px)",
                  }}
                >
                  <div style={{ marginBottom: 28 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: `1px solid ${C.accentBorder}`,
                        background: C.accentSoft,
                        color: "#c4b5fd",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginBottom: 14,
                      }}
                    >
                      <Sparkles size={12} />
                      Kylor Video Studio
                    </div>

                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        lineHeight: 1.08,
                        color: C.text,
                        marginBottom: 10,
                        letterSpacing: "-0.03em",
                        maxWidth: 760,
                      }}
                    >
                      Direct cinematic motion with frames, presets, and scene control
                    </div>

                    <div
                      style={{
                        fontSize: 15,
                        color: C.textMuted,
                        lineHeight: 1.7,
                        maxWidth: 860,
                      }}
                    >
                      Build AI video shots inside Kylor’s production workflow — from reference
                      frames and camera behavior to final rendered motion.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.15fr 0.95fr 1fr",
                      gap: 24,
                      alignItems: "stretch",
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 24,
                        border: `1px solid ${C.border}`,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(124,58,237,0.035), rgba(255,255,255,0.015))",
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 420,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
                          Scene Setup
                        </div>
                        <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.7 }}>
                          Start with a reference frame or build from prompt. Lock the visual base
                          before motion is applied.
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 18,
                          borderRadius: 22,
                          border: `1px dashed ${C.border}`,
                          minHeight: 220,
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(255,255,255,0.015)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08), transparent 20%), radial-gradient(circle at 70% 80%, rgba(124,58,237,0.16), transparent 28%)",
                          }}
                        />
                        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 16,
                              margin: "0 auto 14px",
                              border: `1px solid ${C.border}`,
                              background: "rgba(255,255,255,0.03)",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <ImagePlus size={24} />
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                            Upload Frame
                          </div>
                          <div style={{ fontSize: 13.5, color: C.textMuted }}>
                            Drag image, paste from clipboard, or start from prompt
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 18,
                          display: "grid",
                          gridTemplateColumns: "repeat(3,1fr)",
                          gap: 10,
                        }}
                      >
                        {["Frame", "Character", "Style"].map((item) => (
                          <div
                            key={item}
                            style={{
                              borderRadius: 14,
                              border: `1px solid ${C.border}`,
                              background: "rgba(255,255,255,0.02)",
                              padding: "12px 10px",
                              textAlign: "center",
                              fontSize: 12.5,
                              color: C.textMuted,
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 24,
                        border: `1px solid ${C.border}`,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(124,58,237,0.03), rgba(255,255,255,0.015))",
                        padding: 20,
                        minHeight: 420,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
                        Motion Design
                      </div>
                      <div
                        style={{
                          fontSize: 13.5,
                          color: C.textMuted,
                          lineHeight: 1.7,
                          marginBottom: 18,
                        }}
                      >
                        Choose how the shot behaves — tracking, drift, orbit, or controlled cinematic motion.
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {PRESETS.map((preset, idx) => {
                          const active = selectedPreset === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => setSelectedPreset(preset.id)}
                              style={{
                                borderRadius: 18,
                                border: `1px solid ${active ? C.accentBorder : C.border}`,
                                background: active
                                  ? "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(124,58,237,0.12))"
                                  : presetGradients[idx],
                                padding: 14,
                                textAlign: "left",
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                                  {preset.title}
                                </div>
                                {active && <Check size={14} color="#c4b5fd" />}
                              </div>
                              <div
                                style={{
                                  fontSize: 12.5,
                                  color: C.textMuted,
                                  marginTop: 6,
                                  lineHeight: 1.6,
                                }}
                              >
                                {preset.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 24,
                        border: `1px solid ${C.border}`,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(124,58,237,0.03), rgba(255,255,255,0.015))",
                        padding: 20,
                        minHeight: 420,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>
                          Render Preview
                        </div>
                        <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.7 }}>
                          Final output preview with your selected frame, preset, and scene motion.
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 20,
                          borderRadius: 24,
                          border: `1px solid ${C.border}`,
                          background:
                            "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.08), rgba(255,255,255,0.02), rgba(5,7,12,0.35))",
                          aspectRatio: "16/10",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 14,
                            borderRadius: 18,
                            border: "2px solid rgba(255,255,255,0.82)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: 16,
                            right: 16,
                            bottom: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", gap: 6 }}>
                            {["Preview", quality].map((tag) => (
                              <div
                                key={tag}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  background: "rgba(0,0,0,0.36)",
                                  border: `1px solid rgba(255,255,255,0.12)`,
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.84)",
                                }}
                              >
                                {tag}
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 999,
                              background: "rgba(0,0,0,0.38)",
                              border: `1px solid rgba(255,255,255,0.14)`,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Play size={15} fill="white" color="white" />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["Prompt-led", "Motion preset", "Render ready"].map((tag) => (
                          <div
                            key={tag}
                            style={{
                              padding: "7px 12px",
                              borderRadius: 999,
                              border: `1px solid ${C.border}`,
                              background: "rgba(255,255,255,0.03)",
                              fontSize: 12,
                              color: C.textMuted,
                            }}
                          >
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  style={{
                    borderRadius: 26,
                    border: `1px solid ${C.border}`,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.015))",
                    padding: 24,
                    minHeight: "calc(100vh - 40px)",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 18 }}>
                    Recent Video Jobs
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        style={{
                          borderRadius: 20,
                          border: `1px solid ${C.border}`,
                          background: "rgba(255,255,255,0.02)",
                          overflow: "hidden",
                          display: "grid",
                          gridTemplateColumns: "340px 1fr auto",
                        }}
                      >
                        <div
                          style={{
                            minHeight: 190,
                            background:
                              "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14), rgba(255,255,255,0.03))",
                            display: "grid",
                            placeItems: "center",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 999,
                              background: "rgba(0,0,0,0.35)",
                              border: `1px solid rgba(255,255,255,0.18)`,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <Play size={20} fill="white" color="white" />
                          </div>
                        </div>

                        <div style={{ padding: 16 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              marginBottom: 10,
                            }}
                          >
                            {RESULT_TAGS.map((tag) => (
                              <div
                                key={tag}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: radius.full,
                                  border: `1px solid ${C.border}`,
                                  background: "rgba(255,255,255,0.04)",
                                  fontSize: 11.5,
                                  color: "rgba(255,255,255,0.78)",
                                }}
                              >
                                {tag}
                              </div>
                            ))}
                          </div>

                          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                            Neon Alley Sequence
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: C.textMuted,
                              lineHeight: 1.7,
                              maxWidth: 620,
                            }}
                          >
                            A cinematic cyberpunk alley at night with drifting smoke, dramatic
                            camera motion, rain reflections, and premium contrast-rich lighting.
                          </div>
                        </div>

                        <div
                          style={{
                            padding: 16,
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          {[Download, Share2, Copy, Trash2].map((Icon, i) => (
                            <button
                              key={i}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                border: `1px solid ${C.border}`,
                                background: "rgba(255,255,255,0.03)",
                                color: C.textMuted,
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Icon size={14} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {notifState === "idle" && (
                <motion.div
                  key="notif-idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: "fixed",
                    right: 18,
                    top: 16,
                    zIndex: 20,
                    display: "none",
                  }}
                />
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}