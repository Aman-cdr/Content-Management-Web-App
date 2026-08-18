"use client";
/**
 * Clip.jsx
 * A draggable, resizable clip within a track lane.
 */

import { useRef, useCallback, useState } from 'react';
import useEditorStore from '../store/editorStore';

export default function Clip({ clip, track, pxPerSec, isSelected, onSelect, color }) {
  const updateClip = useEditorStore(s => s.updateClip);
  const removeClip = useEditorStore(s => s.removeClip);
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimLeft, setIsTrimLeft] = useState(false);
  const [isTrimRight, setIsTrimRight] = useState(false);
  const dragStartX = useRef(0);
  const originalStart = useRef(0);
  const originalDuration = useRef(0);

  const left = clip.start * pxPerSec;
  const width = Math.max(8, (clip.clipDuration ?? clip.duration ?? 0) * pxPerSec);

  // ── Drag move ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (track.locked) return;
    e.stopPropagation();
    onSelect();

    dragStartX.current = e.clientX;
    originalStart.current = clip.start;
    setIsDragging(true);

    const onMove = (ev) => {
      const dx = ev.clientX - dragStartX.current;
      const newStart = Math.max(0, originalStart.current + dx / pxPerSec);
      updateClip(track.id, clip.id, { start: newStart });
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [track, clip, pxPerSec, onSelect, updateClip]);

  // ── Trim left ─────────────────────────────────────────────────────────────
  const handleTrimLeftDown = useCallback((e) => {
    e.stopPropagation();
    if (track.locked) return;
    dragStartX.current = e.clientX;
    originalStart.current = clip.start;
    originalDuration.current = clip.clipDuration ?? clip.duration ?? 0;
    setIsTrimLeft(true);

    const onMove = (ev) => {
      const dx = ev.clientX - dragStartX.current;
      const dTime = dx / pxPerSec;
      const newStart = Math.max(0, originalStart.current + dTime);
      const newDuration = Math.max(0.2, originalDuration.current - dTime);
      updateClip(track.id, clip.id, { start: newStart, clipDuration: newDuration });
    };
    const onUp = () => {
      setIsTrimLeft(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [track, clip, pxPerSec, updateClip]);

  // ── Trim right ────────────────────────────────────────────────────────────
  const handleTrimRightDown = useCallback((e) => {
    e.stopPropagation();
    if (track.locked) return;
    dragStartX.current = e.clientX;
    originalDuration.current = clip.clipDuration ?? clip.duration ?? 0;
    setIsTrimRight(true);

    const onMove = (ev) => {
      const dx = ev.clientX - dragStartX.current;
      const newDuration = Math.max(0.2, originalDuration.current + dx / pxPerSec);
      updateClip(track.id, clip.id, { clipDuration: newDuration });
    };
    const onUp = () => {
      setIsTrimRight(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [track, clip, pxPerSec, updateClip]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    // Could open a context menu — for now just select
    onSelect();
  }, [onSelect]);

  const clipLabel = clip.label || clip.name || track.type;

  return (
    <div
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      title={clipLabel}
      style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: left,
        width: width,
        background: isSelected
          ? `linear-gradient(90deg, ${color}dd, ${color}99)`
          : `linear-gradient(90deg, ${color}88, ${color}55)`,
        border: `1.5px solid ${isSelected ? color : color + '44'}`,
        borderRadius: 6,
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: isSelected ? `0 0 0 1px ${color}, 0 2px 8px ${color}44` : 'none',
        transition: 'box-shadow 0.15s',
        userSelect: 'none',
        zIndex: isSelected ? 5 : 1,
        minWidth: 8,
      }}
    >
      {/* Left trim handle */}
      <div
        onMouseDown={handleTrimLeftDown}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          background: isTrimLeft ? 'rgba(255,255,255,0.25)' : 'transparent',
          borderRadius: '6px 0 0 6px',
          zIndex: 2,
        }}
      />

      {/* Label */}
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.85)',
        paddingLeft: 10,
        paddingRight: 10,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        pointerEvents: 'none',
      }}>
        {clipLabel}
      </span>

      {/* Duration badge */}
      {width > 60 && (
        <span style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.5)',
          paddingRight: 10,
          pointerEvents: 'none',
          fontFamily: 'monospace',
          flexShrink: 0,
        }}>
          {((clip.clipDuration ?? clip.duration ?? 0)).toFixed(1)}s
        </span>
      )}

      {/* Right trim handle */}
      <div
        onMouseDown={handleTrimRightDown}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          background: isTrimRight ? 'rgba(255,255,255,0.25)' : 'transparent',
          borderRadius: '0 6px 6px 0',
          zIndex: 2,
        }}
      />
    </div>
  );
}
