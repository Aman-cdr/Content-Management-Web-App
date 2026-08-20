"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  THEMES, DEFAULT_THEME, DEFAULT_MODE,
  THEME_STORAGE_KEY, CUSTOM_COLORS_KEY, MODE_STORAGE_KEY,
  buildThemeVars, presetSwatches,
} from "@/lib/themes";
import httpClient, { TokenStorage } from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";

const ThemeContext = createContext(null);

function applyVarsToRoot(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// ─── Compatibility bridge for pages not yet migrated to semantic tokens ────
// A large part of the app still uses literal Tailwind classes (bg-indigo-500,
// text-indigo-600...) instead of bg-theme-component/text-theme-text.
// Rewriting every className across every page in one pass isn't something
// that can be done safely in one sitting, so this injects a single <style>
// tag that remaps those specific hardcoded classes to the active theme's CSS
// variables. It's a bridge, not the architecture: anything new should use
// the semantic classes directly (bg-theme-component, text-theme-text,
// bg-theme-page, ...), which need no override at all since they resolve
// straight from --theme-* through Tailwind's @theme mapping in globals.css.
//
// Every hardcoded-indigo TEXT usage found across the app (113+ call sites
// audited: active tab labels, badge text, "select all"/ghost-button text,
// hover-state icons, edit/manage links) is on an INTERACTIVE element, never
// passive heading/body copy — real typography already uses literal neutral
// grays (#111318, #374151, #9CA3AF, ...) elsewhere, untouched by this
// bridge. So per the spec's own component list (Badges, Tabs, Selects,
// ghost-button text all → COLOR 2), hardcoded indigo TEXT maps to COMPONENT
// here, matching bg/border — not to COLOR 1 (text), which is reserved for
// the app's actual typography and is applied by leaving those neutral
// grays alone rather than by this bridge.
function injectLegacyOverrides(vars) {
  const component = vars["--theme-component"];
  const componentHover = vars["--theme-component-hover"];
  const componentActive = vars["--theme-component-active"];
  const componentSoft = vars["--theme-component-soft"];
  const id = "creator-theme-overrides";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }

  el.textContent = `
    /* ── Backgrounds/borders/gradients — COLOR 2 (component) ── */
    .bg-\\[\\#6366F1\\], .bg-\\[\\#6366f1\\], .bg-\\[\\#4F46E5\\], .bg-\\[\\#4f46e5\\],
    .bg-indigo-500, .bg-indigo-600 { background-color: ${component} !important; }
    [class*=" bg-indigo-500\\/"], [class^="bg-indigo-500\\/"],
    [class*=" bg-indigo-600\\/"], [class^="bg-indigo-600\\/"] {
      background-color: color-mix(in srgb, ${component} var(--tw-bg-opacity, 100%), transparent) !important;
    }
    .bg-indigo-50, [class*=" bg-\\[\\#6366F1\\]\\/"], [class^="bg-\\[\\#6366F1\\]\\/"] { background-color: ${componentSoft} !important; }
    .hover\\:bg-indigo-50:hover, .hover\\:bg-indigo-100:hover { background-color: ${componentSoft} !important; }
    .hover\\:bg-\\[\\#4338CA\\]:hover { background-color: ${componentActive} !important; }
    .border-\\[\\#6366F1\\], .border-\\[\\#6366f1\\], .border-\\[\\#4F46E5\\], .border-\\[\\#4f46e5\\],
    .border-indigo-500, .border-indigo-600 { border-color: ${component} !important; }
    .border-indigo-100, .border-indigo-200 { border-color: ${componentSoft} !important; }
    .from-\\[\\#6366F1\\], .from-\\[\\#6366f1\\], .from-indigo-500, .from-indigo-600 { --tw-gradient-from: ${component} !important; }
    .focus\\:border-\\[\\#6366F1\\]:focus, .focus\\:border-indigo-500:focus { border-color: ${component} !important; }
    .ring-indigo-100 { --tw-ring-color: ${componentSoft} !important; }
    [class*="shadow-indigo"], [class*="shadow-\\[0_4px_12px_rgba\\(99"] { --tw-shadow-color: var(--theme-component-focus) !important; }
    .bg-\\[\\#8B5CF6\\], .bg-\\[\\#8b5cf6\\] { background-color: ${componentHover} !important; }
    .to-\\[\\#8B5CF6\\], .to-\\[\\#8b5cf6\\] { --tw-gradient-to: ${componentHover} !important; }
    .from-\\[\\#8B5CF6\\], .from-\\[\\#8b5cf6\\] { --tw-gradient-from: ${componentHover} !important; }
    .bg-\\[\\#F59E0B\\], .bg-\\[\\#f59e0b\\] { background-color: ${component} !important; }

    /* ── Text — COLOR 2 (component): every hardcoded-indigo text usage in
       the app is an interactive element (active tab, badge, ghost-button/
       link, hover state), not real typography — see comment above. Tailwind's
       amber-50/600 / purple-50/600 NAMED classes are left untouched — those
       are reused elsewhere as WARNING status colors and CATEGORICAL tag
       colors (clip types, per-metric icons) that need to stay visually
       distinct, not become "whatever the theme is". ── */
    .text-\\[\\#6366F1\\], .text-\\[\\#6366f1\\], .text-\\[\\#4F46E5\\], .text-\\[\\#4f46e5\\],
    .text-indigo-500, .text-indigo-600 { color: ${component} !important; }
    .text-indigo-400 { color: ${component}cc !important; }
    .hover\\:text-indigo-600:hover, .hover\\:text-indigo-700:hover,
    .group:hover .group-hover\\:text-indigo-600 { color: ${componentHover} !important; }
    .text-\\[\\#8B5CF6\\], .text-\\[\\#8b5cf6\\] { color: ${componentHover} !important; }
    .text-\\[\\#F59E0B\\], .text-\\[\\#f59e0b\\] { color: ${component} !important; }

    /* ── Progress bars / loaders ── */
    #nprogress .bar { background: ${component} !important; }
    #nprogress .peg { box-shadow: 0 0 10px ${component}, 0 0 5px ${componentHover} !important; }
  `;
}

// A valid saved custom palette must have all 3 new-model keys — guards
// against a cached object from either of the two previous color models
// ({primary} only, or {primary,secondary,accent}), which would otherwise
// pass JSON.parse and then blow up deriveText/deriveComponent downstream.
function isValidPalette(colors) {
  return !!(colors && colors.text && colors.component && colors.page);
}

// Normalizes a themePreference blob from the backend into {id, mode, colors}.
// For a known preset id, always uses the CURRENT preset colors rather than
// whatever hex snapshot the server has cached — self-heals a user who saved
// a preset under a prior color model instead of surfacing a broken palette.
// Only "custom" needs the server's own colors, and those are shape-checked.
function resolveServerTheme(server) {
  if (!server) return null;
  if (server.id && server.id !== "custom" && THEMES[server.id]) {
    const preset = THEMES[server.id];
    return { id: server.id, mode: preset.mode || server.mode || DEFAULT_MODE, colors: preset.colors };
  }
  if (isValidPalette(server.colors)) {
    return { id: "custom", mode: server.mode || DEFAULT_MODE, colors: server.colors };
  }
  return null;
}

// Old preferences stored just a preset key ("indigo") or a custom palette
// under CUSTOM_COLORS_KEY. Reads whatever's there and returns a normalized
// {id, mode, colors} shape, or null if nothing was saved (or what's saved
// belongs to a prior, incompatible color model — falls back to the default
// theme in that case rather than rendering with missing colors).
function migrateLegacyLocalTheme() {
  try {
    const storedKey = localStorage.getItem(THEME_STORAGE_KEY);
    if (!storedKey) return null;

    if (storedKey === "custom") {
      const stored = localStorage.getItem(CUSTOM_COLORS_KEY);
      if (!stored) return null;
      try {
        const colors = JSON.parse(stored);
        if (!isValidPalette(colors)) return null;
        return { id: "custom", mode: localStorage.getItem(MODE_STORAGE_KEY) || DEFAULT_MODE, colors };
      } catch {
        return null;
      }
    }

    if (THEMES[storedKey]) {
      return { id: storedKey, mode: THEMES[storedKey].mode || localStorage.getItem(MODE_STORAGE_KEY) || DEFAULT_MODE, colors: THEMES[storedKey].colors };
    }
    return null;
  } catch {
    return null;
  }
}

function persistLocal(resolved) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved.id);
    localStorage.setItem(MODE_STORAGE_KEY, resolved.mode);
    if (resolved.id === "custom") {
      localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(resolved.colors));
    }
  } catch { /* localStorage unavailable (private mode, SSR) — theme still works for this session */ }
}

export function ThemeProvider({ children }) {
  const [resolved, setResolved] = useState(() => ({
    id: DEFAULT_THEME,
    mode: DEFAULT_MODE,
    colors: THEMES[DEFAULT_THEME].colors,
  }));
  const [isHydrated, setIsHydrated] = useState(false);
  const saveTimerRef = useRef(null);
  const hasFetchedServerRef = useRef(false);

  const applyToDom = useCallback((next) => {
    const vars = buildThemeVars(next.colors, next.mode);
    applyVarsToRoot(vars);
    injectLegacyOverrides(vars);
    document.documentElement.setAttribute("data-theme", next.id);
    document.documentElement.setAttribute("data-mode", next.mode);
  }, []);

  // Debounced, optimistic backend save — UI already reflects the change
  // (applyToDom ran synchronously before this fires) so a slow/failed
  // request never blocks or reverts what the user is looking at. Rapid
  // switching (Indigo → Ocean → Emerald → Rose) only fires one request for
  // the final choice instead of one per click.
  const scheduleSave = useCallback((next) => {
    if (!TokenStorage.isAuthenticated()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      httpClient.put(ENDPOINTS.USER.THEME, next).catch((err) => {
        console.error("Failed to save theme preference:", err?.message || err);
        // Intentionally not reverted — a failed save shouldn't yank the
        // theme out from under the user mid-session; it'll just re-sync
        // from localStorage next visit and can be changed again anytime.
      });
    }, 500);
  }, []);

  const commit = useCallback((next, { save = true } = {}) => {
    setResolved(next);
    applyToDom(next);
    persistLocal(next);
    if (save) scheduleSave(next);
  }, [applyToDom, scheduleSave]);

  // ─── Initial load: localStorage first (instant, no flash — layout.jsx's
  // boot script already applied it before React even mounted), then
  // reconcile with the backend once we know whether the user is logged in. ───
  useEffect(() => {
    const local = migrateLegacyLocalTheme();
    if (local) {
      setResolved(local);
      applyToDom(local);
    }
    setIsHydrated(true);

    if (TokenStorage.isAuthenticated() && !hasFetchedServerRef.current) {
      hasFetchedServerRef.current = true;
      httpClient.get(ENDPOINTS.USER.PROFILE).then((res) => {
        const next = resolveServerTheme(res?.data?.themePreference);
        if (!next) return;
        setResolved(next);
        applyToDom(next);
        persistLocal(next);
      }).catch(() => { /* offline/unauthenticated/first-run — localStorage/default stands */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((id) => {
    const preset = THEMES[id];
    if (!preset) return;
    commit({ id, mode: preset.mode || resolved.mode, colors: preset.colors });
  }, [commit, resolved.mode]);

  const setCustomColors = useCallback((colors) => {
    commit({ id: "custom", mode: resolved.mode, colors: { ...resolved.colors, ...colors } });
  }, [commit, resolved.mode, resolved.colors]);

  const setMode = useCallback((mode) => {
    commit({ ...resolved, mode });
  }, [commit, resolved]);

  // Backend integration hook — accepts either a preset id or a full
  // {id, mode, colors} object (used when restoring from a fetched profile).
  const applyThemeFromServer = useCallback((value) => {
    if (typeof value === "string" && THEMES[value]) { setTheme(value); return; }
    const next = resolveServerTheme(value);
    if (next) commit(next, { save: false });
  }, [setTheme, commit]);

  const activeTheme = useMemo(() => {
    if (resolved.id !== "custom" && THEMES[resolved.id]) return THEMES[resolved.id];
    return { id: "custom", name: "Custom", colors: resolved.colors };
  }, [resolved]);

  const value = useMemo(() => ({
    themeKey: resolved.id,
    mode: resolved.mode,
    colors: resolved.colors,
    theme: activeTheme,
    themes: THEMES,
    isHydrated,
    setTheme,
    setCustomColors,
    setMode,
    applyThemeFromServer,
    presetSwatches,
  }), [resolved, activeTheme, isHydrated, setTheme, setCustomColors, setMode, applyThemeFromServer]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};
