"use client";

import { useState, useMemo, useEffect } from "react";
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
  Play
} from "lucide-react";
import { FaYoutube, FaTiktok, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";

// ---------- Mock Data & Constants ----------

const INITIAL_SERIES = [
  { 
    id: 1, 
    name: "Next.js Masterclass", 
    episodes: 12, 
    completed: 4, 
    type: "Course", 
    description: "Deep dive into Next.js 14 App Router, Server Actions, and Auth.",
    platforms: ["YouTube"],
    lastUpdated: "2026-04-28T10:00:00Z",
    estCompletion: "2026-06-15",
    archived: false
  },
  { 
    id: 2, 
    name: "Daily Tech News", 
    episodes: 30, 
    completed: 18, 
    type: "Shorts", 
    description: "Daily bite-sized tech updates for TikTok and Reels.",
    platforms: ["TikTok", "Instagram"],
    lastUpdated: "2026-04-29T15:30:00Z",
    estCompletion: "2026-05-30",
    archived: false
  },
  { 
    id: 3, 
    name: "Build a CMS with AI", 
    episodes: 5, 
    completed: 1, 
    type: "Project", 
    description: "Step-by-step guide to building a modern CMS using AI tools.",
    platforms: ["YouTube", "Twitter"],
    lastUpdated: "2026-04-25T09:15:00Z",
    estCompletion: "2026-05-10",
    archived: false
  },
];

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
  const [series, setSeries] = useState(INITIAL_SERIES);
  const [view, setView] = useState("grid"); // grid | list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'lastUpdated', direction: 'desc' });

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
    const totalEpisodes = active.reduce((acc, s) => acc + s.episodes, 0);
    const completedEpisodes = active.reduce((acc, s) => acc + s.completed, 0);
    const avgCompletion = totalEpisodes ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0;
    
    return {
      total: active.length,
      active: active.filter(s => s.completed < s.episodes).length,
      episodes: totalEpisodes,
      avg: avgCompletion
    };
  }, [series]);

  // Sorting Logic
  const sortedSeries = useMemo(() => {
    const sortable = [...series];
    sortable.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
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

  const handleSaveSeries = (e) => {
    e.preventDefault();
    if (editingSeries) {
      setSeries(series.map(s => s.id === editingSeries.id ? { ...s, ...formData, lastUpdated: new Date().toISOString() } : s));
    } else {
      setSeries([{
        id: Date.now(),
        ...formData,
        completed: 0,
        lastUpdated: new Date().toISOString(),
        archived: false
      }, ...series]);
    }
    setIsModalOpen(false);
  };

  const handleDuplicate = (s) => {
    const duplicate = {
      ...s,
      id: Date.now(),
      name: `${s.name} (Copy)`,
      completed: 0,
      lastUpdated: new Date().toISOString()
    };
    setSeries([duplicate, ...series]);
  };

  const handleArchive = (id) => {
    setSeries(series.map(s => s.id === id ? { ...s, archived: !s.archived } : s));
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seriesToDelete, setSeriesToDelete] = useState(null);

  const handleDeleteClick = (s) => {
    setSeriesToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (seriesToDelete) {
      setSeries(series.filter(s => s.id !== seriesToDelete.id));
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
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E2E4E9] shadow-sm">
                          <img 
                            src={`/thumbnails/series_thumb${(s.id % 3) + 1}.png`} 
                            alt={s.name}
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
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${Math.round((s.completed / s.episodes) * 100)}%` }}></div>
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
                
                <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">{editingSeries ? "Save Changes" : "Create Series"}</button>
              </form>
            </motion.div>
          </div>
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

// ---------- Sub-components ----------

function SeriesCard({ series: s, onEdit, onDuplicate, onArchive, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const progress = Math.round((s.completed / s.episodes) * 100);

  // Mock episodes for preview
  const previewEpisodes = [
    { title: "Javascript Backend Roadmap | chai aur code", duration: "29:20" },
    { title: "How to deploy backend code in production", duration: "50:14" },
  ];

  return (
    <div className={`group bg-white border border-[#E2E4E9] rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${s.archived ? 'opacity-70 grayscale-[0.5]' : ''}`} style={{ borderWidth: '0.5px', borderRadius: '12px' }}>
      {/* 16:9 Thumbnail at top */}
      <Link href={`/series/${s.id}`} className="relative block aspect-video overflow-hidden group/thumb">
        <img 
          src={`/thumbnails/series_thumb${(s.id % 3) + 1}.png`} 
          alt={s.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
        />
        {/* Video count overlay badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur rounded text-[10px] font-black text-white flex items-center gap-1.5 border border-white/10">
          <ListVideo className="w-3.5 h-3.5" />
          <span>{s.episodes} VIDEOS</span>
        </div>
      </Link>

      {/* Indigo Progress Bar beneath thumbnail */}
      <div className="w-full h-[3px] bg-neutral-100">
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

        {/* Footer row with completion % and "View all episodes" link */}
        <div className="pt-4 border-t border-[#F4F5F8] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-bold text-indigo-600">{progress}% <span className="text-neutral-300 font-medium">Done</span></span>
          </div>
          <Link href={`/series/${s.id}`} className="text-[11px] font-bold text-neutral-400 hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase tracking-wider">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
