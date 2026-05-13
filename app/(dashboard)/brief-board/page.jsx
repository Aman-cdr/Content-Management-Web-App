"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Lightbulb, Search, CheckCircle2, Archive, Plus, Link, X,
  ChevronRight, MoreVertical, Trash2, Edit3, BookOpen, Hash,
  ArrowRight, Clock, Zap, FileText, Target, Flame,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "creator-cms-briefs";

const STAGES = [
  {
    id: "idea",
    label: "Idea Dump",
    icon: Lightbulb,
    dotColor: "bg-violet-400",
    ringColor: "ring-violet-200",
    textColor: "text-violet-600",
    lightBg: "bg-violet-50",
    countBg: "bg-violet-100 text-violet-700",
    borderAccent: "#7C3AED",
  },
  {
    id: "researching",
    label: "Researching",
    icon: Search,
    dotColor: "bg-blue-400",
    ringColor: "ring-blue-200",
    textColor: "text-blue-600",
    lightBg: "bg-blue-50",
    countBg: "bg-blue-100 text-blue-700",
    borderAccent: "#2563EB",
  },
  {
    id: "ready",
    label: "Ready to Write",
    icon: CheckCircle2,
    dotColor: "bg-emerald-400",
    ringColor: "ring-emerald-200",
    textColor: "text-emerald-600",
    lightBg: "bg-emerald-50",
    countBg: "bg-emerald-100 text-emerald-700",
    borderAccent: "#059669",
  },
  {
    id: "archived",
    label: "Archive",
    icon: Archive,
    dotColor: "bg-neutral-300",
    ringColor: "ring-neutral-200",
    textColor: "text-neutral-500",
    lightBg: "bg-neutral-50",
    countBg: "bg-neutral-200 text-neutral-500",
    borderAccent: "#9CA3AF",
  },
];

const PLATFORM_OPTIONS = ["YouTube", "Instagram", "TikTok", "Twitter", "Podcast", "Newsletter"];

const PLATFORM_STYLES = {
  YouTube:    { bg: "bg-red-500",    text: "text-white" },
  Instagram:  { bg: "bg-pink-500",   text: "text-white" },
  TikTok:     { bg: "bg-neutral-900",text: "text-white" },
  Twitter:    { bg: "bg-sky-500",    text: "text-white" },
  Podcast:    { bg: "bg-violet-500", text: "text-white" },
  Newsletter: { bg: "bg-amber-500",  text: "text-white" },
};

const SEED_BRIEFS = [
  {
    id: "brief-seed-1",
    title: "Why Most Creators Fail in Year 2",
    topic: "Creator Psychology & Burnout",
    stage: "idea",
    platforms: ["YouTube", "Podcast"],
    hooks: [
      "Year 2 is where the real test begins — not year 1",
      "The #1 reason 90% of creators quit has nothing to do with content quality",
      "I almost quit at 18 months. Here's what saved me.",
    ],
    references: [{ label: "Creator Burnout Study 2024", url: "https://example.com/burnout-study" }],
    notes: "Personal story angle. Reference stats from Creator Economy report.",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "brief-seed-2",
    title: "I Tried 7 AI Writing Tools So You Don't Have To",
    topic: "AI Tools Comparison",
    stage: "idea",
    platforms: ["YouTube", "Newsletter"],
    hooks: [
      "After 30 days and $200 spent, here's the honest verdict",
      "Most AI writing tools are just ChatGPT wrappers — but not all",
    ],
    references: [],
    notes: "Do a side-by-side table. Include pricing in 2025.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "brief-seed-3",
    title: "My Complete Editing Workflow (DaVinci 2025)",
    topic: "Video Editing Process",
    stage: "researching",
    platforms: ["YouTube", "TikTok"],
    hooks: [
      "I cut my editing time from 6 hours to 90 minutes",
      "The exact timeline structure I use for every video",
      "Why I switched from Premiere and never looked back",
    ],
    references: [
      { label: "DaVinci 2025 Release Notes", url: "https://blackmagicdesign.com/resolve" },
    ],
    notes: "Screen record the full edit of a real video. Show the project panel.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "brief-seed-4",
    title: "Tool I Use Daily for Content Planning",
    topic: "Productivity & Content Systems",
    stage: "researching",
    platforms: ["YouTube", "Instagram", "Newsletter"],
    hooks: [
      "One tool replaced my entire Notion setup",
      "How I plan 30 days of content in one Sunday afternoon",
      "Stop winging it: build a content system that works while you sleep",
    ],
    references: [{ label: "Notion vs Linear for creators", url: "https://example.com/notion-linear" }],
    notes: "Could sponsor this video. Check rates first.",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "brief-seed-5",
    title: "How I Grew to 100K Without Going Viral",
    topic: "Channel Growth Strategy",
    stage: "ready",
    platforms: ["YouTube", "Twitter"],
    hooks: [
      "No viral moment. No lucky break. Just this repeatable system.",
      "100K subscribers — zero videos over 100K views. Here's how.",
    ],
    references: [
      { label: "Channel Analytics Screenshot", url: "https://example.com/analytics" },
      { label: "Growth Framework Doc", url: "https://example.com/growth" },
    ],
    notes: "Script is 80% done. Need to finalize the CTR section.",
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "brief-seed-6",
    title: "My 2024 Creator Income Breakdown",
    topic: "Creator Business & Monetization",
    stage: "archived",
    platforms: ["YouTube", "Newsletter"],
    hooks: ["Here's every dollar I made as a creator in 2024", "6 income streams, ranked from best to worst"],
    references: [{ label: "Creator Economy Report 2024", url: "https://example.com/economy-report" }],
    notes: "Published Jan 2025. Repurpose for 2025 income breakdown.",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); }
  catch { return "recently"; }
}

function generateId() {
  return `brief-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const STAGE_ORDER = ["idea", "researching", "ready", "archived"];
const nextStage = (s) => { const i = STAGE_ORDER.indexOf(s); return i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null; };
const prevStage = (s) => { const i = STAGE_ORDER.indexOf(s); return i > 0 ? STAGE_ORDER[i - 1] : null; };

const BLANK_FORM = { title: "", topic: "", platforms: [], hooks: "", notes: "", references: [] };

// ─── Platform Pill ─────────────────────────────────────────────────────────────

function PlatformPill({ platform }) {
  const s = PLATFORM_STYLES[platform] || { bg: "bg-neutral-500", text: "text-white" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${s.bg} ${s.text}`}>
      {platform}
    </span>
  );
}

// ─── Card Context Menu ─────────────────────────────────────────────────────────

function CardMenu({ brief, onEdit, onArchive, onDelete, onMoveBack }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(p => !p)} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-black/5 transition-colors">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-8 z-50 w-44 bg-white rounded-xl shadow-xl border border-black/[0.07] py-1.5 overflow-hidden"
          >
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-neutral-400" /> Edit brief
            </button>
            {brief.stage !== "archived" && (
              <button onClick={() => { onArchive(); setOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Archive className="w-3.5 h-3.5 text-neutral-400" /> Archive
              </button>
            )}
            {prevStage(brief.stage) && (
              <button onClick={() => { onMoveBack(); setOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 rotate-180 text-neutral-400" /> Move back
              </button>
            )}
            <div className="my-1 h-px bg-neutral-100" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Brief Card ───────────────────────────────────────────────────────────────

function BriefCard({ brief, stageInfo, onEdit, onDelete, onAdvance, onMoveBack, onArchive }) {
  const next = nextStage(brief.stage);
  const nextInfo = next ? STAGES.find(s => s.id === next) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-white rounded-2xl border border-[#EAECF0] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Top accent line */}
      <div className="h-[3px] w-full" style={{ backgroundColor: stageInfo.borderAccent, opacity: 0.6 }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-[13.5px] font-[650] text-[#0F0F0F] leading-snug flex-1 line-clamp-2 group-hover:text-[var(--t-primary)] transition-colors">
            {brief.title}
          </h3>
          <CardMenu
            brief={brief}
            onEdit={() => onEdit(brief)}
            onArchive={() => onArchive(brief.id)}
            onDelete={() => onDelete(brief.id)}
            onMoveBack={() => onMoveBack(brief.id)}
          />
        </div>

        {/* Topic */}
        {brief.topic && (
          <div className="flex items-center gap-1.5 mb-3">
            <Hash className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            <span className="text-[11.5px] text-neutral-500 font-medium truncate">{brief.topic}</span>
          </div>
        )}

        {/* Platforms */}
        {brief.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {brief.platforms.map(p => <PlatformPill key={p} platform={p} />)}
          </div>
        )}

        {/* Notes */}
        {brief.notes && (
          <p className="text-[11.5px] text-neutral-400 line-clamp-2 mb-3 leading-relaxed">{brief.notes}</p>
        )}

        {/* Meta footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#F4F5F8]">
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
            <Flame className="w-3 h-3 text-orange-400" />
            {brief.hooks.length} hooks
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium">
            <Link className="w-3 h-3 text-blue-400" />
            {brief.references.length} refs
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 ml-auto">
            <Clock className="w-3 h-3" />
            {timeAgo(brief.createdAt)}
          </span>
        </div>
      </div>

      {/* Advance button */}
      {brief.stage !== "archived" && nextInfo && (
        <button
          onClick={() => onAdvance(brief.id)}
          className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-semibold py-2.5 transition-all border-t border-[#F4F5F8] text-neutral-500 hover:text-[var(--t-primary)] hover:bg-[var(--t-primary-light)]"
        >
          <ArrowRight className="w-3 h-3" />
          Move to {nextInfo.label}
        </button>
      )}
    </motion.div>
  );
}

// ─── Stage Column ─────────────────────────────────────────────────────────────

function StageColumn({ stage, briefs, onEdit, onDelete, onAdvance, onMoveBack, onArchive }) {
  const Icon = stage.icon;
  return (
    <div className="flex flex-col min-h-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${stage.lightBg} flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 ${stage.textColor}`} />
          </div>
          <span className="text-[13px] font-[700] text-[#1A1A2E] tracking-tight">{stage.label}</span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${stage.countBg}`}>
          {briefs.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1">
        <AnimatePresence mode="popLayout">
          {briefs.map(brief => (
            <BriefCard
              key={brief.id}
              brief={brief}
              stageInfo={stage}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdvance={onAdvance}
              onMoveBack={onMoveBack}
              onArchive={onArchive}
            />
          ))}
        </AnimatePresence>
        {briefs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[#EAECF0] text-neutral-300">
            <Icon className="w-7 h-7 mb-2" />
            <p className="text-[11.5px] font-medium">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slide-in Panel ───────────────────────────────────────────────────────────

function BriefPanel({ brief, onClose, onSave }) {
  const isEditing = !!brief;
  const [form, setForm] = useState(
    isEditing
      ? { title: brief.title, topic: brief.topic, platforms: [...brief.platforms], hooks: brief.hooks.join("\n"), notes: brief.notes, references: brief.references.map(r => ({ ...r })) }
      : { ...BLANK_FORM, references: [] }
  );

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const togglePlatform = (p) => setForm(prev => ({
    ...prev,
    platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p],
  }));
  const addRef = () => setField("references", [...form.references, { label: "", url: "" }]);
  const removeRef = (i) => setField("references", form.references.filter((_, idx) => idx !== i));
  const updateRef = (i, key, val) => setField("references", form.references.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const handleSave = () => {
    if (!form.title.trim()) return;
    const hooks = form.hooks.split("\n").map(h => h.trim()).filter(Boolean);
    const references = form.references.filter(r => r.label.trim() || r.url.trim());
    onSave({
      id: isEditing ? brief.id : generateId(),
      title: form.title.trim(),
      topic: form.topic.trim(),
      stage: isEditing ? brief.stage : "idea",
      platforms: form.platforms,
      hooks, references,
      notes: form.notes.trim(),
      createdAt: isEditing ? brief.createdAt : new Date().toISOString(),
    });
    onClose();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--t-primary), var(--t-secondary))" }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-neutral-800">{isEditing ? "Edit Brief" : "New Brief"}</h2>
              <p className="text-[11px] text-neutral-400">{isEditing ? "Update your research brief" : "Capture your idea before it vanishes"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Title <span className="text-red-400 normal-case">*</span></label>
            <input
              type="text" value={form.title} onChange={e => setField("title", e.target.value)}
              placeholder="e.g. Why Most Creators Fail in Year 2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4E9] text-[13.5px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] focus:ring-2 focus:ring-[var(--t-primary-light)] transition"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Topic</label>
            <input
              type="text" value={form.topic} onChange={e => setField("topic", e.target.value)}
              placeholder="e.g. Creator Psychology & Burnout"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4E9] text-[13.5px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] focus:ring-2 focus:ring-[var(--t-primary-light)] transition"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => {
                const sel = form.platforms.includes(p);
                const s = PLATFORM_STYLES[p] || {};
                return (
                  <button
                    key={p} type="button" onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                      sel ? `${s.bg} ${s.text} border-transparent shadow-sm` : "bg-white text-neutral-500 border-[#E2E4E9] hover:border-neutral-300"
                    }`}
                  >{p}</button>
                );
              })}
            </div>
          </div>

          {/* Hooks */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Hooks <span className="normal-case font-normal text-neutral-400">(one per line)</span>
            </label>
            <textarea
              value={form.hooks} onChange={e => setField("hooks", e.target.value)}
              placeholder={"Hook 1\nHook 2\nHook 3"}
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4E9] text-[13px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] focus:ring-2 focus:ring-[var(--t-primary-light)] transition resize-none font-mono"
            />
          </div>

          {/* References */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest">References</label>
              <button type="button" onClick={addRef} className="text-[12px] font-semibold flex items-center gap-1 transition-colors" style={{ color: "var(--t-primary)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {form.references.map((ref, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" value={ref.label} onChange={e => updateRef(i, "label", e.target.value)} placeholder="Label"
                    className="flex-[2] px-3 py-2 rounded-lg border border-[#E2E4E9] text-[12px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] transition" />
                  <input type="url" value={ref.url} onChange={e => updateRef(i, "url", e.target.value)} placeholder="https://..."
                    className="flex-[3] px-3 py-2 rounded-lg border border-[#E2E4E9] text-[12px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] transition" />
                  <button type="button" onClick={() => removeRef(i)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {form.references.length === 0 && <p className="text-[12px] text-neutral-400">No references yet.</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea
              value={form.notes} onChange={e => setField("notes", e.target.value)}
              placeholder="Any additional thoughts, reminders, or ideas..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E4E9] text-[13px] text-neutral-800 placeholder:text-neutral-300 focus:outline-none focus:border-[var(--t-primary)] focus:ring-2 focus:ring-[var(--t-primary-light)] transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#E2E4E9] text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={!form.title.trim()}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm btn-primary"
          >
            {isEditing ? "Save Changes" : "Create Brief"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BriefBoardPage() {
  const [briefs, setBriefs] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setBriefs(stored ? JSON.parse(stored) : SEED_BRIEFS);
      if (!stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_BRIEFS));
    } catch { setBriefs(SEED_BRIEFS); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs)); } catch {}
  }, [briefs, hydrated]);

  const updateBriefs = useCallback((updater) => setBriefs(prev => typeof updater === "function" ? updater(prev) : updater), []);

  const handleSave = useCallback((brief) => {
    updateBriefs(prev => {
      const idx = prev.findIndex(b => b.id === brief.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = brief; return next; }
      return [brief, ...prev];
    });
  }, [updateBriefs]);

  const handleDelete = useCallback((id) => updateBriefs(prev => prev.filter(b => b.id !== id)), [updateBriefs]);

  const handleAdvance = useCallback((id) => updateBriefs(prev =>
    prev.map(b => { if (b.id !== id) return b; const n = nextStage(b.stage); return n ? { ...b, stage: n } : b; })
  ), [updateBriefs]);

  const handleMoveBack = useCallback((id) => updateBriefs(prev =>
    prev.map(b => { if (b.id !== id) return b; const p = prevStage(b.stage); return p ? { ...b, stage: p } : b; })
  ), [updateBriefs]);

  const handleArchive = useCallback((id) => updateBriefs(prev =>
    prev.map(b => b.id === id ? { ...b, stage: "archived" } : b)
  ), [updateBriefs]);

  const openNew = () => { setEditingBrief(null); setPanelOpen(true); };
  const openEdit = (brief) => { setEditingBrief(brief); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditingBrief(null); };

  const totalBriefs = briefs.filter(b => b.stage !== "archived").length;
  const inResearch = briefs.filter(b => b.stage === "researching").length;
  const readyToWrite = briefs.filter(b => b.stage === "ready").length;
  const briefsByStage = (sid) => briefs.filter(b => b.stage === sid);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-[800] text-[var(--t-text)] tracking-tight">Brief Board</h2>
          <p className="text-[var(--t-text-3)] text-[13px] mt-0.5">Validate ideas before you write. Move briefs through research stages.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-[13px] font-[600] rounded-xl transition-all hover:brightness-110 active:scale-95 shrink-0 btn-primary"
        >
          <Plus className="w-4 h-4" /> New Brief
        </button>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Briefs", val: totalBriefs, icon: Target, color: "text-[var(--t-primary)]", bg: "bg-[var(--t-primary-light)]" },
          { label: "In Research", val: inResearch, icon: Search, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ready to Write", val: readyToWrite, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#EAECF0] px-5 py-4 flex items-center gap-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
              <p className={`text-[28px] font-[800] leading-none ${s.color}`}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── STAGE COLUMNS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {STAGES.map(stage => (
          <StageColumn
            key={stage.id}
            stage={stage}
            briefs={briefsByStage(stage.id)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdvance={handleAdvance}
            onMoveBack={handleMoveBack}
            onArchive={handleArchive}
          />
        ))}
      </div>

      {/* ── PANEL ── */}
      <AnimatePresence>
        {panelOpen && (
          <BriefPanel brief={editingBrief} onClose={closePanel} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
