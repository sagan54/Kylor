"use client";

import Link from "next/link";
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
  Grid3X3,
  List,
  Wand2,
  Camera,
  SunMedium,
  Film,
  Layers3,
} from "lucide-react";
import { useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [shotType, setShotType] = useState("Wide Shot");
  const [lighting, setLighting] = useState("Cinematic");
  const [mood, setMood] = useState("Epic");
  const [ratio, setRatio] = useState("16:9");

  const sidebarItems = [
    { label: "Home", icon: Compass, href: "/" },
    { label: "Explore", icon: Compass, href: "/explore" },
    { label: "Story", icon: Clapperboard, href: "/story" },
    { label: "Image", icon: ImageIcon, href: "/image", active: true },
    { label: "Video", icon: Video, href: "#" },
    { label: "Consistency", icon: UserCircle2, href: "#" },
    { label: "Motion", icon: Orbit, href: "#" },
    { label: "Projects", icon: FolderKanban, href: "/story" },
    { label: "Settings", icon: Settings, href: "#" },
  ];

  const panelStyle = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  const selectStyle = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0d1220",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
  };

  const chipStyle = {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
  };

  const cardStyle = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    overflow: "hidden",
  };

  const actionButton = {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  };

  const previewCards = [
    {
      title: "Alien Desert Arrival",
      meta: "Wide Shot • Cinematic • 16:9",
    },
    {
      title: "Hero Close Portrait",
      meta: "Close Up • Moody • 4:5",
    },
    {
      title: "Neon City Chase",
      meta: "Tracking Frame • Night • 21:9",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(79,70,229,0.16), transparent 24%), radial-gradient(circle at top right, rgba(124,58,237,0.16), transparent 28%), #05070c",
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
            gridTemplateRows: "56px 1fr",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div style={chipStyle}>Kylor Image Engine</div>
              <div style={chipStyle}>Cinematic Generation</div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => setAssetView("grid")}
                style={{
                  width: "36px",
                  height: "36px",
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
                  width: "36px",
                  height: "36px",
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
            </div>
          </div>

          <div style={{ padding: "28px", overflow: "auto" }}>
  <div style={{ width: "100%" }}>
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.82)",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: "#7c3aed",
                      boxShadow: "0 0 12px #7c3aed",
                    }}
                  />
                  AI Visual Production
                </div>

                <h1
                  style={{
                    fontSize: "56px",
                    lineHeight: 1,
                    margin: "0 0 14px 0",
                    letterSpacing: "-1.4px",
                  }}
                >
                  Kylor Image Engine
                </h1>

                <p
                  style={{
                    maxWidth: "860px",
                    color: "rgba(255,255,255,0.68)",
                    fontSize: "20px",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Generate cinematic stills, concept frames, and visual directions
                  for your projects with a premium production-style workflow.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
gridTemplateColumns: "1fr 1fr",
gap: "22px",
alignItems: "start",
                }}
              >
                <div style={{ ...panelStyle, padding: "22px" }}>
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
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "24px" }}>
                        Image Composer
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: "rgba(255,255,255,0.60)",
                          fontSize: "14px",
                        }}
                      >
                        Build a cinematic frame with prompt, shot, light, mood,
                        and ratio controls.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <div style={chipStyle}>Studio UI</div>
                      <div style={chipStyle}>Image v1</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "16px" }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          marginBottom: "8px",
                          color: "rgba(255,255,255,0.84)",
                        }}
                      >
                        Scene Prompt
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        placeholder="A lone astronaut walking through a red alien desert, massive planets in the sky, cinematic dust atmosphere, dramatic rim lighting..."
                        style={{
                          ...inputStyle,
                          resize: "vertical",
                          lineHeight: "1.7",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "14px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.84)",
                          }}
                        >
                          Shot Type
                        </label>
                        <select
                          value={shotType}
                          onChange={(e) => setShotType(e.target.value)}
                          style={selectStyle}
                        >
                          <option>Wide Shot</option>
                          <option>Medium Shot</option>
                          <option>Close Up</option>
                          <option>Overhead Shot</option>
                          <option>Tracking Frame</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.84)",
                          }}
                        >
                          Lighting
                        </label>
                        <select
                          value={lighting}
                          onChange={(e) => setLighting(e.target.value)}
                          style={selectStyle}
                        >
                          <option>Cinematic</option>
                          <option>Moody</option>
                          <option>Soft Daylight</option>
                          <option>Neon Night</option>
                          <option>High Contrast</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.84)",
                          }}
                        >
                          Mood
                        </label>
                        <select
                          value={mood}
                          onChange={(e) => setMood(e.target.value)}
                          style={selectStyle}
                        >
                          <option>Epic</option>
                          <option>Dark</option>
                          <option>Dreamlike</option>
                          <option>Tense</option>
                          <option>Emotional</option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            marginBottom: "8px",
                            color: "rgba(255,255,255,0.84)",
                          }}
                        >
                          Aspect Ratio
                        </label>
                        <select
                          value={ratio}
                          onChange={(e) => setRatio(e.target.value)}
                          style={selectStyle}
                        >
                          <option>16:9</option>
                          <option>21:9</option>
                          <option>4:5</option>
                          <option>1:1</option>
                          <option>9:16</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        style={{
                          padding: "13px 18px",
                          borderRadius: "12px",
                          border: "none",
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 12px 28px rgba(124,58,237,0.28)",
                        }}
                      >
                        <Wand2 size={16} />
                        Generate Image
                      </button>

                      <button style={actionButton}>Save Prompt Preset</button>
                      <button style={actionButton}>Use Project Story</button>
                    </div>
                  </div>
                </div>

                <div style={{ ...panelStyle, padding: "22px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "24px" }}>
                    Render Preview
                  </h3>

                  <div
                    style={{
                      minHeight: "520px",
padding: "16px",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "radial-gradient(circle at top, rgba(79,70,229,0.24), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                    }}
                  >
                   <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "12px",
    width: "100%",
    height: "100%",
  }}
>
  {[1, 2, 3, 4].map((i) => (
    <div
      key={i}
      style={{
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        minHeight: "220px",
        display: "grid",
        placeItems: "center",
      }}
    >
      <ImageIcon size={24} style={{ opacity: 0.7 }} />
    </div>
  ))}


                      <h4 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
                        Image Output Area
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "rgba(255,255,255,0.60)",
                          lineHeight: 1.7,
                          maxWidth: "420px",
                        }}
                      >
                        Your generated visual frame will appear here with a premium
                        preview card, ready for save, reuse, and future storyboard
                        flow.
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginTop: "16px",
                    }}
                  >
                    <div style={{ ...cardStyle, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Camera size={16} />
                        <strong style={{ fontSize: "14px" }}>Shot</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {shotType}
                      </p>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <SunMedium size={16} />
                        <strong style={{ fontSize: "14px" }}>Lighting</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {lighting}
                      </p>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Film size={16} />
                        <strong style={{ fontSize: "14px" }}>Mood</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {mood}
                      </p>
                    </div>

                    <div style={{ ...cardStyle, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Layers3 size={16} />
                        <strong style={{ fontSize: "14px" }}>Ratio</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {ratio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "24px" }}>
                  Recent Image Frames
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "18px",
                  }}
                >
                  {previewCards.map((card) => (
                    <div key={card.title} style={cardStyle}>
                      <div
                        style={{
                          height: "220px",
                          background:
                            "radial-gradient(circle at top left, rgba(79,70,229,0.22), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <ImageIcon size={28} style={{ opacity: 0.75 }} />
                      </div>

                      <div style={{ padding: "16px" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                          {card.title}
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.62)",
                            fontSize: "14px",
                          }}
                        >
                          {card.meta}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}