"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Clapperboard,
  Image as ImageIcon,
  Video,
  UserCircle2,
  Orbit,
  FolderKanban,
  Compass,
  Settings,
  Folder,
  Grid3X3,
  List,
  ChevronDown,
  Wand2,
  ChevronRight,
  Copy,
  Check,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ─── Tokens (matches image page) ─────────────────────────────────────────────
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

// ─── Sidebar items ────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: "Home", icon: Compass, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Story", icon: Clapperboard, href: "/story", active: true },
  { label: "Image", icon: ImageIcon, href: "/image" },
  { label: "Video", icon: Video, href: "/video" },
  { label: "Consistency", icon: UserCircle2, href: "/consistency" },
  { label: "Motion", icon: Orbit, href: "#" },
  { label: "Projects", icon: FolderKanban, href: "/story" },
  { label: "Settings", icon: Settings, href: "#" },
];

const GENRES = ["Sci-Fi", "Thriller", "Drama", "Horror", "Action", "Mystery", "Romance"];
const TONES = ["Cinematic", "Dark", "Emotional", "Gritty", "Epic", "Suspenseful"];

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <motion.button
        type="button"
        onClick={() => setOpen((p) => !p)}
        whileHover={{ borderColor: C.accentBorder }}
        style={{
          width: "100%", height: "46px", padding: "0 14px", fontSize: "14px",
          borderRadius: radius.md, border: `1px solid ${open ? C.accentBorder : C.border}`,
          background: open ? C.accentSoft : C.surface,
          color: value ? C.text : C.textMuted, outline: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.16s ease",
        }}
      >
        <span style={{ fontWeight: value ? 500 : 400 }}>{value || placeholder}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} color={C.textMuted} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%",
              background: "rgba(14,16,26,0.99)", border: `1px solid ${C.border}`,
              borderRadius: radius.md, boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              overflow: "hidden", zIndex: 1000, backdropFilter: "blur(14px)",
            }}
          >
            {options.map((option, i) => (
              <button
                key={option} type="button"
                onClick={() => { onChange(option); setOpen(false); }}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: value === option ? `linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.18))` : "transparent",
                  color: value === option ? C.text : C.textMuted,
                  border: "none",
                  borderBottom: i !== options.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                  textAlign: "left", cursor: "pointer", fontSize: "14px",
                  fontFamily: "inherit", transition: "background 0.14s ease",
                }}
                onMouseEnter={(e) => { if (value !== option) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { if (value !== option) e.currentTarget.style.background = "transparent"; }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
function SidebarItem({ item }) {
  const Icon = item.icon;
  const inner = (
    <motion.div
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{
        display: "grid", justifyItems: "center", gap: "6px",
        padding: "10px 6px", borderRadius: radius.lg,
        background: item.active ? "linear-gradient(160deg, rgba(79,70,229,0.22), rgba(124,58,237,0.14))" : "transparent",
        border: `1px solid ${item.active ? C.border : "transparent"}`,
        color: item.active ? C.text : C.textMuted,
        cursor: "pointer", transition: "all 0.18s ease",
      }}
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

// ─── Section Block (output content) ──────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted }}>{label}</div>
      <div style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      style={{
        borderRadius: radius.lg, border: `1px solid ${hovered ? C.borderHover : C.border}`,
        background: hovered ? C.surfaceHover : C.surface,
        padding: "14px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: "12px", transition: "all 0.16s ease", cursor: "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <div style={{ width: "38px", height: "38px", borderRadius: radius.sm, flexShrink: 0, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center" }}>
          <FileText size={16} color="#a78bfa" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: C.text, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</div>
          <div style={{ fontSize: "12px", color: C.textMuted }}>
            {project.genre} · {project.tone}
            {project.created_at && (
              <span style={{ marginLeft: "8px", color: C.textDim }}>
                · {new Date(project.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onOpen(project)}
              style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px" }}
            ><ExternalLink size={12} /> Open</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => onDelete(project.id)}
              style={{ width: "32px", height: "32px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}
            ><Trash2 size={13} /></motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StoryPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Sci-Fi");
  const [tone, setTone] = useState("Cinematic");
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [structuredResult, setStructuredResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [assetView, setAssetView] = useState("grid");

  const ideaRef = useRef(null);

  useEffect(() => {
    async function initializePage() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.push("/login"); return; }
      setUser(user);
      await fetchProjects(user);
    }
    initializePage();
  }, [router]);

  async function fetchProjects(currentUser = user) {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from("projects").select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });
    if (!error) setProjects(data || []);
  }

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setStructuredResult(null);
    setActiveTab("Output");
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, genre, tone, idea }),
      });
      const data = await res.json();
      if (data.structuredResult) {
        setStructuredResult(data.structuredResult);
        setResult(data.result || "");
      } else {
        setResult(data.result || "Something went wrong.");
      }
    } catch (err) {
      setResult("Something went wrong while generating the script.");
    } finally {
      setLoading(false);
      setCopied(false);
    }
  }

  function handleNewProject() {
    setTitle(""); setGenre("Sci-Fi"); setTone("Cinematic");
    setIdea(""); setResult(""); setStructuredResult(null);
    setCopied(false); setActiveTab("All");
  }

  async function handleCopy() {
    if (!structuredResult) return;
    const text = `Title: ${structuredResult.title}\n\nGenre: ${structuredResult.genre}\nTone: ${structuredResult.tone}\n\nLogline:\n${structuredResult.logline}\n\nTheme:\n${structuredResult.theme}\n\nMain Characters:\n${structuredResult.characters?.join("\n") || ""}\n\nAct 1:\n${structuredResult.act1}\n\nAct 2:\n${structuredResult.act2}\n\nAct 3:\n${structuredResult.act3}\n\nScene Breakdown:\n${structuredResult.sceneBreakdown?.join("\n") || ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error("Copy failed:", err); }
  }

  async function handleSaveProject() {
    if (!structuredResult) return;
    setSaving(true);
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) { setSaving(false); router.push("/login"); return; }
    const projectTitle = title || structuredResult.title || "Untitled Project";
    const { error } = await supabase.from("projects").insert([{
      user_id: currentUser.id, title: projectTitle,
      genre, tone, idea, structured_result: structuredResult, result,
    }]);
    setSaving(false);
    if (!error) { await fetchProjects(currentUser); setActiveTab("Projects"); }
  }

  function handleLoadProject(project) { router.push(`/project/${project.id}`); }

  async function handleDeleteProject(id) {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) { router.push("/login"); return; }
    await supabase.from("projects").delete().eq("id", id).eq("user_id", currentUser.id);
    await fetchProjects(currentUser);
  }

  const showProjects = activeTab === "Projects";

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

        {/* ── Top Nav Bar ── */}
        <div style={{ borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {/* Back pill */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ borderColor: C.borderHover }} whileTap={{ scale: 0.97 }}
                style={{ height: "30px", padding: "0 14px", borderRadius: radius.full, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "border-color 0.15s ease" }}
              >← Back</motion.div>
            </Link>

            {/* Story Engine badge */}
            <div style={{ height: "30px", padding: "0 12px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px", fontWeight: 500 }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Story Engine
            </div>

            {/* Tab spacer */}
            <div style={{ width: "1px", height: "20px", background: C.border, margin: "0 4px" }} />

            {["All", "Output", "Projects"].map((tab) => (
              <motion.button key={tab} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(tab)}
                style={{ height: "30px", padding: "0 14px", borderRadius: "9px", border: `1px solid ${activeTab === tab ? C.accentBorder : "transparent"}`, background: activeTab === tab ? C.accentSoft : "transparent", color: activeTab === tab ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: activeTab === tab ? 600 : 400, transition: "all 0.15s ease" }}
              >{tab}</motion.button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
              <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setAssetView(val)}
                style={{ width: "34px", height: "34px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: assetView === val ? "rgba(255,255,255,0.08)" : "transparent", color: assetView === val ? C.text : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}
              ><Icon size={15} /></motion.button>
            ))}
            <motion.button whileHover={{ borderColor: C.borderHover }} whileTap={{ scale: 0.96 }}
              style={{ height: "34px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", transition: "border-color 0.15s ease" }}
            ><Folder size={13} /> Assets</motion.button>
          </div>
        </div>

        {/* ── Full-Height Split ── */}
        <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", height: "100%", overflow: "hidden" }}>

          {/* ── Left Panel — Editor ── */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: "linear-gradient(180deg, rgba(7,9,15,0.98), rgba(9,11,17,0.98))", padding: "16px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: "12px", overflow: "hidden", height: "100%" }}>

            {/* Heading */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px" }}>
              <div style={{ color: C.text, fontWeight: 700, fontSize: "14px", position: "relative", display: "inline-block", paddingBottom: "4px" }}>
                Create Story Project
                <span style={{ position: "absolute", left: 0, bottom: "-15px", width: "100%", height: "2px", borderRadius: radius.full, background: `linear-gradient(90deg, ${C.indigo}, ${C.accent})` }} />
              </div>
            </div>

            {/* Form fields */}
            <div style={{ display: "grid", gap: "10px", alignContent: "start", overflowY: "auto", paddingRight: "2px" }}>

              {/* Title */}
              <motion.input
                whileFocus={{ borderColor: C.accentBorder }}
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title (optional)"
                style={{ width: "100%", height: "46px", padding: "0 14px", fontSize: "14px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.16s ease" }}
              />

              {/* Genre + Tone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <CustomSelect value={genre} onChange={setGenre} options={GENRES} />
                <CustomSelect value={tone} onChange={setTone} options={TONES} />
              </div>

              {/* Idea textarea */}
              <div style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "12px", display: "grid", gap: "0" }}>
                <textarea
                  ref={ideaRef}
                  value={idea}
                  onChange={(e) => {
                    setIdea(e.target.value);
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + "px";
                  }}
                  placeholder="Enter your film idea..."
                  rows={6}
                  style={{ width: "100%", border: "none", background: "transparent", color: C.text, resize: "none", fontFamily: "inherit", fontSize: "14px", lineHeight: 1.7, outline: "none", boxSizing: "border-box", minHeight: "120px" }}
                />
                <div style={{ paddingTop: "10px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: C.textDim }}>{idea.length} chars</span>
                  <motion.button whileTap={{ scale: 0.92 }}
                    onClick={() => setIdea("")}
                    style={{ fontSize: "11px", color: C.textMuted, background: "transparent", border: "none", cursor: idea ? "pointer" : "default", fontFamily: "inherit", opacity: idea ? 1 : 0.3 }}
                  >Clear</motion.button>
                </div>
              </div>

              {/* Quick genre chips */}
              <div>
                <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Genre</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {GENRES.map((g) => (
                    <motion.button key={g} whileTap={{ scale: 0.95 }} onClick={() => setGenre(g)}
                      style={{ height: "28px", padding: "0 12px", borderRadius: radius.full, border: `1px solid ${genre === g ? C.accentBorder : C.border}`, background: genre === g ? C.accentSoft : "transparent", color: genre === g ? "#c4b5fd" : C.textMuted, fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s ease" }}
                    >{g}</motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <div style={{ paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <motion.button
                whileHover={{ boxShadow: "0 18px 40px rgba(124,58,237,0.38)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={loading || !idea.trim()}
                style={{
                  width: "100%", height: "46px", borderRadius: radius.md, border: "none",
                  background: idea.trim() && !loading ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.06)",
                  color: idea.trim() && !loading ? "white" : C.textMuted,
                  cursor: idea.trim() && !loading ? "pointer" : "default",
                  fontSize: "14px", fontWeight: 700,
                  boxShadow: idea.trim() && !loading ? "0 14px 32px rgba(124,58,237,0.28)" : "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", fontFamily: "inherit", transition: "all 0.2s ease",
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Sparkles size={15} /></motion.div>
                      Generating Script…
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Wand2 size={15} /> Generate Script <ChevronRight size={15} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* ── Right Panel — Output / Projects ── */}
          <div style={{ background: "rgba(4,5,12,0.95)", display: "grid", gridTemplateRows: "48px 1fr", height: "100%", overflow: "hidden" }}>

            {/* Output toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>
                {showProjects ? "Saved Projects" : (structuredResult ? "Generated Output" : "Story Workspace")}
              </div>
              {!showProjects && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopy} disabled={!structuredResult}
                    style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : C.border}`, background: copied ? "rgba(34,197,94,0.12)" : C.surface, color: copied ? "#86efac" : C.textMuted, cursor: structuredResult ? "pointer" : "default", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.16s ease" }}
                  >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Output</>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveProject} disabled={!structuredResult || saving}
                    style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: structuredResult && !saving ? "pointer" : "default", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  ><Save size={12} /> {saving ? "Saving…" : "Save Project"}</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={handleNewProject}
                    style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  ><Plus size={12} /> New Project</motion.button>
                </div>
              )}
            </div>

            {/* Content canvas */}
            <div style={{ overflow: "auto", padding: "20px", minHeight: 0, height: "100%" }}>

              {/* ── Projects view ── */}
              {showProjects ? (
                <div>
                  {projects.length === 0 ? (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", paddingTop: "80px" }}>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: "280px" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "999px", margin: "0 auto 16px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <FolderKanban size={26} color={C.textDim} />
                        </div>
                        <p style={{ margin: "0 0 6px", color: C.text, fontSize: "15px", fontWeight: 600 }}>No saved projects</p>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: "13px", lineHeight: 1.6 }}>Generate and save a script to see it here.</p>
                      </motion.div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
                      </div>
                      {projects.map((project, i) => (
                        <motion.div key={project.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <ProjectCard project={project} onOpen={handleLoadProject} onDelete={handleDeleteProject} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

              ) : loading ? (
                /* ── Generating state ── */
                <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      style={{ width: "56px", height: "56px", borderRadius: "999px", margin: "0 auto 16px", border: `2px solid ${C.accent}`, borderTopColor: "transparent" }}
                    />
                    <p style={{ margin: "0 0 6px", color: C.text, fontSize: "15px", fontWeight: 600 }}>Generating your script…</p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: "13px" }}>{genre} · {tone}</p>
                  </div>
                </div>

              ) : structuredResult ? (
                /* ── Output view ── */
                <div style={{ maxWidth: "720px" }}>
                  {/* Header card */}
                  <div style={{ borderRadius: radius.lg, border: `1px solid ${C.accentBorder}`, background: `linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.08))`, padding: "18px 20px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px" }}>{structuredResult.title}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {[structuredResult.genre, structuredResult.tone].map((tag) => (
                        <span key={tag} style={{ padding: "3px 10px", borderRadius: "6px", border: `1px solid ${C.accentBorder}`, background: C.accentSoft, fontSize: "12px", color: "#c4b5fd", fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Content sections */}
                  <div style={{ display: "grid", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "16px" }}>
                        <Section label="Logline">{structuredResult.logline}</Section>
                      </div>
                      <div style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "16px" }}>
                        <Section label="Theme">{structuredResult.theme}</Section>
                      </div>
                    </div>

                    <div style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "16px" }}>
                      <Section label="Main Characters">
                        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", display: "grid", gap: "4px" }}>
                          {structuredResult.characters?.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </Section>
                    </div>

                    {[["Act 1", structuredResult.act1], ["Act 2", structuredResult.act2], ["Act 3", structuredResult.act3]].map(([label, content]) => (
                      <div key={label} style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "16px" }}>
                        <Section label={label}>{content}</Section>
                      </div>
                    ))}

                    <div style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "16px" }}>
                      <Section label="Scene Breakdown">
                        <ol style={{ margin: "6px 0 0", paddingLeft: "18px", display: "grid", gap: "6px" }}>
                          {structuredResult.sceneBreakdown?.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                      </Section>
                    </div>
                  </div>
                </div>

              ) : (
                /* ── Empty / default workspace ── */
                <div style={{ maxWidth: "720px" }}>
                  <div style={{ borderRadius: radius.lg, border: `1px solid ${C.border}`, background: C.surface, padding: "20px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px", color: C.text }}>Story Workspace</div>
                    <div style={{ display: "grid", gap: "14px" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "4px" }}>Title</div>
                        <div style={{ fontSize: "15px", color: title ? C.text : C.textDim }}>{title || "Untitled Project"}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "4px" }}>Genre</div>
                          <div style={{ fontSize: "15px", color: C.text }}>{genre}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "4px" }}>Tone</div>
                          <div style={{ fontSize: "15px", color: C.text }}>{tone}</div>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "4px" }}>Idea</div>
                        <div style={{ fontSize: "14.5px", color: idea ? "rgba(255,255,255,0.82)" : C.textDim, lineHeight: 1.7 }}>{idea || "Your idea will appear here."}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "4px" }}>Preview</div>
                        <div style={{ fontSize: "14px", color: C.textDim, lineHeight: 1.7 }}>Generate a script to preview your story here.</div>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    {[
                      { icon: Wand2, label: "AI-Powered", desc: "Structured script with acts & scenes" },
                      { icon: Save, label: "Save Projects", desc: "Store and revisit your stories" },
                      { icon: Clock, label: "Fast Output", desc: "Full script generated in seconds" },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "14px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center", marginBottom: "10px" }}>
                          <Icon size={15} color="#a78bfa" />
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>{label}</div>
                        <div style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}