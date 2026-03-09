"use client";

import { useEffect, useState } from "react";
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
  Trash2,
  FolderOpen,
  Save,
  Copy,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function StoryPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Sci-Fi");
  const [tone, setTone] = useState("Cinematic");
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [structuredResult, setStructuredResult] = useState(null);

  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("editor");
  const [viewMode, setViewMode] = useState("grid");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  function autoResize(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function loadProjects(currentUser) {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading projects:", error);
      return;
    }

    setProjects(data || []);
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await loadProjects(user);
      setCheckingAuth(false);
    }

    init();
  }, [router]);

  async function handleGenerate() {
    if (!idea.trim()) {
      alert("Please enter your film idea first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/story", {
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

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate script.");
      }

      const generatedStructured = data.structured_result || data.structuredResult || null;
      const generatedText =
        data.result ||
        data.output ||
        data.script ||
        (generatedStructured ? JSON.stringify(generatedStructured, null, 2) : "");

      setStructuredResult(generatedStructured);
      setResult(generatedText);
      setActiveTab("output");
    } catch (err) {
      console.error("Generation error:", err);
      alert(err.message || "Something went wrong while generating.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProject() {
    if (!structuredResult && !result) {
      alert("Generate a script first.");
      return;
    }

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    setSaving(true);

    const projectTitle =
      title?.trim() || structuredResult?.title || "Untitled Project";

    const payload = {
      user_id: user.id,
      title: projectTitle,
      genre,
      tone,
      idea,
      structured_result: structuredResult,
    };

    if (result) {
      payload.result = result;
    }

    const { error } = await supabase.from("projects").insert([payload]);

    setSaving(false);

    if (error) {
      console.error("Save error:", error);
      alert("Failed to save project.");
      return;
    }

    alert("Project saved successfully!");
    await loadProjects(user);
    setActiveTab("projects");
  }

  async function handleDeleteProject(id) {
    if (!user) return;

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete project.");
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== id));
  }

  function handleOpenProject(project) {
    setTitle(project.title || "");
    setGenre(project.genre || "Sci-Fi");
    setTone(project.tone || "Cinematic");
    setIdea(project.idea || "");
    setStructuredResult(project.structured_result || null);
    setResult(project.result || "");
    setActiveTab("editor");
  }

  async function handleCopy() {
    try {
      const copyText =
        result ||
        (structuredResult ? JSON.stringify(structuredResult, null, 2) : "");

      if (!copyText) {
        alert("Nothing to copy.");
        return;
      }

      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const tools = [
    { title: "Home", icon: Sparkles, href: "/" },
    { title: "Explore", icon: Compass, href: "/explore" },
    { title: "Story", icon: Clapperboard, href: "/story", active: true },
    { title: "Image", icon: ImageIcon, href: "/project" },
    { title: "Video", icon: Video, href: "/project" },
    { title: "Consistency", icon: UserCircle2, href: "/project" },
    { title: "Motion", icon: Orbit, href: "/project" },
    { title: "Projects", icon: FolderKanban, href: "/project" },
    { title: "Settings", icon: Settings, href: "/project" },
  ];

  if (checkingAuth) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, rgba(115,70,255,0.18), #050816 40%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)" }}>Loading Story Engine...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(115,70,255,0.16), #050816 38%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside
          style={{
            width: "88px",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(6,8,20,0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                width: "52px",
                height: "52px",
                margin: "0 auto 22px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #5b4dff, #8b5cf6)",
                boxShadow: "0 10px 30px rgba(107,76,255,0.32)",
              }}
            >
              <Sparkles size={20} />
            </div>

            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                    color: tool.active ? "white" : "rgba(255,255,255,0.72)",
                    background: tool.active
                      ? "linear-gradient(135deg, rgba(91,77,255,0.18), rgba(139,92,246,0.16))"
                      : "transparent",
                    border: tool.active
                      ? "1px solid rgba(140,110,255,0.32)"
                      : "1px solid transparent",
                    borderRadius: "18px",
                    padding: "14px 8px",
                    marginBottom: "10px",
                  }}
                >
                  <Icon size={18} />
                  <span style={{ fontSize: "12px" }}>{tool.title}</span>
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              borderRadius: "16px",
              padding: "12px 8px",
              cursor: "pointer",
            }}
          >
            <LogOut size={18} style={{ marginBottom: "6px" }} />
            <div style={{ fontSize: "11px" }}>Logout</div>
          </button>
        </aside>

        <section style={{ flex: 1, padding: "22px 14px 14px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "390px 1fr",
              gap: "14px",
              minHeight: "calc(100vh - 36px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                padding: "18px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/"
                  style={{
                    textDecoration: "none",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: "999px",
                    padding: "10px 14px",
                    fontSize: "14px",
                  }}
                >
                  ← Back to Kylor AI
                </Link>

                <div
                  style={{
                    border: "1px solid rgba(137,92,246,0.25)",
                    background: "rgba(124,58,237,0.1)",
                    color: "#d8c9ff",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "13px",
                  }}
                >
                  Story Engine
                </div>
              </div>

              <h1
                style={{
                  fontSize: "56px",
                  lineHeight: "0.95",
                  margin: "8px 0 16px",
                  fontWeight: 700,
                }}
              >
                Story Engine
              </h1>

              <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                {["editor", "output", "projects"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      background:
                        activeTab === tab
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.04)",
                      color: "white",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "24px",
                  padding: "16px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                }}
              >
                <h2 style={{ margin: "0 0 14px", fontSize: "18px" }}>
                  Create Story Project
                </h2>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title (optional)"
                  style={inputStyle}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    style={inputStyle}
                  >
                    <option>Sci-Fi</option>
                    <option>Thriller</option>
                    <option>Fantasy</option>
                    <option>Drama</option>
                    <option>Action</option>
                    <option>Horror</option>
                    <option>Romance</option>
                  </select>

                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={inputStyle}
                  >
                    <option>Cinematic</option>
                    <option>Dark</option>
                    <option>Epic</option>
                    <option>Minimal</option>
                    <option>Emotional</option>
                    <option>Mysterious</option>
                  </select>
                </div>

                <textarea
                  value={idea}
                  onChange={(e) => {
                    setIdea(e.target.value);
                    autoResize(e);
                  }}
                  onInput={autoResize}
                  placeholder="Enter your film idea..."
                  rows={8}
                  style={{
                    ...inputStyle,
                    minHeight: "180px",
                    resize: "none",
                  }}
                />

                <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    style={primaryButtonStyle}
                  >
                    {loading ? "Generating..." : "Generate Script"}
                  </button>

                  <button
                    onClick={handleSaveProject}
                    disabled={saving || (!structuredResult && !result)}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: saving || (!structuredResult && !result) ? 0.6 : 1,
                      cursor:
                        saving || (!structuredResult && !result)
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Project"}
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={chipStyle}>All</div>
                  <div style={chipStyle}>Output</div>
                  <div style={chipStyle}>Projects</div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{
                      ...iconButtonStyle,
                      background:
                        viewMode === "grid"
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{
                      ...iconButtonStyle,
                      background:
                        viewMode === "list"
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <List size={16} />
                  </button>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "14px",
                      padding: "10px 14px",
                      fontSize: "14px",
                    }}
                  >
                    <Folder size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Assets
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
                {activeTab === "output" && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "24px",
                      padding: "18px",
                      minHeight: "100%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: "18px" }}>Generated Output</h2>

                      <button onClick={handleCopy} style={secondaryButtonStyle}>
                        <Copy size={16} />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    {structuredResult || result ? (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.7",
                          color: "rgba(255,255,255,0.86)",
                          fontSize: "15px",
                        }}
                      >
                        {result ||
                          JSON.stringify(structuredResult, null, 2)}
                      </div>
                    ) : (
                      <p style={{ color: "rgba(255,255,255,0.6)" }}>
                        No output yet. Generate a script to see it here.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "projects" && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "24px",
                      padding: "18px",
                      minHeight: "100%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
                      Saved Projects
                    </h2>

                    {projects.length === 0 ? (
                      <p style={{ color: "rgba(255,255,255,0.6)" }}>
                        No saved projects yet for this account.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: "12px",
                        }}
                      >
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            style={{
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "18px",
                              padding: "16px",
                              background: "rgba(255,255,255,0.03)",
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "16px",
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: "28px",
                                  fontWeight: 700,
                                  marginBottom: "6px",
                                }}
                              >
                                {project.title || "Untitled Project"}
                              </div>

                              <div
                                style={{
                                  color: "rgba(255,255,255,0.78)",
                                  marginBottom: "6px",
                                  fontSize: "15px",
                                }}
                              >
                                {project.genre || "Unknown"} · {project.tone || "Unknown"}
                              </div>

                              <div
                                style={{
                                  color: "rgba(255,255,255,0.52)",
                                  fontSize: "14px",
                                }}
                              >
                                {project.created_at
                                  ? new Date(project.created_at).toLocaleString()
                                  : ""}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              <button
                                onClick={() => handleOpenProject(project)}
                                style={secondaryButtonStyle}
                              >
                                <FolderOpen size={16} />
                                Open
                              </button>

                              <button
                                onClick={() => handleDeleteProject(project.id)}
                                style={{
                                  ...secondaryButtonStyle,
                                  border: "1px solid rgba(255,90,90,0.2)",
                                }}
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "editor" && (
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "24px",
                      padding: "18px",
                      minHeight: "100%",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    }}
                  >
                    <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>
                      Story Workspace
                    </h2>

                    <div
                      style={{
                        display: "grid",
                        gap: "14px",
                      }}
                    >
                      <div style={metaCardStyle}>
                        <div style={metaLabelStyle}>Title</div>
                        <div style={metaValueStyle}>
                          {title || structuredResult?.title || "Untitled Project"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "14px",
                        }}
                      >
                        <div style={metaCardStyle}>
                          <div style={metaLabelStyle}>Genre</div>
                          <div style={metaValueStyle}>{genre}</div>
                        </div>

                        <div style={metaCardStyle}>
                          <div style={metaLabelStyle}>Tone</div>
                          <div style={metaValueStyle}>{tone}</div>
                        </div>
                      </div>

                      <div style={metaCardStyle}>
                        <div style={metaLabelStyle}>Idea</div>
                        <div style={metaBodyStyle}>
                          {idea || "Your idea will appear here."}
                        </div>
                      </div>

                      <div style={metaCardStyle}>
                        <div style={metaLabelStyle}>Preview</div>
                        <div style={metaBodyStyle}>
                          {result
                            ? `${result.slice(0, 700)}${result.length > 700 ? "..." : ""}`
                            : "Generate a script to preview your story here."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  padding: "12px 16px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div style={chipStyle}>Story Workspace</div>
                <div style={chipStyle}>Genre: {genre}</div>
                <div style={chipStyle}>Tone: {tone}</div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  outline: "none",
  fontSize: "15px",
  marginBottom: "10px",
};

const primaryButtonStyle = {
  width: "100%",
  border: "none",
  background: "linear-gradient(135deg, #5b4dff, #8b5cf6)",
  color: "white",
  borderRadius: "14px",
  padding: "14px 16px",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(91,77,255,0.28)",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  borderRadius: "14px",
  padding: "12px 14px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const chipStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "13px",
  color: "rgba(255,255,255,0.82)",
};

const iconButtonStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  borderRadius: "12px",
  padding: "10px",
  cursor: "pointer",
};

const metaCardStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "18px",
  padding: "16px",
};

const metaLabelStyle = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.56)",
  marginBottom: "8px",
};

const metaValueStyle = {
  fontSize: "18px",
  color: "white",
  fontWeight: 600,
};

const metaBodyStyle = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "rgba(255,255,255,0.82)",
};