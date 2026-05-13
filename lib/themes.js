export const THEME_STORAGE_KEY = "creator-cms-theme";
export const DEFAULT_THEME     = "indigo";

// ─── Color math helpers ───────────────────────────────────────────────────────
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * Generate a full set of theme CSS vars from a single primary hex color.
 * Used for both preset themes and custom color picks.
 */
export function buildThemeVars(primary, options = {}) {
  const [h, s, l] = hexToHsl(primary);

  const primaryDark = hslToHex(h, Math.min(s + 5, 100), Math.max(l - 12, 20));
  const secondary   = hslToHex((h + 30) % 360, Math.min(s - 5, 100), Math.min(l + 5, 80));

  const { r, g, b } = hexToRgb(primary);

  // Only return accent vars — layout vars (sidebar, bg, text, border) are
  // locked in globals.css and must never be overridden by the theme picker.
  return {
    "--t-primary":       primary,
    "--t-primary-dark":  primaryDark,
    "--t-primary-light": `rgba(${r},${g},${b},0.09)`,
    "--t-primary-glow":  `rgba(${r},${g},${b},0.28)`,
    "--t-secondary":     secondary,
  };
}

// ─── Preset themes ────────────────────────────────────────────────────────────
export const THEMES = {
  indigo: {
    name: "Indigo",
    primary: "#6366F1",
    preview: ["#6366F1", "#8B5CF6"],
    vars: buildThemeVars("#6366F1"),
  },
  ocean: {
    name: "Ocean",
    primary: "#0EA5E9",
    preview: ["#0EA5E9", "#06B6D4"],
    vars: buildThemeVars("#0EA5E9"),
  },
  emerald: {
    name: "Emerald",
    primary: "#10B981",
    preview: ["#10B981", "#34D399"],
    vars: buildThemeVars("#10B981"),
  },
  rose: {
    name: "Rose",
    primary: "#F43F5E",
    preview: ["#F43F5E", "#FB7185"],
    vars: buildThemeVars("#F43F5E"),
  },
  amber: {
    name: "Amber",
    primary: "#F59E0B",
    preview: ["#F59E0B", "#FBBF24"],
    vars: buildThemeVars("#F59E0B"),
  },
  dark: {
    name: "Dark",
    primary: "#6366F1",
    preview: ["#6366F1", "#1A1A28"],
    vars: buildThemeVars("#6366F1", { darkMode: true }),
  },
};
