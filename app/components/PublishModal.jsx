"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { X, Check, RefreshCw, Upload, AlertCircle, Film, Loader2, Link2Off } from "lucide-react";
import httpClient from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";

// Converts "02:30" or "1:02:30" → seconds. Small local copy so this component
// stays importable from anywhere without pulling in a page module.
function tsToSeconds(ts) {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function ytThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export const PLATFORM_META = {
  youtube_shorts: {
    label: "YouTube Shorts",
    color: "text-red-600",
    bg: "bg-red-500",
    hoverBg: "hover:bg-red-600",
    badge: "bg-red-50 text-red-600 border-red-200",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    maxDuration: 180,
    visibilityOptions: ["public", "unlisted", "private"],
    hashtagNote: "Max 15 hashtags recommended",
  },
  instagram_reels: {
    label: "Instagram Reels",
    color: "text-pink-600",
    bg: "bg-gradient-to-r from-purple-500 to-pink-500",
    hoverBg: "hover:brightness-110",
    badge: "bg-pink-50 text-pink-600 border-pink-200",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    maxDuration: 180,
    visibilityOptions: ["public", "private"],
    hashtagNote: "Max 30 hashtags for best reach",
  },
  both_shorts_reels: {
    label: "YouTube Shorts + Instagram Reels",
    color: "text-red-600",
    bg: "bg-gradient-to-br from-red-500 to-pink-500",
    hoverBg: "hover:brightness-110",
    badge: "bg-red-50 text-red-600 border-red-200",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    // Same vertical 9:16 format on both — 180s matches the real YouTube
    // Shorts / Instagram Reels upload cap (short.platformLimit overrides
    // this with whatever the user picked at generation time, up to 180s).
    maxDuration: 180,
    visibilityOptions: ["public", "private"],
    hashtagNote: "Kept under both platforms' limits — 15 tags max works everywhere",
  },
};

// Maps a PublishModal `platform` key to how it's saved as Content + a Publish Job.
export const PUBLISH_CONFIG = {
  youtube_shorts: { contentPlatform: "youtube", contentType: "short", jobPlatform: "youtube_shorts" },
  instagram_reels: { contentPlatform: "instagram", contentType: "reel", jobPlatform: "instagram_reels" },
};

/**
 * Publishes a clip to YT Shorts / IG Reels / both.
 *
 * `short` describes the clip and accepts two mutually exclusive source shapes:
 *   - AI hand-off (Shorts Planner, unedited): { sourceUrl, videoId, timestampStart, timestampEnd }
 *     — the backend re-downloads and cuts the range from YouTube at publish time.
 *   - Already-rendered (Video Editor): { uploadId, durationSec } — publishes the
 *     locally edited/captioned file as-is, no re-download.
 * Both shapes also accept title/description/hashtags/thumbnailUrl.
 */
export default function PublishModal({ short, platform, onClose }) {
  const meta = PLATFORM_META[platform];
  const isFromUpload = !!short.uploadId;
  const isBoth = platform === "both_shorts_reels";
  const needsYouTube = platform === "youtube_shorts" || isBoth;
  const needsInstagram = platform === "instagram_reels" || isBoth;

  const [title, setTitle] = useState(short.title || "");
  const [description, setDescription] = useState(short.description || "");
  const [hashtags, setHashtags] = useState((short.hashtags || []).map((t) => `#${t}`).join(" "));
  const [visibility, setVisibility] = useState("public");
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  // 'pillarbox' vs 'fill' only matters when publishing straight from a YouTube
  // source — an already-rendered upload was already cropped at Cut time.
  const [verticalStyle, setVerticalStyle] = useState("pillarbox");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Checks the platform(s) this publish targets are actually connected
  // before showing the form — publishing to a disconnected account would
  // otherwise silently fail in the background job, minutes after the user
  // thinks they've published.
  const [connCheck, setConnCheck] = useState({ loading: true, youtube: true, instagram: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ytRes, igRes] = await Promise.all([
          needsYouTube ? httpClient.get(ENDPOINTS.PUBLISH.YOUTUBE_STATUS) : Promise.resolve(null),
          needsInstagram ? httpClient.get(ENDPOINTS.PUBLISH.INSTAGRAM_STATUS) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setConnCheck({
          loading: false,
          youtube: needsYouTube ? !!ytRes?.data?.connected : true,
          instagram: needsInstagram ? !!igRes?.data?.connected : true,
        });
      } catch {
        // If the status check itself fails, don't block publishing on it —
        // the platform adapter will surface a clear error if truly disconnected.
        if (!cancelled) setConnCheck({ loading: false, youtube: true, instagram: true });
      }
    })();
    return () => { cancelled = true; };
  }, [needsYouTube, needsInstagram]);

  const missingConnections = [
    ...(needsYouTube && !connCheck.youtube ? ["YouTube"] : []),
    ...(needsInstagram && !connCheck.instagram ? ["Instagram"] : []),
  ];

  const durationSec = short.durationSec || (tsToSeconds(short.timestampEnd) - tsToSeconds(short.timestampStart));
  // Respect the max duration the user picked at generation time (up to 5 min)
  // instead of a hardcoded per-platform cap — keeps this in sync with ShortCard's ytOk/igOk.
  const platformLimit = short.platformLimit || meta.maxDuration;
  const withinLimit = durationSec <= platformLimit;
  // One place to derive the accent color per platform — reused across the
  // header icon, the "Done" button, and the main publish button below.
  const accentIconBg = isBoth
    ? "bg-gradient-to-br from-red-500 to-pink-500"
    : platform.startsWith("youtube")
    ? "bg-red-500"
    : "bg-gradient-to-br from-purple-500 to-pink-500";
  const accentBtnClass = isBoth
    ? "bg-gradient-to-r from-red-500 to-pink-500 hover:brightness-110"
    : platform.startsWith("youtube")
    ? "bg-red-500 hover:bg-red-600"
    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110";

  // Creates ONE Content record + ONE linked Publish Job covering every
  // platform this modal targets (a single platform, or both). Previously
  // "Publish to Both" called this once per platform, which created two
  // duplicate Content Hub cards and — worse — two independent publish jobs
  // that each re-downloaded and re-converted the same YouTube clip from
  // scratch. The backend's executePublishJob already downloads/converts once
  // and loops over however many platforms are in a single job's platformResults,
  // so sending one combined request is both correct and free — no backend work needed.
  const publishToPlatforms = async (platformKeys) => {
    const configs = platformKeys.map((k) => PUBLISH_CONFIG[k]);
    const contentPlatforms = [...new Set(configs.map((c) => c.contentPlatform))];
    const jobPlatforms = configs.map((c) => c.jobPlatform);
    const contentType = configs[0].contentType;
    const thumbUrl = short.thumbnailUrl        // custom/AI-generated thumbnail, if set
      || (short.videoId ? ytThumbnail(short.videoId) : "");  // maxresdefault fallback
    const fullDescription = `${description}\n\n${hashtags}`.trim();

    // Step 1 — create a single Content record so it shows up once in Content Hub
    const contentRes = await httpClient.post("/content/create", {
      title,
      description: fullDescription,
      tags: short.hashtags || [],
      hashtags: short.hashtags || [],
      platform: contentPlatforms,
      contentType,
      status: scheduleType === "later" ? "SCHEDULED" : "PUBLISHED",
      thumbnail: thumbUrl,
      thumbnails: { youtube: thumbUrl, instagram: thumbUrl, shorts: thumbUrl },
      videoUrl: short.sourceUrl || "",
      duration: `${durationSec}s`,
      publishedDate: scheduleType === "now" ? new Date().toISOString() : undefined,
    });

    const contentId = contentRes?.data?._id || contentRes?.data?.id;

    // Step 2 — create ONE publish job targeting every platform. Publish from
    // the already-rendered file (uploadId) when available so the edited
    // cut/captions actually go out — otherwise fall back to re-deriving the
    // clip from the YouTube source + timestamps (downloaded/converted once,
    // then reused across every platform in this job).
    await httpClient.post("/publish/create", {
      ...(isFromUpload
        ? { uploadId: short.uploadId }
        : {
            sourceUrl: short.sourceUrl,
            youtubeVideoId: short.videoId,
            timestampStart: short.timestampStart,
            timestampEnd: short.timestampEnd,
            verticalStyle,
          }),
      durationSec,
      title,
      description: fullDescription,
      tags: short.hashtags || [],
      platforms: jobPlatforms,
      visibility,
      thumbnailUrl: thumbUrl,   // YouTube maxresdefault so adapter can upload it
      contentId: contentId || undefined,
      scheduledAt: scheduleType === "later" && scheduledAt ? scheduledAt : new Date().toISOString(),
    });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setErrorMsg("");
    try {
      const targets = isBoth ? ["youtube_shorts", "instagram_reels"] : [platform];
      await publishToPlatforms(targets);
      setPublishResult("success");
    } catch (e) {
      setErrorMsg(e?.message || "Something went wrong.");
      setPublishResult("error");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.96, y: 16, filter: "blur(4px)" }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="bg-white rounded-[1.75rem] shadow-[0_24px_70px_-16px_rgba(0,0,0,0.25)] w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F5F8]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${accentIconBg}`}>
              {meta.icon}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#111318]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Publish to {meta.label}</h3>
              <p className="text-[11px] text-neutral-400">
                {isFromUpload ? "Edited clip" : `${short.timestampStart} → ${short.timestampEnd}`} · {durationSec}s
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-neutral-400 transition-colors duration-300">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {connCheck.loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-300" strokeWidth={1.5} />
            <p className="text-sm text-neutral-400 font-medium">Checking connected accounts…</p>
          </div>
        ) : missingConnections.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-100">
              <Link2Off className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
            </div>
            <h4 className="text-lg font-semibold text-[#111318]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{missingConnections.join(" & ")} not connected</h4>
            <p className="text-sm text-neutral-500 max-w-xs">
              Connect your {missingConnections.join(" and ")} account{missingConnections.length > 1 ? "s" : ""} in Settings before publishing {isBoth ? "to both platforms" : `to ${meta.label}`}.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#E2E4E9] text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
                Cancel
              </button>
              <Link href="/settings" className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-300 shadow-md">
                Go to Settings
              </Link>
            </div>
          </div>
        ) : publishResult === "success" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${errorMsg ? "bg-amber-100" : "bg-emerald-100"}`}>
              <Check className={`w-8 h-8 ${errorMsg ? "text-amber-500" : "text-emerald-500"}`} strokeWidth={1.5} />
            </div>
            <h4 className="text-lg font-semibold text-[#111318]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{errorMsg ? "Partially Published" : "Publish Job Created!"}</h4>
            <p className="text-sm text-neutral-500 text-center">
              {errorMsg || `Your clip has been queued for publishing to ${meta.label}. Check the Publish section to track status.`}
            </p>
            <button onClick={onClose} className={`px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-colors duration-300 ${accentBtnClass}`}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Thumbnail + clip info side by side */}
              <div className="flex gap-4 p-4 bg-neutral-50 rounded-2xl border border-[#E2E4E9]">
                <div className="shrink-0 rounded-2xl overflow-hidden border border-neutral-200" style={{ width: 60, height: 107 }}>
                  {short.thumbnailUrl || short.videoId ? (
                    <img src={short.thumbnailUrl || ytThumbnail(short.videoId)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-[#111318] line-clamp-2 mb-1">{short.title}</p>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${withinLimit ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-500 border-red-200"}`}>
                      {durationSec}s {withinLimit ? "✓" : `— exceeds ${platformLimit}s limit!`}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">{short.hook}</p>
                </div>
              </div>

              {/* Vertical style — only matters when ffmpeg still has to crop this
                  clip fresh from YouTube. An already-rendered upload (from the
                  Editor) was cropped at Cut time, so there's nothing left to choose. */}
              {!isFromUpload && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Vertical Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "pillarbox", label: "Blurred Background", desc: "Full frame kept, letterboxed" },
                      { key: "fill", label: "Full Screen Crop", desc: "Fills the frame, edges trimmed" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setVerticalStyle(opt.key)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-colors duration-300 ${verticalStyle === opt.key ? "border-purple-400 bg-purple-50" : "border-[#E2E4E9] hover:bg-neutral-50"}`}
                      >
                        <div className="relative w-6 bg-neutral-900 rounded overflow-hidden shrink-0" style={{ aspectRatio: "9/16" }}>
                          {opt.key === "pillarbox" ? (
                            <>
                              <div className="absolute inset-0 bg-neutral-600/50" />
                              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[45%] bg-neutral-300" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-neutral-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-black ${verticalStyle === opt.key ? "text-purple-700" : "text-[#111318]"}`}>{opt.label}</p>
                          <p className="text-[9px] text-neutral-400 leading-snug">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-2.5 text-sm font-bold outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-400/15 transition-all duration-300"
                />
                <p className="text-[10px] text-neutral-400 mt-1 text-right">{title.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-400/15 transition-all duration-300 resize-none"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Hashtags</label>
                <input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#shorts #reels #viral"
                  className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-400/15 transition-all duration-300"
                />
                <p className="text-[10px] text-neutral-400 mt-1">{meta.hashtagNote}</p>
              </div>

              {/* Visibility */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Visibility</label>
                <div className="flex gap-2">
                  {meta.visibilityOptions.map((v) => (
                    <button key={v} onClick={() => setVisibility(v)}
                      className={`flex-1 py-2 rounded-full text-[11px] font-bold border capitalize transition-colors duration-300 ${visibility === v ? "border-purple-400 bg-purple-50 text-purple-700" : "border-[#E2E4E9] text-neutral-500 hover:bg-neutral-50"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">When to Publish</label>
                <div className="flex gap-2 mb-2">
                  {["now", "later"].map((t) => (
                    <button key={t} onClick={() => setScheduleType(t)}
                      className={`flex-1 py-2 rounded-full text-[11px] font-bold border capitalize transition-colors duration-300 ${scheduleType === t ? "border-purple-400 bg-purple-50 text-purple-700" : "border-[#E2E4E9] text-neutral-500 hover:bg-neutral-50"}`}>
                      {t === "now" ? "Publish Now" : "Schedule Later"}
                    </button>
                  ))}
                </div>
                {scheduleType === "later" && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-[3px] focus:ring-purple-400/15 transition-all duration-300"
                  />
                )}
              </div>

              {/* Source clip info — no manual upload needed */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-[#E2E4E9] rounded-2xl">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--t-primary-light)" }}>
                  <Film className="w-4 h-4" style={{ color: "var(--t-primary)" }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  {isFromUpload ? (
                    <p className="text-[11px] font-bold text-neutral-700">Edited clip · {durationSec}s (includes your cuts/captions)</p>
                  ) : (
                    <>
                      <p className="text-[11px] font-bold text-neutral-700">Clip: {short.timestampStart} → {short.timestampEnd} ({durationSec}s)</p>
                      <p className="text-[10px] text-neutral-400 truncate">{short.sourceUrl || `youtube.com/watch?v=${short.videoId}`}</p>
                    </>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-600 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} /> {errorMsg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#F4F5F8] flex items-center justify-end gap-3 bg-[#FAFBFC] rounded-b-[1.75rem]">
              <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#E2E4E9] text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-bold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${accentBtnClass} shadow-md`}
              >
                {isPublishing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} /> Publishing…</>
                ) : (
                  <><Upload className="w-4 h-4" strokeWidth={1.5} /> {scheduleType === "later" ? "Schedule" : "Publish Now"}</>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
