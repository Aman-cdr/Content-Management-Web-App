/**
 * historyManager.js
 * Undo/Redo middleware for Zustand using command pattern.
 * Wraps state mutations with reversible history entries.
 */

const HISTORY_LIMIT = 50;

// Keys that should NOT be tracked in history (ephemeral UI state)
const IGNORED_KEYS = new Set([
  'currentTime', 'isPlaying', 'isSaving', 'lastSaved',
  'timelineScroll', 'isFullscreen',
]);

export const historyMiddleware = (config) => (set, get, api) => {
  let _history = [];
  let _future = [];
  let _isTimeTravel = false;

  const wrappedSet = (partial, replace) => {
    if (_isTimeTravel) {
      set(partial, replace);
      return;
    }

    const prev = get();
    set(partial, replace);
    const next = get();

    // Compute which top-level keys actually changed
    const changed = Object.keys(typeof partial === 'function' ? next : partial)
      .filter(k => !IGNORED_KEYS.has(k) && prev[k] !== next[k]);

    if (changed.length === 0) return;

    // Capture snapshot of changed keys before and after
    const prevSnapshot = {};
    const nextSnapshot = {};
    changed.forEach(k => {
      prevSnapshot[k] = prev[k];
      nextSnapshot[k] = next[k];
    });

    _history.push({ prev: prevSnapshot, next: nextSnapshot });
    if (_history.length > HISTORY_LIMIT) _history.shift();
    _future = []; // Clear redo stack on new action
  };

  const store = config(wrappedSet, get, api);

  return {
    ...store,

    // ── History Controls ────────────────────────────────────────────────────

    canUndo: () => _history.length > 0,
    canRedo: () => _future.length > 0,
    historyLength: () => _history.length,
    futureLength: () => _future.length,

    undo: () => {
      if (_history.length === 0) return;
      const entry = _history.pop();
      _future.push(entry);
      _isTimeTravel = true;
      set(entry.prev);
      _isTimeTravel = false;
    },

    redo: () => {
      if (_future.length === 0) return;
      const entry = _future.pop();
      _history.push(entry);
      _isTimeTravel = true;
      set(entry.next);
      _isTimeTravel = false;
    },

    clearHistory: () => {
      _history = [];
      _future = [];
    },

    /**
     * Execute a batch of mutations as a single undo-able group
     */
    batch: (fn) => {
      const prev = get();
      _isTimeTravel = true; // suppress individual tracking
      fn();
      _isTimeTravel = false;
      const next = get();

      const changed = Object.keys(next)
        .filter(k => !IGNORED_KEYS.has(k) && typeof next[k] !== 'function' && prev[k] !== next[k]);

      if (changed.length === 0) return;

      const prevSnapshot = {};
      const nextSnapshot = {};
      changed.forEach(k => {
        prevSnapshot[k] = prev[k];
        nextSnapshot[k] = next[k];
      });

      _history.push({ prev: prevSnapshot, next: nextSnapshot });
      if (_history.length > HISTORY_LIMIT) _history.shift();
      _future = [];
    },
  };
};
