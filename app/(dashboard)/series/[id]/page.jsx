"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Edit3, GripVertical, Plus, Clock,
  Play, Trash2, Calendar, ChevronRight,
  Sparkles, Wand2, RotateCcw, Check, X, AlertCircle, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSeries } from "@/context/SeriesContext";
import EpisodeThumbnail from "@/app/components/EpisodeThumbnail";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Draft:     { color: "bg-neutral-100 text-neutral-500 border-neutral-200", hex: "#9CA3AF" },
  Scripted:  { color: "bg-blue-50 text-blue-600 border-blue-100",           hex: "#6366F1" },
  Filmed:    { color: "bg-amber-50 text-amber-600 border-amber-100",        hex: "#F59E0B" },
  Edited:    { color: "bg-orange-50 text-orange-600 border-orange-100",     hex: "#F97316" },
  Published: { color: "bg-emerald-50 text-emerald-600 border-emerald-100",  hex: "#10B981" },
};

// ─── Rotating loading messages ────────────────────────────────────────────────

const LOADING_MSGS = [
  "Analyzing your series topic…",
  "Understanding your audience…",
  "Planning episode structure…",
  "Crafting compelling titles…",
  "Estimating watch durations…",
  "Balancing beginner & advanced content…",
  "Sequencing for maximum retention…",
  "Adding hooks and cliffhangers…",
  "Finalizing your content plan…",
  "Almost there…",
];

function RotatingMessage({ active }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MSGS.length), 2200);
    return () => clearInterval(t);
  }, [active]);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="text-[12px] font-semibold text-neutral-500"
      >
        {LOADING_MSGS[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

// ─── Inline AI Generator ──────────────────────────────────────────────────────

function AIGeneratorSection({ series, onApply, onClose }) {
  const [step, setStep] = useState("idle"); // idle | generating | review | applying | done
  const [count, setCount] = useState(Math.min(series?.episodes || 10, 30));
  const [prompt, setPrompt] = useState("");
  const [aiEpisodes, setAiEpisodes] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const episodesRef = useRef([]);

  const generate = async () => {
    setStep("generating");
    setAiEpisodes([]);
    episodesRef.current = [];
    setError("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      console.log("🎬 [AI Generate] Sending request to /api/generate-episodes");
      const res = await fetch("/api/generate-episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesName: series.name,
          seriesType: series.type || "Course",
          seriesDescription: prompt || series.description || "",
          count,
        }),
        signal: ctrl.signal,
      });

      console.log("📡 [AI Generate] Response status:", res.status);
      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ep = JSON.parse(line);
            if (ep.error) { console.error("❌ [AI Generate] Error:", ep.error); setError(ep.error); break; }
            console.log(`📺 [AI Generate] Episode ${ep.ep}:`, ep.title);
            episodesRef.current = [...episodesRef.current, ep];
            setAiEpisodes([...episodesRef.current]);
          } catch {}
        }
      }
      console.log("✅ [AI Generate] Done. Total:", episodesRef.current.length);
      setStep("review");
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to connect to Groq. Check your GROQ_API_KEY in .env.local");
        setStep("idle");
      }
    }
  };

  const handleApply = async () => {
    setStep("applying");
    await onApply(aiEpisodes);
    setStep("done");
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setAiEpisodes(prev => prev.map((e, i) => i === editingIdx ? { ...e, title: editVal } : e));
    setEditingIdx(null);
  };

  const cancelGenerate = () => {
    abortRef.current?.abort();
    setStep("idle");
    setAiEpisodes([]);
  };

  const remaining = Math.max(0, count - aiEpisodes.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
      className="mb-6 rounded-2xl overflow-hidden border border-[#E2E4E9] shadow-sm"
    >
      {/* Banner header */}
      <div className="relative px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, var(--t-primary) 0%, var(--t-secondary) 100%)" }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-[800] text-white leading-none">AI Episode Generator</h3>
            <p className="text-[11px] text-white/60 mt-0.5">Powered by Groq · GPT-OSS 120B · max 30 episodes</p>
          </div>
        </div>
        <button onClick={onClose} className="relative p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Config row */}
      {(step === "idle" || step === "review") && (
        <div className="px-6 py-4 bg-white border-b border-[#F4F5F8]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-3 py-2 shrink-0">
                <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Eps</span>
                <input
                  type="number" min={1} max={30} value={count}
                  onChange={e => setCount(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                  className="w-10 bg-transparent text-[13px] font-black text-center outline-none text-[#0F0F0F]"
                />
                <span className="text-[10px] text-neutral-300">/30</span>
              </div>
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Optional: describe your content angle or audience…"
                className="flex-1 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[var(--t-primary)] transition placeholder:text-neutral-300"
              />
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-[700] transition-all hover:brightness-110 active:scale-95 btn-primary whitespace-nowrap"
            >
              <Wand2 className="w-4 h-4" />
              {step === "review" ? "Regenerate" : "Generate Episodes"}
            </button>
          </div>
          {error && <p className="mt-2 text-[11px] text-red-500 font-medium">{error}</p>}
        </div>
      )}

      {/* Generating — rotating message + progress */}
      {step === "generating" && aiEpisodes.length === 0 && (
        <div className="bg-white px-6 py-10 flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#F4F5F8" strokeWidth="4" />
              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="4" stroke="url(#aiGrad)"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * 0.75}
                strokeLinecap="round"
                className="animate-spin origin-center"
                style={{ animationDuration: "1.2s" }}
              />
              <defs>
                <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--t-primary)" />
                  <stop offset="100%" stopColor="var(--t-secondary)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5" style={{ color: "var(--t-primary)" }} />
            </div>
          </div>
          <div className="text-center">
            <RotatingMessage active={step === "generating"} />
            <p className="text-[11px] text-neutral-300 mt-1">This usually takes 5–10 seconds</p>
          </div>
          <button onClick={cancelGenerate} className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors border border-[#E2E4E9] px-3 py-1.5 rounded-lg">
            Cancel
          </button>
        </div>
      )}

      {/* Episodes grid — streaming in + skeletons */}
      {(step === "generating" && aiEpisodes.length > 0) || step === "review" || step === "applying" ? (
        <div className="bg-white px-6 py-4">

          {/* Status bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {step === "generating" && (
                <>
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--t-primary)", animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <RotatingMessage active />
                  <span className="text-[11px] text-neutral-300">· <span style={{ color: "var(--t-primary)" }} className="font-bold">{aiEpisodes.length}</span>/{count}</span>
                  <button onClick={cancelGenerate} className="ml-2 text-[11px] text-neutral-400 hover:text-red-500 transition-colors">Cancel</button>
                </>
              )}
              {step === "review" && (
                <>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-[13px] font-[700] text-[#111318]">{aiEpisodes.length} episodes ready</span>
                  <span className="text-[11px] text-neutral-400">· click any title to edit</span>
                </>
              )}
              {step === "applying" && (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" style={{ color: "var(--t-primary)" }} />
                  <span className="text-[12px] font-semibold text-neutral-400">Saving {aiEpisodes.length} episodes…</span>
                </>
              )}
            </div>
            {step === "review" && (
              <div className="flex items-center gap-2">
                <button onClick={generate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E4E9] text-[12px] font-semibold text-neutral-500 hover:bg-neutral-50 transition">
                  <RotateCcw className="w-3 h-3" /> Regenerate
                </button>
                <button onClick={handleApply} className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-[12px] font-[700] btn-primary transition-all hover:brightness-110">
                  <Zap className="w-3.5 h-3.5" /> Apply to Series
                </button>
              </div>
            )}
          </div>

          {/* Progress bar while streaming */}
          {step === "generating" && (
            <div className="w-full h-1 bg-[#F4F5F8] rounded-full mb-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--t-primary), var(--t-secondary))" }}
                animate={{ width: `${Math.round((aiEpisodes.length / count) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Episode cards */}
          <div className="space-y-2">
            {aiEpisodes.map((ep, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-4 bg-white border border-[#EAECF0] rounded-2xl p-3 hover:border-[var(--t-primary)] hover:shadow-md transition-all cursor-pointer"
                onClick={() => { if (editingIdx !== idx) { setEditingIdx(idx); setEditVal(ep.title); } }}
              >
                <span className="text-[11px] font-black text-neutral-300 w-5 text-center shrink-0">{ep.ep}</span>
                <EpisodeThumbnail epNumber={ep.ep} title={ep.title} duration={ep.duration} idx={idx} size="md" />
                <div className="flex-1 min-w-0">
                  {editingIdx === idx ? (
                    <input
                      autoFocus value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={e => { e.stopPropagation(); saveEdit(); }}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") saveEdit(); }}
                      onClick={e => e.stopPropagation()}
                      className="w-full text-[14px] font-[700] border-b-2 border-[var(--t-primary)] bg-transparent outline-none pb-1"
                    />
                  ) : (
                    <h4 className="text-[14px] font-[700] text-[#0F0F0F] line-clamp-2 group-hover:text-[var(--t-primary)] transition-colors leading-snug">
                      {ep.title}
                    </h4>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-neutral-400"><Clock className="w-3 h-3" />{ep.duration}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 font-black uppercase tracking-widest">Draft</span>
                    <span className="text-[10px] text-neutral-300 italic">click to edit title</span>
                  </div>
                </div>
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-neutral-50 group-hover:bg-[var(--t-primary-light)] transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[var(--t-primary)] transition-colors" />
                </div>
              </motion.div>
            ))}

            {/* Skeleton rows */}
            {step === "generating" && Array.from({ length: remaining }, (_, i) => (
              <div key={`sk-${i}`} className="flex items-center gap-4 bg-white border border-[#EAECF0] rounded-2xl p-3 animate-pulse">
                <div className="w-5 h-3 bg-neutral-100 rounded shrink-0" />
                <div className="w-[120px] aspect-video rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-neutral-50 rounded-lg w-1/3" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-100 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Done state */}
      {step === "done" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white px-6 py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-[16px] font-[800] text-[#111318]">{aiEpisodes.length} episodes added!</p>
          <p className="text-[12px] text-neutral-400">Now live in your episode list below. Click any title to edit.</p>
          <button onClick={onClose} className="mt-2 px-5 py-2 rounded-xl text-white text-[13px] font-semibold btn-primary">Done</button>
        </motion.div>
      )}

      {/* Idle step guide */}
      {step === "idle" && (
        <div className="bg-white px-6 py-6 grid grid-cols-4 gap-3">
          {[
            { n: "1", label: "Set episode count (up to 30)" },
            { n: "2", label: "Describe your content angle" },
            { n: "3", label: "AI streams titles live" },
            { n: "4", label: "Edit titles → Apply" },
          ].map(s => (
            <div key={s.n} className="flex flex-col items-center text-center gap-2">
              <div className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center" style={{ background: "var(--t-primary)" }}>{s.n}</div>
              <p className="text-[11px] text-neutral-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────

function StatusDropdown({ status, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${current.color}`}
      >
        {status}
        <ChevronRight className={`w-3 h-3 transform transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 w-32 bg-white border border-[#E2E4E9] rounded-xl shadow-xl z-[70] p-1 overflow-hidden"
            >
              {Object.keys(STATUS_CONFIG).map(s => (
                <button
                  key={s}
                  onClick={() => { onChange(s); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${status === s ? "bg-[#F4F5F8] text-[var(--t-primary)]" : "text-neutral-500 hover:bg-[#F9FAFB]"}`}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SeriesDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getSeriesById, updateSeries, deleteSeries, getEpisodes, addEpisode, updateEpisode, deleteEpisode, applyAIEpisodes } = useSeries();

  const seriesInfo = getSeriesById(id);

  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedEpisodes, setSelectedEpisodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [episodeToPreview, setEpisodeToPreview] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "", description: "", type: "Series", episodes: 10, estCompletion: format(new Date(), "yyyy-MM-dd"),
  });

  // Sync form data when seriesInfo loads
  useEffect(() => {
    if (seriesInfo) {
      setFormData({
        name: seriesInfo.name,
        description: seriesInfo.description || "",
        type: seriesInfo.type || "Course",
        episodes: seriesInfo.episodes || 10,
        estCompletion: seriesInfo.estCompletion || format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [seriesInfo?.id]);

  // Load episodes from API/json-server
  useEffect(() => {
    if (!id) return;
    setEpLoading(true);
    getEpisodes(id)
      .then(data => setEpisodes(Array.isArray(data) ? data.sort((a, b) => (a.number || 0) - (b.number || 0)) : []))
      .catch(() => setEpisodes([]))
      .finally(() => setEpLoading(false));
  }, [id, getEpisodes]);

  // Stats
  const stats = useMemo(() => {
    const counts = episodes.reduce((acc, ep) => { acc[ep.status] = (acc[ep.status] || 0) + 1; return acc; }, {});
    const publishedCount = counts.Published || 0;
    return {
      total: episodes.length,
      published: publishedCount,
      completion: episodes.length > 0 ? Math.round((publishedCount / episodes.length) * 100) : 0,
      byStatus: counts,
    };
  }, [episodes]);

  const filteredEpisodes = episodes.filter(ep => filter === "All" || ep.status === filter);

  // Handlers
  const handleDragStart = (e, index) => e.dataTransfer.setData("draggedIndex", index);
  const handleDrop = (e, targetIndex) => {
    const draggedIndex = parseInt(e.dataTransfer.getData("draggedIndex"));
    if (draggedIndex === targetIndex) return;
    const reordered = [...episodes];
    const [item] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, item);
    const updated = reordered.map((ep, idx) => ({ ...ep, number: idx + 1 }));
    setEpisodes(updated);
    updated.forEach(ep => updateEpisode(ep.id, ep).catch(() => {}));
  };

  const handleAddEpisode = () => {
    const newEp = {
      id: `ep-${id}-${Date.now()}`,
      seriesId: id,
      number: episodes.length + 1,
      title: `Episode ${episodes.length + 1}`,
      status: "Draft",
      duration: null,
      dueDate: null,
    };
    addEpisode(newEp)
      .then(saved => setEpisodes(prev => [...prev, saved]))
      .catch(() => setEpisodes(prev => [...prev, newEp]));
  };

  const toggleSelect = epId => setSelectedEpisodes(prev => prev.includes(epId) ? prev.filter(x => x !== epId) : [...prev, epId]);

  const handleStatusChange = async (epId, newStatus) => {
    setEpisodes(prev => prev.map(ep => ep.id === epId ? { ...ep, status: newStatus } : ep));
    const ep = episodes.find(e => e.id === epId);
    if (ep) await updateEpisode(epId, { ...ep, status: newStatus }).catch(() => {});
  };

  const handleTitleChange = async (epId, newTitle) => {
    setEpisodes(prev => prev.map(ep => ep.id === epId ? { ...ep, title: newTitle } : ep));
    const ep = episodes.find(e => e.id === epId);
    if (ep) await updateEpisode(epId, { ...ep, title: newTitle }).catch(() => {});
  };

  const handleBulkAction = async (action) => {
    if (action === "Delete") { setIsBulkDeleteModalOpen(true); return; }
    const updated = episodes.map(ep => selectedEpisodes.includes(ep.id) ? { ...ep, status: action } : ep);
    setEpisodes(updated);
    await Promise.all(updated.filter(ep => selectedEpisodes.includes(ep.id)).map(ep => updateEpisode(ep.id, ep).catch(() => {})));
    setSelectedEpisodes([]);
  };

  const confirmBulkDelete = async () => {
    await Promise.all(selectedEpisodes.map(epId => deleteEpisode(epId).catch(() => {})));
    setEpisodes(prev => prev.filter(ep => !selectedEpisodes.includes(ep.id)));
    setSelectedEpisodes([]);
    setIsBulkDeleteModalOpen(false);
  };

  const confirmEpisodeDelete = async () => {
    if (!episodeToDelete) return;
    await deleteEpisode(episodeToDelete.id).catch(() => {});
    setEpisodes(prev => prev.filter(ep => ep.id !== episodeToDelete.id));
    setEpisodeToDelete(null);
  };

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSeries(id, { ...seriesInfo, ...formData, lastUpdated: new Date().toISOString() });
      setIsEditModalOpen(false);
    } catch { } finally { setIsSaving(false); }
  };

  const handleDeleteSeries = async () => {
    await deleteSeries(id).catch(() => {});
    router.push("/series");
  };

  const handleAIApply = async (episodeList) => {
    await applyAIEpisodes(id, episodeList);
    // Re-fetch all episodes to get clean server state (avoids duplicates from partial saves)
    const fresh = await getEpisodes(id).catch(() => []);
    setEpisodes(Array.isArray(fresh) ? fresh.sort((a, b) => (a.number || 0) - (b.number || 0)) : []);
  };

  if (!seriesInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-neutral-300" />
        <p className="text-[14px] font-semibold text-neutral-400">Series not found.</p>
        <button onClick={() => router.push("/series")} className="px-4 py-2 rounded-xl btn-primary text-white text-[13px] font-semibold">Back to Series</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/series")} className="p-3 bg-white border border-[#E2E4E9] rounded-2xl text-[#8A91A8] hover:text-[#0F0F0F] transition-all hover:scale-105">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-5">
            <EpisodeThumbnail
              title={episodes[0]?.title || seriesInfo.name}
              epNumber={null}
              duration={null}
              size="lg"
              rounded="rounded-2xl"
              showPlay={false}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/series" className="text-[12px] font-medium text-[#9CA3AF] hover:text-[var(--t-primary)] transition-colors">Series Planner</Link>
                <span className="text-[#9CA3AF]">/</span>
                <h2 className="text-[22px] font-[800] text-[#0A0A0F] tracking-tight">{seriesInfo.name}</h2>
              </div>
              <p className="text-[12px] text-[#8A91A8]">
                {epLoading ? "Loading episodes…" : `Managing ${episodes.length} episodes for this ${(seriesInfo.type || "series").toLowerCase()}.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-14 h-14">
            <svg className="transform -rotate-90 w-14 h-14">
              <circle strokeWidth="3.5" stroke="#E5E7EB" fill="transparent" r="24" cx="28" cy="28" />
              <circle
                strokeWidth="3.5" stroke="var(--t-primary)" fill="transparent"
                r="24" cx="28" cy="28"
                strokeDasharray={24 * 2 * Math.PI}
                strokeDashoffset={(24 * 2 * Math.PI) - (stats.completion / 100) * (24 * 2 * Math.PI)}
                strokeLinecap="round" className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-[#0F0F0F]">{stats.completion}%</span>
            </div>
          </div>

          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-[600] transition-all hover:brightness-110 btn-primary"
          >
            <Sparkles className="w-4 h-4" /> AI Episodes
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E4E9] rounded-xl text-[13px] font-semibold text-[#4B5264] hover:bg-[#F9FAFB] transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Series
          </button>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center p-1 bg-[#F4F5F8] rounded-xl border border-[#E2E4E9]">
          {["All", "Draft", "Scripted", "Filmed", "Edited", "Published"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${filter === f ? "bg-white shadow-sm" : "text-neutral-400 hover:text-neutral-600"}`}
              style={filter === f ? { color: "var(--t-primary)" } : {}}
            >
              {f}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f ? "bg-[var(--t-primary-light)] text-[var(--t-primary)]" : "bg-neutral-200 text-neutral-500"}`}>
                {f === "All" ? episodes.length : stats.byStatus[f] || 0}
              </span>
            </button>
          ))}
        </div>

        {selectedEpisodes.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 p-1 rounded-xl shadow-lg" style={{ background: "var(--t-primary)" }}>
            <span className="px-3 text-[12px] font-black text-white">{selectedEpisodes.length} Selected</span>
            <div className="flex gap-1">
              <button onClick={() => handleBulkAction("Published")} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase text-white">Publish</button>
              <button onClick={() => handleBulkAction("Delete")} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-[10px] font-black uppercase text-white">Delete</button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── INLINE AI GENERATOR ── */}
      <AnimatePresence>
        {showAI && (
          <AIGeneratorSection series={seriesInfo} onApply={handleAIApply} onClose={() => setShowAI(false)} />
        )}
      </AnimatePresence>

      {/* ── EPISODE LIST ── */}
      <div className="space-y-2.5">
        {epLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-[#EAECF0] rounded-2xl p-3 animate-pulse">
                <div className="w-5 h-3 bg-neutral-100 rounded shrink-0" />
                <div className="w-[160px] aspect-video rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-neutral-100 rounded-lg w-2/3" />
                  <div className="h-3 bg-neutral-50 rounded-lg w-1/4" />
                </div>
                <div className="w-24 h-7 bg-neutral-100 rounded-full shrink-0" />
                <div className="w-16 h-7 bg-neutral-50 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredEpisodes.map((ep, idx) => (
              <motion.div
                key={ep.id} layout
                draggable onDragStart={e => handleDragStart(e, episodes.indexOf(ep))}
                onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, episodes.indexOf(ep))}
                className={`group flex items-center gap-4 bg-white border rounded-2xl p-3 hover:shadow-lg transition-all duration-200 ${
                  editingId === ep.id ? "border-[var(--t-primary)] shadow-md" : "border-[#EAECF0] hover:border-[#D0D5DD]"
                }`}
              >
                {/* Grip + checkbox + number */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox" checked={selectedEpisodes.includes(ep.id)} onChange={() => toggleSelect(ep.id)}
                    className="w-4 h-4 rounded cursor-pointer accent-[var(--t-primary)]"
                  />
                  <span className="text-[11px] font-black text-neutral-300 w-5 text-center">{ep.number}</span>
                </div>

                {/* Thumbnail */}
                <EpisodeThumbnail
                  epNumber={ep.number}
                  title={ep.title}
                  duration={ep.duration}
                  idx={episodes.indexOf(ep)}
                  size="lg"
                />

                {/* Title + meta */}
                <div className="flex-1 min-w-0 py-1">
                  {editingId === ep.id ? (
                    <input
                      autoFocus value={ep.title}
                      onChange={e => setEpisodes(prev => prev.map(x => x.id === ep.id ? { ...x, title: e.target.value } : x))}
                      onBlur={() => { handleTitleChange(ep.id, ep.title); setEditingId(null); }}
                      onKeyDown={e => { if (e.key === "Enter") { handleTitleChange(ep.id, ep.title); setEditingId(null); } }}
                      className="w-full border-b-2 border-[var(--t-primary)] bg-transparent text-[15px] font-[700] outline-none pb-1"
                    />
                  ) : (
                    <h4
                      onClick={() => setEditingId(ep.id)}
                      className="text-[15px] font-[700] text-[#0D0D12] hover:text-[var(--t-primary)] cursor-text transition-colors line-clamp-2 leading-snug"
                    >
                      {ep.title}
                    </h4>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {ep.duration && (
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Clock className="w-3 h-3" />{ep.duration}
                      </span>
                    )}
                    {ep.dueDate ? (
                      <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                        <Calendar className="w-3 h-3" />{format(new Date(ep.dueDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-300">No due date</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusDropdown status={ep.status} onChange={s => handleStatusChange(ep.id, s)} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => setEditingId(ep.id)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-[var(--t-primary)] hover:bg-[var(--t-primary-light)] transition-all"
                    title="Edit title"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEpisodeToDelete(ep)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredEpisodes.length === 0 && (
              <div className="py-20 text-center bg-white border-2 border-dashed border-[#E8EAED] rounded-2xl">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--t-primary-light)" }}>
                  <Sparkles className="w-7 h-7" style={{ color: "var(--t-primary)" }} />
                </div>
                <p className="text-[15px] font-[800] text-[#111318] mb-1">No episodes yet</p>
                <p className="text-[12px] text-neutral-400 mb-5">Generate a full episode plan with AI or add episodes manually.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setShowAI(true)} className="px-5 py-2.5 rounded-xl text-white text-[13px] font-[700] btn-primary flex items-center gap-2 hover:brightness-110 transition-all">
                    <Sparkles className="w-4 h-4" /> Generate with AI
                  </button>
                  <button onClick={handleAddEpisode} className="px-5 py-2.5 rounded-xl border border-[#E2E4E9] text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50 transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add manually
                  </button>
                </div>
              </div>
            )}

            {/* Add episode */}
            {filteredEpisodes.length > 0 && (
              <button
                onClick={handleAddEpisode}
                className="w-full py-4 bg-white hover:bg-[var(--t-primary-light)] border-2 border-dashed border-[#E2E4E9] hover:border-[var(--t-primary)] rounded-2xl text-[12px] font-bold text-neutral-400 hover:text-[var(--t-primary)] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Episode
              </button>
            )}
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }} className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-8 py-6 border-b border-[#F4F5F8] flex justify-between items-center bg-[#FAFBFC]">
                <h3 className="text-[18px] font-[800] text-[#0F0F0F]">Edit Series</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-[#F4F5F8] rounded-xl"><X className="w-5 h-5 text-neutral-400" /></button>
              </div>
              <form onSubmit={handleSaveSeries} className="px-8 py-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Series Name</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-5 py-3.5 text-[14px] font-bold outline-none focus:border-[var(--t-primary)] transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-5 py-3.5 text-[14px] font-bold outline-none focus:border-[var(--t-primary)] transition-all h-24 resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setIsDeleteModalOpen(true); }} className="px-5 py-3 rounded-2xl bg-red-50 text-red-600 text-[13px] font-black hover:bg-red-100 transition-all">Delete</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-2xl text-white text-[13px] font-black transition-all disabled:opacity-60 btn-primary">
                    {isSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }} className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8" /></div>
              <h3 className="text-[18px] font-[800] text-[#0F0F0F] mb-2">Delete this series?</h3>
              <p className="text-[12px] text-neutral-400 mb-6">This will permanently delete the series and all {episodes.length} episodes.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 rounded-2xl border border-[#E2E4E9] text-[13px] font-black text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={handleDeleteSeries} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-[13px] font-black hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}

        {episodeToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEpisodeToDelete(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-[16px] font-[800] text-[#0F0F0F] mb-2">Delete Episode?</h3>
              <p className="text-[12px] text-neutral-400 mb-5">"{episodeToDelete.title}" will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setEpisodeToDelete(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E4E9] text-[12px] font-black text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={confirmEpisodeDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-black hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}

        {isBulkDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkDeleteModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7" /></div>
              <h3 className="text-[16px] font-[800] text-[#0F0F0F] mb-2">Delete {selectedEpisodes.length} Episodes?</h3>
              <p className="text-[12px] text-neutral-400 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E4E9] text-[12px] font-black text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={confirmBulkDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[12px] font-black hover:bg-red-600 transition-all">Delete All</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
