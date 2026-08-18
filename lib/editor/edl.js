// Pure, framework-free helpers for editing an edit-decision-list (EDL) — the
// ordered list of trimmed clips that make up a timeline. Kept dependency-free
// so they're trivial to unit test, matching the "pure helpers" style already
// used by lib/dashboard-buckets.js.

let nextKey = 1;

/** Client-only identity for React keys / drag targets — stripped before hitting the API. */
function withKey(clip) {
  return { _key: nextKey++, ...clip };
}

export function createClip(uploadId, start, end, speed = 1) {
  return withKey({ uploadId, start, end, speed });
}

export function clipDuration(clip) {
  return Math.max(0, (clip.end - clip.start) / (clip.speed || 1));
}

export function totalDuration(clips) {
  return clips.reduce((sum, clip) => sum + clipDuration(clip), 0);
}

/** Strips client-only fields before sending clips to the backend. */
export function toApiClips(clips) {
  return clips.map(({ uploadId, start, end, speed }) => ({ uploadId, start, end, speed }));
}

export function applyTrim(clips, index, { start, end }) {
  return clips.map((clip, i) => (i === index ? { ...clip, start, end } : clip));
}

export function applySpeed(clips, index, speed) {
  return clips.map((clip, i) => (i === index ? { ...clip, speed } : clip));
}

/** Splits one clip into two at a source-time offset (not a timeline offset). */
export function applySplit(clips, index, atSourceTime) {
  const clip = clips[index];
  if (!clip || atSourceTime <= clip.start || atSourceTime >= clip.end) return clips;

  const before = { ...clip, end: atSourceTime };
  const after = withKey({ uploadId: clip.uploadId, start: atSourceTime, end: clip.end, speed: clip.speed });

  return [...clips.slice(0, index), before, after, ...clips.slice(index + 1)];
}

/** Removes a clip and closes the gap — everything downstream shifts left, nothing to recompute manually. */
export function applyRippleDelete(clips, index) {
  return clips.filter((_, i) => i !== index);
}

export function applyReorder(clips, fromIndex, toIndex) {
  if (fromIndex === toIndex) return clips;
  const next = [...clips];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Maps a global timeline position (seconds since the start of the whole edit) to
 * "which clip index, and what source-time within that clip" — used to seek the
 * preview player and to figure out which caption cue is active.
 */
export function timeToClipOffset(clips, globalTime) {
  let elapsed = 0;
  for (let i = 0; i < clips.length; i++) {
    const duration = clipDuration(clips[i]);
    if (globalTime <= elapsed + duration || i === clips.length - 1) {
      const localTime = (globalTime - elapsed) * (clips[i].speed || 1);
      return { clipIndex: i, sourceTime: clips[i].start + Math.max(0, localTime) };
    }
    elapsed += duration;
  }
  return { clipIndex: 0, sourceTime: clips[0]?.start ?? 0 };
}

/** Maps a source-time position (as stored on a caption cue) to a global timeline position. */
export function sourceTimeToGlobalTime(clips, sourceTime) {
  let elapsed = 0;
  for (const clip of clips) {
    if (sourceTime >= clip.start && sourceTime <= clip.end) {
      return elapsed + (sourceTime - clip.start) / (clip.speed || 1);
    }
    elapsed += clipDuration(clip);
  }
  return elapsed;
}
