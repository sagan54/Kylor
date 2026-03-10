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
  ChevronRight,
  Aperture,
  Monitor,
  SlidersHorizontal,
  Plus,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [shotType, setShotType] = useState("Wide Shot");
  const [lighting, setLighting] = useState("Cinematic");
  const [mood, setMood] = useState("Epic");
  const [ratio, setRatio] = useState("16:9");
  const [selectedCamera, setSelectedCamera] = useState("ARRI Alexa 35");
  const [selectedLens, setSelectedLens] = useState("Signature Prime");
  const [selectedFocal, setSelectedFocal] = useState("35mm");
  const [selectedAperture, setSelectedAperture] = useState("T1.8");
  const [activeMode, setActiveMode] = useState("Image");

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
    },
    {
      name: "RED V-Raptor",
      type: "Large Format",
      note: "Sharp high-end detail",
    },
    {
      name: "Sony Venice 2",
      type: "Full Frame",
      note: "Cinematic contrast",
    },
    {
      name: "Blackmagic URSA Cine",
      type: "Studio Digital",
      note: "Rich texture balance",
    },
  ];

  const lenses = [
    {
      name: "Signature Prime",
      type: "Modern Prime",
      note: "Premium polished cinema",
    },
    {
      name: "Cooke S4/i",
      type: "Classic Prime",
      note: "Warm organic softness",
    },
    {
      name: "Master Prime",
      type: "High Precision",
      note: "Clean premium sharpness",
    },
    {
      name: "Anamorphic Set",
      type: "Scope Cinema",
      note: "Epic horizontal character",
    },
  ];

  const focalOptions = ["24mm", "35mm", "50mm", "85mm"];
  const apertureOptions = ["T1.5", "T1.8", "T2.0", "T2.8"];

  const previewCards = useMemo(
    () => [
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
      {
        title: "Temple Reveal",
        meta: "Wide Shot • Epic • 16:9",
      },
    ],
    []
  );

  const panelStyle = {
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
    backdropFilter: "blur(12px)",
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
    padding: "16px 18px",
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

  const modeButton = (active) => ({
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: active
      ? "linear-gradient(135deg, rgba(79,70,229,0.28), rgba(124,58,237,0.20))"
      : "rgba(255,255,255,0.03)",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  });

  const actionButton = {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  };

  const selectedCameraData = cameras.find((c) => c.name === selectedCamera);
  const selectedLensData = lenses.find((l) => l.name === selectedLens);

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
              <div style={chipStyle}>Cinema Studio</div>
              <div style={chipStyle}>Premium Camera Control</div>
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
                    maxWidth: "900px",
                    color: "rgba(255,255,255,0.68)",
                    fontSize: "20px",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Generate cinematic stills, concept frames, and production-ready
                  visual directions with a real camera-and-lens workflow.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 0.9fr",
                  gap: "22px",
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: "22px" }}>
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
                          ratio, and premium camera setup.
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <div style={chipStyle}>Studio UI</div>
                        <div style={chipStyle}>Image v2</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                      <button
                        onClick={() => setActiveMode("Image")}
                        style={modeButton(activeMode === "Image")}
                      >
                        Image
                      </button>
                      <button
                        onClick={() => setActiveMode("Video")}
                        style={modeButton(activeMode === "Video")}
                      >
                        Video
                      </button>
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
                    </div>
                  </div>

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
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "24px" }}>
                          Camera & Lens Studio
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.60)",
                            fontSize: "14px",
                          }}
                        >
                          Choose premium cinema cameras, lenses, focal lengths, and
                          aperture for more intentional visual output.
                        </p>
                      </div>

                      <div style={{ ...chipStyle, display: "inline-flex", gap: "8px", alignItems: "center" }}>
                        <SlidersHorizontal size={14} />
                        Manual Optics Control
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "14px",
                        marginBottom: "16px",
                      }}
                    >
                      {cameras.map((camera) => {
                        const active = selectedCamera === camera.name;

                        return (
                          <button
                            key={camera.name}
                            onClick={() => setSelectedCamera(camera.name)}
                            style={{
                              ...softCard,
                              padding: "16px",
                              textAlign: "left",
                              cursor: "pointer",
                              color: "white",
                              background: active
                                ? "linear-gradient(135deg, rgba(79,70,229,0.24), rgba(124,58,237,0.16))"
                                : softCard.background,
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "14px",
                                display: "grid",
                                placeItems: "center",
                                background: "rgba(255,255,255,0.05)",
                                marginBottom: "12px",
                              }}
                            >
                              <Camera size={20} />
                            </div>

                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                marginBottom: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <span>{camera.name}</span>
                              {active && <Check size={15} />}
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.66)",
                                marginBottom: "6px",
                              }}
                            >
                              {camera.type}
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.82)",
                              }}
                            >
                              {camera.note}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "14px",
                        marginBottom: "16px",
                      }}
                    >
                      {lenses.map((lens) => {
                        const active = selectedLens === lens.name;

                        return (
                          <button
                            key={lens.name}
                            onClick={() => setSelectedLens(lens.name)}
                            style={{
                              ...softCard,
                              padding: "16px",
                              textAlign: "left",
                              cursor: "pointer",
                              color: "white",
                              background: active
                                ? "linear-gradient(135deg, rgba(79,70,229,0.24), rgba(124,58,237,0.16))"
                                : softCard.background,
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "14px",
                                display: "grid",
                                placeItems: "center",
                                background: "rgba(255,255,255,0.05)",
                                marginBottom: "12px",
                              }}
                            >
                              <Aperture size={20} />
                            </div>

                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                marginBottom: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <span>{lens.name}</span>
                              {active && <Check size={15} />}
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.66)",
                                marginBottom: "6px",
                              }}
                            >
                              {lens.type}
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.82)",
                              }}
                            >
                              {lens.note}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: "14px",
                      }}
                    >
                      <div style={{ ...softCard, padding: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.62)",
                            marginBottom: "8px",
                          }}
                        >
                          Selected Camera
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>
                          {selectedCamera}
                        </div>
                      </div>

                      <div style={{ ...softCard, padding: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.62)",
                            marginBottom: "8px",
                          }}
                        >
                          Focal Length
                        </div>
                        <select
                          value={selectedFocal}
                          onChange={(e) => setSelectedFocal(e.target.value)}
                          style={selectStyle}
                        >
                          {focalOptions.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ ...softCard, padding: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.62)",
                            marginBottom: "8px",
                          }}
                        >
                          Aperture
                        </div>
                        <select
                          value={selectedAperture}
                          onChange={(e) => setSelectedAperture(e.target.value)}
                          style={selectStyle}
                        >
                          {apertureOptions.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ ...softCard, padding: "16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.62)",
                            marginBottom: "8px",
                          }}
                        >
                          Lens Package
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>
                          {selectedLens}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
                      minHeight: "560px",
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
                            minHeight: "240px",
                            display: "grid",
                            placeItems: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background:
                                "radial-gradient(circle at top, rgba(124,58,237,0.15), transparent 36%)",
                            }}
                          />
                          <div
                            style={{
                              position: "relative",
                              textAlign: "center",
                              padding: "18px",
                            }}
                          >
                            <div
                              style={{
                                width: "60px",
                                height: "60px",
                                margin: "0 auto 12px",
                                borderRadius: "18px",
                                display: "grid",
                                placeItems: "center",
                                background:
                                  "linear-gradient(135deg, rgba(79,70,229,0.22), rgba(124,58,237,0.18))",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <ImageIcon size={22} />
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: 700 }}>
                              Variation {i}
                            </div>
                            <div
                              style={{
                                marginTop: "6px",
                                fontSize: "12px",
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      marginTop: "16px",
                    }}
                  >
                    <div style={{ ...softCard, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Camera size={16} />
                        <strong style={{ fontSize: "14px" }}>Camera</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {selectedCamera}
                      </p>
                    </div>

                    <div style={{ ...softCard, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Aperture size={16} />
                        <strong style={{ fontSize: "14px" }}>Lens</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {selectedLens}
                      </p>
                    </div>

                    <div style={{ ...softCard, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Film size={16} />
                        <strong style={{ fontSize: "14px" }}>Look</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {shotType} • {lighting} • {mood}
                      </p>
                    </div>

                    <div style={{ ...softCard, padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "8px",
                        }}
                      >
                        <Layers3 size={16} />
                        <strong style={{ fontSize: "14px" }}>Optics</strong>
                      </div>
                      <p style={{ margin: 0, color: "rgba(255,255,255,0.72)" }}>
                        {selectedFocal} • {selectedAperture} • {ratio}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  ...panelStyle,
                  padding: "16px",
                  position: "sticky",
                  bottom: "18px",
                  zIndex: 10,
                  background:
                    "linear-gradient(180deg, rgba(22,25,33,0.98), rgba(15,18,25,0.96))",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr auto auto",
                    gap: "14px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      ...softCard,
                      padding: "10px",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => setActiveMode("Image")}
                      style={{
                        ...modeButton(activeMode === "Image"),
                        width: "100%",
                        padding: "10px",
                      }}
                    >
                      Image
                    </button>
                    <button
                      onClick={() => setActiveMode("Video")}
                      style={{
                        ...modeButton(activeMode === "Video"),
                        width: "100%",
                        padding: "10px",
                      }}
                    >
                      Video
                    </button>
                  </div>

                  <div
                    style={{
                      ...softCard,
                      padding: "14px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "rgba(255,255,255,0.66)",
                      }}
                    >
                      <button
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          color: "white",
                          display: "grid",
                          placeItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={16} />
                      </button>
                      <span style={{ fontSize: "14px" }}>
                        Describe your scene — use camera language, mood, and action
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <div style={chipStyle}>4 images</div>
                      <div style={chipStyle}>{ratio}</div>
                      <div style={chipStyle}>4K Look</div>
                      <div style={chipStyle}>{selectedFocal}</div>
                      <div style={chipStyle}>{selectedAperture}</div>
                      <div style={chipStyle}>@ characters</div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...softCard,
                      padding: "14px",
                      minWidth: "210px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      {selectedCameraData?.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.62)",
                        marginBottom: "8px",
                      }}
                    >
                      {selectedLensData?.name} • {selectedFocal} • {selectedAperture}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Premium cinema configuration
                    </div>
                  </div>

                  <button
                    style={{
                      padding: "20px 28px",
                      borderRadius: "16px",
                      border: "none",
                      background: "linear-gradient(135deg, #d4f23b, #d7ff4a)",
                      color: "#101410",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: 800,
                      boxShadow: "0 14px 30px rgba(212,242,59,0.18)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    GENERATE
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "26px" }}>
                <h3 style={{ margin: "0 0 14px 0", fontSize: "24px" }}>
                  Recent Image Frames
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: "18px",
                  }}
                >
                  {previewCards.map((card) => (
                    <div key={card.title} style={softCard}>
                      <div
                        style={{
                          height: "220px",
                          background:
                            "radial-gradient(circle at top left, rgba(79,70,229,0.22), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
                          display: "grid",
                          placeItems: "center",
                          borderTopLeftRadius: "18px",
                          borderTopRightRadius: "18px",
                        }}
                      >
                        <Monitor size={28} style={{ opacity: 0.75 }} />
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