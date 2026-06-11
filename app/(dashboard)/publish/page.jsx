"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Clock, 
  Calendar, 
  Video, 
  FileText, 
  Tag, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  ExternalLink,
  Play
} from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

// Standard formatting for file size
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function PublishPage() {
  const [isBrowser, setIsBrowser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null); // { _id, url, fileName, originalName, size }
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Thumbnail State
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [uploadedThumbnail, setUploadedThumbnail] = useState(null); // { _id, url, fileName, originalName, size }
  const thumbnailInputRef = useRef(null);
  const [dragActiveThumbnail, setDragActiveThumbnail] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]); // ['youtube', 'youtube_shorts', 'instagram_reels', 'tiktok']
  const [publishType, setPublishType] = useState("now"); // 'now' or 'schedule'
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History State
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [jobFilter, setJobFilter] = useState("all");

  // Notifications
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  useEffect(() => {
    setIsBrowser(true);
    fetchJobs();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await httpClient.get(ENDPOINTS.PUBLISH.LIST);
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      showNotification("error", err.message || "Failed to load publishing history");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file.type.startsWith("video/")) {
      showNotification("error", "Invalid file type. Only video files are allowed.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(null);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await httpClient.post(ENDPOINTS.UPLOAD.VIDEO, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (res.success && res.data) {
        setUploadedFile(res.data);
        showNotification("success", "Video uploaded successfully to staging server!");
        // Auto-fill title if empty
        if (!title) {
          const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setTitle(nameWithoutExt);
        }
      } else {
        throw new Error(res.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showNotification("error", err.message || "Video upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = async () => {
    if (!uploadedFile) return;
    const fileId = uploadedFile._id || uploadedFile.id;
    try {
      await httpClient.delete(ENDPOINTS.UPLOAD.DELETE(fileId));
      setUploadedFile(null);
      showNotification("success", "Uploaded file cleared");
    } catch (err) {
      console.error("Failed to delete upload:", err);
      // still clear from state anyway
      setUploadedFile(null);
    }
  };

  const handleDragThumbnail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveThumbnail(true);
    } else if (e.type === "dragleave") {
      setDragActiveThumbnail(false);
    }
  };

  const handleDropThumbnail = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveThumbnail(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbnailUpload(e.dataTransfer.files[0]);
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleThumbnailUpload(e.target.files[0]);
    }
  };

  const handleThumbnailUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      showNotification("error", "Invalid file type. Only image files are allowed for thumbnails.");
      return;
    }

    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);
    setUploadedThumbnail(null);

    const formData = new FormData();
    formData.append("thumbnail", file);

    try {
      const res = await httpClient.post(ENDPOINTS.UPLOAD.THUMBNAIL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setThumbnailProgress(percentCompleted);
        },
      });

      if (res.success && res.data) {
        setUploadedThumbnail(res.data);
        showNotification("success", "Thumbnail uploaded successfully!");
      } else {
        throw new Error(res.message || "Thumbnail upload failed");
      }
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      showNotification("error", err.message || "Thumbnail upload failed");
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const removeUploadedThumbnail = async () => {
    if (!uploadedThumbnail) return;
    const thumbnailId = uploadedThumbnail._id || uploadedThumbnail.id;
    try {
      await httpClient.delete(ENDPOINTS.UPLOAD.DELETE(thumbnailId));
      setUploadedThumbnail(null);
      showNotification("success", "Uploaded thumbnail cleared");
    } catch (err) {
      console.error("Failed to delete thumbnail:", err);
      setUploadedThumbnail(null);
    }
  };

  // Platform selection helper
  const togglePlatform = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  // Tags input helpers
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Job
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      showNotification("error", "Please upload a video first");
      return;
    }
    if (selectedPlatforms.length === 0) {
      showNotification("error", "Please select at least one publishing platform");
      return;
    }
    if (!title.trim()) {
      showNotification("error", "Please provide a video title");
      return;
    }
    
    let scheduledAt = new Date();
    if (publishType === "schedule") {
      if (!scheduleDate) {
        showNotification("error", "Please select a schedule date and time");
        return;
      }
      scheduledAt = new Date(scheduleDate);
      if (scheduledAt <= new Date()) {
        showNotification("error", "Schedule time must be in the future");
        return;
      }
    }

    setIsSubmitting(true);
    const fileId = uploadedFile._id || uploadedFile.id;

    try {
      const res = await httpClient.post(ENDPOINTS.PUBLISH.CREATE, {
        uploadId: fileId,
        title: title.trim(),
        description: description.trim(),
        tags: tags,
        platforms: selectedPlatforms,
        scheduledAt: scheduledAt.toISOString(),
        thumbnailUrl: uploadedThumbnail?.url || ""
      });

      if (res.success) {
        showNotification("success", publishType === "now" ? "Video publishing initiated!" : "Post scheduled successfully!");
        
        // Reset form
        setTitle("");
        setDescription("");
        setTags([]);
        setSelectedPlatforms([]);
        setPublishType("now");
        setScheduleDate("");
        setUploadedFile(null);
        setUploadedThumbnail(null);
        
        // Refresh list
        fetchJobs();
      } else {
        throw new Error(res.message || "Failed to create publishing job");
      }
    } catch (err) {
      console.error("Publish submit error:", err);
      showNotification("error", err.message || "Failed to submit publishing job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    if (!confirm("Are you sure you want to cancel this scheduled publication?")) return;
    
    try {
      const res = await httpClient.delete(ENDPOINTS.PUBLISH.CANCEL(jobId));
      if (res.success) {
        showNotification("success", "Scheduled publication cancelled");
        fetchJobs();
      }
    } catch (err) {
      console.error("Failed to cancel job:", err);
      showNotification("error", err.message || "Failed to cancel publication");
    }
  };

  // Filtering logic
  const filteredJobs = jobs.filter(job => {
    if (jobFilter === "all") return true;
    return job.status === jobFilter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "draft":
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
      case "scheduled":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "publishing":
        return "bg-amber-50 text-amber-600 border-amber-200 animate-pulse";
      case "published":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "failed":
        return "bg-red-50 text-red-600 border-red-200";
      case "cancelled":
        return "bg-stone-100 text-stone-500 border-stone-200";
      default:
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
    }
  };

  if (!isBrowser) return null;

  return (
    <div className="space-y-8 pb-12 bg-[#EEEEF0] min-h-screen px-6 pt-6 -mx-6 -mt-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border shadow-lg max-w-md ${
              notification.type === "success" 
                ? "bg-white text-emerald-800 border-emerald-100 shadow-emerald-100/30" 
                : "bg-white text-red-800 border-red-100 shadow-red-100/30"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <p className="text-sm font-semibold leading-relaxed">{notification.message}</p>
            <button 
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors ml-auto shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight mb-2 text-[#0A0A0F]">Upload & Publish</h2>
          <p className="text-[#8A91A8] font-medium text-sm">Upload a video, draft your caption, and schedule or publish it across all social platforms at once.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Form (8 cols on XL, else full) */}
        <div className="xl:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="card p-8 space-y-8 bg-white border border-[#E2E4E9] rounded-3xl shadow-sm">
            {/* Step 1: Upload Video */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center font-bold text-xs text-[#4F46E5]">1</div>
                <h3 className="text-lg font-bold text-[#0A0A0F]">Upload Video File</h3>
              </div>

              {!uploadedFile && !isUploading ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 bg-neutral-50/50 hover:bg-[#F9FAFB]/50 ${
                    dragActive ? "border-[#4F46E5] bg-[#4F46E5]/5" : "border-neutral-200"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-neutral-400 group-hover:text-[#4F46E5] transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-neutral-800">Drag & drop your video here, or <span className="text-[#4F46E5] hover:underline">browse</span></p>
                    <p className="text-xs text-neutral-400 font-medium">Supports MP4, MOV, WebM (Max 500MB)</p>
                  </div>
                </div>
              ) : isUploading ? (
                <div className="border border-neutral-100 bg-neutral-50/50 rounded-2xl p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Uploading video to server...</p>
                        <p className="text-xs text-neutral-400 font-medium">Please do not close this tab</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#4F46E5]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#4F46E5] h-2 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/50 border border-emerald-200/30 flex items-center justify-center text-emerald-600">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800 truncate max-w-md">{uploadedFile.originalName}</p>
                      <p className="text-xs text-neutral-500 font-medium">{formatBytes(uploadedFile.size)} • Ready for publishing</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeUploadedFile}
                    className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-red-500 transition-colors"
                    title="Remove Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Select Platforms */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center font-bold text-xs text-[#4F46E5]">2</div>
                  <h3 className="text-lg font-bold text-[#0A0A0F]">Choose Target Platforms</h3>
                </div>
                <span className="text-xs font-semibold text-neutral-400">{selectedPlatforms.length} selected</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: "youtube", name: "YouTube", desc: "Long-form", icon: FaYoutube, color: "hover:border-red-500/30 hover:bg-red-500/[0.02] text-red-500", activeBg: "bg-red-50 text-red-600 border-red-500/50" },
                  { id: "youtube_shorts", name: "YT Shorts", desc: "Vertical", icon: FaYoutube, color: "hover:border-red-500/30 hover:bg-red-500/[0.02] text-red-500", activeBg: "bg-red-50 text-red-600 border-red-500/50" },
                  { id: "instagram_reels", name: "Instagram Reels", desc: "Vertical", icon: FaInstagram, color: "hover:border-pink-500/30 hover:bg-pink-500/[0.02] text-pink-500", activeBg: "bg-pink-50 text-pink-600 border-pink-500/50" },
                  { id: "tiktok", name: "TikTok", desc: "Vertical video", icon: FaTiktok, color: "hover:border-black/30 hover:bg-black/[0.02] text-neutral-800", activeBg: "bg-neutral-50 text-black border-neutral-500/50" }
                ].map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  const Icon = plat.icon;
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatform(plat.id)}
                      className={`p-4 border rounded-xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? plat.activeBg + " shadow-sm scale-[1.02]" 
                          : "border-neutral-200 bg-white text-neutral-500 " + plat.color
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <div>
                        <p className="text-sm font-bold leading-tight">{plat.name}</p>
                        <p className="text-[10px] opacity-70 mt-0.5 font-medium">{plat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Enter Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center font-bold text-xs text-[#4F46E5]">3</div>
                <h3 className="text-lg font-bold text-[#0A0A0F]">Video Metadata</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Title and Description */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="title" className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">Video Title</label>
                    <div className="relative">
                      <input
                        id="title"
                        type="text"
                        placeholder="Catchy video title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        className="w-full bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#0A0A0F] placeholder:text-[#8A91A8]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-bold bg-white px-1.5 py-0.5 rounded border border-neutral-100">
                        {title.length}/100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="desc" className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">Description / Caption</label>
                    <div className="relative">
                      <textarea
                        id="desc"
                        placeholder="Describe your video or write your social media post caption here..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        className="w-full bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#0A0A0F] placeholder:text-[#8A91A8] resize-none"
                      />
                      <span className="absolute right-3 bottom-3 text-[10px] text-neutral-400 font-bold bg-white px-1.5 py-0.5 rounded border border-neutral-100">
                        {description.length}/1000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Custom Thumbnail & Tags */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">Custom Thumbnail (Optional)</label>
                    
                    {!uploadedThumbnail && !isUploadingThumbnail ? (
                      <div
                        onDragEnter={handleDragThumbnail}
                        onDragOver={handleDragThumbnail}
                        onDragLeave={handleDragThumbnail}
                        onDrop={handleDropThumbnail}
                        onClick={() => thumbnailInputRef.current?.click()}
                        className={`border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-[#F4F5F8]/50 hover:bg-neutral-100/50 min-h-[120px] ${
                          dragActiveThumbnail ? "border-[#4F46E5] bg-[#4F46E5]/5" : "border-[#E2E4E9]"
                        }`}
                      >
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          className="hidden"
                        />
                        <div className="w-8 h-8 rounded-full bg-white border border-neutral-100 flex items-center justify-center text-neutral-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-neutral-855">Upload cover image</p>
                          <p className="text-[10px] text-neutral-400 font-medium">JPEG, PNG, WebP (Max 10MB)</p>
                        </div>
                      </div>
                    ) : isUploadingThumbnail ? (
                      <div className="border border-neutral-100 bg-[#F4F5F8]/50 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-855">Uploading cover...</span>
                          <span className="text-xs font-bold text-[#4F46E5]">{thumbnailProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#4F46E5] h-1.5 rounded-full transition-all duration-200"
                            style={{ width: `${thumbnailProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative border border-emerald-100 bg-emerald-50/10 rounded-2xl p-3 flex items-center justify-between overflow-hidden">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100 flex items-center justify-center">
                            <img src={uploadedThumbnail.url} alt="Cover Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="truncate max-w-[150px]">
                            <p className="text-xs font-bold text-neutral-800 truncate">{uploadedThumbnail.originalName}</p>
                            <p className="text-[10px] text-neutral-500 font-medium">{formatBytes(uploadedThumbnail.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedThumbnail}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                          title="Remove cover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Tags / Keywords
                    </label>
                    <div className="bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl p-2.5 flex flex-wrap gap-2 items-center">
                      {tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-[#E2E4E9] px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-700 flex items-center gap-1.5 shadow-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder={tags.length === 0 ? "Type tag & press Enter or comma..." : "Add tag..."}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="bg-transparent border-none outline-none text-sm font-semibold py-1 px-1 flex-1 min-w-[150px] placeholder:text-[#8A91A8]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Schedule Picker */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center font-bold text-xs text-[#4F46E5]">4</div>
                <h3 className="text-lg font-bold text-[#0A0A0F]">Publishing Schedule</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPublishType("now")}
                  className={`p-4 border rounded-xl flex items-center gap-3.5 text-left cursor-pointer transition-all duration-150 ${
                    publishType === "now"
                      ? "border-[#4F46E5] bg-[#4F46E5]/5 text-[#4F46E5] shadow-sm font-bold"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${publishType === 'now' ? 'bg-[#4F46E5]/10' : 'bg-neutral-100'}`}>
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Publish Immediately</p>
                    <p className="text-xs opacity-75 mt-0.5 font-medium">Post to platforms right away</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPublishType("schedule")}
                  className={`p-4 border rounded-xl flex items-center gap-3.5 text-left cursor-pointer transition-all duration-150 ${
                    publishType === "schedule"
                      ? "border-[#4F46E5] bg-[#4F46E5]/5 text-[#4F46E5] shadow-sm font-bold"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${publishType === 'schedule' ? 'bg-[#4F46E5]/10' : 'bg-neutral-100'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Schedule for Later</p>
                    <p className="text-xs opacity-75 mt-0.5 font-medium">Select a future date and time</p>
                  </div>
                </button>
              </div>

              {publishType === "schedule" && (
                <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-neutral-400 shrink-0" />
                    <div>
                      <label htmlFor="scheduleDate" className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">Choose Date & Time</label>
                      <p className="text-[10px] text-neutral-400 font-medium">Runs check every 60s</p>
                    </div>
                  </div>
                  <input
                    id="scheduleDate"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="bg-white border border-[#E2E4E9] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#0A0A0F]"
                  />
                </div>
              )}
            </div>

            {/* Action Submit */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting || isUploading || !uploadedFile || selectedPlatforms.length === 0 || !title.trim()}
                className={`px-8 py-3.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                  isSubmitting || isUploading || !uploadedFile || selectedPlatforms.length === 0 || !title.trim()
                    ? "bg-neutral-300 shadow-none cursor-not-allowed text-neutral-400"
                    : "bg-[#4F46E5] hover:bg-[#4338CA] shadow-[0_2px_10px_rgba(79,70,229,0.25)] hover:scale-[1.01]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Job...</span>
                  </>
                ) : publishType === "now" ? (
                  "Publish Immediately"
                ) : (
                  "Schedule Publication"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: History & Status (5 cols on XL, else full) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="card p-6 space-y-6 bg-white border border-[#E2E4E9] rounded-3xl shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
              <h3 className="font-bold text-lg text-[#0A0A0F] flex items-center gap-2">
                <span>Publish History</span>
                <span className="text-xs font-semibold bg-[#F4F5F8] border border-[#E2E4E9] px-2 py-0.5 rounded-full text-[#8A91A8]">{filteredJobs.length}</span>
              </h3>
              <button
                onClick={fetchJobs}
                disabled={isLoadingJobs}
                className="p-2 text-neutral-400 hover:text-[#4F46E5] hover:bg-blue-50 rounded-xl transition-all"
                title="Refresh history"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? "animate-spin text-[#4F46E5]" : ""}`} />
              </button>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 bg-[#F4F5F8] p-1 rounded-xl border border-[#E2E4E9] shrink-0">
              {[
                { id: "all", label: "All" },
                { id: "scheduled", label: "Scheduled" },
                { id: "publishing", label: "Active" },
                { id: "published", label: "Done" },
                { id: "failed", label: "Failed" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setJobFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                    jobFilter === f.id ? "text-[#4F46E5] bg-white border border-[#E2E4E9] shadow-sm" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[700px] pr-2 space-y-4 custom-sidebar-scroll">
              {isLoadingJobs ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
                  <p className="text-sm font-semibold">Loading history...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400 gap-4 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-800">No publish jobs found</p>
                    <p className="text-xs font-medium">Create a new post on the left to get started</p>
                  </div>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div 
                    key={job._id || job.id} 
                    className="p-5 border border-[#E2E4E9] rounded-2xl bg-white space-y-4 hover:shadow-md hover:border-neutral-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {job.thumbnailUrl ? (
                          <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50 shrink-0 shadow-sm">
                            <img src={job.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 shrink-0 border border-neutral-100">
                            <Video className="w-4 h-4" />
                          </div>
                        )}
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#0A0A0F] truncate leading-snug">{job.title}</h4>
                          <p className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="truncate">
                              {job.status === "scheduled" ? "Scheduled: " : "Published: "}
                              {new Date(job.scheduledAt).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 border rounded-md text-[9px] font-extrabold uppercase tracking-widest ${getStatusBadgeClass(job.status)}`}>
                          {job.status}
                        </span>
                        {job.status === "scheduled" && (
                          <button
                            onClick={() => handleCancelJob(job._id || job.id)}
                            className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-lg border border-neutral-100 hover:border-red-100 transition-colors"
                            title="Cancel publication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Platforms Results status */}
                    <div className="p-3 bg-neutral-50 rounded-xl space-y-2.5">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Platform Status</p>
                      
                      <div className="divide-y divide-neutral-200/50">
                        {job.platformResults?.map((res, idx) => {
                          let PlatIcon = FaYoutube;
                          if (res.platform === "instagram_reels") PlatIcon = FaInstagram;
                          if (res.platform === "tiktok") PlatIcon = FaTiktok;

                          const labelMap = {
                            youtube: "YouTube",
                            youtube_shorts: "YT Shorts",
                            instagram_reels: "Instagram",
                            tiktok: "TikTok"
                          };

                          return (
                            <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-2.5">
                                <PlatIcon className={`w-3.5 h-3.5 shrink-0 ${
                                  res.platform.includes('youtube') ? 'text-red-500' : res.platform === 'tiktok' ? 'text-neutral-800' : 'text-pink-500'
                                }`} />
                                <span className="text-xs font-semibold text-neutral-700">{labelMap[res.platform] || res.platform}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  res.status === 'published' ? 'bg-emerald-500' : res.status === 'failed' ? 'bg-red-500' : res.status === 'publishing' ? 'bg-amber-500 animate-pulse' : 'bg-blue-400'
                                }`} />
                                <span className="text-[10px] font-bold text-neutral-500 capitalize">{res.status}</span>
                                
                                {res.status === "published" && res.liveUrl && (
                                  <a
                                    href={res.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-[#4F46E5] transition-colors"
                                    title="View Live Link"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
