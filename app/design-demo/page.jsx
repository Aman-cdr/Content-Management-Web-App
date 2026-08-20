"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ArrowUpRight,
  Sparkles,
  Wand2,
  CalendarClock,
  BarChart3,
  Share2,
  PlayCircle,
} from "lucide-react";

const EASE = [0.32, 0.72, 0, 1];

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 64, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MagneticButton({ children, variant = "primary", className = "" }) {
  const base =
    "group relative inline-flex items-center gap-1 rounded-full pl-6 pr-1.5 py-1.5 font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:shadow-[0_0_40px_-6px_rgba(255,255,255,0.35)]"
      : "bg-white/5 text-white ring-1 ring-white/15 hover:bg-white/10";
  return (
    <button className={`${base} ${styles} ${className}`}>
      <span className="text-[13px] tracking-wide">{children}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-black/20">
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
      </span>
    </button>
  );
}

function DoubleBezel({ children, className = "" }) {
  return (
    <div className={`rounded-[2rem] bg-white/[0.04] p-2 ring-1 ring-white/[0.06] ${className}`}>
      <div className="h-full rounded-[calc(2rem-0.5rem)] bg-[#0A0A10] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.04]">
        {children}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Wand2,
    tag: "AI Scripting",
    title: "Draft full episode scripts in one pass",
    desc: "Feed a topic and tone. Get a structured, edit-ready script with beats, hooks, and pacing already built in.",
    span: "md:col-span-8 md:row-span-2",
  },
  {
    icon: CalendarClock,
    tag: "Scheduler",
    title: "Queue a month in one sitting",
    desc: "Drag, drop, done.",
    span: "md:col-span-4",
  },
  {
    icon: Share2,
    tag: "Publish",
    title: "One click, every platform",
    desc: "YouTube, Shorts, and beyond — synced.",
    span: "md:col-span-4",
  },
  {
    icon: BarChart3,
    tag: "Analytics",
    title: "Know what's actually working",
    desc: "Retention, revenue, and reach in a single glass pane — no exporting to spreadsheets, no lag.",
    span: "md:col-span-8",
  },
];

const STATS = [
  { value: "2.4M+", label: "Videos scheduled" },
  { value: "98.7%", label: "Publish reliability" },
  { value: "6hrs", label: "Saved per week" },
  { value: "40+", label: "Platforms synced" },
];

export default function DesignDemoPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = ["Product", "Workflow", "Pricing", "Docs"];

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden bg-[#050505] text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Fixed ambient mesh — never on a scrolling container */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-indigo-500/25 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-500/15 blur-[140px]" />
      </div>

      {/* ── Fluid Island Nav ── */}
      <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <nav className="flex w-full max-w-2xl items-center justify-between rounded-full border border-white/10 bg-black/60 px-5 py-2.5 backdrop-blur-2xl">
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Creator CMS
          </span>
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a
                key={l}
                href="#"
                className="text-[13px] text-white/60 transition-colors duration-500 hover:text-white"
              >
                {l}
              </a>
            ))}
          </div>
          <div className="hidden md:block">
            <MagneticButton>Sign in</MagneticButton>
          </div>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative h-8 w-8 md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                menuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute left-1/2 top-1/2 h-[1.5px] w-5 -translate-x-1/2 bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                menuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </nav>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/85 backdrop-blur-3xl transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {navLinks.map((l, i) => (
          <a
            key={l}
            href="#"
            className={`text-2xl font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? `${100 + i * 60}ms` : "0ms" }}
          >
            {l}
          </a>
        ))}
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-40">
        {/* ── Hero ── */}
        <section className="flex min-h-[100dvh] flex-col items-center justify-center pt-24 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              AI-Powered Content OS
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1
              className="mt-8 max-w-3xl text-[13vw] leading-[0.95] font-medium tracking-tight md:text-[5.5rem]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ship content like
              <span className="block bg-gradient-to-br from-indigo-300 via-white to-emerald-200 bg-clip-text text-transparent">
                a studio of one.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 max-w-lg text-balance text-[15px] leading-relaxed text-white/50">
              Script, schedule, publish, and analyze every piece of content from a single
              command center — built for creators who move faster than their tools.
            </p>
          </Reveal>

          <Reveal delay={0.3} className="mt-10 flex items-center gap-3">
            <MagneticButton>Start free trial</MagneticButton>
            <button className="group flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium text-white/70 transition-colors duration-500 hover:text-white">
              <PlayCircle className="h-4 w-4" strokeWidth={1.25} />
              Watch demo
            </button>
          </Reveal>
        </section>

        {/* ── Asymmetrical Bento — Feature grid ── */}
        <section className="pt-16">
          <Reveal>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
              The workflow
            </span>
            <h2
              className="mt-3 text-3xl font-medium tracking-tight md:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Every stage, one surface.
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 md:auto-rows-[9.5rem] md:grid-cols-12">
            {FEATURES.map((f, i) => (
              <Reveal key={f.tag} delay={0.08 * i} className={f.span}>
                <DoubleBezel className="h-full">
                  <div className="flex h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                        <f.icon className="h-4 w-4 text-white/70" strokeWidth={1.25} />
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                        {f.tag}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium tracking-tight text-white/90">
                        {f.title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-white/45">{f.desc}</p>
                    </div>
                  </div>
                </DoubleBezel>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="mt-24 grid grid-cols-2 gap-6 border-y border-white/[0.06] py-12 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={0.06 * i} className="text-center">
              <div
                className="text-3xl font-medium tracking-tight md:text-4xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[12px] text-white/40">{s.label}</div>
            </Reveal>
          ))}
        </section>

        {/* ── CTA ── */}
        <section className="pt-24">
          <Reveal>
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-8 py-20 text-center">
              <h2
                className="mx-auto max-w-md text-3xl font-medium tracking-tight md:text-4xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Your next upload starts here.
              </h2>
              <div className="mt-8 flex justify-center">
                <MagneticButton>Get started free</MagneticButton>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
