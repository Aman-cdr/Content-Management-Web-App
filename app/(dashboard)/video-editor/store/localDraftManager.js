/**
 * localDraftManager.js
 * IndexedDB-based local project draft persistence.
 * Auto-saves every 30 seconds. Recovers on browser crash.
 */

const DB_NAME = 'CreatorCMS_VideoEditor_v2';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const MEDIA_STORE = 'media';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const store = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };

    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const req = fn(store);
    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    }
  });
}

export const LocalDraftManager = {
  /**
   * Save a project draft
   */
  async saveProject(projectData) {
    const record = {
      ...projectData,
      updatedAt: new Date().toISOString(),
    };
    await tx(PROJECTS_STORE, 'readwrite', (store) => store.put(record));
    return record;
  },

  /**
   * Load a project by ID
   */
  async loadProject(id) {
    return tx(PROJECTS_STORE, 'readonly', (store) => store.get(id));
  },

  /**
   * List all saved projects (metadata only)
   */
  async listProjects() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const t = db.transaction(PROJECTS_STORE, 'readonly');
      const store = t.objectStore(PROJECTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const projects = req.result.sort((a, b) =>
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        resolve(projects);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Delete a project
   */
  async deleteProject(id) {
    await tx(PROJECTS_STORE, 'readwrite', (store) => store.delete(id));
    // Also delete associated media
    await tx(MEDIA_STORE, 'readwrite', (store) => store.delete(id));
  },

  /**
   * Save a media File to IndexedDB (for persistence across sessions)
   */
  async saveMedia(projectId, file) {
    await tx(MEDIA_STORE, 'readwrite', (store) => store.put(file, projectId));
  },

  /**
   * Load media File from IndexedDB
   */
  async loadMedia(projectId) {
    return tx(MEDIA_STORE, 'readonly', (store) => store.get(projectId));
  },

  /**
   * Clear all data (used for fresh start)
   */
  async clearAll() {
    const db = await openDB();
    const t = db.transaction([PROJECTS_STORE, MEDIA_STORE], 'readwrite');
    t.objectStore(PROJECTS_STORE).clear();
    t.objectStore(MEDIA_STORE).clear();
    return new Promise((resolve, reject) => {
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
    });
  },

  /**
   * Check estimated storage usage
   */
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate();
      return {
        usageMB: Math.round(usage / 1024 / 1024),
        quotaMB: Math.round(quota / 1024 / 1024),
        percentUsed: Math.round((usage / quota) * 100),
      };
    }
    return null;
  },
};

/**
 * Auto-save hook — call this from the main page component
 */
let _autoSaveTimer = null;

export function setupAutoSave(getState, projectId, intervalMs = 30000) {
  if (_autoSaveTimer) clearInterval(_autoSaveTimer);

  _autoSaveTimer = setInterval(async () => {
    const state = getState();
    if (!state.mediaFile) return; // Nothing to save

    try {
      const projectData = serializeProject(state, projectId);
      await LocalDraftManager.saveProject(projectData);
      await LocalDraftManager.saveMedia(projectId, state.mediaFile);
      console.log('[AutoSave] Project saved at', new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[AutoSave] Failed:', err);
    }
  }, intervalMs);

  return () => clearInterval(_autoSaveTimer);
}

export function serializeProject(state, projectId) {
  return {
    id: projectId,
    name: state.project?.name ?? 'Untitled Project',
    status: state.project?.status ?? 'draft',
    version: '2.0',
    duration: state.duration,
    tracks: state.tracks,
    textLayers: state.textLayers,
    stickerLayers: state.stickerLayers,
    globalEffects: state.globalEffects,
    colorGrading: state.colorGrading,
    audioMix: state.audioMix,
    subtitles: state.subtitles,
    exportSettings: state.exportSettings,
    activeFilter: state.activeFilter,
    createdAt: state.project?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function deserializeProject(data, setState) {
  if (!data) return;
  setState({
    project: { id: data.id, name: data.name, status: data.status, createdAt: data.createdAt, updatedAt: data.updatedAt },
    tracks: data.tracks ?? [],
    textLayers: data.textLayers ?? [],
    stickerLayers: data.stickerLayers ?? [],
    globalEffects: data.globalEffects ?? [],
    colorGrading: data.colorGrading ?? {},
    audioMix: data.audioMix ?? {},
    subtitles: data.subtitles ?? [],
    exportSettings: data.exportSettings ?? {},
    activeFilter: data.activeFilter ?? null,
    duration: data.duration ?? 0,
  });
}

export default LocalDraftManager;
