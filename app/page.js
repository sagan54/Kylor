"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clapperboard,
  Image as ImageIcon,
  Video,
  UserCircle2,
  Orbit,
  Compass,
  ChevronRight,
  Wand2,
  Zap,
  ArrowUpRight,
  Flame,
  Plus,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// ─── Tokens (matches image/story/project pages) ───────────────────────────────
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
  { label: "Home", icon: Compass, active: true, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Story", icon: Clapperboard, href: "/story" },
  { label: "Image", icon: ImageIcon, href: "/image" },
  { label: "Video", icon: Video, href: "/video" },
  { label: "Consistency", icon: UserCircle2, href: "/consistency" },
  { label: "Motion", icon: Orbit, href: "#" },
];

const TOOLS = [
  {
    title: "Image Generation",
    description: "Create cinematic stills, concept frames, style explorations, and key visuals.",
    tag: "Coming next",
    icon: ImageIcon,
    href: "/image",
  },
  {
    title: "Video Generation",
    description: "Build AI-driven cinematic clips, motion shots, and visual sequences.",
    badge: "Live now",
    icon: Video,
    href: "/video",
  },
  {
    title: "Character Consistency",
    description: "Keep identity, wardrobe, and visual continuity consistent across outputs.",
    tag: "Coming next",
    icon: UserCircle2,
    href: "#",
  },
  {
    title: "Motion Tools",
    description: "Develop motion lock, camera control, subject tracking, and movement workflows.",
    tag: "Coming next",
    icon: Orbit,
    href: "#",
  },
];

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
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

// ─── Sidebar Profile/Credits ──────────────────────────────────────────────────
function SidebarProfile({ credits = 0, onClick, isOpen }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: "100%",
        display: "grid",
        justifyItems: "center",
        gap: "8px",
        padding: "10px 6px",
        borderRadius: radius.lg,
        background: isOpen
          ? "linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))"
          : "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(124,58,237,0.06))",
        border: `1px solid ${C.border}`,
        color: C.text,
        cursor: "pointer",
        transition: "all 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${C.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <UserCircle2 size={20} color="rgba(255,255,255,0.82)" />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.22)",
          color: "#86efac",
          fontSize: "11px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <Flame size={11} fill="#22c55e" color="#22c55e" />
        <span>{credits}</span>
      </div>

      <span
        style={{
          fontSize: "10.5px",
          textAlign: "center",
          lineHeight: 1.2,
          color: C.textMuted,
        }}
      >
        Profile
      </span>
    </motion.button>
  );
}

// ─── Profile Popup ────────────────────────────────────────────────────────────
function ProfilePopup({ session, credits, onClose, onLogout }) {
  const email = session?.user?.email || "Guest User";
  const userId = session?.user?.id ? session.user.id.slice(0, 8) : "No ID";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: "92px",
        bottom: "18px",
        width: "360px",
        borderRadius: "24px",
        border: `1px solid ${C.border}`,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03) 42%, rgba(124,58,237,0.08))",
        backdropFilter: "blur(18px)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        padding: "22px",
        zIndex: 300,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.08)",
              border: `1px solid ${C.border}`,
              flexShrink: 0,
            }}
          >
            <UserCircle2 size={28} color="rgba(255,255,255,0.72)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "4px",
              }}
            >
              {email}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: C.textMuted,
                fontSize: "12px",
              }}
            >
              <span>ID</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: "7px",
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border}`,
                  fontSize: "11px",
                }}
              >
                {userId}
              </span>
            </div>
          </div>
        </div>

        {session ? (
          <Link href="/story" style={{ textDecoration: "none" }}>
            <motion.div
              whileHover={{ boxShadow: "0 10px 28px rgba(34,197,94,0.22)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.12))",
                border: "1px solid rgba(34,197,94,0.28)",
                color: "#b7f7c8",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              Profile
              <ChevronRight size={14} />
            </motion.div>
          </Link>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.12))",
                border: "1px solid rgba(34,197,94,0.28)",
                color: "#b7f7c8",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              Login
              <ChevronRight size={14} />
            </motion.div>
          </Link>
        )}
      </div>

      <div style={{ height: "1px", background: C.border, margin: "0 0 18px" }} />

      <div
        style={{
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: "15px" }}>
          My Workspace
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: C.textMuted,
            fontSize: "13px",
          }}
        >
          All
          <ChevronRight size={14} />
        </div>
      </div>

      <div
        style={{
          borderRadius: "16px",
          border: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.04)",
          padding: "14px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${C.border}`,
              flexShrink: 0,
            }}
          >
            <UserCircle2 size={22} color="rgba(255,255,255,0.72)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "4px" }}>
              Personal Workspace
            </div>
            <div style={{ fontSize: "13px", color: C.textMuted }}>
              {session ? "Private (Only Me)" : "Sign in to access"}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            border: "2px solid #4ade80",
            boxShadow: "0 0 10px rgba(74,222,128,0.35)",
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          borderRadius: "12px",
          border: `1px solid rgba(255,255,255,0.12)`,
          background: "rgba(255,255,255,0.05)",
          height: "46px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          color: "rgba(255,255,255,0.85)",
          fontWeight: 600,
          fontSize: "14px",
          marginBottom: "14px",
        }}
      >
        <Plus size={16} />
        Create Workspace
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          paddingTop: "4px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            borderRadius: "999px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.22)",
            color: "#86efac",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          <Flame size={12} fill="#22c55e" color="#22c55e" />
          {credits} credits
        </div>

        {session ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              await onLogout();
              onClose();
            }}
            style={{
              height: "36px",
              padding: "0 14px",
              borderRadius: "10px",
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.8)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Logout
          </motion.button>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                height: "36px",
                padding: "0 14px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.8)",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              Sign In
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef(null);

  useEffect(() => {
  let mounted = true;

  async function loadCredits(userId) {
    if (!userId) {
      if (mounted) setCredits(0);
      return;
    }

    const { data, error } = await supabase
      .from("user_credits")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (!mounted) return;

    if (error) {
      console.error("Credits load error:", error);
      setCredits(0);
      return;
    }

    setCredits(data?.credits || 0);
  }

  async function bootstrap() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!mounted) return;

    setSession(session);

    if (session?.user?.id) {
      loadCredits(session.user.id);
    } else {
      setCredits(0);
    }
  }

  bootstrap();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return;

    setSession(session);

    if (session?.user?.id) {
      setTimeout(() => {
        if (mounted) loadCredits(session.user.id);
      }, 0);
    } else {
      setCredits(0);
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setCredits(0);
    setProfileOpen(false);
  }

  const quickActions = [
    { title: "Story Engine", subtitle: "Live now", href: session ? "/story" : "/signup" },
    { title: "Project Workspace", subtitle: "Continue building", href: session ? "/story" : "/signup" },
    { title: "Creative Modules", subtitle: "More engines coming", href: "#" },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), radial-gradient(ellipse at 50% 80%, rgba(79,70,229,0.06), transparent 40%), ${C.bg}`,
        color: C.text,
        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "88px 1fr", minHeight: "100vh" }}>
        {/* ── Sidebar — FIXED so it never scrolls ── */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "88px",
            height: "100vh",
            borderRight: `1px solid ${C.border}`,
            background: C.sidebar,
            padding: "18px 10px",
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            zIndex: 100,
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

          <div
            ref={profileWrapRef}
            style={{ marginTop: "auto", paddingTop: "14px", position: "relative" }}
          >
            <SidebarProfile
              credits={credits}
              isOpen={profileOpen}
              onClick={() => setProfileOpen((v) => !v)}
            />

            <AnimatePresence>
              {profileOpen && (
                <ProfilePopup
                  session={session}
                  credits={credits}
                  onClose={() => setProfileOpen(false)}
                  onLogout={handleLogout}
                />
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── Scrollable main content — offset by sidebar width ── */}
        <div style={{ gridColumn: "2", minHeight: "100vh", overflowY: "auto" }}>
          {/* Top bar */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              borderBottom: `1px solid ${C.border}`,
              background: `rgba(5,7,12,0.85)`,
              backdropFilter: "blur(16px)",
              padding: "0 28px",
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
                    whileHover={{ boxShadow: `0 14px 32px rgba(124,58,237,0.38)` }}
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

          {/* Page body */}
          <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px 28px 64px" }}>
            {/* ── Hero ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ marginBottom: "32px" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  border: `1px solid ${C.border}`,
                  borderRadius: radius.full,
                  background: C.surface,
                  color: C.textMuted,
                  fontSize: "12.5px",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "999px",
                    background: C.accent,
                    boxShadow: `0 0 10px ${C.accent}`,
                  }}
                />
                AI Production Engine
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "24px",
                  flexWrap: "wrap",
                  marginBottom: "28px",
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: "64px",
                      lineHeight: 1,
                      margin: "0 0 14px",
                      letterSpacing: "-0.04em",
                      background: "linear-gradient(135deg, #fff 40%, rgba(167,139,250,0.9))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Kylor AI
                  </h1>

                  <p
                    style={{
                      margin: "0 0 8px",
                      maxWidth: "600px",
                      color: "rgba(255,255,255,0.68)",
                      fontSize: "17px",
                      lineHeight: 1.8,
                    }}
                  >
                    A cinematic AI production workspace for story, image, video, character consistency, and motion-driven creative workflows.
                  </p>

                  <p style={{ margin: 0, color: C.textDim, fontSize: "14px" }}>
                    Start free. Build your first cinematic project in minutes.
                  </p>
                </div>

                {/* Quick action cards */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {quickActions.map((action) => {
                    const inner = (
                      <motion.div
                        whileHover={{ y: -3, borderColor: C.accentBorder }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          minWidth: "180px",
                          padding: "14px 16px",
                          borderRadius: radius.lg,
                          border: `1px solid ${C.border}`,
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                          cursor: action.href === "#" ? "default" : "pointer",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <div style={{ fontSize: "11.5px", color: C.textMuted, marginBottom: "8px" }}>
                          {action.subtitle}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "15px", fontWeight: 600, color: C.text }}>
                            {action.title}
                          </span>
                          <ChevronRight size={15} color={C.textMuted} />
                        </div>
                      </motion.div>
                    );

                    return action.href === "#" ? (
                      <div key={action.title}>{inner}</div>
                    ) : (
                      <Link
                        key={action.title}
                        href={action.href}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── Feature cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {/* Story Engine hero card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
                style={{
                  borderRadius: "24px",
                  overflow: "hidden",
                  border: `1px solid ${C.accentBorder}`,
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(255,255,255,0.02) 40%, rgba(124,58,237,0.16))",
                  boxShadow: `0 20px 48px rgba(0,0,0,0.3), 0 0 60px rgba(79,70,229,0.08)`,
                  position: "relative",
                  minHeight: "380px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 15% 20%, rgba(34,197,94,0.1), transparent 22%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.1), transparent 22%)",
                    filter: "blur(12px)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ marginBottom: "auto" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        padding: "5px 12px",
                        borderRadius: radius.full,
                        border: `1px solid rgba(34,197,94,0.3)`,
                        background: "rgba(34,197,94,0.1)",
                        color: "#86efac",
                        fontSize: "12px",
                        marginBottom: "20px",
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
                        fontSize: "36px",
                        lineHeight: 1.1,
                        margin: "0 0 14px",
                        letterSpacing: "-0.025em",
                        fontWeight: 800,
                      }}
                    >
                      Story Engine is live and ready to build cinematic projects.
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.7)",
                        fontSize: "16px",
                        lineHeight: 1.8,
                        maxWidth: "520px",
                      }}
                    >
                      Generate story structures, save projects, open your workspace, and continue building characters, scenes, and cinematic development inside Kylor AI.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
                    <Link href={session ? "/story" : "/signup"} style={{ textDecoration: "none" }}>
                      <motion.div
                        whileHover={{ boxShadow: `0 18px 40px rgba(124,58,237,0.4)` }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          height: "44px",
                          padding: "0 20px",
                          borderRadius: radius.md,
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          boxShadow: `0 10px 28px ${C.accentGlow}`,
                          transition: "box-shadow 0.2s ease",
                        }}
                      >
                        <Wand2 size={15} />
                        {session ? "Open Story Engine" : "Get Started"}
                      </motion.div>
                    </Link>

                    <motion.div
                      whileHover={{ borderColor: C.borderHover }}
                      style={{
                        height: "44px",
                        padding: "0 18px",
                        borderRadius: radius.md,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${C.border}`,
                        color: "rgba(255,255,255,0.75)",
                        fontWeight: 500,
                        fontSize: "14px",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: "default",
                        transition: "border-color 0.15s ease",
                      }}
                    >
                      Story → Project → Workspace
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Platform direction card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.14, ease: "easeOut" }}
                style={{
                  borderRadius: "24px",
                  border: `1px solid ${C.border}`,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  padding: "28px",
                  boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                }}
              >
                <div
                  style={{
                    fontSize: "11.5px",
                    color: C.textMuted,
                    marginBottom: "14px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Platform Direction
                </div>

                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: "26px",
                    lineHeight: 1.15,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Kylor AI is evolving into a cinematic creation operating system.
                </h3>

                <p
                  style={{
                    margin: "0 0 22px",
                    color: "rgba(255,255,255,0.68)",
                    lineHeight: 1.8,
                    fontSize: "14.5px",
                  }}
                >
                  The current active experience is Story Engine. Next modules extend Kylor into image generation, video generation, consistency systems, and motion-aware AI tools.
                </p>

                <div style={{ display: "grid", gap: "10px" }}>
                  {[
                    { text: "Story development foundation is live", live: true },
                    { text: "Image and video engines are planned next", live: false },
                    { text: "Consistency and motion will become core production tools", live: false },
                  ].map(({ text, live }) => (
                    <div
                      key={text}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        color: "rgba(255,255,255,0.76)",
                        fontSize: "13.5px",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          background: live ? "#22c55e" : C.accent,
                          boxShadow: live
                            ? "0 0 10px rgba(34,197,94,0.7)"
                            : `0 0 10px ${C.accentGlow}`,
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
                    marginTop: "22px",
                    paddingTop: "18px",
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
                        background: status === "live" ? "rgba(34,197,94,0.1)" : C.surface,
                        fontSize: "11.5px",
                        color: status === "live" ? "#86efac" : C.textMuted,
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Tools grid ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}
            >
              {TOOLS.map((tool) => {
                const Icon = tool.icon;

                const inner = (
                  <motion.div
                    key={tool.title}
                    whileHover={{ y: -5, borderColor: C.accentBorder }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: "22px",
                      padding: "22px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
                      backdropFilter: "blur(14px)",
                      minHeight: "220px",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
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
                          width: "24px",
                          height: "24px",
                          borderRadius: "7px",
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <ArrowUpRight size={12} color={C.textMuted} />
                      </div>
                    )}

                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: radius.md,
                        display: "grid",
                        placeItems: "center",
                        background: C.accentSoft,
                        border: `1px solid ${C.accentBorder}`,
                        marginBottom: "14px",
                      }}
                    >
                      <Icon size={19} color="#a78bfa" />
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        borderRadius: radius.full,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        fontSize: "11.5px",
                        color: C.textMuted,
                        marginBottom: "12px",
                      }}
                    >
                      {tool.tag || tool.badge}
                    </div>

                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: "22px",
                        lineHeight: 1.12,
                        fontWeight: 800,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {tool.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.62)",
                        lineHeight: 1.75,
                        fontSize: "14px",
                      }}
                    >
                      {tool.description}
                    </p>
                  </motion.div>
                );

                return tool.href !== "#" ? (
                  <Link key={tool.title} href={tool.href} style={{ textDecoration: "none", color: "inherit" }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={tool.title}>{inner}</div>
                );
              })}
            </motion.div>

            {/* ── Bottom CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: "easeOut" }}
              style={{
                marginTop: "20px",
                borderRadius: "24px",
                border: `1px solid ${C.border}`,
                background: "linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.06))",
                padding: "32px 36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    marginBottom: "8px",
                  }}
                >
                  Ready to build?
                </div>

                <p style={{ margin: 0, color: C.textMuted, fontSize: "14.5px", lineHeight: 1.7 }}>
                  Start with Story Engine — the first live module of Kylor AI's cinematic production platform.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                <Link href={session ? "/story" : "/signup"} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ boxShadow: `0 18px 40px rgba(124,58,237,0.38)` }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      height: "44px",
                      padding: "0 22px",
                      borderRadius: radius.md,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "14px",
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
                        height: "44px",
                        padding: "0 20px",
                        borderRadius: radius.md,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 500,
                        fontSize: "14px",
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
          </div>
        </div>
      </div>
    </main>
  );
}