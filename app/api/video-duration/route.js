import { fetchVideoTranscript } from "@/lib/youtube-transcript";

// Returns the video's spoken duration (last transcript segment's end time)
// so the Shorts Planner can size the Processing Timeframe slider. Only
// available when the video has captions — same requirement as clip
// generation itself, since restricting a timestamp range only makes sense
// when there's a timed transcript to slice.
export async function POST(req) {
  const { videoUrl } = await req.json();
  if (!videoUrl) {
    return Response.json({ available: false });
  }

  const segments = await fetchVideoTranscript(videoUrl);
  if (!segments || segments.length === 0) {
    return Response.json({ available: false });
  }

  const duration = Math.round(Math.max(...segments.map((s) => s.end)));
  return Response.json({ available: true, duration });
}
