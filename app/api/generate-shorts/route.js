import OpenAI from "openai";
import { fetchVideoTranscript, transcriptToTimedText, sliceTranscript, parseTimecode, formatTimecode } from "@/lib/youtube-transcript";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "temporary_build_key",
  baseURL: "https://api.groq.com/openai/v1",
});

// Shared SEO rules for every prompt branch below — one place so title/description/
// hashtag guidance can't drift between the transcript-grounded and fallback paths.
// This is what actually drives reach: a keyword-less hook doesn't rank in Shorts/
// Reels search, and a keyword-only title doesn't get clicked — both matter.
const SEO_GUIDANCE = `SEO & DISCOVERABILITY RULES (YouTube Shorts + Instagram Reels — this is what drives view growth, not optional flavor):
- TITLE: Lead with the single most searchable keyword/topic from the clip (first 3-4 words — mobile UIs truncate after ~40-50 chars), fused with a curiosity/emotion hook (number, question, shock). A hook with no keyword doesn't get found in search; a keyword with no hook doesn't get clicked. Keep it 40-60 characters, max one emoji, no ALL CAPS spam.
- DESCRIPTION: Open with the primary keyword again (this is what shows before the "...more" cutoff), briefly state what happens in the clip, then end with a short call-to-action (e.g. "Watch till the end", "Follow for more"). Keep it tight — Shorts/Reels descriptions are skimmed, not read.
- HASHTAGS: Exactly 5, ordered broad → niche: (1) the platform tag itself ("Shorts" for YouTube, "Reels" for Instagram), (2) one broad category tag, (3-4) niche tags grounded in the actual clip content, (5) one trending/community tag if genuinely relevant. Mismatched or generic tags get clips suppressed by the algorithm, not boosted — every tag must actually match the clip.`;

// What actually determines WHICH moments get selected, not just how they're
// titled. Without this, a model will default to picking evenly-spaced chunks
// (one every N minutes) instead of the moments that actually make someone stop
// scrolling — which is what the "clips get cut from anywhere" complaint was.
// A function (not a constant) because `count` only exists inside the request
// handler, not at module scope.
function buildViralityGuidance(count) {
  return `VIRAL MOMENT SELECTION (this determines whether the clip gets watched at all — do this BEFORE picking any timestamp):
Scan the entire transcript for moments that match one or more of these high-retention signals:
- A surprising reveal, twist, or "you won't believe this" moment
- A strong emotional reaction (excitement, shock, frustration, triumph, fear, disgust)
- A specific number, stat, or result said out loud (e.g. a price, a score, a duration)
- A bold claim or controversial opinion that invites agreement or argument
- A clear payoff/climax — the exact moment a buildup resolves, for better or worse
- A joke, roast, or genuinely funny exchange
- A concrete, actionable tip stated in one or two sentences
- A cliffhanger or open question the audience would want answered
Rank every candidate moment you find by how strongly it matches these signals, then pick the ${count} STRONGEST ones — even if several land close together in the video. Do NOT default to mechanically even spacing (e.g. "one clip every N minutes") — that produces bland clips cut from wherever the math lands, not clips people actually watch. Spacing across the timeline is only a tie-breaker between equally strong candidates, never the primary reason to choose a timestamp.`;
}

// Fetch video title + description from YouTube oEmbed (no API key needed)
async function fetchVideoMeta(videoUrl) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { title: "", author: "" };
    const data = await res.json();
    return { title: data.title || "", author: data.author_name || "" };
  } catch {
    return { title: "", author: "" };
  }
}

export async function POST(req) {
  const {
    videoUrl,
    platform,
    count = 5,
    maxDuration: userMaxDuration = 120,
    // When present, this is a "regenerate this one existing clip" request —
    // ground the new title/hook/description in what's actually said at this
    // exact range instead of inventing a brand-new random clip.
    timestampStart,
    timestampEnd,
    // Processing Timeframe (seconds) — restricts bulk generation to only
    // scan this portion of the video's transcript, instead of the whole thing.
    rangeStart,
    rangeEnd,
  } = await req.json();

  // Fetch real video metadata so AI generates video-specific content
  const { title: videoTitle, author: channelName } = await fetchVideoMeta(videoUrl);

  // Ground every clip in what's actually said in the video, not just its title —
  // fetch the caption transcript once and either slice it (single-clip
  // regenerate) or hand the whole timed transcript to the model (bulk generate).
  const transcriptSegments = await fetchVideoTranscript(videoUrl);
  const transcriptAvailable = !!transcriptSegments;
  const isRegeneratingExisting = timestampStart != null && timestampEnd != null;

  // Processing Timeframe — restrict bulk generation to only the segments
  // inside [rangeStart, rangeEnd]. Falls back to the full transcript if the
  // range excludes all speech (e.g. a silent/music-only window), so a bad
  // range can't produce zero clips.
  const hasRange = rangeStart != null && rangeEnd != null && rangeEnd > rangeStart;
  const rangedSegments = hasRange && transcriptSegments
    ? transcriptSegments.filter((seg) => seg.end > rangeStart && seg.start < rangeEnd)
    : transcriptSegments;
  const rangeInEffect = hasRange && rangedSegments.length > 0;
  const rangeStartLabel = rangeInEffect ? formatTimecode(rangeStart) : null;
  const rangeEndLabel = rangeInEffect ? formatTimecode(rangeEnd) : null;

  // Use the user-chosen duration limit, clamped to the real YouTube Shorts /
  // Instagram Reels upload cap (180s) so a clip can't be generated longer
  // than what either platform will actually accept.
  const maxDuration = Math.max(30, Math.min(180, Number(userMaxDuration) || 120));
  const durationLabel = maxDuration % 60 === 0
    ? `${maxDuration / 60} minute${maxDuration / 60 > 1 ? "s" : ""}`
    : `${Math.floor(maxDuration / 60)}m ${maxDuration % 60}s`;
  const platformLabel =
    platform === "yt-shorts"
      ? `YouTube Shorts (max ${durationLabel})`
      : platform === "instagram"
      ? `Instagram Reels (max ${durationLabel})`
      : `YouTube Shorts / Instagram Reels (max ${durationLabel})`;

  const videoContext = videoTitle
    ? `The video is titled "${videoTitle}"${channelName ? ` by ${channelName}` : ""}.`
    : `Video URL: ${videoUrl}`;

  const minDuration = Math.round(maxDuration * 0.8); // clips must be at least 80% of chosen duration
  const exampleEnd = (() => {
    const total = maxDuration;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `00:${String(s).padStart(2,"0")}`;
  })();

  let systemPrompt;
  let userMessage;

  if (isRegeneratingExisting && transcriptAvailable) {
    // Single-clip regenerate, grounded in the exact existing timestamp range.
    const startSec = parseTimecode(timestampStart);
    const endSec = parseTimecode(timestampEnd);
    const segmentText = sliceTranscript(transcriptSegments, startSec, endSec);

    systemPrompt = `You are an expert short-form content strategist specializing in repurposing long YouTube videos into viral ${platformLabel} clips.

${videoContext}

Here is EXACTLY what is said between ${timestampStart} and ${timestampEnd} in this video (the transcript for this specific clip):
"""
${segmentText || "(no speech detected in this range — silence, music, or visual-only moment)"}
"""

Your task: write ONE clip idea for this exact range. First decide the title — it must directly reflect the specific words/moment/claim actually said in the transcript above, not the video's general topic. Only after you have that title, write the description to match and expand on it.

${SEO_GUIDANCE}

Output a single-line JSON object (nothing else):
{"index":1,"title":"<hook-driven title ≤60 chars, grounded in the transcript above, keyword-first per the SEO rules>","description":"<keyword-first sentence + what's actually said in this clip + a short CTA, hashtags at end, ≤280 chars>","timestampStart":"${timestampStart}","timestampEnd":"${timestampEnd}","hook":"<opening line quoting or closely paraphrasing the transcript, ≤100 chars>","hashtags":["<platform tag: Shorts or Reels>","<broad category tag>","<niche tag>","<niche tag>","<trending/community tag>"],"clipType":"<tip|story|hook|transformation|tutorial|reaction>","durationSec":${Math.max(1, Math.round(endSec - startSec))}}

Rules:
- Keep timestampStart/timestampEnd EXACTLY as given above — do not change them.
- Title, hook, and description MUST be grounded in the transcript text shown above — do not invent content that isn't there.
- Follow the SEO & Discoverability rules above exactly for the title, description, and hashtags.
- Output ONLY the JSON object — no markdown, no explanation, no code blocks.`;

    userMessage = `Regenerate the title/hook/description for the clip at ${timestampStart}–${timestampEnd}, grounded in the transcript shown.`;
  } else if (transcriptAvailable) {
    // Bulk generate — pick clips FROM the real transcript timeline (or just
    // the user-selected Processing Timeframe slice of it, when set).
    const timedText = transcriptToTimedText(rangedSegments);
    const rangeConstraint = rangeInEffect
      ? `\nPROCESSING TIMEFRAME RESTRICTION: Only pick clips between ${rangeStartLabel} and ${rangeEndLabel} of the video — every timestampStart and timestampEnd MUST fall within this range. Ignore any part of the video outside it.\n`
      : "";

    systemPrompt = `You are an expert short-form content strategist specializing in repurposing long YouTube videos into viral ${platformLabel} clips.

${videoContext}
${rangeConstraint}
Here is the video's timecoded transcript${rangeInEffect ? ` (only the ${rangeStartLabel}–${rangeEndLabel} portion, per the Processing Timeframe above)` : ""}:
"""
${timedText}
"""

${buildViralityGuidance(count)}

Your task: Generate exactly ${count} short-form clip ideas GROUNDED IN THE TRANSCRIPT ABOVE. For each clip:
1. Pick a timestamp range using the VIRAL MOMENT SELECTION criteria above — not just any moment that's merely on-topic.
2. Decide the title FIRST, directly from what's said in that exact range — not from the video's general topic.
3. Only after the title is decided, write the description to match and expand on it (2-3 sentences, hashtags at end).
4. Set timestampStart/timestampEnd to real timecodes that appear in (or are directly between) the transcript lines above — do not invent timestamps outside the transcript's actual coverage.

CRITICAL DURATION RULE:
- Target duration: ${maxDuration} seconds per clip
- Minimum duration: ${minDuration} seconds — clips shorter than ${minDuration}s are NOT acceptable
- Maximum duration: ${maxDuration} seconds — clips longer than ${maxDuration}s CANNOT be uploaded
- If the transcript doesn't offer an exact ${maxDuration}s boundary at a good moment, pick the closest real transcript timestamps that still satisfy ${minDuration}-${maxDuration}s.

${SEO_GUIDANCE}

Output each clip as a single-line JSON object (NDJSON format). One JSON object per line, nothing else:
{"index":1,"title":"<hook-driven title ≤60 chars, grounded in the transcript, keyword-first per the SEO rules>","description":"<keyword-first sentence + THIS specific transcript moment + a short CTA, hashtags at end, ≤280 chars>","timestampStart":"<real timecode from the transcript, e.g. 01:20>","timestampEnd":"<real timecode from the transcript, e.g. ${exampleEnd}>","hook":"<opening line quoting or closely paraphrasing the transcript, ≤100 chars>","hashtags":["<platform tag: Shorts or Reels>","<broad category tag>","<niche tag>","<niche tag>","<trending/community tag>"],"clipType":"<tip|story|hook|transformation|tutorial|reaction>","durationSec":<integer between ${minDuration} and ${maxDuration}>}

Rules:
- ALL titles/hooks/descriptions MUST be grounded in words actually said in the transcript at that timestamp — do not invent generic clickbait unrelated to the transcript content.
- EVERY clip must be between ${minDuration}s and ${maxDuration}s — shorter clips are rejected
- Choose clips by viral potential (per the criteria above) first — spacing them across the timeline is a tie-breaker, not the goal
- Vary clipType across results
- Follow the SEO & Discoverability rules above exactly for every title, description, and hashtag set${rangeInEffect ? `\n- Every timestampStart/timestampEnd MUST fall between ${rangeStartLabel} and ${rangeEndLabel} — clips outside the Processing Timeframe are rejected` : ""}
- Output ONLY JSON lines — no markdown, no explanation, no code blocks`;

    userMessage = `Generate ${count} short-form clip ideas for: "${videoTitle || videoUrl}" — Platform: ${platformLabel}. Each clip MUST be ${minDuration}–${maxDuration} seconds long, grounded in the transcript above. Do not generate clips shorter than ${minDuration} seconds.${rangeInEffect ? ` Only use the ${rangeStartLabel}–${rangeEndLabel} portion of the video.` : ""}`;
  } else {
    // No transcript available (no captions, or the unofficial endpoint failed) —
    // fall back to the previous title-only best-effort behavior.
    systemPrompt = `You are an expert short-form content strategist specializing in repurposing long YouTube videos into viral ${platformLabel} clips.

${videoContext}

No transcript/captions are available for this video, so base your suggestions on its title alone (best-effort — less precise than transcript-grounded suggestions).

Your task: Generate exactly ${count} short-form clip ideas directly based on the video's topic and title. Every title, description, hook, and hashtag MUST be specific to this exact video — not generic content.

CRITICAL DURATION RULE:
- Target duration: ${maxDuration} seconds per clip
- Minimum duration: ${minDuration} seconds — clips shorter than ${minDuration}s are NOT acceptable
- Maximum duration: ${maxDuration} seconds — clips longer than ${maxDuration}s CANNOT be uploaded
- Formula: timestampEnd - timestampStart must be between ${minDuration}s and ${maxDuration}s
- DO NOT generate short 30-60 second clips when the user selected a longer duration. Fill the full ${durationLabel}.

${SEO_GUIDANCE}

Output each clip as a single-line JSON object (NDJSON format). One JSON object per line, nothing else:
{"index":1,"title":"<hook-driven title ≤60 chars based on THIS video, keyword-first per the SEO rules>","description":"<keyword-first sentence about THIS video clip + a short CTA, hashtags at end, ≤280 chars>","timestampStart":"<e.g. 01:20>","timestampEnd":"<e.g. 04:20 — exactly ${maxDuration}s after start, like start=01:20 → end=${exampleEnd}>","hook":"<opening line for this specific clip, ≤100 chars>","hashtags":["<platform tag: Shorts or Reels>","<broad category tag>","<niche tag>","<niche tag>","<trending/community tag>"],"clipType":"<tip|story|hook|transformation|tutorial|reaction>","durationSec":<integer between ${minDuration} and ${maxDuration}>}

Rules:
- ALL content must reference the actual video topic derived from the title
- Titles must be punchy hooks (question, shock, number, secret) AND keyword-first, per the SEO rules
- EVERY clip must be between ${minDuration}s and ${maxDuration}s — shorter clips are rejected
- Timestamps must be spread across the full video — do not cluster them at the start
- Vary clipType across results
- Follow the SEO & Discoverability rules above exactly for every title, description, and hashtag set
- Output ONLY JSON lines — no markdown, no explanation, no code blocks`;

    userMessage = `Generate ${count} short-form clip ideas for: "${videoTitle || videoUrl}" — Platform: ${platformLabel}. Each clip MUST be ${minDuration}–${maxDuration} seconds long. Do not generate clips shorter than ${minDuration} seconds.`;
  }

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
  } catch (err) {
    // Surface the real failure (rate limit, invalid/missing key, prompt too
    // long for the model's context, network error) instead of an opaque 500 —
    // this is what the frontend shows the user.
    const message = err?.error?.message || err?.message || "Failed to reach the AI provider";
    console.error("[generate-shorts] Groq request failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: err?.status && err.status >= 400 && err.status < 600 ? err.status : 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let buffer = "";

  const readable = new ReadableStream({
    async start(controller) {
      // Send video metadata as first line so frontend can use it
      if (videoTitle) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ __meta: true, title: videoTitle, channel: channelName, transcriptAvailable }) + "\n")
        );
      }

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content || "";
        buffer += delta;

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("```")) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.index) {
              controller.enqueue(encoder.encode(JSON.stringify({ ...parsed, platformLimit: maxDuration }) + "\n"));
            }
          } catch {
            // Try to extract JSON object from the line if AI wrapped it in extra text
            const jsonMatch = trimmed.match(/\{.*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.index) {
                  controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
                }
              } catch {}
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.index) {
            controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
          }
        } catch {
          const jsonMatch = trimmed.match(/\{.*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.index) {
                controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
              }
            } catch {}
          }
        }
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
