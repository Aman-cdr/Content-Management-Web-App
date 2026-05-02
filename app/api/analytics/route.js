import { checkAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";

function jitter(base, pct = 5) {
  const factor = 1 + (Math.random() * 2 - 1) * (pct / 100);
  return base * factor;
}

export async function GET(request) {
  // ── Auth guard ──
  const authError = await checkAuth(request);
  if (authError) return authError;

  const session = await getServerSession(authOptions);
  const totalContent = await prisma.content.count({
    where: { userId: session.user.id },
  });

  // Simulate a tiny network delay
  await new Promise((r) => setTimeout(r, 300));

  const totalViews = Math.round(jitter(2_400_000, 3));
  const subscribers = Math.round(jitter(84_200, 2));
  const avgWatchTimeSec = Math.round(jitter(252, 4)); // 4m12s = 252s
  const revenue = Math.round(jitter(12_400, 5));

  const formatViews = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const formatRevenue = (n) => {
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n}`;
  };

  const data = {
    stats: [
      {
        name: "Total Views",
        value: formatViews(totalViews),
        rawValue: totalViews,
        change: "+12%",
        iconKey: "Play",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
      },
      {
        name: "Subscribers",
        value: formatViews(subscribers),
        rawValue: subscribers,
        change: "+5.4%",
        iconKey: "Users",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
      },
      {
        name: "Avg. Watch Time",
        value: formatTime(avgWatchTimeSec),
        rawValue: avgWatchTimeSec,
        change: "+2%",
        iconKey: "Clock",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
      },
      {
        name: "Revenue",
        value: formatRevenue(revenue),
        rawValue: revenue,
        change: "+18%",
        iconKey: "TrendingUp",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
      },
    ],
    platformPerformance: [
      { platform: "YouTube", growth: Math.round(jitter(85, 6)), color: "bg-red-500" },
      { platform: "TikTok", growth: Math.round(jitter(42, 8)), color: "bg-purple-500" },
      { platform: "Instagram", growth: Math.round(jitter(12, 15)), color: "bg-pink-500" },
    ],
    roadmap: [
      { title: "Video: State of React 2026", due: "Due in 3 days", status: "Production", color: "bg-blue-500" },
      { title: "Shorts: AI Workflow Hack", due: "Due tomorrow", status: "Editing", color: "bg-purple-500" },
      { title: "Post: Newsletter Edition #42", due: "Due in 5 days", status: "Brainstorming", color: "bg-amber-500" },
    ],
    aiSuggestions: [
      {
        id: "content-gap",
        title: "Content Gap: AI Tutorials",
        description: "Search volume for 'No-code AI' is up 40%. Your audience is asking for a tutorial. We've drafted a structure for you.",
        action: "Draft Script",
        tag: "High Priority",
        iconKey: "Zap",
        confidence: 94,
        impact: "High",
      },
      {
        id: "posting-time",
        title: "Schedule Optimization",
        description: "Your Sunday 4:00 PM slot is underperforming. Shifting to Tuesday 6:00 PM could boost reach by 22%.",
        action: "Reschedule",
        tag: "Optimization",
        iconKey: "Clock",
        confidence: 88,
        impact: "Medium",
      },
      {
        id: "thumbnail",
        title: "CTR Improvement",
        description: "Video 'Next.js 16' has high impressions but low CTR (2.1%). A higher-contrast thumbnail is recommended.",
        action: "Generate New",
        tag: "A/B Test",
        iconKey: "Sparkles",
        confidence: 91,
        impact: "High",
      },
      {
        id: "retention",
        title: "Audience Retention Alert",
        description: "Drop-off at 2:30 in your last video is higher than usual. Consider adding a hook or a pattern interrupt.",
        action: "Analyze Video",
        tag: "Retention",
        iconKey: "Users",
        confidence: 85,
        impact: "Critical",
      }
    ],
    lastUpdated: new Date().toISOString(),
    totalContent,
  };

  return Response.json(data);
}
