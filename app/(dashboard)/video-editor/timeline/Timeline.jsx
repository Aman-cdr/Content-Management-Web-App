"use client";
/**
 * Timeline.jsx
 * Multi-track NLE-style timeline with zoom, scroll, playhead, and snapping.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import useEditorStore from '../store/editorStore';
import Track from './Track';
import TimeRuler from './TimeRuler';
import { useTimelineInteractions } from './useTimelineInteractions';

export default function Timeline({ videoEngineRef }) {
  const tracks = useEditorStore(s => s.tracks);
  const duration = useEditorStore(s => s.duration);
  const currentTime = useEditorStore(s => s.currentTime);
  const timelineZoom = useEditorStore(s => s.timelineZoom);
  const timelineScroll = useEditorStore(s => s.timelineScroll);
  const setTimelineZoom = useEditorStore(s => s.setTimelineZoom);
  const setTimelineScroll = useEditorStore(s => s.setTimelineScroll);
  const setCurrentTime = useEditorStore(s => s.setCurrentTime);

  const scrollRef = useRef(null);
  const timelineBodyRef = useRef(null);
  const LABEL_W = 140; // px for track label column

  // px per second of video
  const PX_PER_SEC = Math.max(20, timelineZoom * 80);
  const totalWidth = Math.max((duration || 60) * PX_PER_SEC + 200, 800);

  // Sync scroll state with DOM
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = timelineScroll;
    }
  }, [timelineScroll]);

  const handleScroll = useCallback((e) => {
    setTimelineScroll(e.target.scrollLeft);
  }, [setTimelineScroll]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setTimelineZoom(timelineZoom + delta);
    }
  }, [timelineZoom, setTimelineZoom]);

  // Seek by clicking ruler area
  const handleRulerSeek = useCallback((timeSeconds) => {
    setCurrentTime(timeSeconds);
    if (videoEngineRef?.current) {
      videoEngineRef.current.seek(timeSeconds);
    }
  }, [setCurrentTime, videoEngineRef]);

  // Convert px offset to time
  const pxToTime = useCallback((px) => px / PX_PER_SEC, [PX_PER_SEC]);
  const timeToPx = useCallback((t) => t * PX_PER_SEC, [PX_PER_SEC]);

  // Playhead x position
  const playheadX = LABEL_W + timeToPx(currentTime) - timelineScroll;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div className="timeline-root" style={{
      background: '#0F1014',
      borderTop: '1px solid #272733',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 220,
      maxHeight: 340,
      position: 'relative',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      {/* Zoom controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 12px',
        borderBottom: '1px solid #1e1f27',
        background: '#0c0d11',
      }}>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>TIMELINE</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setTimelineZoom(timelineZoom - 0.2)}
          style={zoomBtnStyle}
          title="Zoom out"
        >−</button>
        <span style={{ color: '#6b7280', fontSize: 10, minWidth: 40, textAlign: 'center' }}>
          {(timelineZoom * 100).toFixed(0)}%
        </span>
        <button
          onClick={() => setTimelineZoom(timelineZoom + 0.2)}
          style={zoomBtnStyle}
          title="Zoom in"
        >+</button>
        <button
          onClick={() => setTimelineZoom(1.0)}
          style={{ ...zoomBtnStyle, marginLeft: 4 }}
          title="Reset zoom"
        >⊞</button>
      </div>

      {/* Scrollable timeline body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          flex: 1,
          position: 'relative',
        }}
      >
        <div ref={timelineBodyRef} style={{ width: LABEL_W + totalWidth, minWidth: '100%' }}>
          {/* Time Ruler */}
          <TimeRuler
            labelWidth={LABEL_W}
            totalWidth={totalWidth}
            duration={duration || 60}
            pxPerSec={PX_PER_SEC}
            scrollLeft={timelineScroll}
            onSeek={handleRulerSeek}
          />

          {/* Tracks */}
          <div style={{ position: 'relative' }}>
            {tracks.map(track => (
              <Track
                key={track.id}
                track={track}
                labelWidth={LABEL_W}
                totalWidth={totalWidth}
                pxPerSec={PX_PER_SEC}
                currentTime={currentTime}
                duration={duration || 60}
                videoEngineRef={videoEngineRef}
              />
            ))}
            {tracks.length === 0 && (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#4b5563',
                fontSize: 12,
                fontWeight: 600,
              }}>
                No tracks — upload a video to get started
              </div>
            )}
          </div>
        </div>

        {/* Playhead line — floating above all tracks */}
        {duration > 0 && playheadX >= LABEL_W && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: playheadX,
              bottom: 0,
              width: 2,
              background: '#ef4444',
              pointerEvents: 'none',
              zIndex: 30,
            }}
          >
            <div style={{
              width: 10,
              height: 10,
              background: '#ef4444',
              borderRadius: '50%',
              position: 'absolute',
              top: 0,
              left: -4,
              boxShadow: '0 0 6px rgba(239,68,68,0.6)',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

const zoomBtnStyle = {
  background: '#1e1f27',
  border: '1px solid #272733',
  color: '#9ca3af',
  width: 24,
  height: 24,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  lineHeight: 1,
};
