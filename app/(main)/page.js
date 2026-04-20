"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Clapperboard,
  Image as ImageIcon,
  Video,
  UserCircle2,
  Orbit,
  ChevronRight,
  Wand2,
  Zap,
  ArrowUpRight,
  Camera,
  Play,
  Film,
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import AppSidebar from "../components/AppSidebar";

// ─── Design Tokens ────────────────────────────────────────────────────────────
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

// ─── Scene Cards for Explore Grid ─────────────────────────────────────────────
const SCENES = [
  {
    label: "Action",
    gradient: "linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #1e1b4b 100%)",
    accent: "rgba(139,92,246,0.6)",
    sub: "High-octane sequences",
  },
  {
    label: "Drama",
    gradient: "linear-gradient(145deg, #0c1a2e 0%, #1e3a5f 50%, #0f172a 100%)",
    accent: "rgba(59,130,246,0.5)",
    sub: "Emotional depth",
  },
  {
    label: "Sci-Fi",
    gradient: "linear-gradient(135deg, #0a1628 0%, #0e2d40 40%, #042330 100%)",
    accent: "rgba(6,182,212,0.55)",
    sub: "Futuristic worlds",
  },
  {
    label: "Noir",
    gradient: "linear-gradient(145deg, #0d0d0d 0%, #1a1a1a 50%, #0a0a0a 100%)",
    accent: "rgba(251,191,36,0.4)",
    sub: "Shadow & tension",
  },
  {
    label: "Epic",
    gradient: "linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #1f0e00 100%)",
    accent: "rgba(249,115,22,0.5)",
    sub: "Grand scale narratives",
  },
  {
    label: "Thriller",
    gradient: "linear-gradient(145deg, #0f1923 0%, #1a2d40 50%, #0a121a 100%)",
    accent: "rgba(239,68,68,0.45)",
    sub: "Edge-of-seat tension",
  },
  {
    label: "Romance",
    gradient: "linear-gradient(135deg, #1f0a1f 0%, #3d1040 40%, #1a0a2e 100%)",
    accent: "rgba(236,72,153,0.5)",
    sub: "Intimate moments",
  },
  {
    label: "Horror",
    gradient: "linear-gradient(145deg, #0a0a0a 0%, #1a0505 50%, #050505 100%)",
    accent: "rgba(185,28,28,0.5)",
    sub: "Dark atmospheres",
  },
];

// ─── Feature Strips ────────────────────────────────────────────────────────────
const FEATURE_STRIPS = [
  {
    title: "Camera Control",
    description:
      "Define every shot with precision. Dolly, pan, rack focus — your AI cinematographer follows your vision.",
    tag: "Coming next",
    gradient: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(0,0,0,0))",
    accentColor: "#818cf8",
    visualGradient:
      "radial-gradient(ellipse at 60% 50%, rgba(79,70,229,0.3) 0%, rgba(124,58,237,0.15) 40%, transparent 70%)",
    icon: Camera,
  },
  {
    title: "Character Consistency",
    description:
      "One character, infinite scenes. Identity, wardrobe, and expression stay locked across every frame.",
    tag: "Coming next",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(0,0,0,0))",
    accentColor: "#22d3ee",
    visualGradient:
      "radial-gradient(ellipse at 60% 50%, rgba(6,182,212,0.25) 0%, rgba(14,116,144,0.15) 40%, transparent 70%)",
    icon: UserCircle2,
  },
  {
    title: "Motion System",
    description:
      "Subject tracking, motion lock, temporal consistency. Your scenes move the way directors dream.",
    tag: "Coming next",
    gradient: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,0,0,0))",
    accentColor: "#a78bfa",
    visualGradient:
      "radial-gradient(ellipse at 60% 50%, rgba(124,58,237,0.28) 0%, rgba(79,70,229,0.15) 40%, transparent 70%)",
    icon: Orbit,
  },
];

// ─── Tools (renamed) ──────────────────────────────────────────────────────────
const TOOLS = [
  {
    title: "Image Generation",
    description:
      "Cinematic stills, concept frames, style explorations, and key visuals.",
    tag: "Coming next",
    icon: ImageIcon,
    href: "/image",
  },
  {
    title: "Video Lab",
    description:
      "AI-driven cinematic clips, motion shots, and visual sequences.",
    badge: "Live now",
    icon: Video,
    href: "/video",
  },
  {
    title: "Character Studio",
    description:
      "Identity, wardrobe, and visual continuity consistent across all outputs.",
    tag: "Coming next",
    icon: UserCircle2,
    href: "#",
  },
  {
    title: "Motion Tools",
    description:
      "Motion lock, camera control, subject tracking, and movement workflows.",
    tag: "Coming next",
    icon: Orbit,
    href: "#",
  },
];

export default function Home() {
  const [session, setSession] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
<main
  style={{
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",   // 🔥 THIS IS KEY
  }}
>


        <div style={{ minHeight: "100vh" }}>

          {/* ── Top bar ── */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              borderBottom: `1px solid ${C.border}`,
              background: "rgba(5,7,12,0.85)",
              backdropFilter: "blur(16px)",
              padding: "0 36px",
              height: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            {session ? (
              <>
                <Link href="/story" style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ borderColor: C.borderHover }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      borderRadius: radius.md,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: "rgba(255,255,255,0.85)",
                      fontSize: "13.5px",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    Dashboard
                  </motion.div>
                </Link>

                <motion.button
                  whileHover={{ borderColor: C.borderHover }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  style={{
                    height: "34px",
                    padding: "0 16px",
                    borderRadius: radius.md,
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "13.5px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ borderColor: C.borderHover }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      borderRadius: radius.md,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: "rgba(255,255,255,0.8)",
                      fontSize: "13.5px",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease",
                    }}
                  >
                    Login
                  </motion.div>
                </Link>

                <Link href="/signup" style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ boxShadow: "0 14px 32px rgba(124,58,237,0.38)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "34px",
                      padding: "0 16px",
                      borderRadius: radius.md,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      boxShadow: `0 8px 24px ${C.accentGlow}`,
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    Get Started
                  </motion.div>
                </Link>
              </>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              1. CINEMATIC HERO
          ══════════════════════════════════════════════════════════════════ */}
          <section
            ref={heroRef}
            style={{
              position: "relative",
              minHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "80px 40px 60px",
              overflow: "hidden",
            }}
          >
            {/* Background atmosphere */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,70,229,0.18) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 40% at 20% 80%, rgba(124,58,237,0.1) 0%, transparent 50%),
                  radial-gradient(ellipse 40% 30% at 80% 70%, rgba(79,70,229,0.08) 0%, transparent 50%)
                `,
                pointerEvents: "none",
              }}
            />

            {/* Subtle film grain overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
                opacity: 0.4,
                pointerEvents: "none",
              }}
            />

            {/* Cinematic letterbox lines */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.4), transparent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,
              }}
            />

            {/* Hero content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}
            >
              {/* Eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 16px",
                  border: `1px solid rgba(124,58,237,0.3)`,
                  borderRadius: radius.full,
                  background: "rgba(124,58,237,0.08)",
                  color: "rgba(167,139,250,0.9)",
                  fontSize: "12.5px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "32px",
                }}
              >
                <Film size={12} color="#a78bfa" />
                Kylor AI · Cinematic Production Engine
              </motion.div>

              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: "clamp(48px, 6vw, 88px)",
                  lineHeight: 1,
                  margin: "0 0 24px",
                  letterSpacing: "-0.04em",
                  fontWeight: 900,
                  background:
                    "linear-gradient(180deg, #ffffff 30%, rgba(167,139,250,0.85) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Direct cinematic
                <br />
                scenes with AI.
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
                style={{
                  margin: "0 auto 48px",
                  maxWidth: "540px",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "19px",
                  lineHeight: 1.7,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                }}
              >
                Control camera, motion, and character
                <br />
                across every frame.
              </motion.p>

              {/* CTA group */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}
              >
                <Link href={session ? "/video" : "/signup"} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{
                      boxShadow: "0 24px 60px rgba(124,58,237,0.45)",
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "52px",
                      padding: "0 28px",
                      borderRadius: radius.lg,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "15px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      boxShadow: `0 12px 36px ${C.accentGlow}`,
                      transition: "all 0.2s ease",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <Play size={15} fill="white" />
                    Enter Movie Studio
                  </motion.div>
                </Link>

                <Link href={session ? "/story" : "/signup"} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "52px",
                      padding: "0 24px",
                      borderRadius: radius.lg,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: "rgba(255,255,255,0.75)",
                      fontWeight: 500,
                      fontSize: "15px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Wand2 size={15} />
                    Try Story Engine
                  </motion.div>
                </Link>
              </motion.div>

              {/* Social proof strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                style={{
                  marginTop: "52px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "28px",
                  color: C.textDim,
                  fontSize: "12.5px",
                  letterSpacing: "0.04em",
                }}
              >
                {["Story Engine", "Video Lab", "Character Consistency", "Motion System"].map(
                  (item, i) => (
                    <span key={item} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {i > 0 && (
                        <span
                          style={{
                            width: "3px",
                            height: "3px",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.2)",
                            marginRight: "22px",
                          }}
                        />
                      )}
                      {item}
                    </span>
                  )
                )}
              </motion.div>
            </motion.div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              2. EXPLORE CINEMATIC SCENES GRID
          ══════════════════════════════════════════════════════════════════ */}
          <section style={{ padding: "80px 36px", borderTop: `1px solid ${C.border}` }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ marginBottom: "36px" }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.textDim,
                }}
              >
                Explore
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: C.text,
                }}
              >
                Cinematic Scenes
              </h2>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              {SCENES.map((scene, i) => (
                <motion.div
                  key={scene.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  style={{
                    position: "relative",
                    height: "180px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    background: scene.gradient,
                    border: `1px solid rgba(255,255,255,0.05)`,
                    cursor: "default",
                    transition: "box-shadow 0.2s ease",
                  }}
                >
                  {/* Accent glow */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: `radial-gradient(ellipse at 50% 100%, ${scene.accent} 0%, transparent 60%)`,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Dark vignette overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Label */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: "white",
                        letterSpacing: "-0.01em",
                        marginBottom: "3px",
                      }}
                    >
                      {scene.label}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                      {scene.sub}
                    </div>
                  </div>

                  {/* Top-right genre badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "3px 9px",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {scene.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              3. MOVIE STUDIO HERO CARD
          ══════════════════════════════════════════════════════════════════ */}
          <section style={{ padding: "0 36px 80px" }}>
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "relative",
                borderRadius: "28px",
                overflow: "hidden",
                minHeight: "440px",
                border: `1px solid rgba(124,58,237,0.3)`,
                background:
                  "linear-gradient(135deg, rgba(30,20,80,0.9) 0%, rgba(15,10,50,0.95) 40%, rgba(20,10,60,0.9) 100%)",
                boxShadow:
                  "0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(79,70,229,0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "48px",
              }}
            >
              {/* Background atmosphere layers */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `
                    radial-gradient(ellipse 70% 60% at 80% 30%, rgba(124,58,237,0.3) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 40% at 20% 70%, rgba(79,70,229,0.2) 0%, transparent 50%),
                    radial-gradient(ellipse 30% 30% at 60% 80%, rgba(167,139,250,0.1) 0%, transparent 40%)
                  `,
                  pointerEvents: "none",
                }}
              />

              {/* Visual element — abstract camera/lens shape */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "8%",
                  transform: "translateY(-50%)",
                  width: "280px",
                  height: "280px",
                  borderRadius: "999px",
                  border: "1px solid rgba(124,58,237,0.2)",
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
                  boxShadow: "0 0 80px rgba(124,58,237,0.2), inset 0 0 60px rgba(79,70,229,0.1)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12%",
                  transform: "translateY(-50%)",
                  width: "180px",
                  height: "180px",
                  borderRadius: "999px",
                  border: "1px solid rgba(167,139,250,0.15)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "17%",
                  transform: "translateY(-50%)",
                  width: "80px",
                  height: "80px",
                  borderRadius: "999px",
                  background: "rgba(124,58,237,0.3)",
                  boxShadow: "0 0 40px rgba(124,58,237,0.4)",
                  pointerEvents: "none",
                }}
              />

              {/* Content */}
              <div style={{ position: "relative", zIndex: 1, maxWidth: "560px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "5px 12px",
                    borderRadius: radius.full,
                    border: "1px solid rgba(34,197,94,0.3)",
                    background: "rgba(34,197,94,0.08)",
                    color: "#86efac",
                    fontSize: "12px",
                    marginBottom: "24px",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "999px",
                      background: "#22c55e",
                      boxShadow: "0 0 10px #22c55e",
                    }}
                  />
                  Live
                </div>

                <h2
                  style={{
                    fontSize: "54px",
                    lineHeight: 1,
                    margin: "0 0 16px",
                    letterSpacing: "-0.035em",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  Movie Studio
                </h2>

                <p
                  style={{
                    margin: "0 0 36px",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "17px",
                    lineHeight: 1.7,
                  }}
                >
                  Your AI film director interface. Generate cinematic clips,
                  motion shots, and visual sequences from text.
                </p>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <Link href={session ? "/video" : "/signup"} style={{ textDecoration: "none" }}>
                    <motion.div
                      whileHover={{
                        boxShadow: "0 24px 60px rgba(124,58,237,0.5)",
                        scale: 1.02,
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        height: "50px",
                        padding: "0 26px",
                        borderRadius: radius.lg,
                        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "15px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        boxShadow: `0 12px 36px rgba(124,58,237,0.35)`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Play size={15} fill="white" />
                      Open Movie Studio
                    </motion.div>
                  </Link>

                  <span
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    Powered by Kylor AI
                  </span>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              4. FEATURE STRIPS
          ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{
              padding: "0 36px 80px",
              borderTop: `1px solid ${C.border}`,
              paddingTop: "80px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              style={{ marginBottom: "40px" }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.textDim,
                }}
              >
                Production Tools
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Built for directors.
              </h2>
            </motion.div>

            <div style={{ display: "grid", gap: "12px" }}>
              {FEATURE_STRIPS.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                    whileHover={{ borderColor: "rgba(255,255,255,0.11)" }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      alignItems: "center",
                      gap: "40px",
                      padding: "36px 40px",
                      borderRadius: "20px",
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.025)",
                      transition: "border-color 0.2s ease",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* Left: text */}
                    <div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            background: C.accentSoft,
                            border: `1px solid ${C.accentBorder}`,
                          }}
                        >
                          <Icon size={16} color={feature.accentColor} />
                        </div>
                        <div
                          style={{
                            padding: "3px 10px",
                            borderRadius: radius.full,
                            border: `1px solid ${C.border}`,
                            background: C.surface,
                            fontSize: "11px",
                            color: C.textMuted,
                          }}
                        >
                          {feature.tag}
                        </div>
                      </div>

                      <h3
                        style={{
                          margin: "0 0 12px",
                          fontSize: "26px",
                          fontWeight: 800,
                          letterSpacing: "-0.025em",
                          color: C.text,
                        }}
                      >
                        {feature.title}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          color: "rgba(255,255,255,0.55)",
                          fontSize: "15px",
                          lineHeight: 1.75,
                          maxWidth: "380px",
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {/* Right: visual placeholder */}
                    <div
                      style={{
                        height: "140px",
                        borderRadius: "14px",
                        background: feature.gradient,
                        border: `1px solid rgba(255,255,255,0.05)`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: feature.visualGradient,
                        }}
                      />
                      {/* Abstract visual lines */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "60px",
                          height: "60px",
                          borderRadius: "999px",
                          border: `1px solid rgba(255,255,255,0.08)`,
                          boxShadow: `0 0 40px ${feature.accentColor}`,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "100px",
                          height: "100px",
                          borderRadius: "999px",
                          border: `1px solid rgba(255,255,255,0.04)`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              5. STORY ENGINE + PLATFORM DIRECTION (reduced dominance)
          ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{
              padding: "0 36px 80px",
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr",
              gap: "14px",
            }}
          >
            {/* Story Engine — kept but smaller */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                borderRadius: "22px",
                overflow: "hidden",
                border: `1px solid ${C.accentBorder}`,
                background:
                  "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(255,255,255,0.02) 40%, rgba(124,58,237,0.12))",
                position: "relative",
                padding: "32px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  borderRadius: radius.full,
                  border: "1px solid rgba(34,197,94,0.3)",
                  background: "rgba(34,197,94,0.08)",
                  color: "#86efac",
                  fontSize: "12px",
                  marginBottom: "18px",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "999px",
                    background: "#22c55e",
                    boxShadow: "0 0 10px #22c55e",
                  }}
                />
                Live Module
              </div>

              <h2
                style={{
                  fontSize: "28px",
                  lineHeight: 1.15,
                  margin: "0 0 12px",
                  letterSpacing: "-0.025em",
                  fontWeight: 800,
                }}
              >
                Story Engine
              </h2>

              <p
                style={{
                  margin: "0 0 24px",
                  color: "rgba(255,255,255,0.62)",
                  fontSize: "14.5px",
                  lineHeight: 1.8,
                  maxWidth: "400px",
                }}
              >
                Generate story structures, save projects, and continue building
                characters and scenes inside Kylor AI.
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link href={session ? "/story" : "/signup"} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ boxShadow: "0 18px 40px rgba(124,58,237,0.38)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "42px",
                      padding: "0 18px",
                      borderRadius: radius.md,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "13.5px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: `0 10px 28px ${C.accentGlow}`,
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <Wand2 size={14} />
                    {session ? "Open Story Engine" : "Get Started"}
                  </motion.div>
                </Link>

                <div
                  style={{
                    height: "42px",
                    padding: "0 16px",
                    borderRadius: radius.md,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.border}`,
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "13px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Story → Project → Workspace
                </div>
              </div>
            </motion.div>

            {/* Platform Direction — compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              style={{
                borderRadius: "22px",
                border: `1px solid ${C.border}`,
                background: "rgba(255,255,255,0.02)",
                padding: "28px",
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.textDim,
                }}
              >
                Platform Direction
              </p>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: "20px",
                  lineHeight: 1.2,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
              >
                A cinematic creation operating system.
              </h3>

              <p
                style={{
                  margin: "0 0 20px",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75,
                  fontSize: "13.5px",
                }}
              >
                Story Engine is live. Next: image, video, consistency, and motion-aware AI tools.
              </p>

              <div style={{ display: "grid", gap: "8px" }}>
                {[
                  { text: "Story development foundation is live", live: true },
                  { text: "Image and video engines planned next", live: false },
                  { text: "Consistency and motion as core production tools", live: false },
                ].map(({ text, live }) => (
                  <div
                    key={text}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "999px",
                        background: live ? "#22c55e" : C.accent,
                        boxShadow: live ? "0 0 8px rgba(34,197,94,0.6)" : `0 0 8px ${C.accentGlow}`,
                        flexShrink: 0,
                        marginTop: "4px",
                      }}
                    />
                    {text}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {[
                  { label: "Story", status: "live" },
                  { label: "Image", status: "next" },
                  { label: "Video", status: "next" },
                  { label: "Consistency", status: "planned" },
                  { label: "Motion", status: "planned" },
                ].map(({ label, status }) => (
                  <div
                    key={label}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "7px",
                      border: `1px solid ${status === "live" ? "rgba(34,197,94,0.3)" : C.border}`,
                      background: status === "live" ? "rgba(34,197,94,0.08)" : C.surface,
                      fontSize: "11px",
                      color: status === "live" ? "#86efac" : C.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              6. TOOLS GRID (reduced emphasis)
          ══════════════════════════════════════════════════════════════════ */}
          <section
            style={{
              padding: "0 36px 80px",
              borderTop: `1px solid ${C.border}`,
              paddingTop: "64px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "28px" }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.textDim,
                }}
              >
                All Modules
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                Creative Suite
              </h2>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              {TOOLS.map((tool, i) => {
                const Icon = tool.icon;

                const inner = (
                  <motion.div
                    key={tool.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.45, delay: i * 0.06 }}
                    whileHover={{ y: -4, borderColor: C.accentBorder }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: "18px",
                      padding: "20px",
                      background: "rgba(255,255,255,0.025)",
                      minHeight: "190px",
                      cursor: tool.href !== "#" ? "pointer" : "default",
                      transition: "all 0.18s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {tool.href !== "#" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "14px",
                          right: "14px",
                          width: "22px",
                          height: "22px",
                          borderRadius: "7px",
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <ArrowUpRight size={11} color={C.textMuted} />
                      </div>
                    )}

                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: radius.md,
                        display: "grid",
                        placeItems: "center",
                        background: C.accentSoft,
                        border: `1px solid ${C.accentBorder}`,
                        marginBottom: "12px",
                      }}
                    >
                      <Icon size={16} color="#a78bfa" />
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        padding: "3px 9px",
                        borderRadius: radius.full,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        fontSize: "10.5px",
                        color: C.textMuted,
                        marginBottom: "10px",
                      }}
                    >
                      {tool.tag || tool.badge}
                    </div>

                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "18px",
                        lineHeight: 1.15,
                        fontWeight: 700,
                        letterSpacing: "-0.015em",
                        color: "rgba(255,255,255,0.88)",
                      }}
                    >
                      {tool.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.48)",
                        lineHeight: 1.7,
                        fontSize: "13px",
                      }}
                    >
                      {tool.description}
                    </p>
                  </motion.div>
                );

                return tool.href !== "#" ? (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={tool.title}>{inner}</div>
                );
              })}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              BOTTOM CTA
          ══════════════════════════════════════════════════════════════════ */}
          <section style={{ padding: "0 36px 80px" }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                borderRadius: "24px",
                border: `1px solid rgba(124,58,237,0.2)`,
                background:
                  "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.04))",
                padding: "48px 52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "32px",
                flexWrap: "wrap",
                textAlign: "left",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "28px",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Ready to direct?
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "15px",
                    lineHeight: 1.7,
                    maxWidth: "420px",
                  }}
                >
                  Start with Story Engine — the first live module of Kylor AI's
                  cinematic production platform.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
                <Link href={session ? "/story" : "/signup"} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ boxShadow: "0 20px 48px rgba(124,58,237,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "48px",
                      padding: "0 24px",
                      borderRadius: radius.lg,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "14.5px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      boxShadow: `0 10px 28px ${C.accentGlow}`,
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <Zap size={14} />
                    {session ? "Open Story Engine" : "Get Started Free"}
                  </motion.div>
                </Link>

                {!session && (
                  <Link href="/login" style={{ textDecoration: "none" }}>
                    <motion.div
                      whileHover={{ borderColor: C.borderHover }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        height: "48px",
                        padding: "0 22px",
                        borderRadius: radius.lg,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: "rgba(255,255,255,0.75)",
                        fontWeight: 500,
                        fontSize: "14.5px",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      Sign In
                    </motion.div>
                  </Link>
                )}
              </div>
            </motion.div>
          </section>

        </div>
    </main>
  );
}