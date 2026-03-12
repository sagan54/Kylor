"use client";

import Link from "next/link";
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

  const panelRef = useRef(null);

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

  const modes = ["1K SD", "2K HD", "4K"];
  const ratios = ["Auto", "9:16", "2:3", "3:4", "1:1", "4:3", "3:2", "16:9", "21:9"];
  const outputs = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    borderRadius: "18px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
    backdropFilter: "blur(10px)",
    boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
  };

  const chipStyle = {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const settingsButtonStyle = (active) => ({
    height: "40px",
    borderRadius: "12px",
    border: active
      ? "1px solid rgba(139,92,246,0.45)"
      : "1px solid rgba(255,255,255,0.08)",
    background: active
      ? "linear-gradient(180deg, rgba(79,70,229,0.16), rgba(124,58,237,0.12))"
      : "rgba(255,255,255,0.03)",
    color: "white",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        height: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(79,70,229,0.14), transparent 24%), radial-gradient(circle at top right, rgba(124,58,237,0.12), transparent 28%), #05070c",
        color: "white",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "92px 1fr",
          height: "100vh",
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
                "linear-gradient(135deg, rgba(79,70,229,0.24), rgba(124,58,237,0.16))",
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
            height: "100vh",
            overflow: "hidden",
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

          <div
            style={{
              padding: "16px 18px 14px",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateRows: "auto 1fr",
              }}
            >
              <div style={{ marginBottom: "12px" }}>
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
                    marginBottom: "10px",
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
                  AI Visual Production
                </div>

                <h1
                  style={{
                    fontSize: "54px",
                    fontWeight: 800,
                    lineHeight: 1,
                    margin: 0,
                    color: "white",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Image Engine
                </h1>
              </div>

              <div style={{ ...panelStyle, padding: "10px", minHeight: 0 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "370px minmax(0, 1fr)",
                    gap: 0,
                    minHeight: "640px",
                    height: "100%",
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, rgba(10,12,24,0.96) 0%, rgba(7,8,18,0.98) 100%)",
                  }}
                >
                  {/* LEFT PANEL */}
                  <div
                    style={{
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      background:
                        "linear-gradient(180deg, rgba(8,10,16,0.96), rgba(10,12,18,0.96))",
                      padding: "14px",
                      position: "relative",
                      display: "grid",
                      gridTemplateRows: "auto auto auto 1fr auto",
                      gap: "12px",
                      minHeight: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        paddingBottom: "12px",
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
                            bottom: "-13px",
                            width: "100%",
                            height: "2px",
                            borderRadius: "999px",
                            background: "white",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          background: "#6D5CFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        V1
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
                          Kylor V1
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
                        padding: "10px 12px",
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        color: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "13px",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          Image Reference{" "}
                          <span
                            style={{
                              color: "rgba(255,255,255,0.38)",
                              fontWeight: 500,
                            }}
                          >
                            (Optional)
                          </span>
                        </span>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.46)",
                            fontSize: "13px",
                          }}
                        >
                          0/10
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.02)",
                        padding: "12px",
                        minHeight: 0,
                        height: "100%",
                        display: "grid",
                        gridTemplateRows: "1fr auto",
                      }}
                    >
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="You can directly describe the image you want to generate..."
                        style={{
                          ...inputStyle,
                          minHeight: 0,
                          height: "100%",
                          padding: 0,
                          border: "none",
                          background: "transparent",
                          resize: "none",
                          fontSize: "14px",
                          lineHeight: 1.65,
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
                            border: "1px solid rgba(124,58,237,0.35)",
                            background: "rgba(124,58,237,0.15)",
                            color: "#a78bfa",
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

                    <div ref={panelRef} style={{ position: "relative" }}>
                      <AnimatePresence>
                        {settingsOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.985 }}
                            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              bottom: "60px",
                              zIndex: 10,
                              borderRadius: "18px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(20,22,31,0.98)",
                              backdropFilter: "blur(14px)",
                              boxShadow: "0 24px 80px rgba(0,0,0,0.46)",
                              padding: "14px",
                            }}
                          >
                            <div style={{ marginBottom: "14px" }}>
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

                            <div style={{ marginBottom: "14px" }}>
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
                          display: "grid",
                          gridTemplateColumns: "155px 1fr",
                          gap: "10px",
                        }}
                      >
                        <button
                          onClick={() => setSettingsOpen((prev) => !prev)}
                          style={{
                            height: "44px",
                            padding: "0 12px",
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
                              marginLeft: "auto",
                            }}
                          />
                        </button>

                        <button
                          style={{
                            height: "44px",
                            borderRadius: "14px",
                            border: "none",
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: 800,
                            boxShadow: "0 14px 30px rgba(124,58,237,0.25)",
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
                      gridTemplateRows: "48px 52px 1fr",
                      minHeight: 0,
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
                            color: "#a78bfa",
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
                              height: "30px",
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
                            width: "36px",
                            height: "36px",
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
                            width: "36px",
                            height: "36px",
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
                            height: "36px",
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
                        minHeight: 0,
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "999px",
                            margin: "0 auto 14px",
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.03)",
                          }}
                        >
                          <ImageIcon size={30} color="rgba(255,255,255,0.28)" />
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color: "rgba(255,255,255,0.42)",
                            fontSize: "16px",
                          }}
                        >
                          Release your creative potential. Experience the magic of Kylor AI.
                        </p>
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
  );
}