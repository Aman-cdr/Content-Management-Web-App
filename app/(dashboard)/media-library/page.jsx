"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  HardDrive,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Loader2,
  Scissors,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import httpClient from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";
import { FaYoutube, FaInstagram } from "react-icons/fa";

// Which platform the generated thumbnail is for — drives the image's aspect
// ratio (YouTube 16:9, Instagram Square 1:1, Instagram Reel/Story 9:16).
const AI_SIZE_OPTIONS = [
  { id: "youtube",          label: "YouTube",        sub: "1280×720 · 16:9",  icon: FaYoutube,   color: "#FF0000", ratio: "56.25%" },
  { id: "instagram_square", label: "Instagram Post",  sub: "1080×1080 · 1:1",  icon: FaInstagram, color: "#E1306C", ratio: "100%" },
  { id: "instagram_reel",   label: "Instagram Reel",  sub: "1080×1920 · 9:16", icon: FaInstagram, color: "#E1306C", ratio: "177.78%" },
];

// ---------- API helpers ----------

function mimeToType(mimeType) {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.startsWith('text/')
  ) return 'document';
  return 'other';
}

function mimeToExtension(mimeType, originalName) {
  if (originalName && originalName.includes('.')) {
    return originalName.split('.').pop().toLowerCase();
  }
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'image/svg+xml': 'svg',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
    'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
  };
  return map[mimeType] || mimeType.split('/').pop() || 'file';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

function mapUploadToAsset(upload) {
  const type = mimeToType(upload.mimeType);
  const extension = mimeToExtension(upload.mimeType, upload.originalName);
  return {
    id: upload._id,
    name: upload.originalName,
    type,
    extension,
    size: formatBytes(upload.size),
    sizeBytes: upload.size || 0,
    url: upload.url,
    dateAdded: upload.createdAt ? format(new Date(upload.createdAt), 'yyyy-MM-dd') : '',
    tags: [],
    usedIn: [],
    status: upload.status,
  };
}

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
    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-[#E2E4E9] rounded-full shadow-sm">
      <div className="p-1.5 rounded-full bg-[#F4F5F8]">
        <Icon className="w-3.5 h-3.5 text-[#4B5264]" strokeWidth={1.5} />
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
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBytes, setTotalBytes] = useState(0);
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
  const [copiedId, setCopiedId] = useState(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSize, setAiSize] = useState("youtube");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Deep-link support: /media-library?ai=1 opens the AI thumbnail generator panel
  // directly (used by the sidebar's "Thumbnail Studio" entry).
  useEffect(() => {
    if (searchParams.get("ai") === "1") setIsAiOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyUrl = useCallback((url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await httpClient.get(ENDPOINTS.UPLOAD.LIST, { params: { limit: 100 } });
      const uploads = res.data?.data || [];
      const mapped = uploads.map(mapUploadToAsset);
      setAssets(mapped);
      setTotalBytes(mapped.reduce((sum, a) => sum + (a.sizeBytes || 0), 0));
    } catch (err) {
      setError('Failed to load uploads. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

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

  const handleUpload = async (files) => {
    const fileArray = Array.from(files);
    setIsUploadOpen(true);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const tempId = Date.now() + i;
      setUploadingFiles(prev => [...prev, { id: tempId, name: file.name, progress: 0 }]);

      try {
        const isVideo = file.type.startsWith('video/');
        const endpoint = isVideo ? ENDPOINTS.UPLOAD.VIDEO : ENDPOINTS.UPLOAD.THUMBNAIL;
        const formData = new FormData();
        formData.append(isVideo ? 'video' : 'thumbnail', file);

        const res = await httpClient.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 50;
            setUploadingFiles(prev => prev.map(u => u.id === tempId ? { ...u, progress: pct } : u));
          },
        });

        const uploaded = res.data?.data || res.data;
        if (uploaded) {
          setAssets(prev => [mapUploadToAsset(uploaded), ...prev]);
          setTotalBytes(prev => prev + (uploaded.size || 0));
        }
      } catch {
        // silently skip failed file — progress bar stays at last value
      } finally {
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(u => u.id !== tempId));
        }, 800);
      }
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      // Image generation (esp. the free Pollinations fallback) can take longer than
      // the default 30s client timeout, especially under load — give it more room.
      const res = await httpClient.post(ENDPOINTS.AI.THUMBNAIL, { prompt: aiPrompt.trim(), size: aiSize }, { timeout: 60000 });
      const uploaded = res.data?.data || res.data;
      if (uploaded) {
        setAssets(prev => [mapUploadToAsset(uploaded), ...prev]);
        setTotalBytes(prev => prev + (uploaded.size || 0));
      }
      setAiPrompt("");
      setAiSize("youtube");
      setIsAiOpen(false);
    } catch (err) {
      setAiError(err?.response?.data?.message || "Failed to generate thumbnail. Try a different prompt.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleEditVideo = async (id) => {
    if (editingId) return;
    setEditingId(id);
    try {
      const res = await httpClient.post(ENDPOINTS.EDITOR.CREATE, { sourceUploadId: id });
      const project = res.data?.data || res.data;
      router.push(`/editor/${project.id || project._id}`);
    } catch (err) {
      setError(err.message || "Failed to open editor");
      setEditingId(null);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id, isBulk: false });
  };

  const handleDeleteSelected = () => {
    setDeleteConfirm({ isOpen: true, id: null, isBulk: true });
  };

  const confirmDelete = async () => {
    const close = () => setDeleteConfirm({ isOpen: false, id: null, isBulk: false });
    if (deleteConfirm.isBulk) {
      const ids = [...selectedFiles];
      await Promise.allSettled(ids.map(id => httpClient.delete(ENDPOINTS.UPLOAD.DELETE(id))));
      setAssets(prev => {
        const removed = prev.filter(a => selectedFiles.has(a.id));
        setTotalBytes(tot => tot - removed.reduce((s, a) => s + (a.sizeBytes || 0), 0));
        return prev.filter(a => !selectedFiles.has(a.id));
      });
      setSelectedFiles(new Set());
    } else {
      try { await httpClient.delete(ENDPOINTS.UPLOAD.DELETE(deleteConfirm.id)); } catch { /* ignore */ }
      setAssets(prev => {
        const removed = prev.find(a => a.id === deleteConfirm.id);
        if (removed) setTotalBytes(tot => tot - (removed.sizeBytes || 0));
        return prev.filter(a => a.id !== deleteConfirm.id);
      });
      if (previewFile?.id === deleteConfirm.id) setPreviewFile(null);
      const newSel = new Set(selectedFiles);
      newSel.delete(deleteConfirm.id);
      setSelectedFiles(newSel);
    }
    close();
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
          <h2 className="text-3xl font-medium text-[#0A0A0F] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Media Library</h2>
          <p className="text-neutral-500 text-sm font-medium">Manage all your creative assets in one place</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E2E4E9] rounded-full shadow-sm">
            <HardDrive className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-neutral-400">
                <span>Storage Used</span>
                <span className="text-[#0A0A0F]">{formatBytes(totalBytes)}</span>
              </div>
              <div className="w-32 h-1 bg-[#F4F5F8] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min((totalBytes / (10 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1)}%` }} />
              </div>
            </div>
          </div>
          <button
            onClick={fetchAssets}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-[#E2E4E9] text-[#4B5264] rounded-full text-sm font-black hover:bg-[#F4F5F8] transition-colors duration-300"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => { setAiError(null); setIsAiOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E4E9] text-[#4B5264] rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#F4F5F8] transition-colors duration-300"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
            Generate with AI
          </button>
          <button
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#4338CA] transition-colors duration-300 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.4)]"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
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
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-bold text-[#0A0A0F] mb-1">Drag files here or click to browse</p>
              <p className="text-sm text-neutral-400">Support images, videos, audio and documents up to 50MB</p>
            </div>

            {uploadingFiles.length > 0 && (
              <div className="space-y-3 mb-8">
                {uploadingFiles.map(u => (
                  <div key={u.id} className="bg-white border border-[#E2E4E9] p-4 rounded-2xl shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-[1.75rem] border border-[#E2E4E9] shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 bg-[#F9FAFB] border border-[#E2E4E9] rounded-full pl-11 pr-4 text-sm font-medium outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/15 transition-all duration-300"
            />
          </div>

          <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-full">
            {["All", "Images", "Videos", "Audio", "Documents", "Other"].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors duration-300 ${filter === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
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
                    className="absolute right-0 mt-3 w-44 bg-white border border-[#E2E4E9] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] z-50 overflow-hidden py-1.5"
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
          
          <div className="flex gap-1 bg-[#F4F5F8] p-1 rounded-full">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-colors duration-300 ${viewMode === "grid" ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <Grid className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-colors duration-300 ${viewMode === "list" ? 'bg-white text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Content View ---------- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[1.75rem] border border-[#E2E4E9]">
          <RefreshCw className="w-10 h-10 text-indigo-300 animate-spin mb-4" strokeWidth={1.5} />
          <p className="text-neutral-400 text-sm font-medium">Loading your files…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[1.75rem] border border-red-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
          </div>
          <p className="text-[#0A0A0F] font-bold mb-1">Could not load files</p>
          <p className="text-neutral-400 text-sm mb-6">{error}</p>
          <button onClick={fetchAssets} className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors duration-300">
            Try Again
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[1.75rem] border border-[#E2E4E9] border-dashed">
          <div className="w-24 h-24 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
            <File className="w-10 h-10 text-neutral-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-[#0A0A0F] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>No files found</h3>
          <p className="text-neutral-400 text-sm mb-8">No creative assets match your current filters or search.</p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-full text-sm font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors duration-300"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.04, ease: [0.32, 0.72, 0, 1] }}
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
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedFiles.has(asset.id) ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white/40 border-white opacity-0 group-hover:opacity-100'}`}
                      >
                        <Check className={`w-4 h-4 text-white ${selectedFiles.has(asset.id) ? 'opacity-100' : 'opacity-0'}`} strokeWidth={1.75} />
                      </button>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {asset.type === 'video' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditVideo(asset.id); }}
                          disabled={editingId === asset.id}
                          title="Edit video"
                          className="p-2.5 bg-white rounded-full text-[#0A0A0F] hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 disabled:opacity-60"
                        >
                          {editingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                        </button>
                      )}
                      <a
                        href={asset.url}
                        download={asset.name}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 bg-white rounded-full text-[#0A0A0F] hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyUrl(asset.url, asset.id); }}
                        className="p-2.5 bg-white rounded-full text-[#0A0A0F] hover:bg-indigo-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 delay-75 duration-300"
                      >
                        {copiedId === asset.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                        className="p-2.5 bg-white rounded-full text-[#0A0A0F] hover:bg-red-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 delay-150 duration-300"
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
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${selectedFiles.size === filteredAssets.length ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-neutral-300'}`}
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
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 mx-auto ${selectedFiles.has(asset.id) ? 'bg-[#4F46E5] border-[#4F46E5]' : 'bg-white border-neutral-300 group-hover:border-neutral-400'}`}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
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
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${TYPE_COLORS[asset.type]}`}>
                          {asset.extension}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-500 font-medium">{asset.size}</td>
                      <td className="py-3 text-neutral-500 font-medium">{asset.dateAdded}</td>
                      <td className="py-3 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {asset.type === 'video' && (
                            <button
                              onClick={() => handleEditVideo(asset.id)}
                              disabled={editingId === asset.id}
                              title="Edit video"
                              className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors disabled:opacity-60"
                            >
                              {editingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                            </button>
                          )}
                          <a href={asset.url} download={asset.name} target="_blank" rel="noreferrer" className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors"><Download className="w-4 h-4" /></a>
                          <button onClick={() => handleCopyUrl(asset.url, asset.id)} className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors">
                            {copiedId === asset.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
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
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-[#0A0A0F] text-white px-8 py-5 rounded-[1.75rem] shadow-2xl flex items-center gap-12"
          >
            <div className="flex items-center gap-4 border-r border-white/10 pr-12">
              <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-sm">
                {selectedFiles.size}
              </span>
              <span className="text-sm font-bold tracking-tight">Files selected</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-black uppercase tracking-widest transition-colors duration-300">
                <Download className="w-4 h-4" strokeWidth={1.5} />
                Download Selected
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-full text-xs font-black uppercase tracking-widest transition-colors duration-300"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="ml-4 text-white/40 hover:text-white p-2 rounded-full transition-colors duration-300"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
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
              className="bg-white w-full max-w-6xl h-full max-h-[800px] rounded-[1.75rem] overflow-hidden flex flex-col md:flex-row relative"
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-6 right-6 z-[110] p-2 bg-white/20 hover:bg-white text-white hover:text-[#0A0A0F] rounded-full backdrop-blur-md transition-colors duration-300 shadow-xl"
              >
                <X className="w-6 h-6" strokeWidth={1.5} />
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
                      <div className="bg-[#F9FAFB] p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Type</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.extension.toUpperCase()}</p>
                      </div>
                      <div className="bg-[#F9FAFB] p-4 rounded-xl">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Size</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.size}</p>
                      </div>
                      {previewFile.dimensions && (
                        <div className="bg-[#F9FAFB] p-4 rounded-xl">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Resolution</p>
                          <p className="text-sm font-black text-[#111318]">{previewFile.dimensions}</p>
                        </div>
                      )}
                      {previewFile.duration && (
                        <div className="bg-[#F9FAFB] p-4 rounded-xl">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Duration</p>
                          <p className="text-sm font-black text-[#111318]">{previewFile.duration}</p>
                        </div>
                      )}
                      <div className="bg-[#F9FAFB] p-4 rounded-xl col-span-2">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Uploaded On</p>
                        <p className="text-sm font-black text-[#111318]">{previewFile.dateAdded}</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {previewFile.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                          {tag} <X className="w-3 h-3 cursor-pointer" strokeWidth={1.5} />
                        </span>
                      ))}
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F5F8] text-neutral-400 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E2E4E9] transition-colors duration-300">
                        <Plus className="w-3 h-3" strokeWidth={1.5} /> Add Tag
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
                    <button
                      onClick={() => handleCopyUrl(previewFile.url, `preview-${previewFile.id}`)}
                      className="flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#F4F5F8] transition-colors duration-300"
                    >
                      {copiedId === `preview-${previewFile.id}` ? <Check className="w-4 h-4 text-green-500" strokeWidth={1.75} /> : <Copy className="w-4 h-4" strokeWidth={1.5} />}
                      {copiedId === `preview-${previewFile.id}` ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#F4F5F8] transition-colors duration-300"
                    >
                      <Download className="w-4 h-4" strokeWidth={1.5} /> Download
                    </a>
                  </div>
                  <button
                    onClick={() => handleDelete(previewFile.id)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 border border-red-100 rounded-full text-sm font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors duration-300 group"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
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
              className="bg-white w-full max-w-md rounded-[1.75rem] overflow-hidden p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-semibold text-[#0A0A0F] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {deleteConfirm.isBulk ? `Delete ${selectedFiles.size} files?` : "Delete this file?"}
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                This action is permanent and cannot be undone. These assets will be removed from all linked content.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null, isBulk: false })}
                  className="py-4 bg-[#F4F5F8] text-[#4B5264] rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#E2E4E9] transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-4 bg-red-600 text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-colors duration-300 shadow-lg shadow-red-600/20"
                >
                  Delete Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------- Generate with AI Modal ---------- */}
      <AnimatePresence>
        {isAiOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0A0A0F]/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[1.75rem] overflow-hidden p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0A0A0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Generate with AI</h3>
                  <p className="text-neutral-400 text-xs font-medium">Describe the image — it&apos;s saved straight to your Media Library</p>
                </div>
              </div>

              <textarea
                autoFocus
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. A neon cyberpunk city skyline at night, bold empty space on the left for title text"
                rows={4}
                disabled={aiGenerating}
                className="w-full mt-6 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl p-4 text-sm font-medium outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/15 transition-all duration-300 resize-none disabled:opacity-60"
              />

              <div className="mt-5">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2.5">Size</p>
                <div className="grid grid-cols-3 gap-3">
                  {AI_SIZE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = aiSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAiSize(opt.id)}
                        disabled={aiGenerating}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all disabled:opacity-50 ${
                          selected ? "border-[#4F46E5] bg-indigo-50/50" : "border-[#E2E4E9] hover:border-neutral-300"
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          <div
                            className="bg-white border border-black/[0.08] rounded-[3px] shadow-sm flex items-center justify-center"
                            style={{
                              width: opt.id === "instagram_reel" ? "22px" : opt.id === "instagram_square" ? "34px" : "40px",
                              height: opt.id === "instagram_reel" ? "40px" : opt.id === "instagram_square" ? "34px" : "22px",
                            }}
                          >
                            <Icon className="w-3 h-3" style={{ color: opt.color }} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className={`text-[11px] font-bold leading-tight ${selected ? "text-[#4F46E5]" : "text-[#374151]"}`}>{opt.label}</p>
                          <p className="text-[9px] text-neutral-400 font-medium mt-0.5">{opt.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {aiError && (
                <p className="mt-3 text-xs font-bold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => { setIsAiOpen(false); setAiPrompt(""); setAiSize("youtube"); setAiError(null); }}
                  disabled={aiGenerating}
                  className="py-4 bg-[#F4F5F8] text-[#4B5264] rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#E2E4E9] transition-colors duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateThumbnail}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="flex items-center justify-center gap-2 py-4 bg-[#4F46E5] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#4338CA] transition-colors duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : <Sparkles className="w-4 h-4" strokeWidth={1.5} />}
                  {aiGenerating ? "Generating…" : "Generate"}
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
