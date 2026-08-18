"use client";
/**
 * SubtitlePanel.jsx
 * Complete subtitle editor: add, edit, import SRT/VTT, style.
 */

import { useState, useCallback, useRef } from 'react';
import useEditorStore from '../store/editorStore';

function parseSRT(text) {
  const blocks = text.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split('\n');
    if (lines.length < 3) return null;
    const timeLine = lines[1];
    const match = timeLine.match(/(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)/);
    if (!match) return null;
    const parseTime = (str) => {
      const [hms, ms] = str.replace(',', '.').split('.');
      const [h, m, s] = hms.split(':').map(Number);
      return h * 3600 + m * 60 + s + (Number(ms) || 0) / 1000;
    };
    return {
      id: `sub_${Date.now()}_${i}`,
      start: parseTime(match[1]),
      end: parseTime(match[2]),
      text: lines.slice(2).join('\n'),
    };
  }).filter(Boolean);
}

function parseVTT(text) {
  const lines = text.split('\n');
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const match = line.match(/(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)\s*-->\s*(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)/);
      if (match) {
        const parseTime = (str) => {
          const parts = str.split(':').map(Number);
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
          return parts[0] * 60 + parts[1];
        };
        const textLines = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i]);
          i++;
        }
        cues.push({
          id: `sub_${Date.now()}_${cues.length}`,
          start: parseTime(match[1]),
          end: parseTime(match[2]),
          text: textLines.join('\n'),
        });
      }
    }
    i++;
  }
  return cues;
}

export default function SubtitlePanel() {
  const subtitles = useEditorStore(s => s.subtitles);
  const addSubtitle = useEditorStore(s => s.addSubtitle);
  const removeSubtitle = useEditorStore(s => s.removeSubtitle);
  const updateSubtitle = useEditorStore(s => s.updateSubtitle);
  const setSubtitles = useEditorStore(s => s.setSubtitles);
  const currentTime = useEditorStore(s => s.currentTime);
  const duration = useEditorStore(s => s.duration);
  const fileInputRef = useRef(null);

  const [editingId, setEditingId] = useState(null);

  const addCue = useCallback(() => {
    addSubtitle({
      id: `sub_${Date.now()}`,
      start: currentTime,
      end: Math.min(currentTime + 3, duration || 30),
      text: 'New subtitle',
      style: { color: '#FFFFFF', fontSize: 22, background: 'rgba(0,0,0,0.5)' },
    });
  }, [addSubtitle, currentTime, duration]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      let cues = [];
      if (file.name.endsWith('.srt')) cues = parseSRT(text);
      else if (file.name.endsWith('.vtt')) cues = parseVTT(text);
      if (cues.length > 0) setSubtitles(cues);
    };
    reader.readAsText(file);
  }, [setSubtitles]);

  const exportSRT = useCallback(() => {
    const toSRTTime = (s) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.round((s % 1) * 1000);
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
    };

    const srt = subtitles
      .sort((a, b) => a.start - b.start)
      .map((c, i) => `${i + 1}\n${toSRTTime(c.start)} --> ${toSRTTime(c.end)}\n${c.text}`)
      .join('\n\n');

    const blob = new Blob([srt], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  }, [subtitles]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${m}:${sec.padStart(4, '0')}`;
  };

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Actions */}
      <div style={{ padding: '0 12px', display: 'flex', gap: 6 }}>
        <button onClick={addCue} style={{
          flex: 1, padding: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', borderRadius: 8, color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
        }}>
          + Add Subtitle
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{
          padding: '8px 12px', background: 'var(--t-surface)', border: '1px solid var(--t-border)',
          borderRadius: 8, color: 'var(--t-text)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
        }}>
          Import
        </button>
        {subtitles.length > 0 && (
          <button onClick={exportSRT} style={{
            padding: '8px 12px', background: 'var(--t-surface)', border: '1px solid var(--t-border)',
            borderRadius: 8, color: 'var(--t-text)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>
            Export
          </button>
        )}
        <input ref={fileInputRef} type="file" accept=".srt,.vtt,.ass" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Subtitle list */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {subtitles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t-text-muted)', fontSize: 12 }}>
            <p style={{ margin: '0 0 4px' }}>No subtitles yet.</p>
            <p style={{ margin: 0 }}>Click "Add Subtitle" or import an SRT/VTT file.</p>
          </div>
        )}
        {[...subtitles].sort((a, b) => a.start - b.start).map(cue => (
          <div
            key={cue.id}
            style={{
              padding: '8px 10px',
              background: editingId === cue.id ? 'rgba(99,102,241,0.08)' : 'var(--t-surface)',
              border: `1px solid ${editingId === cue.id ? '#6366f1' : 'var(--t-border)'}`,
              borderRadius: 10,
              cursor: 'pointer',
            }}
            onClick={() => setEditingId(editingId === cue.id ? null : cue.id)}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: editingId === cue.id ? 8 : 0 }}>
              <span style={{
                fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                color: '#6366f1', background: 'rgba(99,102,241,0.12)',
                padding: '1px 6px', borderRadius: 4, flexShrink: 0,
              }}>
                {formatTime(cue.start)} → {formatTime(cue.end)}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--t-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cue.text}
              </span>
              <button
                onClick={e => { e.stopPropagation(); removeSubtitle(cue.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 2, flexShrink: 0 }}
              >✕</button>
            </div>

            {/* Expanded edit */}
            {editingId === cue.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={e => e.stopPropagation()}>
                <textarea
                  value={cue.text}
                  onChange={e => updateSubtitle(cue.id, { text: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%', padding: '6px 8px', background: 'var(--t-bg)',
                    border: '1px solid var(--t-border)', borderRadius: 6, color: 'var(--t-text)',
                    fontSize: 12, resize: 'none', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--t-text-muted)', fontWeight: 700 }}>START (s)</span>
                    <input
                      type="number" step={0.1} min={0}
                      value={cue.start}
                      onChange={e => updateSubtitle(cue.id, { start: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 6px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: 6, color: 'var(--t-text)', fontSize: 12, outline: 'none' }}
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, color: 'var(--t-text-muted)', fontWeight: 700 }}>END (s)</span>
                    <input
                      type="number" step={0.1} min={0}
                      value={cue.end}
                      onChange={e => updateSubtitle(cue.id, { end: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 6px', background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: 6, color: 'var(--t-text)', fontSize: 12, outline: 'none' }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
