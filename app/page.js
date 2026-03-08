"use client";

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
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const sidebarItems = [
    { label: "Home", icon: Compass, active: true, href: "/" },
{ label: "Explore", icon: Compass, href: "/explore" },
    { label: "Story", icon: Clapperboard, href: "/story" },
    { label: "Image", icon: ImageIcon, href: "#" },
    { label: "Video", icon: Video, href: "#" },
    { label: "Consistency", icon: UserCircle2, href: "#" },
    { label: "Motion", icon: Orbit, href: "#" },
    { label: "Projects", icon: FolderKanban, href: "/story" },
    { label: "Settings", icon: Settings, href: "#" },
  ];

  const tools = [
    {
      title: "Image Generation",
      description:
        "Create cinematic stills, concept frames, style explorations, and key visuals.",
      tag: "Coming next",
      icon: ImageIcon,
    },
    {
      title: "Video Generation",
      description:
        "Build AI-driven cinematic clips, motion shots, and visual sequences.",
      tag: "Coming next",
      icon: Video,
    },
    {
      title: "Character Consistency",
      description:
        "Keep identity, wardrobe, and visual continuity consistent across outputs.",
      tag: "Coming next",
      icon: UserCircle2,
    },
    {
      title: "Motion Tools",
      description:
        "Develop motion lock, camera control, subject tracking, and movement workflows.",
      tag: "Coming next",
      icon: Orbit,
    },
  ];

  const quickActions = [
    {
      title: "Story Engine",
      subtitle: "Live now",
      href: "/story",
    },
    {
      title: "Project Workspace",
      subtitle: "Continue building",
      href: "/story",
    },
    {
      title: "Creative Modules",
      subtitle: "More engines coming",
      href: "#",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 24%), radial-gradient(circle at top right, rgba(139,92,246,0.14), transparent 28%), linear-gradient(180deg, #04070f 0%, #070d19 42%, #050914 100%)",
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
            background: "rgba(2,6,14,0.72)",
            backdropFilter: "blur(18px)",
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
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 0 30px rgba(99,102,241,0.12)",
            }}
          >
            <Sparkles size={22} />
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const card = (
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
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
                      ? "1px solid rgba(255,255,255,0.10)"
                      : "1px solid transparent",
                    color: item.active
                      ? "white"
                      : "rgba(255,255,255,0.64)",
                    cursor: "pointer",
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
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.2,
                      textAlign: "center",
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              );

              return item.href === "#" ? (
                <div key={item.label}>{card}</div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {card}
                </Link>
              );
            })}
          </div>
        </aside>

        <section
          style={{
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at 18% 22%, rgba(59,130,246,0.08), transparent 20%), radial-gradient(circle at 70% 10%, rgba(168,85,247,0.10), transparent 18%), radial-gradient(circle at 48% 78%, rgba(34,197,94,0.05), transparent 20%)",
              filter: "blur(18px)",
            }}
          />

          <div
            style={{
              maxWidth: "1360px",
              margin: "0 auto",
              padding: "32px 28px 48px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "18px",
                flexWrap: "wrap",
                marginBottom: "26px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 13px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(255,255,255,0.76)",
                    fontSize: "13px",
                    marginBottom: "16px",
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
                  AI Production Engine
                </div>

                <h1
                  style={{
                    fontSize: "58px",
                    lineHeight: 1,
                    margin: "0 0 10px 0",
                    letterSpacing: "-1.8px",
                  }}
                >
                  Kylor AI
                </h1>

                <p
                  style={{
                    margin: 0,
                    maxWidth: "760px",
                    color: "rgba(255,255,255,0.68)",
                    fontSize: "18px",
                    lineHeight: "1.8",
                  }}
                >
                  A cinematic AI production workspace for story, image, video,
                  character consistency, and motion-driven creative workflows.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {quickActions.map((action) => {
                  const content = (
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        minWidth: "190px",
                        padding: "14px 16px",
                        borderRadius: "18px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                        boxShadow:
                          "0 10px 28px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.02) inset",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "rgba(255,255,255,0.58)",
                          marginBottom: "8px",
                        }}
                      >
                        {action.subtitle}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "white",
                          }}
                        >
                          {action.title}
                        </span>
                        <ChevronRight size={16} color="rgba(255,255,255,0.72)" />
                      </div>
                    </motion.div>
                  );

                  return action.href === "#" ? (
                    <div key={action.title}>{content}</div>
                  ) : (
                    <Link
                      key={action.title}
                      href={action.href}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.45fr 1fr",
                gap: "20px",
                marginBottom: "22px",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: "easeOut" }}
                style={{
                  borderRadius: "28px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(255,255,255,0.03) 35%, rgba(124,58,237,0.14))",
                  boxShadow:
                    "0 18px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.03) inset",
                  position: "relative",
                  minHeight: "380px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 18% 20%, rgba(34,197,94,0.12), transparent 18%), radial-gradient(circle at 80% 28%, rgba(59,130,246,0.12), transparent 22%)",
                    filter: "blur(10px)",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    padding: "28px 28px 34px 28px",
                    display: "flex",
flexDirection: "column",
justifyContent: "flex-start",
height: "100%",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.82)",
                        fontSize: "12px",
                        marginBottom: "18px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          background: "#22c55e",
                          boxShadow: "0 0 12px #22c55e",
                        }}
                      />
                      Live Module
                    </div>

                    <h2
                      style={{
                        fontSize: "36px",
                        lineHeight: 1.08,
                        margin: "0 0 14px 0",
                        maxWidth: "720px",
                      }}
                    >
                      Story Engine is live and ready to build cinematic projects.
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.72)",
                        fontSize: "17px",
                        lineHeight: "1.8",
                        maxWidth: "680px",
                      }}
                    >
                      Generate story structures, save projects, open your
                      workspace, and continue building characters, scenes, and
                      cinematic development inside Kylor AI.
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginTop: "28px",
                    }}
                  >
                    <Link
                      href="/story"
                      style={{
                        textDecoration: "none",
                        color: "white",
                      }}
                    >
                      <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          padding: "13px 18px",
                          borderRadius: "14px",
                          background:
                            "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          fontWeight: 600,
                          boxShadow: "0 10px 26px rgba(124,58,237,0.24)",
                        }}
                      >
                        Open Story Engine
                      </motion.div>
                    </Link>

                    <div
                      style={{
                        padding: "13px 18px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.78)",
                        fontWeight: 500,
                      }}
                    >
                      Story → Project → Workspace
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.14, ease: "easeOut" }}
                style={{
                  borderRadius: "28px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                  boxShadow:
                    "0 18px 40px rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.03) inset",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.56)",
                    marginBottom: "14px",
                  }}
                >
                  Platform Direction
                </div>

                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "28px",
                    lineHeight: 1.15,
                  }}
                >
                  Kylor AI is evolving into a cinematic creation operating system.
                </h3>

                <p
                  style={{
                    margin: "0 0 18px 0",
                    color: "rgba(255,255,255,0.70)",
                    lineHeight: "1.8",
                    fontSize: "15px",
                  }}
                >
                  The current active experience is Story Engine. Next modules
                  extend Kylor into image generation, video generation,
                  consistency systems, and motion-aware AI tools.
                </p>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                  }}
                >
                  {[
                    "Story development foundation is live",
                    "Image and video engines are planned next",
                    "Consistency and motion will become core production tools",
                  ].map((point) => (
                    <div
                      key={point}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "rgba(255,255,255,0.76)",
                        fontSize: "14px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          background: "#7c3aed",
                          boxShadow: "0 0 10px rgba(124,58,237,0.8)",
                          flexShrink: 0,
                        }}
                      />
                      {point}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px",
              }}
            >
              {tools.map((tool, index) => {
                const Icon = tool.icon;

                return (
                  <motion.div
                    key={tool.title}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "22px",
                      padding: "22px",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                      backdropFilter: "blur(14px)",
                      minHeight: "220px",
                      boxShadow:
                        "0 10px 28px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.02) inset",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "14px",
                        display: "grid",
                        placeItems: "center",
                        background:
                          "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(124,58,237,0.12))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        marginBottom: "16px",
                      }}
                    >
                      <Icon size={20} />
                    </div>

                    <div
                      style={{
                        display: "inline-block",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.70)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: "999px",
                        padding: "6px 11px",
                        marginBottom: "14px",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      {tool.tag}
                    </div>

                    <h3
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: "24px",
                        lineHeight: "1.12",
                      }}
                    >
                      {tool.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(255,255,255,0.68)",
                        lineHeight: "1.8",
                        fontSize: "15px",
                      }}
                    >
                      {tool.description}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}