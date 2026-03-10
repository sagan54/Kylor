"use client";

import Link from "next/link";
import Image from "next/image";
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
  Grid3X3,
  List,
  Wand2,
  ChevronRight,
  Check,
  Bell,
  X,
  ChevronDown,
  Folder,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("3:4");
  const [mode, setMode] = useState("2K HD");
  const [outputCount, setOutputCount] = useState(4);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedCamera, setSelectedCamera] = useState("arri-alexa-35");
  const [selectedLens, setSelectedLens] = useState("signature-prime");

  const panelRef = useRef(null);
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

  const modes = ["1K SD", "2K HD", "4K"];
  const ratios = ["Auto", "9:16", "2:3", "3:4", "1:1", "4:3", "3:2", "16:9", "21:9"];
  const outputs = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    fontFamily: "inherit",
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

  const settingsButtonStyle = (active) => ({
    height: "42px",
    borderRadius: "12px",
    border: active
      ? "1px solid rgba(255,255,255,0.18)"
      : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
  });

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

              <div style={{ ...panelStyle, padding: "16px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "520px 1fr",
                    gap: "0px",
                    minHeight: "760px",
                    overflow: "hidden",
                    borderRadius: "22px",
                  }}
                >
                  {/* LEFT PANEL */}
                  <div
                    style={{
                      borderRight: "1px solid rgba(255,255,255,0.08)",
                      background:
                        "linear-gradient(180deg, rgba(8,10,16,0.96), rgba(10,12,18,0.96))",
                      padding: "18px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "22px",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        paddingBottom: "14px",
                        marginBottom: "18px",
                        fontSize: "15px",
                      }}
                    >
                      <div
                        style={{
                          color: "white",
                          fontWeight: 700,
                          position: "relative",
                          paddingBottom: "4px",
                        }}
                      >
                        Image Generation
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: "-15px",
                            width: "100%",
                            height: "2px",
                            borderRadius: "999px",
                            background: "white",
                          }}
                        />
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.60)" }}>Video Generation</div>
                      <div style={{ color: "rgba(255,255,255,0.60)" }}>Motion Control</div>
                      <div style={{ color: "rgba(255,255,255,0.60)" }}>Avatar</div>
                    </div>

                    <button
                      style={{
                        width: "100%",
                        padding: "14px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        marginBottom: "14px",
                        fontFamily: "inherit",
                      }}
                    >
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "14px",
                          display: "grid",
                          placeItems: "center",
                          background:
                            "linear-gradient(135deg, rgba(132,204,22,0.95), rgba(16,185,129,0.75), rgba(6,182,212,0.75))",
                          color: "black",
                          fontWeight: 800,
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        3.0
                      </div>

                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          IMAGE 3.0
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.52)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Strengthen consistency, free multi-reference image generation
                        </div>
                      </div>

                      <ChevronDown size={16} color="rgba(255,255,255,0.58)" />
                    </button>

                    <div
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        color: "white",
                        marginBottom: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          Image Reference{" "}
                          <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>
                            (Optional)
                          </span>
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.46)", fontSize: "13px" }}>
                          0/10
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.02)",
                        padding: "14px",
                        minHeight: "312px",
                        marginBottom: "16px",
                      }}
                    >
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="You can directly describe the image you want to generate..."
                        style={{
                          ...inputStyle,
                          minHeight: "250px",
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          resize: "none",
                          fontSize: "15px",
                          lineHeight: 1.7,
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "10px",
                        }}
                      >
                        <button
                          style={{
                            borderRadius: "12px",
                            border: "1px solid rgba(132,204,22,0.28)",
                            background: "rgba(132,204,22,0.10)",
                            color: "#a3e635",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Styles
                        </button>

                        <button
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "white",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Sparkles size={15} />
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          ...softCard,
                          padding: "12px",
                          marginBottom: "14px",
                        }}
                      >
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
                            maxHeight: "180px",
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
                                  minHeight: `${CARD_HEIGHT - 22}px`,
                                }}
                              >
                                <div
                                  style={{
                                    height: "68px",
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

                      <div
                        style={{
                          ...softCard,
                          padding: "12px",
                        }}
                      >
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
                            maxHeight: "180px",
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
                                  minHeight: `${CARD_HEIGHT - 22}px`,
                                }}
                              >
                                <div
                                  style={{
                                    height: "68px",
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

                    <div
                      ref={panelRef}
                      style={{
                        position: "absolute",
                        left: "18px",
                        right: "18px",
                        bottom: "18px",
                      }}
                    >
                      <AnimatePresence>
                        {settingsOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.985 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              marginBottom: "12px",
                              borderRadius: "24px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(26,29,36,0.96)",
                              backdropFilter: "blur(14px)",
                              boxShadow: "0 24px 80px rgba(0,0,0,0.46)",
                              padding: "14px",
                            }}
                          >
                            <div style={{ marginBottom: "16px" }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.58)",
                                  marginBottom: "8px",
                                }}
                              >
                                Mode
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(3, 1fr)",
                                  gap: "8px",
                                  padding: "4px",
                                  borderRadius: "16px",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                {modes.map((item) => (
                                  <button
                                    key={item}
                                    onClick={() => setMode(item)}
                                    style={settingsButtonStyle(mode === item)}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.58)",
                                  marginBottom: "8px",
                                }}
                              >
                                Ratio
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(5, 1fr)",
                                  gap: "8px",
                                }}
                              >
                                {ratios.map((item) => (
                                  <button
                                    key={item}
                                    onClick={() => setRatio(item)}
                                    style={settingsButtonStyle(ratio === item)}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "rgba(255,255,255,0.58)",
                                  marginBottom: "8px",
                                }}
                              >
                                Output
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(9, 1fr)",
                                  gap: "8px",
                                }}
                              >
                                {outputs.map((item) => (
                                  <button
                                    key={item}
                                    onClick={() => setOutputCount(item)}
                                    style={settingsButtonStyle(outputCount === item)}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <button
                          onClick={() => setSettingsOpen((prev) => !prev)}
                          style={{
                            height: "48px",
                            padding: "0 14px",
                            borderRadius: "14px",
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "#111318",
                            color: "rgba(255,255,255,0.88)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: "inherit",
                          }}
                        >
                          <Settings size={15} />
                          <span>
                            {mode} · {ratio} · {outputCount}
                          </span>
                          <ChevronDown
                            size={15}
                            style={{
                              transform: settingsOpen ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </button>

                        <button
                          style={{
                            flex: 1,
                            height: "48px",
                            borderRadius: "14px",
                            border: "none",
                            background: "linear-gradient(135deg, #84cc16, #a3e635)",
                            color: "black",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: 800,
                            boxShadow: "0 14px 30px rgba(132,204,22,0.18)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            fontFamily: "inherit",
                          }}
                        >
                          <Wand2 size={17} />
                          Generate
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.92)",
                      display: "grid",
                      gridTemplateRows: "52px 56px 1fr",
                    }}
                  >
                    <div
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        background: "#17191e",
                        padding: "0 18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "rgba(255,255,255,0.84)",
                          fontSize: "14px",
                        }}
                      >
                        <Bell size={14} color="rgba(255,255,255,0.56)" />
                        <span>Turn on notifications for generation update.</span>
                        <button
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#a3e635",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "14px",
                            fontFamily: "inherit",
                          }}
                        >
                          Allow
                        </button>
                      </div>

                      <button
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "rgba(255,255,255,0.48)",
                          cursor: "pointer",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 18px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {["All", "Images", "Videos", "Audio"].map((item, index) => (
                          <button
                            key={item}
                            style={{
                              height: "32px",
                              padding: "0 14px",
                              borderRadius: "9px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background:
                                index === 0 ? "rgba(255,255,255,0.10)" : "transparent",
                              color:
                                index === 0 ? "white" : "rgba(255,255,255,0.66)",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontFamily: "inherit",
                            }}
                          >
                            {item}
                          </button>
                        ))}

                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginLeft: "8px",
                            fontSize: "14px",
                            color: "rgba(255,255,255,0.86)",
                          }}
                        >
                          <input type="checkbox" />
                          Favorites
                        </label>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                            color: "white",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Grid3X3 size={15} />
                        </button>

                        <button
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                            color: "white",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <List size={15} />
                        </button>

                        <button
                          style={{
                            height: "38px",
                            padding: "0 14px",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                            color: "rgba(255,255,255,0.86)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontFamily: "inherit",
                          }}
                        >
                          <Folder size={15} />
                          Assets
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        padding: "20px",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: "84px",
                            height: "84px",
                            borderRadius: "999px",
                            margin: "0 auto 18px",
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                          }}
                        >
                          <ImageIcon size={34} color="rgba(255,255,255,0.28)" />
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.42)",
                            fontSize: "18px",
                          }}
                        >
                          Release your creative potential. Experience the magic of Kylor AI.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: "12px" }} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}