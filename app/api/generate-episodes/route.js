import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "temporary_build_key",
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  const { seriesName, seriesType, seriesDescription, count } = await req.json();
  const episodeCount = Math.min(Math.max(parseInt(count) || 10, 1), 30);

  console.log("🤖 [generate-episodes] API hit");
  console.log("   Series:", seriesName, "| Type:", seriesType, "| Count:", episodeCount);
  console.log("   GROQ_API_KEY present:", !!process.env.GROQ_API_KEY);
  console.log("   Key prefix:", process.env.GROQ_API_KEY?.slice(0, 10) + "...");

  const prompt = `You are a professional content strategist. Generate ${episodeCount} episode titles for a ${seriesType || "Course"} series called "${seriesName}"${seriesDescription ? `. Series description: ${seriesDescription}` : ""}.

Output ONLY a JSON array with no extra text. Each item must have exactly these fields:
- "ep": episode number (integer)
- "title": compelling episode title (string, max 80 chars)
- "duration": estimated duration like "18 min", "45 min", "< 60 sec" based on series type

Make titles specific, engaging, and progressively structured. For a course: start with intro, build complexity. For shorts: punchy hooks. For project series: milestone-based.

Return only valid JSON array, nothing else.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log("🚀 [generate-episodes] Calling Groq API with model: llama-3.3-70b-versatile");
        const completion = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          stream: false,
        });

        console.log("✅ [generate-episodes] Groq responded. Tokens used:", completion.usage?.total_tokens);
        const raw = completion.choices[0]?.message?.content?.trim() || "[]";
        const cleaned = raw.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

        let episodes;
        try {
          episodes = JSON.parse(cleaned);
        } catch {
          episodes = [];
        }

        // Stream episodes one by one with a small delay for the effect
        for (const ep of episodes) {
          const line = JSON.stringify(ep) + "\n";
          controller.enqueue(encoder.encode(line));
          // Small artificial stagger so frontend can animate each row
          await new Promise(r => setTimeout(r, 80));
        }
      } catch (err) {
        console.error("❌ [generate-episodes] Groq API error:", err.message);
        controller.enqueue(encoder.encode(JSON.stringify({ error: err.message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
