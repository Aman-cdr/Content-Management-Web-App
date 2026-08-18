"use client";
/**
 * editorStore.js
 * Zustand global state store for the video editor.
 * Manages: project, tracks, clips, effects, playback, UI state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { historyMiddleware } from './historyManager';

const INITIAL_PROJECT = {
  id: null,
  name: 'Untitled Project',
  status: 'draft', // 'draft' | 'saved' | 'exported'
  createdAt: null,
  updatedAt: null,
};

const INITIAL_TIMELINE = {
  tracks: [
    { id: 'video-1', type: 'video', label: 'Video', clips: [], muted: false, solo: false, locked: false, height: 64 },
    { id: 'audio-1', type: 'audio', label: 'Audio', clips: [], muted: false, solo: false, locked: false, height: 48 },
    { id: 'music-1', type: 'music', label: 'Music', clips: [], muted: false, solo: false, locked: false, height: 48 },
    { id: 'voice-1', type: 'voice', label: 'Voiceover', clips: [], muted: false, solo: false, locked: false, height: 48 },
    { id: 'text-1', type: 'text', label: 'Text', clips: [], muted: false, solo: false, locked: false, height: 40 },
    { id: 'sticker-1', type: 'sticker', label: 'Stickers', clips: [], muted: false, solo: false, locked: false, height: 40 },
  ],
};

export const useEditorStore = create(
  subscribeWithSelector(
    historyMiddleware((set, get) => ({
      // ── Project Metadata ──────────────────────────────────────────────────
      project: { ...INITIAL_PROJECT },
      setProjectName: (name) => set((s) => ({ project: { ...s.project, name } })),
      setProjectStatus: (status) => set((s) => ({ project: { ...s.project, status } })),
      initProject: (data) => set({ project: { ...INITIAL_PROJECT, ...data } }),

      // ── Media Source ──────────────────────────────────────────────────────
      mediaFile: null,            // Original File object
      mediaSrc: null,             // Blob URL for playback
      mediaMetadata: null,        // { duration, width, height, fps, ... }

      setMedia: (file, src, meta) => set({
        mediaFile: file,
        mediaSrc: src,
        mediaMetadata: meta,
      }),
      clearMedia: () => set({ mediaFile: null, mediaSrc: null, mediaMetadata: null }),

      // ── Playback State ────────────────────────────────────────────────────
      currentTime: 0,
      isPlaying: false,
      playbackRate: 1.0,
      volume: 1.0,
      isMuted: false,
      duration: 0,

      setCurrentTime: (t) => set({ currentTime: t }),
      setIsPlaying: (v) => set({ isPlaying: v }),
      setPlaybackRate: (r) => set({ playbackRate: r }),
      setVolume: (v) => set({ volume: v }),
      setMuted: (v) => set({ isMuted: v }),
      setDuration: (d) => set({ duration: d }),

      // ── Timeline ──────────────────────────────────────────────────────────
      tracks: INITIAL_TIMELINE.tracks,
      timelineZoom: 1.0,          // px per second
      timelineScroll: 0,          // horizontal scroll px

      setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.05, Math.min(10, zoom)) }),
      setTimelineScroll: (scroll) => set({ timelineScroll: Math.max(0, scroll) }),

      addTrack: (track) => set((s) => ({ tracks: [...s.tracks, track] })),
      removeTrack: (trackId) => set((s) => ({ tracks: s.tracks.filter(t => t.id !== trackId) })),
      updateTrack: (trackId, updates) => set((s) => ({
        tracks: s.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t),
      })),
      reorderTracks: (newOrder) => set({ tracks: newOrder }),

      // ── Clips ─────────────────────────────────────────────────────────────
      addClip: (trackId, clip) => set((s) => ({
        tracks: s.tracks.map(t =>
          t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
        ),
      })),
      removeClip: (trackId, clipId) => set((s) => ({
        tracks: s.tracks.map(t =>
          t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
        ),
      })),
      updateClip: (trackId, clipId, updates) => set((s) => ({
        tracks: s.tracks.map(t =>
          t.id === trackId
            ? { ...t, clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c) }
            : t
        ),
      })),
      moveClip: (fromTrackId, toTrackId, clipId, newStart) => set((s) => {
        let clip = null;
        const tracks = s.tracks.map(t => {
          if (t.id === fromTrackId) {
            const found = t.clips.find(c => c.id === clipId);
            if (found) clip = { ...found, start: newStart };
            return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
          }
          return t;
        });
        if (!clip) return {};
        return {
          tracks: tracks.map(t =>
            t.id === toTrackId ? { ...t, clips: [...t.clips, clip] } : t
          ),
        };
      }),

      // Convenience: get all clips across all tracks
      getAllClips: () => {
        return get().tracks.flatMap(t => t.clips.map(c => ({ ...c, trackId: t.id, trackType: t.type })));
      },

      // ── Text Layers ───────────────────────────────────────────────────────
      textLayers: [],
      addTextLayer: (layer) => set((s) => ({ textLayers: [...s.textLayers, layer] })),
      removeTextLayer: (id) => set((s) => ({ textLayers: s.textLayers.filter(l => l.id !== id) })),
      updateTextLayer: (id, updates) => set((s) => ({
        textLayers: s.textLayers.map(l => l.id === id ? { ...l, ...updates } : l),
      })),

      // ── Sticker Layers ────────────────────────────────────────────────────
      stickerLayers: [],
      addStickerLayer: (layer) => set((s) => ({ stickerLayers: [...s.stickerLayers, layer] })),
      removeStickerLayer: (id) => set((s) => ({ stickerLayers: s.stickerLayers.filter(l => l.id !== id) })),
      updateStickerLayer: (id, updates) => set((s) => ({
        stickerLayers: s.stickerLayers.map(l => l.id === id ? { ...l, ...updates } : l),
      })),

      // ── Effects ───────────────────────────────────────────────────────────
      globalEffects: [],  // Applied to entire video: { id, type, params, enabled }
      addEffect: (effect) => set((s) => ({ globalEffects: [...s.globalEffects, effect] })),
      removeEffect: (id) => set((s) => ({ globalEffects: s.globalEffects.filter(e => e.id !== id) })),
      updateEffect: (id, updates) => set((s) => ({
        globalEffects: s.globalEffects.map(e => e.id === id ? { ...e, ...updates } : e),
      })),
      reorderEffects: (newOrder) => set({ globalEffects: newOrder }),

      // Active filter preset
      activeFilter: null,
      filterIntensity: 1.0,
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      setFilterIntensity: (v) => set({ filterIntensity: v }),

      // ── Subtitles ─────────────────────────────────────────────────────────
      subtitles: [],   // [{ id, start, end, text, style }]
      addSubtitle: (cue) => set((s) => ({ subtitles: [...s.subtitles, cue] })),
      removeSubtitle: (id) => set((s) => ({ subtitles: s.subtitles.filter(c => c.id !== id) })),
      updateSubtitle: (id, updates) => set((s) => ({
        subtitles: s.subtitles.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      setSubtitles: (cues) => set({ subtitles: cues }),

      // ── UI State ──────────────────────────────────────────────────────────
      activeTool: 'select',   // 'select' | 'crop' | 'text' | 'blade'
      activePanel: 'media',   // 'media' | 'text' | 'stickers' | 'audio' | 'effects' | 'subtitles' | 'export'
      selectedClipId: null,
      selectedTrackId: null,
      selectedLayerId: null,
      showSafeZones: false,
      isFullscreen: false,
      isSaving: false,
      lastSaved: null,

      setActiveTool: (tool) => set({ activeTool: tool }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      setSelectedClip: (trackId, clipId) => set({ selectedTrackId: trackId, selectedClipId: clipId }),
      setSelectedLayer: (id) => set({ selectedLayerId: id }),
      toggleSafeZones: () => set((s) => ({ showSafeZones: !s.showSafeZones })),
      setFullscreen: (v) => set({ isFullscreen: v }),
      setSaving: (v) => set({ isSaving: v }),
      setLastSaved: (ts) => set({ lastSaved: ts }),

      // ── Crop State ────────────────────────────────────────────────────────
      cropRect: null,  // { x, y, width, height } in pixels, null = no crop
      setCropRect: (rect) => set({ cropRect: rect }),

      // ── Color Grading ─────────────────────────────────────────────────────
      colorGrading: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        highlights: 0,
        shadows: 0,
        hue: 0,
        exposure: 0,
      },
      setColorGrading: (updates) => set((s) => ({
        colorGrading: { ...s.colorGrading, ...updates },
      })),
      resetColorGrading: () => set({
        colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, highlights: 0, shadows: 0, hue: 0, exposure: 0 },
      }),

      // ── Audio Mixing ──────────────────────────────────────────────────────
      audioMix: {
        masterVolume: 1.0,
        videoAudioVolume: 1.0,
        musicVolume: 0.6,
        voiceoverVolume: 1.0,
        audioDucking: true,
      },
      setAudioMix: (updates) => set((s) => ({ audioMix: { ...s.audioMix, ...updates } })),

      // ── Export Settings ───────────────────────────────────────────────────
      exportSettings: {
        resolution: '1080p',
        format: 'mp4',
        quality: 'high',
        fps: 30,
        platform: 'youtube',
      },
      setExportSettings: (updates) => set((s) => ({ exportSettings: { ...s.exportSettings, ...updates } })),

      // ── Reset ─────────────────────────────────────────────────────────────
      resetEditor: () => set({
        project: { ...INITIAL_PROJECT },
        mediaFile: null,
        mediaSrc: null,
        mediaMetadata: null,
        currentTime: 0,
        isPlaying: false,
        playbackRate: 1.0,
        duration: 0,
        tracks: INITIAL_TIMELINE.tracks.map(t => ({ ...t, clips: [] })),
        textLayers: [],
        stickerLayers: [],
        globalEffects: [],
        activeFilter: null,
        subtitles: [],
        activeTool: 'select',
        activePanel: 'media',
        selectedClipId: null,
        selectedTrackId: null,
        cropRect: null,
        colorGrading: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, highlights: 0, shadows: 0, hue: 0, exposure: 0 },
      }),
    }))
  )
);

export default useEditorStore;
