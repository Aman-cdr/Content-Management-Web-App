"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { toApiClips } from "@/lib/editor/edl";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Loads and edits a single editor project. Clip/caption edits are applied to
 * local state immediately (so the timeline feels instant) and persisted via a
 * debounced autosave. Transcribe/render are plain blocking calls — Phase 1's
 * render pipeline runs synchronously within the request, so there's no job to
 * poll; the promise itself resolves once ffmpeg is done.
 *
 * The one exception is project creation for the AI hand-off (YouTube clip)
 * path: the backend returns a 'downloading' placeholder immediately and
 * materializes the clip in the background, so this hook polls GET /editor/get/:id
 * every 2s while renderStatus is 'downloading' until it flips to 'draft'/'failed'.
 */
export function useEditorProject(projectId: string | undefined) {
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await httpClient.get(ENDPOINTS.EDITOR.GET_BY_ID(projectId));
      setProject(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load editor project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Poll silently (no loading-spinner flicker) while the clip is still being
  // downloaded/cut in the background. Self-reschedules from inside the timeout
  // callback (not via the effect re-running) — renderStatus stays "downloading"
  // across every poll until the very last one, so an effect keyed on it would
  // only ever fire once and silently stop polling after 2s.
  useEffect(() => {
    if (project?.renderStatus !== "downloading" || !projectId) return;

    let cancelled = false;

    const poll = async () => {
      let stillDownloading = true;
      try {
        const res = await httpClient.get(ENDPOINTS.EDITOR.GET_BY_ID(projectId));
        if (cancelled) return;
        setProject(res.data);
        stillDownloading = res.data?.renderStatus === "downloading";
      } catch {
        // transient network hiccup — next tick will retry
      }
      if (!cancelled && stillDownloading) {
        pollTimeoutRef.current = setTimeout(poll, 2000);
      }
    };

    pollTimeoutRef.current = setTimeout(poll, 2000);

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [project?.renderStatus, projectId]);

  useEffect(() => () => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
  }, []);

  const updateClips = useCallback((clips: any[]) => {
    setProject((prev: any) => (prev ? { ...prev, edl: { clips } } : prev));

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await httpClient.put(ENDPOINTS.EDITOR.UPDATE_EDL(projectId as string), { clips: toApiClips(clips) });
      } catch (err: any) {
        setError(err.message || "Failed to save timeline");
      } finally {
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY_MS);
  }, [projectId]);

  const saveCaptions = useCallback(async (captionTrack: any[]) => {
    setProject((prev: any) => (prev ? { ...prev, captionTrack } : prev));
    try {
      setIsSaving(true);
      await httpClient.put(ENDPOINTS.EDITOR.UPDATE_CAPTIONS(projectId as string), { captionTrack });
    } catch (err: any) {
      setError(err.message || "Failed to save captions");
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  const updateDetails = useCallback(async (details: { title?: string; description?: string; hashtags?: string[] }) => {
    setProject((prev: any) => (prev ? { ...prev, ...details } : prev));
    try {
      setIsSaving(true);
      await httpClient.put(ENDPOINTS.EDITOR.UPDATE_DETAILS(projectId as string), details);
    } catch (err: any) {
      setError(err.message || "Failed to save details");
    } finally {
      setIsSaving(false);
    }
  }, [projectId]);

  const transcribe = useCallback(async () => {
    try {
      setError(null);
      setIsTranscribing(true);
      const res = await httpClient.post(ENDPOINTS.EDITOR.TRANSCRIBE(projectId as string));
      setProject(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Transcription failed");
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [projectId]);

  const render = useCallback(async () => {
    try {
      setError(null);
      setIsRendering(true);
      const res = await httpClient.post(ENDPOINTS.EDITOR.RENDER(projectId as string));
      setProject(res.data);
      return res.data;
    } catch (err: any) {
      setError(err.message || "Render failed");
      return null;
    } finally {
      setIsRendering(false);
    }
  }, [projectId]);

  return {
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
    reload: load,
  };
}
