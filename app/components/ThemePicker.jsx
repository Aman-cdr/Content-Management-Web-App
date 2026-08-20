"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { buildThemeVars } from "@/lib/themes";
import { Check, Pipette, Sun, Moon, Bell, Type, Square, Layers } from "lucide-react";

const COLOR_FIELDS = [
  { key: "text", label: "Text", icon: Type, description: "Used for headings, labels and content." },
  { key: "component", label: "Component", icon: Square, description: "Used for buttons, cards and interactive UI." },
  { key: "page", label: "Page", icon: Layers, description: "Used for page backgrounds and the application outlet." },
];

function ColorField({ label, description, Icon, value, onChange }) {
  const ref = useRef(null);
  const [hexInput, setHexInput] = useState(value);
  const [error, setError] = useState("");

  useEffect(() => { setHexInput(value); }, [value]);

  const commitHex = (val) => {
    setHexInput(val);
    setError("");
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) onChange(val);
  };

  return (
    <div className="p-3 rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)] space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[var(--t-text-3)]" strokeWidth={1.5} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--t-text-2)]">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <input ref={ref} type="color" value={value} onChange={(e) => { setHexInput(e.target.value); onChange(e.target.value); }} className="sr-only" />
        <button
          onClick={() => ref.current?.click()}
          className="w-9 h-9 rounded-full border-2 border-[var(--t-border)] flex-shrink-0 transition-transform duration-300 hover:scale-105 shadow-sm"
          style={{ backgroundColor: value }}
          title={`Pick ${label} color`}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(e) => commitHex(e.target.value)}
          onBlur={() => { if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) { setError("Invalid hex"); setHexInput(value); } }}
          maxLength={7}
          className="flex-1 min-w-0 bg-transparent text-[13px] font-mono font-semibold text-[var(--t-text)] focus:outline-none"
        />
      </div>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      <p className="text-[10px] text-[var(--t-text-3)] leading-relaxed">{description}</p>
    </div>
  );
}

// Makes the 3-role split obvious: a PAGE background containing a heading/
// body in TEXT color and a card built from COMPONENT color — not just one
// button in isolation.
function LivePreview({ colors }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: colors.componentBorder }}>
      {/* PAGE layer */}
      <div className="p-5 space-y-4" style={{ background: colors.page }}>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: colors.textSubtle }}>Page background</p>
          <h4 className="text-[15px] font-bold leading-tight" style={{ color: colors.text }}>Heading uses Text color</h4>
          <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>Body copy steps down in the same hue for hierarchy.</p>
        </div>

        {/* Nav item — active indicator uses Component */}
        <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: colors.componentSoft }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: colors.component }}>
            <Bell className="w-3.5 h-3.5" style={{ color: colors.componentForeground }} />
          </div>
          <span className="text-[12px] font-bold" style={{ color: colors.text }}>Active nav item</span>
        </div>

        {/* COMPONENT layer — card */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.componentBorder}` }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ color: colors.text }}>Card — component layer</span>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: colors.componentSoft, color: colors.component }}>
              Badge
            </span>
          </div>

          <div className="h-9 rounded-lg px-3 flex items-center text-[11px]" style={{ background: colors.page, border: `1px solid ${colors.componentBorder}`, color: colors.textMuted }}>
            Input field
          </div>

          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: colors.componentSoft }}>
            <div className="h-full rounded-full" style={{ width: "62%", background: colors.component }} />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button className="flex-1 h-8 rounded-full text-[11px] font-bold" style={{ background: colors.component, color: colors.componentForeground }}>
              Primary Button
            </button>
            <button className="h-8 w-8 rounded-full flex items-center justify-center border" style={{ borderColor: colors.component, color: colors.component }} title="Ghost button">
              <Bell className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemePicker({ className = "" }) {
  const { themeKey, mode, colors, themes, setTheme, setCustomColors, setMode, presetSwatches } = useTheme();

  const isCustomActive = themeKey === "custom";

  // Derived straight from the same pure function ThemeContext uses to build
  // the live --theme-* vars, so the preview can never drift from what the
  // rest of the app is actually doing with these 3 colors.
  const derived = useMemo(() => {
    const vars = buildThemeVars(colors, mode);
    return {
      text: vars["--theme-text"], textMuted: vars["--theme-text-muted"], textSubtle: vars["--theme-text-subtle"],
      component: vars["--theme-component"], componentSoft: vars["--theme-component-soft"],
      componentBorder: vars["--theme-component-border"], componentForeground: vars["--theme-component-foreground"],
      page: vars["--theme-page"], surface: vars["--theme-surface"],
    };
  }, [colors, mode]);

  return (
    <div className={`space-y-6 ${className}`}>

      {/* ── Light / Dark mode toggle ── */}
      <div className="flex items-center gap-2 p-1 bg-[var(--t-surface-muted)] border border-[var(--t-border)] rounded-full w-fit">
        {[
          { key: "light", icon: Sun, label: "Light" },
          { key: "dark", icon: Moon, label: "Dark" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300 ${
              mode === m.key ? "bg-[var(--t-surface)] text-[var(--t-text)] shadow-sm" : "text-[var(--t-text-3)] hover:text-[var(--t-text-2)]"
            }`}
          >
            <m.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Preset swatches — 3-dot triple: Text / Component / Page ── */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(themes).map(([key, theme]) => {
          const active = themeKey === key;
          const dots = presetSwatches(theme);
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className="flex flex-col items-center gap-1.5 group"
              title={theme.name}
            >
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center gap-0.5 p-1.5 transition-transform group-hover:scale-105 ${active ? "ring-2 ring-offset-2 ring-[var(--t-primary)]" : "border border-[var(--t-border)]"}`}>
                {dots.map((c, i) => (
                  <span key={i} className="flex-1 h-full rounded-md" style={{ background: c }} />
                ))}
                {active && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-[var(--t-primary)]" strokeWidth={3} />
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-semibold ${active ? "text-[var(--t-primary)]" : "text-[var(--t-text-3)]"}`}>
                {theme.name}
              </span>
            </button>
          );
        })}

        {/* Custom swatch */}
        <button onClick={() => setCustomColors(colors)} className="flex flex-col items-center gap-1.5 group" title="Custom theme">
          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isCustomActive ? "ring-2 ring-offset-2 ring-[var(--t-primary)]" : "border-2 border-dashed border-[var(--t-border)]"}`}>
            {isCustomActive ? (
              <div className="flex gap-0.5 w-full h-full p-1.5">
                {[colors.text, colors.component, colors.page].map((c, i) => <span key={i} className="flex-1 h-full rounded-md" style={{ background: c }} />)}
              </div>
            ) : (
              <Pipette className="w-4 h-4 text-[var(--t-text-3)]" strokeWidth={1.5} />
            )}
          </div>
          <span className={`text-[11px] font-semibold ${isCustomActive ? "text-[var(--t-primary)]" : "text-[var(--t-text-3)]"}`}>Custom</span>
        </button>
      </div>

      {/* ── Custom color pickers — Text / Component / Page, each explained ── */}
      {isCustomActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              description={f.description}
              Icon={f.icon}
              value={colors[f.key]}
              onChange={(hex) => setCustomColors({ [f.key]: hex })}
            />
          ))}
        </div>
      )}

      {/* ── Live preview ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-[var(--t-text-3)] uppercase tracking-widest px-1">
          <Check className="w-3.5 h-3.5" strokeWidth={1.5} /> Live Preview — Text · Component · Page
        </div>
        {derived && <LivePreview colors={derived} />}
      </div>

      <p className="text-[11px] text-[var(--t-text-3)]">
        Changes apply instantly across the whole app and sync to your account.
      </p>
    </div>
  );
}
