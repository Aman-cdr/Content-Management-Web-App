"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Check, Pipette } from "lucide-react";

export default function ThemePicker({ className = "" }) {
  const { themeKey, themes, customColor, setTheme, setCustomColor } = useTheme();

  const [hex, setHex] = useState(customColor || "#6366F1");
  const [hexInput, setHexInput] = useState(customColor || "#6366F1");
  const [error, setError] = useState("");
  const colorRef = useRef(null);

  const isCustomActive = themeKey === "custom";

  const handleColorChange = (val) => {
    setHex(val);
    setHexInput(val);
    setError("");
    setCustomColor(val);   // live update as wheel moves
  };

  const handleHexInput = (val) => {
    setHexInput(val);
    setError("");
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHex(val);
      setCustomColor(val);
    }
  };

  const handleHexBlur = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setError("Enter a valid 6-digit hex e.g. #F43F5E");
      setHexInput(hex);
    }
  };

  // Preset dots
  const presets = Object.entries(themes);

  return (
    <div className={`space-y-5 ${className}`}>

      {/* ── Preset swatches ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {presets.map(([key, theme]) => {
          const active = themeKey === key && !isCustomActive;
          return (
            <button
              key={key}
              onClick={() => { setTheme(key); setHexInput(theme.primary); setHex(theme.primary); }}
              className="flex flex-col items-center gap-1.5 group"
              title={theme.name}
            >
              {/* Swatch circle */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full transition-transform group-hover:scale-110 ${active ? "ring-2 ring-offset-2" : ""}`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1] ?? theme.preview[0]})`,
                    ringColor: theme.preview[0],
                  }}
                />
                {active && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-semibold ${active ? "text-[var(--t-primary)]" : "text-[var(--t-text-3)]"}`}>
                {theme.name}
              </span>
            </button>
          );
        })}

        {/* Custom swatch dot */}
        <button
          onClick={() => colorRef.current?.click()}
          className="flex flex-col items-center gap-1.5 group"
          title="Pick custom color"
        >
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full transition-transform group-hover:scale-110 border-2 border-dashed ${isCustomActive ? "ring-2 ring-offset-2" : "border-[var(--t-border)]"}`}
              style={{
                background: isCustomActive ? `linear-gradient(135deg, ${customColor}, ${customColor}aa)` : "transparent",
                ringColor: customColor || "var(--t-primary)",
              }}
            >
              {!isCustomActive && (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--t-text-3)]">
                  <Pipette className="w-4 h-4" />
                </div>
              )}
              {isCustomActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white drop-shadow" />
                </div>
              )}
            </div>
          </div>
          <span className={`text-[11px] font-semibold ${isCustomActive ? "text-[var(--t-primary)]" : "text-[var(--t-text-3)]"}`}>
            Custom
          </span>
        </button>
      </div>

      {/* ── Custom color input row ──────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--t-border)] bg-[var(--t-surface)]">

        {/* Hidden native color wheel — triggered by swatch click */}
        <input
          ref={colorRef}
          type="color"
          value={hex}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only"
        />

        {/* Visible color swatch button → opens native picker */}
        <button
          onClick={() => colorRef.current?.click()}
          className="w-10 h-10 rounded-xl border-2 border-[var(--t-border)] flex-shrink-0 transition-transform hover:scale-105 shadow-sm"
          style={{ backgroundColor: hex }}
          title="Open color wheel"
        />

        {/* Hex text input */}
        <div className="flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={handleHexBlur}
            maxLength={7}
            placeholder="#6366F1"
            className="w-full bg-transparent text-[14px] font-mono font-semibold text-[var(--t-text)] placeholder:text-[var(--t-text-3)] focus:outline-none"
          />
          {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
        </div>

        {/* Live preview bar */}
        <div
          className="h-8 w-24 rounded-lg flex-shrink-0 transition-all duration-200"
          style={{ background: `linear-gradient(135deg, ${hex}, ${hex}99)` }}
        />

        {/* Apply button */}
        <button
          onClick={() => { setCustomColor(hex); setHexInput(hex); }}
          className="flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: hex }}
        >
          Apply
        </button>
      </div>

      <p className="text-[11px] text-[var(--t-text-3)]">
        Changes apply instantly and are saved to your browser. Connect your account to sync across devices.
      </p>
    </div>
  );
}
