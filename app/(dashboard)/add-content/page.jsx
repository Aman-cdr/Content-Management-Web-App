"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, Upload, FileText, Video, Image as Img, Mic,
  ArrowRight, ArrowLeft, AlignLeft, Link as LinkIcon,
  ChevronDown, Loader2, Clock, Calendar, Play, Tag, X,
  AlertCircle, CheckCircle, Trash2
} from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaTwitter } from "react-icons/fa";
import { useContent } from "@/context/ContentContext";
import AISuggestButton from "./AISuggestButton";
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

const TYPES = [
  { id: "video",   label: "Video",   sub: "YouTube, Reels, Shorts",   icon: Video,    gradient: "from-blue-500/10 to-blue-600/5",       color: "text-blue-500"    },
  { id: "article", label: "Article", sub: "Blog post, Thread",         icon: FileText, gradient: "from-amber-500/10 to-amber-600/5",     color: "text-amber-500"   },
  { id: "image",   label: "Image",   sub: "Carousel, Infographic",     icon: Img,      gradient: "from-emerald-500/10 to-emerald-600/5", color: "text-emerald-500" },
  { id: "podcast", label: "Podcast", sub: "Episode, Interview",        icon: Mic,      gradient: "from-rose-500/10 to-rose-600/5",       color: "text-rose-500"    },
];

const PLATFORMS = [
  { id: "Instagram", icon: FaInstagram, brand: "#E1306C" },
  { id: "YT Shorts", icon: FaYoutube,   brand: "#FF0000" },
  { id: "YouTube",   icon: FaYoutube,   brand: "#FF0000" },
  { id: "TikTok",    icon: FaTiktok,    brand: "#010101" },
  { id: "Twitter/X", icon: FaTwitter,   brand: "#1DA1F2" },
];

const STEPS = [
  { label: "Details",        sub: "Title, type & platforms" },
  { label: "Media & Script", sub: "Thumbnails & content"    },
  { label: "Review",         sub: "Final check"             },
];

const DRAFT_KEY = "cms-add-content-draft";

// ─── Thumbnail Zone ───────────────────────────────────────────────────────────
function ThumbnailZone({ label, ratio, dims, value, onChange, onNotify }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file) => {
    if (!file.type.startsWith("image/")) {
      if (onNotify) onNotify("error", "Invalid file type. Only image files are allowed.");
      return;
    }
    setUploading(true);
    setProgress(0);

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
          setProgress(percentCompleted);
        },
      });

      if (res.success && res.data) {
        onChange(res.data.url);
        if (onNotify) onNotify("success", `${label} thumbnail uploaded successfully!`);
      } else {
        throw new Error(res.message || "Thumbnail upload failed");
      }
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify("error", err.message || "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = (e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); };
    input.click();
  };

  const PlatformIcon = label.includes("Instagram") ? FaInstagram : FaYoutube;
  const brandColor   = label.includes("Instagram") ? "#E1306C" : "#FF0000";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); }}
      onClick={uploading ? null : handleClick}
      className={`relative flex-1 min-h-[170px] rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer group transition-all
        ${dragging
          ? "border-2 border-[#6366F1] bg-indigo-50"
          : value ? "" : "border-2 border-dashed border-[#D1D5DB] hover:border-[#6366F1] hover:bg-white/60"
        }`}
    >
      {value ? (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-red-500 z-10 transition-colors"
          >✕</button>
        </div>
      ) : uploading ? (
        <div className="text-center p-4 w-full flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          <div className="text-[12px] font-bold text-neutral-600">Uploading {progress}%</div>
          <div className="w-2/3 bg-neutral-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#6366F1] h-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform" style={{ backgroundColor: brandColor }}>
            <PlatformIcon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-[#374151]">{label}</div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">{ratio} · {dims}</div>
          </div>
          <div className="text-[11px] font-semibold text-[#6366F1] flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="w-3 h-3" /> Click or drag
          </div>
        </>
      )}
    </div>
  );
}

// ─── Field section wrapper ────────────────────────────────────────────────────
function Field({ label, required, optional, hint, action, children }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#1A1D23]">{label}</span>
          {required && <span className="text-[11px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-md">Required</span>}
          {optional && <span className="text-[12px] text-[#9CA3AF]">· Optional</span>}
        </div>
        {action}
      </div>
      {hint && <p className="text-[12px] text-neutral-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 bg-white border border-[#E2E4E9] rounded-xl text-sm text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all";

// ─── AI pill button ───────────────────────────────────────────────────────────
const aiBtnCls = "flex items-center gap-1.5 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-full px-4 py-1.5 text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-sm shadow-indigo-500/20";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AddContentPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit");
  const { addContent, updateContent, getContentById } = useContent();

  const [step,        setStep]        = useState(0);
  const [title,       setTitle]       = useState("");
  const [type,        setType]        = useState("");
  const [platforms,   setPlatforms]   = useState([]);
  const [description,   setDescription]   = useState("");
  const [descWordCount, setDescWordCount] = useState(200);
  const [script,      setScript]      = useState("");
  const [references,  setReferences]  = useState("");
  const [thumbnails,  setThumbnails]  = useState({});
  const [scriptOpen,  setScriptOpen]  = useState(false);

  // New states for tags, upload, schedule & alerts
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState("");
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [publishType, setPublishType] = useState("draft"); // "draft" | "now" | "schedule"
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  const fileInputRef = useRef(null);
  const draftRef = useRef({});

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setDraftSavedAt(null);
  };

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.step != null) setStep(d.step);
      if (d.title) setTitle(d.title);
      if (d.type) setType(d.type);
      if (d.platforms) setPlatforms(d.platforms);
      if (d.description) setDescription(d.description);
      if (d.script) setScript(d.script);
      if (d.references) setReferences(d.references);
      if (d.thumbnails) setThumbnails(d.thumbnails);
      if (d.tags) setTags(d.tags);
      if (d.publishType) setPublishType(d.publishType);
      if (d.scheduleDate) setScheduleDate(d.scheduleDate);
      if (d.uploadedVideo) setUploadedVideo(d.uploadedVideo);
    } catch {}
    setShowRestoreBanner(false);
  };

  // Keep a ref with latest form values so the interval always reads fresh state
  useEffect(() => {
    draftRef.current = { step, title, type, platforms, description, script, references, thumbnails, tags, publishType, scheduleDate, uploadedVideo };
  }, [step, title, type, platforms, description, script, references, thumbnails, tags, publishType, scheduleDate, uploadedVideo]);

  // Auto-save every 30 s (only in new-content mode)
  useEffect(() => {
    if (editId) return;
    const timer = setInterval(() => {
      const d = draftRef.current;
      if (!d.title && !d.description && !d.script) return; // nothing worth saving yet
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
        setDraftSavedAt(new Date());
      } catch {}
    }, 30_000);
    return () => clearInterval(timer);
  }, [editId]);

  // On mount: check for a saved draft and offer to restore (new-content mode only)
  useEffect(() => {
    if (editId) return;
    const seriesId = searchParams.get("seriesId");
    if (seriesId) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title || d.description || d.script) setShowRestoreBanner(true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVideoUpload = async (file) => {
    if (!file.type.startsWith("video/")) {
      showNotification("error", "Invalid file type. Only video files are allowed.");
      return;
    }

    setIsUploadingVideo(true);
    setVideoProgress(0);
    setUploadedVideo(null);

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
          setVideoProgress(percentCompleted);
        },
      });

      if (res.success && res.data) {
        setUploadedVideo(res.data);
        showNotification("success", "Video uploaded successfully to staging server!");
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
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!uploadedVideo) return;
    const fileId = uploadedVideo._id || uploadedVideo.id;
    try {
      await httpClient.delete(ENDPOINTS.UPLOAD.DELETE(fileId));
      setUploadedVideo(null);
      showNotification("success", "Uploaded file cleared");
    } catch (err) {
      console.error("Failed to delete upload:", err);
      setUploadedVideo(null);
    }
  };

  useEffect(() => {
    if (editId) {
      let item = getContentById(editId);
      if (!item && parseInt(editId) >= 100) {
        const n = parseInt(editId);
        item = {
          title: n === 100 ? "Introduction & Setup" : `Episode ${n - 99}`,
          type: "video", platforms: ["YouTube", "YT Shorts"],
          description: "Pre-planned episode from the Series Planner.",
          script: "# Welcome!\n\nIn this video we cover...",
          thumbnails: { youtube: "/thumbnails/thumb1.png" },
        };
      }
      if (item) {
        setTitle(item.title || ""); setType(item.type || "");
        setPlatforms(item.platforms || []); setDescription(item.description || "");
        setScript(item.script || ""); setReferences(item.references || "");
        setThumbnails(item.thumbnails || {});
        setTags(item.tags || []);
        if (item.uploadId || item.videoUrl) {
          setUploadedVideo({
            _id: item.uploadId,
            url: item.videoUrl,
            originalName: item.videoUrl ? item.videoUrl.substring(item.videoUrl.lastIndexOf('/') + 1) : "Staged Video File",
            size: 0
          });
        }
      }
    } else {
      const seriesId   = searchParams.get("seriesId");
      const seriesName = searchParams.get("seriesName");
      const urlTitle   = searchParams.get("title");
      if (seriesId && seriesName) {
        setTitle(urlTitle || "");
        setType("video");
        setDescription(`Part of the "${seriesName}" series.`);
      }
    }
  }, [editId, getContentById, searchParams]);

  const togglePlatform = (id) =>
    setPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const step0Valid  = title.trim().length > 0 && !!type;
  const canContinue = step === 0 ? step0Valid : true;

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  const checklist = [
    { label: "Title added",           ok: !!title.trim()       },
    { label: "Content type selected", ok: !!type               },
    { label: "Platform selected",     ok: platforms.length > 0 },
    { label: "Description provided",  ok: !!description.trim() },
    { label: "Script written",        ok: !!script.trim()      },
  ];

  const save = async (actionType) => {
    let dbStatus = "IDEA";
    if (actionType === "draft") {
      dbStatus = "IDEA";
    } else if (publishType === "now") {
      dbStatus = "PUBLISHED";
    } else if (publishType === "schedule") {
      dbStatus = "SCHEDULED";
    }

    const backendPlatform = [...new Set(platforms.map(p => {
      if (p === "YouTube" || p === "YT Shorts") return "youtube";
      if (p === "Instagram") return "instagram";
      if (p === "TikTok") return "tiktok";
      if (p === "Twitter/X") return "twitter";
      return "other";
    }))];

    const effectiveContentType = (type === "video" && platforms.includes("YT Shorts")) ? "short" : type;

    const data = {
      title,
      contentType: effectiveContentType,
      type: effectiveContentType,
      platform: backendPlatform,
      platforms,
      description,
      script,
      references,
      tags,
      status: dbStatus,
      thumbnail: thumbnails.youtube || thumbnails.shorts || thumbnails.instagram || "",
      thumbnails,
    };

    if (type === "video" && uploadedVideo) {
      data.videoUrl = uploadedVideo.url;
      data.uploadId = uploadedVideo._id || uploadedVideo.id;
    }

    setIsSubmitting(true);

    try {
      let savedItem = null;
      if (editId) {
        await updateContent(editId, data);
        savedItem = { id: editId, ...data };
      } else {
        savedItem = await addContent(data);
      }

      // If actionType is not draft (i.e., we are publishing or scheduling) and it's a video
      if (actionType !== "draft" && type === "video" && uploadedVideo) {
        const fileId = uploadedVideo._id || uploadedVideo.id;
        const mappedPublishPlatforms = platforms.map(p => {
          if (p === "YouTube") return "youtube";
          if (p === "YT Shorts") return "youtube_shorts";
          if (p === "Instagram") return "instagram_reels";
          if (p === "TikTok") return "tiktok";
          return null;
        }).filter(Boolean);

        if (mappedPublishPlatforms.length > 0) {
          let scheduledAt = new Date().toISOString();
          if (publishType === "schedule" && scheduleDate) {
            scheduledAt = new Date(scheduleDate).toISOString();
          }

          const publishPayload = {
            uploadId: fileId,
            contentId: savedItem?.id || savedItem?._id || editId,
            title: title.trim(),
            description: description.trim(),
            tags: tags,
            platforms: mappedPublishPlatforms,
            scheduledAt,
            thumbnailUrl: thumbnails.youtube || thumbnails.shorts || thumbnails.instagram || ""
          };

          const res = await httpClient.post(ENDPOINTS.PUBLISH.CREATE, publishPayload);
          if (res.success) {
            showNotification("success", publishType === "now" ? "Publishing job started!" : "Publishing job scheduled!");
          } else {
            throw new Error(res.message || "Failed to create publishing job");
          }
        }
      } else {
        showNotification("success", "Content saved successfully!");
      }

      clearDraft();
      setTimeout(() => {
        router.push("/all-content");
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
      showNotification("error", err.message || "Failed to save content");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

      {/* Draft Restore Banner */}
      <AnimatePresence>
        {showRestoreBanner && !editId && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-6 left-[280px] right-6 z-40 flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border border-amber-200 bg-amber-50 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800">You have an unsaved draft — restore it to continue where you left off.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={restoreDraft}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                Restore
              </button>
              <button
                onClick={() => { setShowRestoreBanner(false); clearDraft(); }}
                className="px-3 py-1.5 bg-white text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full px-8 xl:px-14 pb-32 space-y-10">

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <div>
          {/* Thin progress track */}
          <div className="relative h-[3px] bg-[#E9EAEC] rounded-full overflow-hidden mb-5">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          {/* Step labels */}
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const done   = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                        ${done ? "bg-emerald-500 text-white" : active ? "text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}
                      style={active ? { backgroundColor: "var(--t-primary)" } : {}}
                    >
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-[13px] font-semibold transition-colors
                      ${active ? "text-[#111318]" : done ? "text-neutral-500" : "text-[#9CA3AF]"}`}>
                      {s.label}
                    </span>
                  </div>
                  {active && (
                    <p className="text-[11px] text-neutral-400 mt-1 ml-8">{s.sub}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >

            {/* ── Step 0: Details ─────────────────────────────────────── */}
            {step === 0 && (
              <>
                {/* Title */}
                <Field
                  label="Title" required
                  action={
                    <div className="relative">
                      <AISuggestButton type="title" context={title} onSelect={setTitle}
                        buttonClass={aiBtnCls}
                        dropdownClass="absolute right-0 top-[calc(100%+8px)] w-[300px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                      />
                    </div>
                  }
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm select-none">#</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      placeholder="e.g., How to Master Tailwind CSS in 2026"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  <div className="text-right text-[11px] text-neutral-400">{title.length}/100</div>
                </Field>

                {/* Content Type */}
                <Field
                  label="Content Type" required
                  action={
                    <button onClick={() => setType(TYPES[Math.floor(Math.random() * TYPES.length)].id)} className={aiBtnCls}>
                      <Sparkles className="w-3 h-3" /> Auto-Select
                    </button>
                  }
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className="relative py-6 px-3 rounded-2xl text-center transition-all group border bg-white hover:shadow-sm"
                        style={type === t.id
                          ? { borderWidth: "2px", borderColor: "var(--t-primary)", boxShadow: "0 0 0 4px var(--t-primary-light)" }
                          : { borderColor: "#E2E4E9" }}
                      >
                        {type === t.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--t-primary)" }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                          <t.icon className={`w-6 h-6 ${t.color}`} />
                        </div>
                        <div className="text-[14px] font-semibold text-[#111318]">{t.label}</div>
                        <div className="text-[11px] text-[#9CA3AF] mt-0.5">{t.sub}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Platforms */}
                <Field
                  label="Publish to"
                  hint="Select the platforms where this content will be published."
                  action={
                    platforms.length === PLATFORMS.length
                      ? <button onClick={() => setPlatforms([])} className="text-[12px] font-semibold text-red-400 hover:text-red-600 transition-colors">Clear all</button>
                      : <button onClick={() => setPlatforms(PLATFORMS.map((p) => p.id))} className="text-[12px] font-semibold text-[#6366F1] hover:text-indigo-700 transition-colors">Select all</button>
                  }
                >
                  <div className="flex flex-wrap gap-2.5">
                    {PLATFORMS.map((p) => {
                      const active = platforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-95"
                          style={active
                            ? { border: `1.5px solid ${p.brand}`, backgroundColor: `${p.brand}12`, color: p.brand }
                            : { border: "1.5px solid #E2E4E9", backgroundColor: "#FFFFFF", color: "#374151" }
                          }
                        >
                          <p.icon className="w-3.5 h-3.5" style={{ color: p.brand }} />
                          {p.id}
                        </button>
                      );
                    })}
                  </div>
                  {platforms.length === 0 && (
                    <p className="text-[11px] text-amber-500 mt-1">No platform selected — content will be saved as a draft.</p>
                  )}
                </Field>

                {/* Description */}
                <Field
                  label="Description" optional
                  hint="Full platform description — supports YouTube-style long descriptions with timestamps, hashtags, and links."
                  action={
                    <div className="flex items-center gap-2">
                      <select
                        value={descWordCount}
                        onChange={(e) => setDescWordCount(Number(e.target.value))}
                        className="text-[11px] font-semibold text-[#6366F1] bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        {[50, 100, 150, 200, 300, 500].map(w => (
                          <option key={w} value={w}>{w} words</option>
                        ))}
                      </select>
                      <div className="relative">
                        <AISuggestButton type="description" context={title} wordCount={descWordCount} onSelect={setDescription}
                          buttonClass={aiBtnCls}
                          dropdownClass="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                        />
                      </div>
                    </div>
                  }
                >
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                    rows={8}
                    placeholder="Write a full description for your content — include timestamps, links, hashtags, and anything you'd put in a YouTube description box..."
                    className={`${inputCls} resize-y leading-relaxed`}
                  />
                  <div className="text-right text-[11px] text-neutral-400">{description.length}/5000</div>
                </Field>

                {/* Tags */}
                <Field
                  label="Tags / Keywords"
                  optional
                  hint="Add keywords to categorize your content and help search algorithms find it."
                >
                  <div className="bg-white border border-[#E2E4E9] rounded-xl p-3 flex flex-wrap gap-2 items-center">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-50 border border-[#E2E4E9] px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-700 flex items-center gap-1.5 shadow-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, idx2) => idx2 !== idx))}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const val = tagInput.trim().replace(/,/g, "");
                          if (val && !tags.includes(val)) {
                            setTags([...tags, val]);
                            setTagInput("");
                          }
                        }
                      }}
                      className="bg-transparent border-none outline-none text-xs font-semibold py-1 px-1 flex-1 min-w-[150px] placeholder:text-[#B8BCC8]"
                    />
                  </div>
                </Field>
              </>
            )}

            {/* ── Step 1: Media & Script ───────────────────────────────── */}
            {step === 1 && (
              <>
                {/* Video Upload Section */}
                {type === "video" && (
                  <Field label="Upload Video File" hint="Upload the video that you want to publish or schedule.">
                    {!uploadedVideo && !isUploadingVideo ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={async (e) => {
                          e.preventDefault(); e.stopPropagation();
                          if (e.dataTransfer.files?.[0]) handleVideoUpload(e.dataTransfer.files[0]);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#D1D5DB] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#6366F1] hover:bg-white/60 transition-all group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={(e) => { if (e.target.files?.[0]) handleVideoUpload(e.target.files[0]); }}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-center text-neutral-400 group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-semibold text-[#374151]">Drag & drop video here, or <span className="text-[#6366F1] hover:underline">browse</span></p>
                          <p className="text-[11px] text-[#9CA3AF] mt-0.5">Supports MP4, MOV, WebM (Max 500MB)</p>
                        </div>
                      </div>
                    ) : isUploadingVideo ? (
                      <div className="border border-neutral-100 bg-neutral-50/50 rounded-2xl p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
                            <div>
                              <p className="text-sm font-bold text-neutral-800">Uploading video to server...</p>
                              <p className="text-xs text-neutral-400 font-medium">Please do not close this tab</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#6366F1]">{videoProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#6366F1] h-2 rounded-full transition-all duration-200"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 rounded-lg overflow-hidden border border-[#E2E4E9] bg-neutral-100 flex items-center justify-center shrink-0">
                            <video src={uploadedVideo.url} className="w-full h-full object-cover" preload="metadata" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-neutral-800 truncate max-w-xs">{uploadedVideo.originalName || uploadedVideo.fileName}</p>
                            <p className="text-[10px] text-neutral-500 font-medium">{formatBytes(uploadedVideo.size || 0)} • Ready for publishing</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                          title="Remove Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </Field>
                )}

                {/* Thumbnails */}
                <Field label="Thumbnails" hint="Upload platform-specific thumbnails. Drag & drop or click each zone.">
                  <div className="flex gap-4">
                    <ThumbnailZone label="Instagram Reels" ratio="9:16" dims="1080×1920" value={thumbnails.instagram} onChange={(v) => setThumbnails((t) => ({ ...t, instagram: v }))} onNotify={showNotification} />
                    <ThumbnailZone label="YouTube Shorts"  ratio="9:16" dims="1080×1920" value={thumbnails.shorts}    onChange={(v) => setThumbnails((t) => ({ ...t, shorts: v }))}    onNotify={showNotification} />
                    <ThumbnailZone label="YouTube"         ratio="16:9" dims="1920×1080" value={thumbnails.youtube}   onChange={(v) => setThumbnails((t) => ({ ...t, youtube: v }))}   onNotify={showNotification} />
                  </div>
                </Field>

                {/* Script */}
                <Field
                  label="Content Script"
                  hint="Write your full script — intro, hook, main points, CTA."
                  action={
                    <div className="relative">
                      <AISuggestButton type="script" context={title} description={description} onSelect={setScript}
                        buttonClass={aiBtnCls}
                        dropdownClass="absolute right-0 bottom-[calc(100%+8px)] w-[340px] bg-white border border-[#E2E4E9] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.10)] z-50 overflow-hidden"
                      />
                    </div>
                  }
                >
                  <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden bg-white focus-within:border-[#6366F1] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all">
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={14}
                      placeholder="Write your script here..."
                      className="w-full px-5 py-4 bg-transparent text-sm text-[#111318] placeholder:text-[#B8BCC8] focus:outline-none resize-none leading-relaxed"
                    />
                    <div className="px-5 py-3 border-t border-[#F0F1F3] flex items-center gap-2 bg-[#FAFAFA]">
                      <span className="bg-white border border-[#E2E4E9] rounded-full px-2.5 py-0.5 text-[11px] text-[#6B7280] font-semibold">{wordCount} words</span>
                      <span className="bg-white border border-[#E2E4E9] rounded-full px-2.5 py-0.5 text-[11px] text-[#6B7280] font-semibold">~{readTime} min read</span>
                    </div>
                  </div>
                </Field>

                {/* References */}
                <Field label="References" optional hint="Links, notes, or research sources for this content.">
                  <textarea
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    rows={3}
                    placeholder="https://..."
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </>
            )}

            {/* ── Step 2: Review ───────────────────────────────────────── */}
            {step === 2 && (
              <>
                {/* Content summary */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[20px] font-bold text-[#0F0F0F] leading-tight">{title || "Untitled"}</h3>
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {type && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-bold rounded-lg border border-indigo-100 capitalize">{type}</span>}
                        {platforms.map((p) => (
                          <span key={p} className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] text-[11px] font-medium rounded-lg border border-[#E5E7EB]">{p}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex-shrink-0 ml-4">
                      {checklist.filter((c) => c.ok).length}/{checklist.length} complete
                    </span>
                  </div>
                  {description && <p className="text-[14px] text-neutral-500 leading-relaxed">{description}</p>}
                  <div className="flex flex-wrap gap-4 mt-2">
                    {type === "video" && uploadedVideo && (
                      <div className="w-36 h-20 rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-100 relative">
                        <video src={uploadedVideo.url} className="w-full h-full object-cover" preload="metadata" />
                      </div>
                    )}
                    {Object.values(thumbnails).filter(Boolean).length > 0 && (
                      <div className="flex gap-3">
                        {Object.entries(thumbnails).filter(([, v]) => v).map(([k, v]) => (
                          <img key={k} src={v} alt={k} className="h-20 rounded-xl border border-[#E5E7EB] object-cover shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  {script && (
                    <div className="rounded-2xl border border-[#E2E4E9] overflow-hidden bg-white">
                      <button
                        onClick={() => setScriptOpen(!scriptOpen)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F9FAFB] transition-colors"
                      >
                        <span className="text-[13px] font-semibold text-[#374151] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" /> Script Preview
                        </span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${scriptOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {scriptOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                            <pre className="text-[11px] text-neutral-500 px-5 py-4 whitespace-pre-wrap max-h-[260px] overflow-y-auto font-mono leading-relaxed border-t border-[#F0F1F3]">
                              {script}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Checklist</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {checklist.map((c, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                        ${c.ok ? "border-emerald-200 bg-emerald-50/60" : "border-[#E2E4E9] bg-white"}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? "bg-emerald-500" : "bg-[#E5E7EB]"}`}>
                          {c.ok ? <Check className="w-3 h-3 text-white" /> : <span className="text-[9px] text-[#9CA3AF] font-bold">–</span>}
                        </div>
                        <span className={`text-[13px] ${c.ok ? "text-[#111318] font-medium" : "text-[#9CA3AF]"}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduling Option */}
                {type === "video" && (
                  <div className="space-y-4 pt-4 border-t border-[#F0F1F3]">
                    <span className="text-[14px] font-semibold text-[#1A1D23] block">Publishing Schedule</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPublishType("now")}
                        className={`p-4 border rounded-2xl flex items-center gap-3.5 text-left cursor-pointer transition-all duration-150 ${
                          publishType === "now"
                            ? "border-[#6366F1] bg-indigo-50/20 text-[#6366F1] font-bold"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${publishType === 'now' ? 'bg-[#6366F1]/10 text-[#6366F1]' : 'bg-neutral-100 text-neutral-400'}`}>
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
                        className={`p-4 border rounded-2xl flex items-center gap-3.5 text-left cursor-pointer transition-all duration-150 ${
                          publishType === "schedule"
                            ? "border-[#6366F1] bg-indigo-50/20 text-[#6366F1] font-bold"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${publishType === 'schedule' ? 'bg-[#6366F1]/10 text-[#6366F1]' : 'bg-neutral-100 text-neutral-400'}`}>
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
                          className="bg-white border border-[#E2E4E9] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all text-[#0A0A0F]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#F0F1F3]">
                  <button
                    onClick={() => save("draft")}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-[#374151] border border-[#E2E4E9] bg-white hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
                  >
                    Save Plan / Draft
                  </button>
                  <button
                    onClick={() => save(publishType)}
                    disabled={isSubmitting || !title.trim() || platforms.length === 0 || (type === "video" && !uploadedVideo)}
                    className={`flex-1 py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-all flex items-center justify-center gap-2
                      ${isSubmitting || !title.trim() || platforms.length === 0 || (type === "video" && !uploadedVideo)
                        ? "bg-neutral-300 text-neutral-400 cursor-not-allowed"
                        : "bg-[#6366F1] hover:brightness-110 shadow-[0_4px_16px_rgba(99,102,241,0.25)]"
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : publishType === "now" ? (
                      "Publish Now"
                    ) : (
                      "Schedule Publication"
                    )}
                  </button>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom nav ────────────────────────────────────────────────── */}
      {step < 2 && (
        <div className="fixed bottom-0 left-[240px] right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#E9EAEC] px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#4B5264] hover:bg-[#F3F4F6] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <span className="text-[13px] text-neutral-400 font-medium">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</span>
              )}
              {draftSavedAt && !editId && (
                <p className="text-[10px] text-neutral-400 mt-0.5 pl-1">
                  Auto-saved {draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2" : i < step ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-[#E5E7EB]"}`}
                    style={i === step ? { backgroundColor: "var(--t-primary)" } : {}}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all
                  ${!canContinue
                    ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                    : "text-white hover:brightness-110"
                  }`}
                  style={canContinue ? { backgroundColor: "var(--t-primary)", boxShadow: "0 2px 12px var(--t-primary-glow)" } : {}}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
