"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";

// ── Shared auth token ────────────────────────────────────────
// In a real app this would come from a session provider.
const AUTH_TOKEN = "cms-dev-token-2026";

function authHeaders() {
  return { Authorization: `Bearer ${AUTH_TOKEN}` };
}

// =============================================================
//  useDashboardData — auto-refresh with visibility pause (#5)
// =============================================================
/**
 * Custom hook for fetching dashboard analytics data
 * with auto-refresh every `intervalMs` milliseconds.
 * Pauses polling when the tab is hidden and refetches on return.
 */
export function useDashboardData(intervalMs = 60_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  // ── Core fetch ──
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const json = await api.get(ENDPOINTS.ANALYTICS, {
        headers: authHeaders(),
      });

      setData(json);
      setLastUpdated(new Date());

      // Clear error immediately on success (#6)
      setError(null);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    } catch (err) {
      const msg = err.message || "Failed to fetch analytics data";
      setError(msg);

      // Auto-dismiss error after 5 seconds (#6)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
        errorTimeoutRef.current = null;
      }, 5_000);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Start / stop polling helpers ──
  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, intervalMs);
  }, [fetchData, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Visibility change handler (#5) ──
  useEffect(() => {
    fetchData(false);
    startPolling();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        // Tab became visible again — refetch immediately + restart interval
        fetchData(true);
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [fetchData, startPolling, stopPolling]);

  const refetch = useCallback(() => fetchData(false), [fetchData]);

  return { data, loading, error, lastUpdated, refetch };
}

// =============================================================
//  useGenerateScript — with double-submit guard (#3)
// =============================================================
export function useGenerateScript() {
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const generate = useCallback(async (topic) => {
    // Double-submit prevention (#3)
    if (loadingRef.current) return null;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      setScript(null);

      const json = await api.post(ENDPOINTS.GENERATE_SCRIPT, { topic }, {
        headers: authHeaders(),
      });

      setScript(json);
      return json;
    } catch (err) {
      setError(err.message || "Failed to generate script");
      return null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setScript(null);
    setError(null);
  }, []);

  return { script, loading, error, generate, reset };
}

// =============================================================
//  useReschedule — with double-submit guard (#3)
// =============================================================
export function useReschedule() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const reschedule = useCallback(async (date, time, utcDate, utcTime) => {
    // Double-submit prevention (#3)
    if (loadingRef.current) return null;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const json = await api.post(ENDPOINTS.RESCHEDULE, { date: utcDate || date, time: utcTime || time }, {
        headers: authHeaders(),
      });

      setResult(json);
      return json;
    } catch (err) {
      setError(err.message || "Failed to reschedule");
      return null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, reschedule, reset };
}

// =============================================================
//  useGenerateThumbnail — with double-submit guard (#3)
// =============================================================
export function useGenerateThumbnail() {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);

  const generate = useCallback(async () => {
    // Double-submit prevention (#3)
    if (loadingRef.current) return null;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      setThumbnail(null);

      const json = await api.post(ENDPOINTS.GENERATE_THUMBNAIL, {}, {
        headers: authHeaders(),
      });

      setThumbnail(json);
      return json;
    } catch (err) {
      setError(err.message || "Failed to generate thumbnail");
      return null;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setThumbnail(null);
    setError(null);
  }, []);

  return { thumbnail, loading, error, generate, reset };
}
