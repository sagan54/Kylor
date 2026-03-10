"use client";

import Link from "next/link";
import Image from "next/image";
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
  Layers3,
  ChevronRight,
  Check,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [shotType, setShotType] = useState("Wide Shot");
  const [lighting, setLighting] = useState("Cinematic");
  const [mood, setMood] = useState("Epic");
  const [ratio, setRatio] = useState("16:9");

  const [selectedCamera, setSelectedCamera] = useState("arri-alexa-35");
  const [selectedLens, setSelectedLens] = useState("signature-prime");

  const cameraScrollRef = useRef(null);
  const lensScrollRef = useRef(null);

  const CARD_HEIGHT = 170;

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
      id: "arri-alexa-35",
      name: "ARRI Alexa 35",
      type: "Cinema Digital",
      note: "Premium narrative look",
      image: "/cameras/arri-alexa-35.png",
    },
    {
      id: "sony-venice-2",
      name: "Sony Venice 2",
      type: "Full Frame Cinema",
      note: "Elegant cinematic contrast",
      image: "/cameras/sony-venice-2.png",
    },
    {
      id: "red-v-raptor",
      name: "RED V-Raptor",
      type: "Large Format",
      note: "High-end sharp visual detail",
      image: "/cameras/red-v-raptor.png",
    },
    {
      id: "blackmagic-ursa-cine",
      name: "Blackmagic URSA Cine",
      type: "Studio Digital",
      note: "Rich texture balance",
      image: "/cameras/blackmagic-ursa-cine.png",
    },
  ];

  const lenses = [
    {
      id: "signature-prime",
      name: "Signature Prime",
      type: "Modern Prime",
      note: "Premium polished cinema",
      image: "/lenses/signature-prime.png",
    },
    {
      id: "cooke-s4i",
      name: "Cooke S4/i",
      type: "Classic Prime",
      note: "Warm organic softness",
      image: "/lenses/cooke-s4i.png",
    },
    {
      id: "master-prime",
      name: "Master Prime",
      type: "High Precision",
      note: "Clean premium sharpness",
      image: "/lenses/master-prime.png",
    },
    {
      id: "anamorphic-set",
      name: "Anamorphic Set",
      type: "Scope Cinema",
      note: "Epic wide-screen character",
      image: "/lenses/anamorphic-set.png",
    },
  ];

  const currentCamera =
    cameras.find((camera) => camera.id === selectedCamera) || cameras[0];
  const currentLens =
    lenses.find((lens) => lens.id === selectedLens) || lenses[0];

  useEffect(() => {
    const cameraEl = cameraScrollRef.current;
    const lensEl = lensScrollRef.current;

    function handleSnapSelect(container, items, setter) {
      if (!container) return;

      const centerY = container.scrollTop + container.clientHeight / 2;
      const index = Math.round((centerY - CARD_HEIGHT / 2) / CARD_HEIGHT);
      const safeIndex = Math.max(0, Math.min(items.length - 1, index));

      setter(items[safeIndex].id);
    }

    let cameraTimeout;
    let lensTimeout;

    function onCameraScroll() {
      clearTimeout(cameraTimeout);
      cameraTimeout = setTimeout(() => {
        handleSnapSelect(cameraEl, cameras, setSelectedCamera);
      }, 40);
    }

    function onLensScroll() {
      clearTimeout(lensTimeout);
      lensTimeout = setTimeout(() => {
        handleSnapSelect(lensEl, lenses, setSelectedLens);
      }, 40);
    }

    if (cameraEl) {
      cameraEl.addEventListener("scroll", onCameraScroll);
    }

    if (lensEl) {
      lensEl.addEventListener("scroll", onLensScroll);
    }

    return () => {
      if (cameraEl) {
        cameraEl.removeEventListener("scroll", onCameraScroll);
      }
      if (lensEl) {
        lensEl.removeEventListener("scroll", onLensScroll);
      }
    };
  }, [cameras, lenses]);

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

  const thumbCard = (active) => ({
    width: "100%",
    padding: "10px",
    borderRadius: "16px",
    border: active
      ? "1px solid rgba(124,58,237,0.55)"
      : "1px solid rgba(255,255,255,0.08)",
    background: active
      ? "linear-gradient(180deg, rgba(79,70,229,0.16), rgba(124,58,237,0.12))"
      : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
    cursor: "pointer",
    color: "white",
    textAlign: "left",
  });

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

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

                  <div style={{ ...panelStyle, padding: "16px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 340px",
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
                          padding: "14px",
                          display: "grid",
                          gridTemplateRows: "auto auto auto",
                          alignContent: "start",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            ...chipStyle,
                            width: "fit-content",
                          }}
                        >
                          <Layers3 size={14} />
                          Selected Setup
                        </div>

                        <div
                          style={{
                            ...softCard,
                            padding: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px",
                              alignItems: "start",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: "94px",
                                borderRadius: "16px",
                                border: "1px solid rgba(124,58,237,0.22)",
                                background: "rgba(124,58,237,0.05)",
                                pointerEvents: "none",
                                boxShadow: "0 0 20px rgba(124,58,237,0.08)",
                              }}
                            />

                            {/* LEFT — LENS */}
                            <div style={{ position: "relative", zIndex: 1 }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.58)",
                                  marginBottom: "8px",
                                  fontWeight: 600,
                                  letterSpacing: "0.02em",
                                }}
                              >
                                Lens
                              </div>

                              <div
                                ref={lensScrollRef}
                                className="hide-scrollbar"
                                style={{
                                  display: "grid",
                                  gap: "10px",
                                  maxHeight: "260px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  paddingRight: "2px",
                                  scrollbarWidth: "none",
                                  msOverflowStyle: "none",
                                  scrollSnapType: "y mandatory",
                                  scrollBehavior: "smooth",
                                }}
                              >
                                {lenses.map((lens) => {
                                  const active = selectedLens === lens.id;

                                  return (
                                    <button
                                      key={lens.id}
                                      onClick={() => setSelectedLens(lens.id)}
                                      style={{
                                        ...thumbCard(active),
                                        scrollSnapAlign: "center",
                                        minHeight: `${CARD_HEIGHT - 10}px`,
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: "82px",
                                          borderRadius: "12px",
                                          overflow: "hidden",
                                          position: "relative",
                                          background: "rgba(255,255,255,0.03)",
                                          border: "1px solid rgba(255,255,255,0.06)",
                                          marginBottom: "8px",
                                        }}
                                      >
                                        <Image
                                          src={lens.image}
                                          alt={lens.name}
                                          fill
                                          style={{ objectFit: "contain", padding: "10px" }}
                                        />
                                      </div>

                                      <div
                                        style={{
                                          fontSize: "13px",
                                          fontWeight: 700,
                                          display: "flex",
                                          justifyContent: "space-between",
                                          gap: "8px",
                                          alignItems: "center",
                                        }}
                                      >
                                        <span>{lens.name}</span>
                                        {active && <Check size={14} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* RIGHT — CAMERA */}
                            <div style={{ position: "relative", zIndex: 1 }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.58)",
                                  marginBottom: "8px",
                                  fontWeight: 600,
                                  letterSpacing: "0.02em",
                                }}
                              >
                                Camera
                              </div>

                              <div
                                ref={cameraScrollRef}
                                className="hide-scrollbar"
                                style={{
                                  display: "grid",
                                  gap: "10px",
                                  maxHeight: "260px",
                                  overflowY: "auto",
                                  overflowX: "hidden",
                                  paddingRight: "2px",
                                  scrollbarWidth: "none",
                                  msOverflowStyle: "none",
                                  scrollSnapType: "y mandatory",
                                  scrollBehavior: "smooth",
                                }}
                              >
                                {cameras.map((camera) => {
                                  const active = selectedCamera === camera.id;

                                  return (
                                    <button
                                      key={camera.id}
                                      onClick={() => setSelectedCamera(camera.id)}
                                      style={{
                                        ...thumbCard(active),
                                        scrollSnapAlign: "center",
                                        minHeight: `${CARD_HEIGHT - 10}px`,
                                      }}
                                    >
                                      <div
                                        style={{
                                          height: "82px",
                                          borderRadius: "12px",
                                          overflow: "hidden",
                                          position: "relative",
                                          background: "rgba(255,255,255,0.03)",
                                          border: "1px solid rgba(255,255,255,0.06)",
                                          marginBottom: "8px",
                                        }}
                                      >
                                        <Image
                                          src={camera.image}
                                          alt={camera.name}
                                          fill
                                          style={{ objectFit: "contain", padding: "10px" }}
                                        />
                                      </div>

                                      <div
                                        style={{
                                          fontSize: "13px",
                                          fontWeight: 700,
                                          display: "flex",
                                          justifyContent: "space-between",
                                          gap: "8px",
                                          alignItems: "center",
                                        }}
                                      >
                                        <span>{camera.name}</span>
                                        {active && <Check size={14} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
                            {currentCamera.name}
                          </h4>
                          <p
                            style={{
                              margin: "0 0 14px 0",
                              color: "rgba(255,255,255,0.62)",
                              lineHeight: 1.6,
                              fontSize: "14px",
                            }}
                          >
                            {currentLens.name} • {shotType} • {lighting} • {mood} • {ratio}
                          </p>

                          <button
                            style={{
                              width: "100%",
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
            </div>
          </div>
        </section>
      </div>
    </main>
  </>
);
}