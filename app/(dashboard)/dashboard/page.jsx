"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import {
  Sparkles, TrendingUp, Users, Play, Clock, Zap, Loader2, RefreshCw, AlertCircle,
  PlusSquare, Image as ImageIcon,
  ListTodo, UploadCloud, Lightbulb, FileEdit, CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useDashboardData } from "@/lib/use-dashboard-data";
import httpClient from "@/lib/axios-instance";
import { ENDPOINTS } from "@/config/endpoints";
import { useContent } from "@/context/ContentContext";
import DashboardWidget from "@/app/components/dashboard/DashboardWidget";
import GoalsWidget from "@/app/components/dashboard/GoalsWidget";
import RevenueWidget from "@/app/components/dashboard/RevenueWidget";
import PlatformStatusWidget from "@/app/components/dashboard/PlatformStatusWidget";
import RecentActivityWidget from "@/app/components/dashboard/RecentActivityWidget";
import {
  getTodaysTasks, getIdeasWaiting, getScriptsPending, getThumbnailsPending,
  getPublishedThisMonth, getUpcomingJobs,
} from "@/lib/dashboard-buckets";

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
  "Total Videos": { color: "#F59E0B", bg: "rgba(245,158,11,0.10)" },
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

function WidgetSkeleton() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 animate-pulse h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black/5" />
          <div className="h-3 w-20 rounded bg-black/5" />
        </div>
        <div className="h-5 w-6 rounded bg-black/5" />
      </div>
      <div className="h-3 w-3/4 rounded bg-black/5 mb-2" />
      <div className="h-3 w-1/2 rounded bg-black/5" />
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
function LiveIndicator({ lastUpdated, error, connectedCount = 0, onReconnect }) {
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
      <span className="font-semibold text-[#4B5264]">{connectedCount} {connectedCount === 1 ? 'platform' : 'platforms'} connected</span>
      <span className="text-neutral-400 ml-1">({timeAgo})</span>
    </div>
  );
}

// ==========================================================
//  DASHBOARD PAGE
// ==========================================================

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, loading, error, lastUpdated, refetch } = useDashboardData(60_000);
  const { contents, isLoading: contentsLoading } = useContent();

  const userName = user ? `${user.firstName} ${user.lastName}` : "Creator";
  const firstName = user?.firstName || userName.split(" ")[0];

  // Derive data from API response (with fallbacks)
  const stats = data?.stats || [];

  // ── Personalized home-screen widgets ─────────────────────────────────────
  // Scheduled publish jobs, fetched once and shared by both the "Upcoming
  // Uploads" list and the "Posts Scheduled" count — one request, two widgets.
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    httpClient
      .get(ENDPOINTS.PUBLISH.LIST, { params: { status: "scheduled", limit: 50 } })
      .then((res) => { if (!cancelled) setScheduledJobs(res.data || []); })
      .catch(() => { if (!cancelled) setScheduledJobs([]); })
      .finally(() => { if (!cancelled) setJobsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const todaysTasks       = useMemo(() => getTodaysTasks(contents), [contents]);
  const ideasWaiting       = useMemo(() => getIdeasWaiting(contents), [contents]);
  const scriptsPending     = useMemo(() => getScriptsPending(contents), [contents]);
  const thumbnailsPending  = useMemo(() => getThumbnailsPending(contents), [contents]);
  const publishedThisMonth = useMemo(() => getPublishedThisMonth(contents), [contents]);
  const upcomingUploads    = useMemo(() => getUpcomingJobs(scheduledJobs), [scheduledJobs]);

  const goToContent = (it) => router.push(`/add-content?edit=${it.id}`);
  const contentLoading = contentsLoading || jobsLoading;

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
                <div className={`w-1.5 h-1.5 rounded-full ${todaysTasks.length > 0 ? "bg-amber-500" : "bg-[#10B981]"}`} />
                <p className="text-[11px] font-[700] text-[#6B7280] uppercase tracking-wider">
                  {todaysTasks.length > 0
                    ? `${todaysTasks.length} task${todaysTasks.length > 1 ? "s" : ""} due today`
                    : "You're all caught up today"}
                </p>
              </div>
              <LiveIndicator lastUpdated={lastUpdated} error={error} connectedCount={data?.connectedCount || 0} onReconnect={refetch} />
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
                    <div className="flex items-center mb-4">
                      <div
                        className="flex items-center justify-center"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', background: statColor.bg }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: statColor.color }} />
                      </div>
                    </div>
                    <p className="text-sm text-[#4B5264] mb-1 font-medium">{stat.name}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-[28px] font-bold tracking-tight text-[#0A0A0F] leading-none">{stat.value ?? "—"}</p>
                    </div>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* ═══ YOUR DAY ═══ — personalized home screen, driven by real Content/PublishJob data */}
        <section className="space-y-5 mt-6">
          <div>
            <h3 className="text-[24px] font-[800] text-[#0A0A0F] tracking-tight">Your Day</h3>
            <p className="text-[13px] text-[#6B7280] font-[400]">Everything that needs your attention, in one place</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {contentLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <WidgetSkeleton key={i} />)
            ) : (
              <>
                <DashboardWidget
                  icon={ListTodo}
                  iconColor="#EF4444"
                  iconBg="rgba(239,68,68,0.10)"
                  title="Today's Tasks"
                  count={todaysTasks.length}
                  items={todaysTasks.slice(0, 3)}
                  getItemLabel={(c) => c.title}
                  getItemSublabel={(c) => new Date(c.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  emptyLabel="Nothing due today — you're on track."
                  viewAllHref="/all-content"
                  onItemClick={goToContent}
                />
                <DashboardWidget
                  icon={UploadCloud}
                  iconColor="#6366F1"
                  iconBg="rgba(99,102,241,0.10)"
                  title="Upcoming Uploads"
                  count={upcomingUploads.length}
                  items={upcomingUploads.slice(0, 3)}
                  getItemId={(j) => j.id || j._id}
                  getItemLabel={(j) => j.title}
                  getItemSublabel={(j) => formatDistanceToNow(new Date(j.scheduledAt), { addSuffix: true })}
                  emptyLabel="No uploads scheduled yet."
                  viewAllHref="/scheduler"
                  onItemClick={() => router.push("/scheduler")}
                />
                <DashboardWidget
                  icon={Lightbulb}
                  iconColor="#8B5CF6"
                  iconBg="rgba(139,92,246,0.10)"
                  title="Ideas Waiting"
                  count={ideasWaiting.length}
                  items={ideasWaiting.slice(0, 3)}
                  getItemLabel={(c) => c.title}
                  emptyLabel="No untouched ideas in your backlog."
                  viewAllHref="/all-content"
                  onItemClick={goToContent}
                />
                <DashboardWidget
                  icon={FileEdit}
                  iconColor="#F59E0B"
                  iconBg="rgba(245,158,11,0.10)"
                  title="Scripts Pending"
                  count={scriptsPending.length}
                  items={scriptsPending.slice(0, 3)}
                  getItemLabel={(c) => c.title}
                  emptyLabel="Every started piece has a script."
                  viewAllHref="/all-content"
                  onItemClick={goToContent}
                />
                <DashboardWidget
                  icon={ImageIcon}
                  iconColor="#EC4899"
                  iconBg="rgba(236,72,153,0.10)"
                  title="Thumbnails Pending"
                  count={thumbnailsPending.length}
                  items={thumbnailsPending.slice(0, 3)}
                  getItemLabel={(c) => c.title}
                  emptyLabel="Every scripted piece has a thumbnail."
                  viewAllHref="/all-content"
                  onItemClick={goToContent}
                />
                <DashboardWidget
                  icon={CalendarCheck}
                  iconColor="#10B981"
                  iconBg="rgba(16,185,129,0.10)"
                  title="Posts Scheduled"
                  count={scheduledJobs.length}
                  items={[]}
                  emptyLabel="Total jobs queued in the Scheduler."
                  viewAllHref="/scheduler"
                />
                <GoalsWidget publishedThisMonth={publishedThisMonth} />
                <RevenueWidget />
                <PlatformStatusWidget />
                <RecentActivityWidget />
              </>
            )}
          </div>
        </section>
      </motion.div>
  );
}
