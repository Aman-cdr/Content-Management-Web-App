"use client";

import {
  BookOpen, Terminal, Code2, Shield, Rocket, Bug, Server,
  Database, Zap, Palette, Network, GitBranch, Package,
  Layers, Users, Lightbulb, Video, Target, FileText, Play,
} from "lucide-react";

const TOPIC_MAP = [
  { keys: ["intro", "introduction", "overview", "welcome", "start", "begin", "what is"], Icon: BookOpen, from: "#0f172a", to: "#1e293b", accent: "#38bdf8" },
  { keys: ["setup", "install", "environment", "configure", "init", "scaffold"], Icon: Terminal, from: "#0c1a0c", to: "#14261e", accent: "#4ade80" },
  { keys: ["component", "react", "jsx", "hook", "state", "props", "context", "redux"], Icon: Code2, from: "#0d1117", to: "#161b22", accent: "#58a6ff" },
  { keys: ["javascript", "js", "typescript", "ts", "es6", "async", "promise", "closure"], Icon: Code2, from: "#1a1200", to: "#2e2000", accent: "#fbbf24" },
  { keys: ["security", "auth", "authentication", "authorization", "jwt", "oauth", "token"], Icon: Shield, from: "#1a0a0a", to: "#2e1010", accent: "#f87171" },
  { keys: ["deploy", "production", "hosting", "vercel", "aws", "cloud", "ci", "cd"], Icon: Rocket, from: "#0a0a1f", to: "#12124a", accent: "#a78bfa" },
  { keys: ["debug", "error", "fix", "bug", "test", "testing", "jest", "unit", "e2e"], Icon: Bug, from: "#150a1a", to: "#260d33", accent: "#f0abfc" },
  { keys: ["api", "rest", "graphql", "endpoint", "fetch", "axios", "request"], Icon: Network, from: "#001a2e", to: "#002e4a", accent: "#38bdf8" },
  { keys: ["database", "db", "sql", "mongodb", "prisma", "orm", "query", "schema"], Icon: Database, from: "#0a1a12", to: "#102e1e", accent: "#34d399" },
  { keys: ["performance", "optimize", "speed", "cache", "lazy", "bundle"], Icon: Zap, from: "#1a1200", to: "#332500", accent: "#fcd34d" },
  { keys: ["design", "ui", "ux", "css", "style", "tailwind", "animation", "layout"], Icon: Palette, from: "#1a0a1a", to: "#2e1533", accent: "#e879f9" },
  { keys: ["backend", "server", "node", "express", "next", "middleware", "route"], Icon: Server, from: "#0a1a1a", to: "#0d2e2e", accent: "#2dd4bf" },
  { keys: ["git", "github", "version", "branch", "merge", "commit", "pull", "push"], Icon: GitBranch, from: "#0a0f1a", to: "#121b2e", accent: "#60a5fa" },
  { keys: ["package", "npm", "yarn", "dependency", "module", "library"], Icon: Package, from: "#1a1000", to: "#2e1c00", accent: "#fb923c" },
  { keys: ["project", "build", "app", "application", "feature", "implement"], Icon: Layers, from: "#0f0a1a", to: "#1a1230", accent: "#818cf8" },
  { keys: ["user", "profile", "account", "role", "permission", "dashboard"], Icon: Users, from: "#001a0a", to: "#002e14", accent: "#4ade80" },
  { keys: ["tips", "trick", "mistake", "common", "wrong", "best", "practice", "pattern"], Icon: Lightbulb, from: "#1a1500", to: "#2e2500", accent: "#fde68a" },
  { keys: ["launch", "ship", "release", "final", "complete", "done", "finish", "mastery"], Icon: Rocket, from: "#0a0014", to: "#140026", accent: "#c084fc" },
  { keys: ["video", "record", "screen", "shorts", "youtube", "content", "creator"], Icon: Video, from: "#1a0000", to: "#2e0800", accent: "#fc6b6b" },
  { keys: ["goal", "plan", "roadmap", "strategy", "next", "future", "advanced"], Icon: Target, from: "#001a14", to: "#002e22", accent: "#2dd4bf" },
];

const DEFAULT_TOPIC = { Icon: FileText, from: "#111827", to: "#1f2937", accent: "#9ca3af" };

export function getTopic(title) {
  const t = (title || "").toLowerCase();
  for (const topic of TOPIC_MAP) {
    if (topic.keys.some(k => t.includes(k))) return topic;
  }
  return DEFAULT_TOPIC;
}

/**
 * props:
 *   title      – episode or series title (drives icon + color)
 *   epNumber   – shown as "EP X" badge (pass null to hide)
 *   duration   – optional duration string
 *   idx        – used for deterministic accent variation when topic matches multiple
 *   size       – "sm" | "md" | "lg" | "full" (full = fills parent, no fixed width)
 *   rounded    – tailwind rounded class, default "rounded-xl"
 *   showFace   – show creator face bubble (default true)
 *   showPlay   – show play button on hover (default true)
 */
export default function EpisodeThumbnail({
  title = "",
  epNumber,
  duration,
  size = "md",
  rounded = "rounded-xl",
  showFace = true,
  showPlay = true,
}) {
  const { Icon, from, to, accent } = getTopic(title);

  const widthClass = size === "full" ? "w-full" : size === "lg" ? "w-[160px]" : size === "sm" ? "w-[80px]" : "w-[120px]";
  const iconSize = size === "lg" || size === "full" ? 80 : size === "sm" ? 36 : 56;
  const faceSize = size === "lg" || size === "full" ? 40 : size === "sm" ? 20 : 30;
  const titleFontSize = size === "lg" || size === "full" ? "11px" : "9px";
  const subFontSize = "8px";

  const words = title.replace(/[—–-]/g, " ").split(/\s+/).filter(Boolean);
  const half = Math.ceil(Math.min(words.length, 6) / 2);
  const line1 = words.slice(0, half).join(" ");
  const line2 = words.slice(half, half + 3).join(" ");

  return (
    <div
      className={`${widthClass} aspect-video ${rounded} flex-shrink-0 relative overflow-hidden group/thumb select-none`}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
    >
      {/* Dot grid texture */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `radial-gradient(${accent} 1px, transparent 1px)`,
        backgroundSize: "14px 14px",
      }} />

      {/* Ghost icon */}
      <div className="absolute -right-3 -bottom-3 opacity-[0.13]">
        <Icon style={{ width: iconSize, height: iconSize, color: accent }} strokeWidth={1.5} />
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[2.5px]" style={{ background: `linear-gradient(90deg, ${accent}ee, transparent)` }} />

      {/* EP badge */}
      {epNumber != null && (
        <div
          className="absolute top-1.5 left-1.5 text-[8px] font-black px-1.5 py-[3px] rounded-full leading-none"
          style={{ background: `${accent}28`, color: accent, border: `1px solid ${accent}55` }}
        >
          EP {epNumber}
        </div>
      )}

      {/* Title lines */}
      {size !== "sm" && (
        <div className="absolute left-2 right-2" style={{ bottom: showFace ? faceSize * 0.6 + 10 : 6 }}>
          <p className="text-white font-black leading-tight drop-shadow" style={{ fontSize: titleFontSize }}>
            {line1}
          </p>
          {line2 && (
            <p className="font-bold leading-tight mt-px opacity-80" style={{ fontSize: subFontSize, color: accent }}>
              {line2}
            </p>
          )}
        </div>
      )}

      {/* Creator face */}
      {showFace && size !== "sm" && (
        <div
          className="absolute overflow-hidden rounded-full border border-white/20"
          style={{
            bottom: 5,
            right: 5,
            width: faceSize,
            height: faceSize,
            boxShadow: `0 0 0 2px ${accent}77, 0 2px 8px rgba(0,0,0,0.7)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/creator-face.jpg" alt="Creator" className="w-full h-full object-cover object-top" draggable={false} />
        </div>
      )}

      {/* Duration */}
      {duration && (
        <div className="absolute bottom-1.5 left-2 text-[8px] font-black px-1.5 py-px rounded-full bg-black/70 text-white/90 leading-none">
          {duration}
        </div>
      )}

      {/* Play hover */}
      {showPlay && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 bg-black/40">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-xl" style={{ background: accent }}>
            <Play className="w-4 h-4 fill-white text-white ml-0.5" strokeWidth={1.5} />
          </div>
        </div>
      )}
    </div>
  );
}
