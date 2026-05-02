import { checkAuth } from "@/lib/api-middleware";

const MOCK_TITLES = {
  default: [
    "How I Built a 6-Figure YouTube Channel in 12 Months",
    "The Creator's Secret Weapon — AI Tools That Actually Work",
    "Stop Making These 5 Content Mistakes (I Learned the Hard Way)",
  ],
  contextual: [
    "The Ultimate Guide to {topic} — Everything You Need to Know",
    "Why {topic} Is the Future of Content Creation",
    "{topic} Masterclass: From Zero to Pro in 30 Days",
  ],
};

const MOCK_DESCRIPTIONS = {
  default: [
    "In this video, I break down the exact strategies, tools, and workflows that helped me grow from zero to a full-time creator. No fluff — just actionable steps you can implement today.",
    "A deep-dive into the AI-powered tools reshaping how creators work. I tested 20+ apps so you don't have to — here are the 5 that actually save time and boost output.",
    "After 3 years of creating content, I've made every mistake in the book. Here are the 5 biggest lessons I learned and how you can avoid them from day one.",
  ],
  contextual: [
    "Everything you need to know about {topic}. This comprehensive guide covers strategy, execution, and real-world examples from top creators in the space.",
    "Why {topic} matters for modern creators and how to leverage it for growth. Packed with case studies and practical advice.",
    "A no-nonsense breakdown of {topic} — what works, what doesn't, and what's coming next. Based on data from 100+ creators.",
  ],
};

const MOCK_SCRIPTS = {
  default: [
    `HOOK (0:00 - 0:15)
"If you're still creating content the old way, you're leaving money on the table. In this video, I'll show you the exact system I use to produce 10x more content in half the time."

INTRO (0:15 - 1:00)
Welcome back to the channel. I'm [Your Name], and today we're diving deep into the creator workflow that changed everything for me. Whether you're just starting out or you've been at this for years, this system will level up your output.

MAIN POINT 1 — The Content Pipeline (1:00 - 4:00)
The biggest mistake creators make is treating each piece of content as a one-off. Instead, think of every idea as a content tree — one video becomes a thread, a newsletter, a short, and a carousel. I use a Notion database to track every branch.

MAIN POINT 2 — AI-Assisted Scripting (4:00 - 7:00)
I use AI to generate first drafts of scripts, descriptions, and titles. The key is giving it great prompts. I'll walk you through my exact prompt templates and how I refine the output to match my voice.

MAIN POINT 3 — Batching & Scheduling (7:00 - 9:00)
I film all my content on Mondays and Tuesdays. The rest of the week is editing, community, and strategy. Batching is the single biggest unlock for consistent posting.

CTA (9:00 - 9:30)
"If this was helpful, smash that subscribe button and drop a comment with your biggest content struggle. I read every single one. See you in the next video."`,
  ],
};

function fillContext(templates, topic) {
  if (!topic) return templates;
  return templates.map((t) => t.replace(/\{topic\}/g, topic));
}

export async function POST(request) {
  const authErr = await checkAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { type, prompt, isDefaultPrompt, titleContext, descContext } = body;

    // Simulate a small delay for realism
    await new Promise((r) => setTimeout(r, 600));

    if (type === "title") {
      const pool = isDefaultPrompt || !prompt ? MOCK_TITLES.default : fillContext(MOCK_TITLES.contextual, prompt);
      return Response.json({ success: true, suggestions: pool });
    }

    if (type === "description") {
      const context = titleContext || prompt || "";
      const pool = !context ? MOCK_DESCRIPTIONS.default : fillContext(MOCK_DESCRIPTIONS.contextual, context);
      return Response.json({ success: true, suggestions: pool });
    }

    if (type === "script") {
      return Response.json({ success: true, suggestions: MOCK_SCRIPTS.default });
    }

    return Response.json(
      { success: false, error: `Unknown generation type: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    return Response.json(
      { success: false, error: "Failed to generate content." },
      { status: 500 }
    );
  }
}
