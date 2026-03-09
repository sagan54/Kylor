"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

export default function StoryPage() {
  const router = useRouter();

  function autoResize(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

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
  const [activeView, setActiveView] = useState("output");
  const [assetView, setAssetView] = useState("grid");

  useEffect(() => {
    async function initializePage() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await fetchProjects(user);
    }

    initializePage();
  }, [router]);

  async function fetchProjects(currentUser = user) {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setProjects(data || []);
  }

  async function handleGenerate() {
    if (!idea.trim()) {
      setResult("Please enter a story idea first.");
      setStructuredResult(null);
      return;
    }

    setLoading(true);
    setResult("Generating script...");
    setStructuredResult(null);

    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          genre,
          tone,
          idea,
        }),
      });

      const data = await res.json();

      if (data.structuredResult) {
        setStructuredResult(data.structuredResult);
        setResult(data.result || "");
        setActiveView("output");
      } else {
        setStructuredResult(null);
        setResult(data.result || "Something went wrong.");
        setActiveView("output");
      }
    } catch (error) {
      console.error("Generate error:", error);
      setStructuredResult(null);
      setResult("Something went wrong while generating the script.");
      setActiveView("output");
    } finally {
      setLoading(false);
      setCopied(false);
    }
  }

  function handleNewProject() {
    setTitle("");
    setGenre("Sci-Fi");
    setTone("Cinematic");
    setIdea("");
    setResult("");
    setStructuredResult(null);
    setCopied(false);
    setActiveView("output");
  }

  async function handleCopy() {
    if (!structuredResult) return;

    const text = `Title: ${structuredResult.title}

Genre: ${structuredResult.genre}
Tone: ${structuredResult.tone}

Logline:
${structuredResult.logline}

Theme:
${structuredResult.theme}

Main Characters:
${structuredResult.characters?.join("\n") || ""}

Act 1:
${structuredResult.act1}

Act 2:
${structuredResult.act2}

Act 3:
${structuredResult.act3}

Scene Breakdown:
${structuredResult.sceneBreakdown?.join("\n") || ""}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  async function handleSaveProject() {
    if (!structuredResult) {
      alert("Generate a script first.");
      return;
    }

    setSaving(true);

    const projectTitle = title || structuredResult.title || "Untitled Project";

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      setSaving(false);
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("projects").insert([
      {
        user_id: currentUser.id,
        title: projectTitle,
        genre,
        tone,
        idea,
        structured_result: structuredResult,
        result,
      },
    ]);

    setSaving(false);

    if (error) {
      console.error("Save error:", error);
      alert("Failed to save project.");
      return;
    }

    alert("Project saved successfully!");
    await fetchProjects(currentUser);
    setActiveView("projects");
  }

  function handleLoadProject(project) {
    setTitle(project.title || "");
    setGenre(project.genre || "Sci-Fi");
    setTone(project.tone || "Cinematic");
    setIdea(project.idea || "");
    setStructuredResult(project.structured_result || null);
    setResult(project.result || "");
    setCopied(false);
    setActiveView("output");
  }

  async function handleDeleteProject(id) {
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete project.");
      return;
    }

    await fetchProjects(currentUser);
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

  const inputStyle = {
    width: "100%",
    padding: "14px 14px",
    fontSize: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  const topTabStyle = (active) => ({
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    color: active ? "white" : "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: "14px",
  });

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
          height: "100vh",
          overflow: "hidden",
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
            gridTemplateColumns: "460px 1fr",
            height: "100vh",
            background:
              "radial-gradient(circle at top left, rgba(79,70,229,0.14), transparent 22%), radial-gradient(circle at top right, rgba(124,58,237,0.14), transparent 24%), #05070c",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderRight: "1px solid rgba(255,255,255,0.08)",
              padding: "14px 14px 14px",
              background: "rgba(10,13,20,0.78)",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "12px",
                flexShrink: 0,
              }}
            >
              <Link
                href="/"
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
                ← Back to Kylor AI
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
                Story Engine
              </div>
            </div>

            <h1
              style={{
                fontSize: "48px",
                lineHeight: 1,
                margin: "0 0 10px 0",
                letterSpacing: "-1.5px",
                flexShrink: 0,
              }}
            >
              Story Engine
            </h1>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "10px",
                flexWrap: "wrap",
                flexShrink: 0,
              }}
            >
              <button
                style={topTabStyle(activeView === "editor")}
                onClick={() => setActiveView("editor")}
              >
                Editor
              </button>
              <button
                style={topTabStyle(activeView === "output")}
                onClick={() => setActiveView("output")}
              >
                Output
              </button>
              <button
                style={topTabStyle(activeView === "projects")}
                onClick={() => setActiveView("projects")}
              >
                Projects
              </button>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "18px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
                padding: "16px",
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <h3
                style={{
                  margin: "0 0 14px 0",
                  fontSize: "22px",
                  flexShrink: 0,
                }}
              >
                Create Story Project
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  paddingRight: "4px",
                }}
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title (optional)"
                  style={{
                    ...inputStyle,
                    padding: "1px 8px",
                    height: "56px",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <CustomSelect
                    value={genre}
                    onChange={setGenre}
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
                    value={tone}
                    onChange={setTone}
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

                <textarea
                  value={idea}
                  onChange={(e) => {
                    setIdea(e.target.value);
                    autoResize(e);
                  }}
                  placeholder="Enter your film idea..."
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "none",
                    overflow: "hidden",
                    minHeight: "140px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                      flex: 1,
                      minWidth: "170px",
                      padding: "14px 20px",
                      borderRadius: "12px",
                      border: "none",
                      background: loading
                        ? "rgba(255,255,255,0.12)"
                        : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      boxShadow: loading
                        ? "none"
                        : "0 14px 28px rgba(124,58,237,0.24)",
                    }}
                  >
                    {loading ? "Generating..." : "Generate Script"}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateRows: "46px 1fr 56px",
              minHeight: "100vh",
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
                {["All", "Output", "Projects"].map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setActiveView(
                        item === "All"
                          ? "output"
                          : item === "Projects"
                          ? "projects"
                          : "output"
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        (item === "Output" && activeView === "output") ||
                        (item === "Projects" && activeView === "projects") ||
                        (item === "All" && activeView === "output")
                          ? "rgba(255,255,255,0.08)"
                          : "transparent",
                      color: "rgba(255,255,255,0.86)",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {item}
                  </button>
                ))}
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
                padding: "14px",
                overflow: "auto",
                minHeight: 0,
              }}
            >
              {activeView === "projects" ? (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
                    padding: "18px",
                    minHeight: "100%",
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "22px" }}>
                    Saved Projects
                  </h3>

                  {projects.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.60)" }}>
                      No saved projects yet.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: "0px" }}>
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          style={{
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            padding: "16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            background: "rgba(255,255,255,0.03)",
                          }}
                        >
                          <div>
                            <h4 style={{ margin: "0 0 6px 0" }}>{project.title}</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.65)" }}>
                              {project.genre} • {project.tone}
                            </p>
                            <p
                              style={{
                                margin: "6px 0 0 0",
                                fontSize: "14px",
                                color: "rgba(255,255,255,0.45)",
                              }}
                            >
                              {project.created_at
                                ? new Date(project.created_at).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleLoadProject(project)}
                              style={{
                                padding: "10px 14px",
                                background:
                                  "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                color: "white",
                                border: "none",
                                borderRadius: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Open
                            </button>

                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              style={{
                                padding: "10px 14px",
                                background: "rgba(255,255,255,0.05)",
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.10)",
                                borderRadius: "10px",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "18px",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))",
                    padding: "18px",
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "10px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "22px" }}>
                      {structuredResult ? "Generated Output" : "Story Workspace"}
                    </h3>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={handleCopy}
                        disabled={!structuredResult}
                        style={{
                          padding: "9px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: copied
                            ? "linear-gradient(135deg, #14532d, #166534)"
                            : "rgba(255,255,255,0.05)",
                          color: "white",
                          cursor: structuredResult ? "pointer" : "not-allowed",
                        }}
                      >
                        {copied ? "Copied!" : "Copy Output"}
                      </button>

                      <button
                        onClick={handleSaveProject}
                        disabled={!structuredResult || saving}
                        style={{
                          padding: "9px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.05)",
                          color: "white",
                          cursor: structuredResult && !saving ? "pointer" : "not-allowed",
                        }}
                      >
                        {saving ? "Saving..." : "Save Project"}
                      </button>

                      <button
                        onClick={handleNewProject}
                        style={{
                          padding: "9px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.05)",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        New Project
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      padding: "18px",
                      background: "rgba(255,255,255,0.03)",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.8",
                      fontSize: "16px",
                      color: "rgba(255,255,255,0.88)",
                    }}
                  >
                    {structuredResult ? (
                      <div style={{ display: "grid", gap: "18px" }}>
                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Title</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.title}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            marginTop: "0px",
                          }}
                        >
                          <div>
                            <h4 style={{ marginBottom: "6px" }}>Genre</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                              {structuredResult.genre}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ marginBottom: "6px" }}>Tone</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                              {structuredResult.tone}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Logline</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.logline}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Theme</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.theme}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Main Characters</h4>
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: "20px",
                              color: "rgba(255,255,255,0.75)",
                            }}
                          >
                            {structuredResult.characters?.map((character, index) => (
                              <li key={index}>{character}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Act 1</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.act1}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Act 2</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.act2}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Act 3</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {structuredResult.act3}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Scene Breakdown</h4>
                          <ol
                            style={{
                              margin: 0,
                              paddingLeft: "20px",
                              color: "rgba(255,255,255,0.75)",
                            }}
                          >
                            {structuredResult.sceneBreakdown?.map((scene, index) => (
                              <li key={index}>{scene}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "18px" }}>
                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Title</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {title || "Untitled Project"}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            marginTop: "0px",
                          }}
                        >
                          <div>
                            <h4 style={{ marginBottom: "6px" }}>Genre</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                              {genre}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ marginBottom: "6px" }}>Tone</h4>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                              {tone}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Idea</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            {idea || "Your idea will appear here."}
                          </p>
                        </div>

                        <div>
                          <h4 style={{ marginBottom: "6px" }}>Preview</h4>
                          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
                            Generate a script to preview your story here.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  Story Workspace
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
                  Genre: {genre}
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
                  Tone: {tone}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}