"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import AppSidebar from "./components/AppSidebar";

// ─── Tokens ─────────────────────────────────────────────
const C = {
  accent: "#7c3aed",
  accentBorder: "rgba(124,58,237,0.35)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.13)",
  surface: "rgba(255,255,255,0.03)",
  text: "white",
  textMuted: "rgba(255,255,255,0.52)",
  textDim: "rgba(255,255,255,0.32)",
  bg: "#05070c",
};

const radius = {
  md: "14px",
  lg: "18px",
  full: "999px",
};

// ─── TOOLS (UPDATED) ────────────────────────────────────
const TOOLS = [
  {
    title: "Image Generation",
    description:
      "Create cinematic stills, concept frames, style explorations, and key visuals.",
    tag: "Coming next",
    icon: ImageIcon,
    href: "/image",
  },
  {
    title: "Video Lab",
    description:
      "Experimental video generation, quick clips, and raw motion outputs.",
    badge: "Live now",
    icon: Video,
    href: "/video",
  },
  {
    title: "Character Consistency",
    description:
      "Keep identity, wardrobe, and visual continuity consistent across outputs.",
    tag: "Coming next",
    icon: UserCircle2,
    href: "#",
  },
  {
    title: "Motion Tools",
    description:
      "Develop motion lock, camera control, subject tracking, and movement workflows.",
    tag: "Coming next",
    icon: Orbit,
    href: "#",
  },
];

export default function Home() {
  const [session, setSession] = useState(null);

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
        background: `
          radial-gradient(circle at 20% 20%, rgba(124,58,237,0.08), transparent),
          radial-gradient(circle at 80% 80%, rgba(79,70,229,0.06), transparent),
          #05070c
        `,
        color: "white",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "88px 1fr" }}>
        <AppSidebar active="Home" />

        <div>
          {/* ── Top Bar ── */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              borderBottom: `1px solid ${C.border}`,
              background: "rgba(5,7,12,0.85)",
              backdropFilter: "blur(16px)",
              padding: "0 28px",
              height: "52px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {session ? (
              <>
                <Link href="/story">
                  <div className="btn">Dashboard</div>
                </Link>
                <button onClick={handleLogout} className="btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <div className="btn">Login</div>
                </Link>
                <Link href="/signup">
                  <div className="btn-primary">Get Started</div>
                </Link>
              </>
            )}
          </div>

          {/* ── Body ── */}
          <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 28px" }}>
            
            {/* HERO TEXT */}
            <h1 style={{ fontSize: "64px", marginBottom: "12px" }}>
              Kylor AI
            </h1>
            <p style={{ color: C.textMuted, marginBottom: "30px" }}>
              Cinematic AI production system for story, image, video and motion.
            </p>

            {/* 🎬 MOVIE STUDIO HERO */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: "26px",
                border: `1px solid rgba(124,58,237,0.45)`,
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(0,0,0,0.4))",
                padding: "34px",
                marginBottom: "20px",
                boxShadow: "0 30px 80px rgba(124,58,237,0.35)",
              }}
            >
              <div style={{ fontSize: "12px", color: "#c4b5fd" }}>
                CINEMA ENGINE
              </div>

              <h2 style={{ fontSize: "42px", fontWeight: 900 }}>
                Movie Studio
              </h2>

              <p style={{ color: "rgba(255,255,255,0.7)", maxWidth: "600px" }}>
                Direct cinematic control over shots, motion, framing, and storytelling.
              </p>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <Link href="/video">
                  <div className="btn-primary">
                    <Clapperboard size={16} /> Open Movie Studio
                  </div>
                </Link>

                <div className="btn">Frame → Motion → Render</div>
              </div>
            </motion.div>

            {/* STORY + PLATFORM */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
              
              <div className="card">
                <h3>Story Engine</h3>
                <p>Build cinematic projects from story to production.</p>
                <Link href="/story">
                  <div className="btn-primary">Open</div>
                </Link>
              </div>

              <div className="card">
                <h3>Platform Direction</h3>
                <p>Kylor is evolving into a cinematic OS.</p>
              </div>
            </div>

            {/* TOOLS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
                marginTop: "20px",
              }}
            >
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.title} href={tool.href}>
                    <div className="card">
                      <Icon size={20} />
                      <h4>{tool.title}</h4>
                      <p>{tool.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SIMPLE STYLES */}
      <style jsx>{`
        .btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid ${C.border};
          cursor: pointer;
        }
        .btn-primary {
          padding: 8px 16px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          cursor: pointer;
        }
        .card {
          padding: 20px;
          border-radius: 18px;
          border: 1px solid ${C.border};
          background: rgba(255,255,255,0.03);
        }
      `}</style>
    </main>
  );
}