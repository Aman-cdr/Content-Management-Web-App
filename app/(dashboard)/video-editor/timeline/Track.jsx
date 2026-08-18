"use client";
/**
 * Track.jsx
 * A single timeline track row with label + clip lane.
 */

import { useCallback } from 'react';
import useEditorStore from '../store/editorStore';
import Clip from './Clip';

const TRACK_ICONS = {
  video: '🎬',
  audio: '🔊',
  music: '🎵',
  voice: '🎤',
  text: '💬',
  sticker: '✨',
  effect: '✦',
};

const TRACK_COLORS = {
  video: '#6366f1',
  audio: '#22c55e',
  music: '#f59e0b',
  voice: '#ec4899',
  text: '#3b82f6',
  sticker: '#a855f7',
  effect: '#14b8a6',
};

export default function Track({ track, labelWidth, totalWidth, pxPerSec, currentTime, duration, videoEngineRef }) {
  const updateTrack = useEditorStore(s => s.updateTrack);
  const selectedClipId = useEditorStore(s => s.selectedClipId);
  const setSelectedClip = useEditorStore(s => s.setSelectedClip);

  const color = TRACK_COLORS[track.type] ?? '#6366f1';
  const icon = TRACK_ICONS[track.type] ?? '●';

  const handleMute = useCallback(() => updateTrack(track.id, { muted: !track.muted }), [track, updateTrack]);
  const handleSolo = useCallback(() => updateTrack(track.id, { solo: !track.solo }), [track, updateTrack]);
  const handleLock = useCallback(() => updateTrack(track.id, { locked: !track.locked }), [track, updateTrack]);

  return (
    <div style={{
      display: 'flex',
      height: track.height ?? 56,
      borderBottom: '1px solid #1a1b23',
      background: track.solo ? 'rgba(99,102,241,0.04)' : 'transparent',
      opacity: track.muted ? 0.4 : 1,
      transition: 'opacity 0.15s',
    }}>
      {/* Track Label */}
      <div style={{
        width: labelWidth,
        minWidth: labelWidth,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 6,
        borderRight: '1px solid #1a1b23',
        background: '#0c0d11',
        position: 'sticky',
        left: 0,
        zIndex: 10,
      }}>
        <div style={{
          width: 3,
          height: '60%',
          borderRadius: 2,
          background: color,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#9ca3af',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {track.label}
        </span>

        {/* Mute / Solo / Lock buttons */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={handleMute}
            title={track.muted ? 'Unmute' : 'Mute'}
            style={{
              ...miniBtn,
              background: track.muted ? '#374151' : 'transparent',
              color: track.muted ? '#f59e0b' : '#4b5563',
            }}
          >M</button>
          <button
            onClick={handleSolo}
            title={track.solo ? 'Unsolo' : 'Solo'}
            style={{
              ...miniBtn,
              background: track.solo ? '#1d4ed8' : 'transparent',
              color: track.solo ? '#93c5fd' : '#4b5563',
            }}
          >S</button>
          <button
            onClick={handleLock}
            title={track.locked ? 'Unlock' : 'Lock'}
            style={{
              ...miniBtn,
              color: track.locked ? '#ef4444' : '#4b5563',
            }}
          >{track.locked ? '🔒' : '🔓'}</button>
        </div>
      </div>

      {/* Clip Lane */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          width: totalWidth,
          background: 'rgba(255,255,255,0.01)',
          cursor: track.locked ? 'not-allowed' : 'default',
        }}
      >
        {track.clips.map(clip => (
          <Clip
            key={clip.id}
            clip={clip}
            track={track}
            pxPerSec={pxPerSec}
            isSelected={selectedClipId === clip.id}
            onSelect={() => setSelectedClip(track.id, clip.id)}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}

const miniBtn = {
  width: 18,
  height: 18,
  borderRadius: 4,
  border: '1px solid #272733',
  cursor: 'pointer',
  fontSize: 9,
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.1s',
  padding: 0,
};
