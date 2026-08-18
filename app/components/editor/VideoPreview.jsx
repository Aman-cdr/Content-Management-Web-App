"use client";

import { useRef, useEffect, useCallback } from "react";
import { sourceTimeToGlobalTime, timeToClipOffset } from "@/lib/editor/edl";

const CLIP_BOUNDARY_EPSILON = 0.05;

function findClipIndexAt(clips, sourceTime) {
  const exact = clips.findIndex((c) => sourceTime >= c.start && sourceTime < c.end);
  if (exact !== -1) return exact;
  return sourceTime < (clips[0]?.start ?? 0) ? 0 : clips.length - 1;
}

function findActiveCaption(captionTrack, sourceTime) {
  return captionTrack?.find((cue) => sourceTime >= cue.start && sourceTime <= cue.end) || null;
}

function drawCaption(ctx, canvas, cue, sourceTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!cue) return;

  const fontSize = Math.round(canvas.height * 0.06);
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = fontSize * 0.12;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";

  const y = canvas.height * 0.88;

  if (cue.style === "karaoke" && cue.words?.length) {
    const widths = cue.words.map((w) => ctx.measureText(`${w.text} `).width);
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    let x = canvas.width / 2 - totalWidth / 2;

    cue.words.forEach((word, i) => {
      const spoken = sourceTime >= word.start;
      const text = `${word.text} `;
      const w = widths[i];
      ctx.textAlign = "left";
      ctx.fillStyle = spoken ? "#FFD700" : "#FFFFFF";
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      x += w;
    });
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeText(cue.text, canvas.width / 2, y);
    ctx.fillText(cue.text, canvas.width / 2, y);
  }
}

/**
 * Plays the single source video but only across the edited timeline: skips
 * trimmed-out gaps between clips, applies each clip's speed as playbackRate,
 * and stops at the end of the last clip. A canvas overlay draws the active
 * caption cue (word-by-word highlight for the "karaoke" style) so captions can
 * be previewed accurately without a real render.
 */
export default function VideoPreview({ src, clips, currentTime, isPlaying, onTimeChange, onEnded, captionTrack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const activeClipIndexRef = useRef(0);
  const isSeekingFromParentRef = useRef(false);

  // External seeks (Timeline click, trim edit) — map global edit-time to source-time.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPlaying) return;
    const { sourceTime } = timeToClipOffset(clips, currentTime);
    if (Math.abs(video.currentTime - sourceTime) > 0.05) {
      isSeekingFromParentRef.current = true;
      video.currentTime = sourceTime;
    }
    activeClipIndexRef.current = findClipIndexAt(clips, sourceTime);
    video.playbackRate = clips[activeClipIndexRef.current]?.speed || 1;
  }, [currentTime, clips, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.play().catch(() => {});
    else video.pause();
  }, [isPlaying]);

  const redrawCaption = useCallback((sourceTime) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawCaption(ctx, canvas, findActiveCaption(captionTrack, sourceTime), sourceTime);
  }, [captionTrack]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSeekingFromParentRef.current) {
      isSeekingFromParentRef.current = false;
    }

    const sourceTime = video.currentTime;
    const clip = clips[activeClipIndexRef.current];

    // Reached (or overshot) the end of the current clip — jump the trimmed gap.
    if (clip && sourceTime >= clip.end - CLIP_BOUNDARY_EPSILON) {
      const nextIndex = activeClipIndexRef.current + 1;
      if (nextIndex < clips.length) {
        activeClipIndexRef.current = nextIndex;
        video.currentTime = clips[nextIndex].start;
        video.playbackRate = clips[nextIndex].speed || 1;
      } else if (isPlaying) {
        video.pause();
        onEnded?.();
      }
      return;
    }

    onTimeChange?.(sourceTimeToGlobalTime(clips, sourceTime));
    redrawCaption(sourceTime);
  }, [clips, isPlaying, onTimeChange, onEnded, redrawCaption]);

  // Resize the canvas to match the rendered video size so caption coordinates line up.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPlaying) return;
    redrawCaption(video.currentTime);
  }, [captionTrack, isPlaying, redrawCaption]);

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        playsInline
      />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />
    </div>
  );
}
