import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "temporary_build_key",
  baseURL: "https://api.groq.com/openai/v1",
});

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
  const { videoUrl, platform, count = 5, maxDuration: userMaxDuration = 120 } = await req.json();

  // Fetch real video metadata so AI generates video-specific content
  const { title: videoTitle, author: channelName } = await fetchVideoMeta(videoUrl);

  // Use the user-chosen duration limit (clamped 30s–10min)
  const maxDuration = Math.max(30, Math.min(600, Number(userMaxDuration) || 120));
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

  const systemPrompt = `You are an expert short-form content strategist specializing in repurposing long YouTube videos into viral ${platformLabel} clips.

${videoContext}

Your task: Generate exactly ${count} short-form clip ideas directly based on the video's topic and title. Every title, description, hook, and hashtag MUST be specific to this exact video — not generic content.

CRITICAL DURATION RULE:
- Target duration: ${maxDuration} seconds per clip
- Minimum duration: ${minDuration} seconds — clips shorter than ${minDuration}s are NOT acceptable
- Maximum duration: ${maxDuration} seconds — clips longer than ${maxDuration}s CANNOT be uploaded
- Formula: timestampEnd - timestampStart must be between ${minDuration}s and ${maxDuration}s
- DO NOT generate short 30-60 second clips when the user selected a longer duration. Fill the full ${durationLabel}.

Output each clip as a single-line JSON object (NDJSON format). One JSON object per line, nothing else:
{"index":1,"title":"<hook-driven title ≤60 chars based on THIS video>","description":"<2-3 sentences about THIS video clip with hashtags at end, ≤280 chars>","timestampStart":"<e.g. 01:20>","timestampEnd":"<e.g. 04:20 — exactly ${maxDuration}s after start, like start=01:20 → end=${exampleEnd}>","hook":"<opening line for this specific clip, ≤100 chars>","hashtags":["<relevant tag>","<relevant tag>","<relevant tag>","<relevant tag>","<relevant tag>"],"clipType":"<tip|story|hook|transformation|tutorial|reaction>","durationSec":<integer between ${minDuration} and ${maxDuration}>}

Rules:
- ALL content must reference the actual video topic derived from the title
- Titles must be punchy hooks (question, shock, number, secret)
- EVERY clip must be between ${minDuration}s and ${maxDuration}s — shorter clips are rejected
- Timestamps must be spread across the full video — do NOT cluster them at the start
- Vary clipType across results
- Output ONLY JSON lines — no markdown, no explanation, no code blocks`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate ${count} short-form clip ideas for: "${videoTitle || videoUrl}" — Platform: ${platformLabel}. Each clip MUST be ${minDuration}–${maxDuration} seconds long. Do not generate clips shorter than ${minDuration} seconds.`,
      },
    ],
  });

  const encoder = new TextEncoder();
  let buffer = "";

  const readable = new ReadableStream({
    async start(controller) {
      // Send video metadata as first line so frontend can use it
      if (videoTitle) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ __meta: true, title: videoTitle, channel: channelName }) + "\n")
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
