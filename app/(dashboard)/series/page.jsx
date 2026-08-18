"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSeries } from "@/context/SeriesContext";
import {
  ListVideo,
  Plus,
  MoreVertical,
  Layers,
  ArrowRight,
  LayoutGrid,
  List,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  MoreHorizontal,
  Edit2,
  Copy,
  Archive,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ListOrdered,
  Play,
  Sparkles,
  Wand2,
  Check,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import { FaYoutube, FaTiktok, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import EpisodeThumbnail from "@/app/components/EpisodeThumbnail";

// ---------- Constants ----------

const TYPE_CONFIG = {
  "Course": { gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  "Shorts": { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  "Project": { gradient: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  "Playlist": { gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" }
};

const PLATFORM_ICONS = {
  "YouTube": FaYoutube,
  "TikTok": FaTiktok,
  "Instagram": FaInstagram,
  "Twitter": FaTwitter
};

// ---------- Components ----------

function StatusBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG["Course"];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}>
      {type}
    </span>
  );
}

export default function SeriesPlannerPage() {
  const { series, isLoading, addSeries, updateSeries, deleteSeries, archiveSeries, duplicateSeries } = useSeries();

  const [view, setView] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'lastUpdated', direction: 'desc' });
  const [isSaving, setIsSaving] = useState(false);

  // Modal Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "Course",
    platforms: [],
    description: "",
    episodes: 10,
    estCompletion: format(new Date(), "yyyy-MM-dd"),
    theme: "Course"
  });

  // Derived Stats
  const stats = useMemo(() => {
    const active = series.filter(s => !s.archived);
    const totalEpisodes = active.reduce((acc, s) => acc + (s.episodes || 0), 0);
    const completedEpisodes = active.reduce((acc, s) => acc + (s.completed || 0), 0);
    const avgCompletion = totalEpisodes ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    return {
      total: active.length,
      active: active.filter(s => (s.completed || 0) < (s.episodes || 0)).length,
      episodes: totalEpisodes,
      avg: avgCompletion
    };
  }, [series]);

  // Sorting Logic
  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [series, sortConfig]);

  const activeSeries = sortedSeries.filter(s => !s.archived);
  const archivedSeries = sortedSeries.filter(s => s.archived);

  // Handlers
  const handleOpenModal = (s = null) => {
    if (s) {
      setEditingSeries(s);
      setFormData({
        name: s.name,
        type: s.type,
        platforms: s.platforms || [],
        description: s.description || "",
        episodes: s.episodes,
        estCompletion: s.estCompletion || format(new Date(), "yyyy-MM-dd"),
        theme: s.type
      });
    } else {
      setEditingSeries(null);
      setFormData({
        name: "",
        type: "Course",
        platforms: [],
        description: "",
        episodes: 10,
        estCompletion: format(new Date(), "yyyy-MM-dd"),
        theme: "Course"
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSeries) {
        await updateSeries(editingSeries.id, {
          ...editingSeries,
          ...formData,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        await addSeries({
          ...formData,
          completed: 0,
          lastUpdated: new Date().toISOString(),
          archived: false,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (s) => {
    try { await duplicateSeries(s); } catch (err) { console.error(err); }
  };

  const handleArchive = async (id) => {
    try { await archiveSeries(id); } catch (err) { console.error(err); }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [aiSeries, setAiSeries] = useState(null);

  const handleDeleteClick = (s) => {
    setSeriesToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (seriesToDelete) {
      try { await deleteSeries(seriesToDelete.id); } catch (err) { console.error(err); }
      setIsDeleteModalOpen(false);
      setSeriesToDelete(null);
    }
  };

  const togglePlatform = (p) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[#0F0F0F] mb-2">Series Planner</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total Series", val: stats.total },
              { label: "Active", val: stats.active },
              { label: "Total Episodes", val: stats.episodes },
              { label: "Avg Completion", val: `${stats.avg}%` }
            ].map(pill => (
              <div key={pill.label} className="bg-[#F4F5F8] border border-[#E2E4E9] rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#4B5264] flex items-center gap-2">
                <span className="opacity-60">{pill.label}</span>
                <span className="text-[#0F0F0F] font-black">{pill.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-white border border-[#E2E4E9] rounded-xl">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-[#F4F5F8] text-indigo-600 shadow-sm" : "text-[#8A91A8] hover:text-[#4B5264]"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-[#F4F5F8] text-indigo-600 shadow-sm" : "text-[#8A91A8] hover:text-[#4B5264]"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>New Series</span>
          </button>
        </div>
      </div>

      {/* ── MAIN VIEW ── */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {activeSeries.map((s) => (
              <SeriesCard
                key={s.id}
                series={s}
                onEdit={() => handleOpenModal(s)}
                onDuplicate={() => handleDuplicate(s)}
                onArchive={() => handleArchive(s.id)}
                onDelete={() => handleDeleteClick(s)}
                onAIGenerate={() => setAiSeries(s)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-[#E2E4E9] rounded-3xl overflow-hidden shadow-sm"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#E2E4E9]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 cursor-pointer" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    Series Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Platforms</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Progress</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeSeries.map(s => (
                  <tr key={s.id} className="border-b border-[#F4F5F8] hover:bg-[#F9FAFB] transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/series/${s.id}`} className="flex items-center gap-3">
                        <div className="w-20 aspect-video rounded-xl overflow-hidden border border-[#E2E4E9] shadow-sm shrink-0">
                          <EpisodeThumbnail title={s.name} size="full" rounded="rounded-none" epNumber={null} showFace={false} showPlay={false}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-[#111318] group-hover:text-indigo-600 transition-colors">{s.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4"><StatusBadge type={s.type} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5">
                        {s.platforms?.map(p => {
                          const Icon = PLATFORM_ICONS[p];
                          return Icon ? <Icon key={p} className="w-4 h-4 text-neutral-400" /> : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full max-w-[120px]">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${s.episodes ? Math.round((s.completed / s.episodes) * 100) : 0}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-neutral-800">{s.completed}/{s.episodes}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/series/${s.id}`} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-indigo-600"><ArrowRight className="w-4 h-4" /></Link>
                        <button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(s)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ARCHIVED SECTION ── */}
      {archivedSeries.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center gap-2 text-[#8A91A8] hover:text-[#4B5264] font-bold text-sm transition-colors mb-6"
          >
            {isArchivedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Archived Series ({archivedSeries.length})</span>
          </button>

          <AnimatePresence>
            {isArchivedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {archivedSeries.map(s => (
                    <SeriesCard
                      key={s.id}
                      series={s}
                      onEdit={() => handleOpenModal(s)}
                      onDuplicate={() => handleDuplicate(s)}
                      onArchive={() => handleArchive(s.id)}
                      onDelete={() => handleDeleteClick(s)}
                      onAIGenerate={() => setAiSeries(s)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── NEW SERIES MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-[#E2E4E9] rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#F4F5F8] flex justify-between items-center bg-[#FAFBFC]">
                <div>
                  <h3 className="text-2xl font-black text-[#0F0F0F]">{editingSeries ? "Edit Series" : "Create New Series"}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F4F5F8] rounded-xl transition-colors">
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSaveSeries} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Series Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter series name (e.g., Next.js Masterclass)"
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-neutral-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is this series about?"
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-neutral-300 h-32 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Series Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value, theme: e.target.value })}
                        className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        {Object.keys(TYPE_CONFIG).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Total Episodes</label>
                      <input
                        type="number"
                        required
                        value={formData.episodes}
                        onChange={e => setFormData({ ...formData, episodes: parseInt(e.target.value) })}
                        className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Estimated Completion</label>
                    <input
                      type="date"
                      required
                      value={formData.estCompletion}
                      onChange={e => setFormData({ ...formData, estCompletion: e.target.value })}
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-4 rounded-2xl text-white text-sm font-black uppercase tracking-widest transition-all disabled:opacity-60 btn-primary">
                  {isSaving ? "Saving…" : editingSeries ? "Save Changes" : "Create Series"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI EPISODE GENERATOR MODAL ── */}
      <AnimatePresence>
        {aiSeries && (
          <AIEpisodeModal series={aiSeries} onClose={() => setAiSeries(null)} />
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-md bg-white border border-[#E2E4E9] rounded-[32px] p-8 shadow-2xl text-center"
            >
              <h3 className="text-2xl font-black text-[#0F0F0F] mb-2">Delete Series?</h3>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-[#E2E4E9] text-sm font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- AI Episode Generator Modal ----------

const EPISODE_TEMPLATES = {
  Course: (name, n) => Array.from({ length: n }, (_, i) => ({
    ep: i + 1,
    title: [
      `Introduction to ${name} — What You'll Build`,
      `Setting Up Your Dev Environment`,
      `Core Concepts Explained Simply`,
      `Building Your First Feature`,
      `Deep Dive: Advanced Patterns`,
      `Handling Errors & Edge Cases`,
      `Authentication & Security`,
      `Optimizing for Performance`,
      `Testing & Debugging Strategies`,
      `Deploying to Production`,
      `Real-World Project Walkthrough`,
      `What's Next — Resources & Roadmap`,
    ][i % 12],
    duration: `${15 + Math.floor(Math.random() * 25)} min`,
  })),
  Shorts: (name, n) => Array.from({ length: n }, (_, i) => ({
    ep: i + 1,
    title: [
      `${name} #${i + 1}: Quick Tip`,
      `Did You Know? ${name} Secret`,
      `${name} in 60 Seconds`,
      `Most People Get ${name} Wrong`,
      `The Fastest Way to ${name}`,
      `Stop Making This ${name} Mistake`,
    ][i % 6],
    duration: "< 60 sec",
  })),
  Project: (name, n) => Array.from({ length: n }, (_, i) => ({
    ep: i + 1,
    title: [
      `Project Kickoff — Planning ${name}`,
      `Setting Up the Architecture`,
      `Building Core Features`,
      `Connecting the Backend`,
      `Polishing the UI`,
      `Launch & What I Learned`,
    ][i % 6],
    duration: `${20 + Math.floor(Math.random() * 30)} min`,
  })),
  Playlist: (name, n) => Array.from({ length: n }, (_, i) => ({
    ep: i + 1,
    title: `${name} — Part ${i + 1}`,
    duration: `${10 + Math.floor(Math.random() * 20)} min`,
  })),
};

function AIEpisodeModal({ series, onClose }) {
  const [loading, setLoading] = useState(false);
  const [episodes, setEpisodes] = useState(null);
  const [selected, setSelected] = useState([]);
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(series.episodes || 10);

  const generate = () => {
    setLoading(true);
    setEpisodes(null);
    setSelected([]);
    setTimeout(() => {
      const gen = EPISODE_TEMPLATES[series.type] || EPISODE_TEMPLATES.Course;
      const result = gen(series.name, Math.min(count, 20));
      setEpisodes(result);
      setSelected(result.map(e => e.ep));
      setLoading(false);
    }, 1600);
  };

  const toggleEp = (ep) => setSelected(prev => prev.includes(ep) ? prev.filter(x => x !== ep) : [...prev, ep]);

  const copyToClipboard = () => {
    const text = (episodes || [])
      .filter(e => selected.includes(e.ep))
      .map(e => `Ep ${e.ep}: ${e.title} [${e.duration}]`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E2E4E9] overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#F4F5F8] flex items-center justify-between" style={{ background: "linear-gradient(135deg, var(--t-primary-light), transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--t-primary), var(--t-secondary))" }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-[800] text-[#0F0F0F]">AI Episode Generator</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">{series.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Config */}
        <div className="px-7 py-4 border-b border-[#F4F5F8] flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Episodes to generate</label>
            <input
              type="number" min={1} max={20} value={count} onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-16 px-3 py-1.5 rounded-lg border border-[#E2E4E9] text-[13px] font-bold text-center focus:outline-none focus:border-[var(--t-primary)] transition"
            />
          </div>
          <button
            onClick={generate} disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-[600] transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 btn-primary"
          >
            {loading ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Wand2 className="w-3.5 h-3.5" /> {episodes ? "Regenerate" : "Generate"}</>}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {!episodes && !loading && (
            <div className="flex flex-col items-center justify-center py-14 text-neutral-300">
              <Sparkles className="w-10 h-10 mb-3" />
              <p className="text-[13px] font-medium text-neutral-400">Click Generate to create episode ideas</p>
              <p className="text-[11px] text-neutral-300 mt-1">Based on your series type: <span className="font-bold">{series.type}</span></p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="w-8 h-8 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-primary)", borderTopColor: "transparent" }} />
              <p className="text-[13px] text-neutral-400">AI is crafting your episode plan…</p>
            </div>
          )}
          {episodes && !loading && (
            <div className="space-y-2">
              {episodes.map(ep => (
                <div
                  key={ep.ep}
                  onClick={() => toggleEp(ep.ep)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border transition-all ${selected.includes(ep.ep)
                      ? "border-[var(--t-primary)] bg-[var(--t-primary-light)]"
                      : "border-[#F0F0F0] hover:border-[#E2E4E9] bg-white hover:bg-[#F9FAFB]"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-all ${selected.includes(ep.ep) ? "text-white" : "bg-[#F4F5F8] text-neutral-500"
                    }`} style={selected.includes(ep.ep) ? { backgroundColor: "var(--t-primary)" } : {}}>
                    {selected.includes(ep.ep) ? <Check className="w-3.5 h-3.5" /> : ep.ep}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111318] truncate">{ep.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{ep.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {episodes && !loading && (
          <div className="px-7 py-4 border-t border-[#F4F5F8] flex items-center justify-between gap-3">
            <span className="text-[12px] text-neutral-400">{selected.length} of {episodes.length} selected</span>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E4E9] text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50 transition"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><ClipboardList className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button onClick={onClose} className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold transition hover:brightness-110 btn-primary">
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ---------- Sub-components ----------

function SeriesCard({ series: s, onEdit, onDuplicate, onArchive, onDelete, onAIGenerate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const progress = s.episodes ? Math.round((s.completed / s.episodes) * 100) : 0;

  // Mock episodes for preview
  const previewEpisodes = [
    { title: "Javascript Backend Roadmap | chai aur code", duration: "29:20" },
    { title: "How to deploy backend code in production", duration: "50:14" },
  ];

  return (
    <div className={`group bg-white border border-[#E2E4E9] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${s.archived ? 'opacity-70 grayscale-[0.5]' : ''}`} style={{ borderWidth: '0.5px', borderRadius: '12px' }}>
      {/* 16:9 Thumbnail at top */}
      <Link href={`/series/${s.id}`} className="relative block aspect-video overflow-hidden">
        <EpisodeThumbnail title={s.name} size="full" rounded="rounded-none" epNumber={null} showPlay />
        {/* Video count overlay badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-black/80 backdrop-blur rounded text-[10px] font-black text-white flex items-center gap-1.5 border border-white/10 z-10">
          <ListVideo className="w-3.5 h-3.5" />
          <span>{s.episodes} VIDEOS</span>
        </div>
      </Link>

      {/* Indigo Progress Bar beneath thumbnail */}
      <div className="w-full h-[4px] bg-neutral-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-indigo-600"
        />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="min-w-0">
            {/* Compact Color-coded Type Badges */}
            <div className="mb-2">
              <StatusBadge type={s.type} />
            </div>
            {/* Full series title + subtitle */}
            <Link href={`/series/${s.id}`}>
              <h3 className="text-lg font-bold text-[#111318] leading-tight hover:text-indigo-600 transition-colors line-clamp-1">{s.name}</h3>
            </Link>
            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{s.description || "No description provided."}</p>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-neutral-400 hover:text-[#0F0F0F] hover:bg-[#F4F5F8] rounded-lg transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E2E4E9] rounded-xl shadow-xl z-50 p-1.5"
                  >
                    <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-indigo-600 rounded-lg transition-all uppercase tracking-wider"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-blue-600 rounded-lg transition-all uppercase tracking-wider"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                    <button onClick={() => { onArchive(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-amber-600 rounded-lg transition-all uppercase tracking-wider"><Archive className="w-3.5 h-3.5" /> {s.archived ? "Restore" : "Archive"}</button>
                    <div className="h-px bg-[#F4F5F8] my-1 mx-2" />
                    <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all uppercase tracking-wider"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 2 episode preview rows with numbered circle indicators */}
        <div className="space-y-2 mb-5">
          {previewEpisodes.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 group/ep cursor-pointer">
              <div className="w-5 h-5 rounded-full bg-[#F4F5F8] flex items-center justify-center border border-[#E2E4E9] shrink-0">
                <span className="text-[9px] font-bold text-neutral-500">{i + 1}</span>
              </div>
              <p className="text-[12px] font-medium text-neutral-500 group-hover:text-indigo-600 transition-colors truncate">
                {ep.title}
              </p>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div className="pt-4 border-t border-[#F4F5F8] flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.completed}/{s.episodes} EP</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onAIGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 text-white btn-primary"
            >
              <Sparkles className="w-3 h-3" /> AI Episodes
            </button>
            <Link href={`/series/${s.id}`} className="text-[11px] font-bold text-neutral-400 hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase tracking-wider">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
