"use client";
/**
 * ExportPanel.jsx
 * Export dialog with format, resolution, quality, platform presets.
 * Uses FFmpeg.wasm for actual encoding.
 */

import { useState, useCallback, useRef } from 'react';
import useEditorStore from '../store/editorStore';

const RESOLUTIONS = [
  { id: '480p', label: '480p', width: 854, height: 480, note: '~10 MB / min' },
  { id: '720p', label: '720p HD', width: 1280, height: 720, note: '~25 MB / min' },
  { id: '1080p', label: '1080p Full HD', width: 1920, height: 1080, note: '~50 MB / min' },
  { id: '4k', label: '4K UHD', width: 3840, height: 2160, note: '~200 MB / min' },
];

const FORMATS = [
  { id: 'mp4', label: 'MP4 (H.264)', ext: 'mp4', icon: '🎬' },
  { id: 'webm', label: 'WebM (VP9)', ext: 'webm', icon: '🌐' },
  { id: 'mov', label: 'MOV', ext: 'mov', icon: '🍎' },
];

const PLATFORM_PRESETS = [
  { id: 'youtube', label: 'YouTube', icon: '📺', resolution: '1080p', format: 'mp4', fps: 30 },
  { id: 'instagram', label: 'Instagram Reels', icon: '📸', resolution: '1080p', format: 'mp4', fps: 30 },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', resolution: '1080p', format: 'mp4', fps: 60 },
  { id: 'twitter', label: 'X / Twitter', icon: '🐦', resolution: '720p', format: 'mp4', fps: 30 },
  { id: 'custom', label: 'Custom', icon: '⚙️', resolution: null, format: null, fps: null },
];

const QUALITY_PRESETS = [
  { id: 'draft', label: 'Draft', desc: 'Fast export, smaller file', crf: 35 },
  { id: 'standard', label: 'Standard', desc: 'Balanced quality & size', crf: 23 },
  { id: 'high', label: 'High Quality', desc: 'Best quality, larger file', crf: 18 },
];

export default function ExportPanel() {
  const exportSettings = useEditorStore(s => s.exportSettings);
  const setExportSettings = useEditorStore(s => s.setExportSettings);
  const mediaSrc = useEditorStore(s => s.mediaSrc);
  const duration = useEditorStore(s => s.duration);
  const mediaFile = useEditorStore(s => s.mediaFile);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState(null);
  const abortRef = useRef(false);

  const applyPlatformPreset = useCallback((preset) => {
    if (preset.resolution) setExportSettings({ resolution: preset.resolution, format: preset.format, fps: preset.fps, platform: preset.id });
    else setExportSettings({ platform: preset.id });
  }, [setExportSettings]);

  const startExport = useCallback(async () => {
    if (!mediaFile || !mediaSrc) {
      alert('Please upload a video first.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setExportDone(false);
    setExportError(null);
    abortRef.current = false;

    try {
      setProgressLabel('Loading FFmpeg engine...');
      setProgress(5);

      // Dynamically import FFmpeg to keep initial bundle light
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(5 + p * 90));
        setProgressLabel(`Encoding video... ${Math.round(p * 100)}%`);
      });
      ffmpeg.on('log', ({ message }) => {
        if (message.includes('time=')) {
          setProgressLabel(`Processing: ${message.split('time=')[1]?.split(' ')[0] ?? ''}`);
        }
      });

      // Load FFmpeg WASM (from CDN to avoid bundle bloat)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      if (abortRef.current) return;

      setProgressLabel('Loading video file...');
      setProgress(10);

      const inputExt = mediaFile.name.split('.').pop() || 'mp4';
      const inputName = `input.${inputExt}`;
      const res = RESOLUTIONS.find(r => r.id === exportSettings.resolution) ?? RESOLUTIONS[2];
      const fmt = FORMATS.find(f => f.id === exportSettings.format) ?? FORMATS[0];
      const outputName = `output.${fmt.ext}`;

      await ffmpeg.writeFile(inputName, await fetchFile(mediaFile));

      if (abortRef.current) return;
      setProgressLabel('Encoding...');

      const quality = exportSettings.quality;
      const crf = quality === 'draft' ? 35 : quality === 'high' ? 18 : 23;

      const args = [
        '-i', inputName,
        '-vf', `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`,
        '-c:v', fmt.id === 'webm' ? 'libvpx-vp9' : 'libx264',
        '-crf', String(crf),
        '-preset', quality === 'draft' ? 'ultrafast' : 'medium',
        '-c:a', fmt.id === 'webm' ? 'libvorbis' : 'aac',
        '-r', String(exportSettings.fps ?? 30),
        '-y',
        outputName,
      ];

      await ffmpeg.exec(args);

      if (abortRef.current) return;
      setProgressLabel('Finalizing...');
      setProgress(98);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: fmt.id === 'webm' ? 'video/webm' : 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `CreatorCMS_Export.${fmt.ext}`;
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      setProgressLabel('Export complete! ✅');
      setExportDone(true);
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [mediaFile, mediaSrc, exportSettings]);

  const cancelExport = () => {
    abortRef.current = true;
    setIsExporting(false);
    setProgress(0);
    setProgressLabel('');
  };

  const selectedRes = RESOLUTIONS.find(r => r.id === exportSettings.resolution) ?? RESOLUTIONS[2];
  const selectedFmt = FORMATS.find(f => f.id === exportSettings.format) ?? FORMATS[0];

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Platform presets */}
      <div style={{ padding: '0 12px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Preset</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PLATFORM_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPlatformPreset(preset)}
              style={{
                padding: '8px 4px',
                background: exportSettings.platform === preset.id ? 'rgba(99,102,241,0.12)' : 'var(--t-surface)',
                border: `1px solid ${exportSettings.platform === preset.id ? '#6366f1' : 'var(--t-border)'}`,
                borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                color: exportSettings.platform === preset.id ? '#6366f1' : 'var(--t-text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{preset.icon}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution */}
      <div style={{ padding: '0 12px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolution</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {RESOLUTIONS.map(res => (
            <label key={res.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: exportSettings.resolution === res.id ? 'rgba(99,102,241,0.08)' : 'var(--t-surface)',
              border: `1px solid ${exportSettings.resolution === res.id ? '#6366f1' : 'var(--t-border)'}`,
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <input type="radio" name="resolution" value={res.id} checked={exportSettings.resolution === res.id} onChange={() => setExportSettings({ resolution: res.id })} style={{ accentColor: '#6366f1' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text)' }}>{res.label}</span>
                <span style={{ fontSize: 10, color: 'var(--t-text-muted)', marginLeft: 8 }}>{res.width}×{res.height}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--t-text-muted)' }}>{res.note}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Format */}
      <div style={{ padding: '0 12px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Format</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => setExportSettings({ format: fmt.id })}
              style={{
                flex: 1, padding: '8px 4px',
                background: exportSettings.format === fmt.id ? 'rgba(99,102,241,0.12)' : 'var(--t-surface)',
                border: `1px solid ${exportSettings.format === fmt.id ? '#6366f1' : 'var(--t-border)'}`,
                borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                color: exportSettings.format === fmt.id ? '#6366f1' : 'var(--t-text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{fmt.icon}</span>
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      <div style={{ padding: '0 12px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t-text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {QUALITY_PRESETS.map(q => (
            <button
              key={q.id}
              onClick={() => setExportSettings({ quality: q.id })}
              style={{
                flex: 1, padding: '8px 6px',
                background: exportSettings.quality === q.id ? 'rgba(99,102,241,0.12)' : 'var(--t-surface)',
                border: `1px solid ${exportSettings.quality === q.id ? '#6366f1' : 'var(--t-border)'}`,
                borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                color: exportSettings.quality === q.id ? '#6366f1' : 'var(--t-text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.15s',
              }}
            >
              {q.label}
              <span style={{ fontSize: 9, color: 'var(--t-text-muted)', fontWeight: 400, textAlign: 'center' }}>{q.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FPS */}
      <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-text)', flex: 1 }}>Frame Rate</span>
        <select value={exportSettings.fps ?? 30} onChange={e => setExportSettings({ fps: Number(e.target.value) })} style={{ padding: '6px 10px', background: 'var(--t-surface)', border: '1px solid var(--t-border)', borderRadius: 8, color: 'var(--t-text)', fontSize: 12 }}>
          <option value={24}>24 fps (Cinematic)</option>
          <option value={30}>30 fps (Standard)</option>
          <option value={60}>60 fps (Smooth)</option>
        </select>
      </div>

      {/* Export summary */}
      <div style={{ padding: '0 12px' }}>
        <div style={{
          padding: '10px 12px',
          background: 'var(--t-surface)',
          border: '1px solid var(--t-border)',
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--t-text-muted)',
          lineHeight: 1.8,
        }}>
          <strong style={{ color: 'var(--t-text)', display: 'block', marginBottom: 4 }}>Export Summary</strong>
          {selectedRes.label} · {selectedFmt.label} · {exportSettings.quality} quality · {exportSettings.fps} fps
          {duration > 0 && <><br />Duration: {duration.toFixed(1)}s</>}
        </div>
      </div>

      {/* Progress */}
      {(isExporting || exportDone) && (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: exportDone ? '#22c55e' : 'var(--t-text)' }}>{progressLabel}</span>
            <span style={{ fontSize: 11, color: 'var(--t-text-muted)' }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--t-border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: exportDone ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {exportError && (
        <div style={{ padding: '0 12px' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 11, color: '#ef4444' }}>
            ⚠️ {exportError}
          </div>
        </div>
      )}

      {/* Export button */}
      <div style={{ padding: '0 12px' }}>
        {isExporting ? (
          <button onClick={cancelExport} style={{
            width: '100%', padding: '12px',
            background: '#374151', border: 'none', borderRadius: 10,
            color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}>
            ⏹ Cancel Export
          </button>
        ) : (
          <button onClick={startExport} style={{
            width: '100%', padding: '12px',
            background: exportDone ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 10,
            color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            transition: 'all 0.2s',
          }}>
            {exportDone ? '✅ Exported Successfully' : '⬇️ Export Video'}
          </button>
        )}
      </div>
    </div>
  );
}
