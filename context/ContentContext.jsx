"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from our JSON backend
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content');
        if (response.ok) {
          const data = await response.json();
          setContents(data);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

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
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (response.ok) {
        const newItem = await response.json();
        setContents((prev) => [newItem, ...prev]);
        return newItem;
      }
    } catch (error) {
      console.error("Failed to add content:", error);
    }
  }, []);

  const updateContent = useCallback(async (id, updates) => {
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      
      if (response.ok) {
        const updatedItem = await response.json();
        setContents((prev) =>
          prev.map((c) => (c.id === id ? updatedItem : c))
        );
      }
    } catch (error) {
      console.error("Failed to update content:", error);
    }
  }, []);

  const deleteContent = useCallback(async (id) => {
    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setContents((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete content:", error);
    }
  }, []);

  const publishContent = useCallback(async (id) => {
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: "published" }),
      });
      
      if (response.ok) {
        const updatedItem = await response.json();
        setContents((prev) =>
          prev.map((c) => (c.id === id ? updatedItem : c))
        );
      }
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
      const response = await fetch('/api/content/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      
      if (response.ok) {
        setContents((prev) => prev.filter((c) => !ids.includes(c.id)));
      }
    } catch (error) {
      console.error("Failed to bulk delete content:", error);
    }
  }, []);

  const bulkUpdate = useCallback(async (ids, updates) => {
    try {
      const response = await fetch('/api/content/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      });
      
      if (response.ok) {
        const updatedItems = await response.json();
        setContents((prev) =>
          prev.map((c) => {
            const updated = updatedItems.find(u => u.id === c.id);
            return updated || c;
          })
        );
      }
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
