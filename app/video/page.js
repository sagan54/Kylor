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
  Play,
  Film,
  SlidersHorizontal,
  Clock3,
  Layers3,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const C = {
  bg: "#0a0a0f",
  panel: "#111119",
  panel2: "#151520",
  soft: "#1b1b28",
  soft2: "#202032",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#f5f7fb",
  textSoft: "rgba(245,247,251,0.72)",
  textDim: "rgba(245,247,251,0.52)",
  accent: "#7c3aed",
  accentSoft: "rgba(124,58,237,0.16)",
  accentBorder: "rgba(124,58,237,0.36)",
  accentGlow: "rgba(124,58,237,0.28)",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
};

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: C.accentSoft,
          border: `1px solid ${C.accentBorder}`,
          color: C.text,
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div>
        <div style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>{title}</div>
        {sub ? (
          <div style={{ color: C.textDim, fontSize: 12, marginTop: 2 }}>{sub}</div>
        ) : null}
      </div>
    </div>
  );
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: `1px solid ${active ? C.accentBorder : C.border}`,
        background: active ? C.accentSoft : "rgba(255,255,255,0.03)",
        color: C.text,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function SelectCard({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          color: C.textSoft,
          fontSize: 12,
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "13px 14px",
          borderRadius: 14,
          background: C.soft,
          border: `1px solid ${C.border}`,
          color: C.text,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
        <ChevronDown size={16} style={{ opacity: 0.8 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              zIndex: 20,
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: C.panel2,
              border: `1px solid ${C.borderStrong}`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: `0 18px 40px ${C.accentGlow}`,
            }}
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  border: "none",
                  borderBottom: `1px solid ${C.border}`,
                  background: opt === value ? C.accentSoft : "transparent",
                  color: C.text,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadCard({ title, sub }) {
  return (
    <button
      style={{
        width: "100%",
        minHeight: 120,
        borderRadius: 18,
        border: `1px dashed ${C.borderStrong}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.03))",
        color: C.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 10,
        cursor: "pointer",
        padding: 16,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: C.accentSoft,
          border: `1px solid ${C.accentBorder}`,
        }}
      >
        <Upload size={18} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", lineHeight: 1.45 }}>
        {sub}
      </div>
    </button>
  );
}

function VideoCard({ item, view, onDelete }) {
  if (view === "list") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr auto",
          gap: 16,
          alignItems: "center",
          padding: 14,
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            aspectRatio: "16 / 9",
            borderRadius: 14,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.30), rgba(255,255,255,0.06), rgba(124,58,237,0.10))",
            border: `1px solid ${C.border}`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${C.borderStrong}`,
                backdropFilter: "blur(8px)",
              }}
            >
              <Play size={20} fill="white" />
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {item.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textDim,
              lineHeight: 1.55,
              marginBottom: 10,
            }}
          >
            {item.prompt}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[item.duration, item.ratio, item.style, item.motion].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "7px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.textSoft,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={iconBtnStyle}
            title="Download"
          >
            <Download size={16} />
          </button>
          <button
            style={iconBtnStyle}
            title="Share"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={onDelete}
            style={{ ...iconBtnStyle, color: "#ffb4b4" }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 9",
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.30), rgba(255,255,255,0.06), rgba(124,58,237,0.10))",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.16), transparent 30%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.22), transparent 32%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.38)",
              border: `1px solid ${C.borderStrong}`,
              backdropFilter: "blur(10px)",
            }}
          >
            <Play size={22} fill="white" />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 12,
            top: 12,
            display: "flex",
            gap: 8,
          }}
        >
          <span style={metaTag}>{item.duration}</span>
          <span style={metaTag}>{item.ratio}</span>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          {item.title}
        </div>
        <div
          style={{
            color: C.textDim,
            fontSize: 12,
            lineHeight: 1.5,
            minHeight: 36,
            marginBottom: 12,
          }}
        >
          {item.prompt}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={smallTag}>{item.style}</span>
            <span style={smallTag}>{item.motion}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={iconBtnStyle}>
              <Download size={15} />
            </button>
            <button style={iconBtnStyle}>
              <Share2 size={15} />
            </button>
            <button onClick={onDelete} style={{ ...iconBtnStyle, color: "#ffb4b4" }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const iconBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${C.border}`,
  color: C.textSoft,
  cursor: "pointer",
};

const metaTag = {
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: "white",
  background: "rgba(0,0,0,0.38)",
  border: `1px solid rgba(255,255,255,0.14)`,
  backdropFilter: "blur(10px)",
};

const smallTag = {
  padding: "6px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: C.textSoft,
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${C.border}`,
};

export default function VideoPage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState("5 sec");
  const [ratio, setRatio] = useState("16:9");
  const [quality, setQuality] = useState("1080p");
  const [style, setStyle] = useState("Cinematic");
  const [cameraMotion, setCameraMotion] = useState("Slow Push In");
  const [fps, setFps] = useState("24 FPS");
  const [generationMode, setGenerationMode] = useState("Text to Video");
  const [outputCount, setOutputCount] = useState(2);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [outputs, setOutputs] = useState([
    {
      id: 1,
      title: "Neon Alley Sequence",
      prompt:
        "A cinematic cyberpunk alley at night, rain reflections, drifting smoke, slow forward camera movement, dramatic lighting.",
      duration: "5 sec",
      ratio: "16:9",
      style: "Cinematic",
      motion: "Slow Push In",
    },
    {
      id: 2,
      title: "Desert Chase Frame",
      prompt:
        "Epic desert vehicle sequence with dust, heat haze, golden-hour sun, dynamic tracking shot, high-end film aesthetic.",
      duration: "8 sec",
      ratio: "21:9",
      style: "Epic",
      motion: "Tracking Shot",
    },
  ]);

  const promptIdeas = useMemo(
    () => [
      "A lone astronaut walking through a frozen alien valley, cinematic lighting, slow camera drift",
      "A luxury perfume bottle floating in black liquid with glossy reflections and macro movement",
      "A warrior standing on a cliff during a storm, cape moving in the wind, dramatic push in",
    ],
    []
  );

  const sidebarItems = [
    { label: "Home", icon: Sparkles, href: "/" },
    { label: "Explore", icon: Compass, href: "/explore" },
    { label: "Story", icon: Clapperboard, href: "/story" },
    { label: "Image", icon: ImageIcon, href: "/image" },
    { label: "Video", icon: Video, href: "/video", active: true },
    { label: "Characters", icon: UserCircle2, href: "/characters" },
    { label: "Worlds", icon: Orbit, href: "/worlds" },
    { label: "Projects", icon: FolderKanban, href: "/projects" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  function handleGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    setTimeout(() => {
      const newItems = Array.from({ length: outputCount }).map((_, i) => ({
        id: Date.now() + i,
        title: `Kylor Video ${outputs.length + i + 1}`,
        prompt,
        duration,
        ratio,
        style,
        motion: cameraMotion,
      }));

      setOutputs((prev) => [...newItems, ...prev]);
      setIsGenerating(false);
    }, 1800);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(124,58,237,0.12), transparent 20%), linear-gradient(180deg, #09090d 0%, #0b0b12 100%)",
        color: C.text,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "270px 1fr",
          minHeight: "100vh",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            borderRight: `1px solid ${C.border}`,
            padding: 18,
            position: "sticky",
            top: 0,
            height: "100vh",
            background: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
              padding: "10px 8px",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: C.accentSoft,
                border: `1px solid ${C.accentBorder}`,
                boxShadow: `0 0 0 6px rgba(124,58,237,0.08)`,
              }}
            >
              <Film size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.2 }}>Kylor</div>
              <div style={{ fontSize: 12, color: C.textDim }}>Video Engine</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 16,
                    textDecoration: "none",
                    color: item.active ? C.text : C.textSoft,
                    background: item.active ? C.accentSoft : "transparent",
                    border: `1px solid ${item.active ? C.accentBorder : "transparent"}`,
                    fontSize: 14,
                    fontWeight: 700,
                    transition: "0.2s ease",
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.active ? <ChevronRight size={16} style={{ marginLeft: "auto" }} /> : null}
                </Link>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 22,
              padding: 16,
              borderRadius: 20,
              background: "linear-gradient(180deg, rgba(124,58,237,0.12), rgba(255,255,255,0.03))",
              border: `1px solid ${C.accentBorder}`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Kylor Pro Video</div>
            <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.55, marginBottom: 12 }}>
              Generate cinematic AI videos with motion control, references, and premium output flow.
            </div>
            <button
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 14,
                border: `1px solid ${C.accentBorder}`,
                background: C.accentSoft,
                color: C.text,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Upgrade
            </button>
          </div>
        </aside>

        {/* Main */}
        <section style={{ padding: 22 }}>
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3 }}>
                Video Generation
              </div>
              <div style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>
                Create cinematic AI videos with prompt-based direction and motion controls.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setNotificationsOn((p) => !p)}
                style={iconBtnStyle}
                title="Notifications"
              >
                {notificationsOn ? <Bell size={16} /> : <BellOff size={16} />}
              </button>

              <button
                onClick={() => setSettingsOpen((p) => !p)}
                style={{
                  ...iconBtnStyle,
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: settingsOpen ? C.accentSoft : "rgba(255,255,255,0.03)",
                  border: `1px solid ${settingsOpen ? C.accentBorder : C.border}`,
                }}
                title="Quick settings"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
          </div>

          {/* Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: settingsOpen ? "1.05fr 0.95fr 340px" : "1.1fr 0.9fr",
              gap: 18,
              alignItems: "start",
            }}
          >
            {/* Left panel */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
                border: `1px solid ${C.border}`,
                borderRadius: 24,
                padding: 18,
              }}
            >
              <SectionTitle
                icon={Wand2}
                title="Prompt Director"
                sub="Describe scene, camera motion, mood, and visual style."
              />

              <div
                style={{
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                  background: C.soft,
                  overflow: "hidden",
                }}
              >
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: A cinematic tracking shot of a futuristic motorcycle racing through a neon Tokyo street at night, rain reflections, high contrast lighting, dramatic speed, ultra detailed..."
                  style={{
                    width: "100%",
                    minHeight: 180,
                    resize: "vertical",
                    padding: 16,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: C.text,
                    fontSize: 14,
                    lineHeight: 1.7,
                    fontFamily: "inherit",
                  }}
                />

                <div
                  style={{
                    padding: 12,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {promptIdeas.map((idea) => (
                      <button
                        key={idea}
                        onClick={() => setPrompt(idea)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: `1px solid ${C.border}`,
                          background: "rgba(255,255,255,0.03)",
                          color: C.textSoft,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Use idea
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: C.textDim }}>
                    {prompt.length} characters
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    color: C.textSoft,
                    fontSize: 12,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Negative Prompt
                </div>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="low quality, blurry frames, deformed faces, flicker, unstable motion, warped hands..."
                  style={{
                    width: "100%",
                    minHeight: 82,
                    resize: "vertical",
                    padding: 14,
                    background: C.soft,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    outline: "none",
                    color: C.text,
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginTop: 18 }}>
                <SectionTitle
                  icon={Layers3}
                  title="References"
                  sub="Upload image, frame, or style references for better direction."
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <UploadCard title="Character Reference" sub="Maintain character look across video shots." />
                  <UploadCard title="Style Reference" sub="Match visual language, lighting, and tone." />
                  <UploadCard title="First Frame / Scene" sub="Guide composition and starting frame." />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  style={{
                    padding: "14px 18px",
                    borderRadius: 16,
                    border: `1px solid ${C.accentBorder}`,
                    background: isGenerating
                      ? "rgba(124,58,237,0.10)"
                      : "linear-gradient(180deg, rgba(124,58,237,0.30), rgba(124,58,237,0.18))",
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: isGenerating || !prompt.trim() ? "not-allowed" : "pointer",
                    boxShadow: `0 10px 30px ${C.accentGlow}`,
                    minWidth: 180,
                  }}
                >
                  {isGenerating ? "Generating..." : "Generate Video"}
                </button>

                <button
                  style={{
                    padding: "14px 18px",
                    borderRadius: 16,
                    border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.03)",
                    color: C.text,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Preset
                </button>
              </div>
            </div>

            {/* Middle panel */}
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
                border: `1px solid ${C.border}`,
                borderRadius: 24,
                padding: 18,
              }}
            >
              <SectionTitle
                icon={Clapperboard}
                title="Generation Controls"
                sub="Dial in style, motion, ratio, quality, and timing."
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SelectCard
                  label="Mode"
                  value={generationMode}
                  onChange={setGenerationMode}
                  options={["Text to Video", "Image to Video", "Frame to Video"]}
                />
                <SelectCard
                  label="Style"
                  value={style}
                  onChange={setStyle}
                  options={["Cinematic", "Epic", "Photoreal", "Anime", "Stylized", "Luxury Ad"]}
                />
                <SelectCard
                  label="Duration"
                  value={duration}
                  onChange={setDuration}
                  options={["3 sec", "5 sec", "8 sec", "10 sec", "15 sec"]}
                />
                <SelectCard
                  label="Aspect Ratio"
                  value={ratio}
                  onChange={setRatio}
                  options={["16:9", "9:16", "1:1", "21:9", "4:5"]}
                />
                <SelectCard
                  label="Quality"
                  value={quality}
                  onChange={setQuality}
                  options={["720p", "1080p", "2K"]}
                />
                <SelectCard
                  label="Frame Rate"
                  value={fps}
                  onChange={setFps}
                  options={["24 FPS", "30 FPS", "60 FPS"]}
                />
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: C.textSoft,
                    fontSize: 12,
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  Camera Motion
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {[
                    "Static",
                    "Slow Push In",
                    "Pull Back",
                    "Orbit Shot",
                    "Tracking Shot",
                    "Drone Rise",
                    "Handheld",
                    "Tilt Up",
                  ].map((m) => (
                    <PillButton
                      key={m}
                      active={cameraMotion === m}
                      onClick={() => setCameraMotion(m)}
                    >
                      {m}
                    </PillButton>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    color: C.textSoft,
                    fontSize: 12,
                    marginBottom: 10,
                    fontWeight: 600,
                  }}
                >
                  Outputs
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[1, 2, 4].map((n) => (
                    <PillButton
                      key={n}
                      active={outputCount === n}
                      onClick={() => setOutputCount(n)}
                    >
                      {n} Output{n > 1 ? "s" : ""}
                    </PillButton>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  borderRadius: 20,
                  border: `1px solid ${C.border}`,
                  background: C.soft,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Clock3 size={16} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Estimated Cost / Load</div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={statsRow}>
                    <span style={statsLabel}>Render Time</span>
                    <span style={statsValue}>
                      {duration === "3 sec"
                        ? "~30s"
                        : duration === "5 sec"
                        ? "~45s"
                        : duration === "8 sec"
                        ? "~70s"
                        : "~90s+"}
                    </span>
                  </div>
                  <div style={statsRow}>
                    <span style={statsLabel}>Quality Tier</span>
                    <span style={statsValue}>{quality}</span>
                  </div>
                  <div style={statsRow}>
                    <span style={statsLabel}>Generation Type</span>
                    <span style={statsValue}>{generationMode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right settings */}
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
                    border: `1px solid ${C.border}`,
                    borderRadius: 24,
                    padding: 18,
                  }}
                >
                  <SectionTitle
                    icon={Settings}
                    title="Quick Settings"
                    sub="Fast toggles for premium generation workflow."
                  />

                  <div style={{ display: "grid", gap: 12 }}>
                    {[
                      "Enable motion stabilization",
                      "Improve face consistency",
                      "Use cinematic color grade",
                      "Lock scene composition",
                      "Prioritize detail over speed",
                    ].map((label, i) => (
                      <label
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "13px 14px",
                          borderRadius: 16,
                          border: `1px solid ${C.border}`,
                          background: "rgba(255,255,255,0.03)",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 13, color: C.textSoft, fontWeight: 600 }}>
                          {label}
                        </span>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            display: "grid",
                            placeItems: "center",
                            background: i < 2 ? C.accentSoft : "transparent",
                            border: `1px solid ${i < 2 ? C.accentBorder : C.borderStrong}`,
                          }}
                        >
                          {i < 2 ? <Check size={13} /> : null}
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setSettingsOpen(false)}
                    style={{
                      marginTop: 16,
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.03)",
                      color: C.text,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Close Panel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Outputs */}
          <div
            style={{
              marginTop: 18,
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
              borderRadius: 24,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <SectionTitle
                icon={Play}
                title="Generated Videos"
                sub="Your recent AI video outputs."
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setAssetView("grid")}
                  style={{
                    ...iconBtnStyle,
                    background: assetView === "grid" ? C.accentSoft : "rgba(255,255,255,0.03)",
                    border: `1px solid ${assetView === "grid" ? C.accentBorder : C.border}`,
                  }}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setAssetView("list")}
                  style={{
                    ...iconBtnStyle,
                    background: assetView === "list" ? C.accentSoft : "rgba(255,255,255,0.03)",
                    border: `1px solid ${assetView === "list" ? C.accentBorder : C.border}`,
                  }}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {isGenerating && (
              <div
                style={{
                  marginBottom: 16,
                  borderRadius: 18,
                  border: `1px solid ${C.accentBorder}`,
                  background: "linear-gradient(180deg, rgba(124,58,237,0.12), rgba(255,255,255,0.03))",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Zap size={16} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Kylor is generating your video...
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1.4 }}
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.65), rgba(168,85,247,0.95))",
                    }}
                  />
                </div>
              </div>
            )}

            {outputs.length === 0 ? (
              <div
                style={{
                  minHeight: 280,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 22,
                  border: `1px dashed ${C.borderStrong}`,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 18,
                      display: "grid",
                      placeItems: "center",
                      margin: "0 auto 12px",
                      background: C.accentSoft,
                      border: `1px solid ${C.accentBorder}`,
                    }}
                  >
                    <Video size={22} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                    No videos yet
                  </div>
                  <div style={{ fontSize: 13, color: C.textDim }}>
                    Your generated video outputs will appear here.
                  </div>
                </div>
              </div>
            ) : assetView === "grid" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 14,
                }}
              >
                {outputs.map((item) => (
                  <VideoCard
                    key={item.id}
                    item={item}
                    view="grid"
                    onDelete={() => setOutputs((prev) => prev.filter((x) => x.id !== item.id))}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {outputs.map((item) => (
                  <VideoCard
                    key={item.id}
                    item={item}
                    view="list"
                    onDelete={() => setOutputs((prev) => prev.filter((x) => x.id !== item.id))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const statsRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const statsLabel = {
  color: "rgba(245,247,251,0.62)",
  fontSize: 12,
  fontWeight: 600,
};

const statsValue = {
  color: "#f5f7fb",
  fontSize: 12,
  fontWeight: 800,
};