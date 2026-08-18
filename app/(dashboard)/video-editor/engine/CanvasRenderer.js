/**
 * CanvasRenderer.js
 * Multi-layer canvas compositing engine.
 * Composites: video frame → effects → overlays → text → stickers
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layers = []; // { id, type, draw(ctx, t), zIndex, visible, opacity, blendMode }
    this.videoEngine = null;
    this.effectsPipeline = null;
    this._rafId = null;
    this._isRendering = false;
    this._offscreen = null;
    this._offscreenCtx = null;
    this.width = canvas.width;
    this.height = canvas.height;
    this.backgroundColor = '#000000';
  }

  /**
   * Attach a VideoEngine instance as the base layer source
   */
  setVideoEngine(engine) {
    this.videoEngine = engine;
  }

  /**
   * Attach an EffectsPipeline for post-processing
   */
  setEffectsPipeline(pipeline) {
    this.effectsPipeline = pipeline;
  }

  /**
   * Resize canvas to given dimensions
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // Rebuild offscreen
    if (typeof OffscreenCanvas !== 'undefined') {
      this._offscreen = new OffscreenCanvas(width, height);
      this._offscreenCtx = this._offscreen.getContext('2d');
    }
  }

  /**
   * Add a renderable layer
   * layer: { id, type, draw(ctx, currentTime), zIndex, visible, opacity, blendMode }
   */
  addLayer(layer) {
    this.layers.push({ visible: true, opacity: 1, blendMode: 'source-over', ...layer });
    this.layers.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }

  removeLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
  }

  updateLayer(id, updates) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.layers[idx] = { ...this.layers[idx], ...updates };
    }
  }

  getLayer(id) {
    return this.layers.find(l => l.id === id);
  }

  clearLayers() {
    this.layers = [];
  }

  /**
   * Render a single frame — called per animation frame
   */
  renderFrame(currentTime) {
    const { ctx, width, height } = this;
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw base video frame
    if (this.videoEngine) {
      const video = this.videoEngine.getVideoElement();
      if (video && video.readyState >= 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        this._drawVideoFitted(ctx, video, width, height);
        ctx.restore();
      }
    }

    // Draw each layer in z-order
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;
      ctx.globalCompositeOperation = layer.blendMode ?? 'source-over';

      try {
        layer.draw(ctx, currentTime, width, height);
      } catch (e) {
        console.warn('Layer render error:', layer.id, e);
      }

      ctx.restore();
    }
  }

  /**
   * Draw video element scaled to fit canvas, preserving aspect ratio
   */
  _drawVideoFitted(ctx, video, canvasW, canvasH) {
    const vw = video.videoWidth || canvasW;
    const vh = video.videoHeight || canvasH;
    const ratio = Math.min(canvasW / vw, canvasH / vh);
    const drawW = vw * ratio;
    const drawH = vh * ratio;
    const offsetX = (canvasW - drawW) / 2;
    const offsetY = (canvasH - drawH) / 2;
    ctx.drawImage(video, offsetX, offsetY, drawW, drawH);
  }

  /**
   * Start the render loop using requestVideoFrameCallback if available,
   * otherwise fallback to requestAnimationFrame
   */
  startRenderLoop() {
    if (this._isRendering) return;
    this._isRendering = true;

    const video = this.videoEngine?.getVideoElement();

    if (video && typeof video.requestVideoFrameCallback === 'function') {
      const onFrame = (_, meta) => {
        if (!this._isRendering) return;
        this.renderFrame(meta.mediaTime);
        video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
    } else {
      const loop = () => {
        if (!this._isRendering) return;
        const t = this.videoEngine?.currentTime ?? 0;
        this.renderFrame(t);
        this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
    }
  }

  stopRenderLoop() {
    this._isRendering = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Capture current canvas as ImageData (for export pipeline)
   */
  captureFrame() {
    return this.ctx.getImageData(0, 0, this.width, this.height);
  }

  /**
   * Capture current canvas as Blob (PNG)
   */
  captureAsBlob(type = 'image/png', quality = 0.92) {
    return new Promise(resolve => this.canvas.toBlob(resolve, type, quality));
  }

  /**
   * Draw a text layer onto canvas
   */
  static drawText(ctx, layer, currentTime, canvasW, canvasH) {
    const {
      text, x, y, fontSize, fontFamily, color, fontWeight,
      textAlign, textShadow, stroke, strokeColor, strokeWidth,
      rotation, opacity, backgroundColor, padding,
    } = layer;

    ctx.save();
    ctx.translate(x ?? canvasW / 2, y ?? canvasH * 0.8);
    if (rotation) ctx.rotate((rotation * Math.PI) / 180);
    ctx.globalAlpha = opacity ?? 1;

    ctx.font = `${fontWeight ?? 'bold'} ${fontSize ?? 32}px ${fontFamily ?? 'Inter, sans-serif'}`;
    ctx.textAlign = textAlign ?? 'center';
    ctx.textBaseline = 'middle';

    // Background box
    if (backgroundColor) {
      const metrics = ctx.measureText(text);
      const pad = padding ?? 8;
      const boxW = metrics.width + pad * 2;
      const boxH = (fontSize ?? 32) + pad * 2;
      ctx.fillStyle = backgroundColor;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 6);
      ctx.fill();
    }

    // Shadow
    if (textShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Stroke
    if (stroke) {
      ctx.lineWidth = strokeWidth ?? 2;
      ctx.strokeStyle = strokeColor ?? '#000000';
      ctx.strokeText(text, 0, 0);
    }

    ctx.fillStyle = color ?? '#FFFFFF';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  destroy() {
    this.stopRenderLoop();
    this.layers = [];
    this.videoEngine = null;
    this.effectsPipeline = null;
  }
}

export default CanvasRenderer;
