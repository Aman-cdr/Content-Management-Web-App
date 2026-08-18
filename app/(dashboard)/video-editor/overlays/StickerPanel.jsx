"use client";
/**
 * StickerPanel.jsx
 * Sticker and image overlay browser panel.
 */

import { useState, useCallback } from 'react';
import useEditorStore from '../store/editorStore';

const STICKER_CATEGORIES = [
  { id: 'emoji', label: '😀 Emoji' },
  { id: 'shapes', label: '🔷 Shapes' },
  { id: 'arrows', label: '➡️ Arrows' },
  { id: 'social', label: '📱 Social' },
  { id: 'custom', label: '⬆️ Upload' },
];

const STICKERS = {
  emoji: ['😀', '🔥', '💯', '✨', '🎉', '❤️', '💪', '🤩', '😱', '👀', '💀', '🫶', '⚡', '🌟', '💥', '🎯', '🏆', '🙌'],
  shapes: ['⬛', '🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '⭐', '💎', '🔶', '🔷', '🔸', '🔹', '⬜', '🔲', '🔳'],
  arrows: ['→', '←', '↑', '↓', '↗', '↘', '↙', '↖', '↔', '↕', '⇒', '⇐', '⟹', '➤', '➡', '🔄', '🔃'],
  social: ['📸', '🎬', '📹', '🎵', '🎶', '📺', '💻', '📱', '🔔', '❗', '❓', '💬', '👍', '👎', '🔗', '📌'],
};

export default function StickerPanel() {
  const addStickerLayer = useEditorStore(s => s.addStickerLayer);
  const stickerLayers = useEditorStore(s => s.stickerLayers);
  const removeStickerLayer = useEditorStore(s => s.removeStickerLayer);
  const currentTime = useEditorStore(s => s.currentTime);
  const duration = useEditorStore(s => s.duration);
  const setSelectedLayer = useEditorStore(s => s.setSelectedLayer);
  const selectedLayerId = useEditorStore(s => s.selectedLayerId);

  const [activeCategory, setActiveCategory] = useState('emoji');
  const [search, setSearch] = useState('');

  const addSticker = useCallback((sticker, type = 'emoji') => {
    const id = `sticker_${Date.now()}`;
    addStickerLayer({
      id,
      type: 'emoji',
      content: sticker,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      opacity: 1,
      fontSize: 48,
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration || 30),
    });
    setSelectedLayer(id);
  }, [addStickerLayer, currentTime, duration, setSelectedLayer]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const id = `sticker_${Date.now()}`;
    addStickerLayer({
      id,
      type: 'image',
      src: url,
      x: 0.5,
      y: 0.5,
      scale: 0.3,
      rotation: 0,
      opacity: 1,
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration || 30),
    });
    setSelectedLayer(id);
  }, [addStickerLayer, currentTime, duration, setSelectedLayer]);

  const displayStickers = activeCategory === 'custom' ? [] : (STICKERS[activeCategory] ?? []);

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Search */}
      <div style={{ padding: '0 12px' }}>
        <input
          type="text"
          placeholder="Search stickers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: 'var(--t-surface)',
            border: '1px solid var(--t-border)',
            borderRadius: 8,
            color: 'var(--t-text)',
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ padding: '0 12px', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {STICKER_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '5px 10px',
              background: activeCategory === cat.id ? '#6366f1' : 'var(--t-surface)',
              border: `1px solid ${activeCategory === cat.id ? '#6366f1' : 'var(--t-border)'}`,
              borderRadius: 20,
              color: activeCategory === cat.id ? '#fff' : 'var(--t-text-muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >{cat.label}</button>
        ))}
      </div>

      {/* Sticker grid or upload */}
      <div style={{ padding: '0 12px' }}>
        {activeCategory === 'custom' ? (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '32px 16px',
            border: '2px dashed var(--t-border)',
            borderRadius: 12,
            cursor: 'pointer',
            color: 'var(--t-text-muted)',
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--t-border)'}
          >
            <span style={{ fontSize: 32 }}>⬆️</span>
            Upload Image or Sticker
            <span style={{ fontSize: 11, color: '#6b7280' }}>PNG, JPG, GIF, SVG</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </label>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {displayStickers
              .filter(s => !search || s.includes(search))
              .map((sticker, i) => (
                <button
                  key={i}
                  onClick={() => addSticker(sticker, activeCategory)}
                  title={`Add ${sticker}`}
                  style={{
                    aspectRatio: '1',
                    fontSize: 22,
                    background: 'var(--t-surface)',
                    border: '1px solid var(--t-border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--t-surface)'; e.currentTarget.style.borderColor = 'var(--t-border)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {sticker}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Active sticker layers */}
      {stickerLayers.length > 0 && (
        <div style={{ padding: '0 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '4px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Stickers</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stickerLayers.map(layer => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  background: selectedLayerId === layer.id ? 'rgba(99,102,241,0.1)' : 'var(--t-surface)',
                  border: `1px solid ${selectedLayerId === layer.id ? '#6366f1' : 'var(--t-border)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 18 }}>{layer.content ?? '🖼️'}</span>
                <span style={{ flex: 1, fontSize: 11, color: 'var(--t-text)', fontWeight: 600 }}>
                  {layer.type === 'image' ? 'Image Overlay' : 'Sticker'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeStickerLayer(layer.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 2 }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
