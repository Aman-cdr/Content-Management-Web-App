"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  File, 
  Upload, 
  Search, 
  Grid, 
  List, 
  Download, 
  Copy, 
  Trash2, 
  X, 
  MoreVertical, 
  Play, 
  Check, 
  Filter, 
  ArrowUpDown,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Plus,
  Info,
  Clock,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// ---------- Mock Data ----------

const INITIAL_ASSETS = [
  // Images (8)
  { id: 1, name: "Product Launch Banner.jpg", type: 'image', extension: 'jpg', size: '2.4 MB', dimensions: '1920×1080', url: "https://picsum.photos/seed/1/800/600", dateAdded: "2026-04-28", tags: ["marketing", "banner"], usedIn: ["Summer Launch"] },
  { id: 2, name: "Team Photo 2026.png", type: 'image', extension: 'png', size: '4.8 MB', dimensions: '2400×1600', url: "https://picsum.photos/seed/2/800/600", dateAdded: "2026-04-25", tags: ["company", "internal"], usedIn: [] },
  { id: 3, name: "Logo Dark.svg", type: 'image', extension: 'svg', size: '0.2 MB', dimensions: '512×512', url: "https://picsum.photos/seed/3/400/400", dateAdded: "2026-04-20", tags: ["brand", "assets"], usedIn: ["Global Navigation"] },
  { id: 4, name: "Profile Aman.jpg", type: 'image', extension: 'jpg', size: '1.1 MB', dimensions: '800×800', url: "https://picsum.photos/seed/4/400/400", dateAdded: "2026-04-18", tags: ["profile"], usedIn: ["About Us"] },
  { id: 5, name: "YouTube Thumbnail 01.jpg", type: 'image', extension: 'jpg', size: '1.8 MB', dimensions: '1280×720', url: "https://picsum.photos/seed/5/800/450", dateAdded: "2026-04-15", tags: ["youtube", "thumbnails"], usedIn: ["Next.js 16 Tutorial"] },
  { id: 6, name: "Instagram Post Grid.png", type: 'image', extension: 'png', size: '3.2 MB', dimensions: '1080×1080', url: "https://picsum.photos/seed/6/600/600", dateAdded: "2026-04-12", tags: ["instagram", "marketing"], usedIn: ["Weekly Content"] },
  { id: 7, name: "Tech Setup Close-up.jpg", type: 'image', extension: 'jpg', size: '2.9 MB', dimensions: '2000×1500', url: "https://picsum.photos/seed/7/800/600", dateAdded: "2026-04-10", tags: ["b-roll", "setup"], usedIn: [] },
  { id: 8, name: "Abstract Gradient.webp", type: 'image', extension: 'webp', size: '0.8 MB', dimensions: '1920×1080', url: "https://picsum.photos/seed/8/800/600", dateAdded: "2026-04-05", tags: ["background", "design"], usedIn: ["Landing Page"] },
  
  // Videos (4)
  { id: 9, name: "Interview Segment A.mp4", type: 'video', extension: 'mp4', size: '245 MB', duration: '12:40', dateAdded: "2026-04-27", tags: ["interview", "raw"], usedIn: ["Tech Talk #12"] },
  { id: 10, name: "Product Showcase.mov", type: 'video', extension: 'mov', size: '1.2 GB', duration: '02:15', dateAdded: "2026-04-22", tags: ["product", "cinematic"], usedIn: ["Landing Page Hero"] },
  { id: 11, name: "Setup B-Roll Reel.mp4", type: 'video', extension: 'mp4', size: '180 MB', duration: '05:30', dateAdded: "2026-04-15", tags: ["b-roll"], usedIn: ["Vlog #42"] },
  { id: 12, name: "Tutorial Screen Recording.mp4", type: 'video', extension: 'mp4', size: '85 MB', duration: '24:35', dateAdded: "2026-04-08", tags: ["tutorial", "education"], usedIn: ["React 19 Deep Dive"] },

  // Audio (3)
  { id: 13, name: "Podcast Episode 45.mp3", type: 'audio', extension: 'mp3', size: '42 MB', duration: '45:20', dateAdded: "2026-04-29", tags: ["podcast"], usedIn: ["Weekly Podcast"] },
  { id: 14, name: "Intro Music Loop.wav", type: 'audio', extension: 'wav', size: '12 MB', duration: '00:30', dateAdded: "2026-04-20", tags: ["music", "assets"], usedIn: ["YouTube Intro"] },
  { id: 15, name: "Ambient Background.mp3", type: 'audio', extension: 'mp3', size: '8 MB', duration: '03:15', dateAdded: "2026-04-10", tags: ["audio", "background"], usedIn: [] },

  // Documents (3)
  { id: 16, name: "Brand Guidelines 2026.pdf", type: 'document', extension: 'pdf', size: '15.4 MB', dateAdded: "2026-04-30", tags: ["brand", "official"], usedIn: [] },
  { id: 17, name: "Content Calendar Q2.xlsx", type: 'document', extension: 'xlsx', size: '2.1 MB', dateAdded: "2026-04-25", tags: ["planning"], usedIn: [] },
  { id: 18, name: "Media Kit v2.pdf", type: 'document', extension: 'pdf', size: '8.4 MB', dateAdded: "2026-04-15", tags: ["partnership"], usedIn: ["Sponsorship Portal"] },

  // Other (2)
  { id: 19, name: "Website Assets Backup.zip", type: 'other', extension: 'zip', size: '450 MB', dateAdded: "2026-04-20", tags: ["backup"], usedIn: [] },
  { id: 20, name: "3D Models Bundle.rar", type: 'other', extension: 'rar', size: '1.2 GB', dateAdded: "2026-04-05", tags: ["assets", "3d"], usedIn: [] },
];

const TYPE_COLORS = {
  image: "text-[#6366F1] bg-indigo-50 border-indigo-100",
  video: "text-red-600 bg-red-50 border-red-100",
  audio: "text-emerald-600 bg-emerald-50 border-emerald-100",
  document: "text-amber-600 bg-amber-50 border-amber-100",
  other: "text-neutral-500 bg-neutral-50 border-neutral-100"
};

const TYPE_ICONS = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  other: File
};

// ---------- Components ----------

function StatPill({ label, count, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[#E2E4E9] rounded-xl shadow-sm">
      <div className="p-1.5 rounded-lg bg-[#F4F5F8]">
        <Icon className="w-3.5 h-3.5 text-[#4B5264]" />
      </div>
      <div>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-[#0A0A0F] leading-none">{count}</p>
      </div>
    </div>
  );
}

// ==========================================================
//  MEDIA LIBRARY PAGE
// ==========================================================

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("Date Added");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, isBulk: false });
  const fileInputRef = useRef(null);

  // Filter & Search Logic
  const filteredAssets = useMemo(() => {
    let result = assets;
    if (filter !== "All") {
      result = result.filter(a => a.type === filter.toLowerCase().slice(0, -1) || (filter === "Documents" && a.type === "document") || (filter === "Other" && a.type === "other"));
    }
    if (searchQuery) {
      result = result.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    // Sort logic (mocked)
    return result;
  }, [assets, filter, searchQuery, sortBy]);

  // Quick stats
  const stats = {
    total: assets.length,
    images: assets.filter(a => a.type === 'image').length,
    videos: assets.filter(a => a.type === 'video').length,
    other: assets.filter(a => a.type !== 'image' && a.type !== 'video').length,
  };

  // Handlers
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedFiles(newSelection);
  };

  const handleUpload = (files) => {
    const newUploads = Array.from(files).map((f, i) => ({
      id: Date.now() + i,
      name: f.name,
      progress: 0,
      type: f.type.split('/')[0] || 'other'
    }));
    setUploadingFiles(prev => [...prev, ...newUploads]);
    setIsUploadOpen(true);

    newUploads.forEach(upload => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadingFiles(prev => prev.map(u => u.id === upload.id ? { ...u, progress } : u));
        if (progress >= 100) {
          clearInterval(interval);
          // Add to assets
          setTimeout(() => {
            const newAsset = {
              id: upload.id,
              name: upload.name,
              type: upload.type === 'image' ? 'image' : upload.type === 'video' ? 'video' : upload.type === 'audio' ? 'audio' : 'other',
              extension: upload.name.split('.').pop(),
              size: '0.5 MB',
              url: upload.type === 'image' ? URL.createObjectURL(files[0]) : null,
              dateAdded: format(new Date(), "yyyy-MM-dd"),
              tags: ["new"],
              usedIn: []
            };
            setAssets(prev => [newAsset, ...prev]);
            setUploadingFiles(prev => prev.filter(u => u.id !== upload.id));
          }, 500);
        }
      }, 150);
    });
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id, isBulk: false });
  };

  const handleDeleteSelected = () => {
    setDeleteConfirm({ isOpen: true, id: null, isBulk: true });
  };

  const confirmDelete = () => {
    if (deleteConfirm.isBulk) {
      setAssets(prev => prev.filter(a => !selectedFiles.has(a.id)));
      setSelectedFiles(new Set());
    } else {
      setAssets(prev => prev.filter(a => a.id !== deleteConfirm.id));
      if (previewFile?.id === deleteConfirm.id) setPreviewFile(null);
      const newSelection = new Set(selectedFiles);
      newSelection.delete(deleteConfirm.id);
      setSelectedFiles(newSelection);
    }
    setDeleteConfirm({ isOpen: false, id: null, isBulk: false });
  };

  return (
    <div 
      className="space-y-8 pb-32 min-h-screen"
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); handleUpload(e.dataTransfer.files); }}
    >
      {/* ---------- Header ---------- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A0A0F] mb-1">Media Library</h2>
          <p className="text-neutral-500 text-sm font-medium">Manage all your creative assets in one place</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E2E4E9] rounded-2xl shadow-sm">
            <HardDrive className="w-4 h-4 text-indigo-600" />
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-400">
                <span>Storage Used</span>
                <span className="text-[#0A0A0F]">2.3GB / 10GB</span>
              </div>
              <div className="w-32 h-1 bg-[#F4F5F8] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '23%' }} />
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-600/20"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4">
        <StatPill label="Total Files" count={stats.total} icon={File} />
        <StatPill label="Images" count={stats.images} icon={ImageIcon} />
        <StatPill label="Videos" count={stats.videos} icon={Video} />
        <StatPill label="Other" count={stats.other} icon={MoreVertical} />
      </div>

      {/* ---------- Upload Zone ---------- */}
      <AnimatePresence>
        {(isUploadOpen || isDraggingOver) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center cursor-pointer group mb-8 ${isDraggingOver ? 'border-[#4F46E5] bg-[#4F46E5]/[0.03]' : 'border-[#E2E4E9] bg-white hover:border-[#4F46E5] hover:bg-[#F9FAFB]'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={(e) => handleUpload(e.target.files)} 
              />
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-lg font-bold text-[#0A0A0F] mb-1">Drag files here or click to browse</p>
              <p className="text-sm text-neutral-400">Support images, videos, audio and documents up to 50MB</p>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="space-y-3 mb-8">
                {uploadingFiles.map(u => (
                  <div key={u.id} className="bg-white border border-[#E2E4E9] p-4 rounded-2xl shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-[#0A0A0F] truncate">{u.name}</span>
                        <span className="text-indigo-600">{u.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#F4F5F8] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-indigo-600 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${u.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-2xl border border-[#E2E4E9] shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-11 pr-4 text-sm font-medium outline-none focus:border-[#4F46E5] transition-all"
            />
          </div>
          
          <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-xl">
            {["All", "Images", "Videos", "Audio", "Documents", "Other"].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4B5264] border-r border-[#E2E4E9] pr-4">
            <span className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">Sort by:</span>
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1 text-xs font-black text-indigo-600 uppercase tracking-widest outline-none hover:opacity-80 transition-opacity"
              >
                {sortBy}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-44 bg-white border border-[#E2E4E9] rounded-xl shadow-xl z-50 overflow-hidden py-1.5"
                  >
                    {["Date Added", "Name", "Size", "Type"].map(option => (
                      <button
                        key={option}
                        onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === option ? 'bg-indigo-50 text-indigo-600' : 'text-[#4B5264] hover:bg-[#F9FAFB] hover:text-[#0A0A0F]'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Content View ---------- */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-[#E2E4E9] border-dashed">
          <div className="w-24 h-24 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
            <File className="w-10 h-10 text-neutral-300" />
          </div>
          <h3 className="text-xl font-bold text-[#0A0A0F] mb-2">No files found</h3>
          <p className="text-neutral-400 text-sm mb-8">No creative assets match your current filters or search.</p>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAssets.map(asset => (
                <motion.div
                  key={asset.id}
                  layout
                  className="bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden group hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-[#F9FAFB] overflow-hidden">
                    {asset.type === 'image' ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : asset.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                          <Play className="w-6 h-6 fill-white" />
                        </div>
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-black text-white">
                          {asset.duration}
                        </div>
                      </div>
                    ) : asset.type === 'audio' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <Music className="w-12 h-12 text-emerald-500" />
                        <div className="flex items-end gap-1 h-8">
                          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.4].map((h, i) => (
                            <div key={i} className="w-1.5 bg-emerald-200 rounded-full" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className={`w-12 h-12 ${asset.type === 'document' ? 'text-amber-500' : 'text-neutral-400'}`} />
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-white border border-[#E2E4E9] rounded text-[10px] font-black uppercase text-neutral-500">
                          {asset.extension}
                        </div>
                      </div>
                    )}

                    {/* Checkbox Overlay */}
                    <div className="absolute top-3 left-3 z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSelection(asset.id); }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedFiles.has(asset.id) ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white/40 border-white opacity-0 group-hover:opacity-100'}`}
                      >
                        <Check className={`w-4 h-4 text-white ${selectedFiles.has(asset.id) ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button className="p-2.5 bg-white rounded-xl text-[#0A0A0F] hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 bg-white rounded-xl text-[#0A0A0F] hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 delay-75 duration-300">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                        className="p-2.5 bg-white rounded-xl text-[#0A0A0F] hover:bg-red-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 delay-150 duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 cursor-pointer" onClick={() => setPreviewFile(asset)}>
                    <p className="text-sm font-bold text-[#111318] truncate mb-1">{asset.name}</p>
                    <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400">
                      <span>{asset.size}</span>
                      <span>{asset.dateAdded}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E2E4E9] rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E2E4E9]">
                    <th className="p-4 w-12 text-center">
                      <button 
                        onClick={() => setSelectedFiles(selectedFiles.size === filteredAssets.length ? new Set() : new Set(filteredAssets.map(a => a.id)))}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedFiles.size === filteredAssets.length ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-neutral-300'}`}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </button>
                    </th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">File</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Type</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Size</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Date Added</th>
                    <th className="py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredAssets.map(asset => (
                    <tr 
                      key={asset.id} 
                      onClick={() => setPreviewFile(asset)}
                      className="border-b border-[#F4F5F8] hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => toggleSelection(asset.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mx-auto ${selectedFiles.has(asset.id) ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-neutral-300 group-hover:border-neutral-400'}`}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
                            {asset.type === 'image' ? (
                              <img src={asset.url} className="w-full h-full object-cover" />
                            ) : (
                              (() => {
                                const RowIcon = TYPE_ICONS[asset.type] || File;
                                return <RowIcon className={`w-5 h-5 ${TYPE_COLORS[asset.type].split(' ')[0]}`} />;
                              })()
                            )}
                          </div>
                          <p className="font-bold text-[#111318]">{asset.name}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${TYPE_COLORS[asset.type]}`}>
                          {asset.extension}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-500 font-medium">{asset.size}</td>
                      <td className="py-3 text-neutral-500 font-medium">{asset.dateAdded}</td>
                      <td className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors"><Download className="w-4 h-4" /></button>
                          <button className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(asset.id)} className="p-2 text-neutral-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---------- Bulk Actions Bar ---------- */}
      <AnimatePresence>
        {selectedFiles.size > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-[#0A0A0F] text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-12"
          >
            <div className="flex items-center gap-4 border-r border-white/10 pr-12">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm">
                {selectedFiles.size}
              </span>
              <span className="text-sm font-bold tracking-tight">Files selected</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                <Download className="w-4 h-4" />
                Download Selected
              </button>
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button 
                onClick={() => setSelectedFiles(new Set())}
                className="ml-4 text-white/40 hover:text-white p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Preview Modal ---------- */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#0A0A0F]/95 backdrop-blur-sm overflow-hidden">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-6xl h-full max-h-[800px] rounded-[32px] overflow-hidden flex flex-col md:flex-row relative"
            >
              {/* Close button */}
              <button 
                onClick={() => setPreviewFile(null)}
                className="absolute top-6 right-6 z-[110] p-2 bg-white/20 hover:bg-white text-white hover:text-[#0A0A0F] rounded-xl backdrop-blur-md transition-all shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Main Preview Area */}
              <div className="flex-1 bg-[#F9FAFB] flex items-center justify-center overflow-hidden p-12">
                {previewFile.type === 'image' ? (
                  <div className="relative group cursor-zoom-in h-full">
                    <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                ) : previewFile.type === 'video' ? (
                  <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
                    <video controls className="w-full h-full">
                      <source src={previewFile.url} type="video/mp4" />
                    </video>
                  </div>
                ) : previewFile.type === 'audio' ? (
                  <div className="w-full max-w-md p-10 bg-white rounded-3xl shadow-xl flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
                      <Music className="w-12 h-12 text-emerald-600" />
                    </div>
                    <p className="text-xl font-black text-[#0A0A0F] mb-6">{previewFile.name}</p>
                    <audio controls className="w-full h-12" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-32 h-32 rounded-3xl bg-amber-50 flex items-center justify-center">
                      <FileText className="w-16 h-16 text-amber-600" />
                    </div>
                    <p className="text-xl font-black text-[#0A0A0F]">{previewFile.name}</p>
                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                      Open Document
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-[360px] bg-white border-l border-[#E2E4E9] flex flex-col h-full overflow-y-auto">
                <div className="p-8 space-y-8">
                  <section>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">File Name</p>
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-black text-[#0A0A0F] leading-tight break-all">{previewFile.name}</h4>
                      <button className="p-2 text-neutral-300 hover:text-indigo-600 transition-colors"><Edit3Icon className="w-4 h-4" /></button>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Properties</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#F9FAFB] p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Type</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.extension.toUpperCase()}</p>
                      </div>
                      <div className="bg-[#F9FAFB] p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Size</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.size}</p>
                      </div>
                      {previewFile.dimensions && (
                        <div className="bg-[#F9FAFB] p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Resolution</p>
                          <p className="text-sm font-black text-[#111318]">{previewFile.dimensions}</p>
                        </div>
                      )}
                      {previewFile.duration && (
                        <div className="bg-[#F9FAFB] p-4 rounded-2xl">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Duration</p>
                          <p className="text-sm font-black text-[#111318]">{previewFile.duration}</p>
                        </div>
                      )}
                      <div className="bg-[#F9FAFB] p-4 rounded-2xl col-span-2">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Uploaded On</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.dateAdded}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {previewFile.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                          {tag} <X className="w-3 h-3 cursor-pointer" />
                        </span>
                      ))}
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F5F8] text-neutral-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#E2E4E9] transition-all">
                        <Plus className="w-3 h-3" /> Add Tag
                      </button>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Used In</p>
                    {previewFile.usedIn.length > 0 ? (
                      <div className="space-y-3">
                        {previewFile.usedIn.map(content => (
                          <div key={content} className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E2E4E9] hover:border-indigo-200 transition-all cursor-pointer group">
                            <FileText className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-bold text-[#374151] truncate flex-1">{content}</span>
                            <ChevronRight className="w-3 h-3 text-neutral-300 group-hover:text-indigo-600 transition-colors" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">Not linked to any content yet.</p>
                    )}
                  </section>
                </div>

                <div className="mt-auto p-8 border-t border-[#E2E4E9] bg-white sticky bottom-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#F4F5F8] transition-all">
                      <Copy className="w-4 h-4" /> Copy Link
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#F4F5F8] transition-all">
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                  <button 
                    onClick={() => handleDelete(previewFile.id)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Delete Asset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------- Delete Confirmation Modal ---------- */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-[#0A0A0F] mb-3">
                {deleteConfirm.isBulk ? `Delete ${selectedFiles.size} files?` : "Delete this file?"}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                This action is permanent and cannot be undone. These assets will be removed from all linked content.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null, isBulk: false })}
                  className="py-4 bg-[#F4F5F8] text-[#4B5264] rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#E2E4E9] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-4 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Edit icon replacement if not in lucide
function Edit3Icon(props) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
