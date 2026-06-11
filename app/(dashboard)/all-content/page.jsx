"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, MoreVertical, Eye, Edit2, Trash2, X,
  Files, Calendar, Tag, Rocket, AlertTriangle,
  LayoutGrid, List, ArrowUpDown, CheckCircle2, Clock,
  Video, FileText, Image as ImageIcon, Mic, Hash,
  Check, RotateCcw, ChevronDown, SlidersHorizontal, ExternalLink,
  Loader2
} from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter, FaNewspaper } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import { MOCK_CONTENT } from "@/lib/mock-data";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// ─── Config ──────────────────────────────────────────────────────────────────

const PLATFORM_META = {
  "YouTube":         { icon: FaYoutube,    color: "#FF0000", bg: "bg-red-50",   text: "text-red-600" },
  "YouTube Shorts":  { icon: FaYoutube,    color: "#FF0000", bg: "bg-red-50",   text: "text-red-600" },
  "Instagram Reels": { icon: FaInstagram,  color: "#E1306C", bg: "bg-pink-50",  text: "text-pink-600" },
  "Instagram":       { icon: FaInstagram,  color: "#E1306C", bg: "bg-pink-50",  text: "text-pink-600" },
  "TikTok":          { icon: FaTiktok,     color: "#000000", bg: "bg-gray-100", text: "text-gray-700" },
  "Twitter/X":       { icon: FaTwitter,    color: "#1DA1F2", bg: "bg-blue-50",  text: "text-blue-500" },
  "Newsletter":      { icon: FaNewspaper,  color: "#F59E0B", bg: "bg-amber-50", text: "text-amber-600" },
};

const TYPE_CONFIG = {
  video:   { icon: Video,       label: "Video",   color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100" },
  short:   { icon: Video,       label: "Short",   color: "text-pink-500",   bg: "bg-pink-50",   border: "border-pink-100" },
  article: { icon: FileText,    label: "Article", color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100" },
  image:   { icon: ImageIcon,   label: "Image",   color: "text-emerald-500",bg: "bg-emerald-50",border: "border-emerald-100" },
  podcast: { icon: Mic,         label: "Podcast", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
};

const STATUS_META = {
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  draft:     { label: "Draft",     cls: "bg-amber-50  text-amber-700  border-amber-100"  },
  scheduled: { label: "Scheduled", cls: "bg-blue-50   text-blue-700   border-blue-100"   },
};

// ─── Card ────────────────────────────────────────────────────────────────────

function ContentCard({ item, view, onPreview, onEdit, onDelete, onPublish, isSelected, onToggleSelect }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const thumbObj = item.thumbnails || item.thumbnail || {};
  const thumbSrc = thumbObj.youtube || thumbObj.instagram || thumbObj.shorts || null;

  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  const primaryPlatform = item.platforms?.[0];
  const platformMeta = PLATFORM_META[primaryPlatform];
  const PlatformIcon = platformMeta?.icon;
  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.video;
  const TypeIcon = typeInfo.icon;
  const statusMeta = STATUS_META[item.status?.toLowerCase()] || STATUS_META.draft;
  const isShort = item.type === "short" || item.platforms?.some(p => ["YouTube Shorts","Instagram Reels","TikTok"].includes(p));

  // ── List Row ──
  if (view === "list") {
    return (
      <motion.div
        layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`group bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-sm
          ${isSelected ? "border-[var(--t-primary)] bg-[var(--t-primary-light)]" : "border-[#E5E7EB] hover:border-[#D1D5DB]"}`}
      >
        <button
          onClick={() => onToggleSelect(item.id)}
          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all
            ${isSelected ? "text-white border-[var(--t-primary)]" : "bg-white border-[#D1D5DB]"}`}
          style={isSelected ? { backgroundColor: "var(--t-primary)" } : {}}
        >
          {isSelected && <Check size={12} />}
        </button>

        <div className="w-[72px] h-[44px] rounded-xl bg-[#F4F5F8] overflow-hidden shrink-0 cursor-pointer" onClick={() => onPreview(item)}>
          {thumbSrc
            ? <img src={thumbSrc} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center"><TypeIcon size={18} className="text-neutral-300" /></div>}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className="text-[14px] font-semibold text-[#0F0F0F] truncate cursor-pointer hover:text-[var(--t-primary)] transition-colors"
            onClick={() => onPreview(item)}
          >
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border}`}>
              {typeInfo.label}
            </span>
            {item.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] text-neutral-400 flex items-center gap-0.5 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100">
                <Hash size={9} />{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Platforms */}
          <div className="flex -space-x-1.5">
            {item.platforms?.slice(0, 3).map(p => {
              const m = PLATFORM_META[p];
              return m ? (
                <div key={p} className={`w-6 h-6 rounded-full ${m.bg} flex items-center justify-center border border-white shadow-sm`}>
                  <m.icon size={11} style={{ color: m.color }} />
                </div>
              ) : null;
            })}
          </div>

          {/* Status */}
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.cls} whitespace-nowrap`}>
            {statusMeta.label}
          </span>

          {/* Date */}
          <span className="text-[11px] text-neutral-400 flex items-center gap-1 whitespace-nowrap hidden md:flex">
            <Calendar size={11} />{dateStr}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onEdit(item)} className="p-1.5 text-neutral-400 hover:text-[var(--t-primary)] hover:bg-[var(--t-primary-light)] rounded-lg transition-all">
              <Edit2 size={15} />
            </button>
            <button onClick={() => onDelete(item)} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Grid Card ──
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`group bg-white border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] hover:-translate-y-0.5
        ${isSelected ? "border-[var(--t-primary)] shadow-[0_0_0_3px_var(--t-primary-light)]" : "border-[#E5E7EB]"}`}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden cursor-pointer aspect-video" onClick={() => onPreview(item)}>
        {thumbSrc
          ? <img src={thumbSrc} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" alt="" />
          : <div className="w-full h-full bg-[#F4F5F8] flex items-center justify-center"><TypeIcon size={36} className="text-neutral-200" /></div>}

        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
          className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center shadow-md transition-all
            ${isSelected ? "text-white border-transparent" : "bg-white/80 backdrop-blur-sm border-white/50 text-transparent"}`}
          style={isSelected ? { backgroundColor: "var(--t-primary)" } : {}}
        >
          <Check size={13} />
        </button>

        {/* Platform pill */}
        {platformMeta && (
          <div className={`absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shadow-md border border-white/20 backdrop-blur-sm ${platformMeta.bg} ${platformMeta.text}`}>
            <PlatformIcon size={11} style={{ color: platformMeta.color }} />
          </div>
        )}

        {/* Status pill */}
        <div className={`absolute bottom-2.5 right-2.5 z-10 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-white/20 backdrop-blur-md
          ${item.status?.toLowerCase() === "published" ? "bg-emerald-500/90 text-white" : item.status?.toLowerCase() === "scheduled" ? "bg-blue-500/90 text-white" : "bg-amber-500/90 text-white"}`}>
          {item.status}
        </div>

        {/* Preview icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
          <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-xl" style={{ color: "var(--t-primary)" }}>
            <Eye size={18} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h4 className="text-[14px] font-semibold text-[#0F0F0F] leading-snug line-clamp-2 flex-1 group-hover:text-[var(--t-primary)] transition-colors cursor-pointer" onClick={() => onPreview(item)}>
            {item.title}
          </h4>
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1 text-neutral-300 hover:text-neutral-600 hover:bg-[#F4F5F8] rounded-lg transition-all"
            >
              <MoreVertical size={16} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E2E4E9] rounded-xl shadow-xl z-50 p-1"
                  >
                    <button onClick={() => { setMenuOpen(false); onEdit(item); }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all">
                      <Edit2 size={13} /> Edit
                    </button>
                    {item.status?.toLowerCase() === "draft" && (
                      <button onClick={() => { setMenuOpen(false); onPublish(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                        <Rocket size={13} /> Publish
                      </button>
                    )}
                    <div className="h-px bg-[#F4F5F8] my-1" />
                    <button onClick={() => { setMenuOpen(false); onDelete(item); }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={13} /> Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Hash size={8} />{tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-[12px] text-neutral-400 line-clamp-2 leading-relaxed mb-3 flex-1">
          {item.description || "No description provided."}
        </p>

        <div className="pt-3 border-t border-[#F4F5F8] flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${typeInfo.bg} border ${typeInfo.border}`}>
            <TypeIcon size={12} className={typeInfo.color} />
            <span className={`text-[9px] font-bold uppercase tracking-wide ${typeInfo.color}`}>{typeInfo.label}</span>
          </div>
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            <Calendar size={11} className="opacity-50" />{dateStr}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TYPE_FILTERS  = ["All", "Video", "Short", "Article", "Podcast"];
const STATUS_FILTERS = ["All", "Published", "Draft", "Scheduled"];
const SORT_OPTIONS  = [
  { value: "newest",       label: "Newest" },
  { value: "oldest",       label: "Oldest" },
  { value: "alphabetical", label: "A – Z"  },
];

export default function AllContentPage() {
  const router = useRouter();
  const { contents: apiContents, deleteContent, publishContent, bulkDelete, bulkUpdate, isLoading } = useContent();
  const contents = !isLoading && apiContents.length === 0 ? MOCK_CONTENT : apiContents;

  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [statusFilter,setStatusFilter]= useState("All");
  const [sortBy,      setSortBy]      = useState("newest");
  const [view,        setView]        = useState("grid");
  const [preview,     setPreview]     = useState(null);
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tagInput,    setTagInput]    = useState("");

  const stats = useMemo(() => ({
    total:     contents.length,
    published: contents.filter(c => c.status?.toLowerCase() === "published").length,
    drafts:    contents.filter(c => c.status?.toLowerCase() === "draft").length,
    scheduled: contents.filter(c => c.status?.toLowerCase() === "scheduled").length,
  }), [contents]);

  const filtered = useMemo(() => {
    return contents
      .filter(c => {
        if (search && !c.title?.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== "All"   && c.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;
        if (statusFilter !== "All" && c.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        return (a.title || "").localeCompare(b.title || "");
      });
  }, [contents, search, typeFilter, statusFilter, sortBy]);

  const toggleSelect    = id  => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const selectAll       = ()  => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(f => f.id));
  const clearFilters    = ()  => { setSearch(""); setTypeFilter("All"); setStatusFilter("All"); setSortBy("newest"); };
  const hasActiveFilter = search || typeFilter !== "All" || statusFilter !== "All";

  const handleEdit   = item => router.push(`/add-content?edit=${item.id}`);
  const handleDelete = item => setDeleteTarget(item);

  return (
    <div className="min-h-screen pb-20 space-y-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-[800] text-[var(--t-text)] tracking-tight">Content Hub</h2>
          <p className="text-[var(--t-text-3)] text-[13px] mt-0.5">Create, manage, and publish across all platforms.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats chips */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { label: "Total",     val: stats.total,     color: "text-[var(--t-primary)]",  bg: "bg-[var(--t-primary-light)]" },
              { label: "Published", val: stats.published, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Drafts",    val: stats.drafts,    color: "text-amber-600",  bg: "bg-amber-50"  },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${s.bg}`}>
                <span className={`text-[18px] font-[800] leading-none ${s.color}`}>{s.val}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/add-content")}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-[13px] font-[600] transition-all hover:brightness-110 active:scale-95 btn-primary"
          >
            <Plus size={16} /> New Content
          </button>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 space-y-3 shadow-sm">

        {/* Row 1: Search + View + Sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F0F0F] placeholder:text-neutral-400 focus:outline-none focus:border-[var(--t-primary)] transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex-1" />

          {/* Clear filters */}
          {hasActiveFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 transition-colors px-2">
              <RotateCcw size={13} /> Clear
            </button>
          )}

          {/* Sort */}
          <div className="relative hidden sm:block">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[12px] font-semibold text-[#4B5264] outline-none cursor-pointer hover:bg-neutral-100 transition-all"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex p-1 bg-[#F4F5F8] border border-[#E5E7EB] rounded-xl">
            <button onClick={() => setView("grid")} className={`p-1.5 rounded-lg transition-all ${view === "grid" ? "bg-white shadow-sm text-[var(--t-primary)]" : "text-neutral-400 hover:text-neutral-600"}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView("list")} className={`p-1.5 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm text-[var(--t-primary)]" : "text-neutral-400 hover:text-neutral-600"}`}>
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Row 2: Type filters + Status filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Type pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mr-1">Type</span>
            {TYPE_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                  typeFilter === t
                    ? "text-white shadow-sm"
                    : "bg-[#F4F5F8] text-neutral-500 hover:bg-neutral-200"
                }`}
                style={typeFilter === t ? { backgroundColor: "var(--t-primary)" } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E5E7EB] hidden sm:block" />

          {/* Status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mr-1">Status</span>
            {STATUS_FILTERS.map(s => {
              const colorMap = {
                All:       { active: "var(--t-primary)",   bg: "" },
                Published: { active: "#10B981", bg: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
                Draft:     { active: "#F59E0B", bg: "bg-amber-50  text-amber-700  border border-amber-200"  },
                Scheduled: { active: "#3B82F6", bg: "bg-blue-50   text-blue-700   border border-blue-200"   },
              };
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                    isActive
                      ? s === "All" ? "text-white shadow-sm" : colorMap[s].bg + " font-bold"
                      : "bg-[#F4F5F8] text-neutral-500 hover:bg-neutral-200"
                  }`}
                  style={isActive && s === "All" ? { backgroundColor: "var(--t-primary)" } : {}}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      {s === "Published" ? stats.published : s === "Draft" ? stats.drafts : stats.scheduled}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between pt-1 border-t border-[#F4F5F8]">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                selectedIds.length > 0 ? "text-[var(--t-primary)]" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {selectedIds.length === filtered.length && filtered.length > 0 ? <Check size={13} /> : <SlidersHorizontal size={13} />}
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : "Select all"}
            </button>
          </div>
          <span className="text-[11px] text-neutral-400 font-medium">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
            {hasActiveFilter && " (filtered)"}
          </span>
        </div>
      </div>

      {/* ── BULK ACTION BAR ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-lg"
          >
            <div className="bg-[#0F0F0F] text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: "var(--t-primary)" }}>
                  {selectedIds.length}
                </div>
                <span className="text-[13px] font-semibold">item{selectedIds.length > 1 ? "s" : ""} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkUpdate(selectedIds, { status: "published" })}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold transition-all"
                >
                  <Rocket size={13} /> Publish
                </button>
                <button
                  onClick={async () => { if (confirm(`Delete ${selectedIds.length} items?`)) { await bulkDelete(selectedIds); setSelectedIds([]); } }}
                  className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setSelectedIds([])} className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all">
                  <X size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT GRID / LIST ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E2E4E9] rounded-2xl h-[280px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#E5E7EB] rounded-2xl text-center">
          <div className="w-16 h-16 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-5 border border-[#E5E7EB]">
            <Files size={28} className="text-[#D1D5DB]" />
          </div>
          <h3 className="text-[20px] font-[800] text-[#111318] mb-1">No content found</h3>
          <p className="text-[#6B7280] text-[13px] mb-6 max-w-xs">
            {hasActiveFilter ? "Try adjusting your filters or search terms." : "Start by creating your first piece of content."}
          </p>
          <div className="flex gap-3">
            {hasActiveFilter && (
              <button onClick={clearFilters} className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[13px] font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-all">
                Clear Filters
              </button>
            )}
            <button
              onClick={() => router.push("/add-content")}
              className="px-5 py-2.5 text-white rounded-xl text-[13px] font-semibold hover:brightness-110 transition-all btn-primary"
            >
              Create Content
            </button>
          </div>
        </div>
      ) : (
        <div className={
          view === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            : "space-y-2"
        }>
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <ContentCard
                key={item.id}
                item={item}
                view={view}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onPreview={setPreview}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={publishContent}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── PREVIEW PANEL ── */}
      <AnimatePresence>
        {preview && (
          <PreviewPanel
            item={preview}
            onClose={() => setPreview(null)}
            onEdit={item => { setPreview(null); router.push(`/add-content?edit=${item.id}`); }}
            onDelete={item => { setPreview(null); setDeleteTarget(item); }}
            onPublish={publishContent}
          />
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 16 }} className="relative bg-white rounded-2xl p-7 shadow-2xl w-full max-w-sm text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-black text-[#0F0F0F] mb-1">Delete content?</h3>
              <p className="text-[13px] text-neutral-400 mb-6 leading-relaxed">
                "<span className="text-[#0F0F0F] font-semibold">{deleteTarget.title}</span>" will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-[#E2E4E9] text-[13px] font-semibold text-[#4B5264] hover:bg-neutral-50 transition-all">Cancel</button>
                <button onClick={() => { deleteContent(deleteTarget.id); setDeleteTarget(null); }} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

function PreviewPanel({ item, onClose, onEdit, onDelete, onPublish }) {
  if (!item) return null;
  const thumbObj = item.thumbnails || item.thumbnail || {};
  const thumbSrc = thumbObj.youtube || thumbObj.instagram || thumbObj.shorts || null;
  const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.video;
  const TypeIcon = typeInfo.icon;
  const isShort = item.type === "short" || item.platforms?.some(p => ["YouTube Shorts","Instagram Reels","TikTok"].includes(p));
  const statusMeta = STATUS_META[item.status?.toLowerCase()] || STATUS_META.draft;

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!item.id && !item._id) return;
      setLoadingJob(true);
      try {
        const res = await httpClient.get(ENDPOINTS.PUBLISH.LIST, {
          params: { contentId: item.id || item._id }
        });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setJob(res.data[0]);
        } else {
          setJob(null);
        }
      } catch (err) {
        console.error("Failed to fetch publish job details:", err);
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [item.id, item._id]);

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed inset-0 z-[100] flex justify-end">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#F4F5F8] px-6 py-4 flex justify-between items-center z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--t-text-3)] mb-0.5">Content Preview</p>
            <h3 className="text-[15px] font-bold text-[#0F0F0F] line-clamp-1">{item.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F4F5F8] rounded-xl transition-all"><X size={18} className="text-neutral-500" /></button>
        </div>

        {/* Thumbnail */}
        <div className={`relative w-full ${isShort ? "aspect-[4/5]" : "aspect-video"} bg-[#F4F5F8] overflow-hidden`}>
          {thumbSrc
            ? <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><TypeIcon size={56} className="text-neutral-200" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex gap-2 mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm border border-white/20 text-white">{typeInfo.label}</span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur-sm text-white ${item.status?.toLowerCase() === "published" ? "bg-emerald-500/80" : "bg-amber-500/80"}`}>{item.status}</span>
            </div>
            <h2 className="text-[18px] font-black text-white leading-tight">{item.title}</h2>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6 flex-1">
          {item.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Overview</p>
              <p className="text-[13px] leading-relaxed text-[#4B5264]">{item.description}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {item.platforms?.map(p => {
                const m = PLATFORM_META[p];
                return (
                  <span key={p} className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${m ? `${m.bg} ${m.text}` : "bg-neutral-50 text-neutral-600 border-neutral-200"}`}>
                    {m && <m.icon size={12} style={{ color: m.color }} />}{p}
                  </span>
                );
              })}
            </div>
          </div>

          {item.tags?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-0.5 text-[11px] font-semibold px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-lg">
                    <Hash size={10} />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Publishing Status & Live URLs */}
          {item.type === "video" && (
            <div className="border-t border-[#F4F5F8] pt-6 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Publishing Status</p>
              
              {loadingJob ? (
                <div className="flex items-center gap-2 text-xs text-neutral-500 py-2">
                  <Loader2 size={14} className="animate-spin text-neutral-400" />
                  <span>Loading publishing details...</span>
                </div>
              ) : job ? (
                <div className="space-y-4 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl p-4">
                  {/* Overall Job Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E4E9]/60">
                    <span className="text-xs font-semibold text-neutral-500">Overall Status</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                      ${job.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        job.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                        job.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        job.status === 'publishing' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                        'bg-neutral-50 text-neutral-600 border-neutral-200'}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Platform Results */}
                  <div className="space-y-3">
                    {job.platformResults?.map((pr) => {
                      const platformLabelMap = {
                        youtube: "YouTube",
                        youtube_shorts: "YouTube Shorts",
                        instagram_reels: "Instagram Reels",
                        tiktok: "TikTok"
                      };
                      const platName = platformLabelMap[pr.platform] || pr.platform;
                      const platMeta = PLATFORM_META[platName];
                      const PlatIcon = platMeta?.icon;

                      return (
                        <div key={pr.platform} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {PlatIcon && <PlatIcon size={14} style={{ color: platMeta?.color }} />}
                            <span className="text-xs font-medium text-neutral-700">{platName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border
                              ${pr.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                pr.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                                pr.status === 'publishing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-neutral-50 text-neutral-500 border-neutral-200'}`}
                            >
                              {pr.status}
                            </span>
                            
                            {pr.liveUrl && (
                              <a
                                href={pr.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-700 transition-colors"
                                title="Open Live Post"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {job.scheduledAt && job.status === 'scheduled' && (
                    <div className="text-[10px] text-neutral-400 font-semibold text-center pt-1 flex items-center justify-center gap-1">
                      <Clock size={10} />
                      <span>Scheduled for {new Date(job.scheduledAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-neutral-400 italic py-2">
                  Not published or scheduled via cross-platform publishing yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 p-5 bg-white/90 backdrop-blur-md border-t border-[#F4F5F8] flex gap-2">
          <button onClick={() => onEdit(item)} className="flex-1 py-3 bg-[#F4F5F8] hover:bg-[#E5E7EB] rounded-xl text-[12px] font-bold text-[#374151] transition-all flex items-center justify-center gap-2 border border-[#E2E4E9]">
            <Edit2 size={14} /> Edit
          </button>
          {item.status?.toLowerCase() === "draft" && (
            <button onClick={() => { onPublish(item.id); onClose(); }} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-2">
              <Rocket size={14} /> Publish
            </button>
          )}
          <button onClick={() => onDelete(item)} className="p-3 bg-white border border-red-100 hover:bg-red-50 text-red-500 rounded-xl transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
