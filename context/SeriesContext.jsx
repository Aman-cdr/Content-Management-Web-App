"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { TokenStorage } from "@/lib/axios-instance";

const MAIN_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3040/api/v1";
const LOCAL = "http://localhost:3001";

// ─── Generic request helpers ──────────────────────────────────────────────────

async function tryMain(fn) {
  try { return { data: await fn(), source: "main" }; }
  catch { return null; }
}

async function api(method, path, body, source) {
  const base = source === "main" ? MAIN_API : LOCAL;
  const headers = {};
  
  if (source === "main") {
    const token = TokenStorage.getAccessToken();
    if (token) {
      headers["Authorization"] = `Access ${token}`;
    }
  }
  
  const res = await axios({ method, url: base + path, data: body, headers, timeout: 5000 });
  return res.data?.data ?? res.data;
}

// ─── Series API ───────────────────────────────────────────────────────────────

async function fetchAllSeries() {
  const main = await tryMain(() => api("get", "/series/list", null, "main"));
  if (main && Array.isArray(main.data)) return { data: main.data, source: "main" };
  const data = await api("get", "/series", null, "local");
  return { data, source: "local" };
}

// ─── Episode API ──────────────────────────────────────────────────────────────

async function fetchEpisodesBySeriesId(seriesId, source) {
  if (source === "main") {
    try {
      return await api("get", `/series/${seriesId}/contents`, null, "main");
    } catch {}
  }
  // json-server: filter by seriesId
  const res = await axios.get(`${LOCAL}/episodes?seriesId=${seriesId}`);
  return res.data;
}

async function createEpisodeReq(episode, source) {
  if (source === "main") {
    try { return await api("post", "/content/create", episode, "main"); } catch {}
  }
  const res = await axios.post(`${LOCAL}/episodes`, episode);
  return res.data;
}

async function updateEpisodeReq(id, payload, source) {
  if (source === "main") {
    try { return await api("put", `/content/update/${id}`, payload, "main"); } catch {}
  }
  const res = await axios.put(`${LOCAL}/episodes/${id}`, payload);
  return res.data;
}

async function deleteEpisodeReq(id, source) {
  if (source === "main") {
    try { await api("delete", `/content/delete/${id}`, null, "main"); return; } catch {}
  }
  await axios.delete(`${LOCAL}/episodes/${id}`);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SeriesContext = createContext(null);

export function SeriesProvider({ children }) {
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState("local");

  // ── Series CRUD ────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAllSeries()
      .then(({ data, source: src }) => { setSeries(data); setSource(src); })
      .catch(err => console.error("Failed to fetch series:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const addSeries = useCallback(async (payload) => {
    const newItem = await api("post", source === "main" ? "/series/create" : "/series", payload, source);
    setSeries(prev => [newItem, ...prev]);
    return newItem;
  }, [source]);

  const updateSeries = useCallback(async (id, updates) => {
    const path = source === "main" ? `/series/update/${id}` : `/series/${id}`;
    const updated = await api("put", path, updates, source);
    setSeries(prev => prev.map(s => String(s.id) === String(id) ? updated : s));
    return updated;
  }, [source]);

  const deleteSeries = useCallback(async (id) => {
    const path = source === "main" ? `/series/delete/${id}` : `/series/${id}`;
    await api("delete", path, null, source);
    setSeries(prev => prev.filter(s => String(s.id) !== String(id)));
  }, [source]);

  const archiveSeries = useCallback(async (id) => {
    const s = series.find(s => String(s.id) === String(id));
    if (!s) return;
    return updateSeries(id, { ...s, archived: !s.archived, lastUpdated: new Date().toISOString() });
  }, [series, updateSeries]);

  const duplicateSeries = useCallback(async (s) => {
    return addSeries({ ...s, id: undefined, name: `${s.name} (Copy)`, completed: 0, lastUpdated: new Date().toISOString() });
  }, [addSeries]);

  const getSeriesById = useCallback(id => series.find(s => String(s.id) === String(id)) || null, [series]);

  // ── Episode CRUD ───────────────────────────────────────────────────────────

  const getEpisodes = useCallback(async (seriesId) => {
    return fetchEpisodesBySeriesId(seriesId, source);
  }, [source]);

  const addEpisode = useCallback(async (episode) => {
    return createEpisodeReq(episode, source);
  }, [source]);

  const updateEpisode = useCallback(async (id, payload) => {
    return updateEpisodeReq(id, payload, source);
  }, [source]);

  const deleteEpisode = useCallback(async (id) => {
    return deleteEpisodeReq(id, source);
  }, [source]);

  /**
   * Bulk-create episodes from AI generation.
   * Also updates the series.episodes count.
   */
  const applyAIEpisodes = useCallback(async (seriesId, episodeList) => {
    // Sequential saves to avoid json-server overload
    const results = [];
    for (let i = 0; i < episodeList.length; i++) {
      const ep = episodeList[i];
      try {
        const saved = await createEpisodeReq({
          id: `ep-${seriesId}-${Date.now()}-${i}`,
          seriesId: String(seriesId),
          number: ep.ep,
          title: ep.title,
          status: "Draft",
          duration: ep.duration,
          dueDate: null,
        }, source);
        results.push(saved);
      } catch (err) {
        console.error(`Failed to save episode ${ep.ep}:`, err.message);
      }
    }
    const s = series.find(s => String(s.id) === String(seriesId));
    if (s) {
      await updateSeries(seriesId, { ...s, episodes: results.length, completed: 0, lastUpdated: new Date().toISOString() });
    }
    return results;
  }, [source, series, updateSeries]);

  const value = useMemo(() => ({
    series, isLoading, source,
    addSeries, updateSeries, deleteSeries, archiveSeries, duplicateSeries, getSeriesById,
    getEpisodes, addEpisode, updateEpisode, deleteEpisode, applyAIEpisodes,
  }), [series, isLoading, source, addSeries, updateSeries, deleteSeries, archiveSeries, duplicateSeries, getSeriesById, getEpisodes, addEpisode, updateEpisode, deleteEpisode, applyAIEpisodes]);

  return <SeriesContext.Provider value={value}>{children}</SeriesContext.Provider>;
}

export function useSeries() {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error("useSeries must be used within SeriesProvider");
  return ctx;
}
