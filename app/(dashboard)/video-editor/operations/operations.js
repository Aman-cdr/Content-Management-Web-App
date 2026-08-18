/**
 * Operations — TrimOperation, CropOperation, SplitOperation, SpeedOperation, TransformOperation
 * Video manipulation operations (non-destructive).
 */

// ── TrimOperation ─────────────────────────────────────────────────────────────
export const TrimOperation = {
  /**
   * Apply trim to a clip: sets in/out points
   * @param {Object} clip - The clip to trim
   * @param {number} inPoint - Start time in seconds (within source media)
   * @param {number} outPoint - End time in seconds (within source media)
   * @returns {Object} Updated clip
   */
  apply(clip, inPoint, outPoint) {
    if (inPoint >= outPoint) throw new Error('Trim: in-point must be before out-point');
    return {
      ...clip,
      trimIn: Math.max(0, inPoint),
      trimOut: outPoint,
      clipDuration: outPoint - inPoint,
    };
  },

  reset(clip) {
    return {
      ...clip,
      trimIn: 0,
      trimOut: clip.duration,
      clipDuration: clip.duration,
    };
  },
};

// ── CropOperation ─────────────────────────────────────────────────────────────
export const CropOperation = {
  PRESETS: {
    '16:9': { w: 16, h: 9 },
    '9:16': { w: 9, h: 16 },
    '1:1': { w: 1, h: 1 },
    '4:5': { w: 4, h: 5 },
    '4:3': { w: 4, h: 3 },
    '21:9': { w: 21, h: 9 },
    'free': null,
  },

  /**
   * Calculate crop rect for given aspect ratio on a canvas
   */
  getPresetRect(canvasW, canvasH, presetKey) {
    const preset = this.PRESETS[presetKey];
    if (!preset) return { x: 0, y: 0, width: canvasW, height: canvasH };

    const canvasRatio = canvasW / canvasH;
    const targetRatio = preset.w / preset.h;

    let w, h;
    if (canvasRatio > targetRatio) {
      h = canvasH;
      w = h * targetRatio;
    } else {
      w = canvasW;
      h = w / targetRatio;
    }

    return {
      x: (canvasW - w) / 2,
      y: (canvasH - h) / 2,
      width: w,
      height: h,
    };
  },

  /**
   * Apply crop rect to canvas context
   */
  applyToCanvas(ctx, cropRect, canvasW, canvasH) {
    if (!cropRect) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    ctx.clip();
  },
};

// ── SplitOperation ────────────────────────────────────────────────────────────
export const SplitOperation = {
  /**
   * Split a clip at a given time, returning two new clips
   */
  split(clip, splitTime) {
    const clipEnd = clip.start + (clip.clipDuration ?? clip.duration ?? 0);
    if (splitTime <= clip.start || splitTime >= clipEnd) {
      throw new Error('Split point is outside clip bounds');
    }

    const leftDuration = splitTime - clip.start;
    const rightDuration = clipEnd - splitTime;

    const left = {
      ...clip,
      id: clip.id + '_left',
      clipDuration: leftDuration,
      trimOut: (clip.trimIn ?? 0) + leftDuration,
    };

    const right = {
      ...clip,
      id: clip.id + '_right',
      start: splitTime,
      clipDuration: rightDuration,
      trimIn: (clip.trimIn ?? 0) + leftDuration,
    };

    return [left, right];
  },
};

// ── SpeedOperation ────────────────────────────────────────────────────────────
export const SpeedOperation = {
  MIN_RATE: 0.1,
  MAX_RATE: 10,

  /**
   * Apply speed multiplier to a clip
   */
  apply(clip, rate) {
    const clamped = Math.max(this.MIN_RATE, Math.min(this.MAX_RATE, rate));
    const originalDuration = clip.originalDuration ?? clip.clipDuration ?? clip.duration ?? 0;
    return {
      ...clip,
      playbackRate: clamped,
      originalDuration,
      clipDuration: originalDuration / clamped,
    };
  },

  /**
   * Reverse a clip's playback
   */
  reverse(clip) {
    return {
      ...clip,
      reversed: !clip.reversed,
    };
  },
};

// ── TransformOperation ────────────────────────────────────────────────────────
export const TransformOperation = {
  DEFAULT: {
    x: 0.5,       // Normalized center X (0..1)
    y: 0.5,       // Normalized center Y (0..1)
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,  // Degrees
    flipH: false,
    flipV: false,
    opacity: 1.0,
  },

  apply(layer, updates) {
    return { ...layer, transform: { ...(layer.transform ?? this.DEFAULT), ...updates } };
  },

  applyToCanvas(ctx, transform, canvasW, canvasH, drawFn) {
    const t = { ...this.DEFAULT, ...transform };
    ctx.save();
    ctx.translate(t.x * canvasW, t.y * canvasH);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.scale(
      t.flipH ? -t.scaleX : t.scaleX,
      t.flipV ? -t.scaleY : t.scaleY
    );
    ctx.globalAlpha = t.opacity;
    drawFn(ctx);
    ctx.restore();
  },
};
