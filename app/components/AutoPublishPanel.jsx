"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, X, Loader2, CheckCircle2, XCircle, ExternalLink, AlertCircle, RefreshCw,
} from "lucide-react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import httpClient from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";

// Small local copies so this component stays fully self-contained/portable —
// mirrors the same pattern already used in PublishModal.jsx and SpeedrunPanel.jsx.
function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

const DURATION_OPTIONS = [
  { value: 90, label: "90 sec" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

function formatElapsed(ms) {
  const totalDeciseconds = Math.floor(ms / 100);
  const mm = String(Math.floor(totalDeciseconds / 600)).padStart(2, "0");
  const ss = String(Math.floor((totalDeciseconds / 10) % 60)).padStart(2, "0");
  const d = totalDeciseconds % 10;
  return `${mm}:${ss}.${d}`;
}

// Stage-aware label — mirrors the same mapping already used in
// all-content/page.jsx's `publishStageLabel` (downloading/queued/uploading),
// applied per-platform-row here instead of a single summary line.
function platformLabel(pr, name) {
  if (!pr) return `${name} — queued…`;
  if (pr.status === "published") return `${name} — published`;
  if (pr.status === "failed") return `${name} — failed`;
  if (pr.stage === "downloading") return `${name} — downloading & converting…`;
  if (pr.stage === "queued") return `${name} — queued…`;
  if (pr.status === "publishing") return `${name} — uploading…`;
  return `${name} — queued…`;
}

function platformStatus(pr) {
  if (!pr) return "pending";
  if (pr.status === "published") return "done";
  if (pr.status === "failed") return "failed";
  if (pr.status === "publishing") return "active";
  return "pending";
}

function ClipCard({ clip, job }) {
  const yt = job?.platformResults?.find((p) => p.platform === "youtube_shorts");
  const ig = job?.platformResults?.find((p) => p.platform === "instagram_reels");
  const ytStatus = platformStatus(yt);
  const igStatus = platformStatus(ig);
  const cardDone = ytStatus === "done" && igStatus === "done";
  const cardFailed = ytStatus === "failed" || igStatus === "failed";

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${
      cardDone ? "border-emerald-200 bg-emerald-50/30" : cardFailed ? "border-red-200 bg-red-50/30" : "border-[#E2E4E9] bg-white"
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-[#111318] truncate">{clip.title}</p>
          <p className="text-[11px] text-neutral-400">{clip.timestampStart} – {clip.timestampEnd}</p>
        </div>
        {cardDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
        {cardFailed && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {ytStatus === "active" ? <Loader2 className="w-3 h-3 text-indigo-500 animate-spin shrink-0" /> :
           ytStatus === "done" ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> :
           ytStatus === "failed" ? <XCircle className="w-3 h-3 text-red-500 shrink-0" /> :
           <div className="w-3 h-3 flex items-center justify-center shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-neutral-300" /></div>}
          <span className={`text-[11px] font-medium ${ytStatus === "done" ? "text-emerald-700" : ytStatus === "failed" ? "text-red-600" : "text-neutral-500"}`}>
            {platformLabel(yt, "YouTube Shorts")}
          </span>
          {yt?.liveUrl && (
            <a href={yt.liveUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-red-500 hover:text-red-600">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {igStatus === "active" ? <Loader2 className="w-3 h-3 text-indigo-500 animate-spin shrink-0" /> :
           igStatus === "done" ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> :
           igStatus === "failed" ? <XCircle className="w-3 h-3 text-red-500 shrink-0" /> :
           <div className="w-3 h-3 flex items-center justify-center shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-neutral-300" /></div>}
          <span className={`text-[11px] font-medium ${igStatus === "done" ? "text-emerald-700" : igStatus === "failed" ? "text-red-600" : "text-neutral-500"}`}>
            {platformLabel(ig, "Instagram Reels")}
          </span>
          {ig?.liveUrl && (
            <a href={ig.liveUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-pink-500 hover:text-pink-600">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * "Auto-Publish Top 3": paste a URL → AI picks its 3 best clips in one ranked
 * pass → each clip is cut, converted to vertical, and published to YouTube
 * Shorts + Instagram Reels — all 3 running unattended and concurrently, with
 * a live stopwatch and per-clip tracking. Demonstrates the product running
 * a whole backlog without a human in the loop.
 *
 * No new backend endpoints — same building blocks as SpeedrunPanel.jsx
 * (/api/generate-shorts, /publish/create, GET /publish/:id polling), just
 * fanned out to 3 clips/jobs instead of 1.
 */
export default function AutoPublishPanel({ isOpen, onClose }) {
  const [url, setUrl] = useState("");
  const [videoPreview, setVideoPreview] = useState(null);
  const [maxDuration, setMaxDuration] = useState(90);
  const [phase, setPhase] = useState("idle"); // idle | analyzing | publishing | done | error
  const [clips, setClips] = useState([]); // up to 3 AI-picked clips
  const [jobs, setJobs] = useState([]); // parallel array: job doc per clip (or null until created)
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState(null);
  const [connCheck, setConnCheck] = useState({ loading: true, youtube: true, instagram: true });

  const startTimeRef = useRef(null);
  const stopwatchRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const previewDebounceRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setConnCheck({ loading: true, youtube: true, instagram: true });
    Promise.allSettled([
      httpClient.get(ENDPOINTS.PUBLISH.YOUTUBE_STATUS),
      httpClient.get(ENDPOINTS.PUBLISH.INSTAGRAM_STATUS),
    ]).then(([ytRes, igRes]) => {
      if (cancelled) return;
      setConnCheck({
        loading: false,
        youtube: ytRes.status === "fulfilled" ? !!ytRes.value?.data?.connected : false,
        instagram: igRes.status === "fulfilled" ? !!igRes.value?.data?.connected : false,
      });
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    const videoId = extractYouTubeId(url);
    if (!videoId) { setVideoPreview(null); return; }
    previewDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (res.ok) {
          const data = await res.json();
          setVideoPreview({ title: data.title, channel: data.author_name, videoId });
        }
      } catch {}
    }, 600);
    return () => clearTimeout(previewDebounceRef.current);
  }, [url]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const startStopwatch = () => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    stopwatchRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
  };

  const stopStopwatch = () => {
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
  };

  const isTerminal = (job) => job && (job.status === "published" || job.status === "failed");

  // Single tick, every 2s, re-fetches every job that hasn't reached a
  // terminal state yet — all 3 clips are tracked independently and
  // concurrently, not one at a time.
  const pollJobs = (jobIds) => {
    const tick = async () => {
      if (cancelledRef.current) return;
      const current = await Promise.all(
        jobIds.map(async (jobId, i) => {
          try {
            const res = await httpClient.get(ENDPOINTS.PUBLISH.GET_BY_ID(jobId));
            return res.data?.data || res.data;
          } catch {
            return null; // transient hiccup — keep previous value next render
          }
        })
      );
      if (cancelledRef.current) return;
      setJobs((prev) => current.map((j, i) => j || prev[i]));

      const allDone = current.every((j) => isTerminal(j));
      if (allDone) {
        stopStopwatch();
        const anyFailed = current.some((j) => j?.status === "failed");
        setPhase(anyFailed ? "error" : "done");
        if (anyFailed) setError("One or more clips failed to fully publish — see details below.");
        return;
      }
      pollTimeoutRef.current = setTimeout(tick, 2000);
    };
    tick();
  };

  const handleGo = async () => {
    if (!url.trim() || phase === "analyzing" || phase === "publishing") return;
    cancelledRef.current = false;
    setClips([]);
    setJobs([]);
    setError(null);
    setPhase("analyzing");
    startStopwatch();

    try {
      const videoId = extractYouTubeId(url);
      if (!videoId) throw new Error("Enter a valid YouTube URL");

      // Step 1 — AI's top 3 picks from a single ranked pass.
      const genRes = await fetch("/api/generate-shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url, platform: "both", count: 3, maxDuration }),
      });
      if (!genRes.ok) {
        const body = await genRes.json().catch(() => null);
        throw new Error(body?.error || `Clip analysis failed (${genRes.status})`);
      }

      const reader = genRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const foundClips = [];
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
            if (parsed.__meta) {
              setVideoPreview((prev) => prev || { title: parsed.title, channel: parsed.channel, videoId });
              continue;
            }
            if (parsed.index) foundClips.push(parsed);
          } catch {}
        }
      }
      try { reader.cancel(); } catch {}

      if (foundClips.length === 0) throw new Error("AI couldn't find any usable clips in this video — try a different one.");
      if (cancelledRef.current) return;
      setClips(foundClips);
      setJobs(foundClips.map(() => null));

      // Step 2 — fire all publish jobs back-to-back. Each create call
      // resolves near-instantly (executePublishJob runs in the background),
      // so all 3 genuinely run concurrently on the backend.
      setPhase("publishing");
      const jobIds = [];
      for (const foundClip of foundClips) {
        const publishRes = await httpClient.post(ENDPOINTS.PUBLISH.CREATE, {
          sourceUrl: url,
          timestampStart: foundClip.timestampStart,
          timestampEnd: foundClip.timestampEnd,
          verticalStyle: "fill",
          platforms: ["youtube_shorts", "instagram_reels"],
          title: foundClip.title,
          description: foundClip.description || "",
          tags: foundClip.hashtags || [],
          scheduledAt: new Date().toISOString(),
          visibility: "public",
        });
        const createdJob = publishRes.data?.data || publishRes.data;
        jobIds.push(createdJob._id || createdJob.id);
      }
      if (cancelledRef.current) return;

      // Step 3 — poll all 3 concurrently until every one is terminal.
      pollJobs(jobIds);
    } catch (err) {
      stopStopwatch();
      setError(err.message || "Something went wrong");
      setPhase("error");
    }
  };

  const handleReset = () => {
    cancelledRef.current = true;
    if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    setPhase("idle");
    setClips([]);
    setJobs([]);
    setError(null);
    setElapsedMs(0);
  };

  const handleClose = () => {
    handleReset();
    setUrl("");
    setVideoPreview(null);
    onClose?.();
  };

  if (!isOpen) return null;

  const isRunning = phase === "analyzing" || phase === "publishing";
  const anyMissingConnection = !connCheck.loading && (!connCheck.youtube || !connCheck.instagram);
  const publishedCount = jobs.filter((j) => j?.status === "published").length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#0A0A0F]/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0A0A0F]">Auto-Publish Top 3</h3>
                <p className="text-neutral-400 text-xs font-medium">AI picks 3 clips → cuts & publishes all of them, unattended</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-black/5 rounded-xl text-neutral-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(isRunning || phase === "done" || phase === "error") && (
            <div className="flex flex-col items-center justify-center my-6 gap-1">
              <div className={`text-5xl font-black tabular-nums tracking-tight ${
                phase === "done" ? "text-emerald-600" : phase === "error" ? "text-red-500" : "text-[#0A0A0F]"
              }`} style={{ fontFamily: "monospace" }}>
                {formatElapsed(elapsedMs)}
              </div>
              {jobs.length > 0 && (
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{publishedCount} / {jobs.length} published</p>
              )}
            </div>
          )}

          {phase === "idle" && (
            <div className="mt-4">
              <div className="relative">
                <FaYoutube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
                <input
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGo()}
                  placeholder="Paste any YouTube URL — full video, no prep needed"
                  className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl pl-10 pr-4 py-3.5 text-sm font-medium outline-none focus:border-[#4F46E5] transition-all placeholder:text-neutral-300"
                />
              </div>

              {videoPreview && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 mt-3 bg-[#F9FAFB] border border-[#E2E4E9] rounded-xl">
                  <img
                    src={`https://img.youtube.com/vi/${videoPreview.videoId}/mqdefault.jpg`}
                    alt=""
                    className="w-16 h-9 rounded-lg object-cover bg-neutral-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#111318] truncate">{videoPreview.title}</p>
                    {videoPreview.channel && <p className="text-[10px] text-neutral-400 truncate">{videoPreview.channel}</p>}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap">Clip Length</span>
                <div className="flex p-1 bg-[#F4F5F8] border border-[#E2E4E9] rounded-xl">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaxDuration(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                        maxDuration === opt.value ? "bg-white text-[#0F0F0F] shadow-sm border border-[#E2E4E9]" : "text-[#8A91A8] hover:text-[#4B5264]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {!connCheck.loading && anyMissingConnection && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[12px] text-amber-700 font-medium">
                    {!connCheck.youtube && !connCheck.instagram ? "YouTube and Instagram aren't" : !connCheck.youtube ? "YouTube isn't" : "Instagram isn't"} connected — connect in Settings before running this live.
                  </p>
                </div>
              )}

              <button
                onClick={handleGo}
                disabled={!url.trim() || connCheck.loading}
                className="w-full mt-5 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-orange-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket className="w-4 h-4" /> Launch
              </button>
            </div>
          )}

          {phase !== "idle" && clips.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
              <p className="text-[13px] font-semibold text-indigo-700">Analyzing video…</p>
            </div>
          )}

          {clips.length > 0 && (
            <div className="space-y-3">
              {clips.map((clip, i) => (
                <ClipCard key={clip.id || i} clip={clip} job={jobs[i]} />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          {phase === "done" && (
            <div className="mt-6 flex items-center gap-2 justify-center text-emerald-600 font-black text-sm">
              <CheckCircle2 className="w-5 h-5" /> {publishedCount}/{jobs.length} live in {formatElapsed(elapsedMs)}
            </div>
          )}

          {(phase === "done" || phase === "error") && (
            <button
              onClick={handleReset}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-[#F4F5F8] text-[#4B5264] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#E2E4E9] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Run Again
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
