import { mixHex, shiftLightness, withAlpha, getReadableForeground, contrastRatio, relativeLuminance } from "./theme/color-utils";

export const THEME_STORAGE_KEY  = "creator-cms-theme";
export const CUSTOM_COLORS_KEY  = "creator-cms-custom-colors"; // JSON: {text,component,page}
export const MODE_STORAGE_KEY   = "creator-cms-mode";          // "light" | "dark"
export const DEFAULT_THEME      = "indigo";
export const DEFAULT_MODE       = "light";

// ─── The 3-color model — three colors, three strictly separate jobs ───────────
//   COLOR 1 "text"      → typography: headings, body, labels, nav text, numbers.
//   COLOR 2 "component"  → every interactive/component surface: buttons, cards,
//                          inputs, tabs, badges, borders, hover/active/focus.
//   COLOR 3 "page"       → the application outlet: background, page/section
//                          surfaces, main content area — visible on every route.
// These are never interchanged (e.g. "text" never paints a button; "page"
// never paints text) — see deriveTextTokens/deriveComponentTokens/
// deriveSurfaceTokens below, each keyed to exactly one of the three inputs.
export const THEMES = {
  indigo: {
    id: "indigo",
    name: "Indigo",
    colors: { text: "#312E81", component: "#6366F1", page: "#EEF2FF" },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    colors: { text: "#164E63", component: "#0891B2", page: "#ECFEFF" },
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    colors: { text: "#064E3B", component: "#10B981", page: "#ECFDF5" },
  },
  rose: {
    id: "rose",
    name: "Rose",
    colors: { text: "#881337", component: "#F43F5E", page: "#FFF1F2" },
  },
  amber: {
    id: "amber",
    name: "Amber",
    colors: { text: "#78350F", component: "#F59E0B", page: "#FFFBEB" },
  },
  dark: {
    id: "dark",
    name: "Dark",
    colors: { text: "#E0E7FF", component: "#818CF8", page: "#0B0B14" },
    mode: "dark",
  },
};

// Each preset's swatch dots for the picker UI (text/component/page).
export function presetSwatches(theme) {
  return [theme.colors.text, theme.colors.component, theme.colors.page];
}

// ─── COLOR 1 → Typography hierarchy ────────────────────────────────────────
// Heading/main text uses the color as given (checked against its surface for
// AA contrast, nudged darker/lighter only if it fails). Everything below it
// steps toward the surface color rather than toward gray, so the hierarchy
// still reads as "the same hue, quieter" instead of "color, then generic gray".
function deriveTextTokens(textHex, mode, surfaceHex) {
  let main = textHex;
  if (contrastRatio(main, surfaceHex) < 4.5) {
    // Given custom colors can be anything, guarantee body-text-grade contrast
    // by pushing lightness away from the surface until it clears AA — instead
    // of silently rendering illegible text.
    const towardDark = relativeLuminance(surfaceHex) > 0.5;
    for (let i = 0; i < 12 && contrastRatio(main, surfaceHex) < 4.5; i++) {
      main = shiftLightness(main, towardDark ? -6 : 6);
    }
  }
  return {
    main,
    // Hierarchy: main (heading) → secondary (body/labels) → muted → subtle → disabled,
    // each stepping further toward the surface color so it reads as "the
    // same hue, quieter" rather than "color, then generic gray".
    secondary: mixHex(main, surfaceHex, mode === "dark" ? 82 : 78),
    muted: mixHex(main, surfaceHex, mode === "dark" ? 68 : 62),
    subtle: mixHex(main, surfaceHex, mode === "dark" ? 45 : 40),
    disabled: mixHex(main, surfaceHex, mode === "dark" ? 30 : 26),
    link: main,
  };
}

// ─── COLOR 2 → Component/interaction layer ─────────────────────────────────
function deriveComponentTokens(componentHex, mode) {
  const hoverDelta = mode === "dark" ? 8 : -8;
  return {
    base: componentHex,
    hover: shiftLightness(componentHex, hoverDelta),
    active: shiftLightness(componentHex, hoverDelta * 1.6),
    soft: withAlpha(componentHex, mode === "dark" ? 0.18 : 0.1),
    softHover: withAlpha(componentHex, mode === "dark" ? 0.26 : 0.16),
    border: withAlpha(componentHex, mode === "dark" ? 0.35 : 0.22),
    focus: withAlpha(componentHex, 0.32),
    foreground: getReadableForeground(componentHex),
  };
}

// ─── COLOR 3 → Page/outlet/surface layer ───────────────────────────────────
// `page` itself is the app's main background; `surface` (cards, panels) sits
// one step toward white/black from it so content doesn't blend into the
// backdrop; `surfaceHover`/`surfaceSelected` step further for interactive
// feedback. The sidebar is a deliberately darker derivative of the same hue
// (not a flat neutral) so it reads as "this app's dark rail", not generic
// black, while staying dark enough for the sidebar's white logo/text to work.
function deriveSurfaceTokens(pageHex, mode) {
  if (mode === "dark") {
    return {
      page: pageHex,
      pageSoft: mixHex("#000000", pageHex, 18),
      surface: mixHex("#FFFFFF", pageHex, 6),
      surfaceHover: mixHex("#FFFFFF", pageHex, 10),
      surfaceSelected: mixHex("#FFFFFF", pageHex, 14),
      header: mixHex("#FFFFFF", pageHex, 4),
      sidebar: mixHex("#000000", pageHex, 55),
    };
  }
  return {
    page: pageHex,
    pageSoft: mixHex("#000000", pageHex, 4),
    surface: mixHex("#FFFFFF", pageHex, 88),
    surfaceHover: mixHex("#FFFFFF", pageHex, 78),
    surfaceSelected: mixHex("#FFFFFF", pageHex, 70),
    header: mixHex("#FFFFFF", pageHex, 92),
    sidebar: mixHex("#000000", pageHex, 88),
  };
}

/**
 * Builds the full CSS variable map for one theme. Emits the new --theme-*
 * vocabulary (text/component/page, per the 3-role spec) AND the legacy --t-*
 * aliases that the rest of the app (DashboardShell, globals.css utility
 * classes, ThemePicker) already consumes, so both layers stay in sync from
 * one source of truth instead of drifting.
 */
export function buildThemeVars(colors, mode = "light") {
  const surf = deriveSurfaceTokens(colors.page, mode);
  const text = deriveTextTokens(colors.text, mode, surf.surface);
  const comp = deriveComponentTokens(colors.component, mode);

  // Sidebar is always a dark surface (even in light mode) — text on it needs
  // its own contrast-safe derivation (a light, hue-preserving version of
  // Color 1) rather than the light-surface `text` tokens above, which are
  // tuned for light backgrounds and would be unreadable here.
  const sidebarTextMain = mixHex("#FFFFFF", colors.text, 55);
  const sidebarTextDim = mixHex(sidebarTextMain, surf.sidebar, 55);

  return {
    // ── New semantic vocabulary ──
    "--theme-text":            text.main,
    "--theme-text-secondary":  text.secondary,
    "--theme-text-muted":      text.muted,
    "--theme-text-subtle":     text.subtle,
    "--theme-text-disabled":   text.disabled,
    "--theme-text-link":       text.link,

    "--theme-component":            comp.base,
    "--theme-component-hover":      comp.hover,
    "--theme-component-active":     comp.active,
    "--theme-component-soft":       comp.soft,
    "--theme-component-soft-hover": comp.softHover,
    "--theme-component-border":     comp.border,
    "--theme-component-focus":      comp.focus,
    "--theme-component-foreground": comp.foreground,

    "--theme-page":             surf.page,
    "--theme-page-soft":        surf.pageSoft,
    "--theme-surface":          surf.surface,
    "--theme-surface-hover":    surf.surfaceHover,
    "--theme-surface-selected": surf.surfaceSelected,

    // ── Legacy aliases — keeps every previously-migrated component (which
    // reads var(--t-primary), .btn-primary, .card, etc.) in sync with the
    // new 3-role source of truth instead of needing a second rewrite. ──
    "--t-primary":            comp.base,
    "--t-primary-hover":      comp.hover,
    "--t-primary-active":     comp.active,
    "--t-primary-soft":       comp.soft,
    "--t-primary-soft-hover": comp.softHover,
    "--t-primary-glow":       comp.focus,
    "--t-primary-foreground": comp.foreground,
    "--t-primary-dark":       comp.hover,
    "--t-primary-light":      comp.soft,

    "--t-secondary":            comp.hover,
    "--t-secondary-hover":      comp.active,
    "--t-secondary-active":     shiftLightness(comp.active, mode === "dark" ? 8 : -8),
    "--t-secondary-soft":       comp.softHover,
    "--t-secondary-foreground": comp.foreground,

    "--t-accent":            comp.base,
    "--t-accent-hover":      comp.hover,
    "--t-accent-active":     comp.active,
    "--t-accent-soft":       comp.soft,
    "--t-accent-foreground": comp.foreground,

    "--t-bg":            surf.page,
    "--t-surface":        surf.surface,
    "--t-surface-muted":  surf.pageSoft,
    "--t-header-bg":      surf.header,
    "--t-text":           text.main,
    "--t-text-2":         text.muted,
    "--t-text-3":         text.subtle,
    // Per the spec, card/component borders are COLOR 2 (component)-derived,
    // not page-derived — "Card border → component-border".
    "--t-border":         comp.border,
    "--t-border-hover":   withAlpha(comp.base, mode === "dark" ? 0.45 : 0.32),
    "--t-focus-ring":     comp.focus,
    "--t-sidebar":        surf.sidebar,
    "--t-sidebar-text":   sidebarTextMain,
    "--t-sidebar-text-dim": sidebarTextDim,

    // Chart ticks — page is usually near-white/near-black (bad chart ink),
    // so ticks are built from the two colors that are actually visible.
    "--t-chart-1": comp.base,
    "--t-chart-2": text.main,
    "--t-chart-3": comp.hover,
    "--t-chart-4": mixHex(comp.base, text.main, 50),
    "--t-chart-5": comp.active,
  };
}
