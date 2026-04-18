"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function EntryState({ onStart }) {
  const [prompt, setPrompt] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStart(prompt);
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 40%, rgba(124,58,237,0.15), transparent 60%), #05070c",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Glow */}
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "rgba(124,58,237,0.12)",
          filter: "blur(120px)",
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center",
          maxWidth: "720px",
          width: "100%",
          padding: "0 20px",
          zIndex: 2,
        }}
      >
        {/* Heading */}
        <h1
          style={{
            fontSize: "42px",
            fontWeight: 700,
            color: "white",
            marginBottom: "14px",
            letterSpacing: "-0.02em",
          }}
        >
          What will you direct today?
        </h1>

        {/* Subtext */}
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "15px",
            marginBottom: "28px",
          }}
        >
          Describe a scene, a moment, or a story.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px)",
            }}
          >
            <input
              type="text"
              placeholder="A lone warrior walking through a burning city..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: "15px",
                padding: "10px",
              }}
            />

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "10px 18px",
                borderRadius: "12px",
                border: "none",
                background:
                  "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Direct
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}