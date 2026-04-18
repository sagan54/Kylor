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
const CAMERA_OPTIONS = ["Auto", "Dolly", "Pan", "Crane", "Handheld"];
const MODES = ["Image", "Video"];

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
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
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
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.08, y: -1 }}
      whileTap={{ scale: 0.94 }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${active ? ACCENT_BORDER : BORDER}`,
        background: active ? ACCENT_SOFT : SURFACE,
        color: active ? "#c4b5fd" : TEXT_MUTED,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        fontSize: 15,
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
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        border: `1px solid ${BORDER_HOVER}`,
        background: SURFACE_HOVER,
        color: TEXT_MUTED,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: 1,
        padding: 0,
        transition: "all 0.15s",
      }}
    >
      {icon}
    </motion.button>
  );
}

// ─── AmbientBackground ────────────────────────────────────────────────────────
function AmbientBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: BG,
      }}
    >
      <motion.div
        animate={{ opacity: [0.55, 0.75, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(79,70,229,0.13) 0%, rgba(124,58,237,0.07) 45%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(6,182,212,0.06) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        style={{
          position: "absolute",
          bottom: -80,
          right: -80,
          width: 600,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}

// ─── GenerateButton ───────────────────────────────────────────────────────────
function GenerateButton({ isGenerating, credits, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={!isGenerating ? { scale: 1.03, y: -2 } : {}}
      whileTap={!isGenerating ? { scale: 0.97 } : {}}
      disabled={isGenerating}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "11px 22px",
        borderRadius: 14,
        border: `1px solid ${isGenerating ? "rgba(6,182,212,0.25)" : CYAN_GLOW}`,
        background: isGenerating
          ? "rgba(6,182,212,0.1)"
          : "linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.15) 100%)",
        color: isGenerating ? "rgba(6,182,212,0.6)" : CYAN,
        fontSize: 14,
        fontWeight: 700,
        cursor: isGenerating ? "not-allowed" : "pointer",
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        transition: "all 0.25s",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {!isGenerating && (
        <motion.div
          animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
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
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
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
              width: 14,
              height: 14,
              borderRadius: "50%",
              border: "2px solid rgba(6,182,212,0.3)",
              borderTopColor: CYAN,
            }}
          />
          Generating…
        </>
      ) : (
        <>
          <span style={{ fontSize: 16 }}>✨</span>
          GENERATE
          <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500, letterSpacing: "0.04em" }}>
            {credits.toLocaleString()}
          </span>
        </>
      )}
    </motion.button>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MovieStudio() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Video");
  const [duration, setDuration] = useState("8s");
  const [resolution, setResolution] = useState("1080p");
  const [camera, setCamera] = useState("Auto");
  const [variants, setVariants] = useState(1);
  const [sound, setSound] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [credits, setCredits] = useState(9680);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Describe your scene to begin generating.");
      textareaRef.current?.focus();
      return;
    }
    setError("");
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2800));
    setIsGenerating(false);
    setCredits((c) => Math.max(0, c - 120));
  }, [prompt]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate]);

  const cycleCamera = () => {
    const idx = CAMERA_OPTIONS.indexOf(camera);
    setCamera(CAMERA_OPTIONS[(idx + 1) % CAMERA_OPTIONS.length]);
  };

  const suggestions = [
    "Epic aerial shot of ancient Rome at sunset",
    "Noir detective in rain-soaked Tokyo alley",
    "Zero-g ballet aboard a space station",
    "Deep ocean bioluminescent trench dive",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        fontFamily: "'Space Grotesk', 'DM Sans', ui-sans-serif, sans-serif",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <AmbientBackground />

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 28px",
          borderBottom: `1px solid ${BORDER}`,
          background: "rgba(8,10,16,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${INDIGO} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              boxShadow: `0 0 18px ${ACCENT_GLOW}`,
            }}
          >
            🎬
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#c4b5fd",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              MOVIE STUDIO
            </div>
            <div style={{ fontSize: 10, color: TEXT_DIM, letterSpacing: "0.05em" }}>
              AI Filmmaking Suite
            </div>
          </div>
        </div>

        {/* Center nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {["Studio", "Library", "Scenes", "Export"].map((item, i) => (
            <motion.button
              key={item}
              whileHover={{ y: -1 }}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                border: "none",
                background: i === 0 ? ACCENT_SOFT : "transparent",
                color: i === 0 ? "#c4b5fd" : TEXT_MUTED,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "0.01em",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#fcd34d",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            30% OFF
          </motion.div>
          <IconButton
            title="Grid view"
            active={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0" y="0" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="8" y="0" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="0" y="8" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
              <rect x="8" y="8" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" />
            </svg>
          </IconButton>
          <IconButton
            title="List view"
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0" y="1" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
              <rect x="0" y="5.75" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
              <rect x="0" y="10.5" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.8" />
            </svg>
          </IconButton>
          <div style={{ width: 1, height: 20, background: BORDER, margin: "0 4px" }} />
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACCENT} 0%, ${INDIGO} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            D
          </div>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 5,
          padding: "0 24px 100px",
          overflow: "hidden",
        }}
      >
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "#a78bfa",
              marginBottom: 14,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ display: "inline-block", width: 24, height: 1, background: "linear-gradient(90deg, transparent, #a78bfa)" }} />
            MOVIE STUDIO
            <span style={{ display: "inline-block", width: 24, height: 1, background: "linear-gradient(90deg, #a78bfa, transparent)" }} />
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4.5vw, 52px)",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            What would you shoot with
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #c4b5fd 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              infinite budget?
            </span>
          </h1>
        </motion.div>

        {/* ── Composer Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 780, position: "relative" }}
        >
          {/* Breathing glow */}
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [0.95, 1.02, 0.95] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: 32,
              background: `radial-gradient(ellipse at 50% 60%, ${ACCENT_GLOW} 0%, rgba(79,70,229,0.1) 50%, transparent 75%)`,
              filter: "blur(24px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Glass card */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              borderRadius: 24,
              border: `1px solid ${focused ? ACCENT_BORDER : BORDER}`,
              background: "rgba(12,14,22,0.82)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              overflow: "hidden",
              transition: "border-color 0.3s",
              boxShadow: focused
                ? `0 0 0 1px ${ACCENT_BORDER}, 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`
                : `0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}
          >
            {/* Textarea */}
            <div style={{ position: "relative" }}>
              {focused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "24px 24px 0 0",
                    background: `radial-gradient(ellipse at 50% 0%, ${ACCENT_SOFT} 0%, transparent 70%)`,
                    pointerEvents: "none",
                    zIndex: 0,
                  }}
                />
              )}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError("");
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Describe your scene — use @ to add characters & locations"
                rows={5}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  color: "white",
                  fontSize: 17,
                  lineHeight: 1.65,
                  padding: "26px 26px 20px",
                  fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
                  fontWeight: 400,
                  caretColor: "#a78bfa",
                  zIndex: 1,
                  position: "relative",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: "0 26px 10px", color: "#f87171", fontSize: 12 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Dock ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px 16px",
                borderTop: `1px solid ${BORDER}`,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {/* Left controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1, minWidth: 0 }}>

                {/* Add button */}
                <motion.button
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    width: 30, height: 30, borderRadius: 9,
                    border: `1px solid ${ACCENT_BORDER}`, background: ACCENT_SOFT,
                    color: "#c4b5fd", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", fontSize: 19,
                    fontWeight: 300, lineHeight: 1, padding: 0, transition: "all 0.2s",
                  }}
                >
                  +
                </motion.button>

                <div style={{ width: 1, height: 18, background: BORDER, margin: "0 2px" }} />

                {/* Mode selector */}
                <div
                  style={{
                    display: "flex", borderRadius: 999, border: `1px solid ${BORDER}`,
                    background: SURFACE, overflow: "hidden", padding: 2, gap: 1,
                  }}
                >
                  {MODES.map((m) => (
                    <motion.button
                      key={m}
                      onClick={() => setMode(m)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "3px 11px", borderRadius: 999, border: "none",
                        background: mode === m ? ACCENT_SOFT : "transparent",
                        color: mode === m ? "#c4b5fd" : TEXT_MUTED,
                        fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "0.03em",
                      }}
                    >
                      {m}
                    </motion.button>
                  ))}
                </div>

                {/* Model */}
                <PillButton label="Movie Studio" active accent />

                {/* Duration — video only */}
                {mode === "Video" && (
                  <div style={{ display: "flex", gap: 3 }}>
                    {DURATION_OPTIONS.map((d) => (
                      <PillButton
                        key={d}
                        label={d}
                        active={duration === d}
                        onClick={() => setDuration(d)}
                      />
                    ))}
                  </div>
                )}

                {/* Resolution */}
                <div style={{ display: "flex", gap: 3 }}>
                  {RESOLUTION_OPTIONS.map((r) => (
                    <PillButton
                      key={r}
                      label={r}
                      active={resolution === r}
                      onClick={() => setResolution(r)}
                    />
                  ))}
                </div>

                {/* Camera */}
                <motion.button
                  onClick={cycleCamera}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 999,
                    border: `1px solid ${BORDER}`, background: SURFACE,
                    cursor: "pointer", fontSize: 11.5, color: TEXT_MUTED,
                    fontWeight: 500, fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 12 }}>🎥</span>
                  {camera}
                </motion.button>

                {/* Variants stepper */}
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 999,
                    border: `1px solid ${BORDER}`, background: SURFACE,
                  }}
                >
                  <StepperButton icon="−" onClick={() => setVariants((v) => Math.max(1, v - 1))} />
                  <span style={{ fontSize: 12, color: "white", fontWeight: 600, minWidth: 24, textAlign: "center" }}>
                    {variants}/4
                  </span>
                  <StepperButton icon="+" onClick={() => setVariants((v) => Math.min(4, v + 1))} />
                </div>

                {/* Sound toggle */}
                <motion.button
                  onClick={() => setSound((s) => !s)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 11px", borderRadius: 999,
                    border: `1px solid ${sound ? ACCENT_BORDER : BORDER}`,
                    background: sound ? ACCENT_SOFT : SURFACE,
                    color: sound ? "#c4b5fd" : TEXT_MUTED,
                    fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 12 }}>{sound ? "🔊" : "🔇"}</span>
                  {sound ? "Sound" : "Off"}
                </motion.button>
              </div>

              {/* Generate button */}
              <GenerateButton
                isGenerating={isGenerating}
                credits={credits}
                onClick={handleGenerate}
              />
            </div>
          </div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
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

        {/* Suggestions */}
        <motion.div
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
              onClick={() => setPrompt(s)}
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
      </main>

      {/* ── Status Bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 28px",
          borderTop: `1px solid ${BORDER}`,
          background: "rgba(8,10,16,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          fontSize: 11, color: TEXT_DIM, letterSpacing: "0.03em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>Mode: <span style={{ color: "#c4b5fd" }}>{mode}</span></span>
          {mode === "Video" && (
            <span>Duration: <span style={{ color: "#c4b5fd" }}>{duration}</span></span>
          )}
          <span>Resolution: <span style={{ color: "#c4b5fd" }}>{resolution}</span></span>
          <span>Variants: <span style={{ color: "#c4b5fd" }}>{variants}</span></span>
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