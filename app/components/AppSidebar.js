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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const C = {
  accent: "#7c3aed",
  accentSoft: "rgba(124,58,237,0.15)",
  accentBorder: "rgba(124,58,237,0.4)",
  accentGlow: "rgba(124,58,237,0.22)",
  indigo: "#4f46e5",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  surface: "rgba(255,255,255,0.025)",
  surfaceHover: "rgba(255,255,255,0.05)",
  text: "white",
  textMuted: "rgba(255,255,255,0.42)",
  textDim: "rgba(255,255,255,0.25)",
  bg: "#05070c",
  sidebar: "#060810",
};

const radius = {
  sm: "10px",
  md: "14px",
  lg: "16px",
  xl: "22px",
  full: "999px",
};

function getSidebarItems(active) {
  return [
    { label: "Home", icon: Compass, active: active === "Home", href: "/" },
    { label: "Explore", icon: Compass, active: active === "Explore", href: "/explore" },
    { label: "Story", icon: Clapperboard, active: active === "Story", href: "/story" },
    { label: "Image", icon: ImageIcon, active: active === "Image", href: "/image" },
    {
      label: "Movie Studio",
      icon: Clapperboard,
      active: active === "Movie Studio",
      href: "/studio",
      isFeature: true,
    },
    { label: "Video", icon: Video, active: active === "Video", href: "/video" },
    {
      label: "Consistency",
      icon: UserCircle2,
      active: active === "Consistency",
      href: "/consistency",
    },
    { label: "Motion", icon: Orbit, active: active === "Motion", href: "#" },
  ];
}

/* ─── Divider between navigation groups ─── */
function SectionDivider() {
  return (
    <div
      style={{
        height: "1px",
        margin: "6px 8px",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.06) 60%, transparent)",
      }}
    />
  );
}

function SidebarItem({ item }) {
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);

  const isStudio = item.isFeature;

  const inner = (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        scale: item.active ? 1.02 : hovered ? 1.015 : 1,
        y: hovered && !item.active ? -1 : 0,
      }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{
        display: "grid",
        justifyItems: "center",
        gap: "7px",
        padding: "11px 6px",
        borderRadius: radius.lg,
        background: isStudio
          ? "linear-gradient(155deg, rgba(124,58,237,0.22) 0%, rgba(79,70,229,0.14) 100%)"
          : item.active
          ? "linear-gradient(155deg, rgba(79,70,229,0.2) 0%, rgba(124,58,237,0.12) 100%)"
          : hovered
          ? "rgba(255,255,255,0.04)"
          : "transparent",
        border: `1px solid ${
          isStudio
            ? "rgba(124,58,237,0.35)"
            : item.active
            ? "rgba(124,58,237,0.28)"
            : hovered
            ? "rgba(255,255,255,0.08)"
            : "transparent"
        }`,
        boxShadow: item.active
          ? "0 0 22px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
          : isStudio
          ? "0 0 28px rgba(124,58,237,0.18)"
          : "none",
        color: item.active || hovered ? C.text : C.textMuted,
        cursor: "pointer",
        transition: "background 0.18s ease, border 0.18s ease, box-shadow 0.18s ease, color 0.18s ease",
        position: "relative",
      }}
    >
      {/* Active left-edge accent bar */}
      {item.active && (
        <div
          style={{
            position: "absolute",
            left: "-1px",
            top: "20%",
            height: "60%",
            width: "2px",
            borderRadius: "0 2px 2px 0",
            background: "linear-gradient(180deg, #7c3aed, #4f46e5)",
            boxShadow: "0 0 8px rgba(124,58,237,0.6)",
          }}
        />
      )}

      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "11px",
          display: "grid",
          placeItems: "center",
          background: item.active
            ? "rgba(255,255,255,0.08)"
            : hovered
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.025)",
          border: `1px solid ${
            item.active
              ? "rgba(255,255,255,0.1)"
              : hovered
              ? "rgba(255,255,255,0.07)"
              : "rgba(255,255,255,0.04)"
          }`,
          transition: "all 0.18s ease",
          color: item.active
            ? "rgba(255,255,255,0.92)"
            : hovered
            ? "rgba(255,255,255,0.75)"
            : "rgba(255,255,255,0.48)",
        }}
      >
        <Icon size={16} strokeWidth={item.active ? 2 : 1.75} />
      </div>

      <div style={{ position: "relative" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: item.active ? 600 : 500,
            letterSpacing: "0.01em",
            textAlign: "center",
            lineHeight: 1.2,
            display: "block",
            transition: "color 0.18s ease",
          }}
        >
          {item.label}
        </span>

        {/* "NEW" badge for Movie Studio */}
        {isStudio && (
          <div
            style={{
              position: "absolute",
              top: "-14px",
              right: "-18px",
              padding: "1px 5px",
              borderRadius: "4px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "white",
              fontSize: "8px",
              fontWeight: 800,
              letterSpacing: "0.06em",
              lineHeight: 1.5,
              boxShadow: "0 2px 8px rgba(124,58,237,0.45)",
            }}
          >
            NEW
          </div>
        )}
      </div>
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
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: hovered ? 1.015 : 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{
        width: "100%",
        display: "grid",
        justifyItems: "center",
        gap: "8px",
        padding: "11px 6px",
        borderRadius: radius.lg,
        background: isOpen
          ? "linear-gradient(155deg, rgba(79,70,229,0.2), rgba(124,58,237,0.12))"
          : hovered
          ? "rgba(255,255,255,0.04)"
          : "transparent",
        border: `1px solid ${
          isOpen ? "rgba(124,58,237,0.28)" : hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"
        }`,
        boxShadow: isOpen ? "0 0 22px rgba(124,58,237,0.18)" : "none",
        color: C.text,
        cursor: "pointer",
        transition: "all 0.18s ease",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "11px",
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,0.06)",
          border: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <UserCircle2 size={18} color="rgba(255,255,255,0.75)" />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          padding: "2px 7px",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#86efac",
          fontSize: "10px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <Flame size={10} fill="#22c55e" color="#22c55e" />
        <span>{credits}</span>
      </div>

      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.2,
          color: hovered ? "rgba(255,255,255,0.7)" : C.textMuted,
          transition: "color 0.18s ease",
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
      initial={{ opacity: 0, x: -14, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -10, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "absolute",
        left: "96px",
        bottom: "18px",
        width: "360px",
        borderRadius: "22px",
        border: `1px solid rgba(255,255,255,0.08)`,
        background:
          "linear-gradient(145deg, rgba(12,14,24,0.98) 0%, rgba(8,10,18,0.98) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow:
          "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        padding: "22px",
        zIndex: 300,
      }}
    >
      {/* Subtle top glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "60%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)",
        }}
      />

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
              width: "52px",
              height: "52px",
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid rgba(255,255,255,0.1)`,
              flexShrink: 0,
            }}
          >
            <UserCircle2 size={26} color="rgba(255,255,255,0.7)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "5px",
                letterSpacing: "-0.01em",
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
                fontSize: "11px",
              }}
            >
              <span style={{ color: C.textDim }}>ID</span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid rgba(255,255,255,0.08)`,
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.5)",
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
              whileHover={{ boxShadow: "0 8px 24px rgba(34,197,94,0.2)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                height: "38px",
                padding: "0 15px",
                borderRadius: "11px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.22)",
                color: "#b7f7c8",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Profile <ChevronRight size={13} />
            </motion.div>
          </Link>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                height: "38px",
                padding: "0 15px",
                borderRadius: "11px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.22)",
                color: "#b7f7c8",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              Login <ChevronRight size={13} />
            </motion.div>
          </Link>
        )}
      </div>

      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)",
          margin: "0 0 18px",
        }}
      />

      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.88)", fontWeight: 700, fontSize: "14px", letterSpacing: "-0.01em" }}>
          My Workspace
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            color: C.textMuted,
            fontSize: "12px",
          }}
        >
          All <ChevronRight size={13} />
        </div>
      </div>

      <div
        style={{
          borderRadius: "14px",
          border: `1px solid rgba(255,255,255,0.07)`,
          background: "rgba(255,255,255,0.03)",
          padding: "13px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid rgba(255,255,255,0.08)`,
              flexShrink: 0,
            }}
          >
            <UserCircle2 size={20} color="rgba(255,255,255,0.65)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                marginBottom: "3px",
                letterSpacing: "-0.01em",
              }}
            >
              Personal Workspace
            </div>
            <div style={{ fontSize: "11px", color: C.textMuted }}>
              {session ? "Private · Only Me" : "Sign in to access"}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "999px",
            border: "1.5px solid #4ade80",
            boxShadow: "0 0 8px rgba(74,222,128,0.3)",
            flexShrink: 0,
          }}
        />
      </div>

      <motion.div
        whileHover={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" }}
        style={{
          borderRadius: "11px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          height: "42px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          color: "rgba(255,255,255,0.7)",
          fontWeight: 600,
          fontSize: "13px",
          marginBottom: "14px",
          cursor: "pointer",
          transition: "all 0.18s ease",
          letterSpacing: "0.01em",
        }}
      >
        <Plus size={15} /> Create Workspace
      </motion.div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "999px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.18)",
            color: "#86efac",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          <Flame size={11} fill="#22c55e" color="#22c55e" />
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
              height: "34px",
              padding: "0 14px",
              borderRadius: "9px",
              border: `1px solid rgba(255,255,255,0.08)`,
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.65)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.18s ease",
            }}
          >
            Logout
          </motion.button>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              style={{
                height: "34px",
                padding: "0 14px",
                borderRadius: "9px",
                border: `1px solid rgba(255,255,255,0.08)`,
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.65)",
                fontSize: "12px",
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
        width: "84px",
        height: "100vh",
        borderRight: `1px solid rgba(255,255,255,0.05)`,
        background:
          "linear-gradient(180deg, #07090f 0%, #060810 60%, #050710 100%)",
        padding: "20px 8px 20px",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        zIndex: 100,
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.03), 4px 0 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Logo mark */}
      <div style={{ display: "grid", placeItems: "center", marginBottom: "24px" }}>
        <motion.div
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.2))",
            border: `1px solid rgba(124,58,237,0.3)`,
            boxShadow: `0 0 24px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.08)`,
            cursor: "pointer",
          }}
        >
          <Sparkles size={18} color="#a78bfa" strokeWidth={1.75} />
        </motion.div>
      </div>

      {/* Nav items */}
      <div style={{ display: "grid", gap: "4px" }}>
        {SIDEBAR_ITEMS.map((item, i) => {
          // Insert a subtle divider before "Movie Studio" and before "Projects"
          const dividerBefore = item.label === "Movie Studio";
          return (
            <div key={item.label}>
              {dividerBefore && <SectionDivider />}
              <SidebarItem item={item} />
            </div>
          );
        })}
      </div>

      {/* Profile */}
      <div
        ref={profileWrapRef}
        style={{ marginTop: "auto", paddingTop: "12px", position: "relative" }}
      >
        {/* Divider above profile */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.06) 60%, transparent)",
            marginBottom: "10px",
          }}
        />

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