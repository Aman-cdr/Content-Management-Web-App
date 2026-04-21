import { Sparkles, TrendingUp, Users, Play, Clock } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { name: "Total Views", value: "2.4M", change: "+12%", icon: Play },
    { name: "Subscribers", value: "84.2K", change: "+5.4%", icon: Users },
    { name: "Avg. Watch Time", value: "4:12", change: "+2%", icon: Clock },
    { name: "Revenue", value: "$12.4K", change: "+18%", icon: TrendingUp },
  ];

  const aiSuggestions = [
    {
      title: "Content Gap: AI Tutorials",
      description: "Search volume for 'No-code AI' is up 40%. Your audience is asking for a tutorial.",
      action: "Draft Script",
      tag: "Opportunity"
    },
    {
      title: "Optimization: Best Posting Time",
      description: "Based on last 3 months, Sunday 4:00 PM UTC performs 25% better than your current slot.",
      action: "Reschedule",
      tag: "Growth"
    },
    {
      title: "Thumbnail Refinement",
      description: "Your recent video 'Next.js 16' has a high impression count but low CTR. Try a higher contrast thumbnail.",
      action: "Generate New",
      tag: "A/B Test"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold font-outfit mb-2">Welcome back, Alex</h2>
        <p className="text-neutral-400">Here's what's happening with your content today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-neutral-800">
                <stat.icon className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-emerald-400">{stat.change}</span>
            </div>
            <p className="text-sm text-neutral-400 mb-1">{stat.name}</p>
            <p className="text-2xl font-bold font-outfit">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* AI Suggestions Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold font-outfit">AI Insights & Actions</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {aiSuggestions.map((suggestion) => (
            <div key={suggestion.title} className="glass-panel p-6 flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 mb-3">{suggestion.tag}</span>
              <h4 className="font-bold mb-2">{suggestion.title}</h4>
              <p className="text-sm text-neutral-400 mb-6 flex-1">{suggestion.description}</p>
              <button className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm font-medium transition-colors">
                {suggestion.action}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity / Roadmap Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-bold mb-4 font-outfit">Upcoming Roadmap</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Video: State of React 2026</p>
                  <p className="text-xs text-neutral-500">Due in 3 days</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Production</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4 font-outfit">Platform Performance</h3>
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">YouTube</span>
                <span>85% Growth</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[85%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">TikTok</span>
                <span>42% Growth</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[42%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-neutral-400">Instagram</span>
                <span>12% Growth</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 w-[12%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
