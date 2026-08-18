/**
 * useTimelineInteractions.js
 * Custom hook for timeline keyboard shortcuts and interactions.
 */

import { useEffect, useCallback } from 'react';
import useEditorStore from '../store/editorStore';

export function useTimelineInteractions(videoEngineRef) {
  const {
    isPlaying, currentTime, duration,
    setCurrentTime, setIsPlaying,
    setTimelineZoom, timelineZoom,
    undo, redo, canUndo, canRedo,
    activeTool, setActiveTool,
  } = useEditorStore();

  const handleKeyDown = useCallback((e) => {
    // Ignore if focus is in an input
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || document.activeElement?.contentEditable === 'true') return;

    const engine = videoEngineRef?.current;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (isPlaying) {
          engine?.pause();
          setIsPlaying(false);
        } else {
          engine?.play();
          setIsPlaying(true);
        }
        break;

      case 'KeyJ': // Rewind
        e.preventDefault();
        engine?.setPlaybackRate(-1);
        break;

      case 'KeyK': // Pause
        e.preventDefault();
        engine?.pause();
        setIsPlaying(false);
        break;

      case 'KeyL': // Fast forward
        e.preventDefault();
        engine?.setPlaybackRate(2);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (engine) {
          const t = Math.max(0, currentTime - (e.shiftKey ? 1 : 1 / 30));
          engine.seek(t);
          setCurrentTime(t);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (engine) {
          const t = Math.min(duration, currentTime + (e.shiftKey ? 1 : 1 / 30));
          engine.seek(t);
          setCurrentTime(t);
        }
        break;

      case 'Home':
        e.preventDefault();
        engine?.seek(0);
        setCurrentTime(0);
        break;

      case 'End':
        e.preventDefault();
        engine?.seek(duration);
        setCurrentTime(duration);
        break;

      case 'Equal':
      case 'NumpadAdd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setTimelineZoom(timelineZoom + 0.2);
        }
        break;

      case 'Minus':
      case 'NumpadSubtract':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setTimelineZoom(timelineZoom - 0.2);
        }
        break;

      case 'KeyZ':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey && canRedo?.()) redo?.();
          else if (canUndo?.()) undo?.();
        }
        break;

      case 'KeyY':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (canRedo?.()) redo?.();
        }
        break;

      case 'KeyV': // Select tool
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setActiveTool('select');
        }
        break;

      case 'KeyC': // Crop tool
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setActiveTool('crop');
        }
        break;

      case 'KeyT': // Text tool
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setActiveTool('text');
        }
        break;

      case 'KeyB': // Blade/split tool
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setActiveTool('blade');
        }
        break;

      default:
        break;
    }
  }, [
    isPlaying, currentTime, duration, timelineZoom,
    setCurrentTime, setIsPlaying, setTimelineZoom,
    undo, redo, canUndo, canRedo, setActiveTool, videoEngineRef,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /**
   * Snap a time value to nearest clip edge or playhead
   */
  const snap = useCallback((time, snapThreshold = 0.05) => {
    // Could expand to check clip boundaries
    return time;
  }, []);

  return { snap };
}
