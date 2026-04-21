import { BarChart, LineChart, PieChart, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function AnalyticsPage() {
  const platformData = [
    { name: "YouTube", views: "1.2M", subChange: "+1.2K", color: "bg-red-500", icon: "YT" },
    { name: "TikTok", views: "850K", subChange: "+4.5K", color: "bg-purple-500", icon: "TT" },
    { name: "Instagram", views: "340K", subChange: "+800", color: "bg-pink-500", icon: "IG" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-outfit mb-2">Analytics</h2>
          <p className="text-neutral-400">Deep dive into your content performance across all platforms.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 12 Months</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {platformData.map((platform) => (
          <div key={platform.name} className="card relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${platform.color} opacity-5 blur-3xl -mr-8 -mt-8 transition-opacity group-hover:opacity-10`}></div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center font-bold text-xs`}>
                {platform.icon}
              </div>
              <div>
                <h4 className="font-bold">{platform.name}</h4>
                <p className="text-xs text-neutral-400">Total reach this month</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold font-outfit">{platform.views}</p>
                <div className="flex items-center gap-1 text-emerald-400 text-xs">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{platform.subChange} followers</span>
                </div>
              </div>
              <div className="h-12 w-24 flex items-end gap-1">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} className={`flex-1 ${platform.color} rounded-t-sm opacity-60`} style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Performance Insights */}
      <section className="glass-panel p-8 border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-purple-600/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-outfit">AI Performance Insights</h3>
            <p className="text-sm text-neutral-400">Derived from 12M cross-platform data points</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <p className="text-sm font-semibold mb-2">Audience Retention Spike</p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Your tutorials featuring <span className="text-blue-400">live coding</span> have 22% higher retention than slide-based ones. 
                Focus on more "build-in-public" style content for YouTube.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <p className="text-sm font-semibold mb-2">Cross-Platform Synergy</p>
              <p className="text-sm text-neutral-400 leading-relaxed">
                IG Reels drive <span className="text-pink-400">15% of your YouTube traffic</span>. Using the same hook on both platforms 
                could improve this conversion by 5-8%.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
            <div className="text-center p-6">
              <BarChart className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-sm text-neutral-500">Advanced Audience Sentiment Graph<br/>(Visual Placeholder)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
