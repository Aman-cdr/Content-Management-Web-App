import { YoutubeTranscript } from "youtube-transcript";

// Extracts an 11-char YouTube video ID from a URL, or passes through if it's
// already a bare ID.
function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(urlOrId) ? urlOrId : null;
}

function pad(n) {
  return String(Math.floor(n)).padStart(2, "0");
}

export function formatTimecode(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// Parses "mm:ss" or "hh:mm:ss" back into seconds.
export function parseTimecode(timecode) {
  if (!timecode) return 0;
  const parts = String(timecode).split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/**
 * Fetches a YouTube video's caption transcript and normalizes it to
 * second-based { text, start, end } segments. Returns null if the video has
 * no captions or the (unofficial) transcript endpoint is unavailable —
 * callers should fall back to title-only generation in that case.
 */
export async function fetchVideoTranscript(videoUrl) {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) return null;
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId);
    if (!raw || raw.length === 0) return null;
    return raw.map((seg) => ({
      text: seg.text.replace(/\s+/g, " ").trim(),
      start: seg.offset / 1000,
      end: (seg.offset + seg.duration) / 1000,
    }));
  } catch {
    return null;
  }
}

/**
 * Builds a compact "[mm:ss] text" transcript block for the LLM prompt,
 * capped so hour-plus videos still fit a reasonable context size.
 */
export function transcriptToTimedText(segments, maxChars = 18000) {
  let out = "";
  for (const seg of segments) {
    const line = `[${formatTimecode(seg.start)}] ${seg.text}\n`;
    if (out.length + line.length > maxChars) break;
    out += line;
  }
  return out.trim();
}

/** Concatenates the actual spoken text within a specific time range. */
export function sliceTranscript(segments, startSec, endSec) {
  return segments
    .filter((seg) => seg.end > startSec && seg.start < endSec)
    .map((seg) => seg.text)
    .join(" ")
    .trim();
}
