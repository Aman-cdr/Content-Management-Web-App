export const CONTENT_ITEMS = [
  { id: 1, title: "Next.js 16 Breaking Changes", platform: "YouTube", status: "Published", views: "45K", engagement: "8.2%", date: "2 days ago", color: "red", category: "Tutorial" },
  { id: 2, title: "Tailwind 4 Setup Guide", platform: "YouTube", status: "Draft", views: "-", engagement: "-", date: "Just now", color: "red", category: "Design" },
  { id: 3, title: "AI Agent Workflow", platform: "TikTok", status: "Scheduled", views: "-", engagement: "-", date: "In 4 hours", color: "purple", category: "AI" },
  { id: 4, title: "React 19 vs Next 16", platform: "YouTube", status: "Published", views: "12K", engagement: "5.4%", date: "1 week ago", color: "red", category: "Analysis" },
  { id: 5, title: "Creator Office Tour", platform: "Instagram", status: "Draft", views: "-", engagement: "-", date: "2 weeks ago", color: "pink", category: "Vlog" },
  { id: 6, title: "Building a CMS in 24h", platform: "YouTube", status: "Published", views: "128K", engagement: "12.1%", date: "3 weeks ago", color: "red", category: "Build" },
  { id: 7, title: "Understanding RSC", platform: "YouTube", status: "Published", views: "8.5K", engagement: "6.7%", date: "1 month ago", color: "red", category: "Tutorial" },
  { id: 8, title: "Day in the life: AI Dev", platform: "TikTok", status: "Published", views: "250K", engagement: "15.4%", date: "2 months ago", color: "purple", category: "Vlog" },
];

export const ROADMAP_ITEMS = [
  { id: 1, title: "AI SaaS Idea", status: "Brainstorming", tags: ["AI", "SaaS"], due: "Apr 25", priority: "High", progress: 0, checklist: [], notes: "", platforms: ["YouTube", "Twitter"], activity: [{ id: 1, text: "Created idea", date: "2 days ago" }] },
  { id: 2, title: "Q&A Session", status: "Brainstorming", tags: ["Community"], due: "Apr 28", priority: "Medium", progress: 20, checklist: [{ id: 1, text: "Collect questions", done: true }, { id: 2, text: "Draft answers", done: false }], notes: "Keep it under 10 mins.", platforms: ["YouTube"], activity: [{ id: 1, text: "Moved to Brainstorming", date: "1 day ago" }] },
  { id: 3, title: "Office Setup V2", status: "Brainstorming", tags: ["Vlog"], due: "May 2", priority: "Low", progress: 0, checklist: [], notes: "", platforms: ["YouTube", "Instagram"], activity: [{ id: 1, text: "Added to backlog", date: "1 week ago" }] },
  { id: 4, title: "Next.js 16 Deep Dive", status: "Scripting", tags: ["Tech"], due: "Apr 24", priority: "High", progress: 40, checklist: [{ id: 1, text: "Outline", done: true }, { id: 2, text: "First draft", done: false }], notes: "Highlight routing changes.", platforms: ["YouTube"], activity: [{ id: 1, text: "Moved to Scripting", date: "3 hours ago" }] },
  { id: 5, title: "Tailwind 4 vs 3", status: "Scripting", tags: ["Design"], due: "Apr 26", priority: "Medium", progress: 60, checklist: [{ id: 1, text: "Research features", done: true }, { id: 2, text: "Code examples", done: false }], notes: "", platforms: ["YouTube", "Twitter"], activity: [{ id: 1, text: "Checklist updated", date: "4 hours ago" }] },
  { id: 6, title: "State of React 2026", status: "Production", tags: ["Trends"], due: "Apr 30", priority: "Urgent", progress: 85, checklist: [{ id: 1, text: "Record A-roll", done: true }, { id: 2, text: "Record screen capture", done: true }, { id: 3, text: "Audio sync", done: false }], notes: "Use the new mic.", platforms: ["YouTube", "TikTok"], activity: [{ id: 1, text: "Moved to Production", date: "Yesterday" }] },
  { id: 7, title: "Editor Vlog #12", status: "Post-Production", tags: ["Behind the scenes"], due: "May 5", priority: "Low", progress: 95, checklist: [{ id: 1, text: "Color grade", done: true }, { id: 2, text: "Export", done: false }], notes: "", platforms: ["Instagram", "TikTok"], activity: [{ id: 1, text: "Moved to Post-Production", date: "Just now" }] },
];

export const COLUMNS = [
  { name: "Brainstorming", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
  { name: "Scripting", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  { name: "Production", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  { name: "Post-Production", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
];

export const MEDIA_ASSETS = [
  { id: 1, name: "b-roll-coffee.mp4", type: "video", size: "12.4 MB", tags: ["vlog", "lifestyle"], color: "blue" },
  { id: 2, name: "thumbnail-bg.png", type: "image", size: "1.2 MB", tags: ["design", "gradient"], color: "purple" },
  { id: 3, name: "intro-music.wav", type: "audio", size: "4.5 MB", tags: ["audio", "upbeat"], color: "amber" },
  { id: 4, name: "logo-transparent.png", type: "image", size: "0.4 MB", tags: ["brand"], color: "emerald" },
  { id: 5, name: "setup-tour-raw.mov", type: "video", size: "1.2 GB", tags: ["raw"], color: "rose" },
  { id: 6, name: "interview-clip.mp4", type: "video", size: "45.2 MB", tags: ["interview"], color: "blue" },
  { id: 7, name: "background-texture.jpg", type: "image", size: "2.1 MB", tags: ["assets"], color: "purple" },
  { id: 8, name: "outro-theme.mp3", type: "audio", size: "3.2 MB", tags: ["audio"], color: "amber" },
  { id: 9, name: "overlay-particles.mov", type: "video", size: "89.4 MB", tags: ["vfx"], color: "blue" },
  { id: 10, name: "hero-shot.png", type: "image", size: "5.6 MB", tags: ["thumbnail"], color: "purple" },
];

export const SERIES_LOOKUP = {
  "1": { name: "Next.js Masterclass", type: "Course", episodes: 12, completed: 4, gradient: "from-indigo-500 to-purple-600" },
  "2": { name: "Daily Tech News", type: "Shorts", episodes: 30, completed: 18, gradient: "from-red-500 to-orange-500" },
  "3": { name: "Build a CMS with AI", type: "Project", episodes: 5, completed: 1, gradient: "from-emerald-500 to-teal-600" },
};
