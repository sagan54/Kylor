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
  Aperture,
  Layers3,
  ChevronRight,
  Check,
} from "lucide-react";
import { useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [shotType, setShotType] = useState("Wide Shot");
  const [lighting, setLighting] = useState("Cinematic");
  const [mood, setMood] = useState("Epic");
  const [ratio, setRatio] = useState("16:9");

  const [selectedCamera, setSelectedCamera] = useState("ARRI Alexa 35");
  const [selectedLens, setSelectedLens] = useState("Signature Prime");

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

  const cameras = [
    {
      name: "ARRI Alexa 35",
      type: "Cinema Digital",
      note: "Premium narrative look",
      icon: "📷",
    },
    {
      name: "Sony Venice 2",
      type: "Full Frame Cinema",
      note: "Elegant cinematic contrast",
      icon: "🎥",
    },
    {
      name: "RED V-Raptor",
      type: "Large Format",
      note: "High-end sharp visual detail",
      icon: "📹",
    },
    {
      name: "Blackmagic URSA Cine",
      type: "Studio Digital",
      note: "Rich texture balance",
      icon: "📸",
    },
  ];

  const lenses = [
    {
      name: "Signature Prime",
      type: "Modern Prime",
      note: "Premium polished cinema",
      icon: "◉",
    },
    {
      name: "Cooke S4/i",
      type: "Classic Prime",
      note: "Warm organic softness",
      icon: "◎",
    },
    {
      name: "Master Prime",
      type: "High Precision",
      note: "Clean premium sharpness",
      icon: "⬤",
    },
    {
      name: "Anamorphic Set",
      type: "Scope Cinema",
      note: "Epic wide-screen character",
      icon: "◌",
    },
  ];

  const panelStyle = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    backdropFilter: "blur(10px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
  };

  const softCard = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    borderRadius: "16px",
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

  const sectionTitle = {
    margin: "0 0 6px 0",
    fontSize: "24px",
  };

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
              <div style={chipStyle}>Image Engine</div>
              <div style={chipStyle}>Cinema Studio</div>
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
                    maxWidth: "920px",
                    color: "rgba(255,255,255,0.68)",
                    fontSize: "20px",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Generate cinematic stills and concept frames with a clean,
                  filmmaker-friendly workflow.
                </p>
              </div>

              <div style={{ display: "grid", gap: "22px" }}>
                {/* TOP — BIG PREVIEW */}
                <div style={{ ...panelStyle, padding: "22px" }}>
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
                    <h3 style={{ margin: 0, fontSize: "24px" }}>Render Preview</h3>
                    <div style={chipStyle}>4 Variations</div>
                  </div>

                  <div
                    style={{
                      minHeight: "620px",
                      padding: "28px",
                      borderRadius: "22px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "radial-gradient(circle at top, rgba(79,70,229,0.22), transparent 36%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                      overflow: "hidden",
                      boxShadow: "0 0 60px rgba(79,70,229,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gridTemplateRows: "1fr",
                        gap: "18px",
                        width: "100%",
                        minHeight: "100%",
                      }}
                    >
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background:
                              "radial-gradient(circle at top, rgba(124,58,237,0.14), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))",
                            aspectRatio: "16 / 9",
                            display: "grid",
                            placeItems: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ textAlign: "center", padding: "20px" }}>
                            <div
                              style={{
                                width: "66px",
                                height: "66px",
                                margin: "0 auto 12px",
                                borderRadius: "20px",
                                display: "grid",
                                placeItems: "center",
                                background:
                                  "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.18))",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <ImageIcon size={24} />
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 700 }}>
                              Variation {i}
                            </div>
                            <div
                              style={{
                                marginTop: "6px",
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.62)",
                              }}
                            >
                              Ready for image output
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MIDDLE — CAMERA & LENS */}
                <div style={{ ...panelStyle, padding: "22px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <h3 style={sectionTitle}>Camera & Lens</h3>
                      <p
                        style={{
                          margin: 0,
                          color: "rgba(255,255,255,0.60)",
                          fontSize: "14px",
                        }}
                      >
                        Scroll and choose a cinematic camera setup.
                      </p>
                    </div>

                    <div style={chipStyle}>Premium Optics</div>
                  </div>

                  <div style={{ display: "grid", gap: "18px" }}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "14px",
                          overflowX: "auto",
                          paddingBottom: "4px",
                          scrollbarWidth: "thin",
                        }}
                      >
                        {cameras.map((camera) => {
                          const active = selectedCamera === camera.name;

                          return (
                            <button
                              key={camera.name}
                              onClick={() => setSelectedCamera(camera.name)}
                              style={{
                                minWidth: "260px",
                                ...softCard,
                                padding: "18px",
                                textAlign: "left",
                                cursor: "pointer",
                                color: "white",
                                background: active
                                  ? "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.16))"
                                  : softCard.background,
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  height: "120px",
                                  borderRadius: "16px",
                                  marginBottom: "14px",
                                  display: "grid",
                                  placeItems: "center",
                                  background:
                                    "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 34%), rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  fontSize: "42px",
                                }}
                              >
                                {camera.icon}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "6px",
                                }}
                              >
                                <strong style={{ fontSize: "18px" }}>{camera.name}</strong>
                                {active && <Check size={16} />}
                              </div>

                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.62)",
                                  marginBottom: "6px",
                                }}
                              >
                                {camera.type}
                              </div>

                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.82)",
                                }}
                              >
                                {camera.note}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          gap: "14px",
                          overflowX: "auto",
                          paddingBottom: "4px",
                          scrollbarWidth: "thin",
                        }}
                      >
                        {lenses.map((lens) => {
                          const active = selectedLens === lens.name;

                          return (
                            <button
                              key={lens.name}
                              onClick={() => setSelectedLens(lens.name)}
                              style={{
                                minWidth: "240px",
                                ...softCard,
                                padding: "18px",
                                textAlign: "left",
                                cursor: "pointer",
                                color: "white",
                                background: active
                                  ? "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.16))"
                                  : softCard.background,
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  height: "110px",
                                  borderRadius: "16px",
                                  marginBottom: "14px",
                                  display: "grid",
                                  placeItems: "center",
                                  background:
                                    "radial-gradient(circle at top, rgba(79,70,229,0.18), transparent 34%), rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  fontSize: "42px",
                                }}
                              >
                                {lens.icon}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "6px",
                                }}
                              >
                                <strong style={{ fontSize: "18px" }}>{lens.name}</strong>
                                {active && <Check size={16} />}
                              </div>

                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.62)",
                                  marginBottom: "6px",
                                }}
                              >
                                {lens.type}
                              </div>

                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "rgba(255,255,255,0.82)",
                                }}
                              >
                                {lens.note}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM — SMALL COMPOSER */}
                <div style={{ ...panelStyle, padding: "16px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 360px",
                      gap: "18px",
                      alignItems: "stretch",
                    }}
                  >
                    <div style={{ display: "grid", gap: "14px" }}>
                      <div>
                        <h3 style={sectionTitle}>Image Composer</h3>
                        <p
                          style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.60)",
                            fontSize: "14px",
                          }}
                        >
                          Write your scene, choose the visual feel, and generate.
                        </p>
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
                          Scene Prompt
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={3}
                          placeholder="A lone astronaut walking through a red alien desert, massive planets in the sky, cinematic dust atmosphere..."
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
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
                    </div>

                    <div
                      style={{
                        ...softCard,
                        padding: "16px",
                        display: "grid",
                        alignContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                            ...chipStyle,
                          }}
                        >
                          <Layers3 size={14} />
                          Selected Setup
                        </div>

                        <h4 style={{ margin: "0 0 8px 0", fontSize: "22px" }}>
                          {selectedCamera}
                        </h4>

                        <p
                          style={{
                            margin: "0 0 12px 0",
                            color: "rgba(255,255,255,0.62)",
                            lineHeight: 1.6,
                            fontSize: "14px",
                          }}
                        >
                          {selectedLens} • {shotType} • {lighting} • {mood} • {ratio}
                        </p>
                      </div>

                      <button
                        style={{
                          padding: "16px 20px",
                          borderRadius: "16px",
                          border: "none",
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "16px",
                          fontWeight: 700,
                          boxShadow: "0 14px 30px rgba(124,58,237,0.20)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                        }}
                      >
                        <Wand2 size={18} />
                        Generate Image
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}