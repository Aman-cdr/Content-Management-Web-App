"use client";
/**
 * TextPanel.jsx
 * Full text editing panel — fonts, styles, animations, templates.
 */

import { useState, useCallback } from 'react';
import useEditorStore from '../store/editorStore';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Outfit', 'Poppins', 'Montserrat',
  'Playfair Display', 'Dancing Script', 'Bebas Neue', 'Oswald', 'Raleway',
];

const TEXT_ANIMATIONS = [
  { id: 'none', label: 'None' },
  { id: 'fadeIn', label: 'Fade In' },
  { id: 'slideUp', label: 'Slide Up' },
  { id: 'slideDown', label: 'Slide Down' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'zoom', label: 'Zoom In' },
  { id: 'glitch', label: 'Glitch' },
];

const TEXT_TEMPLATES = [
  { id: 'title', label: 'Big Title', text: 'YOUR TITLE', fontSize: 64, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', x: 0.5, y: 0.2 },
  { id: 'lower-third', label: 'Lower Third', text: 'Name Here', fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.7)', x: 0.1, y: 0.85 },
  { id: 'caption', label: 'Caption', text: 'Caption text here', fontSize: 22, fontWeight: '500', color: '#FFFFFF', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', x: 0.5, y: 0.9 },
  { id: 'highlight', label: 'Highlight', text: 'KEY POINT', fontSize: 32, fontWeight: '800', color: '#FFDD00', textAlign: 'center', x: 0.5, y: 0.5 },
];

export default function TextPanel() {
  const addTextLayer = useEditorStore(s => s.addTextLayer);
  const selectedLayerId = useEditorStore(s => s.selectedLayerId);
  const textLayers = useEditorStore(s => s.textLayers);
  const updateTextLayer = useEditorStore(s => s.updateTextLayer);
  const removeTextLayer = useEditorStore(s => s.removeTextLayer);
  const currentTime = useEditorStore(s => s.currentTime);
  const duration = useEditorStore(s => s.duration);

  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'style' | 'animate'

  const selectedLayer = textLayers.find(l => l.id === selectedLayerId);

  const addText = useCallback((template = null) => {
    const base = template ?? {
      text: 'Add Text Here',
      fontSize: 36,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      textShadow: true,
      x: 0.5,
      y: 0.5,
      backgroundColor: null,
      padding: 8,
      rotation: 0,
      opacity: 1,
    };

    const id = `text_${Date.now()}`;
    addTextLayer({
      id,
      ...base,
      animation: 'none',
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration || 30),
    });
  }, [addTextLayer, currentTime, duration]);

  const update = useCallback((key, value) => {
    if (!selectedLayerId) return;
    updateTextLayer(selectedLayerId, { [key]: value });
  }, [selectedLayerId, updateTextLayer]);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--t-border)', padding: '0 12px' }}>
        {[['add', 'Add Text'], ['style', 'Style'], ['animate', 'Animate']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === id ? '#6366f1' : 'var(--t-text-muted)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Add Tab ── */}
      {activeTab === 'add' && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => addText()}
            style={addBtnStyle}
          >
            + Add Text
          </button>

          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Templates</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEXT_TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => addText(tmpl)}
                style={{
                  padding: '12px 8px',
                  background: 'var(--t-surface)',
                  border: '1px solid var(--t-border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--t-text)',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
              >
                <span style={{ fontSize: 18 }}>📝</span>
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Active text layers */}
          {textLayers.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Layers</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {textLayers.map(layer => (
                  <div key={layer.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    background: selectedLayerId === layer.id ? 'rgba(99,102,241,0.1)' : 'var(--t-surface)',
                    border: `1px solid ${selectedLayerId === layer.id ? '#6366f1' : 'var(--t-border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                    onClick={() => useEditorStore.getState().setSelectedLayer(layer.id)}
                  >
                    <span style={{ fontSize: 14 }}>💬</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--t-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {layer.text}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTextLayer(layer.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 2 }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Style Tab ── */}
      {activeTab === 'style' && selectedLayer && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Font Family */}
          <FormRow label="Font">
            <select
              value={selectedLayer.fontFamily ?? 'Inter'}
              onChange={e => update('fontFamily', e.target.value)}
              style={selectStyle}
            >
              {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </FormRow>

          {/* Font Size */}
          <FormRow label="Size">
            <input
              type="range" min={8} max={200} step={1}
              value={selectedLayer.fontSize ?? 36}
              onChange={e => update('fontSize', Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)', width: 32, textAlign: 'right' }}>
              {selectedLayer.fontSize ?? 36}px
            </span>
          </FormRow>

          {/* Weight */}
          <FormRow label="Weight">
            <select value={selectedLayer.fontWeight ?? '700'} onChange={e => update('fontWeight', e.target.value)} style={selectStyle}>
              {['100', '300', '400', '500', '600', '700', '800', '900'].map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </FormRow>

          {/* Color */}
          <FormRow label="Color">
            <input type="color" value={selectedLayer.color ?? '#FFFFFF'} onChange={e => update('color', e.target.value)} style={{ width: 40, height: 28, padding: 2, borderRadius: 6, border: '1px solid var(--t-border)', cursor: 'pointer' }} />
            <input type="text" value={selectedLayer.color ?? '#FFFFFF'} onChange={e => update('color', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </FormRow>

          {/* Text Align */}
          <FormRow label="Align">
            <div style={{ display: 'flex', gap: 4 }}>
              {['left', 'center', 'right'].map(a => (
                <button key={a} onClick={() => update('textAlign', a)} style={{
                  ...miniToggleBtn,
                  background: selectedLayer.textAlign === a ? '#6366f1' : 'var(--t-surface)',
                  color: selectedLayer.textAlign === a ? '#fff' : 'var(--t-text-muted)',
                }}>{a === 'left' ? '⬅' : a === 'center' ? '⇔' : '➡'}</button>
              ))}
            </div>
          </FormRow>

          {/* Opacity */}
          <FormRow label="Opacity">
            <input type="range" min={0} max={1} step={0.01} value={selectedLayer.opacity ?? 1} onChange={e => update('opacity', Number(e.target.value))} style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)', width: 32, textAlign: 'right' }}>
              {Math.round((selectedLayer.opacity ?? 1) * 100)}%
            </span>
          </FormRow>

          {/* Background */}
          <FormRow label="BG">
            <input type="color" value={selectedLayer.backgroundColor?.replace(/rgba?\(.*?\)/, '#000000') ?? '#000000'} onChange={e => update('backgroundColor', e.target.value + '88')} style={{ width: 40, height: 28, padding: 2, borderRadius: 6, border: '1px solid var(--t-border)', cursor: 'pointer' }} />
            <button onClick={() => update('backgroundColor', null)} style={{ ...miniToggleBtn, fontSize: 10 }}>None</button>
          </FormRow>

          {/* Shadow toggle */}
          <FormRow label="Shadow">
            <button onClick={() => update('textShadow', !selectedLayer.textShadow)} style={{
              ...miniToggleBtn,
              background: selectedLayer.textShadow ? '#6366f1' : 'var(--t-surface)',
              color: selectedLayer.textShadow ? '#fff' : 'var(--t-text-muted)',
            }}>
              {selectedLayer.textShadow ? 'On' : 'Off'}
            </button>
          </FormRow>

          {/* Edit text content */}
          <FormRow label="Text">
            <textarea
              value={selectedLayer.text ?? ''}
              onChange={e => update('text', e.target.value)}
              rows={2}
              style={{ ...inputStyle, flex: 1, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </FormRow>
        </div>
      )}

      {/* ── Animate Tab ── */}
      {activeTab === 'animate' && selectedLayer && (
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Animation Preset</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {TEXT_ANIMATIONS.map(anim => (
              <button
                key={anim.id}
                onClick={() => update('animation', anim.id)}
                style={{
                  ...miniToggleBtn,
                  padding: '8px 10px',
                  fontSize: 11,
                  background: selectedLayer.animation === anim.id ? '#6366f1' : 'var(--t-surface)',
                  color: selectedLayer.animation === anim.id ? '#fff' : 'var(--t-text)',
                  border: `1px solid ${selectedLayer.animation === anim.id ? '#6366f1' : 'var(--t-border)'}`,
                  borderRadius: 8,
                  justifyContent: 'flex-start',
                }}
              >
                {anim.label}
              </button>
            ))}
          </div>

          {/* Duration / Timing */}
          <FormRow label="Start">
            <input type="number" step={0.1} min={0} value={selectedLayer.startTime ?? 0} onChange={e => update('startTime', Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>sec</span>
          </FormRow>
          <FormRow label="End">
            <input type="number" step={0.1} min={0} value={selectedLayer.endTime ?? 5} onChange={e => update('endTime', Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>sec</span>
          </FormRow>
        </div>
      )}

      {activeTab !== 'add' && !selectedLayer && (
        <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--t-text-muted)', fontSize: 12 }}>
          Select a text layer to edit
        </div>
      )}
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', width: 54, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
    </div>
  );
}

const addBtnStyle = {
  width: '100%',
  padding: '10px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
};

const selectStyle = {
  flex: 1,
  padding: '5px 8px',
  background: 'var(--t-surface)',
  border: '1px solid var(--t-border)',
  borderRadius: 8,
  color: 'var(--t-text)',
  fontSize: 12,
  cursor: 'pointer',
};

const inputStyle = {
  padding: '5px 8px',
  background: 'var(--t-surface)',
  border: '1px solid var(--t-border)',
  borderRadius: 8,
  color: 'var(--t-text)',
  fontSize: 12,
  outline: 'none',
};

const miniToggleBtn = {
  padding: '5px 10px',
  background: 'var(--t-surface)',
  border: '1px solid var(--t-border)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
};
