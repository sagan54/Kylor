"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#7c3aed";
const ACCENT_SOFT = "rgba(124,58,237,0.15)";
const ACCENT_BORDER = "rgba(124,58,237,0.35)";
const ACCENT_GLOW = "rgba(124,58,237,0.25)";
const INDIGO = "#4f46e5";
const CYAN = "#06b6d4";
const CYAN_GLOW = "rgba(6,182,212,0.35)";
const CYAN_SOFT = "rgba(6,182,212,0.15)";
const BG = "#05070c";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_HOVER = "rgba(255,255,255,0.13)";
const SURFACE = "rgba(255,255,255,0.03)";
const SURFACE_HOVER = "rgba(255,255,255,0.055)";
const TEXT_MUTED = "rgba(255,255,255,0.52)";
const TEXT_DIM = "rgba(255,255,255,0.32)";

const DURATION_OPTIONS = ["4s", "8s", "16s"];
const RESOLUTION_OPTIONS = ["720p", "1080p", "4K"];
const MODES = ["Image", "Video"];

// ─── Error Normalizer ─────────────────────────────────────────────────────────
function friendlyError(raw) {
  if (!raw) return "Generation failed. Please try again.";
  const s = typeof raw === "string" ? raw : JSON.stringify(raw);
  // 402 / insufficient credit
  if (s.includes("402") || s.toLowerCase().includes("insufficient credit") || s.toLowerCase().includes("payment required")) {
    return "Insufficient credits. Please top up your account to continue generating.";
  }
  // 401 / auth
  if (s.includes("401") || s.toLowerCase().includes("unauthorized") || s.toLowerCase().includes("authentication")) {
    return "Authentication error. Please check your API configuration.";
  }
  // 429 / rate limit
  if (s.includes("429") || s.toLowerCase().includes("rate limit") || s.toLowerCase().includes("too many requests")) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  // 500 / server
  if (s.includes("500") || s.toLowerCase().includes("internal server")) {
    return "The generation service is temporarily unavailable. Please try again shortly.";
  }
  // Timeout
  if (s.toLowerCase().includes("timed out") || s.toLowerCase().includes("timeout")) {
    return "Generation timed out. Please try again.";
  }
  // Strip raw JSON / URLs — if it looks like a JSON blob or a URL-heavy string, replace entirely
  if (s.startsWith("{") || s.startsWith("[") || (s.includes("https://") && s.length > 120)) {
    return "Generation failed. Please try again.";
  }
  // Truncate anything still too long
  return s.length > 100 ? s.slice(0, 97) + "…" : s;
}

// ─── Camera Settings Data ─────────────────────────────────────────────────────
const CAMERA_MOVEMENTS = [
  { id: "Auto", label: "Auto", icon: "🎯" },
  { id: "Dolly In", label: "Dolly In", icon: "🎥" },
  { id: "Dolly Out", label: "Dolly Out", icon: "📷" },
  { id: "Pan Left", label: "Pan Left", icon: "◀" },
  { id: "Pan Right", label: "Pan Right", icon: "▶" },
  { id: "Crane Up", label: "Crane Up", icon: "⬆" },
  { id: "Crane Down", label: "Crane Down", icon: "⬇" },
  { id: "Handheld", label: "Handheld", icon: "🤳" },
];

const LENS_TYPES = [
  { id: "Clean Digital", label: "Clean Digital", icon: "💎", desc: "Sharp & pristine" },
  { id: "Vintage Haze", label: "Vintage Haze", icon: "🌫", desc: "Soft & dreamy" },
  { id: "Anamorphic", label: "Anamorphic", icon: "✨", desc: "Cinematic flares" },
  { id: "Fisheye", label: "Fisheye", icon: "🔮", desc: "Ultra wide" },
  { id: "Tilt-Shift", label: "Tilt-Shift", icon: "🎨", desc: "Miniature effect" },
  { id: "Macro", label: "Macro", icon: "🔍", desc: "Extreme closeup" },
];

const FOCAL_LENGTHS = ["14mm", "24mm", "28mm", "35mm", "50mm", "85mm", "105mm", "135mm", "200mm"];

const APERTURE_OPTIONS = [
  { id: "f/1.2", label: "f/1.2", sub: "Cinematic" },
  { id: "f/1.4", label: "f/1.4", sub: "Shallow" },
  { id: "f/1.8", label: "f/1.8", sub: "Portrait" },
  { id: "f/2.8", label: "f/2.8", sub: "Moderate" },
  { id: "f/4", label: "f/4", sub: "Balanced" },
  { id: "f/5.6", label: "f/5.6", sub: "Deep" },
  { id: "f/8", label: "f/8", sub: "Landscape" },
];

// ─── Genre Data ───────────────────────────────────────────────────────────────
const GENRES = [
  {
    id: "action",
    label: "Action",
    color: "#ef4444",
    bg: "linear-gradient(135deg, #7f1d1d 0%, #1c1917 100%)",
    description: "High-octane sequences, explosive cinematography, kinetic energy",
    thumb: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&q=80",
  },
  {
    id: "horror",
    label: "Horror",
    color: "#dc2626",
    bg: "linear-gradient(135deg, #1c0a0a 0%, #0f0f0f 100%)",
    description: "Atmospheric dread, deep shadows, unsettling compositions",
    thumb: "https://images.unsplash.com/photo-1604076913837-52ab5629fde9?w=400&q=80",
  },
  {
    id: "comedy",
    label: "Comedy",
    color: "#f59e0b",
    bg: "linear-gradient(135deg, #78350f 0%, #1c1917 100%)",
    description: "Bright frames, warm tones, expressive reactions",
    thumb: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80",
  },
  {
    id: "noir",
    label: "Noir",
    color: "#94a3b8",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    description: "High contrast, deep blacks, rain-slicked streets, moral ambiguity",
    thumb: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80",
  },
  {
    id: "drama",
    label: "Drama",
    color: "#8b5cf6",
    bg: "linear-gradient(135deg, #2e1065 0%, #1e1b4b 100%)",
    description: "Intimate close-ups, natural light, emotional depth",
    thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  },
  {
    id: "epic",
    label: "Epic",
    color: "#d97706",
    bg: "linear-gradient(135deg, #451a03 0%, #1c1917 100%)",
    description: "Grand vistas, sweeping orchestration, heroic scale",
    thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  },
  {
    id: "scifi",
    label: "Sci-Fi",
    color: "#06b6d4",
    bg: "linear-gradient(135deg, #0c1445 0%, #05070c 100%)",
    description: "Neon-lit futures, lens flares, cold sterile environments",
    thumb: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80",
  },
  {
    id: "romance",
    label: "Romance",
    color: "#ec4899",
    bg: "linear-gradient(135deg, #500724 0%, #1c1917 100%)",
    description: "Soft bokeh, golden hour, intimate framing",
    thumb: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&q=80",
  },
  {
    id: "thriller",
    label: "Thriller",
    color: "#64748b",
    bg: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    description: "Tension-driven pacing, tight angles, psychological weight",
    thumb: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
  },
  {
    id: "general",
    label: "General",
    color: "#6b7280",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    description: "Balanced cinematic look, versatile for any story",
    thumb: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
  },
];

// ─── PillButton ───────────────────────────────────────────────────────────────
function PillButton({ label, active, onClick, accent }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: "5px 13px",
        borderRadius: "999px",
        border: active
          ? `1px solid ${accent ? ACCENT_BORDER : "rgba(255,255,255,0.22)"}`
          : `1px solid ${BORDER}`,
        background: active ? (accent ? ACCENT_SOFT : SURFACE_HOVER) : SURFACE,
        color: active ? (accent ? "#c4b5fd" : "white") : TEXT_MUTED,
        fontSize: "12px", fontWeight: 500, cursor: "pointer",
        whiteSpace: "nowrap", letterSpacing: "0.01em",
        transition: "background 0.2s, border-color 0.2s, color 0.2s",
        fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
      }}
    >
      {label}
    </motion.button>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────
function IconButton({ children, active, onClick, title }) {
  return (
    <motion.button
      onClick={onClick} title={title}
      whileHover={{ scale: 1.08, y: -1 }} whileTap={{ scale: 0.94 }}
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: `1px solid ${active ? ACCENT_BORDER : BORDER}`,
        background: active ? ACCENT_SOFT : SURFACE,
        color: active ? "#c4b5fd" : TEXT_MUTED,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s", fontSize: 15,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── StepperButton ────────────────────────────────────────────────────────────
function StepperButton({ icon, onClick }) {
  return (
    <motion.button
      onClick={onClick} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
      style={{
        width: 20, height: 20, borderRadius: 6,
        border: `1px solid ${BORDER_HOVER}`, background: SURFACE_HOVER,
        color: TEXT_MUTED, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", fontSize: 13,
        lineHeight: 1, padding: 0, transition: "all 0.15s",
      }}
    >
      {icon}
    </motion.button>
  );
}

// ─── DurationButton + Popover ─────────────────────────────────────────────────
function DurationButton({ duration, setDuration }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const DURATION_VALUES = { "4s": 4, "8s": 8, "16s": 16 };
  const DURATION_LABELS = ["4s", "8s", "16s"];
  const sliderMin = 4;
  const sliderMax = 16;
  const sliderValue = DURATION_VALUES[duration] ?? 8;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    const closest = DURATION_LABELS.reduce((prev, curr) =>
      Math.abs(DURATION_VALUES[curr] - val) < Math.abs(DURATION_VALUES[prev] - val) ? curr : prev
    );
    setDuration(closest);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 11px", borderRadius: 999,
          border: `1px solid ${isOpen ? BORDER_HOVER : BORDER}`,
          background: isOpen ? SURFACE_HOVER : SURFACE,
          color: isOpen ? "rgba(255,255,255,0.85)" : TEXT_MUTED,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          fontFamily: "inherit", whiteSpace: "nowrap",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: 11, opacity: 0.7 }}>⏱</span>
        {duration}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 60,
              width: 200,
              borderRadius: 16,
              border: `1px solid ${BORDER_HOVER}`,
              background: "#0b0f1c",
              boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 30px rgba(124,58,237,0.08)",
              padding: "18px 18px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: TEXT_DIM, textTransform: "uppercase" }}>
                Duration
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "white", lineHeight: 1 }}>
                {duration}
              </span>
            </div>

            <div style={{ position: "relative", paddingBottom: 4 }}>
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={1}
                value={sliderValue}
                onChange={handleSliderChange}
                style={{
                  width: "100%",
                  appearance: "none", WebkitAppearance: "none",
                  height: 4, borderRadius: 999,
                  background: `linear-gradient(to right, #7c3aed ${((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100}%, rgba(255,255,255,0.1) ${((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100}%)`,
                  outline: "none", cursor: "pointer",
                  border: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {DURATION_LABELS.map((l) => (
                  <span
                    key={l}
                    onClick={() => setDuration(l)}
                    style={{
                      fontSize: 10.5, fontWeight: 500, cursor: "pointer",
                      color: duration === l ? "#c4b5fd" : TEXT_DIM,
                      transition: "color 0.15s",
                      userSelect: "none",
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <style>{`
              input[type=range]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px; height: 16px;
                border-radius: 50%;
                background: white;
                box-shadow: 0 0 0 3px rgba(124,58,237,0.4), 0 2px 6px rgba(0,0,0,0.5);
                cursor: pointer;
                transition: box-shadow 0.15s;
              }
              input[type=range]::-webkit-slider-thumb:hover {
                box-shadow: 0 0 0 4px rgba(124,58,237,0.55), 0 2px 8px rgba(0,0,0,0.6);
              }
              input[type=range]::-moz-range-thumb {
                width: 16px; height: 16px;
                border-radius: 50%; border: none;
                background: white;
                box-shadow: 0 0 0 3px rgba(124,58,237,0.4), 0 2px 6px rgba(0,0,0,0.5);
                cursor: pointer;
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Camera Modal ─────────────────────────────────────────────────────────────
function CameraModal({ camera, setCamera, onClose }) {
  const [lens, setLens] = useState("Clean Digital");
  const [focalLength, setFocalLength] = useState("28mm");
  const [aperture, setAperture] = useState("f/2.8");

  const [hoveredMovement, setHoveredMovement] = useState(camera);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const selectedAperture = APERTURE_OPTIONS.find((a) => a.id === aperture) || APERTURE_OPTIONS[3];
  const activeMovement = CAMERA_MOVEMENTS.find((m) => m.id === hoveredMovement) || CAMERA_MOVEMENTS[0];

  const movementBgs = {
    "Auto":       "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    "Dolly In":   "linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)",
    "Dolly Out":  "linear-gradient(135deg, #1b2631 0%, #2c3e50 100%)",
    "Pan Left":   "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    "Pan Right":  "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    "Crane Up":   "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)",
    "Crane Down": "linear-gradient(135deg, #1a0a0a 0%, #3e1a1a 100%)",
    "Handheld":   "linear-gradient(135deg, #1a1a0a 0%, #2a2a1a 100%)",
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 51,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "all",
            width: "min(820px, 90vw)",
            borderRadius: 18,
            border: `1px solid ${BORDER_HOVER}`,
            background: "rgba(9,11,19,0.97)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px 12px",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
              Camera Settings
            </span>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${BORDER_HOVER}`, background: SURFACE_HOVER,
                color: TEXT_MUTED, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 13, transition: "all 0.2s",
              }}
            >
              ✕
            </motion.button>
          </div>

          <div style={{ display: "flex", height: 320 }}>
            <motion.div
              key={activeMovement.id + "-preview"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                flex: "0 0 44%", position: "relative", overflow: "hidden",
                background: movementBgs[activeMovement.id] || movementBgs["Auto"],
              }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    width: 188, height: 188, borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.10)",
                    boxShadow: `0 0 50px rgba(124,58,237,0.4), 0 0 100px rgba(124,58,237,0.2)`,
                    background: "rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column", gap: 8,
                  }}
                >
                  <span style={{ fontSize: 52 }}>{activeMovement.icon}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {activeMovement.label}
                  </span>
                </div>
              </div>
              <div
                style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at center, transparent 35%, rgba(9,11,19,0.75) 100%)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>

            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
              <div
                style={{ flex: 1, overflowY: "auto", padding: "10px 12px 10px 14px", scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {CAMERA_MOVEMENTS.map((mov) => {
                  const isSelected = mov.id === camera;
                  const isHov = mov.id === hoveredMovement;
                  return (
                    <motion.div
                      key={mov.id}
                      onMouseEnter={() => setHoveredMovement(mov.id)}
                      onClick={() => { setCamera(mov.id); onClose(); }}
                      whileHover={{ x: 3 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "8px 10px", borderRadius: 10,
                        cursor: "pointer", marginBottom: 1,
                        background: isHov ? "rgba(255,255,255,0.05)" : "transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <div
                        style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: isHov ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${isHov ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`,
                          boxShadow: isHov ? "0 0 10px rgba(124,58,237,0.35)" : "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, flexShrink: 0,
                          transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
                        }}
                      >
                        {mov.icon}
                      </div>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: isSelected ? 700 : isHov ? 600 : 400,
                          color: isSelected ? "white" : isHov ? "rgba(255,255,255,0.88)" : TEXT_MUTED,
                          letterSpacing: "-0.01em",
                          transition: "color 0.12s, font-weight 0.12s",
                        }}
                      >
                        {mov.label}
                      </span>
                      {isSelected && (
                        <div
                          style={{
                            marginLeft: "auto", width: 6, height: 6,
                            borderRadius: "50%", background: ACCENT,
                            boxShadow: `0 0 8px ${ACCENT}`,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 44,
                  background: "linear-gradient(transparent, rgba(9,11,19,0.95))",
                  pointerEvents: "none", zIndex: 2,
                }}
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BORDER}`, padding: "14px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: TEXT_DIM, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
                  Camera
                </div>
                <div
                  style={{
                    borderRadius: 12, border: `1px solid ${ACCENT_BORDER}`,
                    background: ACCENT_SOFT,
                    padding: "14px 8px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "rgba(124,58,237,0.25)",
                      border: `1px solid ${ACCENT_BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {CAMERA_MOVEMENTS.find(m => m.id === camera)?.icon || "🎯"}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", textAlign: "center", lineHeight: 1.2 }}>
                    {camera}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: TEXT_DIM, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
                  Lens
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {LENS_TYPES.map((l) => {
                    const isActive = lens === l.id;
                    return (
                      <motion.button
                        key={l.id}
                        onClick={() => setLens(l.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "5px 8px", borderRadius: 8,
                          border: `1px solid ${isActive ? ACCENT_BORDER : BORDER}`,
                          background: isActive ? ACCENT_SOFT : SURFACE,
                          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{l.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? "#c4b5fd" : TEXT_MUTED }}>
                          {l.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: TEXT_DIM, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
                  Focal Length
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {FOCAL_LENGTHS.map((f) => {
                    const isActive = focalLength === f;
                    return (
                      <motion.button
                        key={f}
                        onClick={() => setFocalLength(f)}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: "4px 8px", borderRadius: 7,
                          border: `1px solid ${isActive ? ACCENT_BORDER : BORDER}`,
                          background: isActive ? ACCENT_SOFT : SURFACE,
                          color: isActive ? "#c4b5fd" : TEXT_MUTED,
                          fontSize: 10.5, fontWeight: isActive ? 700 : 400,
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                      >
                        {f}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: TEXT_DIM, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
                  Aperture
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {APERTURE_OPTIONS.map((a) => {
                    const isActive = aperture === a.id;
                    return (
                      <motion.button
                        key={a.id}
                        onClick={() => setAperture(a.id)}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: "4px 8px", borderRadius: 7,
                          border: `1px solid ${isActive ? ACCENT_BORDER : BORDER}`,
                          background: isActive ? ACCENT_SOFT : SURFACE,
                          color: isActive ? "#c4b5fd" : TEXT_MUTED,
                          fontSize: 10.5, fontWeight: isActive ? 700 : 400,
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                      >
                        {a.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <motion.div
            key={camera + lens + focalLength + aperture}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: "10px 18px",
              borderTop: `1px solid ${BORDER}`,
              fontSize: 11.5, color: TEXT_DIM, letterSpacing: "0.01em", lineHeight: 1.5,
              display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
            }}
          >
            <span style={{ color: TEXT_MUTED, fontWeight: 600 }}>{camera}</span>
            <span style={{ color: TEXT_DIM }}>·</span>
            <span>{lens}</span>
            <span style={{ color: TEXT_DIM }}>·</span>
            <span>{focalLength}</span>
            <span style={{ color: TEXT_DIM }}>·</span>
            <span>{aperture} {selectedAperture.sub}</span>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

// ─── CameraButton ─────────────────────────────────────────────────────────────
function CameraButton({ camera, setCamera, onOpen }) {
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 11px 4px 5px", borderRadius: 999,
        border: `1px solid ${BORDER}`,
        background: SURFACE,
        cursor: "pointer", fontSize: 11.5,
        color: TEXT_MUTED,
        fontWeight: 500, fontFamily: "inherit",
        transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, flexShrink: 0,
        }}
      >
        🎥
      </div>
      <span>
        Camera:{" "}
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{camera}</span>
      </span>
    </motion.button>
  );
}

// ─── Resolution Data ──────────────────────────────────────────────────────────
const RESOLUTION_DATA_VIDEO = ["480p", "720p", "1080p", "4K"];
const RESOLUTION_DATA_IMAGE = ["1K", "2K", "4K"];

// ─── ResolutionButton + Popover ───────────────────────────────────────────────
function ResolutionButton({ resolution, setResolution, mode }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const RESOLUTION_DATA = mode === "Image" ? RESOLUTION_DATA_IMAGE : RESOLUTION_DATA_VIDEO;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 999,
          border: `1px solid ${isOpen ? BORDER_HOVER : "rgba(255,255,255,0.18)"}`,
          background: isOpen ? SURFACE_HOVER : SURFACE_HOVER,
          color: "white", fontSize: 12, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
          whiteSpace: "nowrap", transition: "all 0.2s",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
          <rect x="0" y="0" width="5" height="5" rx="1" fill="currentColor"/>
          <rect x="7" y="0" width="5" height="5" rx="1" fill="currentColor"/>
          <rect x="0" y="7" width="5" height="5" rx="1" fill="currentColor"/>
          <rect x="7" y="7" width="5" height="5" rx="1" fill="currentColor"/>
        </svg>
        {resolution}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              zIndex: 60,
              width: 170,
              borderRadius: 12,
              border: `1px solid ${BORDER_HOVER}`,
              background: "#111520",
              boxShadow: "0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            <div style={{
              padding: "10px 14px 8px",
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
              color: TEXT_DIM, textTransform: "uppercase",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              Resolution
            </div>

            {RESOLUTION_DATA.map((r) => {
              const isActive = resolution === r;
              return (
                <motion.button
                  key={r}
                  onClick={() => { setResolution(r); setIsOpen(false); }}
                  whileHover={{ background: "rgba(255,255,255,0.06)" }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                    border: "none", cursor: "pointer",
                    fontFamily: "inherit", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                >
                  <span style={{
                    fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                    color: isActive ? "white" : "rgba(255,255,255,0.72)",
                    letterSpacing: "0.01em",
                  }}>
                    {r}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        fontSize: 13, color: "rgba(255,255,255,0.65)",
                        fontWeight: 600, lineHeight: 1,
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Ratio Data ───────────────────────────────────────────────────────────────
const RATIO_DATA = [
  { id: "Auto", label: "Ratio", w: 1, h: 1, shape: "square" },
  { id: "1:1",  label: "1:1",  w: 1, h: 1, shape: "square" },
  { id: "3:4",  label: "3:4",  w: 3, h: 4, shape: "portrait" },
  { id: "9:16", label: "9:16", w: 9, h: 16, shape: "portrait-tall" },
  { id: "4:3",  label: "4:3",  w: 4, h: 3, shape: "landscape" },
  { id: "16:9", label: "16:9", w: 16, h: 9, shape: "landscape-wide" },
  { id: "21:9", label: "21:9", w: 21, h: 9, shape: "ultrawide" },
];

function RatioIcon({ shape, active }) {
  const color = active ? "rgba(163,230,53,0.9)" : "rgba(255,255,255,0.45)";
  const size = 14;
  const configs = {
    "square":         { w: size, h: size },
    "portrait":       { w: Math.round(size * 3/4), h: size },
    "portrait-tall":  { w: Math.round(size * 9/16), h: size },
    "landscape":      { w: size, h: Math.round(size * 3/4) },
    "landscape-wide": { w: size, h: Math.round(size * 9/16) },
    "ultrawide":      { w: size, h: Math.round(size * 9/21) },
  };
  const cfg = configs[shape] || configs["square"];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ flexShrink: 0 }}>
      <rect
        x={(size - cfg.w) / 2} y={(size - cfg.h) / 2}
        width={cfg.w} height={cfg.h}
        rx="1.5"
        stroke={color} strokeWidth="1.5" fill="none"
      />
    </svg>
  );
}

// ─── RatioButton + Popover ────────────────────────────────────────────────────
function RatioButton({ ratio, setRatio }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const activeRatio = RATIO_DATA.find((r) => r.id === ratio) || RATIO_DATA[0];

  return (
    <div ref={wrapperRef} style={{ position: "relative", flexShrink: 0 }}>
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 11px", borderRadius: 999,
          border: `1px solid ${isOpen ? BORDER_HOVER : BORDER}`,
          background: isOpen ? SURFACE_HOVER : SURFACE,
          color: isOpen ? "rgba(255,255,255,0.85)" : TEXT_MUTED,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s",
        }}
      >
        {activeRatio.label}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              zIndex: 9999,
              width: 180,
              borderRadius: 14,
              border: `1px solid ${BORDER_HOVER}`,
              background: "#111520",
              boxShadow: "0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)",
              overflow: "hidden",
            }}
          >
            {RATIO_DATA.map((r, i) => {
              const isActive = ratio === r.id;
              return (
                <motion.button
                  key={r.id}
                  onClick={() => { setRatio(r.id); setIsOpen(false); }}
                  whileHover={{ background: "rgba(255,255,255,0.06)" }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 10, padding: "10px 14px",
                    background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                    border: "none",
                    borderBottom: i < RATIO_DATA.length - 1 ? `1px solid rgba(255,255,255,0.05)` : "none",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                >
                  {r.id !== "Auto" && <RatioIcon shape={r.shape} active={isActive} />}
                  <span style={{
                    flex: 1, fontSize: 13.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "white" : "rgba(255,255,255,0.7)",
                    letterSpacing: "0.01em",
                  }}>
                    {r.id === "Auto" ? "Auto" : r.label}
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ fontSize: 13, color: "rgba(163,230,53,0.85)", fontWeight: 700, lineHeight: 1 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AmbientBackground ────────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: BG }}>
      <motion.div
        animate={{ opacity: [0.55, 0.75, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)", width: 900, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(79,70,229,0.13) 0%, rgba(124,58,237,0.07) 45%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", top: -100, left: -100, width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        style={{
          position: "absolute", bottom: -80, right: -80, width: 600, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}

// ─── GenerateButton ───────────────────────────────────────────────────────────
function GenerateButton({ isGenerating, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={!isGenerating ? { scale: 1.03, y: -2 } : {}}
      whileTap={!isGenerating ? { scale: 0.97 } : {}}
      disabled={isGenerating}
      style={{
        position: "relative", display: "flex", alignItems: "center", gap: 8,
        padding: "11px 22px", borderRadius: 14,
        border: `1px solid ${isGenerating ? "rgba(6,182,212,0.25)" : CYAN_GLOW}`,
        background: isGenerating
          ? "rgba(6,182,212,0.1)"
          : "linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.15) 100%)",
        color: isGenerating ? "rgba(6,182,212,0.6)" : CYAN,
        fontSize: 14, fontWeight: 700,
        cursor: isGenerating ? "not-allowed" : "pointer",
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: "0.06em", textTransform: "uppercase",
        whiteSpace: "nowrap", transition: "all 0.25s", overflow: "hidden", flexShrink: 0,
      }}
    >
      {!isGenerating && (
        <motion.div
          animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: `radial-gradient(ellipse at center, ${CYAN_SOFT} 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
      )}
      {!isGenerating && (
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          style={{
            position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)",
            pointerEvents: "none",
          }}
        />
      )}
      {isGenerating ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(6,182,212,0.3)", borderTopColor: CYAN,
            }}
          />
          Generating…
        </>
      ) : (
        <>
          <span style={{ fontSize: 16 }}>✨</span>
          GENERATE
        </>
      )}
    </motion.button>
  );
}

// ─── Genre Pill ───────────────────────────────────────────────────────────────
function GenrePill({ genre, onClick }) {
  const g = GENRES.find((x) => x.id === genre) || GENRES[GENRES.length - 1];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 11px 4px 5px", borderRadius: 999,
        border: `1px solid ${BORDER}`, background: SURFACE,
        cursor: "pointer", fontSize: 11.5, color: TEXT_MUTED,
        fontWeight: 500, fontFamily: "inherit",
        transition: "all 0.2s", whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 20, height: 20, borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
          border: `1.5px solid ${g.color}55`,
        }}
      >
        <img
          src={g.thumb}
          alt={g.label}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentNode.style.background = g.bg;
          }}
        />
      </div>
      <span>
        Genre: <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{g.label}</span>
      </span>
    </motion.button>
  );
}

// ─── Genre Modal ──────────────────────────────────────────────────────────────
function GenreModal({ genre, onSelect, onClose }) {
  const [hovered, setHovered] = useState(genre);
  const listRef = useRef(null);
  const activeG = GENRES.find((g) => g.id === hovered) || GENRES[0];

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const scroll = (dir) => {
    listRef.current?.scrollBy({ top: dir * 68, behavior: "smooth" });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 51,
          pointerEvents: "none",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: "all",
            width: "min(820px, 90vw)",
            borderRadius: 18,
            border: `1px solid ${BORDER_HOVER}`,
            background: "rgba(9,11,19,0.97)",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)",
            overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px 12px",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
              Genre
            </span>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: `1px solid ${BORDER_HOVER}`, background: SURFACE_HOVER,
                color: TEXT_MUTED, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: 13, transition: "all 0.2s",
              }}
            >
              ✕
            </motion.button>
          </div>

          <div style={{ display: "flex", height: 320 }}>
            <motion.div
              key={activeG.id + "-preview"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ flex: "0 0 44%", position: "relative", overflow: "hidden", background: activeG.bg }}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  style={{
                    width: 188, height: 188, borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(255,255,255,0.10)",
                    boxShadow: `0 0 50px ${activeG.color}44, 0 0 100px ${activeG.color}22`,
                  }}
                >
                  <img src={activeG.thumb} alt={activeG.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
              <div
                style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(ellipse at center, transparent 35%, rgba(9,11,19,0.75) 100%)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>

            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 8, right: 12, zIndex: 3, pointerEvents: "none" }}>
                <motion.button
                  onClick={() => scroll(-1)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: `1px solid ${BORDER_HOVER}`, background: "rgba(12,14,22,0.95)",
                    color: TEXT_MUTED, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", fontSize: 11,
                    pointerEvents: "all",
                  }}
                >
                  ∧
                </motion.button>
              </div>

              <div
                ref={listRef}
                style={{ flex: 1, overflowY: "auto", padding: "10px 12px 10px 14px", scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {GENRES.map((g) => {
                  const isSelected = g.id === genre;
                  const isHov = g.id === hovered;
                  return (
                    <motion.div
                      key={g.id}
                      onMouseEnter={() => setHovered(g.id)}
                      onClick={() => { onSelect(g.id); onClose(); }}
                      whileHover={{ x: 3 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "8px 10px", borderRadius: 10,
                        cursor: "pointer", marginBottom: 1,
                        background: isHov ? "rgba(255,255,255,0.05)" : "transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <div
                        style={{
                          width: 38, height: 38, borderRadius: "50%",
                          overflow: "hidden", flexShrink: 0,
                          border: `1.5px solid ${isHov ? g.color + "99" : "rgba(255,255,255,0.08)"}`,
                          boxShadow: isHov ? `0 0 10px ${g.color}44` : "none",
                          transition: "border-color 0.18s, box-shadow 0.18s",
                        }}
                      >
                        <img src={g.thumb} alt={g.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span
                        style={{
                          fontSize: 14.5,
                          fontWeight: isSelected ? 700 : isHov ? 600 : 400,
                          color: isSelected ? "white" : isHov ? "rgba(255,255,255,0.88)" : TEXT_MUTED,
                          letterSpacing: "-0.01em",
                          transition: "color 0.12s, font-weight 0.12s",
                        }}
                      >
                        {g.label}
                      </span>
                      {isSelected && (
                        <div
                          style={{
                            marginLeft: "auto", width: 6, height: 6,
                            borderRadius: "50%", background: g.color,
                            boxShadow: `0 0 8px ${g.color}`,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ position: "absolute", bottom: 8, right: 12, zIndex: 3, pointerEvents: "none" }}>
                <motion.button
                  onClick={() => scroll(1)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: `1px solid ${BORDER_HOVER}`, background: "rgba(12,14,22,0.95)",
                    color: TEXT_MUTED, display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", fontSize: 11,
                    pointerEvents: "all",
                  }}
                >
                  ∨
                </motion.button>
              </div>

              <div
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 44,
                  background: "linear-gradient(transparent, rgba(9,11,19,0.95))",
                  pointerEvents: "none", zIndex: 2,
                }}
              />
            </div>
          </div>

          <motion.div
            key={activeG.id + "-footer"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: "10px 18px",
              borderTop: `1px solid ${BORDER}`,
              fontSize: 11.5, color: TEXT_DIM, letterSpacing: "0.01em", lineHeight: 1.5,
            }}
          >
            <span style={{ color: TEXT_MUTED, fontWeight: 600 }}>{activeG.label} — </span>
            {activeG.description}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Ratio → CSS aspect-ratio string ─────────────────────────────────────────
function ratioToCss(r) {
  const map = {
    "1:1":  "1/1",
    "3:4":  "3/4",
    "9:16": "9/16",
    "4:3":  "4/3",
    "16:9": "16/9",
    "21:9": "21/9",
    "Auto": "16/9",
  };
  return map[r] || "16/9";
}

// ─── Gallery Grid ─────────────────────────────────────────────────────────────
function GalleryGrid({ outputs, viewMode, activeTab }) {
  const filtered = outputs.filter(o => {
    if (activeTab === "Image") return o.type === "Image";
    if (activeTab === "Video") return o.type === "Video";
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: 1, color: TEXT_DIM, fontSize: 13, letterSpacing: "0.03em",
        flexDirection: "column", gap: 8, padding: "60px 0",
      }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>🎬</span>
        <span>No {activeTab.toLowerCase()} generations yet</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(480px,1fr))" : "1fr",
        gap: 16,
        padding: "0 20px 20px",
      }}
    >
      {filtered.map((o, idx) => {
        const aspectRatio = ratioToCss(o.ratio);
        return (
        <motion.div
          key={o.id}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
          style={{
            borderRadius: 14,
            border: `1px solid ${o.status === "succeeded" ? "rgba(124,58,237,0.25)" : o.status === "failed" ? "rgba(248,113,113,0.2)" : BORDER}`,
            background: "rgba(10,12,22,0.8)",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "relative",
              aspectRatio,
              background: "linear-gradient(135deg, #0d0f1a, #1a1f2e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {o.status === "succeeded" && o.imageUrl ? (
              <>
                <img
                  src={o.imageUrl}
                  alt={o.prompt}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {o.type === "Video" && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.3)",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)", border: "1.5px solid rgba(255,255,255,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, paddingLeft: 2,
                    }}>▶</div>
                  </div>
                )}
              </>
            ) : o.status === "failed" ? (
              <div style={{ textAlign: "center", padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
                <div style={{ fontSize: 10, color: "rgba(248,113,113,0.8)", lineHeight: 1.4 }}>
                  {o.errorMsg || "Generation failed"}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: "2px solid rgba(124,58,237,0.2)",
                    borderTopColor: "#a78bfa",
                    margin: "0 auto 8px",
                  }}
                />
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>Generating…</div>
              </div>
            )}

            {o.status === "succeeded" && o.imageUrl && (
              <motion.a
                href={o.imageUrl}
                download
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 26, height: 26, borderRadius: 7,
                  background: "rgba(0,0,0,0.65)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, cursor: "pointer", textDecoration: "none",
                  opacity: 0,
                }}
              >
                ⬇
              </motion.a>
            )}
          </div>

          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 10.5, color: TEXT_MUTED, lineHeight: 1.35, marginBottom: 4 }}>
              {o.prompt.slice(0, 70)}{o.prompt.length > 70 ? "…" : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: o.status === "succeeded" ? "#4ade80" : o.status === "failed" ? "#f87171" : "#a78bfa",
                boxShadow: o.status === "processing" ? "0 0 5px #a78bfa" : "none",
              }} />
              <span style={{ fontSize: 9.5, color: TEXT_DIM, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {o.status === "succeeded" ? "Ready" : o.status === "failed" ? "Failed" : "Processing"}
              </span>
            </div>
          </div>
        </motion.div>
      )})}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MovieStudio() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Video");
  const [duration, setDuration] = useState("8s");
  const [resolution, setResolution] = useState("1K");
  const [camera, setCamera] = useState("Auto");
  const [genre, setGenre] = useState("general");
  const [variants, setVariants] = useState(1);
  const [ratio, setRatio] = useState("Auto");
  const [sound, setSound] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [credits, setCredits] = useState(9680);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [outputs, setOutputs] = useState(() => {
    try {
      const saved = localStorage.getItem("studio_outputs");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Only restore completed outputs, drop any that were mid-processing
      return parsed.filter(o => o.status === "succeeded" || o.status === "failed");
    } catch { return []; }
  });
  const [genreOpen, setGenreOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(() => {
    try { return localStorage.getItem("studio_has_generated") === "true"; } catch { return false; }
  });
  const [galleryTab, setGalleryTab] = useState("All");

  useEffect(() => {
    setResolution(mode === "Image" ? "1K" : "1080p");
  }, [mode]);

  // Persist completed outputs to localStorage
  useEffect(() => {
    try {
      const toSave = outputs.filter(o => o.status === "succeeded" || o.status === "failed");
      localStorage.setItem("studio_outputs", JSON.stringify(toSave));
    } catch {}
  }, [outputs]);

  const editorRef = useRef(null);
  const mentionDropdownRef = useRef(null);

  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionChars, setMentionChars] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [selectedChar, setSelectedChar] = useState(null);

  const fetchCharacters = useCallback(async (query = "") => {
    setMentionLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      const res = await fetch(`/api/characters/search?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMentionChars(data.characters || []);
    } catch {
      setMentionChars([]);
    } finally {
      setMentionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mentionOpen) return;
    const handler = (e) => {
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target) &&
          editorRef.current && !editorRef.current.contains(e.target)) {
        setMentionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mentionOpen]);

  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedFile({ url, name: file.name, type: file.type });
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    if (uploadedFile) URL.revokeObjectURL(uploadedFile.url);
    setUploadedFile(null);
  };

  const pollStatus = useCallback(async (predictionId, outputId) => {
    const MAX_POLLS = 120;
    const POLL_INTERVAL = 3000;

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      try {
        const res = await fetch(`/api/generate-image-status?predictionId=${predictionId}`);
        const data = await res.json();

        if (data.status === "succeeded" && data.generation?.images?.length) {
          const imageUrl = data.generation.images[0];
          setOutputs((prev) =>
            prev.map((o) =>
              o.id === outputId
                ? { ...o, status: "succeeded", imageUrl, generationData: data.generation }
                : o
            )
          );
          setIsGenerating(false);
          setCredits((c) => Math.max(0, c - 120));
          return;
        }

        if (data.status === "failed") {
          const msg = friendlyError(data.error);
          setOutputs((prev) =>
            prev.map((o) =>
              o.id === outputId
                ? { ...o, status: "failed", errorMsg: msg }
                : o
            )
          );
          setIsGenerating(false);
          setError(msg);
          return;
        }
      } catch (e) {
        console.warn("Poll error:", e);
      }
    }

    setOutputs((prev) =>
      prev.map((o) =>
        o.id === outputId
          ? { ...o, status: "failed", errorMsg: "Timed out waiting for generation." }
          : o
      )
    );
    setIsGenerating(false);
    setError("Generation timed out. Please try again.");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Set the scene first — describe what you want to direct.");
      editorRef.current?.focus();
      return;
    }
    setError("");
    setIsGenerating(true);

    if (!hasGenerated) {
      setHasGenerated(true);
      try { localStorage.setItem("studio_has_generated", "true"); } catch {}
    }

    const outputId = Date.now();
    setOutputs((prev) => [{ id: outputId, type: mode, prompt, status: "processing", ratio }, ...prev]);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          scenePrompt: prompt,
          style: genre,
          ratio: ratio === "Auto" ? "16:9" : ratio,
          size: ratio === "Auto" ? "16:9" : ratio,
          ...(selectedChar ? { characterId: selectedChar.id } : {}),
        }),
      });

      const data = await res.json();

      if (!data.success || !data.predictionId) {
        throw new Error(friendlyError(data.error));
      }

      setOutputs((prev) =>
        prev.map((o) =>
          o.id === outputId ? { ...o, predictionId: data.predictionId } : o
        )
      );

      pollStatus(data.predictionId, outputId);
    } catch (e) {
      const msg = friendlyError(e.message);
      setError(msg);
      setOutputs((prev) =>
        prev.map((o) =>
          o.id === outputId ? { ...o, status: "failed", errorMsg: msg } : o
        )
      );
      setIsGenerating(false);
    }
  }, [prompt, mode, genre, ratio, pollStatus, hasGenerated]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const suggestions = [
    "Slow dolly into a lone warrior in the rain",
    "Wide cinematic desert battle at golden hour",
    "Close-up: tear rolling down a smiling face",
    "Drone shot over a neon cyberpunk city",
  ];

  const handleInput = useCallback((e) => {
    const el = editorRef.current;
    if (!el) return;

    const text = el.innerText.replace(/\n$/, "");
    setPrompt(text);
    if (error) setError("");

    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    const textUpToCursor = preCaretRange.toString();
    const atMatch = textUpToCursor.match(/@([\w]*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionOpen(true);
      fetchCharacters(atMatch[1]);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  }, [error, fetchCharacters]);

  const handleMentionSelect = useCallback((char) => {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    const textUpToCursor = preCaretRange.toString();
    const beforeAt = textUpToCursor.replace(/@[\w]*$/, "");

    const afterCursor = el.innerText.slice(textUpToCursor.length);
    const mentionText = "@" + char.name.replace(/\s+/g, "") + " ";
    const newText = beforeAt + mentionText + afterCursor;

    setPrompt(newText);
    editorRef.current.innerText = newText;
    renderHighlights(el, newText);

    const newCursorPos = beforeAt.length + mentionText.length;
    setCursorPosition(el, newCursorPos);

    setSelectedChar(char);
    setMentionOpen(false);
    setMentionQuery("");
  }, []);

  function renderHighlights(el, text) {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    el.innerHTML = "";
    parts.forEach((part) => {
      if (/^@[a-zA-Z0-9_]+/.test(part)) {
        const mark = document.createElement("mark");
        mark.style.cssText =
          "background:rgba(167,139,250,0.18);color:#c4b5fd;border-radius:4px;padding:1px 2px;";
        mark.textContent = part;
        el.appendChild(mark);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  function setCursorPosition(el, pos) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node, remaining = pos;

    while ((node = walker.nextNode())) {
      if (remaining <= node.length) {
        const range = document.createRange();
        range.setStart(node, remaining);
        range.collapse(true);

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      remaining -= node.length;
    }
  }

  const imageCount = outputs.filter(o => o.type === "Image").length;
  const videoCount = outputs.filter(o => o.type === "Video").length;

  const composerProps = {
    prompt, setPrompt, mode, setMode, duration, setDuration,
    resolution, setResolution, camera, setCamera, genre, setGenre,
    variants, setVariants, ratio, setRatio,
    focused, setFocused, error, setError, isGenerating,
    onGenerate: handleGenerate,
    editorRef, mentionDropdownRef,
    mentionOpen, setMentionOpen, mentionChars, mentionLoading, mentionQuery,
    onMentionSelect: handleMentionSelect,
    onInput: handleInput,
    uploadedFile, fileInputRef,
    onFileChange: handleFileChange,
    onRemoveFile: handleRemoveFile,
    onOpenGenre: () => setGenreOpen(true),
    onOpenCamera: () => setCameraOpen(true),
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        fontFamily: "'Space Grotesk', 'DM Sans', ui-sans-serif, sans-serif",
        color: "white", display: "flex", flexDirection: "column", overflow: "hidden",
      }}
    >
      <style>{`
        .studio-textarea::placeholder {
          color: rgba(255, 255, 255, 0.22);
          -webkit-text-fill-color: rgba(255, 255, 255, 0.22);
          opacity: 1;
        }
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.22);
          pointer-events: none;
        }
        .studio-textarea::-webkit-input-placeholder {
          color: rgba(255, 255, 255, 0.22);
          -webkit-text-fill-color: rgba(255, 255, 255, 0.22);
        }
        .studio-textarea::-moz-placeholder {
          color: rgba(255, 255, 255, 0.22);
          opacity: 1;
        }
        .gallery-scroll::-webkit-scrollbar { width: 4px; }
        .gallery-scroll::-webkit-scrollbar-track { background: transparent; }
        .gallery-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.4), 0 2px 6px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px rgba(124,58,237,0.55), 0 2px 8px rgba(0,0,0,0.6);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%; border: none;
          background: white;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.4), 0 2px 6px rgba(0,0,0,0.5);
          cursor: pointer;
        }
      `}</style>

      <AmbientBackground />

      <AnimatePresence>
        {genreOpen && (
          <GenreModal
            genre={genre}
            onSelect={(id) => setGenre(id)}
            onClose={() => setGenreOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cameraOpen && (
          <CameraModal
            camera={camera}
            setCamera={setCamera}
            onClose={() => setCameraOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px", borderBottom: `1px solid ${BORDER}`,
          background: "rgba(8,10,16,0.7)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 9,
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${INDIGO} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, boxShadow: `0 0 18px ${ACCENT_GLOW}`,
            }}
          >
            🎬
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "#c4b5fd", lineHeight: 1, textTransform: "uppercase" }}>
              MOVIE STUDIO
            </div>
            <div style={{ fontSize: 10, color: TEXT_DIM, letterSpacing: "0.05em" }}>AI Filmmaking Suite</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["Studio", "Library", "Scenes", "Export"].map((item, i) => (
            <motion.button
              key={item} whileHover={{ y: -1 }}
              style={{
                padding: "5px 14px", borderRadius: 8, border: "none",
                background: i === 0 ? ACCENT_SOFT : "transparent",
                color: i === 0 ? "#c4b5fd" : TEXT_MUTED,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                letterSpacing: "0.01em", fontFamily: "inherit", transition: "all 0.2s",
              }}
            >
              {item}
            </motion.button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton title="Grid view" active={viewMode === "grid"} onClick={() => setViewMode("grid")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0" y="0" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="8" y="0" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="0" y="8" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="8" y="8" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
            </svg>
          </IconButton>
          <IconButton title="List view" active={viewMode === "list"} onClick={() => setViewMode("list")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0" y="1" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
              <rect x="0" y="5.75" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
              <rect x="0" y="10.5" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
            </svg>
          </IconButton>
          <div style={{ width: 1, height: 20, background: BORDER, margin: "0 4px" }} />
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${INDIGO} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            D
          </div>
        </div>
      </motion.header>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 5, overflow: "hidden" }}>

        {/* ══════════════════════════════════════════════════════════
            HERO LAYOUT — shown before first generation
            The hero text + centered composer live here.
            On generate: hero text fades up, composer slides to bottom.
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {!hasGenerated && (
            <motion.div
              key="hero-full"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-end",
                padding: "0 24px 100px",
                zIndex: 2,
              }}
            >
              {/* ── Hero Text — fades up separately ── */}
              <motion.div
                exit={{
                  opacity: 0,
                  y: -32,
                  transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ textAlign: "center", marginBottom: 32, width: "100%" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "#a78bfa",
                      marginBottom: 18, textTransform: "uppercase",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <span style={{ display: "inline-block", width: 24, height: 1, background: "linear-gradient(90deg, transparent, #a78bfa)" }} />
                    MOVIE STUDIO
                    <span style={{ display: "inline-block", width: 24, height: 1, background: "linear-gradient(90deg, #a78bfa, transparent)" }} />
                  </div>
                  <h1
                    style={{
                      fontSize: "clamp(30px, 4.8vw, 54px)", fontWeight: 800, margin: 0,
                      letterSpacing: "-0.03em", lineHeight: 1.1,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.72) 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      }}
                    >
                      Direct without limits.
                    </span>
                    <span
                      style={{
                        display: "block",
                        background: "linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #22d3ee 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                      }}
                    >
                      Every frame, exactly as you imagine.
                    </span>
                  </h1>
                  <p
                    style={{
                      margin: "18px auto 0", fontSize: 15, color: "rgba(255,255,255,0.52)",
                      fontWeight: 400, letterSpacing: "0.01em", lineHeight: 1.65, maxWidth: 520,
                    }}
                  >
                    Describe a scene.{" "}
                    <span style={{ color: "rgba(167,139,250,0.82)", fontWeight: 500 }}>Kylor</span>{" "}
                    handles the camera, motion, and world.
                  </p>
                </motion.div>
              </motion.div>

              {/* ── Hero Composer Card — slides down on exit ── */}
              <motion.div
                exit={{
                  y: 80,
                  opacity: 0,
                  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
                }}
                style={{ width: "100%", maxWidth: 960, position: "relative" }}
              >
                {/* Mode toggle */}
                <div
                  style={{
                    position: "absolute", top: -42, left: 0,
                    display: "flex", zIndex: 2, borderRadius: 999,
                    border: `1px solid ${BORDER_HOVER}`,
                    background: "rgba(12,14,22,0.84)",
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    overflow: "hidden", padding: 3, gap: 2,
                  }}
                >
                  {MODES.map((m) => (
                    <motion.button
                      key={m}
                      onClick={() => setMode(m)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "6px 16px", borderRadius: 999, border: "none",
                        background: mode === m ? SURFACE_HOVER : "transparent",
                        color: mode === m ? "white" : TEXT_MUTED,
                        fontSize: 13, fontWeight: mode === m ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.2s", letterSpacing: "0.01em",
                      }}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>

                {/* Ambient glow */}
                <motion.div
                  animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.02, 0.95] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: -20, borderRadius: 32,
                    background: `radial-gradient(ellipse at 50% 60%, ${ACCENT_GLOW} 0%, rgba(79,70,229,0.1) 50%, transparent 75%)`,
                    filter: "blur(24px)", zIndex: 0, pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative", zIndex: 1, borderRadius: 24,
                    border: `1px solid ${focused ? "rgba(124,58,237,0.5)" : BORDER}`,
                    background: "rgba(12,14,22,0.84)",
                    backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
                    overflow: "visible", transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: focused
                      ? `0 0 0 1px rgba(124,58,237,0.35), 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)`
                      : `0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  <ComposerInner {...composerProps} compact={false} />
                </div>

                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                  style={{
                    textAlign: "center", fontSize: 11.5, color: TEXT_DIM,
                    margin: "12px 0 0", letterSpacing: "0.02em",
                  }}
                >
                  Press{" "}
                  <kbd
                    style={{
                      padding: "1px 6px", borderRadius: 5,
                      border: `1px solid ${BORDER_HOVER}`, background: SURFACE_HOVER,
                      fontSize: 10.5, color: TEXT_MUTED, fontFamily: "monospace",
                    }}
                  >
                    ⌘ Enter
                  </kbd>
                  {" "}to generate · Use{" "}
                  <span style={{ color: "#a78bfa" }}>@</span> to reference characters &amp; locations
                </motion.p>
              </motion.div>

              {/* ── Suggestions ── */}
              <motion.div
                exit={{
                  opacity: 0,
                  y: 20,
                  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                style={{
                  display: "flex", gap: 8, marginTop: 24,
                  flexWrap: "wrap", justifyContent: "center", maxWidth: 700,
                }}
              >
                {suggestions.map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => {
                      setPrompt(s);
                      if (editorRef.current) editorRef.current.innerText = s;
                      editorRef.current?.focus();
                    }}
                    whileHover={{ scale: 1.03, y: -2, borderColor: ACCENT_BORDER }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "6px 14px", borderRadius: 999,
                      border: `1px solid ${BORDER}`, background: SURFACE,
                      color: TEXT_DIM, fontSize: 12, fontWeight: 450,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all 0.2s", letterSpacing: "0.01em",
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════
            GALLERY LAYOUT — slides in after first generation
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {hasGenerated && (
            <motion.div
              key="gallery-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
              }}
            >
              {/* Gallery tabs */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "10px 20px 0",
                  flexShrink: 0,
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                {["All", "Image", "Video"].map((tab) => {
                  const count = tab === "All" ? outputs.length : tab === "Image" ? imageCount : videoCount;
                  const isActive = galleryTab === tab;
                  return (
                    <motion.button
                      key={tab}
                      onClick={() => setGalleryTab(tab)}
                      whileHover={{ y: -1 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px",
                        borderRadius: "8px 8px 0 0",
                        border: "none",
                        borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                        background: isActive ? ACCENT_SOFT : "transparent",
                        color: isActive ? "#c4b5fd" : TEXT_MUTED,
                        fontSize: 12, fontWeight: isActive ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                    >
                      {tab}
                      {count > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          background: isActive ? ACCENT_BORDER : BORDER,
                          color: isActive ? "#c4b5fd" : TEXT_DIM,
                          borderRadius: 99, padding: "1px 6px",
                          minWidth: 18, textAlign: "center",
                        }}>
                          {count}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Gallery scrollable content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
                className="gallery-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingTop: 16,
                  minHeight: 0,
                }}
              >
                <GalleryGrid outputs={outputs} viewMode={viewMode} activeTab={galleryTab} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM COMPOSER — slides up from below after first gen
        ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {hasGenerated && (
            <motion.div
              key="bottom-composer"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                flexShrink: 0,
                padding: "12px 20px 54px",
                background: "rgba(8,10,16,0.85)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                borderTop: `1px solid ${BORDER}`,
                position: "relative", zIndex: 10,
                overflow: "visible",
              }}
            >
              <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
                {/* Mode toggle for bottom composer */}
                <div
                  style={{
                    position: "absolute", top: -36, left: 0,
                    display: "flex", zIndex: 2, borderRadius: 999,
                    border: `1px solid ${BORDER_HOVER}`,
                    background: "rgba(12,14,22,0.9)",
                    overflow: "hidden", padding: 2, gap: 1,
                  }}
                >
                  {MODES.map((m) => (
                    <motion.button
                      key={m}
                      onClick={() => setMode(m)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "4px 14px", borderRadius: 999, border: "none",
                        background: mode === m ? SURFACE_HOVER : "transparent",
                        color: mode === m ? "white" : TEXT_MUTED,
                        fontSize: 12, fontWeight: mode === m ? 600 : 400,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>

                <div
                  style={{
                    position: "relative", zIndex: 1, borderRadius: 18,
                    border: `1px solid ${focused ? "rgba(124,58,237,0.45)" : BORDER_HOVER}`,
                    background: "rgba(14,16,26,0.92)",
                    backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
                    overflow: "visible", transition: "border-color 0.3s, box-shadow 0.3s",
                    boxShadow: focused
                      ? `0 0 0 1px rgba(124,58,237,0.3), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
                      : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <ComposerInner {...composerProps} compact={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status Bar ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 28px", borderTop: `1px solid ${BORDER}`,
          background: "rgba(8,10,16,0.9)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          fontSize: 11, color: TEXT_DIM, letterSpacing: "0.03em",
          height: 36,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>Mode: <span style={{ color: "#c4b5fd" }}>{mode}</span></span>
          {mode === "Video" && (
            <span>Duration: <span style={{ color: "#c4b5fd" }}>{duration}</span></span>
          )}
          <span>Resolution: <span style={{ color: "#c4b5fd" }}>{resolution}</span></span>
          <span>Variants: <span style={{ color: "#c4b5fd" }}>{variants}</span></span>
          <span>Genre: <span style={{ color: "#c4b5fd" }}>{GENRES.find((g) => g.id === genre)?.label}</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }}
          />
          <span style={{ color: TEXT_MUTED }}>Systems nominal</span>
          <span style={{ marginLeft: 12, color: TEXT_DIM }}>·</span>
          <span style={{ marginLeft: 12 }}>
            <span style={{ color: CYAN }}>{credits.toLocaleString()}</span> credits
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Shared Composer Inner (used by both hero and bottom layouts) ──────────────
function ComposerInner({
  prompt, setPrompt, mode, setMode, duration, setDuration,
  resolution, setResolution, camera, setCamera, genre, setGenre,
  variants, setVariants, ratio, setRatio,
  focused, setFocused, error, setError, isGenerating, onGenerate,
  editorRef, mentionDropdownRef,
  mentionOpen, setMentionOpen, mentionChars, mentionLoading, mentionQuery,
  onMentionSelect, onInput, uploadedFile, fileInputRef, onFileChange, onRemoveFile,
  onOpenGenre, onOpenCamera, compact = false,
}) {
  return (
    <>
      {/* @ Mention Dropdown */}
      <AnimatePresence>
        {mentionOpen && (
          <motion.div
            ref={mentionDropdownRef}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 50px)",
              left: 0,
              zIndex: 9999,
              width: 260,
              borderRadius: 12,
              border: `1px solid ${BORDER_HOVER}`,
              background: "#0d1020",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
              maxHeight: 200,
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{
              padding: "7px 12px 6px",
              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
              color: TEXT_DIM, textTransform: "uppercase",
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ color: "#a78bfa" }}>@</span>
              Characters
              {mentionQuery && (
                <span style={{ color: TEXT_DIM, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  — {mentionQuery}
                </span>
              )}
            </div>

            {mentionLoading ? (
              <div style={{ padding: "16px", textAlign: "center" }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "2px solid rgba(167,139,250,0.2)",
                    borderTopColor: "#a78bfa",
                    margin: "0 auto",
                  }}
                />
              </div>
            ) : mentionChars.length === 0 ? (
              <div style={{ padding: "14px 16px", fontSize: 12, color: TEXT_DIM, textAlign: "center" }}>
                No characters found
              </div>
            ) : (
              <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" }}>
                {mentionChars.map((char) => (
                  <motion.button
                    key={char.id}
                    onMouseDown={(e) => { e.preventDefault(); onMentionSelect(char); }}
                    whileHover={{ background: "rgba(255,255,255,0.06)" }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 12px",
                      background: "transparent", border: "none",
                      borderBottom: `1px solid rgba(255,255,255,0.04)`,
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      transition: "background 0.12s",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      overflow: "hidden", flexShrink: 0,
                      border: "1.5px solid rgba(167,139,250,0.3)",
                      background: "rgba(124,58,237,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12,
                    }}>
                      {char.master_image || char.reference_image || char.cover_image ? (
                        <img
                          src={char.master_image || char.reference_image || char.cover_image}
                          alt={char.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <span>🎭</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "white", lineHeight: 1.2 }}>
                        {char.name}
                      </div>
                      {char.description && (
                        <div style={{ fontSize: 10.5, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.3 }}>
                          {String(char.description).slice(0, 50)}{char.description?.length > 50 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <div style={{ position: "relative", borderRadius: compact ? "16px 16px 0 0" : "24px 24px 0 0", overflow: "visible" }}>
        <AnimatePresence>
          {focused && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "absolute", inset: 0, borderRadius: compact ? "16px 16px 0 0" : "24px 24px 0 0",
                background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.14) 0%, rgba(79,70,229,0.05) 50%, transparent 70%)",
                pointerEvents: "none", zIndex: 0,
              }}
            />
          )}
        </AnimatePresence>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          data-placeholder="Scene • Characters • Action • Camera • Lighting"
          style={{
            position: "relative",
            minHeight: compact ? 60 : 120,
            maxHeight: compact ? 120 : 150,
            overflowY: "auto",
            padding: compact ? "16px 20px 14px" : "26px 26px 20px",
            fontSize: compact ? 15 : 17,
            lineHeight: 1.65,
            letterSpacing: "0.01em",
            fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
            fontWeight: 400,
            caretColor: "#c4b5fd",
            color: "rgba(255,255,255,0.88)",
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            zIndex: 2,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ padding: compact ? "0 18px 8px" : "0 26px 10px", color: "#f87171", fontSize: 12 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div
        style={{
          display: "flex", alignItems: "stretch",
          padding: compact ? "10px 12px 12px" : "14px 16px 16px",
          borderTop: `1px solid ${BORDER}`,
          gap: compact ? 10 : 14,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={onFileChange}
        />

        <div style={{ position: "relative", flexShrink: 0 }}>
          {uploadedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                width: compact ? 42 : 56, height: compact ? 42 : 56, borderRadius: 12,
                border: `1px solid ${ACCENT_BORDER}`,
                overflow: "hidden", position: "relative", cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedFile.type.startsWith("video/") ? (
                <video src={uploadedFile.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
              ) : (
                <img src={uploadedFile.url} alt="upload" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <motion.button
                onClick={(e) => { e.stopPropagation(); onRemoveFile(); }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  position: "absolute", top: 3, right: 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "rgba(0,0,0,0.75)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white", fontSize: 9, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", lineHeight: 1,
                }}
              >
                ✕
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.04, background: SURFACE_HOVER }}
              whileTap={{ scale: 0.96 }}
              style={{
                width: compact ? 42 : 56, height: compact ? 42 : 56, flexShrink: 0, borderRadius: 12,
                border: `1px solid ${BORDER_HOVER}`, background: SURFACE,
                color: TEXT_MUTED,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: compact ? 20 : 26, fontWeight: 300, lineHeight: 1,
                transition: "all 0.2s",
              }}
            >
              +
            </motion.button>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", minWidth: 0, overflow: "visible" }}>
          <GenrePill genre={genre} onClick={onOpenGenre} />
          <CameraButton camera={camera} setCamera={setCamera} onOpen={onOpenCamera} />
          {mode === "Video" && (
            <DurationButton duration={duration} setDuration={setDuration} />
          )}
          <ResolutionButton resolution={resolution} setResolution={setResolution} mode={mode} />
          <RatioButton ratio={ratio} setRatio={setRatio} />
          <div
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 999,
              border: `1px solid ${BORDER}`, background: SURFACE,
              flexShrink: 0,
            }}
          >
            <StepperButton icon="−" onClick={() => setVariants((v) => Math.max(1, v - 1))} />
            <span style={{ fontSize: 11, color: "white", fontWeight: 600, minWidth: 24, textAlign: "center" }}>
              {variants}/4
            </span>
            <StepperButton icon="+" onClick={() => setVariants((v) => Math.min(4, v + 1))} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <GenerateButton isGenerating={isGenerating} onClick={onGenerate} />
        </div>
      </div>
    </>
  );
}

