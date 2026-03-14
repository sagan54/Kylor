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
  Search,
  Heart,
  Download,
  Share2,
  Play,
  Eye,
  TrendingUp,
  Clock,
  Star,
  Filter,
  X,
  ChevronDown,
  Flame,
  Zap,
  BookOpen,
} from "lucide-react";
import { useState, useRef } from "react";

// ─── Tokens (matches all other pages) ────────────────────────────────────────
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
const radius = { sm: "10px", md: "14px", lg: "18px", xl: "22px", full: "999px" };

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: "Home", icon: Compass, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore", active: true },
  { label: "Story", icon: Clapperboard, href: "/story" },
  { label: "Image", icon: ImageIcon, href: "/image" },
  { label: "Video", icon: Video, href: "#" },
{ label: "Consistent", icon: UserCircle2, href: "/consistent" },
  { label: "Motion", icon: Orbit, href: "#" },
  { label: "Projects", icon: FolderKanban, href: "/story" },
  { label: "Settings", icon: Settings, href: "#" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const ITEMS = [
  { id: 1, type: "image", title: "Cinematic Forest", user: "aurora_v", likes: 2841, views: 18200, gradient: "linear-gradient(135deg, #0f4c75 0%, #1b6ca8 40%, #16a085 100%)", tag: "Trending", tagColor: "#f59e0b" },
  { id: 2, type: "video", title: "Space Launch Shot", user: "cosmos_fx", likes: 4120, views: 31400, gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9d4edd 100%)", tag: "Featured", tagColor: "#a78bfa" },
  { id: 3, type: "image", title: "Cyberpunk Street", user: "neon_kai", likes: 3367, views: 24100, gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #1d4ed8 100%)", tag: "Popular", tagColor: "#34d399" },
  { id: 4, type: "story", title: "The Last Oracle", user: "lore_smith", likes: 1892, views: 9800, gradient: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #312e81 100%)", tag: "Story", tagColor: "#c4b5fd" },
  { id: 5, type: "video", title: "Flying Car Scene", user: "motion_lab", likes: 5203, views: 42000, gradient: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #5b21b6 100%)", tag: "Top Rated", tagColor: "#fbbf24" },
  { id: 6, type: "image", title: "Fantasy Castle", user: "dreamweave", likes: 2100, views: 15700, gradient: "linear-gradient(135deg, #0d9488 0%, #059669 50%, #047857 100%)", tag: "New", tagColor: "#6ee7b7" },
  { id: 7, type: "story", title: "Echoes of the Void", user: "dark_prose", likes: 988, views: 6400, gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)", tag: "Story", tagColor: "#c4b5fd" },
  { id: 8, type: "image", title: "Golden Hour Portrait", user: "lenscraft", likes: 3750, views: 28900, gradient: "linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)", tag: "Trending", tagColor: "#f59e0b" },
  { id: 9, type: "video", title: "Robot Battle", user: "mech_studio", likes: 6100, views: 51200, gradient: "linear-gradient(135deg, #5b21b6 0%, #6d28d9 50%, #7c3aed 100%)", tag: "Viral", tagColor: "#f87171" },
  { id: 10, type: "image", title: "Arctic Silence", user: "frost_vfx", likes: 1430, views: 11000, gradient: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #0ea5e9 100%)", tag: "New", tagColor: "#6ee7b7" },
  { id: 11, type: "story", title: "Neon Requiem", user: "pulse_write", likes: 2240, views: 13800, gradient: "linear-gradient(135deg, #831843 0%, #9d174d 40%, #be185d 100%)", tag: "Story", tagColor: "#c4b5fd" },
  { id: 12, type: "video", title: "Ocean Storm", user: "tide_motion", likes: 3980, views: 33600, gradient: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)", tag: "Popular", tagColor: "#34d399" },
];

const FILTER_TABS = ["All", "Images", "Videos", "Stories"];
const SORT_OPTIONS = ["Trending", "Most Recent", "Most Liked", "Most Viewed"];

function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{ display: "grid", justifyItems: "center", gap: "6px", padding: "10px 6px", borderRadius: radius.lg, background: item.active ? "linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))" : "transparent", border: `1px solid ${item.active ? C.border : "transparent"}`, color: item.active ? C.text : C.textMuted, cursor: "pointer", transition: "all 0.18s ease" }}
    >
      <div style={{ width: "36px", height: "36px", borderRadius: "12px", display: "grid", placeItems: "center", background: item.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)" }}>
        <Icon size={17} />
      </div>
      <span style={{ fontSize: "10.5px", textAlign: "center", lineHeight: 1.2 }}>{item.label}</span>
    </motion.div>
  );
  return item.href === "#" ? <div>{inner}</div> : (
    <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>
  );
}

function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ExploreCard({ item, featured = false, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);

  const TypeIcon = item.type === "video" ? Play : item.type === "story" ? BookOpen : ImageIcon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      style={{ borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${hovered ? C.borderHover : C.border}`, cursor: "pointer", position: "relative", background: item.gradient, transition: "border-color 0.18s ease", aspectRatio: featured ? "16/9" : "4/5" }}
    >
      {/* Shimmer overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Type badge */}
      <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: radius.full, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.1)`, fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
        <TypeIcon size={10} />
        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
      </div>

      {/* Tag */}
      <div style={{ position: "absolute", top: "12px", right: "12px", padding: "3px 9px", borderRadius: radius.full, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", fontSize: "10.5px", color: item.tagColor, fontWeight: 700, border: `1px solid ${item.tagColor}30` }}>
        {item.tag}
      </div>

      {/* Video play ring */}
      {item.type === "video" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <motion.div animate={{ scale: hovered ? 1.1 : 1 }} transition={{ duration: 0.2 }}
            style={{ width: "48px", height: "48px", borderRadius: "999px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)", display: "grid", placeItems: "center" }}
          >
            <Play size={18} fill="white" color="white" style={{ marginLeft: "2px" }} />
          </motion.div>
        </div>
      )}

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }}
          />
        )}
      </AnimatePresence>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 14px 14px", background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}>
        <div style={{ fontSize: featured ? "18px" : "14px", fontWeight: 800, color: C.text, marginBottom: "4px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{item.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>by {item.user}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}>
              <Eye size={10} />{fmtNum(item.views)}
            </span>
            <span style={{ fontSize: "11px", color: liked ? "#f87171" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "3px" }}>
              <Heart size={10} fill={liked ? "#f87171" : "none"} />{fmtNum(item.likes + (liked ? 1 : 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            style={{ position: "absolute", bottom: "52px", right: "12px", display: "flex", gap: "6px" }}
          >
            {[
              { Icon: Heart, action: () => setLiked((p) => !p), active: liked, color: "#f87171" },
              { Icon: Download, action: (e) => e.stopPropagation() },
              { Icon: Share2, action: (e) => e.stopPropagation() },
            ].map(({ Icon, action, active, color }, i) => (
              <motion.button key={i} whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); action(e); }}
                style={{ width: "32px", height: "32px", borderRadius: "9px", border: `1px solid rgba(255,255,255,0.14)`, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: active ? color : "white", display: "grid", placeItems: "center", cursor: "pointer", transition: "color 0.15s ease" }}
              ><Icon size={13} fill={active ? color : "none"} /></motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ item, onClose }) {
  const [liked, setLiked] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(700px, 90vw)", borderRadius: radius.xl, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}
      >
        {/* Preview */}
        <div style={{ aspectRatio: "16/9", background: item.gradient, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 60%)" }} />
          {item.type === "video" && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "999px", background: "rgba(0,0,0,0.5)", border: "1.5px solid rgba(255,255,255,0.2)", display: "grid", placeItems: "center" }}>
                <Play size={24} fill="white" color="white" style={{ marginLeft: "3px" }} />
              </div>
            </div>
          )}
          {/* Close */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ position: "absolute", top: "12px", right: "12px", width: "36px", height: "36px", borderRadius: "10px", border: `1px solid rgba(255,255,255,0.14)`, background: "rgba(0,0,0,0.6)", color: "white", display: "grid", placeItems: "center", cursor: "pointer" }}
          ><X size={15} /></motion.button>
        </div>

        {/* Info panel */}
        <div style={{ background: "#0c0e18", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>{item.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: C.textMuted }}>by <span style={{ color: "#c4b5fd" }}>{item.user}</span></span>
                <span style={{ width: "1px", height: "12px", background: C.border }} />
                <span style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", color: item.tagColor, background: item.tagColor + "18", border: `1px solid ${item.tagColor}30`, fontWeight: 600 }}>{item.tag}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <motion.button whileTap={{ scale: 0.94 }} onClick={() => setLiked((p) => !p)}
                style={{ height: "36px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${liked ? "rgba(248,113,113,0.35)" : C.border}`, background: liked ? "rgba(248,113,113,0.1)" : C.surface, color: liked ? "#f87171" : C.textMuted, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "inherit" }}
              ><Heart size={13} fill={liked ? "#f87171" : "none"} />{fmtNum(item.likes + (liked ? 1 : 0))}</motion.button>
              <motion.button whileTap={{ scale: 0.94 }}
                style={{ height: "36px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontFamily: "inherit" }}
              ><Download size={13} /> Save</motion.button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            {[{ icon: Eye, label: "Views", value: fmtNum(item.views) }, { icon: Heart, label: "Likes", value: fmtNum(item.likes) }].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ padding: "10px 16px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon size={13} color={C.textMuted} />
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{value}</div>
                  <div style={{ fontSize: "10.5px", color: C.textMuted }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Trending");
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [lightboxItem, setLightboxItem] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const sortRef = useRef(null);

  const filtered = ITEMS.filter((item) => {
    const matchType = filter === "All" || item.type === filter.slice(0, -1).toLowerCase();
    const matchSearch = !search.trim() || item.title.toLowerCase().includes(search.toLowerCase()) || item.user.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const featured = filtered.slice(0, 2);
  const rest = filtered.slice(2);

  const SortIcon = sort === "Trending" ? Flame : sort === "Most Recent" ? Clock : sort === "Most Liked" ? Heart : TrendingUp;

  return (
    <main style={{
      height: "100vh", overflow: "hidden",
      background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), ${C.bg}`,
      color: C.text, fontFamily: "'Inter', 'SF Pro Display', sans-serif",
      display: "grid", gridTemplateColumns: "88px 1fr",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{ borderRight: `1px solid ${C.border}`, background: C.sidebar, padding: "18px 10px", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ width: "46px", height: "46px", borderRadius: "16px", margin: "0 auto 22px", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))", border: `1px solid ${C.border}`, boxShadow: `0 0 20px ${C.accentGlow}` }}>
          <Sparkles size={20} color="#a78bfa" />
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {SIDEBAR_ITEMS.map((item) => <SidebarItem key={item.label} item={item} />)}
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ display: "grid", gridTemplateRows: "48px 1fr", height: "100vh", overflow: "hidden" }}>

        {/* ── Top Nav ── */}
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {/* Explore badge */}
            <div style={{ height: "30px", padding: "0 12px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px", fontWeight: 600 }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Explore
            </div>
            <div style={{ width: "1px", height: "20px", background: C.border, margin: "0 4px" }} />
            {FILTER_TABS.map((tab) => (
              <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setFilter(tab)}
                style={{ height: "30px", padding: "0 12px", borderRadius: "9px", border: `1px solid ${filter === tab ? C.accentBorder : "transparent"}`, background: filter === tab ? C.accentSoft : "transparent", color: filter === tab ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", fontWeight: filter === tab ? 600 : 400, transition: "all 0.15s ease" }}
              >{tab}</motion.button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Search */}
            <motion.div animate={{ width: searchFocused ? "220px" : "160px" }} transition={{ duration: 0.2 }}
              style={{ height: "34px", borderRadius: radius.sm, border: `1px solid ${searchFocused ? C.accentBorder : C.border}`, background: searchFocused ? C.accentSoft : C.surface, display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", overflow: "hidden", transition: "border-color 0.2s ease" }}
            >
              <Search size={13} color={searchFocused ? "#a78bfa" : C.textMuted} style={{ flexShrink: 0 }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search creators, titles…"
                style={{ flex: 1, border: "none", background: "transparent", color: C.text, fontSize: "12.5px", outline: "none", fontFamily: "inherit", minWidth: 0 }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ border: "none", background: "transparent", color: C.textMuted, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><X size={11} /></button>
              )}
            </motion.div>

            {/* Sort */}
            <div ref={sortRef} style={{ position: "relative" }}>
              <motion.button whileHover={{ borderColor: C.borderHover }} whileTap={{ scale: 0.96 }} onClick={() => setSortOpen((p) => !p)}
                style={{ height: "34px", padding: "0 12px", borderRadius: radius.sm, border: `1px solid ${sortOpen ? C.accentBorder : C.border}`, background: sortOpen ? C.accentSoft : C.surface, color: sortOpen ? "#c4b5fd" : "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", transition: "all 0.15s ease" }}
              >
                <SortIcon size={12} />
                {sort}
                <motion.div animate={{ rotate: sortOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={12} /></motion.div>
              </motion.button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: "170px", background: "rgba(12,14,22,0.99)", border: `1px solid ${C.border}`, borderRadius: radius.md, boxShadow: "0 20px 50px rgba(0,0,0,0.4)", overflow: "hidden", zIndex: 100, backdropFilter: "blur(14px)" }}
                  >
                    {SORT_OPTIONS.map((opt, i) => (
                      <button key={opt} onClick={() => { setSort(opt); setSortOpen(false); }}
                        style={{ width: "100%", padding: "10px 14px", background: sort === opt ? "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.15))" : "transparent", color: sort === opt ? "#c4b5fd" : C.textMuted, border: "none", borderBottom: i !== SORT_OPTIONS.length - 1 ? `1px solid ${C.border}` : "none", textAlign: "left", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", transition: "background 0.14s ease" }}
                        onMouseEnter={(e) => { if (sort !== opt) e.currentTarget.style.background = C.surfaceHover; }}
                        onMouseLeave={(e) => { if (sort !== opt) e.currentTarget.style.background = "transparent"; }}
                      >{opt}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{ overflow: "auto", minHeight: 0 }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 24px 48px" }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "28px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: radius.full, background: C.surface, color: C.textMuted, fontSize: "12px", marginBottom: "14px" }}>
                <Zap size={11} color="#a78bfa" /> {filtered.length} creations
              </div>
              <h1 style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1, background: "linear-gradient(135deg, #fff 40%, rgba(167,139,250,0.85))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Explore
              </h1>
              <p style={{ margin: 0, color: C.textMuted, fontSize: "15px", lineHeight: 1.6 }}>
                Discover cinematic images, videos, and stories built with Kylor AI.
              </p>
            </motion.div>

            {filtered.length === 0 ? (
              <div style={{ display: "grid", placeItems: "center", paddingTop: "80px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                    <Search size={24} color={C.textDim} />
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700 }}>No results found</p>
                  <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>Try a different search or filter.</p>
                </div>
              </div>
            ) : (
              <>
                {/* ── Featured row (first 2) ── */}
                {featured.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.06 }} style={{ display: "grid", gridTemplateColumns: featured.length === 1 ? "1fr" : "1.3fr 1fr", gap: "14px", marginBottom: "14px" }}>
                    {featured.map((item) => (
                      <ExploreCard key={item.id} item={item} featured onClick={() => setLightboxItem(item)} />
                    ))}
                  </motion.div>
                )}

                {/* ── Grid (rest) ── */}
                {rest.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}
                  >
                    {rest.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                        <ExploreCard item={item} onClick={() => setLightboxItem(item)} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxItem && <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}
      </AnimatePresence>
    </main>
  );
}