"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeft, 
  Edit3, 
  GripVertical, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Play, 
  FileText, 
  Video, 
  Trash2,
  Calendar,
  ChevronRight,
  Filter,
  BarChart2,
  ListOrdered,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { SERIES_LOOKUP } from "@/lib/mock-data";

// ---------- Mock Data Generator ----------

const getMockEpisodes = (seriesId) => {
  const series = SERIES_LOOKUP[seriesId] || SERIES_LOOKUP["1"];
  const total = series.episodes;
  const completed = series.completed;
  
  return Array.from({ length: total }, (_, i) => ({
    id: 100 + i,
    number: i + 1,
    title: i === 0 ? "Introduction & Setup" : `Episode ${i + 1}`,
    status: i < completed ? "Published" : i === completed ? "Edited" : "Draft",
    duration: `${Math.floor(Math.random() * 20) + 5}:00`,
    dueDate: format(new Date(2026, 3, i + 1), "yyyy-MM-dd")
  }));
};

const STATUS_CONFIG = {
  Draft: { color: "bg-neutral-100 text-neutral-500 border-neutral-200", hex: "#9CA3AF" },
  Scripted: { color: "bg-blue-50 text-blue-600 border-blue-100", hex: "#6366F1" },
  Filmed: { color: "bg-amber-50 text-amber-600 border-amber-100", hex: "#F59E0B" },
  Edited: { color: "bg-orange-50 text-orange-600 border-orange-100", hex: "#F97316" },
  Published: { color: "bg-emerald-50 text-emerald-600 border-emerald-100", hex: "#10B981" },
};

// ---------- Main Page Component ----------

export default function SeriesDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const seriesInfo = SERIES_LOOKUP[id] || SERIES_LOOKUP["1"];
  
  const [episodes, setEpisodes] = useState([]);
  
  useEffect(() => {
    setEpisodes(getMockEpisodes(id));
  }, [id]);
  const [filter, setFilter] = useState("All");
  const [selectedEpisodes, setSelectedEpisodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: seriesInfo.name,
    description: seriesInfo.description || "",
    type: seriesInfo.type || "Series",
    episodes: seriesInfo.episodes || 10,
    estCompletion: seriesInfo.estCompletion || format(new Date(), "yyyy-MM-dd")
  });

  // Derived Stats
  const stats = useMemo(() => {
    const counts = episodes.reduce((acc, ep) => {
      acc[ep.status] = (acc[ep.status] || 0) + 1;
      return acc;
    }, {});
    
    // Formula from requirement: episodes.filter(e => e.status === 'Published').length / episodes.length * 100
    const publishedCount = counts.Published || 0;
    const completionPercent = episodes.length > 0 
      ? Math.round((publishedCount / episodes.length) * 100) 
      : 0;
    
    return {
      total: episodes.length,
      published: publishedCount,
      completion: completionPercent,
      byStatus: counts
    };
  }, [episodes]);

  const filteredEpisodes = episodes.filter(ep => filter === "All" || ep.status === filter);

  // Handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("draggedIndex", index);
  };

  const handleDrop = (e, targetIndex) => {
    const draggedIndex = e.dataTransfer.getData("draggedIndex");
    if (draggedIndex === targetIndex.toString()) return;

    const newEpisodes = [...episodes];
    const [draggedItem] = newEpisodes.splice(draggedIndex, 1);
    newEpisodes.splice(targetIndex, 0, draggedItem);
    
    // Update episode numbers
    const updated = newEpisodes.map((ep, idx) => ({ ...ep, number: idx + 1 }));
    setEpisodes(updated);
  };

  const handleAddEpisode = () => {
    router.push(`/add-content?seriesId=${id}&seriesName=${encodeURIComponent(seriesInfo.name)}&title=${encodeURIComponent(`Episode ${episodes.length + 1}`)}`);
  };

  const toggleSelect = (id) => {
    setSelectedEpisodes(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateEpisode = (id, updates) => {
    setEpisodes(episodes.map(ep => ep.id === id ? { ...ep, ...updates } : ep));
  };

  const [episodeToDelete, setEpisodeToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const handleBulkAction = (action) => {
    if (action === "Delete") {
      setIsBulkDeleteModalOpen(true);
    } else {
      setEpisodes(episodes.map(ep => selectedEpisodes.includes(ep.id) ? { ...ep, status: action } : ep));
      setSelectedEpisodes([]);
    }
  };

  const confirmBulkDelete = () => {
    setEpisodes(episodes.filter(ep => !selectedEpisodes.includes(ep.id)));
    setSelectedEpisodes([]);
    setIsBulkDeleteModalOpen(false);
  };

  const [episodeToPreview, setEpisodeToPreview] = useState(null);

  const confirmEpisodeDelete = () => {
    if (episodeToDelete) {
      setEpisodes(episodes.filter(ep => ep.id !== episodeToDelete.id));
      setEpisodeToDelete(null);
    }
  };

  const handleSaveSeries = (e) => {
    e.preventDefault();
    // In a real app, this would be an API call
    setIsEditModalOpen(false);
  };

  const handleDeleteSeries = () => {
    // In a real app, this would be an API call
    router.push('/series');
  };

  return (
    <div className="space-y-8 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/series')}
            className="p-3 bg-white border border-[#E2E4E9] rounded-2xl text-[#8A91A8] hover:text-[#0F0F0F] transition-all hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="relative w-48 aspect-video rounded-[24px] overflow-hidden shadow-2xl border-4 border-white shrink-0 bg-[#F4F5F8]">
              <img 
                src="/thumbnails/series_cover.png" 
                alt={seriesInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/series" className="text-sm font-medium text-[#9CA3AF] hover:text-indigo-600 transition-colors">Series Planner</Link>
                <span className="text-sm text-[#9CA3AF]">/</span>
                <h2 className="text-2xl font-black text-[#0A0A0F] tracking-tighter">{seriesInfo.name}</h2>
              </div>
              <p className="text-xs text-[#8A91A8] font-medium">Managing {episodes.length} episodes for this {seriesInfo.type.toLowerCase()}.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-16 h-16">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle
                className="text-neutral-200"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
              <circle
                className="text-indigo-600 transition-all duration-1000"
                strokeWidth="4"
                strokeDasharray={28 * 2 * Math.PI}
                strokeDashoffset={(28 * 2 * Math.PI) - (stats.completion / 100) * (28 * 2 * Math.PI)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-black text-[#0F0F0F]">{stats.completion}%</span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E4E9] rounded-xl text-sm font-bold text-[#4B5264] hover:bg-[#F9FAFB] transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            Edit Series
          </button>
        </div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-2xl bg-white border border-[#E2E4E9] rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-8 border-b border-[#F4F5F8] flex justify-between items-center bg-[#FAFBFC]">
                <h3 className="text-2xl font-black text-[#0F0F0F]">Edit Series</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-[#F4F5F8] rounded-xl transition-colors"><Plus className="w-6 h-6 text-neutral-400 rotate-45" /></button>
              </div>
              <form onSubmit={handleSaveSeries} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Series Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all h-32 resize-none" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setIsDeleteModalOpen(true); }} className="px-6 py-4 rounded-2xl bg-red-50 text-red-600 text-sm font-black uppercase tracking-widest hover:bg-red-100 transition-all">Delete Series</button>
                  <button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white border border-[#E2E4E9] rounded-[32px] p-8 shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#0F0F0F] mb-2">Delete this series?</h3>
              <p className="text-sm font-medium text-neutral-400 mb-8">This action is permanent and will delete all {episodes.length} episodes and their associated data.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl border border-[#E2E4E9] text-sm font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={handleDeleteSeries} className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Individual Episode Delete Confirmation */}
        {episodeToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEpisodeToDelete(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#0F0F0F] mb-2">Delete Episode?</h3>
              <p className="text-xs font-medium text-neutral-400 mb-6">Are you sure you want to delete "{episodeToDelete.title}"? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setEpisodeToDelete(null)} className="flex-1 py-3 rounded-xl border border-[#E2E4E9] text-xs font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={confirmEpisodeDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Bulk Delete Confirmation */}
        {isBulkDeleteModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkDeleteModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#0F0F0F] mb-2">Delete {selectedEpisodes.length} Episodes?</h3>
              <p className="text-xs font-medium text-neutral-400 mb-6">This will permanently remove all selected episodes from this series.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl border border-[#E2E4E9] text-xs font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-all">Cancel</button>
                <button onClick={confirmBulkDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Delete All</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Episode Preview Drawer */}
        {episodeToPreview && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEpisodeToPreview(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col h-full overflow-hidden"
            >
              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Cover Image Section */}
                <div className="relative aspect-video w-full bg-[#F4F5F8]">
                  <img 
                    src={`/thumbnails/thumb${(episodes.indexOf(episodeToPreview) % 3) + 1}.png`} 
                    alt={episodeToPreview.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <button onClick={() => setEpisodeToPreview(null)} className="absolute top-6 left-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all z-20">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">Episode {episodeToPreview.number}</span>
                      <span className={`px-3 py-1 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-white`}>{episodeToPreview.status}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter leading-tight">{episodeToPreview.title}</h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-10 bg-white">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="flex items-center justify-between py-4 border-b border-[#F4F5F8]">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Duration</label>
                        <div className="flex items-center gap-2 text-[#0F0F0F]">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <p className="text-sm font-black">{episodeToPreview.duration}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Due Date</label>
                        <div className="flex items-center gap-2 text-[#0F0F0F] justify-end">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <p className="text-sm font-black">{format(new Date(episodeToPreview.dueDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Platform Distribution</label>
                      <div className="flex gap-2">
                        {["YouTube", "Shorts", "TikTok"].map(p => (
                          <span key={p} className="px-3 py-1.5 bg-[#F4F5F8] text-[#4B5264] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#E2E4E9]">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Production Overview</label>
                    <div className="bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F4F5F8] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-20" />
                      <p className="text-sm leading-relaxed text-[#4B5264] font-medium italic">
                        "In this session, we analyze the core logic and design systems. The goal is to provide a comprehensive walkthrough that bridges theory with practical implementation, focusing on performance and scalability."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-8 bg-white border-t border-[#F4F5F8] flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                <button 
                  onClick={() => {
                    router.push(`/add-content?edit=${episodeToPreview.id}`);
                    setEpisodeToPreview(null);
                  }}
                  className="w-full py-4 bg-[#0F0F0F] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                >
                  <Edit3 className="w-4 h-4" />
                  Full Editorial Suite
                </button>
                <button className="w-full py-4 bg-white border border-[#E2E4E9] rounded-2xl text-sm font-black uppercase tracking-widest text-[#4B5264] hover:bg-[#F9FAFB] transition-all">
                  Schedule Release
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-full">
        {/* ── EPISODE LIST ── */}
        <div className="space-y-6">
          {/* Filters & Bulk Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center p-1 bg-[#F4F5F8] rounded-xl border border-[#E2E4E9]">
              {["All", "Draft", "Scripted", "Filmed", "Edited", "Published"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  <span className="flex items-center gap-2">
                    {f}
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f ? 'bg-indigo-50 text-indigo-600' : 'bg-neutral-200 text-neutral-500'}`}>
                      {f === "All" ? episodes.length : stats.byStatus[f] || 0}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {selectedEpisodes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-indigo-600 text-white p-1 rounded-xl shadow-lg"
              >
                <span className="px-3 text-xs font-black">{selectedEpisodes.length} Selected</span>
                <div className="flex gap-1">
                  <button onClick={() => handleBulkAction("Published")} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">Publish</button>
                  <button onClick={() => handleBulkAction("Delete")} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-[10px] font-black uppercase tracking-widest">Delete</button>
                </div>
              </motion.div>
            )}
          </div>

          {/* List Container */}
          <div className="space-y-3">
            {filteredEpisodes.map((ep, idx) => (
              <motion.div 
                key={ep.id}
                draggable
                onDragStart={(e) => handleDragStart(e, episodes.indexOf(ep))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, episodes.indexOf(ep))}
                className={`group relative flex items-center gap-4 bg-white border border-[#E2E4E9] p-3 rounded-2xl hover:shadow-md transition-all ${editingId === ep.id ? 'border-indigo-500 bg-indigo-50/10' : ''}`}
              >
                {/* 1. Selection & Index */}
                <div className="flex items-center gap-6 px-2 shrink-0">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedEpisodes.includes(ep.id)}
                      onChange={() => toggleSelect(ep.id)}
                      className="w-5 h-5 rounded-md border-[#E2E4E9] text-indigo-600 focus:ring-indigo-500/20 transition-all cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="text-[13px] font-black text-neutral-300 w-4 text-center tracking-tighter">
                    {ep.number}
                  </div>
                  <div className="text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. Enhanced Thumbnail Container (Trigger for Preview) */}
                <div 
                  onClick={() => setEpisodeToPreview(ep)}
                  className="relative shrink-0 w-44 aspect-video rounded-xl overflow-hidden bg-[#F4F5F8] border border-black/[0.03] cursor-pointer group/thumb"
                >
                  <img 
                    src={`/thumbnails/thumb${(idx % 3) + 1}.png`} 
                    alt={ep.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* YouTube Style Duration Pill */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-[#0F0F0F]/90 text-white text-[10px] font-black rounded-md tracking-tight">
                    {ep.duration}
                  </div>

                  {/* Play Button Overlay (Direct Preview Trigger) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 text-indigo-600 fill-indigo-600 ml-0.5" />
                    </div>
                    <span className="absolute bottom-4 text-[9px] font-black text-white uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">Click to Preview</span>
                  </div>
                </div>

                {/* 3. Content Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {editingId === ep.id ? (
                    <input 
                      autoFocus
                      value={ep.title}
                      onChange={(e) => updateEpisode(ep.id, { title: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                      className="w-full bg-white border border-indigo-500 rounded-lg px-2 py-1 text-sm font-bold outline-none shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
                    />
                  ) : (
                    <h4 
                      onClick={() => setEditingId(ep.id)}
                      className="text-[15px] font-black text-[#0F0F0F] hover:text-indigo-600 cursor-text transition-colors truncate mb-1"
                    >
                      {ep.title}
                    </h4>
                  )}
                  <div className="flex items-center gap-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                    <span className="text-neutral-300">#{seriesInfo.id}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-200" />
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {format(new Date(ep.dueDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {/* 4. Status & Actions */}
                <div className="flex items-center gap-8 pr-4">
                  <div className="min-w-[100px]">
                    <StatusDropdown 
                      status={ep.status} 
                      onChange={(s) => updateEpisode(ep.id, { status: s })} 
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => router.push(`/add-content?edit=${ep.id}`)}
                      className="p-2.5 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit Metadata"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEpisodeToDelete(ep)}
                      className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Episode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredEpisodes.length === 0 && (
              <div className="py-20 text-center bg-white border border-dashed border-neutral-200 rounded-3xl">
                <p className="text-sm font-bold text-neutral-400">No episodes found for this filter.</p>
              </div>
            )}

            {/* Add New Episode Button */}
            <button 
              onClick={handleAddEpisode}
              className="w-full py-6 bg-[#FAFBFC] hover:bg-white hover:border-indigo-200 hover:shadow-md border border-dashed border-[#E2E4E9] rounded-2xl text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-[#E2E4E9] flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5 text-neutral-500" />
              </div>
              <span>Add New Episode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

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
        <ChevronRight className={`w-3 h-3 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 w-32 bg-white border border-[#E2E4E9] rounded-xl shadow-xl z-[70] p-1 overflow-hidden"
            >
              {Object.keys(STATUS_CONFIG).map(s => (
                <button
                  key={s}
                  onClick={() => { onChange(s); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${status === s ? 'bg-[#F4F5F8] text-indigo-600' : 'text-neutral-500 hover:bg-[#F9FAFB]'}`}
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
