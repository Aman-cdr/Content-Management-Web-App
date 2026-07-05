"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

const SeriesContext = createContext(null);

export function SeriesProvider({ children }) {
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState("main");

  // ── Series CRUD ────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsLoading(true);
    httpClient.get(ENDPOINTS.SERIES.GET_ALL)
      .then(res => {
        setSeries(res.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch series:", err);
        setSeries([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const addSeries = useCallback(async (payload) => {
    const res = await httpClient.post(ENDPOINTS.SERIES.CREATE, payload);
    const newItem = res.data;
    setSeries(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateSeries = useCallback(async (id, updates) => {
    const res = await httpClient.put(ENDPOINTS.SERIES.UPDATE(id), updates);
    const updated = res.data;
    setSeries(prev => prev.map(s => String(s.id) === String(id) ? updated : s));
    return updated;
  }, []);

  const deleteSeries = useCallback(async (id) => {
    await httpClient.delete(ENDPOINTS.SERIES.DELETE(id));
    setSeries(prev => prev.filter(s => String(s.id) !== String(id)));
  }, []);

  const archiveSeries = useCallback(async (id) => {
    const s = series.find(s => String(s.id) === String(id));
    if (!s) return;
    const updatedArchived = !s.archived;
    return updateSeries(id, { 
      ...s, 
      archived: updatedArchived, 
      status: updatedArchived ? 'ARCHIVED' : 'ACTIVE',
      lastUpdated: new Date().toISOString() 
    });
  }, [series, updateSeries]);

  const duplicateSeries = useCallback(async (s) => {
    return addSeries({ 
      ...s, 
      id: undefined, 
      _id: undefined,
      name: `${s.name} (Copy)`, 
      title: `${s.name} (Copy)`,
      completed: 0, 
      lastUpdated: new Date().toISOString() 
    });
  }, [addSeries]);

  const getSeriesById = useCallback(id => series.find(s => String(s.id) === String(id)) || null, [series]);

  // ── Episode CRUD ───────────────────────────────────────────────────────────

  const getEpisodes = useCallback(async (seriesId) => {
    const res = await httpClient.get(ENDPOINTS.SERIES.GET_CONTENTS(seriesId));
    return res.data || [];
  }, []);

  const addEpisode = useCallback(async (episode) => {
    const res = await httpClient.post(ENDPOINTS.CONTENT.CREATE, episode);
    return res.data;
  }, []);

  const updateEpisode = useCallback(async (id, payload) => {
    const res = await httpClient.put(ENDPOINTS.CONTENT.UPDATE(id), payload);
    return res.data;
  }, []);

  const deleteEpisode = useCallback(async (id) => {
    await httpClient.delete(ENDPOINTS.CONTENT.DELETE(id));
  }, []);

  /**
   * Bulk-create episodes from AI generation.
   * Also updates the series.episodes count.
   */
  const applyAIEpisodes = useCallback(async (seriesId, episodeList) => {
    const results = [];
    for (let i = 0; i < episodeList.length; i++) {
      const ep = episodeList[i];
      try {
        const saved = await httpClient.post(ENDPOINTS.CONTENT.CREATE, {
          seriesId: String(seriesId),
          number: ep.ep,
          title: ep.title,
          status: "Draft",
          duration: ep.duration,
          dueDate: null,
        });
        results.push(saved.data);
      } catch (err) {
        console.error(`Failed to save episode ${ep.ep}:`, err.message);
      }
    }
    const s = series.find(s => String(s.id) === String(seriesId));
    if (s) {
      await updateSeries(seriesId, { 
        ...s, 
        episodes: results.length, 
        completed: 0, 
        lastUpdated: new Date().toISOString() 
      });
    }
    return results;
  }, [series, updateSeries]);

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
