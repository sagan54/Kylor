"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Folder,
  Grid3X3,
  List,
  ChevronDown,
  Wand2,
  ChevronRight,
  Save,
  X,
  Pencil,
  Users,
  Film,
  Layout,
  StickyNote,
  BookOpen,
  Zap,
  Check,
  ImagePlus,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

// ─── Tokens (matches image/story page) ───────────────────────────────────────
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

const GENRES = ["Sci-Fi", "Thriller", "Drama", "Horror", "Action", "Mystery", "Romance"];
const TONES = ["Cinematic", "Dark", "Emotional", "Gritty", "Epic", "Suspenseful"];

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

const TABS = [
  { id: "Overview", icon: BookOpen },
  { id: "Characters", icon: Users },
  { id: "Scenes", icon: Film },
  { id: "Storyboard", icon: ImagePlus },
  { id: "Notes", icon: StickyNote },
];

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <motion.button type="button" onClick={() => setOpen((p) => !p)}
        whileHover={{ borderColor: C.accentBorder }}
        style={{ width: "100%", height: "44px", padding: "0 14px", fontSize: "13.5px", borderRadius: radius.md, border: `1px solid ${open ? C.accentBorder : C.border}`, background: open ? C.accentSoft : C.surface, color: C.text, outline: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit", transition: "all 0.16s ease" }}
      >
        <span style={{ fontWeight: 500 }}>{value}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color={C.textMuted} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%", background: "rgba(14,16,26,0.99)", border: `1px solid ${C.border}`, borderRadius: radius.md, boxShadow: "0 20px 50px rgba(0,0,0,0.4)", overflow: "hidden", zIndex: 1000, backdropFilter: "blur(14px)" }}
          >
            {options.map((opt, i) => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                style={{ width: "100%", padding: "10px 14px", background: value === opt ? "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.18))" : "transparent", color: value === opt ? C.text : C.textMuted, border: "none", borderBottom: i !== options.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none", textAlign: "left", cursor: "pointer", fontSize: "13.5px", fontFamily: "inherit", transition: "background 0.14s ease" }}
                onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = C.surfaceHover; }}
                onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
              >{opt}</button>
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

// ─── Section Block ────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted }}>{label}</div>
      <div style={{ fontSize: "14.5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ borderRadius: radius.lg, border: `1px solid ${C.border}`, background: C.surface, padding: "18px", ...style }}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectPage({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [assetView, setAssetView] = useState("grid");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("Sci-Fi");
  const [editTone, setEditTone] = useState("Cinematic");
  const [editIdea, setEditIdea] = useState("");

  // Characters
  const [characterBios, setCharacterBios] = useState([]);
  const [biosLoading, setBiosLoading] = useState(false);

  // Scenes
  const [expandedScenes, setExpandedScenes] = useState({});
  const [sceneLoadingIndex, setSceneLoadingIndex] = useState(null);

  // Storyboard
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push("/login"); return; }
      setUser(user);
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
      if (error) { setProject(null); setPageLoading(false); return; }
      setProject(data);
      setEditTitle(data.title || "");
      setEditGenre(data.genre || "Sci-Fi");
      setEditTone(data.tone || "Cinematic");
      setEditIdea(data.idea || "");
      setPageLoading(false);
    }
    if (projectId) fetchProject();
  }, [projectId, router]);

  async function handleSaveEdits() {
    if (!user || !project) return;
    setSavingEdits(true);
    const updatedStructured = project.structured_result ? { ...project.structured_result, title: editTitle || project.structured_result.title, genre: editGenre, tone: editTone } : project.structured_result;
    const { error } = await supabase.from("projects").update({ title: editTitle || "Untitled Project", genre: editGenre, tone: editTone, idea: editIdea, structured_result: updatedStructured }).eq("id", projectId).eq("user_id", user.id);
    setSavingEdits(false);
    if (!error) { setProject({ ...project, title: editTitle || "Untitled Project", genre: editGenre, tone: editTone, idea: editIdea, structured_result: updatedStructured }); setEditMode(false); }
  }

  async function handleGenerateCharacterBios() {
    const characters = project?.structured_result?.characters || [];
    if (!characters.length) return;
    setBiosLoading(true);
    try {
      const res = await fetch("/api/character-bios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: project.title, genre: project.genre, tone: project.tone, idea: project.idea, characters }) });
      const data = await res.json();
      if (!data.error) setCharacterBios(data.characters || []);
    } catch (e) { console.error(e); }
    setBiosLoading(false);
  }

  async function handleGenerateScene(scene, index) {
    setSceneLoadingIndex(index);
    try {
      const res = await fetch("/api/expand-scene", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: project.title, genre: project.genre, tone: project.tone, idea: project.idea, scene }) });
      const data = await res.json();
      if (!data.error) setExpandedScenes((prev) => ({ ...prev, [index]: data }));
    } catch (e) { console.error(e); }
    setSceneLoadingIndex(null);
  }

  async function generateImage() {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    try {
      const res = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: imagePrompt }) });
      const data = await res.json();
      if (!data.error) {
        setGeneratedImage(data.image || data?.generation?.images?.[0] || null);
      }
    } catch (e) { console.error(e); }
    setImageLoading(false);
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <main style={{ height: "100vh", overflow: "hidden", background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), ${C.bg}`, color: C.text, fontFamily: "'Inter', 'SF Pro Display', sans-serif", display: "grid", gridTemplateColumns: "88px 1fr" }}>
        <aside style={{ borderRight: `1px solid ${C.border}`, background: C.sidebar, padding: "18px 10px", height: "100vh" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "16px", margin: "0 auto", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))", border: `1px solid ${C.border}` }}>
            <Sparkles size={20} color="#a78bfa" />
          </div>
        </aside>
        <div style={{ display: "grid", placeItems: "center" }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", maxWidth: "380px", width: "100%", padding: "0 24px" }}>
            <div style={{ width: "60px", height: "60px", margin: "0 auto 20px", borderRadius: "18px", display: "grid", placeItems: "center", background: "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))", border: `1px solid ${C.border}`, boxShadow: `0 14px 28px ${C.accentGlow}` }}>
              <Sparkles size={24} color="#a78bfa" />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: "18px", fontWeight: 700 }}>Opening Project Workspace</p>
            <p style={{ margin: "0 0 24px", color: C.textMuted, fontSize: "14px" }}>Loading your saved story and workspace modules…</p>
            <div style={{ width: "100%", height: "4px", borderRadius: radius.full, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div initial={{ x: "-35%" }} animate={{ x: "115%" }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                style={{ width: "35%", height: "100%", borderRadius: radius.full, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: `0 0 16px ${C.accentGlow}` }}
              />
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <main style={{ height: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Project not found or access denied</p>
          <Link href="/story" style={{ textDecoration: "none" }}>
            <motion.div whileTap={{ scale: 0.97 }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 16px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: "13px", cursor: "pointer" }}>
              ← Back to Story Engine
            </motion.div>
          </Link>
        </div>
      </main>
    );
  }

  const structured = project.structured_result;

  return (
    <main style={{ height: "100vh", overflow: "hidden", background: `radial-gradient(ellipse at 8% 12%, rgba(79,70,229,0.13), transparent 28%), radial-gradient(ellipse at 92% 8%, rgba(124,58,237,0.11), transparent 30%), ${C.bg}`, color: C.text, fontFamily: "'Inter', 'SF Pro Display', sans-serif", display: "grid", gridTemplateColumns: "88px 1fr" }}>

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
            <Link href="/story" style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ borderColor: C.borderHover }} whileTap={{ scale: 0.97 }}
                style={{ height: "30px", padding: "0 14px", borderRadius: radius.full, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", transition: "border-color 0.15s ease" }}
              >← Story Engine</motion.div>
            </Link>

            <div style={{ height: "30px", padding: "0 12px", borderRadius: radius.full, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: "#c4b5fd", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "7px", fontWeight: 500 }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
              Project Workspace
            </div>

            <div style={{ width: "1px", height: "20px", background: C.border, margin: "0 4px" }} />

            {/* Content tabs in nav */}
            {TABS.map(({ id, icon: Icon }) => (
              <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab(id)}
                style={{ height: "30px", padding: "0 12px", borderRadius: "9px", border: `1px solid ${activeTab === id ? C.accentBorder : "transparent"}`, background: activeTab === id ? C.accentSoft : "transparent", color: activeTab === id ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", fontWeight: activeTab === id ? 600 : 400, display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s ease" }}
              >
                <Icon size={12} />{id}
              </motion.button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {editMode ? (
              <>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setEditMode(false); }}
                  style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px" }}
                ><X size={12} /> Cancel</motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveEdits} disabled={savingEdits}
                  style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px", boxShadow: `0 6px 20px ${C.accentGlow}` }}
                ><Save size={12} /> {savingEdits ? "Saving…" : "Save Changes"}</motion.button>
              </>
            ) : (
              <motion.button whileHover={{ borderColor: C.accentBorder }} whileTap={{ scale: 0.96 }} onClick={() => setEditMode(true)}
                style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px", transition: "all 0.15s ease" }}
              ><Pencil size={12} /> Edit Project</motion.button>
            )}
            {[{ icon: Grid3X3, val: "grid" }, { icon: List, val: "list" }].map(({ icon: Icon, val }) => (
              <motion.button key={val} whileTap={{ scale: 0.94 }} onClick={() => setAssetView(val)}
                style={{ width: "34px", height: "34px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: assetView === val ? "rgba(255,255,255,0.08)" : "transparent", color: assetView === val ? C.text : C.textMuted, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.15s ease" }}
              ><Icon size={15} /></motion.button>
            ))}
            <motion.button whileHover={{ borderColor: C.borderHover }} style={{ height: "34px", padding: "0 14px", borderRadius: radius.sm, border: `1px solid ${C.border}`, background: C.surface, color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
              <Folder size={13} /> Assets
            </motion.button>
          </div>
        </div>

        {/* ── Full-Height Split ── */}
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", height: "100%", overflow: "hidden" }}>

          {/* ── Left Panel — Project Info ── */}
          <div style={{ borderRight: `1px solid ${C.border}`, background: "linear-gradient(180deg, rgba(7,9,15,0.98), rgba(9,11,17,0.98))", padding: "16px", display: "grid", gridTemplateRows: "auto 1fr auto", gap: "12px", overflow: "hidden", height: "100%" }}>

            {/* Project heading */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "10px" }}>Project Workspace</div>

              <AnimatePresence mode="wait">
                {editMode ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "grid", gap: "10px" }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Project title"
                      style={{ width: "100%", border: `1px solid ${C.accentBorder}`, background: C.accentSoft, color: C.text, borderRadius: radius.md, padding: "10px 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <CustomSelect value={editGenre} onChange={setEditGenre} options={GENRES} />
                      <CustomSelect value={editTone} onChange={setEditTone} options={TONES} />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: "8px", color: C.text }}>{project.title}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[project.genre, project.tone].map((tag) => (
                        <span key={tag} style={{ padding: "3px 10px", borderRadius: "6px", border: `1px solid ${C.accentBorder}`, background: C.accentSoft, fontSize: "11.5px", color: "#c4b5fd", fontWeight: 500 }}>{tag}</span>
                      ))}
                      {project.created_at && (
                        <span style={{ padding: "3px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.surface, fontSize: "11.5px", color: C.textMuted }}>
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Idea / edit idea */}
            <div style={{ overflow: "auto", display: "grid", gap: "12px", alignContent: "start" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "8px" }}>Original Idea</div>
                {editMode ? (
                  <textarea value={editIdea} onChange={(e) => setEditIdea(e.target.value)} rows={8}
                    style={{ width: "100%", border: `1px solid ${C.border}`, background: C.surface, color: C.text, borderRadius: radius.md, padding: "12px 14px", outline: "none", resize: "vertical", fontFamily: "inherit", fontSize: "13.5px", lineHeight: 1.7, boxSizing: "border-box" }}
                  />
                ) : (
                  <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{project.idea}</div>
                )}
              </div>

              {/* Quick stats */}
              {!editMode && structured && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                  {[
                    { label: "Characters", value: structured.characters?.length || 0 },
                    { label: "Scenes", value: structured.sceneBreakdown?.length || 0 },
                    { label: "Acts", value: 3 },
                    { label: "Genre", value: project.genre },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface, padding: "10px 12px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 800, color: C.text, marginBottom: "2px" }}>{value}</div>
                      <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tab switcher at bottom of left panel */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "8px" }}>Sections</div>
              <div style={{ display: "grid", gap: "4px" }}>
                {TABS.map(({ id, icon: Icon }) => (
                  <motion.button key={id} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(id)}
                    style={{ height: "36px", padding: "0 12px", borderRadius: radius.sm, border: `1px solid ${activeTab === id ? C.accentBorder : "transparent"}`, background: activeTab === id ? C.accentSoft : "transparent", color: activeTab === id ? "#c4b5fd" : C.textMuted, cursor: "pointer", fontSize: "13px", fontFamily: "inherit", fontWeight: activeTab === id ? 600 : 400, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s ease", textAlign: "left" }}
                  >
                    <Icon size={14} />{id}
                    {activeTab === id && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Panel — Content ── */}
          <div style={{ background: "rgba(4,5,12,0.95)", display: "grid", gridTemplateRows: "48px 1fr", height: "100%", overflow: "hidden" }}>

            {/* Content toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {(() => { const tab = TABS.find((t) => t.id === activeTab); const Icon = tab?.icon; return Icon ? <Icon size={15} color={C.textMuted} /> : null; })()}
                <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{activeTab}</span>
              </div>

              {/* Tab-specific action button */}
              {activeTab === "Characters" && (
                <motion.button whileHover={{ boxShadow: `0 10px 28px ${C.accentGlow}` }} whileTap={{ scale: 0.97 }} onClick={handleGenerateCharacterBios} disabled={biosLoading}
                  style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: "none", background: biosLoading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: biosLoading ? C.textMuted : "white", cursor: biosLoading ? "default" : "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: biosLoading ? "none" : `0 6px 20px ${C.accentGlow}`, transition: "all 0.2s ease" }}
                >
                  <AnimatePresence mode="wait">
                    {biosLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={12} /></motion.div>Generating…
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Wand2 size={12} /> Generate Bios
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
              {activeTab === "Storyboard" && imagePrompt.trim() && (
                <motion.button whileHover={{ boxShadow: `0 10px 28px ${C.accentGlow}` }} whileTap={{ scale: 0.97 }} onClick={generateImage} disabled={imageLoading}
                  style={{ height: "32px", padding: "0 14px", borderRadius: radius.sm, border: "none", background: imageLoading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: imageLoading ? C.textMuted : "white", cursor: imageLoading ? "default" : "pointer", fontSize: "12.5px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s ease" }}
                >
                  {imageLoading ? "Generating…" : <><ImagePlus size={12} /> Generate Frame</>}
                </motion.button>
              )}
            </div>

            {/* Scrollable content */}
            <div style={{ overflow: "auto", padding: "20px", minHeight: 0 }}>

              {/* ── Overview ── */}
              {activeTab === "Overview" && structured && (
                <div style={{ maxWidth: "760px", display: "grid", gap: "14px" }}>
                  {/* Header card */}
                  <div style={{ borderRadius: radius.lg, border: `1px solid ${C.accentBorder}`, background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.08))", padding: "18px 20px" }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "8px" }}>{structured.title || project.title}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[structured.genre || project.genre, structured.tone || project.tone].map((tag) => (
                        <span key={tag} style={{ padding: "3px 10px", borderRadius: "6px", border: `1px solid ${C.accentBorder}`, background: C.accentSoft, fontSize: "11.5px", color: "#c4b5fd", fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <Card><Section label="Logline">{structured.logline}</Section></Card>
                    <Card><Section label="Theme">{structured.theme}</Section></Card>
                  </div>

                  <Card>
                    <Section label="Main Characters">
                      <ul style={{ margin: "6px 0 0", paddingLeft: "18px", display: "grid", gap: "4px" }}>
                        {structured.characters?.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </Section>
                  </Card>

                  {[["Act 1", structured.act1], ["Act 2", structured.act2], ["Act 3", structured.act3]].map(([label, content]) => (
                    <Card key={label}><Section label={label}>{content}</Section></Card>
                  ))}

                  <Card>
                    <Section label="Scene Breakdown">
                      <ol style={{ margin: "6px 0 0", paddingLeft: "18px", display: "grid", gap: "6px" }}>
                        {structured.sceneBreakdown?.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </Section>
                  </Card>
                </div>
              )}

              {activeTab === "Overview" && !structured && (
                <Card style={{ maxWidth: "480px" }}>
                  <Section label="Original Idea">{project.idea || "No idea recorded."}</Section>
                </Card>
              )}

              {/* ── Characters ── */}
              {activeTab === "Characters" && (
                <div style={{ maxWidth: "760px", display: "grid", gap: "12px" }}>
                  {characterBios.length > 0 ? (
                    characterBios.map((char, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <Card>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: radius.sm, background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <Users size={16} color="#a78bfa" />
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 700 }}>{char.name}</div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {[["Role", char.role], ["Goal", char.goal], ["Personality", char.personality], ["Conflict", char.conflict]].map(([label, val]) => (
                              <div key={label} style={{ borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", padding: "12px" }}>
                                <Section label={label}>{val}</Section>
                              </div>
                            ))}
                          </div>
                          {char.arc && (
                            <div style={{ marginTop: "12px", borderRadius: radius.sm, border: `1px solid ${C.accentBorder}`, background: C.accentSoft, padding: "12px" }}>
                              <Section label="Character Arc">{char.arc}</Section>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    ))
                  ) : structured?.characters?.length ? (
                    <div>
                      <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "12px", fontWeight: 500 }}>Detected characters — click "Generate Bios" for full profiles</div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {structured.characters.map((char, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: radius.md, border: `1px solid ${C.border}`, background: C.surface }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: C.accentSoft, border: `1px solid ${C.accentBorder}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <Users size={14} color="#a78bfa" />
                              </div>
                              <span style={{ fontSize: "14px", color: C.text }}>{char}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", paddingTop: "60px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <Users size={24} color={C.textDim} />
                        </div>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: "14px" }}>No characters found in this project.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Scenes ── */}
              {activeTab === "Scenes" && (
                <div style={{ maxWidth: "760px", display: "grid", gap: "12px" }}>
                  {structured?.sceneBreakdown?.length ? (
                    structured.sceneBreakdown.map((scene, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <Card>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: expandedScenes[index] ? "14px" : 0 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "6px" }}>Scene {index + 1}</div>
                              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>{scene}</div>
                            </div>
                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleGenerateScene(scene, index)} disabled={sceneLoadingIndex === index}
                              style={{ height: "32px", padding: "0 12px", borderRadius: radius.sm, border: "none", background: sceneLoadingIndex === index ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: sceneLoadingIndex === index ? C.textMuted : "white", cursor: sceneLoadingIndex === index ? "default" : "pointer", fontSize: "12px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s ease" }}
                            >
                              {sceneLoadingIndex === index ? (
                                <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={11} /></motion.div>Expanding…</>
                              ) : (expandedScenes[index] ? <><Check size={11} /> Expanded</> : <><Wand2 size={11} /> Expand Scene</>)}
                            </motion.button>
                          </div>

                          <AnimatePresence>
                            {expandedScenes[index] && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                style={{ borderTop: `1px solid ${C.border}`, paddingTop: "14px", display: "grid", gap: "10px" }}
                              >
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                  {[["Location", expandedScenes[index].location], ["Time of Day", expandedScenes[index].timeOfDay], ["Dialogue Tone", expandedScenes[index].dialogueTone], ["Cinematic Notes", expandedScenes[index].cinematicNotes]].map(([label, val]) => (
                                    <div key={label} style={{ borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", padding: "10px 12px" }}>
                                      <Section label={label}>{val}</Section>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", padding: "10px 12px" }}>
                                  <Section label="Visual Description">{expandedScenes[index].visualDescription}</Section>
                                </div>
                                {expandedScenes[index].actionBeats?.length > 0 && (
                                  <div style={{ borderRadius: radius.sm, border: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", padding: "10px 12px" }}>
                                    <Section label="Action Beats">
                                      <ul style={{ margin: "6px 0 0", paddingLeft: "16px", display: "grid", gap: "4px" }}>
                                        {expandedScenes[index].actionBeats.map((beat, bi) => <li key={bi}>{beat}</li>)}
                                      </ul>
                                    </Section>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", paddingTop: "60px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <Film size={24} color={C.textDim} />
                        </div>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: "14px" }}>No scene breakdown in this project.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Storyboard ── */}
              {activeTab === "Storyboard" && (
                <div style={{ maxWidth: "760px", display: "grid", gap: "14px" }}>
                  <Card>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.textMuted, marginBottom: "10px" }}>Scene Description</div>
                    <textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={4} placeholder="Describe the cinematic scene you want to generate as a frame…"
                      style={{ width: "100%", border: "none", background: "transparent", color: C.text, resize: "none", fontFamily: "inherit", fontSize: "14px", lineHeight: 1.7, outline: "none", boxSizing: "border-box" }}
                    />
                    <div style={{ paddingTop: "10px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
                      <motion.button whileHover={{ boxShadow: `0 10px 28px ${C.accentGlow}` }} whileTap={{ scale: 0.97 }} onClick={generateImage} disabled={imageLoading || !imagePrompt.trim()}
                        style={{ height: "36px", padding: "0 16px", borderRadius: radius.md, border: "none", background: imagePrompt.trim() && !imageLoading ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(255,255,255,0.06)", color: imagePrompt.trim() && !imageLoading ? "white" : C.textMuted, cursor: imagePrompt.trim() && !imageLoading ? "pointer" : "default", fontSize: "13px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: imagePrompt.trim() && !imageLoading ? `0 6px 20px ${C.accentGlow}` : "none", transition: "all 0.2s ease" }}
                      >
                        {imageLoading ? (
                          <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Zap size={14} /></motion.div>Generating…</>
                        ) : (<><ImagePlus size={14} /> Generate Frame</>)}
                      </motion.button>
                    </div>
                  </Card>

                  <AnimatePresence>
                    {generatedImage && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Card style={{ padding: "12px" }}>
                          <img src={generatedImage} alt="Generated storyboard frame" style={{ width: "100%", display: "block", borderRadius: radius.md, border: `1px solid ${C.border}` }} />
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!generatedImage && (
                    <div style={{ display: "grid", placeItems: "center", paddingTop: "40px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "999px", margin: "0 auto 14px", display: "grid", placeItems: "center", border: `1px solid ${C.border}`, background: C.surface }}>
                          <ImagePlus size={24} color={C.textDim} />
                        </div>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: "14px" }}>Describe a scene above to generate a storyboard frame.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Notes ── */}
              {activeTab === "Notes" && (
                <div style={{ maxWidth: "760px" }}>
                  <Card>
                    <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}>Production Notes</div>
                    <div style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.7 }}>This section is reserved for production notes, script revisions, and team comments.</div>
                    <div style={{ marginTop: "16px", height: "2px", borderRadius: radius.full, background: `linear-gradient(90deg, ${C.indigo}, ${C.accent})`, width: "60px" }} />
                  </Card>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
