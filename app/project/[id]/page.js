"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

function CustomSelect({ value, onChange, options, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
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
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          height: "56px",
          padding: "10px 14px",
          fontSize: "15px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "white",
          outline: "none",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "border-color 0.2s ease, background 0.2s ease",
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          size={16}
          style={{
            color: "rgba(255,255,255,0.72)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "100%",
            background: "rgba(14,18,28,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            overflow: "hidden",
            zIndex: 1000,
            backdropFilter: "blur(14px)",
          }}
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                background:
                  value === option
                    ? "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.18))"
                    : "transparent",
                color: "white",
                border: "none",
                borderBottom:
                  index !== options.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "15px",
              }}
              onMouseEnter={(e) => {
                if (value !== option) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage({ params }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [characterBios, setCharacterBios] = useState([]);
  const [biosLoading, setBiosLoading] = useState(false);
  const [expandedScenes, setExpandedScenes] = useState({});
  const [sceneLoadingIndex, setSceneLoadingIndex] = useState(null);
  const [assetView, setAssetView] = useState("grid");

  const [editMode, setEditMode] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("Sci-Fi");
  const [editTone, setEditTone] = useState("Cinematic");
  const [editIdea, setEditIdea] = useState("");

  const [imagePrompt, setImagePrompt] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Fetch project error:", error);
        setProject(null);
        setLoading(false);
        return;
      }

      setProject(data);
      setEditTitle(data.title || "");
      setEditGenre(data.genre || "Sci-Fi");
      setEditTone(data.tone || "Cinematic");
      setEditIdea(data.idea || "");
      setLoading(false);
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  async function generateImage() {
    if (!imagePrompt.trim()) {
      alert("Please enter an image prompt first.");
      return;
    }

    setImageLoading(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Generate image error:", data.error);
        alert(data.error || "Failed to generate image.");
        setImageLoading(false);
        return;
      }

      setGeneratedImage(data.image);
    } catch (error) {
      console.error("Generate image failed:", error);
      alert("Something went wrong while generating the image.");
    }

    setImageLoading(false);
  }

  async function handleGenerateCharacterBios() {
    const characters = project?.structured_result?.characters || [];

    if (!characters.length) {
      alert("No characters found in this project.");
      return;
    }

    setBiosLoading(true);

    try {
      const res = await fetch("/api/character-bios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          genre: project.genre,
          tone: project.tone,
          idea: project.idea,
          characters,
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Character bio error:", data.error);
        alert(data.error);
        setBiosLoading(false);
        return;
      }

      setCharacterBios(data.characters || []);
    } catch (error) {
      console.error("Generate bios failed:", error);
      alert("Something went wrong while generating character bios.");
    }

    setBiosLoading(false);
  }

  async function handleGenerateScene(scene, index) {
    setSceneLoadingIndex(index);

    try {
      const res = await fetch("/api/expand-scene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title,
          genre: project.genre,
          tone: project.tone,
          idea: project.idea,
          scene,
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Scene expansion error:", data.error);
        alert(data.error);
        setSceneLoadingIndex(null);
        return;
      }

      setExpandedScenes((prev) => ({
        ...prev,
        [index]: data,
      }));
    } catch (error) {
      console.error("Generate scene failed:", error);
      alert("Something went wrong while generating the scene.");
    }

    setSceneLoadingIndex(null);
  }

  function handleStartEdit() {
    if (!project) return;
    setEditTitle(project.title || "");
    setEditGenre(project.genre || "Sci-Fi");
    setEditTone(project.tone || "Cinematic");
    setEditIdea(project.idea || "");
    setEditMode(true);
  }

  function handleCancelEdit() {
    if (!project) return;
    setEditTitle(project.title || "");
    setEditGenre(project.genre || "Sci-Fi");
    setEditTone(project.tone || "Cinematic");
    setEditIdea(project.idea || "");
    setEditMode(false);
  }

  async function handleSaveEdits() {
    if (!user || !project) return;

    setSavingEdits(true);

    const updatedStructuredResult = project.structured_result
      ? {
          ...project.structured_result,
          title: editTitle || project.structured_result.title,
          genre: editGenre,
          tone: editTone,
        }
      : project.structured_result;

    const { error } = await supabase
      .from("projects")
      .update({
        title: editTitle || "Untitled Project",
        genre: editGenre,
        tone: editTone,
        idea: editIdea,
        structured_result: updatedStructuredResult,
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    setSavingEdits(false);

    if (error) {
      console.error("Update project error:", error);
      alert("Failed to update project.");
      return;
    }

    const updatedProject = {
      ...project,
      title: editTitle || "Untitled Project",
      genre: editGenre,
      tone: editTone,
      idea: editIdea,
      structured_result: updatedStructuredResult,
    };

    setProject(updatedProject);
    setEditMode(false);
    alert("Project updated successfully!");
  }

  const sidebarItems = [
    { label: "Home", icon: Compass, href: "/" },
    { label: "Explore", icon: Compass, href: "/explore" },
    { label: "Story", icon: Clapperboard, href: "/story", active: true },
    { label: "Image", icon: ImageIcon, href: "#" },
    { label: "Video", icon: Video, href: "#" },
    { label: "Consistency", icon: UserCircle2, href: "#" },
    { label: "Motion", icon: Orbit, href: "#" },
    { label: "Projects", icon: FolderKanban, href: "/story" },
    { label: "Settings", icon: Settings, href: "#" },
  ];

  const tabs = ["Overview", "Characters", "Scenes", "Storyboard", "Notes"];

  const panelStyle = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
    padding: "18px",
  };

  const chipStyle = (active) => ({
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    color: active ? "white" : "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: "14px",
  });

  const actionButton = {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    fontSize: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(79,70,229,0.14), transparent 22%), radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%), #05070c",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "92px 1fr",
            minHeight: "100vh",
          }}
        >
          <aside
            style={{
              borderRight: "1px solid rgba(255,255,255,0.08)",
              background: "#0a0d14",
              padding: "20px 14px",
              position: "sticky",
              top: 0,
              height: "100vh",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "18px",
                margin: "0 auto 24px",
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Sparkles size={22} />
            </div>
          </aside>

          <section
            style={{
              display: "grid",
              placeItems: "center",
              padding: "24px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "760px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                padding: "40px 32px",
                textAlign: "center",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  margin: "0 auto 18px",
                  borderRadius: "18px",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 14px 28px rgba(124,58,237,0.22)",
                }}
              >
                <Sparkles size={24} />
              </div>

              <h2
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "28px",
                  lineHeight: 1.1,
                }}
              >
                Opening Project Workspace
              </h2>

              <p
                style={{
                  margin: "0 0 18px 0",
                  color: "rgba(255,255,255,0.64)",
                  fontSize: "15px",
                }}
              >
                Loading your saved story and workspace modules...
              </p>

              <div
                style={{
                  width: "100%",
                  height: "10px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ x: "-35%" }}
                  animate={{ x: "115%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.3,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: "35%",
                    height: "100%",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    boxShadow: "0 0 18px rgba(124,58,237,0.38)",
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#05070c",
          color: "white",
          fontFamily: "Inter, sans-serif",
          padding: "40px",
        }}
      >
        <Link
          href="/story"
          style={{
            textDecoration: "none",
            color: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "999px",
            padding: "8px 14px",
            fontSize: "14px",
            background: "rgba(255,255,255,0.03)",
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          ← Back to Story Engine
        </Link>
        <h1>Project not found or access denied</h1>
      </main>
    );
  }

  const structured = project.structured_result;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070c",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "92px 1fr",
          minHeight: "100vh",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "#0a0d14",
            padding: "20px 14px",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "18px",
              margin: "0 auto 24px",
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.18))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Sparkles size={22} />
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              const content = (
                <motion.div
                  whileHover={{ y: -1 }}
                  style={{
                    display: "grid",
                    justifyItems: "center",
                    gap: "8px",
                    padding: "10px 8px",
                    borderRadius: "18px",
                    background: item.active
                      ? "linear-gradient(180deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))"
                      : "transparent",
                    border: item.active
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid transparent",
                    color: item.active ? "white" : "rgba(255,255,255,0.66)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "14px",
                      display: "grid",
                      placeItems: "center",
                      background: item.active
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.025)",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              );

              return item.href === "#" ? (
                <div key={item.label}>{content}</div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </aside>

        <section
          style={{
            display: "grid",
            gridTemplateRows: "46px 1fr 56px",
            minHeight: "100vh",
            background:
              "radial-gradient(circle at top left, rgba(79,70,229,0.14), transparent 22%), radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%), #05070c",
          }}
        >
          <div
            style={{
              height: "46px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button style={chipStyle(true)}>Workspace</button>
              <button style={chipStyle(false)}>Project</button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setAssetView("grid")}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    assetView === "grid" ? "rgba(255,255,255,0.08)" : "transparent",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setAssetView("list")}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    assetView === "list" ? "rgba(255,255,255,0.08)" : "transparent",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <List size={16} />
              </button>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "14px",
                }}
              >
                <Folder size={15} />
                Assets
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "24px",
              overflow: "auto",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "14px",
              }}
            >
              <Link
                href="/story"
                style={{
                  textDecoration: "none",
                  color: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  fontSize: "14px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                ← Back to Story Engine
              </Link>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "999px",
                  fontSize: "14px",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.88)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: "#7c3aed",
                    boxShadow: "0 0 10px #7c3aed",
                  }}
                />
                Project Workspace
              </div>
            </div>

            <div style={{ ...panelStyle, marginBottom: "20px" }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.56)",
                  margin: "0 0 10px 0",
                  fontSize: "14px",
                }}
              >
                Kylor Project Workspace
              </p>

              {editMode ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Project title"
                    style={{
                      width: "100%",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      color: "white",
                      borderRadius: "18px",
                      padding: "12px 16px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "56px",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-1.4px",
                    }}
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      maxWidth: "540px",
                    }}
                  >
                    <CustomSelect
                      value={editGenre}
                      onChange={setEditGenre}
                      options={[
                        "Sci-Fi",
                        "Thriller",
                        "Drama",
                        "Horror",
                        "Action",
                        "Mystery",
                        "Romance",
                      ]}
                    />

                    <CustomSelect
                      value={editTone}
                      onChange={setEditTone}
                      options={[
                        "Cinematic",
                        "Dark",
                        "Emotional",
                        "Gritty",
                        "Epic",
                        "Suspenseful",
                      ]}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={handleSaveEdits}
                      disabled={savingEdits}
                      style={{
                        ...actionButton,
                        background: savingEdits
                          ? "rgba(255,255,255,0.10)"
                          : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        border: "none",
                      }}
                    >
                      {savingEdits ? "Saving..." : "Save Changes"}
                    </button>

                    <button onClick={handleCancelEdit} style={actionButton}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1
                    style={{
                      fontSize: "56px",
                      lineHeight: 1,
                      margin: "0 0 12px 0",
                      letterSpacing: "-1.4px",
                    }}
                  >
                    {project.title}
                  </h1>

                  <p style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>
                    {project.genre} • {project.tone}
                  </p>

                  <div style={{ marginTop: "16px" }}>
                    <button onClick={handleStartEdit} style={actionButton}>
                      Edit Project
                    </button>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={chipStyle(activeTab === tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" && (
              <div style={{ display: "grid", gap: "20px" }}>
                <section style={panelStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "14px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Original Idea</h3>

                    {!editMode && (
                      <button onClick={handleStartEdit} style={actionButton}>
                        Edit
                      </button>
                    )}
                  </div>

                  {editMode ? (
                    <textarea
                      value={editIdea}
                      onChange={(e) => setEditIdea(e.target.value)}
                      rows={8}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                        lineHeight: "1.8",
                      }}
                    />
                  ) : (
                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.8",
                        margin: 0,
                        color: "rgba(255,255,255,0.80)",
                      }}
                    >
                      {project.idea}
                    </p>
                  )}
                </section>

                {structured && (
                  <section style={panelStyle}>
                    <div style={{ display: "grid", gap: "18px" }}>
                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Title</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {project.structured_result?.title || project.title}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Genre</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                            {project.structured_result?.genre || project.genre}
                          </p>
                        </div>
                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Tone</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                            {project.structured_result?.tone || project.tone}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Logline</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {structured.logline}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Theme</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {structured.theme}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Main Characters</h4>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            color: "rgba(255,255,255,0.78)",
                          }}
                        >
                          {structured.characters?.map((character, index) => (
                            <li key={index}>{character}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Act 1</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {structured.act1}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Act 2</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {structured.act2}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Act 3</h4>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>
                          {structured.act3}
                        </p>
                      </div>

                      <div>
                        <h4 style={{ marginBottom: "6px" }}>Scene Breakdown</h4>
                        <ol
                          style={{
                            margin: 0,
                            paddingLeft: "20px",
                            color: "rgba(255,255,255,0.78)",
                          }}
                        >
                          {structured.sceneBreakdown?.map((scene, index) => (
                            <li key={index}>{scene}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "Characters" && (
              <section style={panelStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 6px 0" }}>Characters</h3>
                    <p style={{ color: "rgba(255,255,255,0.60)", margin: 0 }}>
                      Build deeper character profiles for your film.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateCharacterBios}
                    disabled={biosLoading}
                    style={{
                      ...actionButton,
                      background: biosLoading
                        ? "rgba(255,255,255,0.10)"
                        : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      border: "none",
                    }}
                  >
                    {biosLoading ? "Generating..." : "Generate Character Bios"}
                  </button>
                </div>

                {characterBios.length > 0 ? (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {characterBios.map((character, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "14px",
                          padding: "18px",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <h4 style={{ margin: "0 0 12px 0" }}>{character.name}</h4>

                        <div style={{ display: "grid", gap: "10px" }}>
                          <div>
                            <strong>Role:</strong>
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                              {character.role}
                            </p>
                          </div>

                          <div>
                            <strong>Personality:</strong>
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                              {character.personality}
                            </p>
                          </div>

                          <div>
                            <strong>Goal:</strong>
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                              {character.goal}
                            </p>
                          </div>

                          <div>
                            <strong>Conflict:</strong>
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                              {character.conflict}
                            </p>
                          </div>

                          <div>
                            <strong>Arc:</strong>
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                              {character.arc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : structured?.characters?.length ? (
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.60)", marginBottom: "14px" }}>
                      Current detected characters:
                    </p>
                    <ul style={{ paddingLeft: "20px", margin: 0, color: "rgba(255,255,255,0.78)" }}>
                      {structured.characters.map((character, index) => (
                        <li key={index} style={{ marginBottom: "8px" }}>
                          {character}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>No characters yet.</p>
                )}
              </section>
            )}

            {activeTab === "Scenes" && (
              <section style={panelStyle}>
                <div style={{ marginBottom: "18px" }}>
                  <h3 style={{ margin: "0 0 6px 0" }}>Scenes</h3>
                  <p style={{ color: "rgba(255,255,255,0.60)", margin: 0 }}>
                    Expand your scene breakdown into fuller cinematic scene plans.
                  </p>
                </div>

                {structured?.sceneBreakdown?.length ? (
                  <div style={{ display: "grid", gap: "18px" }}>
                    {structured.sceneBreakdown.map((scene, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "14px",
                          padding: "18px",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "14px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: "0 0 8px 0" }}>Scene {index + 1}</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.78)" }}>{scene}</p>
                          </div>

                          <button
                            onClick={() => handleGenerateScene(scene, index)}
                            disabled={sceneLoadingIndex === index}
                            style={{
                              ...actionButton,
                              background:
                                sceneLoadingIndex === index
                                  ? "rgba(255,255,255,0.10)"
                                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                              border: "none",
                            }}
                          >
                            {sceneLoadingIndex === index
                              ? "Generating..."
                              : "Generate Full Scene"}
                          </button>
                        </div>

                        {expandedScenes[index] && (
                          <div
                            style={{
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              paddingTop: "16px",
                              display: "grid",
                              gap: "12px",
                            }}
                          >
                            <div>
                              <strong>Location:</strong>
                              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                                {expandedScenes[index].location}
                              </p>
                            </div>

                            <div>
                              <strong>Time of Day:</strong>
                              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                                {expandedScenes[index].timeOfDay}
                              </p>
                            </div>

                            <div>
                              <strong>Visual Description:</strong>
                              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                                {expandedScenes[index].visualDescription}
                              </p>
                            </div>

                            <div>
                              <strong>Action Beats:</strong>
                              <ul
                                style={{
                                  margin: "6px 0 0 0",
                                  paddingLeft: "20px",
                                  color: "rgba(255,255,255,0.78)",
                                }}
                              >
                                {expandedScenes[index].actionBeats?.map((beat, beatIndex) => (
                                  <li key={beatIndex}>{beat}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <strong>Dialogue Tone:</strong>
                              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                                {expandedScenes[index].dialogueTone}
                              </p>
                            </div>

                            <div>
                              <strong>Cinematic Notes:</strong>
                              <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.78)" }}>
                                {expandedScenes[index].cinematicNotes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0 }}>No scene breakdown yet.</p>
                )}
              </section>
            )}

            {activeTab === "Storyboard" && (
              <section style={panelStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 6px 0" }}>Storyboard</h3>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.60)" }}>
                      Generate visual frames for your project.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "16px" }}>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={5}
                    placeholder="Describe the cinematic scene you want to generate..."
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      lineHeight: "1.7",
                    }}
                  />

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      onClick={generateImage}
                      disabled={imageLoading}
                      style={{
                        ...actionButton,
                        background: imageLoading
                          ? "rgba(255,255,255,0.10)"
                          : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        border: "none",
                      }}
                    >
                      {imageLoading ? "Generating..." : "Generate Image"}
                    </button>
                  </div>

                  {generatedImage && (
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <img
                        src={generatedImage}
                        alt="Generated storyboard frame"
                        style={{
                          width: "100%",
                          maxWidth: "720px",
                          display: "block",
                          borderRadius: "14px",
                        }}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "Notes" && (
              <section style={panelStyle}>
                <h3 style={{ marginTop: 0 }}>Notes</h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.60)" }}>
                  This section is reserved for production notes, revisions, and team comments.
                </p>
              </section>
            )}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Project Workspace
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Genre: {project.genre}
              </div>

              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Tone: {project.tone}
              </div>
            </div>

            <button
              onClick={() => router.push("/story")}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Back to Story Engine
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}