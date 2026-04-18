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
  Flame,
  Plus,
  FolderKanban,
  Settings,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

function getSidebarItems(active) {
  return [
    { label: "Home", icon: Compass, active: active === "Home", href: "/" },
    { label: "Explore", icon: Compass, active: active === "Explore", href: "/explore" },
    { label: "Story", icon: Clapperboard, active: active === "Story", href: "/story" },
{ label: "Image", icon: ImageIcon, active: active === "Image", href: "/image" },

// 🎬 NEW CORE FEATURE
{
  label: "Movie Studio",
  icon: Clapperboard,
  active: active === "Movie Studio",
  href: "/studio",
},

{ label: "Video", icon: Video, active: active === "Video", href: "/video" },
    {
      label: "Consistency",
      icon: UserCircle2,
      active: active === "Consistency",
      href: "/consistency",
    },
    { label: "Motion", icon: Orbit, active: active === "Motion", href: "#" },
    { label: "Projects", icon: FolderKanban, active: active === "Projects", href: "/story" },
    { label: "Settings", icon: Settings, active: active === "Settings", href: "#" },
  ];
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
background:
  item.label === "Movie Studio"
    ? "linear-gradient(160deg, rgba(124,58,237,0.25), rgba(79,70,229,0.18))"
    : item.active
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
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.12))",
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
              Profile <ChevronRight size={14} />
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
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.12))",
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
              Login <ChevronRight size={14} />
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
          All <ChevronRight size={14} />
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
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "white",
                marginBottom: "4px",
              }}
            >
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
          border: "1px solid rgba(255,255,255,0.12)",
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
        <Plus size={16} /> Create Workspace
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

export default function AppSidebar({ active = "Home" }) {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef(null);

  const SIDEBAR_ITEMS = getSidebarItems(active);

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

  return (
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
          background:
            "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))",
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
  );
}