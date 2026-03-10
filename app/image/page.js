"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Image as ImageIcon,
  Video,
  UserCircle2,
  FolderKanban,
  Settings,
  Compass,
  Sparkles,
  Orbit,
  Grid3X3,
  List,
  Folder,
  Check,
  Settings2,
  Bell,
  PanelLeft,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ImagePage() {
  const [assetView, setAssetView] = useState("grid");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("IMAGE 3.0");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [mode, setMode] = useState("2K HD");
  const [ratio, setRatio] = useState("3:4");
  const [outputCount, setOutputCount] = useState(4);

  const panelRef = useRef(null);

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

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      <div className="flex min-h-screen">
        {/* LEFT SIDEBAR */}
        <aside className="w-[72px] border-r border-white/10 bg-[#0b0d12] flex flex-col items-center py-5">
          <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Orbit className="h-5 w-5 text-white/90" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <Compass className="h-4 w-4" />
              <span className="text-[10px]">Explore</span>
            </button>

            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <Folder className="h-4 w-4" />
              <span className="text-[10px]">Assets</span>
            </button>

            <div className="my-2 h-px w-8 bg-white/10" />

            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px]">Omni</span>
            </button>

            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl bg-lime-400/10 py-3 text-lime-400 transition">
              <Wand2 className="h-4 w-4" />
              <span className="text-[10px]">Generate</span>
            </button>

            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <PanelLeft className="h-4 w-4" />
              <span className="text-[10px]">Canvas</span>
            </button>

            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <Grid3X3 className="h-4 w-4" />
              <span className="text-[10px]">Tools</span>
            </button>
          </div>

          <div className="mt-auto flex flex-col items-center gap-3">
            <button className="flex w-[56px] flex-col items-center gap-2 rounded-2xl py-3 text-white/55 hover:bg-white/[0.04] hover:text-white transition">
              <Bell className="h-4 w-4" />
              <span className="text-[10px]">API</span>
            </button>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
              S
            </div>
          </div>
        </aside>

        {/* LEFT GENERATION PANEL */}
        <section className="relative w-[520px] border-r border-white/10 bg-[#0b0d12] px-5 pb-5 pt-4">
          {/* top tabs */}
          <div className="mb-6 flex items-center gap-6 border-b border-white/6 pb-4 text-sm">
            <button className="relative font-semibold text-white">
              Image Generation
              <span className="absolute -bottom-[17px] left-0 h-[2px] w-full rounded-full bg-white" />
            </button>
            <button className="text-white/65 hover:text-white">Video Generation</button>
            <button className="text-white/65 hover:text-white">Motion Control</button>
            <button className="text-white/65 hover:text-white">Avatar</button>
          </div>

          {/* model selector */}
          <button className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.05]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lime-300/80 via-emerald-400/70 to-cyan-400/70 text-lg font-bold text-black shadow-lg">
              3.0
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold">{selectedModel}</div>
              <div className="truncate text-xs text-white/50">
                Strengthen consistency, free multi-reference image generation
              </div>
            </div>

            <ChevronDown className="h-4 w-4 text-white/55" />
          </button>

          {/* image reference */}
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Image Reference <span className="text-white/35">(Optional)</span>
              </div>
              <div className="text-xs text-white/45">0/10</div>
            </div>
          </div>

          {/* prompt area */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="You can directly describe the image you want to generate..."
              className="h-[280px] w-full resize-none bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
            />

            <div className="mt-3 flex items-center justify-between">
              <button className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-medium text-lime-400 transition hover:bg-lime-400/15">
                Styles
              </button>

              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/75 hover:bg-white/[0.08]">
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* bottom settings area */}
          <div className="absolute bottom-5 left-5 right-5" ref={panelRef}>
            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.985 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-4 rounded-[28px] border border-white/10 bg-[#1a1d24]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  {/* Mode */}
                  <div className="mb-5">
                    <div className="mb-2 text-xs text-white/55">Mode</div>
                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.03] p-1">
                      {modes.map((item) => (
                        <button
                          key={item}
                          onClick={() => setMode(item)}
                          className={`h-11 rounded-xl text-sm font-medium transition ${
                            mode === item
                              ? "bg-white/14 text-white"
                              : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ratio */}
                  <div className="mb-5">
                    <div className="mb-2 text-xs text-white/55">Ratio</div>
                    <div className="grid grid-cols-5 gap-2">
                      {ratios.map((item) => (
                        <button
                          key={item}
                          onClick={() => setRatio(item)}
                          className={`flex h-12 flex-col items-center justify-center rounded-xl border text-xs transition ${
                            ratio === item
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/8 bg-white/[0.03] text-white/55 hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output */}
                  <div>
                    <div className="mb-2 text-xs text-white/55">Output</div>
                    <div className="grid grid-cols-9 gap-2">
                      {outputs.map((item) => (
                        <button
                          key={item}
                          onClick={() => setOutputCount(item)}
                          className={`h-10 rounded-xl text-sm font-medium transition ${
                            outputCount === item
                              ? "bg-white/14 text-white"
                              : "bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-[#111318] px-4 text-sm text-white/85 transition hover:border-white/20 hover:bg-[#171a20]"
              >
                <Settings2 className="h-4 w-4 text-white/65" />
                <span>
                  {mode} · {ratio} · {outputCount}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/55 transition-transform duration-200 ${
                    settingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button className="h-12 min-w-[150px] rounded-xl bg-lime-400 px-6 text-sm font-semibold text-black transition hover:scale-[1.015] hover:bg-lime-300 active:scale-[0.985]">
                Generate
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PREVIEW / ASSETS */}
        <section className="flex-1 bg-black">
          {/* top notice */}
          <div className="flex h-[52px] items-center justify-between border-b border-white/10 bg-[#17191e] px-6 text-sm">
            <div className="flex items-center gap-2 text-white/85">
              <Bell className="h-4 w-4 text-white/55" />
              <span>Turn on notifications for generation update.</span>
              <button className="font-medium text-lime-400 hover:text-lime-300">
                Allow
              </button>
            </div>
            <button className="text-white/45 hover:text-white">✕</button>
          </div>

          {/* content top filters */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              {["All", "Images", "Videos", "Audio"].map((item, i) => (
                <button
                  key={item}
                  className={`rounded-lg px-4 py-1.5 text-sm transition ${
                    i === 0
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}

              <label className="ml-2 flex items-center gap-2 text-sm text-white/85">
                <input type="checkbox" className="accent-white" />
                Favorites
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]">
                <List className="h-4 w-4" />
              </button>
              <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.06]">
                Assets
              </button>
            </div>
          </div>

          {/* empty state */}
          <div className="flex h-[calc(100vh-106px)] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <ImageIcon className="h-9 w-9 text-white/25" />
              </div>
              <p className="text-base text-white/45">
                Release your creative potential. Experience the magic of Kylor AI.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}