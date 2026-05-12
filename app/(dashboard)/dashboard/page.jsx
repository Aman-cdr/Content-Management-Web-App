"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, TrendingUp, Users, Play, Clock, ChevronRight, Zap, Loader2, RefreshCw, AlertCircle, Wifi, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboardData } from "@/lib/use-dashboard-data";
import ScriptModal from "@/app/components/ScriptModal";
import RescheduleModal from "@/app/components/RescheduleModal";
import ThumbnailModal from "@/app/components/ThumbnailModal";


// Icon map – data from API uses string keys, we map to actual components
const ICON_MAP = {
  Play,
  Users,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
};

const STAT_COLORS = {
  "Total Views": { color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  "Subscribers": { color: "#8B5CF6", bg: "rgba(139,92,246,0.10)" },
  "Avg Watch Time": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
  "Revenue": { color: "#10B981", bg: "rgba(16,185,129,0.10)" }
};

// ---------- Skeleton Loaders ----------
function StatSkeleton() {
  return (
    <div className="glass-card bg-white p-6 relative overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-black/5" />
        <div className="w-14 h-6 rounded-lg bg-black/5" />
      </div>
      <div className="h-4 w-24 rounded bg-black/5 mb-2" />
      <div className="h-8 w-32 rounded bg-black/5" />
    </div>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="card bg-white p-6 flex flex-col border-none ring-1 ring-black/5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-16 h-4 rounded bg-black/5" />
        <div className="w-12 h-4 rounded bg-black/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-black/5 mb-2" />
      <div className="h-4 w-full rounded bg-black/5 mb-6" />
      <div className="mt-auto space-y-3">
        <div className="h-1 w-full rounded bg-black/5" />
        <div className="h-10 w-full rounded-xl bg-black/5" />
      </div>
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl">
          <div className="w-3 h-3 rounded-full bg-black/5" />
          <div className="flex-1">
            <div className="h-4 w-48 rounded bg-black/5 mb-2" />
            <div className="h-3 w-24 rounded bg-black/5" />
          </div>
          <div className="h-6 w-20 rounded-full bg-black/5" />
        </div>
      ))}
    </div>
  );
}

function PlatformSkeleton() {
  return (
    <div className="space-y-8 pt-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="flex justify-between mb-3">
            <div className="h-4 w-20 rounded bg-black/5" />
            <div className="h-4 w-24 rounded bg-black/5" />
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

// ---------- Error Banner ----------
function ErrorBanner({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 mb-6"
    >
      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-400 flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-semibold text-red-400 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </motion.div>
  );
}

// ---------- Live Indicator ----------
function LiveIndicator({ lastUpdated, error, onReconnect }) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="font-semibold">Sync Failed</span>
        <button onClick={onReconnect} className="ml-1 text-[#4F46E5] hover:underline font-bold">Reconnect</button>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-black/[0.04] shadow-sm">
        <div className="w-2 h-2 rounded-full bg-neutral-200 animate-pulse" />
        <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
      </div>
    );
  }

  const timeAgo = `Updated ${Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago`;

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-black/[0.04] shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span className="font-semibold text-[#4B5264]">4 platforms connected</span>
      <span className="text-neutral-400 ml-1">({timeAgo})</span>
    </div>
  );
}

// ==========================================================
//  DASHBOARD PAGE
// ==========================================================
export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data, loading, error, lastUpdated, refetch } = useDashboardData(60_000);
  
  const userName = session?.user?.name || "Creator";
  const firstName = userName.split(" ")[0];

  // Modal states
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  // Derive data from API response (with fallbacks)
  const stats = data?.stats || [];
  const aiSuggestions = data?.aiSuggestions || [];
  const roadmapItems = data?.roadmap || [];
  const platformPerformance = data?.platformPerformance || [];

  // Action handler for AI suggestion buttons
  const handleSuggestionAction = (action) => {
    switch (action) {
      case "Draft Script":
        setScriptModalOpen(true);
        break;
      case "Reschedule":
        setRescheduleModalOpen(true);
        break;
      case "Generate New":
        setThumbnailModalOpen(true);
        break;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-12"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div variants={item} className="flex-1">
            <h2 className="text-[36px] font-[800] tracking-tight mb-2 text-[#0A0A0F]">
              Welcome back, <span className="text-[#6366F1]">{firstName}</span>
            </h2>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] rounded-full border border-[#E5E7EB] shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <p className="text-[11px] font-[700] text-[#6B7280] uppercase tracking-wider">Strategy: Focus on YouTube Shorts this week</p>
              </div>
              <LiveIndicator lastUpdated={lastUpdated} error={error} onReconnect={refetch} />
            </div>
          </motion.div>
          <motion.button 
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/add-content")}
            className="px-6 py-3.5 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-[14px] text-[14px] font-[600] transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:brightness-110 flex items-center gap-2"
          >
            <PlusSquare className="w-5 h-5" />
            Create New Content
          </motion.button>
        </header>

        {/* Error State */}
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
            : stats.map((stat) => {
                const IconComp = ICON_MAP[stat.iconKey] || Play;
                const statColor = STAT_COLORS[stat.name] || STAT_COLORS["Total Views"];
                return (
                  <motion.div 
                    key={stat.name} 
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all"
                    style={{ borderTop: `4px solid ${statColor.color}` }}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                      <IconComp size={80} className="text-black" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="flex items-center justify-center"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', background: statColor.bg }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: statColor.color }} />
                      </div>
                      <span className="text-xs font-bold text-[#059669] bg-[rgba(5,150,105,0.08)] px-2 py-1 rounded-lg">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-[#4B5264] mb-1 font-medium">{stat.name}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-[28px] font-bold tracking-tight text-[#0A0A0F] leading-none">{stat.value}</p>
                    </div>
                    
                    {/* Predictive AI Insight */}
                    <div className="mt-4 pt-4 border-t border-black/[0.03] flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-50">
                        <Zap className="w-3 h-3 text-indigo-500" />
                      </div>
                      <p className="text-[10px] font-bold text-[#8A91A8] leading-tight">
                        <span className="text-indigo-600">AI:</span> Predicted +{Math.floor(Math.random() * 10) + 5}% next week
                      </p>
                    </div>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* AI Strategy Center */}
        <section className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-[24px] font-[800] text-[#0A0A0F] tracking-tight">AI Strategy Center</h3>
                <p className="text-[13px] text-[#6B7280] font-[400]">Real-time optimization based on your latest performance data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[10px] font-[700] text-[#4B5264] uppercase tracking-wider">AI Engine Active</span>
              </div>
              <button className="text-sm text-[#4F46E5] hover:text-[#4338CA] font-bold flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loading
              ? [1, 2, 3, 4].map((i) => <SuggestionSkeleton key={i} />)
              : aiSuggestions.map((suggestion) => {
                  const IconComp = ICON_MAP[suggestion.iconKey] || Sparkles;
                  const impactColor = suggestion.impact === "Critical" ? "text-red-600 bg-red-50" : suggestion.impact === "High" ? "text-orange-600 bg-orange-50" : "text-blue-600 bg-blue-50";
                  
                  return (
                    <motion.div 
                      key={suggestion.id} 
                      variants={item}
                      className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col relative overflow-hidden group hover:border-[#6366F1]/[0.3] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none -rotate-12 translate-x-4 -translate-y-4">
                        <IconComp size={100} className="text-[#6366F1]" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md ${impactColor}`}>
                          {suggestion.impact} Impact
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-[#8A91A8]">Confidence:</span>
                          <span className="text-[10px] font-black text-[#4B5264]">{suggestion.confidence}%</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-[17px] mb-2 text-[#111318] group-hover:text-[#4F46E5] transition-colors">{suggestion.title}</h4>
                      <p className="text-sm text-[#4B5264] mb-6 flex-1 leading-relaxed line-clamp-3">{suggestion.description}</p>
                      
                      <div className="mt-auto space-y-3">
                        <div className="h-[2px] w-full bg-[#F4F5F8] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${suggestion.confidence}%` }}
                            className="h-full bg-indigo-500 rounded-full"
                          />
                        </div>
                        <button
                          onClick={() => handleSuggestionAction(suggestion.action)}
                          className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all group"
                        >
                          <span className="flex items-center justify-center gap-2">
                            {suggestion.action}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
          </div>
        </section>

        {/* Recent Activity / Roadmap Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <motion.div variants={item} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[20px] font-[800] mb-8 text-[#0A0A0F]">Upcoming Roadmap</h3>
            {loading ? (
              <RoadmapSkeleton />
            ) : (
              <div className="relative pl-3 space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                {roadmapItems.slice(0, 4).map((roadmap, i) => {
                  const colorClass = roadmap.color || 'bg-indigo-500';
                  const textClass = colorClass.replace('bg-', 'text-').replace('-500', '-600');
                  return (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 4 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className={`absolute left-0 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${colorClass} border-2 border-white shadow-sm ring-4 ring-white z-10`}></div>
                    <div className="ml-8 md:ml-0 md:w-[calc(50%-1.5rem)] md:odd:text-right">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-black/[0.04] group-hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center justify-between md:hidden mb-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{roadmap.due}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textClass} bg-neutral-50`}>{roadmap.status}</span>
                        </div>
                        <p className="font-semibold text-[#111318]">{roadmap.title}</p>
                        <div className="hidden md:flex items-center justify-between md:justify-end md:group-odd:justify-start gap-2 mt-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${textClass} bg-neutral-50`}>{roadmap.status}</span>
                          <span className="text-xs text-[#8A91A8]">{roadmap.due}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            )}
            <button className="w-full mt-6 py-2 text-sm text-[#8A91A8] hover:text-[#4B5264] font-medium transition-colors">
              View Full Roadmap
            </button>
          </motion.div>

          <motion.div variants={item} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h3 className="text-[20px] font-[800] mb-8 text-[#0A0A0F]">Platform Performance</h3>
            {loading ? (
              <PlatformSkeleton />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Views", value: "2.4M", change: "+12%", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Subscribers", value: "84.2K", change: "+840", color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Engagement Rate", value: "6.8%", change: "+1.2%", color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Posts This Month", value: "12", change: "On Track", color: "text-amber-600", bg: "bg-amber-50" }
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#F9FAFB] border border-black/[0.04]">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-[#8A91A8]">{metric.label}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${metric.bg} ${metric.color}`}>
                        {metric.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#0A0A0F]">{metric.value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Modals */}
      <ScriptModal
        isOpen={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
      />
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
      />
      <ThumbnailModal
        isOpen={thumbnailModalOpen}
        onClose={() => setThumbnailModalOpen(false)}
      />
    </>
  );
}
