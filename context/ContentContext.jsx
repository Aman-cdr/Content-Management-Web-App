"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { usePathname } from "next/navigation";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Fetch initial data
  useEffect(() => {
    const fetchContent = async () => {
      // Only fetch content if the user is authenticated
      if (!TokenStorage.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      // Only fetch on dashboard/protected routes
      const isDashboardRoute = pathname.startsWith("/dashboard") || 
                              pathname.startsWith("/add-content") ||
                              pathname.startsWith("/brief-board") ||
                              pathname.startsWith("/roadmap") ||
                              pathname.startsWith("/series") ||
                              pathname.startsWith("/all-content") ||
                              pathname.startsWith("/scheduler") ||
                              pathname.startsWith("/media-library") ||
                              pathname.startsWith("/analytics") ||
                              pathname.startsWith("/settings");

      if (!isDashboardRoute) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await httpClient.get(ENDPOINTS.CONTENT.GET_ALL);
        setContents(response.data || []);
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [pathname]);

  const drafts = useMemo(
    () => contents.filter((c) => c.status === "draft"),
    [contents]
  );

  const published = useMemo(
    () => contents.filter((c) => c.status === "published"),
    [contents]
  );

  const addContent = useCallback(async (item) => {
    try {
      const response = await httpClient.post(ENDPOINTS.CONTENT.CREATE, item);
      const newItem = response.data;
      setContents((prev) => [newItem, ...prev]);
      return newItem;
    } catch (error) {
      console.error("Failed to add content:", error);
    }
  }, []);

  const updateContent = useCallback(async (id, updates) => {
    try {
      const response = await httpClient.put(ENDPOINTS.CONTENT.UPDATE(id), { id, ...updates });
      const updatedItem = response.data;
      setContents((prev) =>
        prev.map((c) => (c.id === id ? updatedItem : c))
      );
    } catch (error) {
      console.error("Failed to update content:", error);
    }
  }, []);

  const deleteContent = useCallback(async (id) => {
    try {
      await httpClient.delete(ENDPOINTS.CONTENT.DELETE(id));
      setContents((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete content:", error);
    }
  }, []);

  const publishContent = useCallback(async (id) => {
    try {
      const response = await httpClient.put(ENDPOINTS.CONTENT.UPDATE(id), { id, status: "published" });
      const updatedItem = response.data;
      setContents((prev) =>
        prev.map((c) => (c.id === id ? updatedItem : c))
      );
    } catch (error) {
      console.error("Failed to publish content:", error);
    }
  }, []);

  const getContentById = useCallback(
    (id) => contents.find((c) => c.id === id) || null,
    [contents]
  );

  const bulkDelete = useCallback(async (ids) => {
    try {
      await httpClient.delete(ENDPOINTS.CONTENT.BULK_DELETE, { data: { ids } });
      setContents((prev) => prev.filter((c) => !ids.includes(c.id)));
    } catch (error) {
      console.error("Failed to bulk delete content:", error);
    }
  }, []);

  const bulkUpdate = useCallback(async (ids, updates) => {
    try {
      const response = await httpClient.patch(ENDPOINTS.CONTENT.BULK_UPDATE, { ids, updates });
      const updatedItems = response.data;
      setContents((prev) =>
        prev.map((c) => {
          const updated = updatedItems?.find(u => u.id === c.id);
          return updated || c;
        })
      );
    } catch (error) {
      console.error("Failed to bulk update content:", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      contents,
      drafts,
      published,
      isLoading,
      addContent,
      updateContent,
      deleteContent,
      publishContent,
      getContentById,
      bulkDelete,
      bulkUpdate,
    }),
    [contents, drafts, published, isLoading, addContent, updateContent, deleteContent, publishContent, getContentById, bulkDelete, bulkUpdate]
  );

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
