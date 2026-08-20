"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, Download, Loader2, AlertCircle, CheckCircle2, Zap, Edit2, X } from "lucide-react";
import { FaYoutube, FaInstagram } from "react-icons/fa";
import { useEditorProject } from "@/hooks/useEditorProject";
import { totalDuration } from "@/lib/editor/edl";
import Timeline from "@/app/components/editor/Timeline";
import VideoPreview from "@/app/components/editor/VideoPreview";
import CaptionPanel from "@/app/components/editor/CaptionPanel";
import PublishModal from "@/app/components/PublishModal";

const STATUS_LABEL = {
  downloading: { label: "Downloading…", tone: "text-amber-600 bg-amber-50 border-amber-100" },
  draft: { label: "Draft", tone: "text-neutral-400 bg-neutral-50 border-neutral-100" },
  transcribing: { label: "Transcribing…", tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  rendering: { label: "Rendering…", tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  ready: { label: "Ready", tone: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  failed: { label: "Failed", tone: "text-red-600 bg-red-50 border-red-100" },
};

export default function EditorProjectPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const {
    project,
    isLoading,
    isSaving,
    isTranscribing,
    isRendering,
    error,
    updateClips,
    saveCaptions,
    updateDetails,
    transcribe,
    render,
  } = useEditorProject(projectId);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [publishPlatform, setPublishPlatform] = useState(null); // "youtube_shorts" | "instagram_reels" | "both_shorts_reels" | null
  const [downloadElapsedSec, setDownloadElapsedSec] = useState(0);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const handleEnded = useCallback(() => setIsPlaying(false), []);

  // Ticks while the clip is downloading so the wait message can escalate
  // ("still working...") instead of repeating a "few seconds" claim forever.
  useEffect(() => {
    if (project?.renderStatus !== "downloading") return;
    const id = setInterval(() => setDownloadElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [project?.renderStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-indigo-300 animate-spin mb-4" strokeWidth={1.5} />
        <p className="text-neutral-400 text-sm font-medium">Loading editor…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle className="w-8 h-8 text-red-300 mb-4" />
        <p className="text-neutral-500 text-sm font-medium">{error || "Editor project not found."}</p>
      </div>
    );
  }

  // Clip is still being fetched from YouTube + cut via ffmpeg in the
  // background — there's no source video yet, so show progress instead of
  // the (empty) timeline/preview.
  if (project.renderStatus === "downloading") {
    const pct = Math.max(0, Math.min(100, project.renderProgress || 0));
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-5" />
        <p className="text-[#0A0A0F] text-base font-black mb-1.5">Downloading your clip…</p>
        <p className="text-neutral-400 text-sm font-medium max-w-sm text-center mb-4">
          {downloadElapsedSec < 30
            ? "Fetching the source video and cutting it to your selected range."
            : "Still working — YouTube can be slow to respond depending on the video and connection. This can take a few minutes for longer clips."}
        </p>
        <div className="w-full max-w-xs h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-indigo-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-neutral-300 text-xs font-bold mb-6">{pct}% · {downloadElapsedSec}s elapsed</p>
        <button
          onClick={() => router.push("/series/shorts")}
          className="text-neutral-400 hover:text-neutral-600 text-xs font-bold underline transition"
        >
          Cancel and go back
        </button>
      </div>
    );
  }

  if (project.renderStatus === "failed" && !project.sourceUploadId) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertCircle className="w-8 h-8 text-red-300 mb-4" />
        <p className="text-neutral-700 text-sm font-bold mb-1.5">Couldn&apos;t download this clip</p>
        <p className="text-neutral-400 text-sm font-medium max-w-sm text-center">{project.renderError || "The download failed. Please try again from the Shorts Planner."}</p>
      </div>
    );
  }

  const clips = project.edl?.clips || [];
  const captionTrack = project.captionTrack || [];
  const status = STATUS_LABEL[project.renderStatus] || STATUS_LABEL.draft;
  const isReady = project.renderStatus === "ready" && !!project.outputUploadId;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/media-library")}
            className="p-2.5 bg-white border border-[#E2E4E9] rounded-full text-[#4B5264] hover:bg-[#F4F5F8] transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div>
            <h2 className="text-2xl font-medium text-[#0A0A0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{project.title || "Video Editor"}</h2>
            <p className="text-neutral-500 text-xs font-medium">
              {project.sourceUploadId?.fileName || "Untitled project"} {isSaving && "· Saving…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.tone}`}>
            {status.label}
          </span>
          <button
            onClick={() => setIsEditingDetails(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full text-sm font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-50 transition-colors duration-300"
          >
            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit
          </button>
          <button
            onClick={render}
            disabled={isRendering || isTranscribing}
            className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#4338CA] transition-colors duration-300 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.4)] disabled:opacity-50"
          >
            {isRendering ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} /> : null}
            {isRendering ? "Rendering…" : "Render"}
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <VideoPreview
              src={project.sourceUploadId?.url}
              clips={clips}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeChange={setCurrentTime}
              onEnded={handleEnded}
              captionTrack={captionTrack}
            />
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="absolute bottom-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-[#0A0A0F] hover:bg-white transition-colors duration-300 shadow-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
            </button>
          </div>

          <Timeline
            clips={clips}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            onChange={updateClips}
          />
        </div>

        <div className="space-y-4">
          {/* Details + Publish — mirrors the Shorts Planner card (same hashtag
              chip style, same button colors), seeded from the AI-generated
              short. Sized to the sidebar column so the buttons stay
              proportional instead of stretching edge-to-edge. Publish stays
              visible but disabled until the edit is rendered. */}
          <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-4">
            {(project.description || project.hashtags?.length > 0) && (
              <div className="mb-3 pb-3 border-b border-[#F4F5F8]">
                {project.description && (
                  <p className="text-[11px] text-neutral-500 line-clamp-3 whitespace-pre-line mb-2">{project.description}</p>
                )}
                {project.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.hashtags.map((tag) => (
                      <span key={tag} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setPublishPlatform("youtube_shorts")}
                disabled={!isReady}
                title={isReady ? "Publish to YouTube Shorts" : "Render your edit first to publish"}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold transition-colors duration-300 ${isReady ? "bg-red-500 hover:bg-red-600 text-white shadow-sm" : "bg-neutral-100 text-neutral-300 cursor-not-allowed"}`}
              >
                <FaYoutube className="w-3.5 h-3.5" /> YT Shorts
              </button>
              <button
                onClick={() => setPublishPlatform("instagram_reels")}
                disabled={!isReady}
                title={isReady ? "Publish to Instagram Reels" : "Render your edit first to publish"}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold transition-colors duration-300 ${isReady ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white shadow-sm" : "bg-neutral-100 text-neutral-300 cursor-not-allowed"}`}
              >
                <FaInstagram className="w-3.5 h-3.5" /> IG Reels
              </button>
            </div>

            <button
              onClick={() => setPublishPlatform("both_shorts_reels")}
              disabled={!isReady}
              title={isReady ? "Publish to both YouTube Shorts and Instagram Reels" : "Render your edit first to publish"}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] font-bold transition-colors duration-300 ${isReady ? "bg-gradient-to-r from-red-500 to-pink-500 hover:brightness-110 text-white shadow-sm" : "bg-neutral-100 text-neutral-300 cursor-not-allowed"}`}
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={1.5} /> Publish to Both
            </button>

            {isReady && (
              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#F4F5F8]">
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} /> Rendered
                </div>
                <a
                  href={project.outputUploadId.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 transition-colors duration-300"
                >
                  <Download className="w-3 h-3" strokeWidth={1.5} /> Download
                </a>
              </div>
            )}
          </div>

          <CaptionPanel
            captionTrack={captionTrack}
            isTranscribing={isTranscribing}
            error={null}
            onTranscribe={transcribe}
            onChange={saveCaptions}
          />
        </div>
      </div>

      <AnimatePresence>
        {publishPlatform && project.outputUploadId && (
          <PublishModal
            short={{
              title: project.title || project.sourceUploadId?.fileName?.replace(/\.[^.]+$/, "") || "Edited Clip",
              description: project.description || "",
              hashtags: project.hashtags || [],
              uploadId: project.outputUploadId._id || project.outputUploadId,
              durationSec: Math.round(totalDuration(clips)),
              thumbnailUrl: "",
            }}
            platform={publishPlatform}
            onClose={() => setPublishPlatform(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditingDetails && (
          <EditDetailsModal
            project={project}
            onClose={() => setIsEditingDetails(false)}
            onSave={(details) => { updateDetails(details); setIsEditingDetails(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Edits the publish metadata (title/description/hashtags) for this project —
// mirrors the "Edit" flow on the Shorts Planner grid so the same fields are
// editable both before and after handing a clip off to the editor.
function EditDetailsModal({ project, onClose, onSave }) {
  const [title, setTitle] = useState(project.title || "");
  const [description, setDescription] = useState(project.description || "");
  const [hashtags, setHashtags] = useState((project.hashtags || []).join(" "));

  const handleSave = () => {
    onSave({
      title: title.trim(),
      description: description.trim(),
      hashtags: hashtags.split(/\s+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[1.75rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F4F5F8]">
          <h3 className="text-[15px] font-semibold text-[#111318]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Edit Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-neutral-400 transition-colors duration-300">
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-400/15 transition-all duration-300"
            />
            <p className="text-[10px] text-neutral-400 mt-1 text-right">{title.length}/100</p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-400/15 transition-all duration-300 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block">Hashtags</label>
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#shorts #reels #viral"
              className="w-full bg-[#F9FAFB] border border-[#E2E4E9] rounded-full px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-400/15 transition-all duration-300"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#F4F5F8] flex items-center justify-end gap-3 bg-[#FAFBFC] rounded-b-[1.75rem]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-[#E2E4E9] text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors duration-300">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors duration-300 shadow-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
