"use client";
/**
 * FiltersPanel.jsx + ColorGrading panel.
 * Effects, visual filters, color grading and transitions.
 */

import { useState, useCallback } from 'react';
import useEditorStore from '../store/editorStore';

const FILTERS = [
  { id: 'none', name: 'Original', cssFilter: 'none', params: {} },
  { id: 'vivid', name: 'Vivid', cssFilter: 'saturate(1.8) contrast(1.1)', params: { saturation: 0.8, contrast: 0.1 } },
  { id: 'cinematic', name: 'Cinematic', cssFilter: 'contrast(1.15) brightness(0.9) sepia(0.15)', params: { contrast: 0.15, brightness: -0.1 } },
  { id: 'warm', name: 'Warm', cssFilter: 'sepia(0.3) saturate(1.4) brightness(1.05)', params: { temperature: 0.5 } },
  { id: 'cool', name: 'Cool', cssFilter: 'hue-rotate(180deg) saturate(1.2) brightness(0.95)', params: { hue: 180 } },
  { id: 'bw', name: 'B&W', cssFilter: 'grayscale(1) contrast(1.2)', params: { saturation: -1 } },
  { id: 'vintage', name: 'Vintage', cssFilter: 'sepia(0.6) contrast(0.9) brightness(0.85)', params: {} },
  { id: 'fade', name: 'Fade', cssFilter: 'brightness(1.1) saturate(0.7) contrast(0.85)', params: {} },
  { id: 'dream', name: 'Dream', cssFilter: 'brightness(1.15) saturate(1.3) blur(0px) contrast(0.9)', params: {} },
  { id: 'neon', name: 'Neon', cssFilter: 'saturate(3) contrast(1.2) hue-rotate(270deg)', params: {} },
  { id: 'matte', name: 'Matte', cssFilter: 'contrast(0.85) brightness(1.1) saturate(1.1)', params: {} },
  { id: 'lomo', name: 'Lomo', cssFilter: 'saturate(1.5) contrast(1.3) brightness(0.9)', params: {} },
];

const TRANSITIONS = [
  { id: 'dissolve', name: 'Dissolve', icon: '🌫️' },
  { id: 'fade', name: 'Fade', icon: '⬛' },
  { id: 'wipeLeft', name: 'Wipe L→R', icon: '◀' },
  { id: 'wipeRight', name: 'Wipe R→L', icon: '▶' },
  { id: 'zoom', name: 'Zoom', icon: '🔍' },
  { id: 'slide', name: 'Slide', icon: '↔️' },
  { id: 'glitch', name: 'Glitch', icon: '⚡' },
  { id: 'spin', name: 'Spin', icon: '🌀' },
];

export default function EffectsPanel({ videoRef }) {
  const colorGrading = useEditorStore(s => s.colorGrading);
  const setColorGrading = useEditorStore(s => s.setColorGrading);
  const resetColorGrading = useEditorStore(s => s.resetColorGrading);
  const activeFilter = useEditorStore(s => s.activeFilter);
  const filterIntensity = useEditorStore(s => s.filterIntensity);
  const setActiveFilter = useEditorStore(s => s.setActiveFilter);
  const setFilterIntensity = useEditorStore(s => s.setFilterIntensity);

  const [activeTab, setActiveTab] = useState('filters');

  // Apply CSS filter to video element for real-time preview
  const applyFilter = useCallback((filter) => {
    setActiveFilter(filter.id === activeFilter ? null : filter.id);
    if (videoRef?.current) {
      videoRef.current.style.filter = filter.id === activeFilter ? 'none' : filter.cssFilter;
    }
  }, [activeFilter, setActiveFilter, videoRef]);

  // Build combined CSS filter from color grading params
  const buildCssFilter = useCallback(() => {
    const g = colorGrading;
    const parts = [];
    if (g.brightness !== 0) parts.push(`brightness(${1 + g.brightness})`);
    if (g.contrast !== 0) parts.push(`contrast(${1 + g.contrast})`);
    if (g.saturation !== 0) parts.push(`saturate(${1 + g.saturation})`);
    if (g.hue !== 0) parts.push(`hue-rotate(${g.hue}deg)`);
    return parts.join(' ') || 'none';
  }, [colorGrading]);

  const applyColorGrading = useCallback((key, value) => {
    const newGrading = { ...colorGrading, [key]: value };
    setColorGrading({ [key]: value });

    if (videoRef?.current) {
      const css = Object.entries({
        brightness: newGrading.brightness,
        contrast: newGrading.contrast,
        saturation: newGrading.saturation,
        hue: newGrading.hue,
      }).map(([k, v]) => {
        if (k === 'brightness' && v !== 0) return `brightness(${1 + v})`;
        if (k === 'contrast' && v !== 0) return `contrast(${1 + v})`;
        if (k === 'saturation' && v !== 0) return `saturate(${1 + v})`;
        if (k === 'hue' && v !== 0) return `hue-rotate(${v}deg)`;
        return null;
      }).filter(Boolean).join(' ');
      videoRef.current.style.filter = css || 'none';
    }
  }, [colorGrading, setColorGrading, videoRef]);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', padding: '0 12px' }}>
        {[['filters', 'Filters'], ['color', 'Color'], ['transitions', 'Transitions']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '6px 12px', background: 'transparent', border: 'none',
            borderBottom: activeTab === id ? '2px solid #6366f1' : '2px solid transparent',
            color: activeTab === id ? '#6366f1' : 'var(--t-text-muted)',
            fontWeight: 700, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Filters Tab ── */}
      {activeTab === 'filters' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => applyFilter(filter)}
                style={{
                  padding: '0',
                  background: activeFilter === filter.id ? 'rgba(99,102,241,0.15)' : 'var(--t-surface)',
                  border: `1.5px solid ${activeFilter === filter.id ? '#6366f1' : 'var(--t-border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  height: 56,
                  background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                  filter: filter.cssFilter,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}>🎬</div>
                <p style={{ margin: 0, padding: '4px 4px', fontSize: 10, fontWeight: 700, color: activeFilter === filter.id ? '#6366f1' : 'var(--t-text)', textAlign: 'center' }}>
                  {filter.name}
                </p>
              </button>
            ))}
          </div>

          {/* Intensity slider */}
          {activeFilter && activeFilter !== 'none' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text)' }}>Filter Intensity</span>
                <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{Math.round(filterIntensity * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={filterIntensity} onChange={e => setFilterIntensity(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
          )}
        </div>
      )}

      {/* ── Color Grading Tab ── */}
      {activeTab === 'color' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color Grading</p>
            <button onClick={resetColorGrading} style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
          </div>

          {[
            { key: 'brightness', label: '☀️ Brightness', min: -1, max: 1, step: 0.01 },
            { key: 'contrast', label: '◑ Contrast', min: -1, max: 1, step: 0.01 },
            { key: 'saturation', label: '🎨 Saturation', min: -1, max: 2, step: 0.01 },
            { key: 'temperature', label: '🌡️ Temperature', min: -1, max: 1, step: 0.01 },
            { key: 'highlights', label: '✨ Highlights', min: -1, max: 1, step: 0.01 },
            { key: 'shadows', label: '🌑 Shadows', min: -1, max: 1, step: 0.01 },
            { key: 'hue', label: '🌈 Hue', min: -180, max: 180, step: 1 },
            { key: 'exposure', label: '📷 Exposure', min: -2, max: 2, step: 0.01 },
          ].map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-text)' }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--t-text-muted)', fontFamily: 'monospace', width: 40, textAlign: 'right' }}>
                  {colorGrading[key] > 0 ? '+' : ''}{colorGrading[key].toFixed(2)}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step}
                value={colorGrading[key]}
                onChange={e => applyColorGrading(key, Number(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Transitions Tab ── */}
      {activeTab === 'transitions' && (
        <div style={{ padding: '0 12px' }}>
          <p style={{ fontSize: 11, color: 'var(--t-text-muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Select a transition, then drag it to the join between two clips on the timeline.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {TRANSITIONS.map(t => (
              <div
                key={t.id}
                draggable
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 10,
                  cursor: 'grab', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
              >
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
