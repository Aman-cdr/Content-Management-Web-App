"use client";
/**
 * TimeRuler.jsx
 * Displays time ticks and handles seek on click.
 */

import { useCallback } from 'react';

export default function TimeRuler({ labelWidth, totalWidth, duration, pxPerSec, scrollLeft, onSeek }) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${ms}`;
  };

  // Adaptive tick intervals
  const getTickInterval = () => {
    if (pxPerSec >= 200) return 0.5;
    if (pxPerSec >= 80) return 1;
    if (pxPerSec >= 40) return 2;
    if (pxPerSec >= 20) return 5;
    if (pxPerSec >= 10) return 10;
    return 30;
  };

  const tickInterval = getTickInterval();
  const ticks = [];
  for (let t = 0; t <= duration + tickInterval; t += tickInterval) {
    const x = t * pxPerSec;
    ticks.push({ t, x });
  }

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollLeft;
    const adjustedX = clickX - labelWidth;
    if (adjustedX < 0) return;
    const time = adjustedX / pxPerSec;
    onSeek(Math.max(0, Math.min(duration, time)));
  }, [scrollLeft, labelWidth, pxPerSec, duration, onSeek]);

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        height: 28,
        background: '#0c0d11',
        borderBottom: '1px solid #1e1f27',
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        userSelect: 'none',
      }}
    >
      {/* Label spacer */}
      <div style={{
        width: labelWidth,
        minWidth: labelWidth,
        borderRight: '1px solid #1e1f27',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 10,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          TIME
        </span>
      </div>

      {/* Ruler ticks */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', width: totalWidth }}>
        {ticks.map(({ t, x }) => (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              width: 1,
              height: 8,
              background: '#374151',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 8,
              fontFamily: 'monospace',
              color: '#6b7280',
              paddingLeft: 3,
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              {formatTime(t)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
