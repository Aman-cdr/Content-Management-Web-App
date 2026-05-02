// Mock AI script generation API
// Simulates an AI generating a video script based on a topic

import { checkAuth, checkRateLimit } from "@/lib/api-middleware";

const SAMPLE_SCRIPTS = [
  {
    title: "No-Code AI: Build Your First Agent in 10 Minutes",
    sections: [
      {
        heading: "Hook (0:00 – 0:15)",
        content:
          "\"What if I told you that you could build a fully functional AI agent — without writing a single line of code? Today I'm going to show you exactly how, and it only takes 10 minutes.\"",
      },
      {
        heading: "Intro (0:15 – 0:45)",
        content:
          "Quick channel intro. Mention that no-code AI search volume is up 40%. This is the perfect time to ride the wave.",
      },
      {
        heading: "Tool Walkthrough (0:45 – 5:00)",
        content:
          "Screen-share demo of building an AI agent using a no-code platform. Walk through the drag-and-drop interface, connecting data sources, and setting up prompts.",
      },
      {
        heading: "Results & Comparison (5:00 – 8:00)",
        content:
          "Show the agent in action. Compare output quality vs. a hand-coded version. Spoiler: it's surprisingly close.",
      },
      {
        heading: "CTA & Outro (8:00 – 10:00)",
        content:
          "Ask viewers to subscribe if they want more AI tutorials. Tease the next video about fine-tuning models with no code.",
      },
    ],
    estimatedLength: "10:00",
    tags: ["AI", "No-Code", "Tutorial", "Beginner"],
  },
  {
    title: "React Server Components: The Complete Mental Model",
    sections: [
      {
        heading: "Hook (0:00 – 0:20)",
        content:
          "\"Server components broke my brain — until I found THIS mental model. Let me save you 3 weeks of confusion.\"",
      },
      {
        heading: "The Problem (0:20 – 2:00)",
        content:
          "Explain the traditional client-rendering model. Show bundle sizes, waterfalls, and hydration jank.",
      },
      {
        heading: "The Mental Model (2:00 – 6:00)",
        content:
          "Introduce the 'Two Worlds' framework: Server World (data + HTML) vs. Client World (interactivity). Use animated diagrams.",
      },
      {
        heading: "Live Code Demo (6:00 – 12:00)",
        content:
          "Build a dashboard with mixed server and client components. Show how data flows, where state lives, and common pitfalls.",
      },
      {
        heading: "Wrap-up (12:00 – 14:00)",
        content:
          "Summarize the 3 key rules. Link to a cheat-sheet in the description.",
      },
    ],
    estimatedLength: "14:00",
    tags: ["React", "RSC", "Deep Dive", "Intermediate"],
  },
  {
    title: "I Replaced My Entire Workflow With AI — Here's What Happened",
    sections: [
      {
        heading: "Hook (0:00 – 0:15)",
        content:
          "\"For the last 30 days I let AI handle my editing, scripting, thumbnails, and scheduling. The results? Honestly shocking.\"",
      },
      {
        heading: "The Experiment Setup (0:15 – 2:00)",
        content:
          "Explain the rules: every task that CAN be automated WILL be. List the tools being used.",
      },
      {
        heading: "Week-by-Week Breakdown (2:00 – 8:00)",
        content:
          "Share metrics per week — output volume, quality ratings, audience retention. Include before/after comparisons.",
      },
      {
        heading: "The Verdict (8:00 – 11:00)",
        content:
          "What worked, what failed miserably, and what I'd keep. Honest take.",
      },
      {
        heading: "CTA (11:00 – 12:00)",
        content:
          "Poll: 'Would YOU let AI take over your workflow?' Subscribe & comment.",
      },
    ],
    estimatedLength: "12:00",
    tags: ["AI", "Productivity", "Experiment", "Vlog"],
  },
];

export async function POST(request) {
  // ── Auth guard ──
  const authError = await checkAuth(request);
  if (authError) return authError;

  // ── Rate limit guard ──
  const rateLimitError = checkRateLimit(request);
  if (rateLimitError) return rateLimitError;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.topic || body.topic.trim().length < 3) {
    return Response.json({ success: false, error: "Topic must be at least 3 characters" }, { status: 400 });
  }

  // Simulate AI generation delay
  await new Promise((r) => setTimeout(r, 1500));

  const topic = body.topic.trim();

  // Pick a random script from the samples
  const script = SAMPLE_SCRIPTS[Math.floor(Math.random() * SAMPLE_SCRIPTS.length)];

  return Response.json({
    success: true,
    script,
    generatedAt: new Date().toISOString(),
    model: "CreatorCMS AI v1.0 (mock)",
  });
}
