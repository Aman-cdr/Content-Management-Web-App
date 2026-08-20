"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  Camera,
  Music,
  Bird as TwitterIcon,
  Calendar as CalendarIcon,
  Clock,
  Layout,
  ExternalLink,
  X,
  ChevronDown,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useContent } from "@/context/ContentContext";
import httpClient from "@/lib/api";
import { ENDPOINTS } from "@/config/endpoints";

// ---------- Constants ----------

const PLATFORMS = {
  YouTube: { name: "YouTube", color: "#FF0000", icon: Video },
  Instagram: { name: "Instagram", color: "#E1306C", icon: Camera },
  TikTok: { name: "TikTok", color: "#000000", icon: Music, textColor: "#FFFFFF" },
  Twitter: { name: "Twitter", color: "#1DA1F2", icon: TwitterIcon }
};

// Maps backend publish-job platform slugs → display name
const PLATFORM_SLUG_MAP = {
  youtube: "YouTube",
  youtube_shorts: "YouTube",
  instagram_reels: "Instagram",
  tiktok: "TikTok",
};

function resolveDisplayPlatform(platforms) {
  if (!platforms || platforms.length === 0) return "YouTube";
  const slug = platforms[0];
  return PLATFORM_SLUG_MAP[slug] || slug;
}

// Maps publish job status → display status
function resolveJobStatus(status) {
  switch (status) {
    case "published": return "Published";
    case "scheduled": return "Scheduled";
    case "publishing": return "Publishing";
    case "failed": return "Failed";
    case "cancelled": return "Cancelled";
    case "draft": return "Draft";
    default: return "Scheduled";
  }
}

// Removed INITIAL_POSTS in favor of database integration

// ---------- Components ----------

function PlatformIcon({ platform, size = 16 }) {
  const Icon = PLATFORMS[platform]?.icon || Layout;
  return <Icon size={size} style={{ color: PLATFORMS[platform]?.color }} />;
}

function StatusBadge({ status }) {
  const styles = {
    Published:  "bg-[#10B981]/10 text-[#10B981]",
    Scheduled:  "bg-[#6366F1]/10 text-[#6366F1]",
    Draft:      "bg-[#F59E0B]/10 text-[#F59E0B]",
    Publishing: "bg-blue-500/10 text-blue-600",
    Failed:     "bg-red-500/10 text-red-600",
    Cancelled:  "bg-neutral-400/10 text-neutral-500",
  };
  return (
    <span className={`text-[10px] font-[700] uppercase tracking-widest px-2.5 py-0.5 rounded-full ${styles[status] || styles.Draft}`}>
      {status}
    </span>
  );
}


export default function SchedulerPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { contents } = useContent();

  // ── Publish jobs (real scheduled/published events) ──
  const [publishJobs, setPublishJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const fetchPublishJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      const res = await httpClient.get(ENDPOINTS.PUBLISH.LIST, { params: { limit: 100 } });
      setPublishJobs(res.data?.data || []);
    } catch {
      // Non-fatal — page still works from ContentContext
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishJobs(); }, [fetchPublishJobs]);

  // Map publish jobs to post objects
  const jobPosts = useMemo(() => {
    return publishJobs.map(job => {
      const scheduledAt = job.scheduledAt ? new Date(job.scheduledAt) : new Date();
      return {
        id: `job-${job._id}`,
        jobId: job._id,
        contentId: job.contentId || null,
        title: job.title || "Untitled",
        platform: resolveDisplayPlatform(job.platforms),
        date: scheduledAt,
        time: format(scheduledAt, "HH:mm"),
        status: resolveJobStatus(job.status),
        description: job.description || "",
        isPublishJob: true,
        platformResults: job.platformResults || [],
        liveUrls: (job.platformResults || []).filter(r => r.liveUrl).map(r => r.liveUrl),
      };
    });
  }, [publishJobs]);

  // Map content items — only include those with a scheduledDate set
  const contentPosts = useMemo(() => {
    // IDs of content items already represented by a publish job
    const coveredContentIds = new Set(publishJobs.map(j => j.contentId).filter(Boolean));

    return contents
      .filter(c => c.scheduledDate && !coveredContentIds.has(c._id || c.id))
      .map(c => {
        let platform = "YouTube";
        if (c.platforms && c.platforms.length > 0) {
          if (c.platforms.some(p => p.toLowerCase().includes("instagram"))) platform = "Instagram";
          else if (c.platforms.some(p => p.toLowerCase().includes("tiktok"))) platform = "TikTok";
          else if (c.platforms.some(p => p.toLowerCase().includes("twitter"))) platform = "Twitter";
          else platform = "YouTube";
        }
        let status = "Draft";
        if (c.status === "published") status = "Published";
        else if (c.status === "scheduled" || c.status === "Scheduled") status = "Scheduled";

        const date = new Date(c.scheduledDate);
        const time = c.scheduledTime || format(date, "HH:mm");

        return {
          id: c.id || c._id,
          contentId: c.id || c._id,
          title: c.title || "Untitled",
          platform,
          date,
          time,
          status,
          description: c.description || "",
          isPublishJob: false,
        };
      });
  }, [contents, publishJobs]);

  // Merged: publish jobs take priority, content items fill the gaps
  const posts = useMemo(() => [...jobPosts, ...contentPosts], [jobPosts, contentPosts]);
  const [filter, setFilter] = useState("All");
  const [criticalDismissed, setCriticalDismissed] = useState(false);
  const [bottleneckDismissed, setBottleneckDismissed] = useState(false);
  const [productionExpanded, setProductionExpanded] = useState(false);

  const now = new Date();
  const in72h = addDays(now, 3);
  const in7d = addDays(now, 7);

  const criticalItems = useMemo(() => {
    return posts.filter(p => {
      const isDraft = p.status === "Draft" || p.status === "draft";
      return isDraft && p.date >= now && p.date < in72h;
    });
  }, [posts]);

  const bottleneckItems = useMemo(() => {
    return posts.filter(p => {
      const isDraft = p.status === "Draft" || p.status === "draft";
      return isDraft && p.date >= now && p.date < in7d;
    });
  }, [posts]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredPosts = useMemo(() => {
    return posts.filter(p => filter === "All" || p.platform === filter);
  }, [posts, filter]);

  const upcomingPosts = useMemo(() => {
    return [...posts]
      .filter(p => p.date >= new Date())
      .sort((a, b) => a.date - b.date)
      .slice(0, 7);
  }, [posts]);

  const selectedDayPosts = useMemo(() => {
    return posts.filter(p => isSameDay(p.date, selectedDate));
  }, [posts, selectedDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-[3px] h-8 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-full" />
            <h2 className="text-[32px] font-medium text-[#0F0F0F] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Scheduler</h2>
          </div>
          <p className="text-neutral-500 text-[14px] font-normal mt-0.5">
            Plan and schedule your content pipeline
            {!jobsLoading && publishJobs.length > 0 && (
              <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                {publishJobs.length} publish job{publishJobs.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPublishJobs}
            title="Refresh publish jobs"
            className="p-3 bg-white border border-[#E5E7EB] rounded-full text-neutral-500 hover:bg-[#F9FAFB] transition-colors duration-300"
          >
            <RefreshCw className={`w-5 h-5 ${jobsLoading ? "animate-spin" : ""}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => router.push("/add-content")}
            className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white px-6 py-3.5 rounded-full text-[14px] font-semibold transition-all duration-300 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.4)] hover:brightness-110 active:scale-[0.98] flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={1.75} />
            New Post
          </button>
        </div>
      </div>

      {/* Warning Banners */}
      <AnimatePresence>
        {criticalItems.length > 0 && !criticalDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3"
          >
            <span className="text-red-500 text-lg leading-none mt-0.5">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">
                {criticalItems.length} piece{criticalItems.length > 1 ? "s" : ""} scheduled in the next 72 hours {criticalItems.length > 1 ? "are" : "is"} still in Draft — review now
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {criticalItems.map(item => (
                  <li key={item.id} className="text-[11px] font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setCriticalDismissed(true)} className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors duration-300 text-red-400">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bottleneckItems.length > 0 && criticalItems.length === 0 && !bottleneckDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3"
          >
            <span className="text-amber-500 text-lg leading-none mt-0.5">ℹ️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-700">
                {bottleneckItems.length} Draft piece{bottleneckItems.length > 1 ? "s" : ""} scheduled this week — make sure they&apos;re ready before publish time
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {bottleneckItems.map(item => (
                  <li key={item.id} className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setBottleneckDismissed(true)} className="shrink-0 p-1 hover:bg-amber-100 rounded-full transition-colors duration-300 text-amber-400">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Section 1: Calendar View */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FFFFFF]/80 backdrop-blur-xl border border-[#E5E7EB] p-3 rounded-[1.75rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-4">
              <h3 className="text-[18px] font-semibold min-w-[150px] text-[#0F0F0F]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{format(currentDate, "MMMM yyyy")}</h3>
              <div className="flex gap-1.5">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors duration-300 text-[#6B7280] border border-[#E5E7EB]">
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors duration-300 text-[#6B7280] border border-[#E5E7EB]">
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full">
              {["All", ...Object.keys(PLATFORMS)].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-300 ${
                    filter === tab
                    ? "bg-[#FFFFFF] text-[#0F0F0F] shadow-sm border border-[#E5E7EB]"
                    : "text-[#6B7280] hover:text-[#0F0F0F]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[1.75rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">
            <div className="grid grid-cols-7 gap-px bg-[#E5E7EB]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="bg-[#FAFAFA] py-4 text-center text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                const dayPosts = filteredPosts.filter(p => isSameDay(p.date, day));
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[90px] bg-white p-2 transition-all cursor-pointer hover:bg-[#F9FAFB] relative group ${
                      !isCurrentMonth ? "bg-neutral-50/30 opacity-40" : ""
                    } ${isSelected ? "ring-2 ring-[#6366F1] ring-inset z-10" : ""} ${isToday(day) ? "bg-[#6366F1]/[0.02]" : ""}`}
                  >
                    <span className={`text-xs font-bold ${isToday(day) ? "text-purple-600 bg-purple-100/50 px-2 py-1 rounded-full" : "text-[#374151]"}`}>
                      {format(day, "d")}
                    </span>

                    <div className="mt-2 space-y-1">
                      {dayPosts.slice(0, 3).map(post => (
                        <div
                          key={post.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#F9FAFB] border border-black/[0.04]"
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: PLATFORMS[post.platform]?.color }} 
                          />
                          <span className="text-[10px] font-bold text-[#374151] truncate max-w-[80%]">
                            {post.title.length > 12 ? post.title.substring(0, 12) + "..." : post.title}
                          </span>
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-[9px] font-black text-neutral-500 px-2 uppercase tracking-tighter">
                          + {dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Day Detail Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col h-full lg:h-[600px]"
        >
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[1.75rem] p-8 flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="mb-8">
              <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-[0.2em] mb-2">Schedule for</p>
              <h3 className="text-[26px] font-medium text-[#0F0F0F] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{format(selectedDate, "EEEE, MMM do")}</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
              {selectedDayPosts.length > 0 ? (
                selectedDayPosts.map(post => (
                  <motion.div
                    key={post.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-5 rounded-[1.5rem] border transition-all relative overflow-hidden group shadow-sm hover:shadow-md ${
                      post.isPublishJob
                        ? "bg-indigo-50/40 border-indigo-100 hover:border-indigo-300"
                        : "bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#6366F1]/[0.3]"
                    }`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <PlatformIcon platform={post.platform} size={40} />
                    </div>

                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <PlatformIcon platform={post.platform} />
                      <StatusBadge status={post.status} />
                      {post.isPublishJob && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Send className="w-2.5 h-2.5" /> Publish Job
                        </span>
                      )}
                      {(post.status === "Draft") && post.date < in7d && post.date >= now && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                          ⚠️ Draft
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-[#374151] mb-3 line-clamp-2">{post.title}</h4>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-neutral-400" />
                        {post.time}
                      </div>
                    </div>

                    {/* Per-platform results for publish jobs */}
                    {post.isPublishJob && post.platformResults && post.platformResults.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-indigo-100 space-y-1.5">
                        {post.platformResults.map((pr, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-neutral-500 uppercase tracking-widest">{pr.platform.replace("_", " ")}</span>
                            <div className="flex items-center gap-2">
                              {pr.status === "published" ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  {pr.liveUrl && (
                                    <a href={pr.liveUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-0.5">
                                      View <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </>
                              ) : pr.status === "failed" ? (
                                <AlertCircle className="w-3 h-3 text-red-500" />
                              ) : (
                                <span className="text-neutral-400 capitalize">{pr.status}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                    <CalendarIcon className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-neutral-500 mb-1">No content scheduled</p>
                  <p className="text-xs text-neutral-500 max-w-[200px]">Click the button below to add something to this day.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/add-content")}
              className="mt-8 w-full py-4 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#E5E7EB] transition-colors duration-300 text-[13px] font-semibold uppercase tracking-widest text-[#374151]"
            >
              Add to this day
            </button>
          </div>
        </motion.div>
      </div>

      {/* Production Timeline Reference Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[1.75rem] shadow-[0_4px_16px_rgb(0,0,0,0.04)] overflow-hidden">
        <button
          onClick={() => setProductionExpanded(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F9FAFB] transition-colors duration-300"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#6366F1]" strokeWidth={1.5} />
            <span className="text-sm font-bold text-[#374151]">Production Timeline Reference</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${productionExpanded ? "rotate-180" : ""}`} strokeWidth={1.5} />
        </button>
        <AnimatePresence>
          {productionExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
                  {[
                    { label: "Idea", time: null },
                    { label: "Script", time: "1–2d" },
                    { label: "Record", time: "1d" },
                    { label: "Edit", time: "1–2d" },
                    { label: "Thumbnail", time: "0.5d" },
                    { label: "Upload", time: null },
                    { label: "Publish", time: null },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-[#6366F1]/10 border-2 border-[#6366F1]/30 flex items-center justify-center">
                          <span className="text-[9px] font-black text-[#6366F1]">{i + 1}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#374151] whitespace-nowrap">{step.label}</span>
                        {step.time && (
                          <span className="text-[9px] text-neutral-400 font-semibold">{step.time}</span>
                        )}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-8 h-[2px] bg-gradient-to-r from-[#6366F1]/30 to-[#8B5CF6]/30 mx-1 shrink-0 mb-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section 3: Upcoming Queue */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-emerald-500/10">
            <Layout className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Upcoming Queue</h3>
        </div>

        {upcomingPosts.length === 0 ? (
          <div className="flex items-center justify-center py-16 bg-white border border-[#E5E7EB] rounded-[1.75rem] text-neutral-400">
            <div className="text-center">
              <Layout className="w-8 h-8 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
              <p className="text-sm font-bold">No upcoming scheduled content</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {upcomingPosts.map(post => (
              <motion.div
                key={post.id}
                whileHover={{ y: -5 }}
                className={`min-w-[300px] card p-6 group cursor-pointer shadow-sm ${
                  post.isPublishJob ? "bg-indigo-50/60 border-indigo-100" : "bg-white border-black/[0.06]"
                }`}
              >
                <div className="h-40 w-full rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 mb-4 overflow-hidden relative border border-black/[0.04]">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform duration-700">
                    <PlatformIcon platform={post.platform} size={60} />
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <StatusBadge status={post.status} />
                    {post.isPublishJob && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-white/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Send className="w-2.5 h-2.5" /> Job
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <PlatformIcon platform={post.platform} size={14} />
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    {format(new Date(post.date), "MMM d")} • {post.time}
                  </p>
                </div>
                <h4 className="font-bold text-[#374151] line-clamp-1">{post.title}</h4>
                {post.isPublishJob && post.liveUrls && post.liveUrls.length > 0 && (
                  <a
                    href={post.liveUrls[0]}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-indigo-500 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> View Live
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
