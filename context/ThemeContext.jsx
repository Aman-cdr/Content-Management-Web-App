"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY, buildThemeVars } from "@/lib/themes";

const ThemeContext = createContext(null);

const CUSTOM_COLOR_KEY = "creator-cms-custom-color";

// ─── Apply CSS vars to <html> ─────────────────────────────────────────────────
function applyVarsToRoot(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// ─── Inject a <style> tag that overrides ALL hardcoded indigo values ──────────
// This ensures every button, gradient, text, ring across the whole app
// immediately reflects the active theme color without touching each component.
function injectOverrides(primary, secondary) {
  const id = "creator-theme-overrides";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }

  // These are the exact hex values the components use (hardcoded Tailwind classes).
  // We override them with CSS vars so one theme change propagates everywhere.
  el.textContent = `
    /* ── Solid backgrounds ── */
    .bg-\\[\\#6366F1\\], .bg-\\[\\#6366f1\\],
    .bg-\\[\\#4F46E5\\], .bg-\\[\\#4f46e5\\],
    .bg-indigo-500, .bg-indigo-600 {
      background-color: ${primary} !important;
    }

    /* ── Opacity-variant backgrounds (indigo-500/X) ── */
    [class*="bg-indigo-500\\/"],
    [class*="bg-indigo-600\\/"] {
      background-color: color-mix(in srgb, ${primary} var(--tw-bg-opacity, 100%), transparent) !important;
    }

    /* ── Light tint backgrounds ── */
    .bg-indigo-50,
    [class*="bg-\\[\\#6366F1\\]\\/"],
    [class*="bg-\\[\\#6366f1\\]\\/"] {
      background-color: var(--t-primary-light) !important;
    }

    /* ── Hover backgrounds ── */
    .hover\\:bg-indigo-50:hover,
    .hover\\:bg-indigo-100:hover {
      background-color: var(--t-primary-light) !important;
    }
    .hover\\:bg-\\[\\#4338CA\\]:hover {
      background-color: var(--t-primary-dark) !important;
    }

    /* ── Text ── */
    .text-\\[\\#6366F1\\], .text-\\[\\#6366f1\\],
    .text-\\[\\#4F46E5\\], .text-\\[\\#4f46e5\\],
    .text-indigo-500, .text-indigo-600 {
      color: ${primary} !important;
    }
    .text-indigo-400 {
      color: ${primary}cc !important;
    }

    /* ── Borders ── */
    .border-\\[\\#6366F1\\], .border-\\[\\#6366f1\\],
    .border-\\[\\#4F46E5\\], .border-\\[\\#4f46e5\\],
    .border-indigo-500, .border-indigo-600 {
      border-color: ${primary} !important;
    }
    .border-indigo-100, .border-indigo-200 {
      border-color: var(--t-primary-light) !important;
    }

    /* ── Gradient from ── */
    .from-\\[\\#6366F1\\], .from-\\[\\#6366f1\\],
    .from-indigo-500, .from-indigo-600 {
      --tw-gradient-from: ${primary} !important;
    }

    /* ── Gradient to ── */
    .to-\\[\\#8B5CF6\\], .to-\\[\\#8b5cf6\\],
    .to-violet-500, .to-purple-500 {
      --tw-gradient-to: ${secondary} !important;
    }
    .from-\\[\\#8B5CF6\\], .from-\\[\\#8b5cf6\\],
    .from-violet-500 {
      --tw-gradient-from: ${secondary} !important;
    }

    /* ── Shadows / glows ── */
    [class*="shadow-indigo"],
    [class*="shadow-\\[0_4px_12px_rgba\\(99"] {
      --tw-shadow-color: var(--t-primary-glow) !important;
    }

    /* ── Focus borders ── */
    .focus\\:border-\\[\\#6366F1\\]:focus,
    .focus\\:border-indigo-500:focus {
      border-color: ${primary} !important;
    }

    /* ── Ring utility ── */
    .ring-indigo-100 {
      --tw-ring-color: var(--t-primary-light) !important;
    }

    /* ── TopLoader ── */
    #nprogress .bar { background: ${primary} !important; }
    #nprogress .peg { box-shadow: 0 0 10px ${primary}, 0 0 5px ${secondary} !important; }
  `;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children, serverTheme }) {
  const [themeKey,    setThemeKey]    = useState(DEFAULT_THEME);
  const [customColor, setCustomColorState] = useState(null);

  const applyFull = useCallback((key, vars, primary, secondary) => {
    document.documentElement.setAttribute("data-theme", key);
    applyVarsToRoot(vars);
    injectOverrides(primary, secondary);
  }, []);

  useEffect(() => {
    const storedKey   = localStorage.getItem(THEME_STORAGE_KEY);
    const storedCustom = localStorage.getItem(CUSTOM_COLOR_KEY);
    const resolved    = serverTheme || storedKey || DEFAULT_THEME;

    if (resolved === "custom" && storedCustom) {
      const vars = buildThemeVars(storedCustom);
      setThemeKey("custom");
      setCustomColorState(storedCustom);
      applyFull("custom", vars, storedCustom, vars["--t-secondary"]);
    } else {
      const theme = THEMES[resolved] ?? THEMES[DEFAULT_THEME];
      setThemeKey(resolved);
      applyFull(resolved, theme.vars, theme.primary, theme.vars["--t-secondary"]);
    }
  }, [serverTheme, applyFull]);

  // Switch to a named preset theme
  const setTheme = useCallback((key) => {
    const theme = THEMES[key];
    if (!theme) return;
    setThemeKey(key);
    localStorage.setItem(THEME_STORAGE_KEY, key);
    applyFull(key, theme.vars, theme.primary, theme.vars["--t-secondary"]);
  }, [applyFull]);

  // Apply any arbitrary hex color as a custom theme
  const setCustomColor = useCallback((hex) => {
    const vars = buildThemeVars(hex);
    setThemeKey("custom");
    setCustomColorState(hex);
    localStorage.setItem(THEME_STORAGE_KEY, "custom");
    localStorage.setItem(CUSTOM_COLOR_KEY, hex);
    applyFull("custom", vars, hex, vars["--t-secondary"]);
  }, [applyFull]);

  // Backend integration hook
  const applyThemeFromServer = useCallback((keyOrHex) => {
    if (THEMES[keyOrHex]) { setTheme(keyOrHex); }
    else if (/^#[0-9A-Fa-f]{6}$/.test(keyOrHex)) { setCustomColor(keyOrHex); }
  }, [setTheme, setCustomColor]);

  const activeTheme = themeKey === "custom"
    ? { name: "Custom", primary: customColor, preview: [customColor, customColor] }
    : (THEMES[themeKey] ?? THEMES[DEFAULT_THEME]);

  return (
    <ThemeContext.Provider value={{
      themeKey,
      theme: activeTheme,
      themes: THEMES,
      customColor,
      setTheme,
      setCustomColor,
      applyThemeFromServer,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};
