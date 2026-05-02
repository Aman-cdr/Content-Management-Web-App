"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  X, 
  Files, 
  ChevronRight, 
  Calendar, 
  Tag, 
  Rocket, 
  AlertTriangle,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Image as ImageIcon,
  Mic,
  ExternalLink,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Hash,
  Check,
  RotateCcw,
  Layers,
  Settings2
} from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "@/context/ContentContext";

const PLATFORM_ICONS = { 
  "Instagram Reels": FaInstagram, 
  "YouTube Shorts": FaYoutube, 
  YouTube: FaYoutube, 
  TikTok: FaTiktok, 
  "Twitter/X": FaTwitter 
};

const PLATFORM_COLORS = { 
  "Instagram Reels": "from-pink-500 via-purple-500 to-amber-500", 
  "YouTube Shorts": "from-red-600 to-red-500", 
  YouTube: "from-red-600 to-red-500", 
  TikTok: "from-gray-800 to-black", 
  "Twitter/X": "from-blue-500 to-blue-400" 
};

const TYPE_CONFIG = {
  video: { icon: Video, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  article: { icon: FileText, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  image: { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  podcast: { icon: Mic, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
};

function ContentCard({ item, index, view, onPreview, onEdit, onDelete, onPublish, isSelected, onToggleSelect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const realThumb = item.thumbnails?.youtube || item.thumbnails?.instagram || item.thumbnails?.shorts;
  const mockThumb = `/thumbnails/thumb${(index % 3) + 1}.png`;
  const thumbSrc = realThumb || mockThumb;
  
  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  
  const primaryPlatform = item.platforms?.[0];
  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.video;
  const TypeIcon = typeInfo.icon;
  const PlatformIcon = PLATFORM_ICONS[primaryPlatform];
  const platformColor = PLATFORM_COLORS[primaryPlatform] || "from-gray-500 to-gray-400";

  if (view === "list") {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`group bg-white border ${isSelected ? "border-indigo-500 bg-indigo-50/10" : "border-[#E2E4E9]"} rounded-xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-sm transition-all`}
      >
        <button 
          onClick={() => onToggleSelect(item.id)}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-neutral-300"}`}
        >
          {isSelected && <Check size={12} />}
        </button>

        <div className="w-16 h-12 rounded-lg bg-[#F4F5F8] overflow-hidden shrink-0 cursor-pointer" onClick={() => onPreview(item)}>
          {thumbSrc ? (
            <img src={thumbSrc} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <TypeIcon size={20} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-bold text-[#0F0F0F] truncate group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onPreview(item)}>{item.title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border}`}>{item.type}</span>
            {item.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] text-neutral-400 font-bold flex items-center gap-1 bg-neutral-50 px-1.5 py-0.5 rounded"><Hash size={10} /> {tag}</span>
            ))}
            <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1"><Calendar size={12} /> {dateStr}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex -space-x-1">
            {item.platforms?.map(p => {
              const Icon = PLATFORM_ICONS[p];
              return Icon ? <div key={p} className="w-6 h-6 rounded-full bg-white border border-[#E2E4E9] flex items-center justify-center shadow-sm"><Icon size={12} className="text-neutral-500" /></div> : null;
            })}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === "published" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
            {item.status}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onEdit(item)} className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
      </motion.div>
    );
  }

  const isShortForm = item.platforms?.some(p => ["YouTube Shorts", "Instagram Reels", "TikTok"].includes(p));

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-white border ${isSelected ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-[#E2E4E9]"} rounded-2xl overflow-hidden hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.1)] hover:border-indigo-100 transition-all duration-300 flex flex-col h-full`}
    >
      {/* Card Header / Thumbnail */}
      <div className={`relative ${isShortForm ? "aspect-[9/16]" : "aspect-video"} overflow-hidden cursor-pointer`} onClick={() => onPreview(item)}>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10" />
        {thumbSrc ? (
          <img src={thumbSrc} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-[#F9FAFB] flex items-center justify-center">
            <TypeIcon size={40} className="text-neutral-200" />
          </div>
        )}
        
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-30">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shadow-lg ${isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white/80 backdrop-blur-sm border-white/20 text-transparent"}`}
          >
            <Check size={14} />
          </button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 scale-90 group-hover:scale-100">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-indigo-600">
            <Eye size={20} />
          </div>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3 z-20">
          <div className={`flex items-center gap-1.5 px-2 py-1 bg-white border border-white/20 rounded-lg shadow-lg text-white font-bold text-[9px] uppercase tracking-wider bg-gradient-to-r ${platformColor}`}>
            {PlatformIcon && <PlatformIcon size={12} />}
          </div>
        </div>

        {/* Status Pill */}
        <div className="absolute bottom-3 right-3 z-20">
          <div className={`px-2 py-1 rounded-lg backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest ${item.status === "published" ? "bg-emerald-500/80 text-white" : "bg-amber-500/80 text-white"}`}>
            {item.status}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className={`${isShortForm ? "p-3.5" : "p-5"} flex flex-col flex-1`}>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <div className="min-w-0">
            <h4 className={`${isShortForm ? "text-[13px]" : "text-[15px]"} font-bold text-[#0F0F0F] leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors`}>{item.title}</h4>
          </div>
          <div className="relative shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} 
              className="p-1 text-neutral-400 hover:text-[#0F0F0F] hover:bg-[#F4F5F8] rounded-lg transition-all"
            >
              <MoreVertical size={isShortForm ? 16 : 18} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white border border-[#E2E4E9] rounded-xl shadow-2xl z-50 p-1"
                  >
                    <button onClick={() => { setMenuOpen(false); onEdit(item); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-indigo-600 rounded-lg transition-all uppercase tracking-wider"><Edit2 size={12} /> Edit</button>
                    {item.status === "draft" && (
                      <button onClick={() => { setMenuOpen(false); onPublish(item.id); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all uppercase tracking-wider"><Rocket size={12} /> Publish</button>
                    )}
                    <div className="h-px bg-[#F4F5F8] my-1" />
                    <button onClick={() => { setMenuOpen(false); onDelete(item.id); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all uppercase tracking-wider"><Trash2 size={12} /> Delete</button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Hash size={8} /> {tag}
              </span>
            ))}
          </div>
        )}

        <p className={`${isShortForm ? "text-[11px] mb-3" : "text-[12px] mb-4"} text-neutral-400 font-medium line-clamp-2 leading-relaxed`}>
          {item.description || "No description provided."}
        </p>

        <div className={`mt-auto ${isShortForm ? "pt-3" : "pt-4"} border-t border-[#F4F5F8] flex items-center justify-between`}>
          <div className="flex items-center gap-1.5">
            <div className={`${isShortForm ? "w-6 h-6" : "w-7 h-7"} rounded-lg ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center border ${typeInfo.border}`}>
              <TypeIcon size={isShortForm ? 12 : 14} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">{item.type}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
            <Calendar size={isShortForm ? 10 : 12} className="opacity-60" />
            {dateStr}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AllContentPage() {
  const router = useRouter();
  const { contents, deleteContent, publishContent, isLoading } = useContent();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("longform");
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  // Advanced Filter States
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTags, setFilterTags] = useState([]);

  const stats = useMemo(() => ({
    total: contents.length,
    published: contents.filter(c => c.status === "published").length,
    drafts: contents.filter(c => c.status === "draft").length
  }), [contents]);

  const allTags = useMemo(() => {
    const tags = new Set();
    contents.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [contents]);

  const filtered = contents.filter((c) => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    
    // Legacy tabs (mapped to advanced filters)
    if (filter === "longform" && (!c.platforms?.includes("YouTube") || c.platforms?.includes("YouTube Shorts"))) return false;
    if (filter === "shorts" && !c.platforms?.some(p => ["YouTube Shorts", "Instagram Reels", "TikTok"].includes(p))) return false;
    if (filter === "published" && c.status !== "published") return false;
    if (filter === "drafts" && c.status !== "draft") return false;

    // Advanced Filters
    if (filterPlatform !== "all" && !c.platforms?.includes(filterPlatform)) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterTags.length > 0 && !filterTags.every(t => c.tags?.includes(t))) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    return a.title.localeCompare(b.title);
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(f => f.id));
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      const { bulkDelete } = await import("@/context/ContentContext").then(m => m.useContent()); // Dynamic import hack if needed, but we already have it from useContent()
      // Wait, we already have bulkDelete from useContent()
    }
  };

  const { bulkDelete, bulkUpdate } = useContent();

  const handleBulkStatus = (status) => {
    bulkUpdate(selectedIds, { status });
    setSelectedIds([]);
  };

  const handleBulkAddTag = (tag) => {
    if (!tag) return;
    selectedIds.forEach(id => {
      const item = contents.find(c => c.id === id);
      const newTags = Array.from(new Set([...(item.tags || []), tag]));
      bulkUpdate([id], { tags: newTags });
    });
    setSelectedIds([]);
  };

  const handleEdit = (item) => router.push(`/add-content?edit=${item.id}`);

  const tabs = [
    { id: "longform", label: "YouTube (16:9)", icon: Video },
    { id: "shorts", label: "Reels & Shorts (9:16)", icon: Rocket },
    { id: "published", label: "Published", icon: CheckCircle2 },
    { id: "drafts", label: "Drafts", icon: Clock },
  ];

  return (
    <div className="min-h-screen pb-20 space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-6 bg-indigo-600 rounded-full" />
            <h2 className="text-3xl font-black text-[#0F0F0F] tracking-tight">Content Library</h2>
          </div>
          <p className="text-neutral-500 text-sm font-medium">Create, manage, and distribute content across your ecosystem.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E2E4E9] rounded-2xl p-4 flex items-center gap-6 shadow-sm">
            {[
              { label: "Total", val: stats.total, color: "text-indigo-600" },
              { label: "Published", val: stats.published, color: "text-emerald-600" },
              { label: "Drafts", val: stats.drafts, color: "text-amber-600" }
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{s.label}</p>
                <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          <button 
            onClick={() => router.push("/add-content")} 
            className="flex items-center gap-2 px-6 py-4 bg-[#0F0F0F] hover:bg-neutral-800 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            <Plus size={18} /> New Asset
          </button>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ── */}
      <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-xl border border-[#E2E4E9] rounded-[24px] p-3 flex flex-col items-stretch gap-3 shadow-lg shadow-black/[0.02]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
            <button 
              onClick={selectAll}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedIds.length > 0 ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-50"}`}
            >
              {selectedIds.length === filtered.length && filtered.length > 0 ? <Check size={14} /> : <Layers size={14} />}
              {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : "Select All"}
            </button>
            <div className="w-px h-6 bg-neutral-100" />
            {tabs.map((t) => (
              <button 
                key={t.id} 
                onClick={() => setFilter(t.id)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === t.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-transparent text-neutral-500 hover:bg-neutral-50"}`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search library..." 
                className="w-full pl-10 pr-4 py-2.5 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl text-xs font-bold text-[#0F0F0F] placeholder:text-neutral-400 focus:outline-none focus:border-indigo-600 transition-all" 
              />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all ${showFilters || filterPlatform !== "all" || filterType !== "all" || filterStatus !== "all" || filterTags.length > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-[#E2E4E9] text-neutral-500 hover:bg-neutral-50"}`}
            >
              <Filter size={18} />
            </button>

            <div className="h-8 w-px bg-neutral-100" />

            <div className="flex p-1 bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl shrink-0">
              <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-400"}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-400"}`}><List size={16} /></button>
            </div>

            <div className="relative shrink-0 hidden sm:block">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 bg-white border border-[#E2E4E9] rounded-xl text-xs font-bold text-[#4B5264] outline-none hover:bg-neutral-50 transition-all cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">A - Z</option>
              </select>
              <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── ADVANCED FILTERS PANEL ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-[#F4F5F8] grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Platform</label>
                  <select 
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E4E9] rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="all">All Platforms</option>
                    {Object.keys(PLATFORM_ICONS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Content Type</label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E4E9] rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="image">Image</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</label>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-[#E2E4E9] rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Tags</label>
                  <div className="flex flex-wrap gap-1 p-1.5 bg-white border border-[#E2E4E9] rounded-xl min-h-[38px]">
                    {filterTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                        {tag}
                        <button onClick={() => setFilterTags(filterTags.filter(t => t !== tag))}><X size={10} /></button>
                      </span>
                    ))}
                    <input 
                      placeholder={filterTags.length === 0 ? "Filter by tags..." : ""}
                      className="flex-1 bg-transparent border-none outline-none text-xs font-medium min-w-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value) {
                          if (!filterTags.includes(e.target.value)) setFilterTags([...filterTags, e.target.value]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setFilterPlatform("all");
                    setFilterType("all");
                    setFilterStatus("all");
                    setFilterTags([]);
                    setFilter("longform");
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 transition-all"
                >
                  <RotateCcw size={12} /> Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BULK ACTION BAR ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4"
          >
            <div className="bg-[#0F0F0F] text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-6 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black">
                  {selectedIds.length}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">Selected</p>
                  <p className="text-sm font-bold">Bulk Actions</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group/action">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 size={16} /> Status
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl p-1 shadow-2xl hidden group-hover/action:block border border-neutral-100 min-w-[140px]">
                    <button onClick={() => handleBulkStatus("published")} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-xl transition-all uppercase tracking-wider"><Check size={12} /> Published</button>
                    <button onClick={() => handleBulkStatus("draft")} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-xl transition-all uppercase tracking-wider"><RotateCcw size={12} /> Draft</button>
                  </div>
                </div>

                <div className="relative group/tag">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold">
                    <Tag size={16} /> Tag
                  </button>
                  <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl p-3 shadow-2xl hidden group-hover/tag:block border border-neutral-100 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Add tag to selected</p>
                    <div className="flex gap-1">
                      <input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="New tag..."
                        className="flex-1 px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 outline-none focus:border-indigo-500"
                        onKeyDown={(e) => { if (e.key === "Enter") { handleBulkAddTag(tagInput); setTagInput(""); }}}
                      />
                      <button 
                        onClick={() => { handleBulkAddTag(tagInput); setTagInput(""); }}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10 mx-1" />

                <button 
                  onClick={async () => {
                    if (confirm(`Delete ${selectedIds.length} items?`)) {
                      await bulkDelete(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  className="p-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all"
                >
                  <Trash2 size={16} />
                </button>

                <button 
                  onClick={() => setSelectedIds([])}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT GRID ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white border border-[#E2E4E9] rounded-2xl h-[300px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-dashed border-[#E2E4E9] rounded-[40px] text-center">
          <div className="w-24 h-24 bg-[#F4F5F8] rounded-full flex items-center justify-center mb-6">
            <Files size={40} className="text-neutral-300" />
          </div>
          <h3 className="text-2xl font-black text-[#0F0F0F] mb-2">No matching content</h3>
          <p className="text-neutral-400 font-medium mb-8 max-w-sm">We couldn't find any content matching your search or filters. Try adjusting your settings.</p>
          <div className="flex gap-4">
            <button onClick={() => { setSearch(""); setFilter("longform"); }} className="px-6 py-3 border border-[#E2E4E9] rounded-2xl text-xs font-black uppercase tracking-widest text-[#4B5264] hover:bg-neutral-50 transition-all">Clear Filters</button>
            <button onClick={() => router.push("/add-content")} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">Create New Asset</button>
          </div>
        </div>
      ) : (
        <div className={view === "grid" 
          ? `grid gap-6 ${filter === "shorts" 
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}` 
          : "space-y-4"}>
          <AnimatePresence mode="popLayout">
            {filtered.map((item, idx) => (
              <ContentCard 
                key={item.id} 
                item={item} 
                index={idx}
                view={view}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onPreview={setPreview} 
                onEdit={handleEdit} 
                onDelete={(id) => setDeleteTarget(contents.find(c => c.id === id))} 
                onPublish={publishContent} 
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {preview && (
          <PreviewPanel 
            item={preview} 
            onClose={() => setPreview(null)} 
            onEdit={(item) => { setPreview(null); router.push(`/add-content?edit=${item.id}`); }} 
            onDelete={(id) => { setPreview(null); setDeleteTarget(contents.find(c => c.id === id)); }} 
            onPublish={publishContent} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white border border-[#E2E4E9] rounded-[32px] p-8 shadow-2xl w-full max-w-sm text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#0F0F0F] mb-2">Delete Asset?</h3>
              <p className="text-sm font-medium text-neutral-400 mb-8 leading-relaxed">
                Are you sure you want to delete <span className="text-[#0F0F0F] font-bold">"{deleteTarget.title}"</span>? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 rounded-2xl border border-[#E2E4E9] text-xs font-black uppercase tracking-widest text-[#4B5264] hover:bg-neutral-50 transition-all">Cancel</button>
                <button onClick={() => { deleteContent(deleteTarget.id); setDeleteTarget(null); }} className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reuse the PreviewPanel from original code but refined
function PreviewPanel({ item, onClose, onEdit, onDelete, onPublish }) {
  if (!item) return null;

  // Use the same logic as the card to find the right thumbnail
  const realThumb = item.thumbnails?.youtube || item.thumbnails?.instagram || item.thumbnails?.shorts;
  // For the preview, we'll try to find its index in the content list if we want exact matching, 
  // or just default to a consistent mock based on ID
  const mockIdx = typeof item.id === 'number' ? item.id % 3 : 0;
  const thumbSrc = realThumb || `/thumbnails/thumb${mockIdx + 1}.png`;
  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.video;
  const TypeIcon = typeInfo.icon;
  const isShortForm = item.platforms?.some(p => ["YouTube Shorts", "Instagram Reels", "TikTok"].includes(p));

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-0 z-[100] flex justify-end">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#F4F5F8] px-6 py-4 flex justify-between items-center z-10">
          <h3 className="text-lg font-black text-[#0F0F0F]">Content Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F3F4F6] rounded-xl"><X size={20} className="text-neutral-500" /></button>
        </div>
        
        <div className={`relative ${isShortForm ? "aspect-[9/16] max-h-[70vh] mx-auto" : "aspect-video"} w-full bg-[#F4F5F8] overflow-hidden`}>
          {thumbSrc ? (
            <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><TypeIcon size={64} className="text-neutral-200" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md bg-white/10 text-white`}>{item.type}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md ${item.status === 'published' ? 'bg-emerald-500/80' : 'bg-amber-500/80'} text-white`}>{item.status}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter leading-tight">{item.title}</h2>
          </div>
        </div>

        <div className="p-8 space-y-10 bg-white">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Overview</label>
            <p className="text-sm leading-relaxed text-[#4B5264] font-medium">{item.description || "No description provided."}</p>
          </div>

          {item.script && (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Content Script</label>
              <pre className="text-xs text-neutral-500 bg-[#F9FAFB] rounded-[24px] p-6 border border-[#F4F5F8] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">{item.script}</pre>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">Distribution Channels</label>
            <div className="flex flex-wrap gap-2">
              {item.platforms?.map((p) => {
                const Icon = PLATFORM_ICONS[p];
                return <span key={p} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border border-[#E2E4E9] bg-white text-[#374151]">{Icon && <Icon size={14} />}{p}</span>;
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 p-8 bg-white/80 backdrop-blur-md border-t border-[#F4F5F8] flex flex-col sm:flex-row gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
          <button onClick={() => onEdit(item)} className="flex-1 py-4 bg-[#F4F5F8] hover:bg-[#E5E7EB] rounded-2xl text-xs font-black uppercase tracking-widest text-[#374151] transition-all flex items-center justify-center gap-2 border border-[#E2E4E9]"><Edit2 size={16} /> Full Edit</button>
          {item.status === "draft" && onPublish && (
            <button onClick={() => { onPublish(item.id); onClose(); }} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"><Rocket size={16} /> Publish Now</button>
          )}
          <button onClick={() => { onDelete(item.id); onClose(); }} className="py-4 px-6 bg-white border border-red-100 hover:bg-red-50 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"><Trash2 size={16} /></button>
        </div>
      </div>
    </motion.div>
  );
}
