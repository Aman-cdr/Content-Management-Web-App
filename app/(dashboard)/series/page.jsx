"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSeries } from "@/context/SeriesContext";
import httpClient from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";
import PublishModal from "@/app/components/PublishModal";
import AutoPublishPanel from "@/app/components/AutoPublishPanel";
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
  Link2,
  Hash,
  Image,
  FileText,
  Zap,
  Rocket,
  Scissors,
  Loader2,
  Film,
  AlignLeft,
  RefreshCw,
  Download,
  Tag,
  Eye,
  Upload,
  AlertCircle,
} from "lucide-react";
import { FaYoutube, FaTiktok, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import EpisodeThumbnail from "@/app/components/EpisodeThumbnail";

// ---------- Constants ----------

const TYPE_CONFIG = {
  Course: { gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  Shorts: { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  Project: { gradient: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  Playlist: { gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
};

const PLATFORM_ICONS = {
  YouTube: FaYoutube,
  TikTok: FaTiktok,
  Instagram: FaInstagram,
  Twitter: FaTwitter,
};

const CLIP_TYPE_COLORS = {
  tip: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  story: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  hook: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  transformation: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  tutorial: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  reaction: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
};

// ---------- Shared Components ----------

// Animates a stat pill's numeric value counting up from 0 on mount/change.
// Accepts plain numbers or "N%" strings — non-numeric values render as-is.
function CountUp({ value, duration = 700 }) {
  const numeric = typeof value === "number" ? value : parseFloat(value);
  const suffix = typeof value === "string" ? value.replace(/^-?[\d.]+/, "") : "";
  const isNumeric = Number.isFinite(numeric);
  const [display, setDisplay] = useState(isNumeric ? 0 : null);

  useEffect(() => {
    if (!isNumeric) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(numeric * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [numeric, duration, isNumeric]);

  return <>{isNumeric ? `${display}${suffix}` : value}</>;
}

function StatusBadge({ type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG["Course"];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {type}
    </span>
  );
}

// ---------- Main Page ----------

export default function SeriesPlannerPage() {
  const { series, isLoading, addSeries, updateSeries, deleteSeries, archiveSeries, duplicateSeries } = useSeries();
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname === "/series/shorts" ? "shorts" : "youtube";
  const setActiveTab = (tab) => {
    router.push(tab === "shorts" ? "/series/shorts" : "/series");
  };

  const [view, setView] = useState("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "lastUpdated", direction: "desc" });
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Course",
    platforms: [],
    description: "",
    episodes: 10,
    estCompletion: format(new Date(), "yyyy-MM-dd"),
    theme: "Course",
  });

  const stats = useMemo(() => {
    const active = series.filter((s) => !s.archived);
    const totalEpisodes = active.reduce((acc, s) => acc + (s.episodes || 0), 0);
    const completedEpisodes = active.reduce((acc, s) => acc + (s.completed || 0), 0);
    const avgCompletion = totalEpisodes ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    return {
      total: active.length,
      active: active.filter((s) => (s.completed || 0) < (s.episodes || 0)).length,
      episodes: totalEpisodes,
      avg: avgCompletion,
    };
  }, [series]);

  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [series, sortConfig]);

  const activeSeries = sortedSeries.filter((s) => !s.archived);
  const archivedSeries = sortedSeries.filter((s) => s.archived);

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
        theme: s.type,
      });
    } else {
      setEditingSeries(null);
      setFormData({ name: "", type: "Course", platforms: [], description: "", episodes: 10, estCompletion: format(new Date(), "yyyy-MM-dd"), theme: "Course" });
    }
    setIsModalOpen(true);
  };

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSeries) {
        await updateSeries(editingSeries.id, { ...editingSeries, ...formData, lastUpdated: new Date().toISOString() });
      } else {
        await addSeries({ ...formData, completed: 0, lastUpdated: new Date().toISOString(), archived: false });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async (s) => { try { await duplicateSeries(s); } catch (err) { console.error(err); } };
  const handleArchive = async (id) => { try { await archiveSeries(id); } catch (err) { console.error(err); } };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);
  const [aiSeries, setAiSeries] = useState(null);

  const handleDeleteClick = (s) => { setSeriesToDelete(s); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (seriesToDelete) {
      try { await deleteSeries(seriesToDelete.id); } catch (err) { console.error(err); }
      setIsDeleteModalOpen(false);
      setSeriesToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-medium tracking-tight text-[#0F0F0F] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Series Planner</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total Series", val: stats.total },
              { label: "Active", val: stats.active },
              { label: "Total Episodes", val: stats.episodes },
              { label: "Avg Completion", val: `${stats.avg}%` },
            ].map((pill) => (
              <div key={pill.label} className="bg-[#F4F5F8] border border-[#E2E4E9] rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-[#4B5264] flex items-center gap-2">
                <span className="opacity-60">{pill.label}</span>
                <span className="text-[#0F0F0F] font-bold tabular-nums"><CountUp value={pill.val} /></span>
              </div>
            ))}
          </div>
        </div>

        {activeTab === "youtube" && (
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-white border border-[#E2E4E9] rounded-full">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-full transition-all duration-300 ${view === "grid" ? "bg-[#F4F5F8] text-indigo-600 shadow-sm" : "text-[#8A91A8] hover:text-[#4B5264]"}`}
              >
                <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-full transition-all duration-300 ${view === "list" ? "bg-[#F4F5F8] text-indigo-600 shadow-sm" : "text-[#8A91A8] hover:text-[#4B5264]"}`}
              >
                <List className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="group relative flex items-center gap-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white pl-5 pr-1.5 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            >
              <span>New Series</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-90">
                <Plus className="w-4 h-4" strokeWidth={1.75} />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 bg-[#F4F5F8] border border-[#E2E4E9] rounded-full w-fit">
        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "youtube"
              ? "bg-white text-[#0F0F0F] shadow-sm border border-[#E2E4E9]"
              : "text-[#8A91A8] hover:text-[#4B5264]"
          }`}
        >
          <FaYoutube className={`w-4 h-4 ${activeTab === "youtube" ? "text-red-500" : ""}`} />
          YouTube Videos
        </button>
        <button
          onClick={() => setActiveTab("shorts")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
            activeTab === "shorts"
              ? "bg-white text-[#0F0F0F] shadow-sm border border-[#E2E4E9]"
              : "text-[#8A91A8] hover:text-[#4B5264]"
          }`}
        >
          <div className="flex items-center gap-1">
            <Film className={`w-3.5 h-3.5 ${activeTab === "shorts" ? "text-amber-500" : ""}`} strokeWidth={1.5} />
            <FaInstagram className={`w-3.5 h-3.5 ${activeTab === "shorts" ? "text-pink-500" : ""}`} />
          </div>
          YT Shorts & Instagram
        </button>
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        {activeTab === "youtube" ? (
          <motion.div key="youtube-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-8">
            {/* Main Series View */}
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
                  className="bg-white border border-[#E2E4E9] rounded-[1.75rem] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.08)]"
                >
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFBFC] border-b border-[#E2E4E9]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 cursor-pointer" onClick={() => setSortConfig({ key: "name", direction: sortConfig.direction === "asc" ? "desc" : "asc" })}>
                          Series Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Type</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Platforms</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Progress</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSeries.map((s) => (
                        <tr key={s.id} className="border-b border-[#F4F5F8] hover:bg-[#F9FAFB] transition-colors duration-300 group">
                          <td className="px-6 py-4">
                            <Link href={`/series/${s.id}`} className="flex items-center gap-3">
                              <div className="w-20 aspect-video rounded-xl overflow-hidden border border-[#E2E4E9] shadow-sm shrink-0">
                                <EpisodeThumbnail title={s.name} size="full" rounded="rounded-none" epNumber={null} showFace={false} showPlay={false} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-bold text-[#111318] group-hover:text-indigo-600 transition-colors duration-300">{s.name}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4"><StatusBadge type={s.type} /></td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              {s.platforms?.map((p) => { const Icon = PLATFORM_ICONS[p]; return Icon ? <Icon key={p} className="w-4 h-4 text-neutral-400" /> : null; })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full max-w-[120px]">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${s.episodes ? Math.round((s.completed / s.episodes) * 100) : 0}%` }} />
                              </div>
                              <span className="text-xs font-bold text-neutral-800">{s.completed}/{s.episodes}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/series/${s.id}`} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-indigo-600 transition-colors duration-300"><ArrowRight className="w-4 h-4" strokeWidth={1.5} /></Link>
                              <button onClick={() => handleOpenModal(s)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-blue-600 transition-colors duration-300"><Edit2 className="w-4 h-4" strokeWidth={1.5} /></button>
                              <button onClick={() => handleDeleteClick(s)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-600 transition-colors duration-300"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Archived Section */}
            {archivedSeries.length > 0 && (
              <div className="mt-12">
                <button
                  onClick={() => setIsArchivedOpen(!isArchivedOpen)}
                  className="flex items-center gap-2 text-[#8A91A8] hover:text-[#4B5264] font-bold text-sm transition-colors duration-300 mb-6"
                >
                  {isArchivedOpen ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />}
                  <span>Archived Series ({archivedSeries.length})</span>
                </button>
                <AnimatePresence>
                  {isArchivedOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                        {archivedSeries.map((s) => (
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
          </motion.div>
        ) : (
          <motion.div key="shorts-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <ShortsPlanner />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NEW SERIES MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full max-w-2xl bg-white border border-[#E2E4E9] rounded-[1.75rem] overflow-hidden shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-[#F4F5F8] flex justify-between items-center bg-[#FAFBFC]">
                <h3 className="text-2xl font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{editingSeries ? "Edit Series" : "Create New Series"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#F4F5F8] rounded-full transition-colors duration-300">
                  <X className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSaveSeries} className="p-8 space-y-6 overflow-y-auto scrollbar-hide">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Series Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter series name (e.g., Next.js Masterclass)"
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all duration-300 placeholder:text-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What is this series about?"
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-[1.5rem] px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all duration-300 placeholder:text-neutral-300 h-32 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Series Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value, theme: e.target.value })}
                        className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all duration-300 appearance-none cursor-pointer"
                      >
                        {Object.keys(TYPE_CONFIG).map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Total Episodes</label>
                      <input
                        type="number"
                        required
                        value={formData.episodes}
                        onChange={(e) => setFormData({ ...formData, episodes: parseInt(e.target.value) })}
                        className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-2">Estimated Completion</label>
                    <input
                      type="date"
                      required
                      value={formData.estCompletion}
                      onChange={(e) => setFormData({ ...formData, estCompletion: e.target.value })}
                      className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all duration-300"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="w-full py-4 rounded-full text-white text-sm font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-60 btn-primary">
                  {isSaving ? "Saving…" : editingSeries ? "Save Changes" : "Create Series"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI EPISODE GENERATOR MODAL ── */}
      <AnimatePresence>
        {aiSeries && <AIEpisodeModal series={aiSeries} onClose={() => setAiSeries(null)} />}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="relative w-full max-w-sm bg-white border border-[#E2E4E9] rounded-[1.75rem] p-8 shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] text-center"
            >
              <h3 className="text-2xl font-semibold text-[#0F0F0F] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Delete Series?</h3>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-full border border-[#E2E4E9] text-sm font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-colors duration-300">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-4 rounded-full bg-red-500 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-colors duration-300">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// SHORTS PLANNER
// ============================================================

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function ytThumbnail(videoId) {
  // maxresdefault (1280×720) exists for nearly all YouTube videos
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Seconds → "hh:mm:ss" (or "mm:ss" under an hour) for the Processing Timeframe slider.
function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

const STORAGE_KEY = "shorts_planner_session";

function ShortsPlanner() {
  // Restore previous session from localStorage on first mount
  const savedSession = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  })();

  const [sourceUrl, setSourceUrl] = useState(savedSession?.sourceUrl || "");
  const [platform, setPlatform] = useState("both");
  const [count, setCount] = useState(5);
  const [maxDuration, setMaxDuration] = useState(120);
  const [shorts, setShorts] = useState(savedSession?.shorts || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoPublishOpen, setIsAutoPublishOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState(null);
  const [thumbnailShort, setThumbnailShort] = useState(null);
  const [previewShort, setPreviewShort] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null); // { short, platform }
  const [vertStylePickerShort, setVertStylePickerShort] = useState(null);
  const [videoInfo, setVideoInfo] = useState(savedSession?.videoInfo || null); // { title, channel, videoId }
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  // Processing Timeframe — restricts clip generation to a portion of the video.
  // Only available when the video has captions (same requirement as generation
  // itself); videoDuration stays null until that's confirmed.
  const [videoDuration, setVideoDuration] = useState(savedSession?.videoDuration ?? null);
  const [rangeStart, setRangeStart] = useState(savedSession?.rangeStart ?? 0);
  const [rangeEnd, setRangeEnd] = useState(savedSession?.rangeEnd ?? null);
  const [generateError, setGenerateError] = useState("");
  const [openingEditorId, setOpeningEditorId] = useState(null);
  const debounceRef = useRef(null);
  const router = useRouter();

  // Materializes this clip's YouTube section as local footage (via the same
  // yt-dlp pipeline the publish flow uses) and opens it in the video editor,
  // pre-seeded with the AI's suggested in/out range. verticalStyle picks how
  // the 16:9 source gets cropped to the 9:16 canvas: "pillarbox" (blurred
  // letterbox, nothing cut off) or "fill" (full-bleed crop, edges trimmed).
  const handleOpenEditor = useCallback(async (clip, verticalStyle = "pillarbox") => {
    if (openingEditorId) return;
    setOpeningEditorId(clip.id);
    try {
      const res = await httpClient.post(ENDPOINTS.EDITOR.CREATE, {
        sourceUrl,
        timestampStart: clip.timestampStart,
        timestampEnd: clip.timestampEnd,
        verticalStyle,
        // Seed the editor's publish metadata from the AI-generated short so
        // Publish doesn't fall back to a bare filename as the title.
        title: clip.title || "",
        description: [clip.description, clip.hook ? `Hook: "${clip.hook}"` : ""].filter(Boolean).join("\n\n"),
        hashtags: clip.hashtags || [],
      });
      const project = res.data?.data || res.data;
      router.push(`/editor/${project.id || project._id}`);
    } catch (err) {
      setGenerateError(err.message || "Failed to open editor");
      setOpeningEditorId(null);
    }
  }, [openingEditorId, sourceUrl, router]);

  // Persist session whenever the important state changes
  useEffect(() => {
    try {
      if (sourceUrl || shorts.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ sourceUrl, shorts, videoInfo, videoDuration, rangeStart, rangeEnd }));
      }
    } catch {}
  }, [sourceUrl, shorts, videoInfo, videoDuration, rangeStart, rangeEnd]);

  // Auto-fetch video info when URL changes
  const handleUrlChange = (url) => {
    setSourceUrl(url);
    setVideoInfo(null);
    setVideoDuration(null);
    setRangeStart(0);
    setRangeEnd(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const videoId = extractYouTubeId(url);
    if (!videoId) return;
    debounceRef.current = setTimeout(async () => {
      setIsFetchingInfo(true);
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setVideoInfo({ title: data.title, channel: data.author_name, videoId });
        }
      } catch {}
      finally { setIsFetchingInfo(false); }

      // Processing Timeframe slider only makes sense once we know the video's
      // actual length — fetch it in parallel via the transcript (captions-only).
      try {
        const durRes = await fetch("/api/video-duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: url }),
        });
        if (durRes.ok) {
          const durData = await durRes.json();
          if (durData.available && durData.duration > 0) {
            setVideoDuration(durData.duration);
            setRangeStart(0);
            setRangeEnd(durData.duration);
          }
        }
      } catch {}
    }, 600);
  };

  const generateShorts = async () => {
    if (!sourceUrl.trim()) return;
    setIsGenerating(true);
    setShorts([]);
    setGenerateError("");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}  // start fresh
    const videoId = extractYouTubeId(sourceUrl);
    try {
      const res = await fetch("/api/generate-shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: sourceUrl,
          platform,
          count,
          maxDuration,
          ...(videoDuration != null ? { rangeStart, rangeEnd } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `API error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const accumulated = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            // skip the __meta line (video info)
            if (parsed.__meta) {
              setVideoInfo((prev) => prev || { title: parsed.title, channel: parsed.channel, videoId });
              continue;
            }
            if (!parsed.index) continue;
            accumulated.push({
              ...parsed,
              id: `short-${Date.now()}-${parsed.index}`,
              videoId,
              sourceUrl,
              thumbnailStyle: 0,
            });
            setShorts([...accumulated]);
          } catch {}
        }
      }
    } catch (err) {
      console.error("Generate shorts error:", err);
      setGenerateError(err.message || "Failed to generate shorts. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteShort = (id) => setShorts((prev) => prev.filter((s) => s.id !== id));
  const updateShort = (id, updates) => setShorts((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

  const platformLabel = { both: "All Platforms", "yt-shorts": "YouTube Shorts", instagram: "Instagram Reels" };

  return (
    <div className="space-y-6">
      {/* Source Video Panel */}
      <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-4 border-b border-[#F4F5F8] flex items-center gap-3" style={{ background: "var(--t-primary-light)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm" style={{ background: "var(--t-primary)" }}>
            <Film className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Source Video</h3>
            <p className="text-[11px] text-neutral-400">Paste a full-length YouTube URL — AI reads the video title to generate specific clip ideas</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* URL Input */}
          <div className="relative">
            <FaYoutube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
            {isFetchingInfo && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent border-amber-400 rounded-full animate-spin" />
            )}
            <input
              value={sourceUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full pl-10 pr-10 py-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/10 transition-all duration-300 placeholder:text-neutral-300"
            />
          </div>

          {/* Skeleton — shown while oEmbed/duration lookups are in flight, so the
              panel doesn't leave a jarring empty gap between the input and grid. */}
          {isFetchingInfo && !videoInfo && (
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl animate-pulse">
              <div className="w-20 aspect-video rounded-xl bg-neutral-200 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 bg-neutral-200 rounded-full w-3/4" />
                <div className="h-2.5 bg-neutral-200 rounded-full w-1/3" />
              </div>
            </div>
          )}

          {/* Video preview card — shown once URL is detected */}
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl"
            >
              <img
                src={ytThumbnail(videoInfo.videoId)}
                alt={videoInfo.title}
                className="w-20 aspect-video rounded-xl object-cover border border-[#E2E4E9] shrink-0"
                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`; e.target.onerror = () => { e.target.src = `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`; e.target.onerror = null; }; }}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#111318] line-clamp-2 leading-snug">{videoInfo.title}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{videoInfo.channel}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-auto" strokeWidth={1.5} />
            </motion.div>
          )}

          {/* Processing Timeframe — restrict which part of the video the AI scans
              for clips. Only shown once the video's real duration is known, which
              requires captions (same requirement as clip generation itself). */}
          {videoDuration != null && rangeEnd != null && (() => {
            const startPct = (rangeStart / videoDuration) * 100;
            const endPct = (rangeEnd / videoDuration) * 100;
            // Clamp the floating value pills so they never clip past the card's
            // edges even when a handle sits at 0% or 100%.
            const clamp = (pct) => Math.min(Math.max(pct, 6), 94);
            const isFullRange = rangeStart === 0 && rangeEnd === videoDuration;

            return (
              <motion.div
                initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="p-4 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Processing Timeframe</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--t-primary)" }}>{formatSeconds(rangeEnd - rangeStart)} selected</span>
                    {!isFullRange && (
                      <button
                        onClick={() => { setRangeStart(0); setRangeEnd(videoDuration); }}
                        className="text-[10px] font-semibold text-neutral-400 hover:text-neutral-600 underline transition-colors duration-300"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Floating time pills track the actual handle positions —
                    previously these were pinned to the container's edges
                    regardless of where the handles sat, which was misleading. */}
                <div className="relative pt-6">
                  <div
                    className="absolute top-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ left: `${clamp(startPct)}%`, transform: "translateX(-50%)", background: "var(--t-primary)" }}
                  >
                    {formatSeconds(rangeStart)}
                  </div>
                  <div
                    className="absolute top-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ left: `${clamp(endPct)}%`, transform: "translateX(-50%)", background: "var(--t-primary)" }}
                  >
                    {formatSeconds(rangeEnd)}
                  </div>

                  <div className="relative h-6 flex items-center mb-1">
                    {/* Faux waveform texture — purely decorative, gives the track
                        a "scanning audio" feel instead of a plain HTML range bar */}
                    <div
                      className="absolute left-0 right-0 h-3 rounded-full opacity-40 pointer-events-none"
                      style={{
                        backgroundImage: "repeating-linear-gradient(90deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 5px)",
                        color: "#D4D6DD",
                        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
                      }}
                    />
                    <div className="absolute left-0 right-0 h-1.5 bg-neutral-200 rounded-full" />
                    <div
                      className="absolute h-1.5 rounded-full"
                      style={{ left: `${startPct}%`, right: `${100 - endPct}%`, background: "var(--t-primary)" }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={1}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(Math.min(Number(e.target.value), rangeEnd - 1))}
                      className="dual-range-slider absolute w-full h-6"
                      aria-label="Timeframe start"
                    />
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={1}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(Math.max(Number(e.target.value), rangeStart + 1))}
                      className="dual-range-slider absolute w-full h-6"
                      aria-label="Timeframe end"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400">
                  <span>00:00</span>
                  <span>Full length: {formatSeconds(videoDuration)}</span>
                </div>
              </motion.div>
            );
          })()}

          {/* Platform + Count + Generate */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex p-1 bg-[#F4F5F8] border border-[#E2E4E9] rounded-full">
              {[
                { value: "both", label: "All", icon: null },
                { value: "yt-shorts", label: "YT Shorts", icon: <Film className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} /> },
                { value: "instagram", label: "Instagram", icon: <FaInstagram className="w-3.5 h-3.5 text-pink-500" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300 ${
                    platform === opt.value ? "bg-white text-[#0F0F0F] shadow-sm border border-[#E2E4E9]" : "text-[#8A91A8] hover:text-[#4B5264]"
                  }`}
                >
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-[#F4F5F8] border border-[#E2E4E9] rounded-full px-3.5 py-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.15em] whitespace-nowrap">Clips</span>
              <input
                type="number" min={1} max={10} value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-12 bg-white border border-[#E2E4E9] rounded-full px-2 py-1 text-[13px] font-semibold text-center focus:outline-none transition-colors duration-300" style={{ "--tw-ring-color": "var(--t-primary)" }}
              />
            </div>

            <div className="flex p-1 bg-[#F4F5F8] border border-[#E2E4E9] rounded-full">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.15em] self-center px-2 whitespace-nowrap">Max</span>
              {[
                { value: 60,  label: "1 min" },
                { value: 90,  label: "90 sec" },
                { value: 120, label: "2 min" },
                { value: 180, label: "3 min" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMaxDuration(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300 ${
                    maxDuration === opt.value ? "bg-white text-[#0F0F0F] shadow-sm border border-[#E2E4E9]" : "text-[#8A91A8] hover:text-[#4B5264]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setIsAutoPublishOpen(true)}
                title="AI picks its 3 best clips and publishes all of them, unattended"
                className="group relative flex items-center gap-1.5 pl-4 pr-1.5 py-1.5 rounded-full text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] bg-gradient-to-r from-[#F59E0B] to-[#EF4444] shadow-[0_4px_16px_-4px_rgba(239,68,68,0.4)]"
              >
                <Rocket className="w-4 h-4" strokeWidth={1.5} /> Auto-Publish Top 3
              </button>
              <button
                onClick={generateShorts}
                disabled={isGenerating || !sourceUrl.trim()}
                className="group relative flex items-center gap-1.5 pl-4 pr-1.5 py-1.5 rounded-full text-white text-sm font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 btn-primary shadow-[0_4px_16px_-4px_rgba(99,102,241,0.4)]"
              >
                {isGenerating
                  ? <><RotateCcw className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Generating {shorts.length}/{count}…</>
                  : <><Sparkles className="w-4 h-4" strokeWidth={1.5} /> Generate Shorts</>
                }
              </button>
            </div>
          </div>
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="h-1.5 w-full bg-[#F4F5F8] rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--t-primary)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (shorts.length / count) * 100)}%` }}
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {generateError && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-600 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} /> {generateError}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {shorts.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-[#E2E4E9] rounded-[1.75rem]">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--t-primary-light)" }}>
            <Sparkles className="w-6 h-6" style={{ color: "var(--t-primary)" }} strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-semibold text-neutral-500 mb-1">No shorts generated yet</p>
          <p className="text-[12px] text-neutral-400 text-center max-w-xs">
            Set your options above and click <span className="font-semibold text-neutral-500">Generate Shorts</span>
          </p>
        </div>
      )}

      {/* Generating skeleton */}
      {isGenerating && shorts.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-neutral-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-neutral-100 rounded-full w-3/4" />
                <div className="h-3 bg-neutral-100 rounded-full w-full" />
                <div className="h-3 bg-neutral-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shorts Grid */}
      {shorts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-neutral-500">
              {shorts.length} clip{shorts.length !== 1 ? "s" : ""} · {platformLabel[platform]}
              {videoInfo && <span className="text-neutral-400 font-normal"> from "{videoInfo.title}"</span>}
            </p>
            <button
              onClick={generateShorts}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2E4E9] text-[12px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} /> Regenerate All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shorts.map((short, index) => (
              <ShortCard
                key={short.id}
                short={short}
                index={index}
                onEdit={() => setSelectedShort(short)}
                onDelete={() => deleteShort(short.id)}
                onGenerateThumbnail={() => setThumbnailShort(short)}
                onPreview={() => setPreviewShort(short)}
                onPublish={(s, platform) => setPublishTarget({ short: s, platform })}
                onOpenEditor={() => setVertStylePickerShort(short)}
                isOpeningEditor={openingEditorId === short.id}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {previewShort && (
          <ClipPreviewModal short={previewShort} onClose={() => setPreviewShort(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedShort && (
          <ShortDetailModal
            short={selectedShort}
            sourceUrl={sourceUrl}
            videoInfo={videoInfo}
            onClose={() => setSelectedShort(null)}
            onSave={(updates) => { updateShort(selectedShort.id, updates); setSelectedShort(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {thumbnailShort && (
          <ThumbnailGeneratorModal
            short={thumbnailShort}
            onClose={() => setThumbnailShort(null)}
            onApply={(style, settings) => { updateShort(thumbnailShort.id, { thumbnailStyle: style, thumbnailSettings: settings }); setThumbnailShort(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {publishTarget && (
          <PublishModal
            short={publishTarget.short}
            platform={publishTarget.platform}
            onClose={() => setPublishTarget(null)}
          />
        )}
      </AnimatePresence>

      <AutoPublishPanel isOpen={isAutoPublishOpen} onClose={() => setIsAutoPublishOpen(false)} />

      <AnimatePresence>
        {vertStylePickerShort && (
          <VerticalStyleModal
            onClose={() => setVertStylePickerShort(null)}
            onChoose={(style) => {
              handleOpenEditor(vertStylePickerShort, style);
              setVertStylePickerShort(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──

// Converts "02:30" or "1:02:30" → seconds
function tsToSeconds(ts) {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// ── Short Card ──
// Thumbnails are 9:16 (vertical) — correct size for YT Shorts & Instagram Reels

function ShortCard({ short, index = 0, onEdit, onDelete, onGenerateThumbnail, onPreview, onPublish, onOpenEditor, isOpeningEditor }) {
  const clipConfig = CLIP_TYPE_COLORS[short.clipType] || CLIP_TYPE_COLORS.tip;
  const thumbSrc = short.videoId ? ytThumbnail(short.videoId) : null;
  const [imgError, setImgError] = useState(false);

  // Compute actual clip duration — platform limits depend on what was generated
  const durationSec = short.durationSec
    || (tsToSeconds(short.timestampEnd) - tsToSeconds(short.timestampStart));
  const platformLimit = short.platformLimit || 180; // set by generation; fallback = real YT Shorts/IG Reels cap
  const ytOk = durationSec <= platformLimit;
  const igOk = durationSec <= platformLimit;
  const overLimit = !ytOk && !igOk;

  // Duration-vs-limit ring — green under 70% of the cap, amber up to the cap, red over it
  const fillRatio = Math.min(1, durationSec / platformLimit);
  const ringColor = overLimit ? "#EF4444" : fillRatio > 0.7 ? "#F59E0B" : "#10B981";
  const RING_R = 9;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.06, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -4 }}
      className="bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.14)] transition-shadow duration-500 group flex flex-col"
    >
      {/* Compact 16:9 card thumbnail — centre-cropped from the source video.
          Full 9:16 vertical format is shown only in Preview & Thumbnail modals. */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {thumbSrc && !imgError ? (
          <img
            src={thumbSrc}
            alt={short.title}
            className="w-full h-full object-cover object-center"
            onError={() => setImgError(true)}
          />
        ) : (
          <EpisodeThumbnail title={short.title} size="full" rounded="rounded-none" epNumber={short.index} showPlay={false} showFace={false} className="w-full h-full object-cover" />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Timestamp — top left */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur text-white text-[10px] font-bold border border-white/10">
          <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
          <span>{short.timestampStart} → {short.timestampEnd}</span>
        </div>

        {/* 9:16 badge — top right: reminds user the actual upload is vertical */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-bold tracking-widest border border-white/10">
          <Film className="w-2.5 h-2.5 text-amber-400" strokeWidth={1.5} /> 9:16
        </div>

        {/* Clip type — bottom left */}
        <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${clipConfig.bg} ${clipConfig.text} ${clipConfig.border}`}>
          {short.clipType}
        </div>

        {/* Hover: two actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 group-hover:bg-black/55 transition-all duration-300 opacity-0 group-hover:opacity-100">
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 bg-white text-[#0F0F0F] px-3.5 py-1.5 rounded-full text-[11px] font-semibold shadow-lg hover:bg-[var(--t-primary-light)] transition-colors duration-300"
          >
            <Play className="w-3 h-3" style={{ color: "var(--t-primary)", fill: "var(--t-primary)" }} strokeWidth={1.5} /> Preview
          </button>
          <button
            onClick={onGenerateThumbnail}
            className="flex items-center gap-1.5 bg-white/90 text-[#0F0F0F] px-3.5 py-1.5 rounded-full text-[11px] font-semibold shadow-lg hover:bg-purple-50 transition-colors duration-300"
          >
            <Image className="w-3 h-3 text-purple-500" strokeWidth={1.5} /> Thumbnail
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h4 className="text-[13px] font-semibold text-[#111318] leading-snug mb-2 line-clamp-2">{short.title}</h4>

        {/* Duration row — platform compatibility */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-white border-[#E2E4E9]">
            <svg width="18" height="18" viewBox="0 0 22 22" className="shrink-0">
              <circle cx="11" cy="11" r={RING_R} fill="none" stroke="#F0F1F4" strokeWidth="3" />
              <circle
                cx="11" cy="11" r={RING_R} fill="none" stroke={ringColor} strokeWidth="3"
                strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - fillRatio)}
                strokeLinecap="round" transform="rotate(-90 11 11)"
                style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.32,0.72,0,1)" }}
              />
            </svg>
            <span style={{ color: ringColor }}>{durationSec}s</span>
          </span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${ytOk ? "bg-red-50 text-red-500 border-red-100" : "bg-neutral-100 text-neutral-400 border-neutral-200 line-through"}`}>
            YT ≤{Math.round(platformLimit / 60)}min {ytOk ? "✓" : "✗"}
          </span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${igOk ? "bg-pink-50 text-pink-500 border-pink-100" : "bg-neutral-100 text-neutral-400 border-neutral-200 line-through"}`}>
            IG ≤{Math.round(platformLimit / 60)}min {igOk ? "✓" : "✗"}
          </span>
          {overLimit && (
            <span className="text-[9px] font-bold text-red-500 ml-auto">Too long!</span>
          )}
        </div>

        <p className="text-[11px] text-amber-600 font-semibold mb-2 line-clamp-1">
          <span className="font-bold">Hook:</span> {short.hook}
        </p>
        <p className="text-[11px] text-neutral-500 line-clamp-2 mb-3 flex-1">{short.description}</p>

        {short.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {short.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">#{tag}</span>
            ))}
            {short.hashtags.length > 3 && <span className="text-[10px] text-neutral-400 font-semibold">+{short.hashtags.length - 3}</span>}
          </div>
        )}

        {/* Publish row — YouTube Shorts + Instagram Reels */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onPublish(short, "youtube_shorts")}
            disabled={!ytOk}
            title={ytOk ? "Publish to YouTube Shorts" : `Clip exceeds ${Math.round(platformLimit / 60)} min YT Shorts limit`}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-semibold transition-colors duration-300 ${ytOk ? "bg-red-500 hover:bg-red-600 text-white shadow-sm" : "bg-neutral-100 text-neutral-300 cursor-not-allowed"}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YT Shorts
          </button>
          <button
            onClick={() => onPublish(short, "instagram_reels")}
            disabled={!igOk}
            title={igOk ? "Publish to Instagram Reels" : `Clip exceeds ${Math.round(platformLimit / 60)} min IG Reels limit`}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-semibold transition-colors duration-300 ${igOk ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white shadow-sm" : "bg-neutral-100 text-neutral-300 cursor-not-allowed"}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            IG Reels
          </button>
        </div>

        {/* Same 9:16 vertical format on both — publish to YT Shorts + IG Reels in one job */}
        <button
          onClick={() => onPublish(short, "both_shorts_reels")}
          disabled={!ytOk || !igOk}
          title={ytOk && igOk ? "Publish to both YouTube Shorts and Instagram Reels" : "Clip exceeds the duration limit for one or both platforms"}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-semibold transition-colors duration-300 mb-2 ${
            ytOk && igOk
              ? "bg-gradient-to-r from-red-500 to-pink-500 hover:brightness-110 text-white shadow-sm"
              : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
          }`}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={1.5} /> Publish to Both
        </button>

        {/* Secondary row — Preview / Thumbnail / Edit / Delete */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#F4F5F8]">
          <button
            onClick={onPreview}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-[var(--t-primary-light)] transition-colors duration-300 border" style={{ color: "var(--t-primary)", borderColor: "var(--t-primary)" }}
          >
            <Play className="w-3 h-3" style={{ fill: "var(--t-primary)" }} strokeWidth={1.5} /> Preview
          </button>
          <button onClick={onGenerateThumbnail} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors duration-300 border border-[#E2E4E9]">
            <Image className="w-3 h-3" strokeWidth={1.5} /> Thumb
          </button>
          <button onClick={onEdit} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors duration-300 border border-indigo-100">
            <Edit2 className="w-3 h-3" strokeWidth={1.5} /> Edit
          </button>
          <button
            onClick={onOpenEditor}
            disabled={isOpeningEditor}
            title="Open in video editor"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors duration-300 border border-emerald-100 disabled:opacity-50"
          >
            {isOpeningEditor ? <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Scissors className="w-3 h-3" strokeWidth={1.5} />} Cut
          </button>
          <button onClick={onDelete} className="ml-auto p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-300">
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Clip Preview Modal — plays the exact segment from YouTube ──

// Lets the user pick how the 16:9 source gets cropped to 9:16 before the clip
// is downloaded — "pillarbox" keeps the whole frame (blurred letterbox filler)
// while "fill" crops the edges to fill the vertical canvas edge to edge.
function VerticalStyleModal({ onClose, onChoose }) {
  const options = [
    {
      key: "pillarbox",
      label: "Blurred Background",
      desc: "Full frame kept, letterboxed with a blurred fill — nothing cropped.",
    },
    {
      key: "fill",
      label: "Full Screen Crop",
      desc: "Zoomed in to fill the whole vertical frame — no bars, edges trimmed.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-black text-[#111318]">Choose Vertical Style</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl text-neutral-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[12px] text-neutral-400 mb-5">How should the 16:9 source fit the 9:16 editor canvas?</p>

        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onChoose(opt.key)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-[#E2E4E9] hover:border-indigo-400 hover:bg-indigo-50/50 transition text-center"
            >
              {/* 9:16 mockup */}
              <div className="relative w-16 bg-neutral-900 rounded-lg overflow-hidden" style={{ aspectRatio: "9/16" }}>
                {opt.key === "pillarbox" ? (
                  <>
                    <div className="absolute inset-0 bg-neutral-600/50" />
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[45%] bg-neutral-300" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-neutral-300" />
                )}
              </div>
              <div>
                <p className="text-[12px] font-black text-[#111318] group-hover:text-indigo-600 transition">{opt.label}</p>
                <p className="text-[10px] text-neutral-400 mt-1 leading-snug">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Loads instantly as a static composited thumbnail (crop + burned title) so
// there's something to look at immediately, but tapping Play swaps in a real
// YouTube IFrame Player seeked to the exact clip range — same as the original
// direct-from-YouTube playback, just lazy-mounted so the drawer doesn't have
// to wait on the IFrame API (or show YouTube's chrome) before showing anything.
function ClipPreviewModal({ short, onClose }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerDivId = useRef(`yt-clip-${short.id}`).current;

  const startSec = tsToSeconds(short.timestampStart);
  const endSec = tsToSeconds(short.timestampEnd);
  const clipDuration = Math.max(endSec - startSec, 1);
  const platformLimit = short.platformLimit || 180;
  const withinLimit = clipDuration <= platformLimit;
  const limitLabel = `${Math.round(platformLimit / 60)}min`;

  const [isPlayingLive, setIsPlayingLive] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [clipEnded, setClipEnded] = useState(false);

  const youtubeWatchUrl = short.videoId
    ? `https://www.youtube.com/watch?v=${short.videoId}&t=${startSec}s`
    : null;

  const startPolling = useCallback((player) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      try {
        const current = player.getCurrentTime();
        const elapsed = Math.max(0, current - startSec);
        setProgress(Math.min(elapsed / clipDuration, 1));
        if (current >= endSec) {
          player.pauseVideo();
          setClipEnded(true);
          setIsPlaying(false);
          clearInterval(intervalRef.current);
        }
      } catch {}
    }, 200);
  }, [startSec, endSec, clipDuration]);

  useEffect(() => {
    if (!isPlayingLive || !short.videoId) return;

    const buildPlayer = () => {
      if (!document.getElementById(playerDivId)) {
        const div = document.createElement("div");
        div.id = playerDivId;
        div.style.width = "100%";
        div.style.height = "100%";
        containerRef.current?.appendChild(div);
      }
      playerRef.current = new window.YT.Player(playerDivId, {
        videoId: short.videoId,
        playerVars: { start: startSec, autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, controls: 1 },
        events: {
          onReady(e) {
            setApiReady(true);
            e.target.seekTo(startSec, true);
            e.target.playVideo();
          },
          onStateChange(e) {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) startPolling(e.target);
            else clearInterval(intervalRef.current);
          },
        },
      });
    };

    if (window.YT?.Player) {
      buildPlayer();
    } else {
      const existing = document.getElementById("yt-api-script");
      if (!existing) {
        const s = document.createElement("script");
        s.id = "yt-api-script";
        s.src = "https://www.youtube.com/iframe_api";
        s.async = true;
        document.head.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); buildPlayer(); };
    }

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
    };
  }, [isPlayingLive, short.videoId, startSec, startPolling, playerDivId]);

  const replay = () => {
    try {
      playerRef.current?.seekTo(startSec, true);
      playerRef.current?.playVideo();
      setClipEnded(false);
      setProgress(0);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[120]">
      {/* Dimmed backdrop over the grid — click to close */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Slide-in drawer from the right */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        className="absolute top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F5F8] shrink-0">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Clip Preview</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-neutral-400 transition-colors duration-300">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 9:16 shell — looks like a phone screen */}
          <div
            className="relative mx-auto bg-black rounded-[1.75rem] overflow-hidden shadow-xl"
            style={{ aspectRatio: "9/16", maxWidth: 260 }}
          >
            {isPlayingLive ? (
              <>
                {/* Live YouTube player, seeked to the exact clip range */}
                <div ref={containerRef} className="absolute inset-0" />

                {!apiReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="w-7 h-7 border-[3px] border-t-transparent border-amber-400 rounded-full animate-spin" />
                  </div>
                )}

                {clipEnded && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80">
                    <p className="text-white font-black text-sm">Clip ended</p>
                    <button
                      onClick={replay}
                      className="flex items-center gap-2 text-white px-4 py-2 rounded-full text-sm font-black hover:brightness-110 transition-all duration-300 btn-primary"
                    >
                      <RotateCcw className="w-4 h-4" strokeWidth={1.5} /> Replay
                    </button>
                  </div>
                )}

                {/* Custom progress bar — shows CLIP progress, not the full video */}
                <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pt-8 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                  <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: "var(--t-primary)" }} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.2 }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Thumbnail cropped to fill the vertical frame — same framing the
                    real Short/Reel upload will have. */}
                {short.videoId ? (
                  <img
                    src={ytThumbnail(short.videoId)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${short.videoId}/hqdefault.jpg`; e.target.onerror = null; }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-800" />
                )}

                {/* Darken for text legibility, burn the title on top like the final upload would */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />
                <div className="absolute inset-0 flex items-center justify-center p-5">
                  <p className="text-white font-black text-base text-center leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
                    {short.title}
                  </p>
                </div>

                {/* Play — swaps in the real YouTube player, seeked to this clip's range */}
                {short.videoId && (
                  <button
                    onClick={() => setIsPlayingLive(true)}
                    className="absolute inset-0 z-10 flex items-center justify-center group"
                  >
                    <span className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition">
                      <Play className="w-6 h-6 ml-0.5" style={{ color: "var(--t-primary)", fill: "var(--t-primary)" }} />
                    </span>
                  </button>
                )}

                {/* Duration + platform limit badges — bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-3 pt-8 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white">
                      {clipDuration}s
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${withinLimit ? "text-red-400 bg-red-500/10" : "text-neutral-500 bg-white/5"}`}>
                      YT ≤{limitLabel} {withinLimit ? "✓" : "✗"}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${withinLimit ? "text-pink-400 bg-pink-500/10" : "text-neutral-500 bg-white/5"}`}>
                      IG ≤{limitLabel} {withinLimit ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Timestamp pill — top */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur rounded-full text-white text-[10px] font-black border border-white/10 pointer-events-none">
              <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
              {short.timestampStart} → {short.timestampEnd}
            </div>

            {/* Real watch-through on YouTube.com, if they'd rather open it there */}
            {youtubeWatchUrl && (
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur rounded-full text-white text-[10px] font-black border border-white/10 hover:bg-black/90 transition-colors duration-300"
              >
                <FaYoutube className="w-2.5 h-2.5 text-red-500" /> Watch
              </a>
            )}
          </div>

          {/* Title */}
          <p className="text-[14px] font-semibold text-[#111318] leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{short.title}</p>

          {/* Hook */}
          {short.hook && (
            <div className="px-3 py-2 rounded-2xl border" style={{ background: "var(--t-primary-light)", borderColor: "color-mix(in srgb, var(--t-primary) 20%, transparent)" }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "var(--t-primary)" }}>Hook</p>
              <p className="text-neutral-700 text-[12px]">&ldquo;{short.hook}&rdquo;</p>
            </div>
          )}

          {/* Description */}
          {short.description && (
            <p className="text-[12px] text-neutral-500">{short.description}</p>
          )}

          {/* Hashtags */}
          {short.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {short.hashtags.map((tag) => (
                <span key={tag} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Short Detail/Edit Modal ──

function ShortDetailModal({ short, sourceUrl, videoInfo, onClose, onSave }) {
  const [title, setTitle] = useState(short.title || "");
  const [description, setDescription] = useState(short.description || "");
  const [hook, setHook] = useState(short.hook || "");
  const [hashtags, setHashtags] = useState((short.hashtags || []).join(", "));
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingDesc, setIsRegeneratingDesc] = useState(false);

  const regenerateField = async (field) => {
    if (field === "title") setIsRegeneratingTitle(true);
    else setIsRegeneratingDesc(true);
    try {
      const res = await fetch("/api/generate-shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: sourceUrl,
          platform: "both",
          count: 1,
          timestampStart: short.timestampStart,
          timestampEnd: short.timestampEnd,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `API error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let found = false;
      while (!found) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const result = JSON.parse(trimmed);
            if (result.__meta || !result.index) continue;
            if (field === "title") setTitle(result.title);
            else { setDescription(result.description); setHook(result.hook); }
            found = true;
            break;
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegeneratingTitle(false);
      setIsRegeneratingDesc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-2xl bg-white rounded-[1.75rem] shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] border border-[#E2E4E9] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#F4F5F8] flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Edit Short</h3>
              <p className="text-[11px] text-neutral-400">Clip #{short.index} · {short.timestampStart} → {short.timestampEnd}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors duration-300 text-neutral-400">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Source video reference with thumbnail */}
          {short.videoId && (
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl">
              <img
                src={ytThumbnail(short.videoId)}
                alt="Source video"
                className="w-20 aspect-video rounded-xl object-cover border border-[#E2E4E9] shrink-0"
                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${short.videoId}/hqdefault.jpg`; e.target.onerror = () => { e.target.src = `https://img.youtube.com/vi/${short.videoId}/mqdefault.jpg`; e.target.onerror = null; }; }}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Source Video</p>
                <p className="text-[12px] font-bold text-[#111318] line-clamp-1">{videoInfo?.title || sourceUrl}</p>
                {videoInfo?.channel && <p className="text-[11px] text-neutral-400">{videoInfo.channel}</p>}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Title</label>
              <button
                onClick={() => regenerateField("title")}
                disabled={isRegeneratingTitle}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors duration-300 disabled:opacity-50"
              >
                {isRegeneratingTitle ? <RotateCcw className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Wand2 className="w-3 h-3" strokeWidth={1.5} />}
                Regenerate
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/15 transition-all duration-300"
            />
            <p className="text-[10px] text-neutral-400 mt-1 px-1">{title.length}/60 chars</p>
          </div>

          {/* Hook */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-1">Opening Hook (first 3 sec)</label>
            <input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="The hook that grabs attention immediately..."
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/15 transition-all duration-300"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Description</label>
              <button
                onClick={() => regenerateField("description")}
                disabled={isRegeneratingDesc}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors duration-300 disabled:opacity-50"
              >
                {isRegeneratingDesc ? <RotateCcw className="w-3 h-3 animate-spin" strokeWidth={1.5} /> : <Wand2 className="w-3 h-3" strokeWidth={1.5} />}
                Regenerate
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/15 transition-all duration-300 resize-none"
            />
            <p className="text-[10px] text-neutral-400 mt-1 px-1">{description.length}/300 chars</p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-1">Hashtags (comma separated)</label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" strokeWidth={1.5} />
              <input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="coding, webdev, javascript, tutorial, tips"
                className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full pl-9 pr-4 py-3 text-sm font-medium outline-none focus:border-amber-400 focus:ring-[3px] focus:ring-amber-400/15 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#F4F5F8] flex items-center justify-end gap-3 bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#E2E4E9] text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
            Cancel
          </button>
          <button
            onClick={() => onSave({ title, description, hook, hashtags: hashtags.split(",").map((h) => h.trim()).filter(Boolean) })}
            className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all duration-300 hover:brightness-110 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Thumbnail Generator Modal ──

const THUMBNAIL_STYLES = [
  { id: 0, label: "Bold Text", desc: "High-contrast title overlay on gradient", gradient: "from-indigo-600 to-purple-700" },
  { id: 1, label: "Neon Hook", desc: "Dark background with glowing accent text", gradient: "from-gray-900 to-gray-800" },
  { id: 2, label: "Warm Minimal", desc: "Clean warm tones with large typography", gradient: "from-amber-500 to-orange-500" },
  { id: 3, label: "Cool Blue", desc: "Professional blue palette for tutorials", gradient: "from-blue-600 to-cyan-500" },
  { id: 4, label: "Vibrant Pop", desc: "Bold complementary colors that stand out", gradient: "from-rose-500 to-pink-600" },
];

function ThumbnailGeneratorModal({ short, onClose, onApply }) {
  const [selected, setSelected] = useState(short.thumbnailStyle ?? 0);
  const [overlayOpacity, setOverlayOpacity] = useState(60); // 0-100
  const [showTitle, setShowTitle] = useState(true);
  const [customTitle, setCustomTitle] = useState(short.title || "");

  const randomize = () => setSelected(Math.floor(Math.random() * THUMBNAIL_STYLES.length));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-2xl bg-white rounded-[1.75rem] shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] border border-[#E2E4E9] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#F4F5F8] flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Image className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Thumbnail Editor</h3>
              <p className="text-[11px] text-neutral-400 truncate max-w-xs">{short.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors duration-300 text-neutral-400">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Two-column: 9:16 preview LEFT, controls RIGHT */}
          <div className="flex gap-5">
            {/* 9:16 thumbnail preview — correct Shorts/Reels format */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">9:16 Preview</p>
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-300 bg-black shadow-xl"
                style={{ width: 120, height: 213 /* 120 × 16/9 */ }}>
                {short.videoId ? (
                  <img
                    src={ytThumbnail(short.videoId)}
                    alt="thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${short.videoId}/hqdefault.jpg`; e.target.onerror = () => { e.target.src = `https://img.youtube.com/vi/${short.videoId}/mqdefault.jpg`; e.target.onerror = null; }; }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
                    <Image className="w-6 h-6 text-neutral-500" />
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${THUMBNAIL_STYLES[selected].gradient}`} style={{ opacity: overlayOpacity / 100 }} />
                {showTitle && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-white font-black text-[10px] leading-tight drop-shadow line-clamp-3">{customTitle || short.title}</p>
                    <p className="text-white/50 text-[8px] mt-0.5">{short.timestampStart}–{short.timestampEnd}</p>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 rounded text-white text-[8px] font-black">
                  {THUMBNAIL_STYLES[selected].label}
                </div>
              </div>
              <span className="text-[9px] text-purple-500 font-bold">1080×1920</span>
            </div>

            {/* Right side controls */}
            <div className="flex-1 space-y-4">
              {/* Style selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Style</label>
                  <button onClick={randomize} className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 transition-colors duration-300">
                    <RefreshCw className="w-3 h-3" strokeWidth={1.5} /> Random
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {THUMBNAIL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelected(style.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${selected === style.id ? "border-purple-500 shadow-md scale-105" : "border-transparent hover:border-purple-200"}`}
                    >
                      <div className={`aspect-[9/16] bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
                        <span className="text-[6px] font-black text-white text-center px-0.5 leading-tight drop-shadow">{style.label}</span>
                      </div>
                      {selected === style.id && (
                        <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" strokeWidth={2} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5">{THUMBNAIL_STYLES[selected].desc}</p>
              </div>

              {/* Opacity */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">
                  Overlay — {overlayOpacity}%
                </label>
                <input type="range" min={0} max={90} value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Title toggle */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Title Overlay</label>
                <button
                  onClick={() => setShowTitle(!showTitle)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors duration-300 w-full justify-center ${showTitle ? "bg-purple-50 border-purple-200 text-purple-600" : "bg-[#F9FAFB] border-[#E2E4E9] text-neutral-400"}`}
                >
                  <Eye className={`w-3.5 h-3.5 ${!showTitle ? "opacity-40" : ""}`} strokeWidth={1.5} />
                  {showTitle ? "Showing Title" : "Title Hidden"}
                </button>
              </div>
            </div>
          </div>

          {/* Custom title text */}
          {showTitle && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block px-1">Thumbnail Title</label>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={short.title}
                className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-3 text-sm font-bold outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-400/15 transition-all duration-300"
              />
            </div>
          )}

        </div>

        {/* Footer — Apply always enabled */}
        <div className="px-7 py-4 border-t border-[#F4F5F8] flex items-center justify-end gap-3 bg-[#FAFBFC]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#E2E4E9] text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
            Cancel
          </button>
          <button
            onClick={() => onApply(selected, { overlayOpacity, showTitle, customTitle })}
            className="px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all duration-300 hover:brightness-110 bg-gradient-to-r from-purple-500 to-pink-500 shadow-md"
          >
            Apply Thumbnail
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// YOUTUBE SERIES – AI EPISODE GENERATOR MODAL
// ============================================================

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
    title: [`${name} #${i + 1}: Quick Tip`, `Did You Know? ${name} Secret`, `${name} in 60 Seconds`, `Most People Get ${name} Wrong`, `The Fastest Way to ${name}`, `Stop Making This ${name} Mistake`][i % 6],
    duration: "< 60 sec",
  })),
  Project: (name, n) => Array.from({ length: n }, (_, i) => ({
    ep: i + 1,
    title: [`Project Kickoff — Planning ${name}`, `Setting Up the Architecture`, `Building Core Features`, `Connecting the Backend`, `Polishing the UI`, `Launch & What I Learned`][i % 6],
    duration: `${20 + Math.floor(Math.random() * 30)} min`,
  })),
  Playlist: (name, n) => Array.from({ length: n }, (_, i) => ({ ep: i + 1, title: `${name} — Part ${i + 1}`, duration: `${10 + Math.floor(Math.random() * 20)} min` })),
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
      setSelected(result.map((e) => e.ep));
      setLoading(false);
    }, 1600);
  };

  const toggleEp = (ep) => setSelected((prev) => (prev.includes(ep) ? prev.filter((x) => x !== ep) : [...prev, ep]));

  const copyToClipboard = () => {
    const text = (episodes || []).filter((e) => selected.includes(e.ep)).map((e) => `Ep ${e.ep}: ${e.title} [${e.duration}]`).join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative w-full max-w-xl bg-white rounded-[1.75rem] shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] border border-[#E2E4E9] overflow-hidden flex flex-col max-h-[88vh]"
      >
        <div className="px-7 py-5 border-b border-[#F4F5F8] flex items-center justify-between" style={{ background: "linear-gradient(135deg, var(--t-primary-light), transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--t-primary), var(--t-secondary))" }}>
              <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI Episode Generator</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">{series.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors duration-300 text-neutral-400"><X className="w-4 h-4" strokeWidth={1.5} /></button>
        </div>

        <div className="px-7 py-4 border-b border-[#F4F5F8] flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest whitespace-nowrap">Episodes to generate</label>
            <input
              type="number" min={1} max={20} value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              className="w-16 px-3 py-1.5 rounded-full border border-[#E2E4E9] text-[13px] font-bold text-center focus:outline-none focus:border-[var(--t-primary)] transition-colors duration-300"
            />
          </div>
          <button
            onClick={generate} disabled={loading}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-white text-[13px] font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 btn-primary"
          >
            {loading ? <><RotateCcw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> Generating…</> : <><Wand2 className="w-3.5 h-3.5" strokeWidth={1.5} /> {episodes ? "Regenerate" : "Generate"}</>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          {!episodes && !loading && (
            <div className="flex flex-col items-center justify-center py-14 text-neutral-300">
              <Sparkles className="w-10 h-10 mb-3" strokeWidth={1.5} />
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
              {episodes.map((ep) => (
                <div
                  key={ep.ep}
                  onClick={() => toggleEp(ep.ep)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer border transition-colors duration-300 ${selected.includes(ep.ep) ? "border-[var(--t-primary)] bg-[var(--t-primary-light)]" : "border-[#F0F0F0] hover:border-[#E2E4E9] bg-white hover:bg-[#F9FAFB]"}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 transition-colors duration-300 ${selected.includes(ep.ep) ? "text-white" : "bg-[#F4F5F8] text-neutral-500"}`} style={selected.includes(ep.ep) ? { backgroundColor: "var(--t-primary)" } : {}}>
                    {selected.includes(ep.ep) ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : ep.ep}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111318] truncate">{ep.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.5} />{ep.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {episodes && !loading && (
          <div className="px-7 py-4 border-t border-[#F4F5F8] flex items-center justify-between gap-3">
            <span className="text-[12px] text-neutral-400">{selected.length} of {episodes.length} selected</span>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E4E9] text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} /> Copied!</> : <><ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} /> Copy</>}
              </button>
              <button onClick={onClose} className="px-5 py-2 rounded-full text-white text-[13px] font-semibold transition-all duration-300 hover:brightness-110 btn-primary">Done</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================
// SERIES CARD
// ============================================================

function SeriesCard({ series: s, onEdit, onDuplicate, onArchive, onDelete, onAIGenerate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const progress = s.episodes ? Math.round((s.completed / s.episodes) * 100) : 0;

  const previewEpisodes = [
    { title: "Javascript Backend Roadmap | chai aur code", duration: "29:20" },
    { title: "How to deploy backend code in production", duration: "50:14" },
  ];

  return (
    <div className={`group bg-white border border-[#E2E4E9] rounded-[1.75rem] overflow-hidden transition-all duration-300 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.14)] ${s.archived ? "opacity-70 grayscale-[0.5]" : ""}`}>
      <Link href={`/series/${s.id}`} className="relative block aspect-video overflow-hidden">
        <EpisodeThumbnail title={s.name} size="full" rounded="rounded-none" epNumber={null} showPlay />
        <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-black/80 backdrop-blur rounded-full text-[10px] font-black text-white flex items-center gap-1.5 border border-white/10 z-10">
          <ListVideo className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{s.episodes} VIDEOS</span>
        </div>
      </Link>

      <div className="w-full h-[4px] bg-neutral-100">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-600" />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="min-w-0">
            <div className="mb-2"><StatusBadge type={s.type} /></div>
            <Link href={`/series/${s.id}`}>
              <h3 className="text-lg font-semibold text-[#111318] leading-tight hover:text-indigo-600 transition-colors duration-300 line-clamp-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.name}</h3>
            </Link>
            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{s.description || "No description provided."}</p>
          </div>

          <div className="relative shrink-0">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 text-neutral-400 hover:text-[#0F0F0F] hover:bg-[#F4F5F8] rounded-full transition-colors duration-300">
              <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E2E4E9] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] z-50 p-1.5"
                  >
                    <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-indigo-600 rounded-full transition-colors duration-300 uppercase tracking-wider"><Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit</button>
                    <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-blue-600 rounded-full transition-colors duration-300 uppercase tracking-wider"><Copy className="w-3.5 h-3.5" strokeWidth={1.5} /> Duplicate</button>
                    <button onClick={() => { onArchive(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-amber-600 rounded-full transition-colors duration-300 uppercase tracking-wider"><Archive className="w-3.5 h-3.5" strokeWidth={1.5} /> {s.archived ? "Restore" : "Archive"}</button>
                    <div className="h-px bg-[#F4F5F8] my-1 mx-2" />
                    <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors duration-300 uppercase tracking-wider"><Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Delete</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          {previewEpisodes.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 group/ep cursor-pointer">
              <div className="w-5 h-5 rounded-full bg-[#F4F5F8] flex items-center justify-center border border-[#E2E4E9] shrink-0">
                <span className="text-[9px] font-bold text-neutral-500">{i + 1}</span>
              </div>
              <p className="text-[12px] font-medium text-neutral-500 group-hover:text-indigo-600 transition-colors duration-300 truncate">{ep.title}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#F4F5F8] flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{s.completed}/{s.episodes} EP</span>
          <div className="flex items-center gap-2">
            <button onClick={onAIGenerate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 hover:brightness-110 text-white btn-primary">
              <Sparkles className="w-3 h-3" strokeWidth={1.5} /> AI Episodes
            </button>
            <Link href={`/series/${s.id}`} className="text-[11px] font-bold text-neutral-400 hover:text-indigo-600 flex items-center gap-1 transition-colors duration-300 uppercase tracking-wider">
              View <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
