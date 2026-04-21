import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from "lucide-react";

export default function SchedulerPage() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const schedule = [
    { day: "Wed", time: "16:00", title: "Next.js 16 Tutorial", platform: "YouTube" },
    { day: "Fri", time: "10:00", title: "AI News Roundup", platform: "TikTok" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-outfit mb-2">Content Scheduler</h2>
          <p className="text-neutral-400">Automate your publishing across all platforms.</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 border border-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm font-medium">
            April 2026
          </div>
          <button className="p-2 border border-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-900/50">
            {days.map(day => (
              <div key={day} className="px-4 py-3 text-xs font-bold text-neutral-500 text-center uppercase border-r border-neutral-800 last:border-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 min-h-[600px]">
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 2; // Simple offset for demo
              const hasContent = schedule.find(s => s.day === days[i % 7] && i > 5 && i < 15);
              
              return (
                <div key={i} className="border-r border-b border-neutral-800 p-2 hover:bg-neutral-800/20 transition-colors last:border-r-0 relative group">
                  <span className={`text-xs ${dayNum > 0 && dayNum <= 30 ? "text-neutral-400" : "text-neutral-700"}`}>
                    {dayNum > 0 && dayNum <= 30 ? dayNum : ""}
                  </span>
                  
                  {hasContent && (
                    <div className="mt-2 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-medium line-clamp-2">
                      {hasContent.title}
                    </div>
                  )}

                  <button className="absolute bottom-2 right-2 p-1 rounded-md bg-neutral-800 text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-white transition-all">
                    <Clock className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations Side Panel */}
        <div className="space-y-6">
          <div className="card border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-4 text-purple-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">AI Recommendation</h3>
            </div>
            <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
              Your "Next.js 16" video is scheduled for Wednesday. AI analysis suggests <span className="text-purple-400 font-bold">moving it to Sunday 4:00 PM</span> to align with peak global engagement.
            </p>
            <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold transition-colors">
              Apply Optimization
            </button>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold mb-4 font-outfit">Platform Health</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  <Check className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">YouTube</p>
                  <p className="text-xs text-neutral-500">API Connected & Stable</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-500">
                  <AlertCircle className="w-3 h-3" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">Instagram</p>
                  <p className="text-xs text-neutral-500">Re-auth required in 2 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Check(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
