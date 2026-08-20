"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Scissors, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  clipDuration,
  totalDuration as calcTotalDuration,
  timeToClipOffset,
  applySplit,
  applyRippleDelete,
  applyReorder,
  applyTrim,
  applySpeed,
} from "@/lib/editor/edl";

const PIXELS_PER_SECOND = 40;
const MIN_CLIP_SECONDS = 0.2;

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * A single-track, DOM-based timeline (no canvas, no drag-and-drop library —
 * clip blocks are positioned divs, reordering is up/down buttons per Phase 1's
 * scope). Trim handles drag the clip edges directly; splitting and deleting
 * act on whichever clip the playhead is currently over.
 */
export default function Timeline({ clips, currentTime, onSeek, onChange }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const duration = calcTotalDuration(clips);

  const handleTrackClick = useCallback((e) => {
    if (!trackRef.current || dragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + trackRef.current.scrollLeft;
    onSeek(Math.max(0, Math.min(duration, x / PIXELS_PER_SECOND)));
  }, [duration, onSeek, dragging]);

  const startDrag = (index, edge) => (e) => {
    e.stopPropagation();
    const clip = clips[index];
    setDragging({ index, edge, startX: e.clientX, originalStart: clip.start, originalEnd: clip.end });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const deltaSeconds = (e.clientX - dragging.startX) / PIXELS_PER_SECOND;
      const clip = clips[dragging.index];
      if (!clip) return;
      if (dragging.edge === "start") {
        const nextStart = Math.max(0, Math.min(dragging.originalStart + deltaSeconds, clip.end - MIN_CLIP_SECONDS));
        onChange(applyTrim(clips, dragging.index, { start: nextStart, end: clip.end }));
      } else {
        const nextEnd = Math.max(clip.start + MIN_CLIP_SECONDS, dragging.originalEnd + deltaSeconds);
        onChange(applyTrim(clips, dragging.index, { start: clip.start, end: nextEnd }));
      }
    };
    const handleUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, clips, onChange]);

  const handleSplitAtPlayhead = () => {
    const { clipIndex, sourceTime } = timeToClipOffset(clips, currentTime);
    onChange(applySplit(clips, clipIndex, sourceTime));
  };

  const clipOffsets = [];
  for (let i = 0, running = 0; i < clips.length; i++) {
    clipOffsets.push(running);
    running += clipDuration(clips[i]);
  }

  return (
    <div className="bg-white border border-[#E2E4E9] rounded-[1.75rem] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black text-[#4B5264]">
          <span className="text-neutral-400 uppercase tracking-widest text-[10px]">Timeline</span>
          <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <button
          onClick={handleSplitAtPlayhead}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F5F8] text-[#4B5264] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-300"
        >
          <Scissors className="w-3.5 h-3.5" strokeWidth={1.5} /> Split at playhead
        </button>
      </div>

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-20 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl overflow-x-auto cursor-pointer select-none"
      >
        <div className="relative h-full" style={{ width: Math.max(duration * PIXELS_PER_SECOND, 1) }}>
          {clips.map((clip, index) => {
            const width = clipDuration(clip) * PIXELS_PER_SECOND;
            const left = clipOffsets[index] * PIXELS_PER_SECOND;
            return (
              <div
                key={clip._key ?? index}
                className="absolute top-2 bottom-2 bg-indigo-50 border-2 border-indigo-200 rounded-lg group"
                style={{ left, width: Math.max(width, 4) }}
              >
                <div
                  onMouseDown={startDrag(index, "start")}
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-indigo-400 rounded-l-lg opacity-0 group-hover:opacity-100"
                />
                <div
                  onMouseDown={startDrag(index, "end")}
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-indigo-400 rounded-r-lg opacity-0 group-hover:opacity-100"
                />
                <div className="px-2 py-1 text-[10px] font-black text-indigo-700 truncate">
                  Clip {index + 1} · {clip.speed !== 1 ? `${clip.speed}x` : ""}
                </div>
              </div>
            );
          })}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
            style={{ left: currentTime * PIXELS_PER_SECOND }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {clips.map((clip, index) => (
          <div
            key={clip._key ?? index}
            className="flex items-center gap-3 px-3 py-2 bg-[#F9FAFB] border border-[#E2E4E9] rounded-2xl"
          >
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest w-14">Clip {index + 1}</span>
            <span className="text-xs font-bold text-[#4B5264] tabular-nums flex-1">
              {formatTime(clip.start)} → {formatTime(clip.end)}
            </span>
            <label className="flex items-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Speed
              <input
                type="number"
                min={0.5}
                max={2}
                step={0.1}
                value={clip.speed}
                onChange={(e) => onChange(applySpeed(clips, index, Math.min(2, Math.max(0.5, Number(e.target.value) || 1))))}
                className="w-16 px-2 py-1 bg-white border border-[#E2E4E9] rounded-full text-xs font-bold text-[#111318] outline-none focus:border-indigo-400 transition-colors duration-300"
              />
            </label>
            <button
              onClick={() => onChange(applyReorder(clips, index, index - 1))}
              disabled={index === 0}
              className="p-1.5 rounded-full text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:bg-transparent transition-colors duration-300"
            >
              <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onChange(applyReorder(clips, index, index + 1))}
              disabled={index === clips.length - 1}
              className="p-1.5 rounded-full text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:bg-transparent transition-colors duration-300"
            >
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => onChange(applyRippleDelete(clips, index))}
              disabled={clips.length <= 1}
              className="p-1.5 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:bg-transparent transition-colors duration-300"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
