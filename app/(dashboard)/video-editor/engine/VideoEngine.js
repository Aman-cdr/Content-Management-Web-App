/**
 * VideoEngine.js
 * Core video processing engine using WebCodecs API with HTML5 Video fallback.
 * Handles decode, seek, frame extraction, and playback coordination.
 */

export class VideoEngine {
  constructor() {
    this.videoElement = null;
    this.file = null;
    this.metadata = null;
    this.onFrameCallback = null;
    this.onTimeUpdateCallback = null;
    this.onEndedCallback = null;
    this.onLoadedCallback = null;
    this._rafId = null;
    this._isPlaying = false;
    this._playbackRate = 1.0;
    this._volume = 1.0;
    this._muted = false;
    this.thumbnailCache = new Map();
    this.useWebCodecs = typeof VideoDecoder !== 'undefined';
  }

  /**
   * Initialize with a media File object
   */
  async load(file) {
    this.file = file;

    // Create an offscreen video element for playback + metadata
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.playsInline = true;
      this.videoElement.crossOrigin = 'anonymous';
      this._bindVideoEvents();
    }

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.videoElement.src = url;
      this.videoElement.load();

      this.videoElement.onloadedmetadata = () => {
        this.metadata = {
          duration: this.videoElement.duration,
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight,
          aspectRatio: this.videoElement.videoWidth / this.videoElement.videoHeight,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fps: 30, // Default; real fps requires demux
        };
        if (this.onLoadedCallback) this.onLoadedCallback(this.metadata);
        resolve(this.metadata);
      };

      this.videoElement.onerror = (e) => reject(new Error('Video load failed: ' + e.message));
    });
  }

  /**
   * Attach the engine's video element to a DOM container for rendering
   */
  attachTo(containerElement) {
    if (this.videoElement && containerElement) {
      this.videoElement.style.width = '100%';
      this.videoElement.style.height = '100%';
      this.videoElement.style.objectFit = 'contain';
      containerElement.appendChild(this.videoElement);
    }
  }

  /**
   * Detach video element from DOM
   */
  detach() {
    if (this.videoElement && this.videoElement.parentElement) {
      this.videoElement.parentElement.removeChild(this.videoElement);
    }
  }

  _bindVideoEvents() {
    this.videoElement.ontimeupdate = () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.videoElement.currentTime);
      }
    };
    this.videoElement.onended = () => {
      this._isPlaying = false;
      if (this.onEndedCallback) this.onEndedCallback();
    };
    this.videoElement.onplay = () => { this._isPlaying = true; };
    this.videoElement.onpause = () => { this._isPlaying = false; };
  }

  get currentTime() {
    return this.videoElement?.currentTime ?? 0;
  }

  get duration() {
    return this.videoElement?.duration ?? 0;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  async play() {
    if (!this.videoElement) return;
    try {
      await this.videoElement.play();
      this._isPlaying = true;
    } catch (e) {
      console.warn('VideoEngine play failed:', e);
    }
  }

  pause() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    this._isPlaying = false;
  }

  togglePlay() {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(timeSeconds) {
    if (!this.videoElement) return;
    const clamped = Math.max(0, Math.min(timeSeconds, this.duration));
    this.videoElement.currentTime = clamped;
  }

  setPlaybackRate(rate) {
    this._playbackRate = rate;
    if (this.videoElement) this.videoElement.playbackRate = rate;
  }

  setVolume(vol) {
    this._volume = vol;
    if (this.videoElement) this.videoElement.volume = Math.max(0, Math.min(1, vol));
  }

  mute(val) {
    this._muted = val;
    if (this.videoElement) this.videoElement.muted = val;
  }

  /**
   * Extract a thumbnail ImageBitmap at a given timestamp
   */
  async getThumbnail(timeSeconds, width = 160, height = 90) {
    const key = `${timeSeconds.toFixed(2)}_${width}x${height}`;
    if (this.thumbnailCache.has(key)) return this.thumbnailCache.get(key);

    return new Promise((resolve) => {
      if (!this.videoElement) return resolve(null);

      const offscreenVideo = document.createElement('video');
      offscreenVideo.src = this.videoElement.src;
      offscreenVideo.muted = true;
      offscreenVideo.playsInline = true;

      offscreenVideo.onseeked = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(offscreenVideo, 0, 0, width, height);
          const bitmap = await createImageBitmap(canvas);
          this.thumbnailCache.set(key, bitmap);
          resolve(bitmap);
        } catch {
          resolve(null);
        }
      };

      offscreenVideo.onerror = () => resolve(null);
      offscreenVideo.currentTime = timeSeconds;
    });
  }

  /**
   * Generate thumbnail strip for timeline display
   */
  async generateThumbnailStrip(count = 10) {
    if (!this.metadata) return [];
    const interval = this.metadata.duration / count;
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.getThumbnail(i * interval));
    }
    return Promise.all(promises);
  }

  /**
   * Get the video element for direct canvas draw
   */
  getVideoElement() {
    return this.videoElement;
  }

  /**
   * Apply trim: set in/out points without destroying original
   */
  setTrimPoints(inPoint, outPoint) {
    this._trimIn = inPoint;
    this._trimOut = outPoint;
    if (this.videoElement && inPoint != null) {
      this.videoElement.currentTime = inPoint;
    }
  }

  getTrimPoints() {
    return {
      in: this._trimIn ?? 0,
      out: this._trimOut ?? this.duration,
    };
  }

  /**
   * Reverse playback by stepping backward manually
   */
  startReverse() {
    if (!this.videoElement) return;
    this.videoElement.pause();
    this._isPlaying = true;

    const step = () => {
      if (!this._isPlaying) return;
      const newTime = this.videoElement.currentTime - (1 / 30);
      if (newTime <= 0) {
        this.videoElement.currentTime = 0;
        this._isPlaying = false;
        return;
      }
      this.videoElement.currentTime = newTime;
      this._rafId = requestAnimationFrame(step);
    };
    this._rafId = requestAnimationFrame(step);
  }

  stopReverse() {
    this._isPlaying = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.pause();
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.videoElement) {
      const src = this.videoElement.src;
      this.videoElement.src = '';
      if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      this.detach();
    }
    this.thumbnailCache.clear();
    this.videoElement = null;
    this.file = null;
    this.metadata = null;
  }

  // Event registration
  onFrame(cb) { this.onFrameCallback = cb; }
  onTimeUpdate(cb) { this.onTimeUpdateCallback = cb; }
  onEnded(cb) { this.onEndedCallback = cb; }
  onLoaded(cb) { this.onLoadedCallback = cb; }
}

export default VideoEngine;
