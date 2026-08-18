"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, RotateCw, Download, Save, Upload,
  Type, Music, Sticker, Scissors, Layers, Sparkles,
  SkipBack, SkipForward, Volume2, VolumeX,
  Maximize2, Minimize2, ZoomIn, Film, Mic, Subtitles, ChevronDown,
  Settings, Trash2, Plus
} from "lucide-react";

import useEditorStore from "./store/editorStore";
import VideoEngine from "./engine/VideoEngine";
import CanvasRenderer from "./engine/CanvasRenderer";
import { LocalDraftManager, setupAutoSave, serializeProject, deserializeProject } from "./store/localDraftManager";
import { useTimelineInteractions } from "./timeline/useTimelineInteractions";
import Timeline from "./timeline/Timeline";
import TextPanel from "./text/TextPanel";
import StickerPanel from "./overlays/StickerPanel";
import AudioPanel from "./audio/AudioPanel";
import EffectsPanel from "./effects/EffectsPanel";
import SubtitlePanel from "./subtitles/SubtitlePanel";
import ExportPanel from "./export/ExportPanel";

// ── Panel Icon Map ─────────────────────────────────────────────────────────────
const PANELS = [
  { id: "media",     label: "Media",      icon: Film },
  { id: "text",      label: "Text",       icon: Type },
  { id: "stickers",  label: "Stickers",   icon: Sparkles },
  { id: "audio",     label: "Audio",      icon: Music },
  { id: "effects",   label: "Effects",    icon: Layers },
  { id: "subtitles", label: "Subtitles",  icon: Subtitles },
  { id: "export",    label: "Export",     icon: Download },
];

// ── Project ID (session-scoped) ───────────────────────────────────────────────
const PROJECT_ID = `project_${Date.now().toString(36)}`;

export default function VideoEditorPage() {
  // ── Zustand state ──────────────────────────────────────────────────────────
  const {
    activePanel, setActivePanel,
    isPlaying, setIsPlaying,
    currentTime, setCurrentTime,
    duration, setDuration,
    isMuted, setMuted,
    volume, setVolume,
    mediaFile, mediaSrc, mediaMetadata, setMedia, clearMedia,
    textLayers, stickerLayers, subtitles,
    colorGrading,
    project, setProjectName,
    undo, redo, canUndo, canRedo,
    resetEditor,
  } = useEditorStore();

  // ── Refs ───────────────────────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoEngineRef = useRef(null);
  const canvasRendererRef = useRef(null);
  const videoElementRef = useRef(null); // for EffectsPanel live preview

  const [isDragging, setIsDragging] = useState(false);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 720 });

  // ── Timeline keyboard shortcuts ────────────────────────────────────────────
  useTimelineInteractions(videoEngineRef);

  // ── Initialize VideoEngine & CanvasRenderer ────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new VideoEngine();
    videoEngineRef.current = engine;

    engine.onTimeUpdate((t) => setCurrentTime(t));
    engine.onEnded(() => setIsPlaying(false));
    engine.onLoaded((meta) => {
      setDuration(meta.duration);
      // Add main video clip to video track
      useEditorStore.getState().addClip('video-1', {
        id: `clip_main`,
        label: meta.fileName,
        start: 0,
        duration: meta.duration,
        clipDuration: meta.duration,
        type: 'video',
      });
    });

    const renderer = new CanvasRenderer(canvasRef.current);
    renderer.setVideoEngine(engine);
    canvasRendererRef.current = renderer;

    // Set canvas size
    renderer.resize(1280, 720);
    renderer.startRenderLoop();

    return () => {
      renderer.destroy();
      engine.destroy();
    };
  }, []);

  // ── Restore last session from IndexedDB ───────────────────────────────────
  useEffect(() => {
    (async () => {
      const projects = await LocalDraftManager.listProjects();
      setSavedProjects(projects);
    })();
  }, []);

  // ── Auto-save setup ───────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = setupAutoSave(
      () => useEditorStore.getState(),
      PROJECT_ID,
      30000
    );
    return cleanup;
  }, []);

  // ── Render text/sticker layers on canvas ──────────────────────────────────
  useEffect(() => {
    const renderer = canvasRendererRef.current;
    if (!renderer) return;

    // Remove old text/sticker layers
    renderer.layers = renderer.layers.filter(l => !l.id?.startsWith('text_') && !l.id?.startsWith('sticker_'));

    // Add current text layers
    textLayers.forEach(layer => {
      renderer.addLayer({
        id: layer.id,
        type: 'text',
        zIndex: 10,
        visible: true,
        opacity: layer.opacity ?? 1,
        draw: (ctx, currentTime, w, h) => {
          if (currentTime < (layer.startTime ?? 0) || currentTime > (layer.endTime ?? Infinity)) return;
          CanvasRenderer.drawText(ctx, {
            text: layer.text,
            x: (layer.x ?? 0.5) * w,
            y: (layer.y ?? 0.5) * h,
            fontSize: layer.fontSize ?? 36,
            fontFamily: layer.fontFamily ?? 'Inter, sans-serif',
            color: layer.color ?? '#FFFFFF',
            fontWeight: layer.fontWeight ?? '700',
            textAlign: layer.textAlign ?? 'center',
            textShadow: layer.textShadow,
            backgroundColor: layer.backgroundColor,
            padding: layer.padding,
            rotation: layer.rotation,
            opacity: layer.opacity,
          }, currentTime, w, h);
        },
      });
    });

    // Add sticker layers
    stickerLayers.forEach(layer => {
      renderer.addLayer({
        id: layer.id,
        type: 'sticker',
        zIndex: 11,
        visible: true,
        opacity: layer.opacity ?? 1,
        draw: (ctx, currentTime, w, h) => {
          if (currentTime < (layer.startTime ?? 0) || currentTime > (layer.endTime ?? Infinity)) return;
          const x = (layer.x ?? 0.5) * w;
          const y = (layer.y ?? 0.5) * h;
          ctx.save();
          ctx.font = `${(layer.fontSize ?? 48) * (layer.scale ?? 1)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(x, y);
          if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.fillText(layer.content ?? '⭐', 0, 0);
          ctx.restore();
        },
      });
    });
  }, [textLayers, stickerLayers]);

  // ── Subtitle rendering on canvas ──────────────────────────────────────────
  useEffect(() => {
    const renderer = canvasRendererRef.current;
    if (!renderer) return;

    renderer.layers = renderer.layers.filter(l => l.id !== 'subtitle_layer');
    if (subtitles.length === 0) return;

    renderer.addLayer({
      id: 'subtitle_layer',
      type: 'subtitle',
      zIndex: 20,
      visible: true,
      opacity: 1,
      draw: (ctx, currentTime, w, h) => {
        const active = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);
        if (!active) return;
        CanvasRenderer.drawText(ctx, {
          text: active.text,
          x: w / 2,
          y: h * 0.88,
          fontSize: 22,
          fontFamily: 'Inter, sans-serif',
          color: '#FFFFFF',
          fontWeight: '700',
          textAlign: 'center',
          textShadow: true,
          backgroundColor: 'rgba(0,0,0,0.55)',
          padding: 10,
        }, currentTime, w, h);
      },
    });
  }, [subtitles]);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Check mime type OR extension as fallback (Windows sometimes leaves type blank for custom media/mkv)
    const isVideoType = file.type.startsWith('video/');
    const isVideoExt = /\.(mp4|mov|webm|mkv|avi|m4v|3gp)$/i.test(file.name);

    if (!isVideoType && !isVideoExt) {
      alert(`Format not supported: ${file.name}. Please select a standard video file (MP4, MOV, WEBM).`);
      return;
    }

    const src = URL.createObjectURL(file);
    const engine = videoEngineRef.current;
    if (!engine) {
      alert("Video engine not initialized. Please refresh the page.");
      return;
    }

    try {
      const meta = await engine.load(file);
      videoElementRef.current = engine.getVideoElement();
      setMedia(file, src, meta);

      // Update canvas aspect ratio
      const renderer = canvasRendererRef.current;
      if (renderer && meta.width && meta.height) {
        renderer.resize(meta.width, meta.height);
        setCanvasSize({ w: meta.width, h: meta.height });
      }

      // Save media to IndexedDB for draft recovery (wrap in try-catch to not block session if DB/Quota fails)
      try {
        await LocalDraftManager.saveMedia(PROJECT_ID, file);
      } catch (dbErr) {
        console.warn("IndexedDB local storage failed (Incognito/Quota limit). Project will not auto-save media.", dbErr);
      }
    } catch (err) {
      console.error("Video load failed:", err);
      alert(`Error loading video: ${err.message || "Unknown error"}. Ensure the file is a valid video format.`);
    }
  }, [setMedia]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ── Playback controls ─────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const engine = videoEngineRef.current;
    if (!engine) return;
    if (isPlaying) { engine.pause(); setIsPlaying(false); }
    else { engine.play(); setIsPlaying(true); }
  }, [isPlaying, setIsPlaying]);

  const seekTo = useCallback((t) => {
    const engine = videoEngineRef.current;
    if (!engine) return;
    engine.seek(t);
    setCurrentTime(t);
  }, [setCurrentTime]);

  const handleMute = useCallback(() => {
    const engine = videoEngineRef.current;
    engine?.mute(!isMuted);
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  const handleVolumeChange = useCallback((v) => {
    const engine = videoEngineRef.current;
    engine?.setVolume(v);
    setVolume(v);
  }, [setVolume]);

  // ── Manual save ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const state = useEditorStore.getState();
      const data = serializeProject(state, PROJECT_ID);
      await LocalDraftManager.saveProject(data);
      if (state.mediaFile) await LocalDraftManager.saveMedia(PROJECT_ID, state.mediaFile);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed:', err);
    }
    setIsSaving(false);
  }, []);

  // ── Load project ──────────────────────────────────────────────────────────
  const handleLoadProject = useCallback(async (proj) => {
    deserializeProject(proj, useEditorStore.setState);
    const mediaFile = await LocalDraftManager.loadMedia(proj.id);
    if (mediaFile) await handleFileSelect(mediaFile);
    setShowProjectsPanel(false);
  }, [handleFileSelect]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Canvas display aspect ratio
  const aspectRatio = canvasSize.w / canvasSize.h;
  const isPortrait = canvasSize.h > canvasSize.w;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      background: 'var(--t-bg)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ══ TOP TOOLBAR ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        height: 52,
        borderBottom: '1px solid var(--t-border)',
        background: 'var(--t-surface)',
        flexShrink: 0,
        zIndex: 30,
      }}>
        {/* Project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Film size={16} style={{ color: '#6366f1' }} />
          <input
            value={project?.name ?? 'Untitled Project'}
            onChange={e => setProjectName(e.target.value)}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--t-text)',
              outline: 'none',
              minWidth: 0,
              width: 200,
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--t-border)', margin: '0 4px' }} />

        {/* Undo / Redo */}
        <button onClick={() => undo?.()} disabled={!canUndo?.()} title="Undo (Ctrl+Z)" style={toolbarBtn(canUndo?.())}>
          <RotateCcw size={14} />
        </button>
        <button onClick={() => redo?.()} disabled={!canRedo?.()} title="Redo (Ctrl+Y)" style={toolbarBtn(canRedo?.())}>
          <RotateCw size={14} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Save status */}
        {lastSaved && (
          <span style={{ fontSize: 10, color: 'var(--t-text-muted)', fontWeight: 600 }}>
            Saved {formatTime(0) === formatTime(0) ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            ...toolbarBtn(true),
            padding: '6px 14px',
            background: 'var(--t-surface)',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
          }}
        >
          <Save size={13} />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>

        {/* Projects dropdown */}
        <button
          onClick={() => setShowProjectsPanel(!showProjectsPanel)}
          style={{
            ...toolbarBtn(true),
            padding: '6px 12px',
            background: 'var(--t-surface)',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
          }}
        >
          Drafts <ChevronDown size={12} />
        </button>

        {/* Export quick button */}
        <button
          onClick={() => setActivePanel('export')}
          style={{
            padding: '7px 16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
          }}
        >
          <Download size={13} />
          Export
        </button>
      </div>

      {/* ══ MAIN EDITOR AREA ══════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left/Center: Preview + Timeline ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* ── Video Preview Canvas ── */}
          <div
            ref={canvasContainerRef}
            style={{
              flex: 1,
              background: '#0a0a0e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {/* Canvas preview container (always mounts canvas to preserve refs) */}
            <div style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: '100%',
              display: mediaSrc ? 'block' : 'none',
            }}>
              <canvas
                ref={canvasRef}
                onClick={togglePlay}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 380px)',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  borderRadius: 8,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
              />

              {/* Play overlay */}
              {!isPlaying && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 8,
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
                  </div>
                </div>
              )}

              {/* Video metadata badge */}
              {mediaMetadata && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  borderRadius: 8, padding: '4px 10px',
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  pointerEvents: 'none',
                }}>
                  {mediaMetadata.width}×{mediaMetadata.height}
                </div>
              )}
            </div>

            {/* Upload zone (only visible when no media is loaded) */}
            {!mediaSrc && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  padding: 48,
                  border: `2px dashed ${isDragging ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 24,
                  cursor: 'pointer',
                  background: isDragging ? 'rgba(99,102,241,0.05)' : 'transparent',
                  transition: 'all 0.2s',
                  maxWidth: 400,
                  textAlign: 'center',
                  zIndex: 10,
                }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: 24,
                  background: isDragging ? '#6366f1' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <Upload size={32} color={isDragging ? '#fff' : 'rgba(255,255,255,0.4)'} />
                </div>
                <div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 800 }}>
                    {isDragging ? 'Drop video here' : 'Select or drop your video'}
                  </p>
                  <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                    MP4, MOV, WEBM · Up to 2GB
                  </p>
                </div>
                <button style={{
                  padding: '10px 28px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800,
                  fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                }}>
                  Browse Video
                </button>
              </div>
            )}

            {/* Hidden native file input - keeps canvas mounted in same DOM hierarchy */}
            <input ref={fileInputRef} type="file" accept="video/*" onChange={e => handleFileSelect(e.target.files?.[0])} style={{ display: 'none' }} />
          </div>

          {/* ── Playback Controls Bar ── */}
          {mediaSrc && (
            <div style={{
              padding: '10px 16px',
              background: 'var(--t-surface)',
              borderTop: '1px solid var(--t-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flexShrink: 0,
            }}>
              {/* Progress bar */}
              <div
                style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, cursor: 'pointer', position: 'relative' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seekTo(pct * duration);
                }}
              >
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, transition: 'width 0.1s linear' }} />
                <div style={{
                  position: 'absolute', top: -4, left: `${progressPct}%`,
                  width: 12, height: 12, background: '#6366f1', borderRadius: '50%',
                  transform: 'translateX(-50%)', boxShadow: '0 0 6px rgba(99,102,241,0.5)',
                }} />
              </div>

              {/* Controls row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Skip back */}
                <button onClick={() => seekTo(Math.max(0, currentTime - 5))} style={ctrlBtn}>
                  <SkipBack size={15} />
                </button>

                {/* Play/Pause */}
                <button onClick={togglePlay} style={{
                  ...ctrlBtn,
                  width: 38, height: 38, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
                }}>
                  {isPlaying ? <Pause size={16} color="#fff" fill="#fff" /> : <Play size={16} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />}
                </button>

                {/* Skip forward */}
                <button onClick={() => seekTo(Math.min(duration, currentTime + 5))} style={ctrlBtn}>
                  <SkipForward size={15} />
                </button>

                {/* Time display */}
                <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--t-text)', minWidth: 80 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div style={{ flex: 1 }} />

                {/* Volume */}
                <button onClick={handleMute} style={ctrlBtn} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => handleVolumeChange(Number(e.target.value))}
                  style={{ width: 70, accentColor: '#6366f1' }}
                />

                {/* Remove video */}
                <button
                  onClick={() => { videoEngineRef.current?.destroy(); clearMedia(); resetEditor(); }}
                  style={{ ...ctrlBtn, color: '#ef4444' }}
                  title="Remove video"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── Timeline ── */}
          <Timeline videoEngineRef={videoEngineRef} />
        </div>

        {/* ── Right Panel: Tool Panels ── */}
        <div style={{
          width: 300,
          borderLeft: '1px solid var(--t-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--t-surface)',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          {/* Panel tab icons */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--t-border)',
            overflowX: 'auto',
            flexShrink: 0,
          }}>
            {PANELS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                title={p.label}
                style={{
                  flex: 1,
                  padding: '10px 4px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activePanel === p.id ? '2px solid #6366f1' : '2px solid transparent',
                  color: activePanel === p.id ? '#6366f1' : 'var(--t-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s',
                  minWidth: 40,
                }}
              >
                <p.icon size={16} />
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.04em' }}>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {activePanel === 'media' && (
                  <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Media Import</p>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px',
                      border: '2px dashed var(--t-border)', borderRadius: 12, cursor: 'pointer',
                      color: 'var(--t-text-muted)', fontSize: 13, fontWeight: 600,
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
                    >
                      <span style={{ fontSize: 32 }}>🎬</span>
                      {mediaSrc ? 'Replace Video' : 'Upload Video'}
                      <span style={{ fontSize: 11, color: '#6b7280' }}>MP4, MOV, WEBM</span>
                      <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFileSelect(e.target.files?.[0])} />
                    </label>

                    {mediaMetadata && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: 10, fontSize: 11, color: 'var(--t-text-muted)', lineHeight: 1.8 }}>
                        <strong style={{ color: 'var(--t-text)', display: 'block', marginBottom: 4 }}>📹 {mediaMetadata.fileName}</strong>
                        {mediaMetadata.width}×{mediaMetadata.height} · {formatTime(mediaMetadata.duration)} · {(mediaFile?.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                )}

                {activePanel === 'text' && <TextPanel />}
                {activePanel === 'stickers' && <StickerPanel />}
                {activePanel === 'audio' && <AudioPanel />}
                {activePanel === 'effects' && <EffectsPanel videoRef={{ current: videoElementRef.current }} />}
                {activePanel === 'subtitles' && <SubtitlePanel />}
                {activePanel === 'export' && <ExportPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Saved Drafts Dropdown ── */}
      <AnimatePresence>
        {showProjectsPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute', top: 52, right: 72,
              width: 320, maxHeight: 400, overflowY: 'auto',
              background: 'var(--t-surface)', border: '1px solid var(--t-border)',
              borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              zIndex: 100, padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t-text)' }}>Saved Drafts</span>
              <button onClick={() => setShowProjectsPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-text-muted)', fontSize: 16 }}>✕</button>
            </div>

            {savedProjects.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--t-text-muted)', textAlign: 'center', padding: '16px 0' }}>No saved drafts yet</p>
            )}

            {savedProjects.map(proj => (
              <div
                key={proj.id}
                onClick={() => handleLoadProject(proj)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px',
                  borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                  background: 'var(--t-bg)', border: '1px solid var(--t-border)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
              >
                <span style={{ fontSize: 24 }}>🎬</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{proj.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--t-text-muted)' }}>
                    {proj.status} · {new Date(proj.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={async (e) => { e.stopPropagation(); await LocalDraftManager.deleteProject(proj.id); setSavedProjects(prev => prev.filter(p => p.id !== proj.id)); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 4 }}
                >✕</button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function toolbarBtn(enabled) {
  return {
    padding: '6px',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? 'var(--t-text)' : 'var(--t-text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
    opacity: enabled ? 1 : 0.4,
  };
}

const ctrlBtn = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'var(--t-surface)', border: '1px solid var(--t-border)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--t-text)', transition: 'all 0.15s',
};
